import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Role-based field filters
const ROLE_RESTRICTIONS = {
  client: ['contract_value','approved_variations','material_costs','labor_costs','gross_margin','gross_margin_pct','total_invoiced','total_collected'],
  technician: ['contract_value','gross_margin','gross_margin_pct','total_invoiced','total_collected','approved_variations'],
  sales: [],
  project_manager: [],
  admin: [],
};

function sanitizeForRole(obj, role) {
  if (!obj || typeof obj !== 'object') return obj;
  const restricted = ROLE_RESTRICTIONS[role] || [];
  if (restricted.length === 0) return obj;
  const clean = { ...obj };
  restricted.forEach(f => delete clean[f]);
  return clean;
}

function truncate(str, max = 300) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

Deno.serve(async (req) => {
  const startMs = Date.now();
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { message, session_id, context_hint } = await req.json();
  if (!message) return Response.json({ error: 'message required' }, { status: 400 });

  // Context Engine — supports { project_id, client_id, property_id, estimate_id }
  const hintProjectId = context_hint?.project_id;
  const hintClientId = context_hint?.client_id;
  const hintPropertyId = context_hint?.property_id;
  const hintEstimateId = context_hint?.estimate_id;

  const role = user.role || 'user';
  const contextEntityList = [];

  // ── CONTEXT ENGINE — Phase 1: Global Platform Snapshot ───────────────
  const [projects, tickets, estimates, clients, memories] = await Promise.all([
    base44.entities.Project.list('-updated_date', 10),
    base44.entities.SupportTicket.filter({ status: 'Open' }, '-created_date', 10),
    base44.entities.Estimate.list('-updated_date', 8),
    base44.entities.Client.list('-updated_date', 10),
    base44.asServiceRole.entities.AIMemory.filter({ is_active: true }, '-created_date', 20),
  ]);

  const [tasks, maintenance, knowledge, properties, suppliers] = await Promise.all([
    base44.entities.Task.filter({ status: 'In Progress' }, '-updated_date', 5).catch(() => []),
    base44.entities.MaintenanceSchedule.list('-next_due_date', 5).catch(() => []),
    base44.entities.KnowledgeBase.list('-created_date', 10).catch(() => []),
    base44.entities.Property.list('-updated_date', 10).catch(() => []),
    base44.entities.Supplier.list('-updated_date', 8).catch(() => []),
  ]);

  const [guardians, checklists, documents, timesheets, financialAlerts, intelligenceInsights, projectCostsRecent] = await Promise.all([
    base44.entities.GuardianSubscription.filter({ status: 'Active' }, '-created_date', 5).catch(() => []),
    base44.entities.ChecklistItem.filter({ status: 'Blocked' }, '-updated_date', 5).catch(() => []),
    base44.entities.Document.list('-created_date', 8).catch(() => []),
    base44.entities.Timesheet.list('-date', 5).catch(() => []),
    base44.entities.FinancialAlert.filter({ resolved: false }, '-created_date', 5).catch(() => []),
    base44.entities.IntelligenceInsight.filter({ is_read: false }, '-created_date', 5).catch(() => []),
    base44.entities.ProjectCost.list('-date', 5).catch(() => []),
  ]);

  // ── CONTEXT ENGINE — Phase 2: Deep Entity Graph (when focus hint provided) ──
  // Each focus type traverses the full relationship graph for that entity.
  let focusedProject = null, focusedClient = null, focusedProperty = null, focusedEstimate = null;
  let focusedCosts = [], focusedTimesheets = [], focusedProjectTickets = [];
  let focusedProjectDocs = [], focusedProjectChecklists = [], focusedProjectEstimates = [];
  let focusedClientProperties = [], focusedClientProjects = [], focusedClientTickets = [], focusedClientGuardian = [];
  let focusedPropertyDocs = [], focusedPropertyProjects = [], focusedPropertyTickets = [];

  if (hintProjectId) {
    // Project focus: full graph — costs, timesheets, tickets, documents, checklists, related estimates
    const proj = await base44.entities.Project.get(hintProjectId).catch(() => null);
    if (proj) {
      focusedProject = sanitizeForRole(proj, role);
      const clientId = proj.client_id;
      const propId = proj.property_id;
      [
        focusedCosts, focusedTimesheets, focusedProjectTickets,
        focusedProjectDocs, focusedProjectChecklists, focusedProjectEstimates,
      ] = await Promise.all([
        base44.entities.ProjectCost.filter({ project_id: hintProjectId }, '-date', 15).catch(() => []),
        base44.entities.Timesheet.filter({ project_id: hintProjectId }, '-date', 10).catch(() => []),
        base44.entities.SupportTicket.filter({ property_id: propId || '' }, '-created_date', 5).catch(() => []),
        base44.entities.Document.filter({ project_id: hintProjectId }, '-created_date', 10).catch(() => []),
        base44.entities.ChecklistItem.filter({ project_id: hintProjectId }, '-updated_date', 10).catch(() => []),
        clientId ? base44.entities.Estimate.filter({ client_id: clientId }, '-created_date', 5).catch(() => []) : Promise.resolve([]),
      ]);
    }
  }

  if (hintClientId) {
    // Client focus: all their properties, projects, tickets, guardian
    focusedClient = await base44.entities.Client.get(hintClientId).catch(() => null);
    if (focusedClient) {
      [
        focusedClientProperties, focusedClientProjects,
        focusedClientTickets, focusedClientGuardian,
      ] = await Promise.all([
        base44.entities.Property.filter({ client_id: hintClientId }, '-created_date', 10).catch(() => []),
        base44.entities.Project.filter({ client_id: hintClientId }, '-created_date', 10).catch(() => []),
        base44.entities.SupportTicket.filter({ client_id: hintClientId }, '-created_date', 8).catch(() => []),
        base44.entities.GuardianSubscription.filter({ client_id: hintClientId }, '-created_date', 5).catch(() => []),
      ]);
      focusedClientProjects = focusedClientProjects.map(p => sanitizeForRole(p, role));
    }
  }

  if (hintPropertyId) {
    // Property focus: home passport details, docs, projects at this property, tickets
    focusedProperty = await base44.entities.Property.get(hintPropertyId).catch(() => null);
    if (focusedProperty) {
      [
        focusedPropertyDocs, focusedPropertyProjects, focusedPropertyTickets,
      ] = await Promise.all([
        base44.entities.Document.filter({ property_id: hintPropertyId }, '-created_date', 10).catch(() => []),
        base44.entities.Project.filter({ property_id: hintPropertyId }, '-created_date', 10).catch(() => []),
        base44.entities.SupportTicket.filter({ property_id: hintPropertyId }, '-created_date', 8).catch(() => []),
      ]);
      focusedPropertyProjects = focusedPropertyProjects.map(p => sanitizeForRole(p, role));
    }
  }

  if (hintEstimateId) {
    focusedEstimate = await base44.entities.Estimate.get(hintEstimateId).catch(() => null);
    if (focusedEstimate) focusedEstimate = sanitizeForRole(focusedEstimate, role);
  }

  const sanitizedProjects = projects.map(p => sanitizeForRole(p, role));
  const sanitizedEstimates = estimates.map(e => sanitizeForRole(e, role));

  if (projects.length) contextEntityList.push('projects');
  if (tickets.length) contextEntityList.push('tickets');
  if (estimates.length) contextEntityList.push('estimates');
  if (clients.length) contextEntityList.push('clients');
  if (memories.length) contextEntityList.push('ai_memory');
  if (properties.length) contextEntityList.push('properties');
  if (guardians.length) contextEntityList.push('guardian');
  if (suppliers.length) contextEntityList.push('suppliers');
  if (knowledge.length) contextEntityList.push('knowledge_base');
  if (focusedProject) contextEntityList.push('focused_project');
  if (focusedProject) contextEntityList.push('focused_project');
  if (focusedCosts.length) contextEntityList.push('project_financials');
  if (focusedTimesheets.length) contextEntityList.push('project_timesheets');
  if (focusedProjectDocs.length) contextEntityList.push('project_documents');
  if (focusedProjectChecklists.length) contextEntityList.push('project_checklists');
  if (focusedProjectEstimates.length) contextEntityList.push('project_estimates_history');
  if (focusedClient) contextEntityList.push('focused_client');
  if (focusedClientProperties.length) contextEntityList.push('client_properties');
  if (focusedClientProjects.length) contextEntityList.push('client_projects');
  if (focusedProperty) contextEntityList.push('focused_property_homepassport');
  if (focusedPropertyDocs.length) contextEntityList.push('property_documents');
  if (focusedEstimate) contextEntityList.push('focused_estimate');
  if (timesheets.length) contextEntityList.push('timesheets');
  if (financialAlerts.length) contextEntityList.push('financial_alerts');
  if (intelligenceInsights.length) contextEntityList.push('intelligence');

  // ── Build System Prompt ─────────────────────────────────────────
  const today = new Date().toLocaleDateString('it-IT');

  // Build context graph summary for system prompt
  const hasDeepContext = focusedProject || focusedClient || focusedProperty || focusedEstimate;

  const systemPrompt = `Sei Codex AI, l'assistente operativo intelligente di Codex OS — piattaforma enterprise per costruzioni, ristrutturazioni, impianti e manutenzione.

DATA OGGI: ${today}
UTENTE: ${user.full_name} (${user.email}) — Ruolo: ${role}
TENANT: ${user.company_id || 'default'}
CONTESSTO ATTIVO: ${hasDeepContext ? 'DEEP FOCUS — dati completi entità selezionata' : 'GLOBAL SNAPSHOT — panoramica piattaforma'}

--- CONTESTO OPERATIVO ATTUALE ---

${focusedEstimate ? `PREVENTIVO IN FOCUS:
${focusedEstimate.title} [${focusedEstimate.status}] | Tipo: ${focusedEstimate.estimate_type || '—'} | ${focusedEstimate.revenue && role === 'admin' ? '€' + focusedEstimate.revenue?.toLocaleString('it-IT') : ''}
Clientei: ${focusedEstimate.client_id} | Qualità: ${focusedEstimate.quality_level || '—'}
Lavori inclusi: ${truncate(focusedEstimate.included_works, 200) || '—'}
Note: ${truncate(focusedEstimate.notes, 150) || '—'}
` : ''}
${focusedProject ? `PROGETTO IN FOCUS:
• [${focusedProject.status}] ${focusedProject.title}
  PM: ${focusedProject.project_manager || '—'} | Inizio: ${focusedProject.start_date || '—'} | Fine prevista: ${focusedProject.expected_end_date || '—'} | Stato: ${focusedProject.status}
  ${role === 'admin' || role === 'project_manager' ? `Valore: €${focusedProject.contract_value?.toLocaleString('it-IT') || '—'} | Fatturato: €${focusedProject.total_invoiced || 0} | Incassato: €${focusedProject.total_collected || 0}\n  Note: ${truncate(focusedProject.notes, 300) || '—'}` : ''}
  --- COSTI PROGETTO (${focusedCosts.length} voci):
  ${focusedCosts.map(c => `  ${c.cost_type}: ${c.description} €${c.total_cost} (${c.date || '—'})`).join('\n  ') || '  Nessun costo registrato.'}
  --- TIMESHEET PROGETTO (${focusedTimesheets.length}):
  ${focusedTimesheets.map(t => `  ${t.date}: ${t.hours}h €${t.total_labor_cost || '—'}`).join('\n  ') || '  Nessuna ora registrata.'}
  --- TICKET CORRELATI (${focusedProjectTickets.length}):
  ${focusedProjectTickets.map(t => `  [${t.priority}] ${t.title} — ${t.status}`).join('\n  ') || '  Nessun ticket.'}
  --- DOCUMENTI PROGETTO (${focusedProjectDocs.length}):
  ${focusedProjectDocs.map(d => `  [${d.type}] ${d.title}`).join('\n  ') || '  Nessun documento.'}
  --- CHECKLIST PROGETTO (${focusedProjectChecklists.length} item):
  ${focusedProjectChecklists.map(c => `  [${c.status}] ${c.title}`).join('\n  ') || '  Nessuna checklist.'}
  --- PREVENTIVI STORICI CLIENTE (${focusedProjectEstimates.length}):
  ${focusedProjectEstimates.map(e => `  [${e.status}] ${e.title}${e.revenue && role==='admin' ? ' €'+e.revenue : ''}`).join('\n  ') || '  Nessuno.'}
` : ''}
${focusedClient ? `CLIENTE IN FOCUS: ${focusedClient.name} | Email: ${focusedClient.email} | Tel: ${focusedClient.phone || '—'} | Tipo: ${focusedClient.type || '—'}
  Note: ${truncate(focusedClient.notes, 200) || '—'}
  --- PROPRIETÀ CLIENTE (${focusedClientProperties.length}):
  ${focusedClientProperties.map(p => `  ${p.property_name} — ${p.address || '—'} (${p.type || '—'} ${p.square_meters ? p.square_meters + 'mq' : ''})`).join('\n  ') || '  Nessuna proprietà.'}
  --- PROGETTI CLIENTE (${focusedClientProjects.length}):
  ${focusedClientProjects.map(p => `  [${p.status}] ${p.title}${p.contract_value && role==='admin' ? ' €'+p.contract_value.toLocaleString('it-IT') : ''}`).join('\n  ') || '  Nessun progetto.'}
  --- TICKET CLIENTE (${focusedClientTickets.length}):
  ${focusedClientTickets.map(t => `  [${t.priority}][${t.status}] ${t.title}`).join('\n  ') || '  Nessun ticket.'}
  --- GUARDIAN CLIENTE (${focusedClientGuardian.length}):
  ${focusedClientGuardian.map(g => `  [${g.status}] €${g.monthly_price || '—'}/mese`).join('\n  ') || '  Nessun contratto Guardian.'}
` : ''}
${focusedProperty ? `PROPRIETÀ IN FOCUS — HOME PASSPORT: ${focusedProperty.property_name} | ${focusedProperty.address || '—'} | ${focusedProperty.type || '—'} ${focusedProperty.square_meters ? focusedProperty.square_meters + 'mq' : ''}
  Anno costruzione: ${focusedProperty.year_built || '—'}
  Impianto elettrico: ${truncate(focusedProperty.electrical_notes, 200) || 'Nessuna nota'}
  Idraulico: ${truncate(focusedProperty.plumbing_notes, 200) || 'Nessuna nota'}
  Riscaldamento/raffrescamento: ${truncate(focusedProperty.heating_cooling_notes, 150) || 'Nessuna nota'}
  Networking: ${truncate(focusedProperty.networking_notes, 150) || 'Nessuna nota'}
  Sicurezza: ${truncate(focusedProperty.security_notes, 150) || 'Nessuna nota'}
  Finestre/porte: ${truncate(focusedProperty.windows_doors_notes, 150) || 'Nessuna nota'}
  --- DOCUMENTI PROPRIETÀ (${focusedPropertyDocs.length}):
  ${focusedPropertyDocs.map(d => `  [${d.type}] ${d.title}`).join('\n  ') || '  Nessun documento.'}
  --- PROGETTI PROPRIETÀ (${focusedPropertyProjects.length}):
  ${focusedPropertyProjects.map(p => `  [${p.status}] ${p.title} — ${p.actual_end_date || p.expected_end_date || 'in corso'}`).join('\n  ') || '  Nessun progetto.'}
  --- TICKET PROPRIETÀ (${focusedPropertyTickets.length}):
  ${focusedPropertyTickets.map(t => `  [${t.priority}][${t.status}] ${t.title}`).join('\n  ') || '  Nessun ticket.'}
` : ''}
PROGETTI ATTIVI (${sanitizedProjects.length}):
${sanitizedProjects.map(p => `• [${p.status}] ${p.title} — PM: ${p.project_manager || '—'} | Scadenza: ${p.expected_end_date || '—'}${p.contract_value && role !== 'technician' && role !== 'client' ? ` | €${p.contract_value.toLocaleString('it-IT')}` : ''}`).join('\n') || 'Nessun progetto.'}

TICKET APERTI (${tickets.length}):
${tickets.map(t => `• [${t.priority}] ${t.title} — Tecnico: ${t.assigned_technician || 'non assegnato'} | Tipo: ${t.issue_type || '—'}`).join('\n') || 'Nessun ticket aperto.'}

PREVENTIVI RECENTI (${sanitizedEstimates.length}):
${sanitizedEstimates.map(e => `• [${e.status}] ${e.title} | Tipo: ${e.estimate_type || '—'}${e.revenue && role === 'admin' ? ` — €${e.revenue?.toLocaleString('it-IT')}` : ''}`).join('\n') || 'Nessun preventivo.'}

CLIENTI (${clients.length}):
${clients.map(c => `• ${c.name}${c.company_name ? ` (${c.company_name})` : ''} — ${c.email || ''}`).join('\n') || 'Nessun cliente.'}

PROPRIETÀ (${properties.length}):
${properties.map(p => `• ${p.property_name} — ${p.address || '—'} (${p.type || '—'})`).join('\n') || 'Nessuna proprietà.'}

GUARDIAN ATTIVI (${guardians.length}):
${guardians.map(g => `• Sub ${g.id} — €${g.monthly_price || '—'}/mese`).join('\n') || 'Nessun contratto Guardian attivo.'}

FORNITORI (${suppliers.length}):
${suppliers.map(s => `• ${s.name} — ${s.category} | Rating: ${s.rating || '—'}/5`).join('\n') || 'Nessun fornitore.'}

CHECKLIST BLOCCATE (${checklists.length}):
${checklists.map(c => `• ${c.title} — Progetto: ${c.project_id || '—'}`).join('\n') || 'Nessuna checklist bloccata.'}

DOCUMENTI RECENTI (${documents.length}):
${documents.map(d => `• [${d.type}] ${d.title}`).join('\n') || 'Nessun documento recente.'}

HOME PASSPORT — PROPRIETA' DETTAGLIO:
${properties.slice(0,3).map(p => `• ${p.property_name}: elettrico=${truncate(p.electrical_notes,60)||'—'} | idraulico=${truncate(p.plumbing_notes,60)||'—'} | rete=${truncate(p.networking_notes,60)||'—'}`).join('\n') || 'Nessun dato Home Passport.'}

CONTROLLO FINANZIARIO:
${role === 'admin' || role === 'project_manager' ? `Alert attivi (${financialAlerts.length}): ${financialAlerts.map(a => `[${a.severity}] ${a.alert_type}: ${truncate(a.message,80)}`).join(' | ') || 'Nessun alert.'}
Costi recenti: ${projectCostsRecent.map(c => `${c.description} €${c.total_cost} (${c.cost_type})`).join(' | ') || '—'}` : '⚠️ Dati finanziari non disponibili per questo ruolo.'}

TIMESHEET RECENTI:
${role !== 'client' ? timesheets.map(t => `• Progetto: ${t.project_id} | ${t.hours}h | ${t.date} | €${t.total_labor_cost || '—'}`).join('\n') || 'Nessun timesheet recente.' : '—'}

INTELLIGENCE INSIGHTS NON LETTI (${intelligenceInsights.length}):
${intelligenceInsights.map(i => `• [${i.severity}] ${i.insight_type}: ${i.title} — ${truncate(i.description,100)}`).join('\n') || 'Nessun insight pendente.'}

MANUTENZIONI PROGRAMMATE:
${maintenance.map(m => `• ${m.title} — Scadenza: ${m.next_due_date || '—'} — Tecnico: ${m.assigned_technician || '—'}`).join('\n') || 'Nessuna manutenzione.'}

MEMORIA OPERATIVA AI (${memories.length}):
${memories.map(m => `• [${m.memory_type}] ${m.title}: ${truncate(m.content, 150)}`).join('\n') || 'Nessuna memoria.'}

KNOWLEDGE BASE (${knowledge.length} articoli):
${knowledge.map(k => `• [${k.category}] ${k.title}: Prob: ${truncate(k.problem, 80)} → Sol: ${truncate(k.solution, 80)}`).join('\n') || 'Nessun articolo KB.'}

--- REGOLE DI RISPOSTA ---
${role === 'client' ? '⚠️ NON mostrare mai dati finanziari interni, margini, costi operativi o informazioni riservate al cliente.' : ''}
${role === 'technician' ? '⚠️ NON mostrare margini, valori contrattuali o dati finanziari — solo dati operativi e tecnici.' : ''}

Rispondi SEMPRE in italiano, in modo preciso, operativo e conciso.
Quando suggerisci azioni, elencale chiaramente come azioni confermate dall'utente.
Cita le fonti dai dati interni quando pertinente (es. "Dal progetto X...", "Secondo il ticket Y...").
Se non hai dati sufficienti, dillo chiaramente invece di inventare.

AZIONI DISPONIBILI (suggeriscile quando appropriato, richiederanno conferma):
- create_estimate_draft: Crea bozza preventivo
- create_task: Crea task
- create_ticket: Crea ticket supporto
- create_checklist: Crea checklist
- assign_technician: Assegna tecnico
- generate_report: Genera report progetto
- summarize_project: Riassumi stato progetto
- suggest_pricing: Suggerisci prezzi basati su storico
- generate_handover: Genera report consegna
- generate_meeting_notes: Genera verbale riunione
- update_homepassport: Aggiorna Home Passport
- extract_knowledge: Estrai lessons learned da progetto

Quando suggerisci un'azione, includi alla fine della risposta un blocco JSON così:
<actions>
[{"type":"create_task","label":"Crea task","params":{"title":"..."}}]
</actions>`;

  // ── Call LLM ────────────────────────────────────────────────────
  const llmResponse = await base44.integrations.Core.InvokeLLM({
    prompt: `${systemPrompt}\n\n---\nRICHIESTA UTENTE: ${message}`,
    model: 'automatic',
  });

  // Parse actions from response
  let textResponse = llmResponse;
  let suggestedActions = [];
  const actionsMatch = typeof llmResponse === 'string' ? llmResponse.match(/<actions>([\s\S]*?)<\/actions>/) : null;
  if (actionsMatch) {
    try { suggestedActions = JSON.parse(actionsMatch[1]); } catch {}
    textResponse = llmResponse.replace(/<actions>[\s\S]*?<\/actions>/, '').trim();
  }

  const latencyMs = Date.now() - startMs;

  // ── Audit Log ───────────────────────────────────────────────────
  base44.asServiceRole.entities.AIAuditLog.create({
    user_email: user.email,
    user_role: role,
    session_id: session_id || 'unknown',
    prompt: message,
    context_used: contextEntityList,
    response_summary: truncate(textResponse, 500),
    actions_suggested: suggestedActions,
    actions_executed: [],
    latency_ms: latencyMs,
    context_entities: contextEntityList,
  }).catch(() => {});

  return Response.json({
    response: textResponse,
    suggested_actions: suggestedActions,
    context_used: contextEntityList,
    latency_ms: latencyMs,
  });
});