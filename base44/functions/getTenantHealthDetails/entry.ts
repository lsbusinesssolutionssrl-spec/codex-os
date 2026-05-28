import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !['admin', 'developer'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { tenantId } = await req.json().catch(() => ({}));

    if (!tenantId) {
      return Response.json({ error: 'tenantId required' }, { status: 400 });
    }

    // Load tenant data
    const tenant = await base44.asServiceRole.entities.Company.get(tenantId);
    if (!tenant) {
      return Response.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Load related data
    const subscription = await base44.asServiceRole.entities.CompanySubscription.filter(
      { company_id: tenantId, status: 'active' },
      '-created_date',
      1
    ).then(s => s[0] || null);

    const plan = subscription?.plan_id 
      ? await base44.asServiceRole.entities.SubscriptionPlan.get(subscription.plan_id)
      : null;

    const memberships = await base44.asServiceRole.entities.TenantMembership.filter(
      { tenant_id: tenantId, status: 'active' }
    );

    const customerMembers = memberships.filter(m => m.membership_type === 'customer_member');
    const tenantAdmins = customerMembers.filter(m => m.tenant_role === 'tenant_admin');
    const internalSupport = memberships.filter(m => m.membership_type === 'internal_support');

    const featureFlags = await base44.asServiceRole.entities.TenantFeatureFlag.filter(
      { company_id: tenantId, enabled: true }
    );

    // Health checks
    const checks = {
      tenant_active: tenant.status === 'active' && !tenant.archived,
      subscription_active: !!subscription && subscription.status === 'active',
      plan_assigned: !!plan,
      tenant_admin_exists: tenantAdmins.length > 0,
      customer_members_count: customerMembers.length,
      internal_support_count: internalSupport.length,
      modules_enabled: featureFlags.length,
      onboarding_complete: !!(tenant.logo_url && tenant.brand_color_primary && tenant.settings),
      billing_configured: !!subscription?.stripe_subscription_id || subscription?.status === 'trial',
      not_demo: tenant.tenant_type !== 'demo' && !tenant.demo_mode,
      not_internal: tenant.tenant_type !== 'internal',
      not_archived: !tenant.archived,
    };

    // Calculate health score and status
    let score = 0;
    const failedChecks = [];
    const warnings = [];

    // Critical checks (40 points each)
    if (checks.tenant_active) score += 40;
    else failedChecks.push('Tenant non attivo o archiviato');

    if (checks.subscription_active || subscription?.status === 'trial') score += 30;
    else failedChecks.push('Nessuna subscription attiva');

    if (checks.tenant_admin_exists) score += 30;
    else failedChecks.push('Nessun tenant admin trovato');

    // Important checks (warnings, not critical)
    if (!checks.plan_assigned) warnings.push('Piano non assegnato');
    if (!checks.onboarding_complete) warnings.push('Onboarding incompleto (manca logo/branding/settings)');
    if (!checks.billing_configured) warnings.push('Billing non configurato');
    if (checks.customer_members_count === 0) warnings.push('Nessun customer member attivo');

    // Determine health status
    let healthStatus = 'Inactive';
    let healthReason = '';

    if (!checks.tenant_active || checks.not_archived === false) {
      healthStatus = 'Inactive';
      healthReason = tenant.archived ? 'Archiviato' : 'Disabilitato';
    } else if (score < 40) {
      healthStatus = 'At Risk';
      healthReason = failedChecks[0] || 'Problemi critici';
    } else if (score < 80 || warnings.length > 0) {
      healthStatus = 'Needs Attention';
      healthReason = warnings[0] || 'Configurazione incompleta';
    } else {
      healthStatus = 'Healthy';
      healthReason = 'Tutto configurato correttamente';
    }

    // Generate recommendations
    const recommendations = [];
    if (!checks.subscription_active) {
      recommendations.push('Assegnare una subscription attiva al tenant');
    }
    if (!checks.plan_assigned && subscription) {
      recommendations.push('Assegnare un piano alla subscription');
    }
    if (!checks.tenant_admin_exists) {
      recommendations.push('Creare o riparare la membership tenant_admin');
    }
    if (!checks.onboarding_complete) {
      recommendations.push('Completare onboarding: logo, branding, settings');
    }
    if (!checks.billing_configured && subscription?.status === 'trial') {
      recommendations.push('Configurare billing per fine trial');
    }

    return Response.json({
      tenant: {
        ...tenant,
        subscription,
        plan,
        customerMembersCount: customerMembers.length,
        internalSupportCount: internalSupport.length,
        tenantAdminsCount: tenantAdmins.length,
      },
      health: {
        status: healthStatus,
        reason: healthReason,
        score,
        failedChecks,
        warnings,
        recommendations,
        checks,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});