import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * MIGRATE LEGACY ADMIN ROLE
 * 
 * Converts legacy "admin" platform role to proper roles:
 * - Tenant users → role = "user" (tenant_role from membership)
 * - Platform staff → role = "super_admin"
 * 
 * This fixes platform_role contamination for tenant customers.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super_admin can run this migration
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log('[migrateLegacyAdminRole] Running migration...');

    // Find all users with legacy "admin" role
    const allUsers = await base44.asServiceRole.entities.User.filter({
      role: 'admin',
    });

    console.log('[migrateLegacyAdminRole] Found', allUsers.length, 'users with legacy admin role');

    const migrationResults = {
      migrated: [],
      skipped: [],
      errors: [],
    };

    for (const legacyUser of allUsers) {
      try {
        // Check if user has tenant membership
        const memberships = await base44.asServiceRole.entities.TenantMembership.filter({
          user_id: legacyUser.id,
          status: 'active',
        });

        if (memberships.length > 0) {
          // User belongs to a tenant → convert to "user"
          await base44.asServiceRole.entities.User.update(legacyUser.id, {
            role: 'user',
          });

          migrationResults.migrated.push({
            user_id: legacyUser.id,
            email: legacyUser.email,
            action: 'converted_to_user',
            reason: 'has_tenant_membership',
            membership_count: memberships.length,
          });

          console.log('[migrateLegacyAdminRole] Migrated', legacyUser.email, '→ user');
        } else {
          // No tenant membership → might be platform staff
          // Keep as admin for now, but log for manual review
          migrationResults.skipped.push({
            user_id: legacyUser.id,
            email: legacyUser.email,
            action: 'skipped_no_tenant_membership',
            reason: 'manual_review_required',
          });

          console.log('[migrateLegacyAdminRole] Skipped', legacyUser.email, '(no tenant membership)');
        }
      } catch (error) {
        migrationResults.errors.push({
          user_id: legacyUser.id,
          email: legacyUser.email,
          error: error.message,
        });
      }
    }

    return Response.json({
      success: true,
      migration_summary: {
        total_found: allUsers.length,
        migrated_to_user: migrationResults.migrated.length,
        skipped_manual_review: migrationResults.skipped.length,
        errors: migrationResults.errors.length,
      },
      details: migrationResults,
    });
  } catch (error) {
    console.error('[migrateLegacyAdminRole] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});