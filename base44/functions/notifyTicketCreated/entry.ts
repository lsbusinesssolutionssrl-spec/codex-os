import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const ticket = payload.data;
    if (!ticket) return Response.json({ ok: true });

    // Get client info
    let clientEmail = null;
    let clientName = 'Cliente';
    if (ticket.client_id) {
      const clients = await base44.asServiceRole.entities.Client.filter({ id: ticket.client_id });
      if (clients[0]) {
        clientEmail = clients[0].email;
        clientName = clients[0].name;
      }
    }

    // Get property name
    let propertyName = '';
    if (ticket.property_id) {
      const props = await base44.asServiceRole.entities.Property.filter({ id: ticket.property_id });
      if (props[0]) propertyName = props[0].property_name;
    }

    const priorityEmoji = { Low: '🟢', Medium: '🟡', High: '🟠', Urgent: '🔴' }[ticket.priority] || '⚪';

    // Notify client
    if (clientEmail) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        from_name: 'Codex Solution',
        to: clientEmail,
        subject: `Nuovo ticket aperto: ${ticket.title}`,
        body: `Gentile ${clientName},\n\nAbbiamo ricevuto il suo ticket di assistenza.\n\n` +
          `📋 Titolo: ${ticket.title}\n` +
          `${priorityEmoji} Priorità: ${ticket.priority}\n` +
          `🏠 Proprietà: ${propertyName || '—'}\n` +
          `📌 Tipo: ${ticket.issue_type || '—'}\n\n` +
          `Il nostro team la contatterà il prima possibile.\n\n` +
          `Cordiali saluti,\nTeam Codex Solution`
      });
    }

    return Response.json({ ok: true, notified: clientEmail });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});