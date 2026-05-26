import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const projects = await base44.asServiceRole.entities.Project.list();
    let updated = 0;

    for (const project of projects) {
      const revenue = project.contract_value || 0;
      const totalCosts = (project.material_costs || 0) + (project.labor_costs || 0) + (project.other_costs || 0);
      const grossMargin = revenue - totalCosts;
      const grossMarginPct = revenue > 0 ? (grossMargin / revenue) * 100 : 0;

      await base44.asServiceRole.entities.Project.update(project.id, {
        gross_margin: grossMargin,
        gross_margin_pct: parseFloat(grossMarginPct.toFixed(2)),
        actual_costs: totalCosts,
      });
      
      updated++;
    }

    return Response.json({ 
      message: `Aggiornati ${updated} progetti con margini calcolati`,
      updated 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});