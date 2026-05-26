import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Authenticate user
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Find client strictly by authenticated email (server-side, not spoofable)
    const allClients = await base44.asServiceRole.entities.Client.list();
    const client = allClients.find(c => c.email?.toLowerCase() === user.email?.toLowerCase());

    if (!client) return Response.json({ client: null });

    // Fetch all data filtered by client_id — server-side only
    const [properties, estimates, tickets, documents] = await Promise.all([
      base44.asServiceRole.entities.Property.filter({ client_id: client.id }),
      base44.asServiceRole.entities.Estimate.filter({ client_id: client.id }),
      base44.asServiceRole.entities.SupportTicket.filter({ client_id: client.id }),
      base44.asServiceRole.entities.Document.filter({ client_id: client.id }),
    ]);

    // Strip sensitive internal fields from estimates
    const safeEstimates = estimates.map(e => ({
      id: e.id,
      title: e.title,
      status: e.status,
      estimate_type: e.estimate_type,
      quality_level: e.quality_level,
      revenue: e.revenue,
      estimated_duration: e.estimated_duration,
      included_works: e.included_works,
      excluded_works: e.excluded_works,
      payment_terms: e.payment_terms,
      created_date: e.created_date,
    }));

    // Strip internal cost fields from tickets
    const safeTickets = tickets.map(t => ({
      id: t.id,
      title: t.title,
      issue_type: t.issue_type,
      priority: t.priority,
      status: t.status,
      assigned_technician: t.assigned_technician,
      notes: t.notes,
      created_date: t.created_date,
    }));

    return Response.json({
      client: {
        id: client.id,
        name: client.name,
        company_name: client.company_name,
        email: client.email,
        phone: client.phone,
      },
      properties,
      estimates: safeEstimates,
      tickets: safeTickets,
      documents,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});