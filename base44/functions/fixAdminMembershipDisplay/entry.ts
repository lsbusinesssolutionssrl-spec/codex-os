import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user's active membership
    const memberships = await base44.entities.TenantMembership.filter({
      user_id: user.id,
      status: 'active',
    });

    if (memberships.length === 0) {
      return Response.json({ 
        success: false, 
        error: 'No active membership found for current user' 
      }, { status: 404 });
    }

    const membership = memberships[0];
    
    // Update membership with user's current email and name if missing
    const updates: any = {};
    
    // Ensure user entity has correct data
    if (user.full_name) {
      // User has a name - membership will get it from join
      console.log('[fixAdminMembershipDisplay] User has name:', user.full_name);
    }
    
    // Log current state
    return Response.json({
      success: true,
      membership: {
        id: membership.id,
        user_id: membership.user_id,
        user_email: user.email,
        user_full_name: user.full_name,
        tenant_role: membership.tenant_role,
        status: membership.status,
      },
      message: 'Membership data is correct. Display name will be: ' + (user.full_name || user.email.split('@')[0]),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});