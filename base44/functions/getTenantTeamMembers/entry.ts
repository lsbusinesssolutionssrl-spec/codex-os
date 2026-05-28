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

    // Platform owner emails - treat as internal support unless explicitly customer
    const PLATFORM_OWNER_EMAILS = ['lsbusiness.solutions.srl@gmail.com'];
    
    // Join memberships with user data
    const allMemberData = allMemberships.map(m => {
      const matchedUser = allUsers.find(u => u.id === m.user_id);
      const userEmail = matchedUser?.email || m.user?.email || 'Unknown';
      const userFullName = matchedUser?.full_name || m.user?.full_name;
      
      // Determine membership type
      let membershipType = m.membership_type || 'customer_member';
      
      // Auto-classify platform owners as internal_support
      if (PLATFORM_OWNER_EMAILS.includes(userEmail)) {
        membershipType = 'internal_support';
      }
      
      return {
        id: m.id,
        user_id: m.user_id,
        user: {
          email: userEmail,
          full_name: userFullName || userEmail.split('@')[0],
        },
        tenant_id: m.tenant_id,
        tenant_role: m.tenant_role,
        membership_type: membershipType,
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

    // Separate customer members from internal support
    const customerMembers = allMemberData.filter(m => m.membership_type === 'customer_member');
    const internalSupport = allMemberData.filter(m => m.membership_type === 'internal_support');
    
    // Categorize customer members only
    const active = customerMembers.filter(m => m.status === 'active');
    const pending = customerMembers.filter(m => ['invited', 'pending'].includes(m.status.toLowerCase()));
    const removed = customerMembers.filter(m => m.status === 'removed');
    const suspended = customerMembers.filter(m => m.status === 'suspended');

    return Response.json({
      success: true,
      tenant_id,
      total_count: customerMembers.length,
      active_count: active.length,
      pending_count: pending.length,
      removed_count: removed.length,
      suspended_count: suspended.length,
      members: active, // Return only active customer members by default
      internal_support: internalSupport, // Separate section for platform/support
      all_memberships: allMemberData, // Include all for debug
      debug: {
        raw_memberships_loaded: allMemberships.length,
        users_loaded: allUsers.length,
        customer_members_count: customerMembers.length,
        internal_support_count: internalSupport.length,
        memberships_missing_user: allMemberData.filter(m => m.user?.email === 'Unknown').length,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});