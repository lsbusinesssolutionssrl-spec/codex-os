import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[EnsureTenantMembership] User:', user.email, user.id);

    // Find tenant by legacy company_id
    if (!user.company_id) {
      return Response.json({ 
        success: false, 
        error: 'User has no company_id binding' 
      }, { status: 404 });
    }

    const tenant_id = user.company_id;
    console.log('[EnsureTenantMembership] Tenant ID:', tenant_id);

    // Check if membership exists
    const existingMemberships = await base44.asServiceRole.entities.TenantMembership.filter({
      user_id: user.id,
      tenant_id: tenant_id,
    });

    console.log('[EnsureTenantMembership] Existing memberships:', existingMemberships.length);

    if (existingMemberships.length > 0) {
      const membership = existingMemberships[0];
      console.log('[EnsureTenantMembership] Found membership:', {
        id: membership.id,
        status: membership.status,
        tenant_role: membership.tenant_role,
        is_primary: membership.is_primary,
      });

      // Ensure correct role and status
      if (membership.tenant_role !== 'tenant_admin' || membership.status !== 'active' || !membership.is_primary) {
        console.log('[EnsureTenantMembership] Updating membership to active tenant_admin');
        await base44.asServiceRole.entities.TenantMembership.update(membership.id, {
          tenant_role: 'tenant_admin',
          status: 'active',
          is_primary: true,
        });
      }

      return Response.json({
        success: true,
        action: 'updated',
        membership: {
          id: membership.id,
          user_id: membership.user_id,
          tenant_id: membership.tenant_id,
          tenant_role: 'tenant_admin',
          status: 'active',
          is_primary: true,
        },
      });
    }

    // Create new membership
    console.log('[EnsureTenantMembership] Creating new membership');
    const newMembership = await base44.asServiceRole.entities.TenantMembership.create({
      user_id: user.id,
      tenant_id: tenant_id,
      tenant_role: 'tenant_admin',
      status: 'active',
      is_primary: true,
      invited_by: user.email,
      invited_at: new Date().toISOString(),
      joined_at: new Date().toISOString(),
    });

    console.log('[EnsureTenantMembership] Membership created:', newMembership.id);

    return Response.json({
      success: true,
      action: 'created',
      membership: {
        id: newMembership.id,
        user_id: newMembership.user_id,
        tenant_id: newMembership.tenant_id,
        tenant_role: 'tenant_admin',
        status: 'active',
        is_primary: true,
      },
    });
  } catch (error) {
    console.error('[EnsureTenantMembership] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});