import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !['admin', 'developer', 'super_admin'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { includeDemo = false, includeInternal = false, includeArchived = false } = await req.json().catch(() => ({}));

    // Get all companies
    const companies = await base44.asServiceRole.entities.Company.list();
    
    // Get subscriptions
    const subscriptions = await base44.asServiceRole.entities.CompanySubscription.list();
    
    // Get memberships
    const memberships = await base44.asServiceRole.entities.TenantMembership.list();

    // Filter based on flags
    let filtered = companies.filter(c => {
      // Always exclude archived unless explicitly included
      if (c.archived && !includeArchived) return false;
      
      // Exclude demo unless included
      if ((c.tenant_type === 'demo' || c.demo_mode) && !includeDemo) return false;
      
      // Exclude internal unless included
      if (c.tenant_type === 'internal' && !includeInternal) return false;
      
      // Exclude default_seed unless included
      if (c.tenant_type === 'default_seed' && !includeDemo) return false;
      
      return true;
    });

    // Enrich with data
    const enriched = filtered.map(company => {
      const sub = subscriptions.find(s => s.company_id === company.id && s.status === 'active');
      const companyMemberships = memberships.filter(m => m.tenant_id === company.id && m.status === 'active');
      const customerMembers = companyMemberships.filter(m => m.membership_type === 'customer_member');
      const internalSupport = companyMemberships.filter(m => m.membership_type === 'internal_support');

      return {
        ...company,
        subscription: sub,
        mrr: sub?.mrr || 0,
        customerCount: customerMembers.length,
        internalSupportCount: internalSupport.length,
        totalMembers: companyMemberships.length,
        isProduction: company.tenant_type === 'production_customer' && !company.archived,
      };
    });

    // Calculate metrics
    const metrics = {
      totalTenants: enriched.length,
      productionTenants: enriched.filter(t => t.isProduction).length,
      totalMRR: enriched.reduce((sum, t) => sum + (t.mrr || 0), 0),
      productionMRR: enriched.filter(t => t.isProduction).reduce((sum, t) => sum + (t.mrr || 0), 0),
      totalUsers: enriched.reduce((sum, t) => sum + t.customerCount, 0),
      totalCustomerMembers: enriched.reduce((sum, t) => sum + t.customerCount, 0),
      totalInternalSupport: enriched.reduce((sum, t) => sum + t.internalSupportCount, 0),
    };

    return Response.json({
      tenants: enriched,
      metrics,
      filters: { includeDemo, includeInternal, includeArchived },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});