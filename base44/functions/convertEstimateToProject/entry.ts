import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || !['admin', 'project_manager', 'sales'].includes(user.role)) {
      return Response.json({ error: 'Accesso non autorizzato' }, { status: 403 });
    }

    const { estimate_id } = await req.json();
    
    if (!estimate_id) {
      return Response.json({ error: 'estimate_id required' }, { status: 400 });
    }

    // Get estimate
    const estimates = await base44.asServiceRole.entities.Estimate.filter({ id: estimate_id });
    if (estimates.length === 0) {
      return Response.json({ error: 'Estimate not found' }, { status: 404 });
    }

    const estimate = estimates[0];

    // Check if already converted
    if (estimate.status === 'Converted to Project') {
      return Response.json({ error: 'Estimate already converted' }, { status: 400 });
    }

    // Create project from estimate
    const project = await base44.asServiceRole.entities.Project.create({
      title: estimate.title,
      client_id: estimate.client_id,
      property_id: estimate.property_id,
      estimate_id: estimate.id,
      status: 'Approved',
      contract_value: estimate.revenue,
      material_costs: estimate.material_cost,
      labor_costs: estimate.labor_cost,
      other_costs: estimate.other_costs,
      estimated_duration: estimate.estimated_duration,
      estimate_type: estimate.estimate_type,
      quality_level: estimate.quality_level,
      notes: estimate.included_works,
      start_date: new Date().toISOString().split('T')[0],
    });

    // Update estimate status
    await base44.asServiceRole.entities.Estimate.update(estimate_id, {
      status: 'Converted to Project'
    });

    // Calculate margins
    const totalCosts = (estimate.material_cost || 0) + (estimate.labor_cost || 0) + (estimate.other_costs || 0);
    const grossMargin = (estimate.revenue || 0) - totalCosts;
    const grossMarginPct = (estimate.revenue || 0) > 0 ? (grossMargin / estimate.revenue) * 100 : 0;

    await base44.asServiceRole.entities.Project.update(project.id, {
      actual_costs: totalCosts,
      gross_margin: grossMargin,
      gross_margin_pct: parseFloat(grossMarginPct.toFixed(2)),
    });

    return Response.json({ 
      message: 'Preventivo convertito in progetto con successo',
      project_id: project.id,
      estimate_id: estimate.id
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});