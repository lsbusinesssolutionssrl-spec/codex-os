import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verifica admin
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projects = await base44.asServiceRole.entities.Project.list();
    
    // Trova progetti con margine critico (< 25%)
    const criticalProjects = projects.filter(p => 
      (p.gross_margin_pct || 0) < 25 && 
      ['In Progress', 'Approved'].includes(p.status)
    );

    if (criticalProjects.length === 0) {
      return Response.json({ message: 'Nessun margine critico', alerts: [] });
    }

    const alerts = [];
    
    for (const project of criticalProjects) {
      const client = await base44.asServiceRole.entities.Client.filter({ id: project.client_id }).then(r => r[0]);
      
      if (!client || !client.email) continue;

      const subject = `⚠️ Alert Margine Critico - ${project.title}`;
      const body = `
        <h2>Alert Margine Critico</h2>
        <p>Il progetto <strong>${project.title}</strong> ha un margine critico.</p>
        
        <h3>Dettagli:</h3>
        <ul>
          <li><strong>Margine Attuale:</strong> ${project.gross_margin_pct?.toFixed(1) || 0}%</li>
          <li><strong>Valore Contratto:</strong> €${(project.contract_value || 0).toLocaleString('it-IT')}</li>
          <li><strong>Costi Totali:</strong> €${((project.material_costs || 0) + (project.labor_costs || 0) + (project.other_costs || 0)).toLocaleString('it-IT')}</li>
          <li><strong>Stato:</strong> ${project.status}</li>
        </ul>
        
        <p><strong>Raccomandazione:</strong> Rivedi urgentemente i costi o negozia variazioni con il cliente.</p>
        
        <p style="color: #666; font-size: 12px;">
          Questo alert è stato generato automaticamente dal sistema Codex Intelligence.
        </p>
      `;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email, // Invia all'admin
        subject,
        body,
      });

      alerts.push({
        project_id: project.id,
        project_title: project.title,
        margin: project.gross_margin_pct,
        client_email: client.email,
      });
    }

    return Response.json({ 
      message: `Inviati ${alerts.length} alert`,
      alerts 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});