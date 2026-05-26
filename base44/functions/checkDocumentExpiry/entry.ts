import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Alert thresholds: 30 days, 7 days, 1 day
    const thresholds = [30, 7, 1];

    const docs = await base44.asServiceRole.entities.Document.list();
    const clients = await base44.asServiceRole.entities.Client.list();
    const clientMap = {};
    clients.forEach(c => { clientMap[c.id] = c; });

    const alerts = [];

    for (const doc of docs) {
      if (!doc.expiration_date) continue;

      const expDate = new Date(doc.expiration_date);
      expDate.setHours(0, 0, 0, 0);
      const diffDays = Math.round((expDate - today) / (1000 * 60 * 60 * 24));

      if (!thresholds.includes(diffDays)) continue;

      const client = doc.client_id ? clientMap[doc.client_id] : null;

      // Notify admin (all users with admin role)
      const users = await base44.asServiceRole.entities.User.list();
      const admins = users.filter(u => u.role === 'admin' && u.email);

      for (const admin of admins) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          from_name: 'Codex Solution — Archivio',
          to: admin.email,
          subject: `⚠️ Documento in scadenza tra ${diffDays} giorno${diffDays === 1 ? '' : 'i'}: ${doc.title}`,
          body: `Attenzione!\n\nIl documento seguente scade tra ${diffDays} giorno${diffDays === 1 ? '' : 'i'}.\n\n` +
            `📄 Documento: ${doc.title}\n` +
            `🗂️ Tipo: ${doc.type || '—'}\n` +
            `📅 Scadenza: ${expDate.toLocaleDateString('it-IT')}\n` +
            (client ? `👤 Cliente: ${client.name}${client.company_name ? ` — ${client.company_name}` : ''}\n` : '') +
            `\nAccedi al gestionale per rinnovare o aggiornare il documento.\n\nTeam Codex Solution`
        });
        alerts.push({ doc: doc.title, days: diffDays, admin: admin.email });
      }

      // Also notify client if they have email and doc is expiring in 7 or 30 days
      if (client && client.email && (diffDays === 30 || diffDays === 7)) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          from_name: 'Codex Solution',
          to: client.email,
          subject: `Documento in scadenza: ${doc.title}`,
          body: `Gentile ${client.name},\n\n` +
            `Le comunichiamo che il documento "${doc.title}" è in scadenza tra ${diffDays} giorni (${expDate.toLocaleDateString('it-IT')}).\n\n` +
            `Per il rinnovo o per qualsiasi informazione non esiti a contattarci.\n\nCordiali saluti,\nTeam Codex Solution`
        });
      }
    }

    return Response.json({ checked: docs.length, alerts_sent: alerts.length, alerts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});