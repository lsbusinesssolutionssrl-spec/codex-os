import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Platform admin only' }, { status: 403 });
    }

    // Load all tenants (companies)
    const allCompanies = await base44.asServiceRole.entities.Company.list('-created_date', 100);
    
    // Load all subscriptions
    const allSubscriptions = await base44.asServiceRole.entities.CompanySubscription.list();
    
    // Load all memberships
    const allMemberships = await base44.asServiceRole.entities.TenantMembership.list();
    
    // Load all users
    const allUsers = await base44.asServiceRole.entities.User.list();

    // Build tenant audit data
    const tenantAudit = allCompanies.map(company => {
      const subscription = allSubscriptions.find(s => s.company_id === company.id && s.status === 'active');
      const memberships = allMemberships.filter(m => m.tenant_id === company.id);
      const adminMembership = memberships.find(m => m.tenant_role === 'tenant_admin' && m.status === 'active');
      const adminUser = adminMembership ? allUsers.find(u => u.id === adminMembership.user_id) : null;
      
      // Classify tenant type
      let tenantType = 'real';
      let notes = [];
      
      if (company.demo_mode || company.name?.toLowerCase().includes('demo')) {
        tenantType = 'demo';
        notes.push('Demo tenant');
      }
      
      if (company.name?.toLowerCase().includes('codex') && company.name?.toLowerCase().includes('default')) {
        tenantType = 'default';
        notes.push('Default system tenant');
      }
      
      if (company.slug === 'lsbusiness' && !subscription) {
        tenantType = 'platform_owner_org';
        notes.push('Platform owner organization - no subscription needed');
      }
      
      if (!subscription && memberships.length === 0) {
        tenantType = 'orphan';
        notes.push('No subscription, no members');
      }
      
      // Check for duplicates by similar names
      const similarTenants = allCompanies.filter(c => 
        c.id !== company.id && 
        c.name?.toLowerCase().includes(company.name?.toLowerCase().split(' ')[0] || '')
      );
      
      if (similarTenants.length > 0) {
        notes.push(`Possible duplicate: ${similarTenants.map(s => s.name).join(', ')}`);
      }

      return {
        tenant_id: company.id,
        name: company.name,
        slug: company.slug,
        admin_email: adminUser?.email || adminMembership?.user_id || 'No admin',
        plan: subscription?.plan_id ? 'Enterprise' : 'No subscription',
        status: company.status,
        tenant_type: tenantType,
        subscription_status: subscription?.status || 'none',
        users_count: memberships.filter(m => m.status === 'active').length,
        created_at: company.created_date,
        has_logo: !!company.logo_url,
        has_subscription: !!subscription,
        notes: notes.join('; '),
        is_duplicate_target: similarTenants.length > 0,
      };
    });

    // Sort: real tenants first, then demo, then orphans
    tenantAudit.sort((a, b) => {
      const priority = { real: 0, demo: 1, platform_owner_org: 2, default: 3, orphan: 4 };
      return (priority[a.tenant_type] || 5) - (priority[b.tenant_type] || 5);
    });

    // Summary stats
    const summary = {
      total_tenants: allCompanies.length,
      real_tenants: tenantAudit.filter(t => t.tenant_type === 'real').length,
      demo_tenants: tenantAudit.filter(t => t.tenant_type === 'demo').length,
      platform_owner_orgs: tenantAudit.filter(t => t.tenant_type === 'platform_owner_org').length,
      orphan_tenants: tenantAudit.filter(t => t.tenant_type === 'orphan').length,
      tenants_with_subscription: tenantAudit.filter(t => t.has_subscription).length,
      tenants_without_subscription: tenantAudit.filter(t => !t.has_subscription).length,
      possible_duplicates: tenantAudit.filter(t => t.is_duplicate_target).length,
    };

    return Response.json({
      success: true,
      summary,
      tenants: tenantAudit,
      recommendations: generateRecommendations(tenantAudit, summary),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateRecommendations(audit, summary) {
  const recommendations = [];
  
  if (summary.orphan_tenants > 0) {
    recommendations.push({
      action: 'archive_orphans',
      priority: 'low',
      message: `${summary.orphan_tenants} orphan tenant(s) found - consider archiving or deleting`,
    });
  }
  
  if (summary.possible_duplicates > 0) {
    recommendations.push({
      action: 'review_duplicates',
      priority: 'medium',
      message: `${summary.possible_duplicates} tenant(s) have possible duplicates - review and merge/archive`,
    });
  }
  
  if (summary.demo_tenants > 1) {
    recommendations.push({
      action: 'consolidate_demos',
      priority: 'low',
      message: `${summary.demo_tenants} demo tenant(s) found - consider consolidating to one`,
    });
  }

  return recommendations;
}