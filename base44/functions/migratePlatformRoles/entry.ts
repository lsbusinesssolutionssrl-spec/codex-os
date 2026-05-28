import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'super_admin') {
      return Response.json({ error: 'Unauthorized - super_admin required' }, { status: 403 });
    }

    // Get all users
    const allUsers = await base44.asServiceRole.entities.User.list();
    
    const migrationResults = {
      total_users: allUsers.length,
      migrated: [],
      skipped: [],
      errors: [],
    };

    for (const u of allUsers) {
      try {
        // Skip if user doesn't have legacy admin role
        if (u.role !== 'admin') {
          migrationResults.skipped.push({
            user_id: u.id,
            email: u.email,
            reason: 'role is not admin',
          });
          continue;
        }

        // Check if user has tenant memberships
        const memberships = await base44.asServiceRole.entities.TenantMembership.filter({
          user_id: u.id,
        });

        if (memberships.length > 0) {
          // User is a tenant admin - remove platform role
          await base44.asServiceRole.entities.User.update(u.id, { role: 'user' });
          migrationResults.migrated.push({
            user_id: u.id,
            email: u.email,
            action: 'removed platform role (has tenant memberships)',
            memberships_count: memberships.length,
          });
        } else {
          // User has no tenant memberships - might be internal staff
          // Check if they should be super_admin or developer
          // For now, migrate to user (safe default)
          await base44.asServiceRole.entities.User.update(u.id, { role: 'user' });
          migrationResults.migrated.push({
            user_id: u.id,
            email: u.email,
            action: 'removed platform role (no memberships, set to user)',
          });
        }
      } catch (error) {
        migrationResults.errors.push({
          user_id: u.id,
          email: u.email,
          error: error.message,
        });
      }
    }

    return Response.json({
      success: true,
      message: 'Platform role migration complete',
      results: migrationResults,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});