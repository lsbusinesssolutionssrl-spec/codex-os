import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only platform admins can audit
    if (!user || !['admin', 'developer'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const [users, companies, memberships] = await Promise.all([
      base44.entities.User.list(),
      base44.entities.Company.list(),
      base44.entities.TenantMembership.list(),
    ]);

    const issues = [];
    const stats = {
      total_users: users.length,
      total_companies: companies.length,
      total_memberships: memberships.length,
      users_without_membership: 0,
      users_with_multiple_memberships: 0,
      orphan_memberships: 0,
      missing_tenant_role: 0,
      pending_invitations: 0,
      suspended_memberships: 0,
    };

    // Check each user
    users.forEach(u => {
      const userMemberships = memberships.filter(m => m.user_id === u.id);
      
      // Issue 1: Users without any membership
      if (userMemberships.length === 0 && !['admin', 'developer'].includes(u.role)) {
        stats.users_without_membership++;
        issues.push({
          type: 'missing_membership',
          severity: 'critical',
          user_id: u.id,
          user_email: u.email,
          user_role: u.role,
          company_id: u.company_id || null,
          description: 'User has no TenantMembership record',
          fix: 'create_membership',
        });
      }

      // Issue 2: Users with multiple active memberships
      if (userMemberships.length > 1) {
        const activeMemberships = userMemberships.filter(m => m.status === 'active');
        if (activeMemberships.length > 1) {
          stats.users_with_multiple_memberships++;
          issues.push({
            type: 'multiple_active_memberships',
            severity: 'warning',
            user_id: u.id,
            user_email: u.email,
            memberships: activeMemberships.map(m => ({
              membership_id: m.id,
              tenant_id: m.tenant_id,
              tenant_role: m.tenant_role,
            })),
            description: 'User has multiple active tenant memberships',
            fix: 'set_primary_membership',
          });
        }
      }

      // Issue 3: User has company_id but no matching membership
      if (u.company_id) {
        const matchingMembership = userMemberships.find(m => m.tenant_id === u.company_id);
        if (!matchingMembership) {
          issues.push({
            type: 'company_id_without_membership',
            severity: 'high',
            user_id: u.id,
            user_email: u.email,
            company_id: u.company_id,
            description: 'User has company_id but no TenantMembership for that tenant',
            fix: 'create_missing_membership',
          });
        }
      }
    });

    // Check each membership
    memberships.forEach(m => {
      // Issue 4: Orphan memberships (tenant doesn't exist)
      const tenantExists = companies.some(c => c.id === m.tenant_id);
      if (!tenantExists) {
        stats.orphan_memberships++;
        issues.push({
          type: 'orphan_membership',
          severity: 'high',
          membership_id: m.id,
          user_id: m.user_id,
          tenant_id: m.tenant_id,
          description: 'Membership references non-existent tenant',
          fix: 'delete_membership',
        });
      }

      // Issue 5: Missing tenant_role
      if (!m.tenant_role) {
        stats.missing_tenant_role++;
        issues.push({
          type: 'missing_tenant_role',
          severity: 'medium',
          membership_id: m.id,
          user_id: m.user_id,
          tenant_id: m.tenant_id,
          description: 'Membership has no tenant_role assigned',
          fix: 'assign_tenant_role',
        });
      }

      // Issue 6: Pending invitations
      if (m.status === 'pending' || m.status === 'invited') {
        stats.pending_invitations++;
      }

      // Issue 7: Suspended memberships
      if (m.status === 'suspended') {
        stats.suspended_memberships++;
      }
    });

    // Check companies without admin
    companies.forEach(c => {
      const companyMemberships = memberships.filter(m => m.tenant_id === c.id && m.status === 'active');
      const hasAdmin = companyMemberships.some(m => m.tenant_role === 'tenant_admin');
      
      if (!hasAdmin) {
        issues.push({
          type: 'tenant_without_admin',
          severity: 'critical',
          company_id: c.id,
          company_name: c.name,
          description: 'Tenant has no active admin user',
          fix: 'assign_tenant_admin',
        });
      }
    });

    return Response.json({
      stats,
      issues,
      summary: {
        critical: issues.filter(i => i.severity === 'critical').length,
        high: issues.filter(i => i.severity === 'high').length,
        medium: issues.filter(i => i.severity === 'medium').length,
        warning: issues.filter(i => i.severity === 'warning').length,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});