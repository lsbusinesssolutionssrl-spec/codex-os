import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Backend function to load user's tenant memberships
 * Used by GlobalContextEngine to bypass frontend RLS restrictions
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Load all memberships for current user (bypasses RLS)
    const memberships = await base44.asServiceRole.entities.TenantMembership.filter({
      user_id: user.id,
    });

    console.log('[loadUserMemberships] Found memberships:', memberships.length);

    return Response.json({
      success: true,
      user_id: user.id,
      email: user.email,
      memberships: memberships,
      count: memberships.length,
    });
  } catch (error) {
    console.error('[loadUserMemberships] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});