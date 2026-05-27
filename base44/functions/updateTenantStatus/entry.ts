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

    const { companyId, newStatus, reason } = await req.json();

    if (!companyId || !newStatus) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validStatuses = ['active', 'trial', 'suspended', 'cancelled', 'past_due'];
    if (!validStatuses.includes(newStatus)) {
      return Response.json({ error: 'Invalid status' }, { status: 400 });
    }

    const subscriptions = await base44.entities.CompanySubscription.filter({ company_id: companyId });
    if (!subscriptions[0]) {
      return Response.json({ error: 'Subscription not found' }, { status: 404 });
    }

    await base44.entities.CompanySubscription.update(subscriptions[0].id, {
      status: newStatus,
      cancelled_at: newStatus === 'cancelled' ? new Date().toISOString() : null,
      cancel_reason: reason || null,
    });

    await base44.entities.TenantActivationLog.create({
      company_id: companyId,
      event_type: `tenant_${newStatus}`,
      description: `Tenant status changed to ${newStatus}${reason ? `: ${reason}` : ''}`,
      performed_by: user.email,
    });

    return Response.json({ success: true, status: newStatus });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});