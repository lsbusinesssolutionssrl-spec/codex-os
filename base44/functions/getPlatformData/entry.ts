import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is admin
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    // Platform-wide queries using service role (no tenant filters)
    const [companies, subscriptions, plans, users] = await Promise.all([
      base44.asServiceRole.entities.Company.list(),
      base44.asServiceRole.entities.CompanySubscription.list(),
      base44.asServiceRole.entities.SubscriptionPlan.list(),
      base44.asServiceRole.entities.User.list(),
    ]);

    // Enrich tenant data
    const enriched = companies.map(c => {
      const sub = subscriptions.find(s => s.company_id === c.id);
      const plan = sub ? plans.find(p => p.id === sub.plan_id) : null;
      const companyUsers = users.filter(u => u.company_id === c.id);
      
      return {
        ...c,
        subscription: sub,
        plan,
        userCount: companyUsers.length,
        tenantAdmin: companyUsers.find(u => u.role === 'company_admin')?.email || '—',
      };
    });

    // Calculate platform metrics
    const mrr = subscriptions.reduce((sum, s) => sum + (s.mrr || 0), 0);
    const activeCount = subscriptions.filter(s => s.status === 'active').length;
    const trialCount = subscriptions.filter(s => s.status === 'trial').length;
    const atRiskCount = subscriptions.filter(s => 
      s.status === 'past_due' || s.cancel_at_period_end
    ).length;
    const suspendedCount = subscriptions.filter(s => s.status === 'suspended').length;
    const enterpriseCount = subscriptions.filter(s => 
      plans.find(p => p.id === s.plan_id)?.name === 'Enterprise'
    ).length;

    return Response.json({
      tenants: enriched,
      metrics: {
        totalTenants: companies.length,
        activeTenants: activeCount,
        mrr,
        atRisk: atRiskCount,
        trial: trialCount,
        totalUsers: users.length,
        suspended: suspendedCount,
        enterprise: enterpriseCount,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});