import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { project_id } = await req.json();
    
    const [project, costs, checklists, timesheets] = await Promise.all([
      base44.entities.Project.filter({ id: project_id }),
      base44.entities.ProjectCost.filter({ project_id }),
      base44.entities.ChecklistItem.filter({ project_id }),
      base44.entities.Timesheet.filter({ project_id }),
    ]);

    if (!project[0]) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const p = project[0];
    const totalCosts = costs.reduce((sum, c) => sum + (c.total_cost || 0), 0);
    const completedChecklists = checklists.filter(c => c.status === 'Done').length;
    const totalHours = timesheets.reduce((sum, t) => sum + (t.hours || 0), 0);

    // Generate insights
    const marginPct = p.gross_margin_pct || 0;
    const performance = marginPct >= 35 ? 'eccellente' : marginPct >= 25 ? 'buona' : 'da migliorare';
    
    const lessonsLearned = {
      project_id,
      project_type: p.estimate_type || 'Generic',
      category: p.quality_level || 'Standard',
      square_meters: 0, // Would need property data
      revenue: p.contract_value || 0,
      estimated_costs: p.material_costs + p.labor_costs + p.other_costs || 0,
      actual_costs: totalCosts,
      estimated_duration: p.estimated_duration || '—',
      actual_duration: '—', // Would need actual dates
      gross_margin: (p.contract_value || 0) - totalCosts,
      gross_margin_pct: marginPct,
      estimate_accuracy_pct: 0, // Would need estimate comparison
      duration_accuracy_pct: 0,
      cost_accuracy_pct: totalCosts > 0 ? Math.min(100, ((p.material_costs + p.labor_costs + p.other_costs || totalCosts) / totalCosts) * 100) : 0,
      customer_satisfaction: 0, // Would need survey
      what_went_well: `Progetto completato con margine ${performance} (${marginPct.toFixed(1)}%). ${completedChecklists} attività completate.`,
      what_went_wrong: marginPct < 25 ? 'Margine inferiore al target del 35%. Rivedere pricing o ottimizzare costi.' : 'Nessuna criticità significativa.',
      improvements: marginPct < 35 
        ? '1. Ottimizzare selezione fornitori\n2. Migliorare stima costi iniziali\n3. Monitorare ore lavorate in tempo reale'
        : 'Mantenere approccio corrente. Documentare best practices.',
      would_repeat: marginPct >= 35,
      team_members: p.team_members || [],
      suppliers_involved: [...new Set(costs.map(c => c.supplier_id).filter(Boolean))],
      notes: `Generato automaticamente al ${new Date().toLocaleDateString('it-IT')}`,
    };

    const created = await base44.entities.ProjectLearning.create(lessonsLearned);

    // Also create knowledge base entry if margin was exceptional or poor
    if (marginPct >= 40 || marginPct < 20) {
      await base44.entities.KnowledgeBase.create({
        title: `${p.title} - ${marginPct >= 40 ? 'Best Practice' : 'Lessons Learned'}`,
        category: p.estimate_type || 'Other',
        project_id,
        problem: marginPct < 20 ? 'Margine critico (<20%)' : 'Come ottenere margine eccellente (≥40%)',
        cause: marginPct < 20 
          ? 'Sottostima costi o pricing non ottimale' 
          : 'Pricing accurato + ottimizzazione costi + efficienza team',
        solution: marginPct < 20
          ? '1. Rivedere pricing strategy\n2. Negoziazione fornitori\n3. Monitoraggio ore'
          : '1. Preventivo dettagliato\n2. Team esperto\n3. Monitoraggio continuo',
        recommendations: marginPct < 20
          ? 'Implementare review pricing prima di accettare progetti simili'
          : 'Replicare questo approccio su progetti simili',
        lessons_learned: `Margine finale: ${marginPct.toFixed(1)}%. Costi totali: €${totalCosts.toLocaleString('it-IT')}. Ore lavorate: ${totalHours}h.`,
        tags: [p.estimate_type, marginPct >= 40 ? 'best-practice' : 'improvement-needed', p.quality_level].filter(Boolean),
      });
    }

    // Generate intelligence insight
    if (marginPct < 25) {
      await base44.entities.IntelligenceInsight.create({
        insight_type: 'Profitability',
        category: 'Project Completed',
        severity: marginPct < 15 ? 'Critical' : 'High',
        title: `Progetto completato con margine critico: ${p.title}`,
        description: `Il progetto "${p.title}" è stato completato con un margine del ${marginPct.toFixed(1)}%, significativamente sotto il target del 35%.`,
        recommendation: 'Analizzare cause root e implementare azioni correttive per progetti futuri simili.',
        impact: `Perdita opportunità: €${((p.contract_value || 0) * 0.35 - (p.contract_value || 0) + totalCosts).toFixed(0)}`,
        metrics: { value: marginPct, trend: 'down', change_pct: marginPct - 35 },
        project_id,
        is_actionable: true,
      });
    } else if (marginPct >= 40) {
      await base44.entities.IntelligenceInsight.create({
        insight_type: 'Opportunity',
        category: 'Best Practice',
        severity: 'Low',
        title: `Progetto completato con margine eccellente: ${p.title}`,
        description: `Il progetto "${p.title}" ha raggiunto un margine del ${marginPct.toFixed(1)}%, superiore al target del 35%.`,
        recommendation: 'Documentare best practices e replicare approccio su progetti simili.',
        impact: `Extra margine generato: €${((p.contract_value || 0) * (marginPct/100 - 0.35)).toFixed(0)}`,
        metrics: { value: marginPct, trend: 'up', change_pct: marginPct - 35 },
        project_id,
        is_actionable: true,
      });
    }

    return Response.json({ 
      success: true, 
      projectLearning: created,
      message: 'Project learning generated successfully' 
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});