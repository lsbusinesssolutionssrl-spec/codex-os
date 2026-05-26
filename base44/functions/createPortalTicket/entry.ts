import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, issue_type, priority, notes, property_id } = await req.json();
    if (!title) return Response.json({ error: 'Title is required' }, { status: 400 });

    // Find client by authenticated email (server-side only)
    const allClients = await base44.asServiceRole.entities.Client.list();
    const client = allClients.find(c => c.email?.toLowerCase() === user.email?.toLowerCase());
    if (!client) return Response.json({ error: 'Client not found' }, { status: 404 });

    const ticket = await base44.asServiceRole.entities.SupportTicket.create({
      title,
      client_id: client.id,
      property_id: property_id || null,
      issue_type: issue_type || 'Other',
      priority: priority || 'Medium',
      status: 'Open',
      notes: notes || '',
    });

    return Response.json({ ticket });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});