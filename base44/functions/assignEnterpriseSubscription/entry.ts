import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !['admin', 'developer'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { tenantId, planId } = await req.json().catch(() => ({}));

    if (!tenantId) {
      return Response.json({ error: 'tenantId required' }, { status: 400 });
    }

    // Get tenant
    const tenant = await base44.asServiceRole.entities.Company.get(tenantId);
    if (!tenant) {
      return Response.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Get plan (default to Enterprise if not specified)
    let plan;
    if (planId) {
      plan = await base44.asServiceRole.entities.SubscriptionPlan.get(planId);
    } else {
      // Find Enterprise plan
      const plans = await base44.asServiceRole.entities.SubscriptionPlan.filter({ name: 'Enterprise', is_active: true });
      plan = plans[0];
    }

    if (!plan) {
      return Response.json({ error: 'Enterprise plan not found' }, { status: 404 });
    }

    // Check if subscription exists
    const existingSubs = await base44.asServiceRole.entities.CompanySubscription.filter({
      company_id: tenantId,
    });

    let subscription;
    if (existingSubs.length > 0) {
      // Update existing subscription
      subscription = existingSubs[0];
      await base44.asServiceRole.entities.CompanySubscription.update(subscription.id, {
        plan_id: plan.id,
        status: 'active',
        billing_cycle: 'monthly',
        mrr: plan.price_monthly,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      });
    } else {
      // Create new subscription
      const newSub = await base44.asServiceRole.entities.CompanySubscription.create({
        company_id: tenantId,
        plan_id: plan.id,
        status: 'active',
        billing_cycle: 'monthly',
        mrr: plan.price_monthly,
        trial_start: new Date().toISOString(),
        trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days trial
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        seats_used: 1,
        storage_used_gb: 0,
      });
      subscription = newSub;
    }

    // Enable Enterprise feature flags
    const enterpriseFeatures = [
      'financial_control',
      'ai_copilot',
      'intelligence',
      'workflows',
      'executive_insights',
      'business_intelligence',
      'team_performance',
      'risk_monitoring',
      'advanced_analytics',
      'api_access',
      'priority_support',
      'white_label',
    ];

    for (const featureName of enterpriseFeatures) {
      const existing = await base44.asServiceRole.entities.TenantFeatureFlag.filter({
        company_id: tenantId,
        feature_name: featureName,
      }).then(f => f[0]);

      if (!existing) {
        await base44.asServiceRole.entities.TenantFeatureFlag.create({
          company_id: tenantId,
          feature_name: featureName,
          enabled: true,
          plan_required: 'enterprise',
        });
      }
    }

    return Response.json({
      success: true,
      subscription: {
        id: subscription.id,
        plan_id: plan.id,
        plan_name: plan.name,
        status: subscription.status,
        billing_cycle: subscription.billing_cycle,
        mrr: subscription.mrr,
      },
      features_enabled: enterpriseFeatures.length,
      message: `Enterprise subscription assigned to ${tenant.name}`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});