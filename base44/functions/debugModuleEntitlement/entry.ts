import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * DEBUG MODULE ENTITLEMENT
 * 
 * Returns detailed information about:
 * - User's tenant membership
 * - Subscription plan
 * - Feature flags
 * - Computed modules
 * - Computed permissions
 * 
 * Used for debugging regression test failures.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[debugModuleEntitlement] User:', user.email, 'role:', user.role);

    // Load tenant membership
    const memberships = await base44.asServiceRole.entities.TenantMembership.filter({
      user_id: user.id,
      status: 'active',
    });

    if (memberships.length === 0) {
      return Response.json({
        error: 'No active tenant membership found',
        user: { id: user.id, email: user.email, role: user.role },
      }, { status: 400 });
    }

    const membership = memberships[0];
    console.log('[debugModuleEntitlement] Membership:', membership.tenant_role, membership.tenant_id);

    // Load tenant company
    const tenant = await base44.entities.Company.get(membership.tenant_id);
    console.log('[debugModuleEntitlement] Tenant:', tenant?.name, tenant?.id);

    // Load subscription
    const subscriptions = await base44.entities.CompanySubscription.filter({
      company_id: membership.tenant_id,
      status: 'active',
    });
    
    const subscription = subscriptions[0] || null;
    console.log('[debugModuleEntitlement] Subscription:', subscription?.plan_id, subscription?.status);

    // Load plan if exists
    let plan = null;
    if (subscription?.plan_id) {
      const plans = await base44.entities.SubscriptionPlan.filter({ id: subscription.plan_id });
      plan = plans[0] || null;
      console.log('[debugModuleEntitlement] Plan:', plan?.name, plan?.quotas);
    }

    // Load feature flags
    const featureFlags = await base44.entities.TenantFeatureFlag.filter({
      company_id: membership.tenant_id,
      enabled: true,
    });
    console.log('[debugModuleEntitlement] Feature flags:', featureFlags.length, featureFlags.map(f => f.feature_name));

    // Compute modules (replicate GlobalContextEngine logic)
    const modules = new Set([
      'projects', 'estimates', 'clients', 'documents', 'properties',
      'checklists', 'tickets', 'calendar', 'report', 'sop',
      'maintenance', 'guardian', 'core'
    ]);

    // Add enterprise modules based on plan/quotas
    const ENTERPRISE_MODULES = [
      'financial_control', 'ai_copilot', 'intelligence', 'workflows',
      'executive_insights', 'business_intelligence', 'team_performance', 'risk_monitoring'
    ];

    if (plan?.quotas) {
      const quotas = plan.quotas;
      console.log('[debugModuleEntitlement] Checking quotas:', quotas);
      
      if (quotas.custom_reports || quotas.financial_control) modules.add('financial_control');
      if (quotas.ai_requests_per_month > 0) modules.add('ai_copilot');
      if (quotas.advanced_analytics || quotas.intelligence) modules.add('intelligence');
      if (quotas.workflow_automation) modules.add('workflows');
      if (quotas.advanced_analytics || quotas.custom_reports) {
        modules.add('executive_insights');
        modules.add('business_intelligence');
      }
      if (quotas.max_users > 5 || quotas.advanced_analytics) modules.add('team_performance');
      if (quotas.advanced_analytics || quotas.guardian_subscriptions > 0) modules.add('risk_monitoring');
    } else if (subscription?.status === 'active' && !subscription?.plan_id) {
      console.log('[debugModuleEntitlement] Active subscription without plan - adding enterprise modules');
      ENTERPRISE_MODULES.forEach(m => modules.add(m));
    }

    // Add feature flags
    featureFlags.forEach(flag => {
      if (flag.enabled && flag.feature_name) {
        modules.add(flag.feature_name);
      }
    });

    const moduleArray = Array.from(modules);
    console.log('[debugModuleEntitlement] Computed modules:', moduleArray.length, moduleArray);

    // Return detailed debug info
    return Response.json({
      success: true,
      debug: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        membership: {
          id: membership.id,
          tenant_id: membership.tenant_id,
          tenant_role: membership.tenant_role,
          status: membership.status,
          is_primary: membership.is_primary,
        },
        tenant: {
          id: tenant?.id,
          name: tenant?.name,
          slug: tenant?.slug,
        },
        subscription: {
          id: subscription?.id,
          plan_id: subscription?.plan_id,
          status: subscription?.status,
          billing_cycle: subscription?.billing_cycle,
        },
        plan: {
          id: plan?.id,
          name: plan?.name,
          quotas: plan?.quotas,
          features: plan?.features,
        },
        feature_flags: {
          count: featureFlags.length,
          enabled: featureFlags.map(f => ({ name: f.feature_name, enabled: f.enabled })),
        },
        modules: {
          count: moduleArray.length,
          list: moduleArray,
        },
        expected: {
          modules: '>= 21',
          permissions: '>= 80',
        },
      },
    });
  } catch (error) {
    console.error('[debugModuleEntitlement] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});