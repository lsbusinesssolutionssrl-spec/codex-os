import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * TENANT PROVISIONING - ATOMIC CREATION
 * 
 * Creates a complete tenant with all required components:
 * 1. Tenant (Company entity)
 * 2. Admin user membership
 * 3. Company settings
 * 4. Feature flags
 * 5. Subscription plan
 * 
 * All steps are atomic - if one fails, everything rolls back.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is platform admin
    if (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'developer') {
      return Response.json({ error: 'Forbidden: Platform admin required' }, { status: 403 });
    }

    const payload = await req.json();
    const {
      tenantName,
      tenantSlug,
      adminEmail,
      adminUserId,
      planId,
    } = payload;

    console.log('[provisionTenantComplete] Starting atomic provisioning for:', tenantName);

    const createdEntities = {
      tenant: null,
      membership: null,
      subscription: null,
      featureFlags: [],
    };

    try {
      // STEP 1: Create Tenant (Company)
      console.log('[provisionTenantComplete] Step 1: Creating tenant...');
      const tenant = await base44.asServiceRole.entities.Company.create({
        name: tenantName,
        slug: tenantSlug,
        email: adminEmail,
        status: 'active',
        settings: {
          currency: 'EUR',
          language: 'it',
          timezone: 'Europe/Rome',
          date_format: 'DD/MM/YYYY',
          fiscal_year_start: '01/01',
          tenant_admin_email: adminEmail,
        },
        demo_mode: false,
      });
      createdEntities.tenant = tenant;
      console.log('[provisionTenantComplete] Tenant created:', tenant.id);

      // STEP 2: Create Admin User Membership
      console.log('[provisionTenantComplete] Step 2: Creating admin membership...');
      const membership = await base44.asServiceRole.entities.TenantMembership.create({
        user_id: adminUserId || user.id,
        tenant_id: tenant.id,
        tenant_role: 'tenant_admin',
        status: 'active',
        is_primary: true,
        invited_by: user.email,
        invited_at: new Date().toISOString(),
        joined_at: new Date().toISOString(),
        permissions: {
          can_create_projects: true,
          can_create_estimates: true,
          can_view_financials: true,
          can_manage_team: true,
          can_access_api: true,
        },
        default_workspace: 'executive',
        language: 'it',
        notes: 'Created during atomic tenant provisioning',
      });
      createdEntities.membership = membership;
      console.log('[provisionTenantComplete] Membership created:', membership.id);

      // STEP 3: Create Subscription (if planId provided)
      if (planId) {
        console.log('[provisionTenantComplete] Step 3: Creating subscription...');
        const subscription = await base44.asServiceRole.entities.CompanySubscription.create({
          company_id: tenant.id,
          plan_id: planId,
          status: 'active',
          billing_cycle: 'monthly',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          seats_used: 1,
          storage_used_gb: 0,
        });
        createdEntities.subscription = subscription;
        console.log('[provisionTenantComplete] Subscription created:', subscription.id);
      }

      // STEP 4: Create Enterprise Feature Flags
      console.log('[provisionTenantComplete] Step 4: Creating feature flags...');
      const enterpriseFeatures = [
        'ai_estimator',
        'financial_control',
        'guardian',
        'workflow_automation',
        'predictive_intelligence',
        'api_access',
        'advanced_analytics',
        'custom_integrations',
        'priority_support',
      ];

      for (const feature of enterpriseFeatures) {
        const flag = await base44.asServiceRole.entities.TenantFeatureFlag.create({
          company_id: tenant.id,
          feature_name: feature,
          enabled: true,
          plan_required: 'enterprise',
          notes: 'Auto-enabled during provisioning',
        });
        createdEntities.featureFlags.push(flag);
      }
      console.log('[provisionTenantComplete] Feature flags created:', createdEntities.featureFlags.length);

      // STEP 5: Log provisioning event
      await base44.asServiceRole.entities.TenantActivationLog.create({
        company_id: tenant.id,
        event_type: 'tenant_created',
        description: `Tenant ${tenantName} provisioned with complete setup`,
        performed_by: user.email,
        metadata: {
          admin_email: adminEmail,
          admin_user_id: adminUserId || user.id,
          plan_id: planId,
          feature_flags_count: createdEntities.featureFlags.length,
        },
      });

      console.log('[provisionTenantComplete] Provisioning complete!');

      return Response.json({
        success: true,
        message: 'Tenant provisioned successfully',
        tenant: {
          id: createdEntities.tenant.id,
          name: createdEntities.tenant.name,
          slug: createdEntities.tenant.slug,
        },
        membership: {
          id: createdEntities.membership.id,
          user_id: createdEntities.membership.user_id,
          tenant_role: createdEntities.membership.tenant_role,
          status: createdEntities.membership.status,
        },
        subscription: createdEntities.subscription ? {
          id: createdEntities.subscription.id,
          plan_id: createdEntities.subscription.plan_id,
          status: createdEntities.subscription.status,
        } : null,
        featureFlagsCount: createdEntities.featureFlags.length,
      });

    } catch (error) {
      // ROLLBACK: If any step fails, clean up created entities
      console.error('[provisionTenantComplete] Error during provisioning, rolling back...', error);
      
      const rollbackLog = [];

      if (createdEntities.subscription) {
        try {
          await base44.asServiceRole.entities.CompanySubscription.delete(createdEntities.subscription.id);
          rollbackLog.push('subscription deleted');
        } catch (e) {
          rollbackLog.push('subscription rollback failed: ' + e.message);
        }
      }

      if (createdEntities.membership) {
        try {
          await base44.asServiceRole.entities.TenantMembership.delete(createdEntities.membership.id);
          rollbackLog.push('membership deleted');
        } catch (e) {
          rollbackLog.push('membership rollback failed: ' + e.message);
        }
      }

      if (createdEntities.featureFlags.length > 0) {
        for (const flag of createdEntities.featureFlags) {
          try {
            await base44.asServiceRole.entities.TenantFeatureFlag.delete(flag.id);
          } catch (e) {
            rollbackLog.push(`feature_flag ${flag.id} rollback failed: ${e.message}`);
          }
        }
        rollbackLog.push('feature_flags deleted');
      }

      if (createdEntities.tenant) {
        try {
          await base44.asServiceRole.entities.Company.delete(createdEntities.tenant.id);
          rollbackLog.push('tenant deleted');
        } catch (e) {
          rollbackLog.push('tenant rollback failed: ' + e.message);
        }
      }

      console.error('[provisionTenantComplete] Rollback completed:', rollbackLog);

      return Response.json({
        success: false,
        error: 'Provisioning failed: ' + error.message,
        rollback_performed: true,
        rollback_log: rollbackLog,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[provisionTenantComplete] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});