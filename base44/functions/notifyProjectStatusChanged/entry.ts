import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const project = payload.data;
    const oldProject = payload.old_data;
    if (!project || !oldProject) return Response.json({ ok: true });
    if (project.status === oldProject.status) return Response.json({ skipped: 'no status change' });

    const notifyStatuses = ['In Progress', 'Testing', 'Delivered', 'Guardian Active'];
    if (!notifyStatuses.includes(project.status)) return Response.json({ skipped: 'status not notifiable' });

    let clientEmail = null;
    let clientName = 'Cliente';
    if (project.client_id) {
      const clients = await base44.asServiceRole.entities.Client.filter({ id: project.client_id });
      if (clients[0]) { clientEmail = clients[0].email; clientName = clients[0].name; }
    }

    const statusMessages = {
      'In Progress': { emoji: '🔨', msg: 'I lavori sono ufficialmente iniziati.' },
      'Testing': { emoji: '🧪', msg: 'I lavori sono completati e sono in corso i collaudi finali.' },
      'Delivered': { emoji: '🏁', msg: 'Il progetto è stato completato e consegnato con successo.' },
      'Guardian Active': { emoji: '🛡️', msg: 'L\'abbonamento Guardian è attivo. Il suo immobile è ora sotto monitoraggio Codex.' },
    };
    const { emoji, msg } = statusMessages[project.status];

    if (clientEmail) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        from_name: 'Codex Solution',
        to: clientEmail,
        subject: `Aggiornamento progetto: ${project.title}`,
        body: `Gentile ${clientName},\n\n${emoji} ${msg}\n\n` +
          `📁 Progetto: ${project.title}\n` +
          `📊 Stato: ${project.status}\n` +
          (project.expected_end_date ? `📅 Data fine prevista: ${new Date(project.expected_end_date).toLocaleDateString('it-IT')}\n` : '') +
          `\nPer qualsiasi informazione il suo project manager è a disposizione.\n\nCordiali saluti,\nTeam Codex Solution`
      });
    }

    return Response.json({ ok: true, notified: clientEmail });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});