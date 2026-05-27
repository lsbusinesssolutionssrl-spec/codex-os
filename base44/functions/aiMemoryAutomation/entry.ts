import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * AI Memory Automation - Continuous Learning
 * 
 * Automatically extracts and stores operational knowledge from:
 * - Completed projects (successful patterns, lessons learned)
 * - Accepted/Rejected estimates (pricing patterns)
 * - Resolved tickets (recurring issues, solutions)
 * - Supplier interactions (performance, reliability)
 * - Customer feedback (preferences, satisfaction)
 * 
 * Run as scheduled automation daily.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin user (scheduled task)
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const results = {
      projects_analyzed: 0,
      estimates_analyzed: 0,
      tickets_analyzed: 0,
      memories_created: 0,
      errors: [],
    };

    // 1. Analyze recently completed projects
    const completedProjects = await base44.entities.Project.filter({ 
      status: 'Delivered' 
    });

    for (const project of completedProjects) {
      try {
        // Skip if already processed in last 30 days
        const existingMemories = await base44.entities.AIMemory.filter({
          project_id: project.id,
          memory_type: 'project_history',
        });

        if (existingMemories.length > 0) continue;

        // Calculate project success metrics
        const costs = await base44.entities.ProjectCost.filter({ project_id: project.id });
        const totalCosts = costs.reduce((sum, c) => sum + (c.total_cost || 0), 0);
        const margin = (project.contract_value || 0) - totalCosts;
        const marginPct = (project.contract_value || 0) > 0 
          ? ((margin / project.contract_value) * 100) 
          : 0;

        const checklists = await base44.entities.ChecklistItem.filter({ project_id: project.id });
        const completionRate = checklists.length > 0 
          ? ((checklists.filter(c => c.status === 'Done').length / checklists.length) * 100)
          : 0;

        // Determine if project was successful
        const wasSuccessful = marginPct >= 30 && completionRate >= 90;

        // Extract learnings using LLM
        const learning = await base44.integrations.Core.InvokeLLM({
          prompt: `Analizza questo progetto completato ed estrai lessons learned.

PROGETTO:
${JSON.stringify(project, null, 2)}

METRICHE:
- Margine: ${marginPct.toFixed(1)}%
- Completamento checklist: ${completionRate.toFixed(1)}%
- Costi totali: €${totalCosts.toLocaleString('it-IT')}
- Successo: ${wasSuccessful ? 'SI' : 'NO'}

Estrai:
1. Cosa ha funzionato bene
2. Cosa ha funzionato male
3. Pattern ricorrenti
4. Raccomandazioni per progetti futuri

Output come JSON:
{
  "what_went_well": "string",
  "what_went_wrong": "string",
  "patterns": ["pattern1", "pattern2"],
  "recommendations": "string",
  "should_repeat": boolean
}`,
          response_json_schema: {
            type: 'object',
            properties: {
              what_went_well: { type: 'string' },
              what_went_wrong: { type: 'string' },
              patterns: { type: 'array', items: { type: 'string' } },
              recommendations: { type: 'string' },
              should_repeat: { type: 'boolean' },
            },
            required: ['what_went_well', 'what_went_wrong', 'patterns', 'recommendations', 'should_repeat'],
          },
        });

        // Store memory
        await base44.entities.AIMemory.create({
          memory_type: 'project_history',
          title: `Lessons Learned: ${project.title}`,
          content: JSON.stringify(learning),
          project_id: project.id,
          client_id: project.client_id,
          property_id: project.property_id,
          linked_entity_type: 'project',
          linked_entity_id: project.id,
          tags: learning.patterns,
          relevance_score: wasSuccessful ? 0.9 : 0.6,
          confidence: 0.85,
          source: 'project_close',
          is_active: true,
          company_id: project.company_id,
        });

        results.memories_created++;
      } catch (error) {
        results.errors.push(`Project ${project.id}: ${error.message}`);
      }
    }

    results.projects_analyzed = completedProjects.length;

    // 2. Analyze rejected estimates for pricing patterns
    const rejectedEstimates = await base44.entities.Estimate.filter({ 
      status: 'Rejected',
    });

    for (const estimate of rejectedEstimates) {
      try {
        // Skip if already processed
        const existingMemories = await base44.entities.AIMemory.filter({
          estimate_id: estimate.id,
          memory_type: 'estimate_outcome',
        });

        if (existingMemories.length > 0) continue;

        // Extract rejection learnings
        const learning = await base44.integrations.Core.InvokeLLM({
          prompt: `Analizza questo preventivo rifiutato ed estrai pattern.

PREVENTIVO:
${JSON.stringify(estimate, null, 2)}

Motivo rifiuto: ${estimate.rejection_reason || 'Non specificato'}
Note: ${estimate.rejection_notes || ''}

Estrai:
1. Perché è stato rifiutato
2. Come migliorare pricing futuro
3. Pattern da evitare

Output come JSON:
{
  "rejection_reason_analysis": "string",
  "pricing_recommendations": "string",
  "patterns_to_avoid": ["pattern1", "pattern2"],
  "suggested_improvements": "string"
}`,
          response_json_schema: {
            type: 'object',
            properties: {
              rejection_reason_analysis: { type: 'string' },
              pricing_recommendations: { type: 'string' },
              patterns_to_avoid: { type: 'array', items: { type: 'string' } },
              suggested_improvements: { type: 'string' },
            },
            required: ['rejection_reason_analysis', 'pricing_recommendations', 'patterns_to_avoid', 'suggested_improvements'],
          },
        });

        await base44.entities.AIMemory.create({
          memory_type: 'estimate_outcome',
          title: `Preventivo Rifiutato: ${estimate.title}`,
          content: JSON.stringify(learning),
          estimate_id: estimate.id,
          client_id: estimate.client_id,
          linked_entity_type: 'estimate',
          linked_entity_id: estimate.id,
          tags: learning.patterns_to_avoid,
          relevance_score: 0.8,
          confidence: 0.75,
          source: 'estimate_rejected',
          is_active: true,
          company_id: estimate.company_id,
        });

        results.memories_created++;
      } catch (error) {
        results.errors.push(`Estimate ${estimate.id}: ${error.message}`);
      }
    }

    results.estimates_analyzed = rejectedEstimates.length;

    // 3. Analyze resolved tickets for recurring issues
    const resolvedTickets = await base44.entities.SupportTicket.filter({ 
      status: 'Resolved',
    });

    for (const ticket of resolvedTickets) {
      try {
        // Group by issue type and property
        const existingMemories = await base44.entities.AIMemory.filter({
          property_id: ticket.property_id,
          memory_type: 'recurring_issue',
        });

        // Only create memory if this is a recurring issue (3+ tickets same type)
        const similarTickets = await base44.entities.SupportTicket.filter({
          property_id: ticket.property_id,
          issue_type: ticket.issue_type,
        });

        if (similarTickets.length < 3) continue;
        if (existingMemories.length > 0) continue;

        await base44.entities.AIMemory.create({
          memory_type: 'recurring_issue',
          title: `Problema Ricorrente: ${ticket.issue_type}`,
          content: JSON.stringify({
            issue_type: ticket.issue_type,
            property_id: ticket.property_id,
            occurrences: similarTickets.length,
            resolution_notes: ticket.notes,
          }),
          property_id: ticket.property_id,
          client_id: ticket.client_id,
          linked_entity_type: 'ticket',
          linked_entity_id: ticket.id,
          tags: [ticket.issue_type, 'recurring'],
          relevance_score: 0.85,
          confidence: 0.9,
          source: 'ticket_resolved',
          is_active: true,
          company_id: ticket.company_id,
        });

        results.memories_created++;
      } catch (error) {
        results.errors.push(`Ticket ${ticket.id}: ${error.message}`);
      }
    }

    results.tickets_analyzed = resolvedTickets.length;

    return Response.json({
      success: true,
      results,
      message: `AI Memory Automation completata: ${results.memories_created} nuove memorie create`,
    });
  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});