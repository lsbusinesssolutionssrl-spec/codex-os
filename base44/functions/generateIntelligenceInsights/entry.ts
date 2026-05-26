import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const projects = await base44.asServiceRole.entities.Project.list();
    const learnings = await base44.asServiceRole.entities.ProjectLearning.list();
    const insights = [];

    // Genera insight per ogni progetto con margine critico
    for (const project of projects) {
      const marginPct = project.gross_margin_pct || 0;
      
      if (marginPct < 25) {
        insights.push({
          insight_type: 'Profitability',
          category: 'Financial',
          severity: marginPct < 15 ? 'Critical' : 'High',
          title: `Margine Critico: ${project.title}`,
          description: `Il progetto ha un margine del ${marginPct.toFixed(1)}%, sotto la soglia del 25%`,
          recommendation: 'Rivedere i costi o negoziare variazioni con il cliente',
          impact: `Perdita potenziale di €${(project.contract_value * 0.1).toFixed(0)}`,
          metrics: {
            value: marginPct,
            trend: 'down',
            change_pct: -5
          },
          project_id: project.id,
          is_actionable: true,
        });
      }
    }

    // Genera insight basati sui lessons learned
    for (const learning of learnings) {
      if (learning.what_went_wrong && learning.improvements) {
        insights.push({
          insight_type: 'Trend',
          category: learning.category,
          severity: 'Medium',
          title: `Learning: ${learning.project_type}`,
          description: learning.what_went_wrong,
          recommendation: learning.improvements,
          impact: 'Miglioramento processi futuri',
          metrics: {
            value: learning.gross_margin_pct,
            trend: learning.would_repeat ? 'up' : 'stable',
            change_pct: 0
          },
          project_id: learning.project_id,
          is_actionable: true,
        });
      }
    }

    // Crea gli insight
    const created = await base44.asServiceRole.entities.IntelligenceInsight.bulkCreate(insights);

    return Response.json({ 
      message: `Generati ${created.length} intelligence insight`,
      count: created.length 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});