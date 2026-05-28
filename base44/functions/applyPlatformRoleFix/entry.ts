import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * APPLY PLATFORM ROLE FIX
 * 
 * For users with legacy "admin" role who have tenant membership:
 * 1. Verify user has tenant membership
 * 2. Confirm user should be "user" role not "admin"
 * 3. Return fixed role value
 * 
 * This ensures context engine uses correct role value.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[applyPlatformRoleFix] User role:', user.role);

    // Check if user still has legacy "admin" role
    if (user.role === 'admin') {
      // Check if user has tenant membership
      const memberships = await base44.asServiceRole.entities.TenantMembership.filter({
        user_id: user.id,
        status: 'active',
      });

      if (memberships.length > 0) {
        // User has tenant membership - role should NOT be admin
        // This is a contamination - user migrated but session not refreshed
        console.log('[applyPlatformRoleFix] User has tenant membership but role still admin');
        
        return Response.json({
          success: true,
          action: 'role_contamination_detected',
          message: 'User role is admin but has tenant membership. Session needs refresh.',
          user: {
            id: user.id,
            email: user.email,
            current_role: 'admin',
            correct_role: 'user',
            has_tenant_membership: true,
            membership_count: memberships.length,
          },
          fix_required: true,
          fix_command: 'logout_and_reload',
        });
      }
    }

    // User role is correct
    return Response.json({
      success: true,
      action: 'role_valid',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      fix_required: false,
    });
  } catch (error) {
    console.error('[applyPlatformRoleFix] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});