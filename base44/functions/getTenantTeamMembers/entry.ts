import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all memberships for the tenant (service role bypasses RLS)
    const { tenant_id } = await req.json();
    
    if (!tenant_id) {
      return Response.json({ error: 'tenant_id required' }, { status: 400 });
    }

    // Verify user belongs to this tenant
    const userMemberships = await base44.entities.TenantMembership.filter({
      user_id: user.id,
      tenant_id: tenant_id,
      status: 'active',
    });

    if (userMemberships.length === 0) {
      return Response.json({ error: 'User not authorized for this tenant' }, { status: 403 });
    }

    // Load all memberships for tenant (service role)
    const allMemberships = await base44.asServiceRole.entities.TenantMembership.filter({
      tenant_id: tenant_id,
    });

    // Load users
    const allUsers = await base44.asServiceRole.entities.User.list();

    // Join memberships with user data
    const members = allMemberships.map(m => {
      const matchedUser = allUsers.find(u => u.id === m.user_id);
      const userEmail = matchedUser?.email || m.user?.email || 'Unknown';
      const userFullName = matchedUser?.full_name || m.user?.full_name;
      
      return {
        id: m.id,
        user_id: m.user_id,
        user: {
          email: userEmail,
          full_name: userFullName || userEmail.split('@')[0], // Fallback to email prefix if no name
        },
        tenant_id: m.tenant_id,
        tenant_role: m.tenant_role,
        status: m.status,
        is_primary: m.is_primary,
        invited_by: m.invited_by,
        invited_at: m.invited_at,
        joined_at: m.joined_at,
        permissions: m.permissions,
        default_workspace: m.default_workspace,
        language: m.language,
        notes: m.notes,
        created_date: m.created_date,
        updated_date: m.updated_date,
      };
    });

    // Categorize
    const active = members.filter(m => m.status === 'active');
    const pending = members.filter(m => ['invited', 'pending'].includes(m.status.toLowerCase()));
    const removed = members.filter(m => m.status === 'removed');
    const suspended = members.filter(m => m.status === 'suspended');

    return Response.json({
      success: true,
      tenant_id,
      total_count: members.length,
      active_count: active.length,
      pending_count: pending.length,
      removed_count: removed.length,
      suspended_count: suspended.length,
      members,
      debug: {
        raw_memberships_loaded: allMemberships.length,
        users_loaded: allUsers.length,
        memberships_missing_user: members.filter(m => m.user_email === 'Unknown').length,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});