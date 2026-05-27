import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { estimate_id, action, client_comments } = await req.json();
    if (!estimate_id || !['approve', 'reject'].includes(action)) {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Verify this estimate belongs to the authenticated client
    const allClients = await base44.asServiceRole.entities.Client.list();
    const client = allClients.find(c => c.email?.toLowerCase() === user.email?.toLowerCase());
    if (!client) return Response.json({ error: 'Client not found' }, { status: 403 });

    const estimate = await base44.asServiceRole.entities.Estimate.get(estimate_id);
    if (!estimate || estimate.client_id !== client.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only allow action on Sent estimates
    if (estimate.status !== 'Sent') {
      return Response.json({ error: 'Estimate is not in Sent status' }, { status: 400 });
    }

    const newStatus = action === 'approve' ? 'Accepted' : 'Rejected';
    const updateData = {
      status: newStatus,
      client_comments: client_comments || '',
      signed_at: action === 'approve' ? new Date().toISOString() : null,
    };

    const updated = await base44.asServiceRole.entities.Estimate.update(estimate_id, updateData);

    return Response.json({ success: true, estimate: { id: updated.id, status: updated.status } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});