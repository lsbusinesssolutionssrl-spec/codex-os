import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only platform admins
    if (!user || !['admin', 'developer'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const [users, companies, memberships] = await Promise.all([
      base44.entities.User.list(),
      base44.entities.Company.list(),
      base44.entities.TenantMembership.list(),
    ]);

    const results = {
      migrated: 0,
      errors: [],
      details: [],
    };

    // Find all users with company_id but no membership
    for (const u of users) {
      // Skip platform users
      if (['admin', 'developer'].includes(u.role)) {
        continue;
      }

      // Skip if no company_id
      if (!u.company_id) {
        continue;
      }

      // Check if membership exists
      const existingMemberships = memberships.filter(
        m => m.user_id === u.id && m.tenant_id === u.company_id
      );

      if (existingMemberships.length === 0) {
        // Create missing membership
        try {
          await base44.entities.TenantMembership.create({
            user_id: u.id,
            tenant_id: u.company_id,
            tenant_role: u.role === 'company_admin' ? 'tenant_admin' : 'project_manager',
            status: 'active',
            invited_by: 'system_migration',
            invited_at: new Date().toISOString(),
            joined_at: new Date().toISOString(),
            is_primary: true,
            permissions: {
              can_create_projects: true,
              can_create_estimates: u.role !== 'technician',
              can_view_financials: u.role === 'company_admin',
              can_manage_team: u.role === 'company_admin',
            },
          });

          results.migrated++;
          results.details.push({
            user_id: u.id,
            user_email: u.email,
            tenant_id: u.company_id,
            action: 'created_membership',
          });
        } catch (error) {
          results.errors.push({
            user_id: u.id,
            user_email: u.email,
            error: error.message,
          });
        }
      }
    }

    // Find all companies without admin
    for (const c of companies) {
      const companyMemberships = memberships.filter(m => m.tenant_id === c.id);
      const hasAdmin = companyMemberships.some(m => m.tenant_role === 'tenant_admin' && m.status === 'active');

      if (!hasAdmin) {
        // Find users with this company_id
        const companyUsers = users.filter(u => u.company_id === c.id);
        
        if (companyUsers.length > 0) {
          const adminUser = companyUsers[0];
          
          try {
            // Update user role
            await base44.entities.User.update(adminUser.id, {
              role: 'company_admin',
            });

            // Create or update membership
            const existingMembership = companyMemberships.find(m => m.user_id === adminUser.id);
            
            if (existingMembership) {
              await base44.entities.TenantMembership.update(existingMembership.id, {
                tenant_role: 'tenant_admin',
                status: 'active',
                is_primary: true,
              });
            } else {
              await base44.entities.TenantMembership.create({
                user_id: adminUser.id,
                tenant_id: c.id,
                tenant_role: 'tenant_admin',
                status: 'active',
                invited_by: 'system_migration',
                invited_at: new Date().toISOString(),
                joined_at: new Date().toISOString(),
                is_primary: true,
                permissions: {
                  can_create_projects: true,
                  can_create_estimates: true,
                  can_view_financials: true,
                  can_manage_team: true,
                  can_access_api: true,
                },
              });
            }

            results.migrated++;
            results.details.push({
              company_id: c.id,
              company_name: c.name,
              admin_user_id: adminUser.id,
              admin_email: adminUser.email,
              action: 'assigned_tenant_admin',
            });
          } catch (error) {
            results.errors.push({
              company_id: c.id,
              company_name: c.name,
              error: error.message,
            });
          }
        } else {
          results.errors.push({
            company_id: c.id,
            company_name: c.name,
            error: 'No users found for this company',
          });
        }
      }
    }

    // Log the migration
    await base44.entities.TenantActivationLog.create({
      company_id: 'system',
      event_type: 'membership_migration',
      description: 'Bulk migration of legacy users to membership system',
      performed_by: user.email,
      metadata: {
        migrated_count: results.migrated,
        error_count: results.errors.length,
      },
    });

    return Response.json({
      success: true,
      migrated: results.migrated,
      errors: results.errors,
      details: results.details,
      message: `Migrated ${results.migrated} records successfully`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});