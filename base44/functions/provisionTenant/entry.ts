import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only platform admins can provision tenants
    if (!user || !['admin', 'developer'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { 
      action,
      tenant_id,
      admin_email,
      admin_password,
      admin_full_name,
      company_name,
      company_slug,
      company_email,
      plan_id,
      modules,
    } = await req.json();

    if (!action) {
      return Response.json({ error: 'Missing action' }, { status: 400 });
    }

    let result = {};

    switch (action) {
      case 'provision_new_tenant': {
        // Complete atomic tenant provisioning
        const required = ['admin_email', 'company_name', 'company_slug', 'company_email'];
        for (const field of required) {
          if (!arguments[0][field]) {
            return Response.json({ error: `Missing field: ${field}` }, { status: 400 });
          }
        }

        // Step 1: Create Tenant (Company)
        const company = await base44.entities.Company.create({
          name: company_name,
          slug: company_slug,
          email: company_email,
          status: 'active',
          brand_color_primary: '#1147FF',
          brand_color_secondary: '#0B2341',
          settings: {
            currency: 'EUR',
            language: 'it',
            timezone: 'Europe/Rome',
            date_format: 'DD/MM/YYYY',
            fiscal_year_start: '01/01',
            demo_mode: false,
          },
        });

        // Step 2: Create or link Admin User
        let adminUser;
        const existingUsers = await base44.entities.User.filter({ email: admin_email });
        
        if (existingUsers.length > 0) {
          // Link existing user
          adminUser = existingUsers[0];
          await base44.entities.User.update(adminUser.id, {
            company_id: company.id,
            role: 'admin',
          });
        } else {
          // Create new user (invite)
          const inviteResult = await base44.users.inviteUser(admin_email, 'admin');
          adminUser = { id: inviteResult.user_id, email: admin_email };
          await base44.entities.User.update(adminUser.id, {
            company_id: company.id,
            full_name: admin_full_name || admin_email.split('@')[0],
          });
        }

        // Step 3: Create TenantMembership (CRITICAL - this was missing)
        const membership = await base44.entities.TenantMembership.create({
          user_id: adminUser.id,
          tenant_id: company.id,
          tenant_role: 'tenant_admin',
          status: 'active',
          invited_by: user.email,
          invited_at: new Date().toISOString(),
          joined_at: new Date().toISOString(),
          is_primary: true,
          default_workspace: 'executive',
          permissions: {
            can_create_projects: true,
            can_create_estimates: true,
            can_view_financials: true,
            can_manage_team: true,
            can_access_api: true,
          },
        });

        // Step 4: Create Company Settings
        const companySettings = await base44.entities.Company.create({
          name: company_name,
          slug: company_slug,
          email: company_email,
          status: 'active',
        });

        // Step 5: Create Subscription (if plan specified)
        let subscription = null;
        if (plan_id) {
          subscription = await base44.entities.CompanySubscription.create({
            company_id: company.id,
            plan_id,
            status: 'trial',
            billing_cycle: 'monthly',
            trial_start: new Date().toISOString(),
            trial_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          });
        }

        // Step 6: Enable Default Modules
        const defaultModules = modules || ['core', 'financial_control', 'ai_copilot', 'intelligence'];
        const featureFlags = [];
        for (const moduleName of defaultModules) {
          const flag = await base44.entities.TenantFeatureFlag.create({
            company_id: company.id,
            feature_name: moduleName,
            enabled: true,
            plan_required: 'professional',
          });
          featureFlags.push(flag);
        }

        // Step 7: Create Onboarding State
        const onboarding = await base44.entities.TenantActivationLog.create({
          company_id: company.id,
          event_type: 'tenant_created',
          description: `Tenant ${company_name} provisioned with admin ${admin_email}`,
          performed_by: user.email,
          metadata: {
            admin_user_id: adminUser.id,
            membership_id: membership.id,
            subscription_id: subscription?.id,
            modules_enabled: defaultModules,
          },
        });

        // Step 8: Create Brand Theme (default)
        const brandTheme = await base44.entities.BrandTheme.create({
          company_id: company.id,
          theme_name: 'Default Brand',
          status: 'Active',
          tier: 'professional',
          is_active: true,
          colors: {
            primary: '#1147FF',
            secondary: '#0B2341',
            accent: '#F58020',
          },
        });

        // Step 9: Log provisioning
        await base44.entities.TenantActivationLog.create({
          company_id: company.id,
          event_type: 'tenant_activated',
          description: 'Tenant provisioning completed successfully',
          performed_by: user.email,
          metadata: {
            tenant_id: company.id,
            admin_id: adminUser.id,
            membership_id: membership.id,
          },
        });

        result = {
          success: true,
          tenant_id: company.id,
          admin_user_id: adminUser.id,
          membership_id: membership.id,
          subscription_id: subscription?.id,
          feature_flags: featureFlags.length,
          modules_enabled: defaultModules,
        };
        break;
      }

      case 'repair_existing_tenant': {
        // Repair broken tenant (like LS Business Solutions)
        if (!tenant_id || !admin_email) {
          return Response.json({ error: 'Missing tenant_id or admin_email' }, { status: 400 });
        }

        const company = await base44.entities.Company.get(tenant_id);
        if (!company) {
          return Response.json({ error: 'Tenant not found' }, { status: 404 });
        }

        // Find or create admin user
        let adminUser;
        const existingUsers = await base44.entities.User.filter({ email: admin_email });
        
        if (existingUsers.length > 0) {
          adminUser = existingUsers[0];
        } else {
          return Response.json({ error: 'Admin user not found. Create user first.', admin_email }, { status: 404 });
        }

        // Check if membership exists
        const existingMemberships = await base44.entities.TenantMembership.filter({
          user_id: adminUser.id,
          tenant_id,
        });

        if (existingMemberships.length === 0) {
          // CREATE MISSING MEMBERSHIP (this fixes the current issue)
          const membership = await base44.entities.TenantMembership.create({
            user_id: adminUser.id,
            tenant_id,
            tenant_role: 'tenant_admin',
            status: 'active',
            invited_by: user.email,
            invited_at: new Date().toISOString(),
            joined_at: new Date().toISOString(),
            is_primary: true,
            default_workspace: 'executive',
            permissions: {
              can_create_projects: true,
              can_create_estimates: true,
              can_view_financials: true,
              can_manage_team: true,
              can_access_api: true,
            },
          });

          // Update user company_id (compatibility)
          await base44.entities.User.update(adminUser.id, {
            company_id: tenant_id,
            role: 'admin',
          });

          result = {
            success: true,
            action: 'created_missing_membership',
            membership_id: membership.id,
            tenant_id,
            admin_user_id: adminUser.id,
          };
        } else {
          // Membership exists, ensure it's active and primary
          const membership = existingMemberships[0];
          await base44.entities.TenantMembership.update(membership.id, {
            status: 'active',
            is_primary: true,
            tenant_role: membership.tenant_role || 'tenant_admin',
          });

          result = {
            success: true,
            action: 'activated_existing_membership',
            membership_id: membership.id,
          };
        }

        // Ensure feature flags exist
        const defaultModules = ['core', 'financial_control', 'ai_copilot', 'intelligence'];
        for (const moduleName of defaultModules) {
          const existing = await base44.entities.TenantFeatureFlag.filter({
            company_id: tenant_id,
            feature_name: moduleName,
          });
          
          if (existing.length === 0) {
            await base44.entities.TenantFeatureFlag.create({
              company_id: tenant_id,
              feature_name: moduleName,
              enabled: true,
              plan_required: 'professional',
            });
          }
        }

        // Ensure brand theme exists
        const brandThemes = await base44.entities.BrandTheme.filter({ company_id: tenant_id });
        if (brandThemes.length === 0) {
          await base44.entities.BrandTheme.create({
            company_id: tenant_id,
            theme_name: 'Default Brand',
            status: 'Active',
            tier: 'professional',
            is_active: true,
            colors: {
              primary: company.brand_color_primary || '#1147FF',
              secondary: company.brand_color_secondary || '#0B2341',
              accent: '#F58020',
            },
          });
        }

        // Log repair
        await base44.entities.TenantActivationLog.create({
          company_id: tenant_id,
          event_type: 'membership_repaired',
          description: `Repaired tenant membership for ${admin_email}`,
          performed_by: user.email,
          metadata: result,
        });

        break;
      }

      case 'validate_provisioning': {
        // Validate tenant provisioning completeness
        if (!tenant_id) {
          return Response.json({ error: 'Missing tenant_id' }, { status: 400 });
        }

        const checks = {};
        const issues = [];

        // Check 1: Tenant exists
        const company = await base44.entities.Company.get(tenant_id);
        checks.tenant_exists = !!company;
        if (!checks.tenant_exists) issues.push('Tenant does not exist');

        // Check 2: Admin user exists
        if (company?.email) {
          const users = await base44.entities.User.filter({ company_id: tenant_id });
          checks.has_admin_users = users.length > 0;
          if (!checks.has_admin_users) issues.push('No admin users linked to tenant');
        }

        // Check 3: Memberships exist
        const memberships = await base44.entities.TenantMembership.filter({ tenant_id });
        checks.has_memberships = memberships.length > 0;
        if (!checks.has_memberships) issues.push('No TenantMembership records');

        // Check 4: Active membership
        const activeMembership = memberships.find(m => m.status === 'active' && m.is_primary);
        checks.has_active_primary_membership = !!activeMembership;
        if (!checks.has_active_primary_membership) issues.push('No active primary membership');

        // Check 5: Feature flags
        const featureFlags = await base44.entities.TenantFeatureFlag.filter({ company_id: tenant_id });
        checks.has_feature_flags = featureFlags.length > 0;
        if (!checks.has_feature_flags) issues.push('No feature flags configured');

        // Check 6: Subscription
        const subscriptions = await base44.entities.CompanySubscription.filter({ company_id: tenant_id });
        checks.has_subscription = subscriptions.length > 0;
        if (!checks.has_subscription) issues.push('No subscription record');

        // Check 7: Brand theme
        const brandThemes = await base44.entities.BrandTheme.filter({ company_id: tenant_id });
        checks.has_brand_theme = brandThemes.length > 0;
        if (!checks.has_brand_theme) issues.push('No brand theme configured');

        // Check 8: Onboarding log
        const logs = await base44.entities.TenantActivationLog.filter({ company_id: tenant_id });
        checks.has_onboarding_record = logs.length > 0;

        result = {
          tenant_id,
          tenant_name: company?.name,
          valid: issues.length === 0,
          checks,
          issues,
          membership_count: memberships.length,
          feature_flags_count: featureFlags.length,
        };
        break;
      }

      default:
        return Response.json({ error: 'Unknown action' }, { status: 400 });
    }

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});