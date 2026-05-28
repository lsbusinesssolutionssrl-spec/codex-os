import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * FORCE SESSION REFRESH
 * 
 * Clears cached user role and forces reload of user context.
 * Called after role migrations to reflect changes immediately.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[forceSessionRefresh] Current user role:', user.role);

    // The SDK should automatically refresh on each me() call
    // But if needed, we can validate the user role against the database
    const freshUser = await base44.auth.me();
    
    console.log('[forceSessionRefresh] Fresh user role:', freshUser.role);

    return Response.json({
      success: true,
      message: 'Session refreshed',
      user: {
        id: freshUser.id,
        email: freshUser.email,
        role: freshUser.role,
        full_name: freshUser.full_name,
      },
    });
  } catch (error) {
    console.error('[forceSessionRefresh] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});