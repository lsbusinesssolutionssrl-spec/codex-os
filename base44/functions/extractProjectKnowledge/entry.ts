/**
 * extractProjectKnowledge
 * Triggered when a project is marked as Delivered or Archived.
 * Extracts lessons learned, pricing patterns, successful workflows,
 * recurring problems, and supplier insights → saves to KnowledgeBase + AIMemory.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  // Support both direct call { project_id } and entity automation payload { event: { entity_id }, data: {...} }
  const project_id = body.project_id || body.event?.entity_id || body.data?.id;
  if (!project_id) return Response.json({ error: 'project_id required' }, { status: 400 });

  // For entity automations: only process when status is Delivered or Archived
  const triggerStatus = body.data?.status;
  if (triggerStatus && !['Delivered', 'Archived'].includes(triggerStatus)) {
    return Response.json({ skipped: true, reason: `Status ${triggerStatus} not a close event` });
  }

  // Fetch project + related data
  const [project, costs, timesheets, tickets, checklists] = await Promise.all([
    base44.entities.Project.get(project_id),
    base44.entities.ProjectCost.filter({ project_id }),
    base44.entities.Timesheet.filter({ project_id }),
    base44.entities.SupportTicket.filter({ property_id: project?.property_id || '' }, '-created_date', 20).catch(() => []),
    base44.entities.ChecklistItem.filter({ project_id }),
  ]);

  if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });

  // Build context for AI extraction
  const totalCosts = costs.reduce((s, c) => s + (c.total_cost || 0), 0);
  const totalHours = timesheets.reduce((s, t) => s + (t.hours || 0), 0);
  const completedChecks = checklists.filter(c => c.status === 'Done').length;
  const totalChecks = checklists.length;
  const resolvedTickets = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;

  const projectSummary = `
Progetto: ${project.title}
Tipo: ${project.estimate_type || 'N/A'}
Qualità: ${project.quality_level || 'N/A'}
Status finale: ${project.status}
Valore contratto: €${project.contract_value || 0}
Costi reali totali: €${totalCosts}
Margine reale: €${(project.contract_value || 0) - totalCosts} (${project.contract_value ? Math.round(((project.contract_value - totalCosts) / project.contract_value) * 100) : 0}%)
Ore totali lavorate: ${totalHours}
Checklist completate: ${completedChecks}/${totalChecks}
Ticket risolti: ${resolvedTickets}
Note del progetto: ${project.notes || 'Nessuna nota'}
Data inizio: ${project.start_date || 'N/A'}
Data fine effettiva: ${project.actual_end_date || 'N/A'}
Data fine prevista: ${project.expected_end_date || 'N/A'}
`;

  const extractionPrompt = `Sei un sistema di estrazione della conoscenza operativa per un'azienda di costruzioni e manutenzione.

Analizza questo progetto completato e estrai:
1. COSA HA FUNZIONATO BENE (max 3 punti)
2. COSA NON HA FUNZIONATO (max 3 punti)
3. LEZIONI APPRESE (max 3 punti)
4. PATTERN DI PREZZO (considera il tipo progetto, qualità, valore contratto vs costi)
5. RACCOMANDAZIONI PER PROGETTI SIMILI (max 3 punti)
6. PROBLEMI RICORRENTI EVIDENZIATI

DATI PROGETTO:
${projectSummary}

Rispondi in JSON con questa struttura:
{
  "what_went_well": "...",
  "what_went_wrong": "...",
  "lessons_learned": "...",
  "pricing_pattern": "...",
  "recommendations": "...",
  "recurring_problems": "...",
  "kb_title": "Titolo breve per Knowledge Base",
  "kb_category": "Bathroom|Full Home|Electrical|Networking|Security|Roofing|Waterproofing|HVAC|Customer Management|Financial",
  "memory_insights": [
    {"type": "operational_lesson", "title": "...", "content": "..."},
    {"type": "pricing_pattern", "title": "...", "content": "..."}
  ]
}`;

  const extracted = await base44.integrations.Core.InvokeLLM({
    prompt: extractionPrompt,
    response_json_schema: {
      type: 'object',
      properties: {
        what_went_well: { type: 'string' },
        what_went_wrong: { type: 'string' },
        lessons_learned: { type: 'string' },
        pricing_pattern: { type: 'string' },
        recommendations: { type: 'string' },
        recurring_problems: { type: 'string' },
        kb_title: { type: 'string' },
        kb_category: { type: 'string' },
        memory_insights: { type: 'array', items: { type: 'object' } },
      },
    },
  });

  const results = { kb_entry: null, memories: [], project_id };

  // Save ProjectLearning entry
  const margin = project.contract_value
    ? Math.round(((project.contract_value - totalCosts) / project.contract_value) * 100)
    : 0;
  await base44.asServiceRole.entities.ProjectLearning.create({
    company_id: project.company_id,
    project_id,
    project_type: project.estimate_type || 'Generic',
    category: extracted.kb_category || 'Full Home',
    square_meters: project.square_meters || null,
    revenue: project.contract_value || 0,
    estimated_costs: (project.material_costs || 0) + (project.labor_costs || 0) + (project.other_costs || 0),
    actual_costs: totalCosts,
    gross_margin: (project.contract_value || 0) - totalCosts,
    gross_margin_pct: margin,
    what_went_well: extracted.what_went_well || '',
    what_went_wrong: extracted.what_went_wrong || '',
    improvements: extracted.recommendations || '',
    notes: extracted.lessons_learned || '',
    team_members: project.team_members || [],
  }).catch(() => {});

  // Save to KnowledgeBase
  const kb = await base44.asServiceRole.entities.KnowledgeBase.create({
    company_id: project.company_id,
    title: extracted.kb_title || `Lessons Learned: ${project.title}`,
    category: extracted.kb_category || 'Full Home',
    project_id,
    problem: extracted.what_went_wrong || 'N/A',
    cause: extracted.recurring_problems || 'N/A',
    solution: extracted.what_went_well || 'N/A',
    recommendations: extracted.recommendations || '',
    lessons_learned: extracted.lessons_learned || '',
    is_active: true,
  });
  results.kb_entry = kb.id;

  // Save AI Memories
  const memoryInsights = extracted.memory_insights || [];
  if (extracted.pricing_pattern) {
    memoryInsights.push({ type: 'pricing_pattern', title: `Pricing: ${project.estimate_type || project.title}`, content: extracted.pricing_pattern });
  }

  for (const insight of memoryInsights.slice(0, 5)) {
    const mem = await base44.asServiceRole.entities.AIMemory.create({
      company_id: project.company_id,
      memory_type: insight.type || 'operational_lesson',
      linked_entity_type: 'project',
      linked_entity_id: project_id,
      title: insight.title || `Insight: ${project.title}`,
      content: insight.content || '',
      source: 'project_close',
      relevance_score: 0.8,
      is_active: true,
      tags: [project.estimate_type, project.quality_level].filter(Boolean),
    });
    results.memories.push(mem.id);
  }

  // Audit log
  await base44.asServiceRole.entities.AIAuditLog.create({
    user_email: user.email,
    user_role: user.role,
    session_id: `knowledge_extraction_${project_id}`,
    prompt: `Knowledge extraction for project: ${project.title}`,
    context_used: ['project', 'costs', 'timesheets', 'checklists'],
    response_summary: `Extracted ${results.memories.length} memories + 1 KB entry`,
    actions_executed: [{ type: 'knowledge_extraction', project_id }],
    context_entities: ['project', 'knowledge_base', 'ai_memory'],
  }).catch(() => {});

  return Response.json({
    success: true,
    extracted,
    results,
    message: `Estratti ${results.memories.length} insight AI + 1 articolo Knowledge Base dal progetto "${project.title}"`,
  });
});