import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only platform admins can repair
    if (!user || !['admin', 'developer'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { action, user_id, tenant_id, membership_id, tenant_role } = await req.json();

    if (!action) {
      return Response.json({ error: 'Missing action' }, { status: 400 });
    }

    let result = {};

    switch (action) {
      case 'create_membership': {
        // Create missing membership for user
        if (!user_id || !tenant_id) {
          return Response.json({ error: 'Missing user_id or tenant_id' }, { status: 400 });
        }

        const membership = await base44.entities.TenantMembership.create({
          user_id,
          tenant_id,
          tenant_role: tenant_role || 'project_manager',
          status: 'active',
          invited_by: user.email,
          invited_at: new Date().toISOString(),
          joined_at: new Date().toISOString(),
          is_primary: true,
          permissions: {
            can_create_projects: true,
            can_create_estimates: tenant_role !== 'technician',
            can_view_financials: tenant_role === 'tenant_admin',
            can_manage_team: tenant_role === 'tenant_admin',
          },
        });

        // Update user's company_id
        await base44.entities.User.update(user_id, { company_id: tenant_id });

        result = { success: true, membership_id: membership.id, action: 'created_membership' };
        break;
      }

      case 'delete_membership': {
        // Delete orphan or invalid membership
        if (!membership_id) {
          return Response.json({ error: 'Missing membership_id' }, { status: 400 });
        }

        await base44.entities.TenantMembership.delete(membership_id);
        result = { success: true, action: 'deleted_membership' };
        break;
      }

      case 'assign_tenant_role': {
        // Assign missing tenant role
        if (!membership_id || !tenant_role) {
          return Response.json({ error: 'Missing membership_id or tenant_role' }, { status: 400 });
        }

        await base44.entities.TenantMembership.update(membership_id, { tenant_role });
        result = { success: true, action: 'assigned_tenant_role' };
        break;
      }

      case 'set_primary_membership': {
        // Set one membership as primary, others as non-primary
        if (!user_id || !membership_id) {
          return Response.json({ error: 'Missing user_id or membership_id' }, { status: 400 });
        }

        const memberships = await base44.entities.TenantMembership.filter({ user_id });
        
        // Set all to non-primary first
        await Promise.all(
          memberships.map(m => 
            base44.entities.TenantMembership.update(m.id, { is_primary: false })
          )
        );

        // Set selected as primary
        await base44.entities.TenantMembership.update(membership_id, { is_primary: true });

        result = { success: true, action: 'set_primary_membership' };
        break;
      }

      case 'repair_tenant_admin': {
        // Create tenant admin for company without one
        if (!tenant_id) {
          return Response.json({ error: 'Missing tenant_id' }, { status: 400 });
        }

        const company = await base44.entities.Company.get(tenant_id);
        if (!company) {
          return Response.json({ error: 'Company not found' }, { status: 404 });
        }

        // Find users with this company_id
        const users = await base44.entities.User.filter({ company_id: tenant_id });
        
        if (users.length === 0) {
          return Response.json({ 
            error: 'No users found for this company. Create a user first.',
            company_id: tenant_id,
          }, { status: 400 });
        }

        // Make the first user the tenant admin
        const adminUser = users[0];
        
        // Check if membership exists
        const existingMembership = await base44.entities.TenantMembership.filter({ 
          user_id: adminUser.id,
          tenant_id,
        });

        if (existingMembership.length > 0) {
          // Update existing membership
          await base44.entities.TenantMembership.update(existingMembership[0].id, {
            tenant_role: 'tenant_admin',
            status: 'active',
            is_primary: true,
          });
        } else {
          // Create new membership
          await base44.entities.TenantMembership.create({
            user_id: adminUser.id,
            tenant_id,
            tenant_role: 'tenant_admin',
            status: 'active',
            invited_by: user.email,
            invited_at: new Date().toISOString(),
            joined_at: new Date().toISOString(),
            is_primary: true,
            permissions: {
              can_create_projects: true,
              can_create_estimates: true,
              can_view_financials: true,
              can_manage_team: true,
            },
          });
        }

        // Update user role
        await base44.entities.User.update(adminUser.id, {
          role: 'company_admin',
          company_id: tenant_id,
        });

        result = { 
          success: true, 
          action: 'repaired_tenant_admin',
          user_id: adminUser.id,
          user_email: adminUser.email,
        };
        break;
      }

      case 'migrate_legacy_user': {
        // Migrate user with old company_id to new membership system
        if (!user_id) {
          return Response.json({ error: 'Missing user_id' }, { status: 400 });
        }

        const legacyUser = await base44.entities.User.get(user_id);
        if (!legacyUser || !legacyUser.company_id) {
          return Response.json({ error: 'User not found or has no company_id' }, { status: 404 });
        }

        // Check if membership already exists
        const existingMembership = await base44.entities.TenantMembership.filter({
          user_id,
          tenant_id: legacyUser.company_id,
        });

        if (existingMembership.length === 0) {
          // Create membership
          await base44.entities.TenantMembership.create({
            user_id,
            tenant_id: legacyUser.company_id,
            tenant_role: 'project_manager',
            status: 'active',
            invited_by: 'system_migration',
            invited_at: new Date().toISOString(),
            joined_at: new Date().toISOString(),
            is_primary: true,
          });
        }

        result = { 
          success: true, 
          action: 'migrated_legacy_user',
          user_id,
          tenant_id: legacyUser.company_id,
        };
        break;
      }

      default:
        return Response.json({ error: 'Unknown action' }, { status: 400 });
    }

    // Log the repair action
    await base44.entities.TenantActivationLog.create({
      company_id: tenant_id || 'system',
      event_type: 'membership_repaired',
      description: `Membership repair: ${action}`,
      performed_by: user.email,
      metadata: result,
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});