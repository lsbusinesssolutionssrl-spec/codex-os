import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[SetupTenantAdminMembership] Setting up membership for user:', user.email);

    const results = {
      user_email: user.email,
      user_id: user.id,
      tenant_found: false,
      membership_created: false,
      membership_updated: false,
      errors: [],
    };

    // STEP 1: Find LS Business Solutions Srl tenant
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
    results.tenant_found = true;
    console.log('[SetupTenantAdminMembership] Found tenant:', tenant.id);

    // STEP 2: Check if membership exists
    const existingMemberships = await base44.asServiceRole.entities.TenantMembership.filter({
      user_id: user.id,
      tenant_id: tenant.id,
    });

    if (existingMemberships.length > 0) {
      // Update existing membership to ensure correct role
      console.log('[SetupTenantAdminMembership] Updating existing membership');
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
        is_primary: true,
      };
      console.log('[SetupTenantAdminMembership] Membership updated:', results.membership);
    } else {
      // Create new membership
      console.log('[SetupTenantAdminMembership] Creating new membership');
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
        is_primary: true,
      };
      console.log('[SetupTenantAdminMembership] Membership created:', results.membership);
    }

    console.log('[SetupTenantAdminMembership] Setup complete:', results);

    return Response.json({
      success: true,
      message: 'Tenant admin membership setup complete',
      results,
    });
  } catch (error) {
    console.error('[SetupTenantAdminMembership] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});