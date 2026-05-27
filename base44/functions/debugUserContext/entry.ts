import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('=== DEBUG USER CONTEXT ===');
    console.log('User ID:', user.id);
    console.log('User Email:', user.email);
    console.log('User Role:', user.role);
    console.log('User company_id (legacy):', user.company_id || user.data?.company_id);

    // Load tenant memberships
    const memberships = await base44.asServiceRole.entities.TenantMembership.filter({
      user_id: user.id,
      status: 'active',
    });

    console.log('Tenant Memberships:', memberships.length);
    memberships.forEach((m, i) => {
      console.log(`  [${i}] Tenant ID: ${m.tenant_id}, Role: ${m.tenant_role}, Primary: ${m.is_primary}`);
    });

    // Get primary membership
    const primaryMembership = memberships.find(m => m.is_primary) || memberships[0];

    // Load company if membership exists
    let company = null;
    if (primaryMembership) {
      company = await base44.asServiceRole.entities.Company.get(primaryMembership.tenant_id);
      console.log('Primary Company:', company?.name);
      console.log('Company setup_completed:', company?.setup_completed);
    }

    // Load subscription
    let subscription = null;
    if (company) {
      const subs = await base44.asServiceRole.entities.CompanySubscription.filter({
        company_id: company.id,
        status: 'active',
      });
      subscription = subs[0] || null;
      if (subscription) {
        console.log('Subscription:', subscription.plan_id, subscription.status);
      }
    }

    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        company_id: user.company_id || user.data?.company_id,
      },
      memberships: memberships.map(m => ({
        tenant_id: m.tenant_id,
        tenant_role: m.tenant_role,
        is_primary: m.is_primary,
        status: m.status,
      })),
      primary_membership: primaryMembership ? {
        tenant_id: primaryMembership.tenant_id,
        tenant_role: primaryMembership.tenant_role,
        is_primary: primaryMembership.is_primary,
      } : null,
      company: company ? {
        id: company.id,
        name: company.name,
        setup_completed: company.setup_completed,
        status: company.status,
      } : null,
      subscription: subscription ? {
        plan_id: subscription.plan_id,
        status: subscription.status,
      } : null,
      context_type: primaryMembership ? 'tenant' : (['admin', 'developer'].includes(user.role) ? 'platform' : 'unresolved'),
    });
  } catch (error) {
    console.error('debugUserContext error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});