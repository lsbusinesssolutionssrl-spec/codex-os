import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const estimate = payload.data;
    const oldEstimate = payload.old_data;
    if (!estimate || !oldEstimate) return Response.json({ ok: true });
    if (estimate.status === oldEstimate.status) return Response.json({ skipped: 'no status change' });

    // Only notify on meaningful outbound statuses
    const notifyStatuses = ['Sent', 'Accepted', 'Rejected', 'Expired'];
    if (!notifyStatuses.includes(estimate.status)) return Response.json({ skipped: 'status not notifiable' });

    let clientEmail = null;
    let clientName = 'Cliente';
    if (estimate.client_id) {
      const clients = await base44.asServiceRole.entities.Client.filter({ id: estimate.client_id });
      if (clients[0]) { clientEmail = clients[0].email; clientName = clients[0].name; }
    }

    const statusMessages = {
      'Sent': { emoji: '📤', msg: 'Il suo preventivo è pronto e disponibile per la sua revisione.' },
      'Accepted': { emoji: '🎉', msg: 'Il preventivo è stato accettato. Il team Codex Solution inizierà a pianificare i lavori.' },
      'Rejected': { emoji: '❌', msg: 'Il preventivo è stato rifiutato. Per qualsiasi chiarimento siamo a sua disposizione.' },
      'Expired': { emoji: '⏰', msg: 'Il preventivo è scaduto. Contatti il team per ricevere una nuova offerta aggiornata.' },
    };
    const { emoji, msg } = statusMessages[estimate.status];

    if (clientEmail) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        from_name: 'Codex Solution',
        to: clientEmail,
        subject: `Preventivo "${estimate.title}" — ${estimate.status}`,
        body: `Gentile ${clientName},\n\n${emoji} ${msg}\n\n` +
          `📋 Preventivo: ${estimate.title}\n` +
          `💰 Importo: €${(estimate.revenue || 0).toLocaleString('it-IT')}\n` +
          (estimate.estimate_type ? `🔧 Tipo: ${estimate.estimate_type}\n` : '') +
          `\nPer qualsiasi informazione non esiti a contattarci.\n\nCordiali saluti,\nTeam Codex Solution`
      });
    }

    return Response.json({ ok: true, notified: clientEmail });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});