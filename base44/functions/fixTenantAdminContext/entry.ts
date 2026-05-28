import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[FixTenantAdminContext] Starting fix for user:', user.email);

    const results = {
      user_email: user.email,
      platform_role_removed: false,
      membership_created: false,
      membership_updated: false,
      errors: [],
    };

    // STEP 1: Remove platform_role = 'admin' from tenant user
    // Only internal Codex staff should have super_admin/developer/platform_owner
    // Generic 'admin' role is legacy and should be removed
    if (user.role === 'admin') {
      console.log('[FixTenantAdminContext] Removing platform_role = admin');
      await base44.asServiceRole.entities.User.update(user.id, { role: 'user' });
      results.platform_role_removed = true;
      console.log('[FixTenantAdminContext] Platform role removed, now role = user');
    }

    // STEP 2: Find or create TenantMembership for LS Business Solutions Srl
    const companies = await base44.asServiceRole.entities.Company.filter({
      name: 'LS Business Solutions Srl',
    });

    if (companies.length === 0) {
      results.errors.push('LS Business Solutions Srl tenant not found');
      return Response.json({ 
        success: false, 
        error: 'Tenant not found',
        results 
      }, { status: 404 });
    }

    const tenant = companies[0];
    console.log('[FixTenantAdminContext] Found tenant:', tenant.id);

    // Check if membership exists
    const existingMemberships = await base44.asServiceRole.entities.TenantMembership.filter({
      user_id: user.id,
      tenant_id: tenant.id,
    });

    if (existingMemberships.length > 0) {
      // Update existing membership
      console.log('[FixTenantAdminContext] Updating existing membership');
      const membership = existingMemberships[0];
      await base44.asServiceRole.entities.TenantMembership.update(membership.id, {
        tenant_role: 'tenant_admin',
        status: 'active',
        is_primary: true,
      });
      results.membership_updated = true;
      results.membership = {
        id: membership.id,
        tenant_id: tenant.id,
        tenant_role: 'tenant_admin',
        status: 'active',
      };
    } else {
      // Create new membership
      console.log('[FixTenantAdminContext] Creating new membership');
      const newMembership = await base44.asServiceRole.entities.TenantMembership.create({
        user_id: user.id,
        tenant_id: tenant.id,
        tenant_role: 'tenant_admin',
        status: 'active',
        is_primary: true,
        invited_by: user.email,
        invited_at: new Date().toISOString(),
        joined_at: new Date().toISOString(),
      });
      results.membership_created = true;
      results.membership = {
        id: newMembership.id,
        tenant_id: tenant.id,
        tenant_role: 'tenant_admin',
        status: 'active',
      };
    }

    console.log('[FixTenantAdminContext] Fix complete:', results);

    return Response.json({
      success: true,
      message: 'Tenant admin context fixed',
      results,
    });
  } catch (error) {
    console.error('[FixTenantAdminContext] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});