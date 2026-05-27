import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 });
    }

    const { companyId, planId, billingCycle } = await req.json();

    if (!companyId || !planId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const subscriptions = await base44.entities.CompanySubscription.filter({ company_id: companyId });
    
    if (subscriptions[0]) {
      await base44.entities.CompanySubscription.update(subscriptions[0].id, {
        plan_id: planId,
        billing_cycle: billingCycle || 'monthly',
      });

      await base44.entities.TenantActivationLog.create({
        company_id: companyId,
        event_type: 'plan_assigned',
        description: `Plan updated to ${planId}`,
        performed_by: user.email,
      });
    } else {
      await base44.entities.CompanySubscription.create({
        company_id: companyId,
        plan_id: planId,
        billing_cycle: billingCycle || 'monthly',
        status: 'trial',
        trial_start: new Date().toISOString().split('T')[0],
        trial_end: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      });

      await base44.entities.TenantActivationLog.create({
        company_id: companyId,
        event_type: 'plan_assigned',
        description: `New subscription created with plan ${planId}`,
        performed_by: user.email,
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});