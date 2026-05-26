import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const ticket = payload.data;
    const oldTicket = payload.old_data;
    if (!ticket || !oldTicket) return Response.json({ ok: true });
    if (ticket.status === oldTicket.status) return Response.json({ skipped: 'no status change' });

    let clientEmail = null;
    let clientName = 'Cliente';
    if (ticket.client_id) {
      const clients = await base44.asServiceRole.entities.Client.filter({ id: ticket.client_id });
      if (clients[0]) { clientEmail = clients[0].email; clientName = clients[0].name; }
    }

    const statusEmoji = { 'Open': '🔴', 'In Progress': '🔧', 'Waiting Client': '⏳', 'Resolved': '✅', 'Closed': '⬛' }[ticket.status] || '📌';

    if (clientEmail) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        from_name: 'Codex Solution',
        to: clientEmail,
        subject: `Aggiornamento ticket: ${ticket.title}`,
        body: `Gentile ${clientName},\n\nIl suo ticket è stato aggiornato.\n\n` +
          `📋 Ticket: ${ticket.title}\n` +
          `${statusEmoji} Nuovo stato: ${ticket.status}\n` +
          (ticket.status === 'Resolved' ? `\n✅ Il problema risulta risolto. Se ha bisogno di ulteriore assistenza non esiti a contattarci.\n` : '') +
          (ticket.status === 'Waiting Client' ? `\n⏳ Stiamo aspettando una sua risposta per procedere.\n` : '') +
          `\nCordiali saluti,\nTeam Codex Solution`
      });
    }

    return Response.json({ ok: true, notified: clientEmail });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});