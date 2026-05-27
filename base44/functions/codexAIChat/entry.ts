import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── Role-based data access policy ───────────────────────────────────────────
// Field-level: which entity fields to strip before injecting into the LLM prompt
const ROLE_RESTRICTIONS = {
  client:          ['contract_value','approved_variations','material_costs','labor_costs','gross_margin','gross_margin_pct','total_invoiced','total_collected','other_costs'],
  technician:      ['contract_value','approved_variations','gross_margin','gross_margin_pct','total_invoiced','total_collected','material_costs','labor_costs','other_costs'],
  sales:           ['gross_margin','gross_margin_pct','material_costs','labor_costs','other_costs'],
  project_manager: [],
  admin:           [],
  company_admin:   [],
};

// Context-level: which data categories to completely exclude by role
const ROLE_FORBIDDEN_CONTEXT = {
  client:     ['financialAlerts','intelligenceInsights','projectCostsRecent','timesheets','suppliers','memories','focusedCosts','focusedTimesheets'],
  technician: ['financialAlerts','intelligenceInsights','projectCostsRecent','estimates','guardians'],
  sales:      ['financialAlerts','intelligenceInsights','projectCostsRecent','timesheets'],
  project_manager: [],
  admin:           [],
  company_admin:   [],
};

// Actions each role is allowed to suggest
const ROLE_ALLOWED_ACTIONS = {
  admin:           null, // all
  company_admin:   null,
  project_manager: ['create_task','create_checklist','create_ticket','assign_technician','generate_report','summarize_project','generate_meeting_notes','generate_handover'],
  sales:           ['create_estimate_draft','suggest_pricing','summarize_project'],
  technician:      ['create_task','create_checklist','create_ticket'],
  user:            ['create_task','create_ticket'],
  client:          [],
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
  // Memory retrieval — multi-link: collect memories scoped to this conversation's context
  const memoryFilters = [{ is_active: true, company_id: user.company_id }];
  // Add focused-entity filters
  if (hintProjectId)  memoryFilters.push({ is_active: true, project_id: hintProjectId });
  if (hintClientId)   memoryFilters.push({ is_active: true, client_id: hintClientId });
  if (hintPropertyId) memoryFilters.push({ is_active: true, property_id: hintPropertyId });

  const [projects, tickets, estimates, clients, ...memoryBatches] = await Promise.all([
    base44.entities.Project.list('-updated_date', 10),
    base44.entities.SupportTicket.filter({ status: 'Open' }, '-created_date', 10),
    base44.entities.Estimate.list('-updated_date', 8),
    base44.entities.Client.list('-updated_date', 10),
    ...memoryFilters.map(f =>
      base44.asServiceRole.entities.AIMemory.filter(f, '-relevance_score', 15).catch(() => [])
    ),
  ]);

  // Deduplicate and sort memories by relevance
  const memoryMap = new Map();
  for (const batch of memoryBatches) {
    for (const m of batch) memoryMap.set(m.id, m);
  }
  const memories = [...memoryMap.values()]
    .sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
    .slice(0, 25);

  const [tasks, maintenance, knowledge, properties, suppliers] = await Promise.all([
    base44.entities.Task.filter({ status: 'In Progress' }, '-updated_date', 5).catch(() => []),
    base44.entities.MaintenanceSchedule.list('-next_due_date', 5).catch(() => []),
    base44.entities.KnowledgeBase.list('-created_date', 10).catch(() => []),
    base44.entities.Property.list('-updated_date', 10).catch(() => []),
    base44.entities.Supplier.list('-updated_date', 8).catch(() => []),
  ]);

  const forbidden = ROLE_FORBIDDEN_CONTEXT[role] || [];
  const canSee = (key) => !forbidden.includes(key);

  const [guardians, checklists, documents, timesheets, financialAlerts, intelligenceInsights, projectCostsRecent] = await Promise.all([
    base44.entities.GuardianSubscription.filter({ status: 'Active' }, '-created_date', 5).catch(() => []),
    base44.entities.ChecklistItem.filter({ status: 'Blocked' }, '-updated_date', 5).catch(() => []),
    base44.entities.Document.list('-created_date', 8).catch(() => []),
    canSee('timesheets') ? base44.entities.Timesheet.list('-date', 5).catch(() => []) : Promise.resolve([]),
    canSee('financialAlerts') ? base44.entities.FinancialAlert.filter({ resolved: false }, '-created_date', 5).catch(() => []) : Promise.resolve([]),
    canSee('intelligenceInsights') ? base44.entities.IntelligenceInsight.filter({ is_read: false }, '-created_date', 5).catch(() => []) : Promise.resolve([]),
    canSee('projectCostsRecent') ? base44.entities.ProjectCost.list('-date', 5).catch(() => []) : Promise.resolve([]),
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
        canSee('focusedCosts') ? base44.entities.ProjectCost.filter({ project_id: hintProjectId }, '-date', 15).catch(() => []) : Promise.resolve([]),
        canSee('focusedTimesheets') ? base44.entities.Timesheet.filter({ project_id: hintProjectId }, '-date', 10).catch(() => []) : Promise.resolve([]),
        base44.entities.SupportTicket.filter({ property_id: propId || '' }, '-created_date', 5).catch(() => []),
        base44.entities.Document.filter({ project_id: hintProjectId }, '-created_date', 10).catch(() => []),
        base44.entities.ChecklistItem.filter({ project_id: hintProjectId }, '-updated_date', 10).catch(() => []),
        clientId && canSee('estimates') ? base44.entities.Estimate.filter({ client_id: clientId }, '-created_date', 5).catch(() => []) : Promise.resolve([]),
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

  // ── CONTEXT ENGINE — Phase 3: RAG Retrieval ──────────────────
  // Search indexed chunks for relevant context before answering
  let ragChunks = [];
  let ragContext = '';
  try {
    const ragResult = await base44.functions.invoke('ragSearch', {
      query: message,
      top_k: 6,
      min_score: 0.12,
      project_id: hintProjectId || null,
      client_id: hintClientId || null,
      property_id: hintPropertyId || null,
    });
    ragChunks = ragResult?.results || [];
    ragContext = ragResult?.rag_context || '';
    if (ragChunks.length) contextEntityList.push('rag_documents');
  } catch { /* RAG non bloccante */ }

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

  // Update access_count for used memories (fire-and-forget)
  if (memories.length > 0) {
    const topMemoryIds = memories.slice(0, 5).map(m => m.id);
    Promise.all(
      topMemoryIds.map(id => base44.asServiceRole.entities.AIMemory.update(id, {
        access_count: (memories.find(m => m.id === id)?.access_count || 0) + 1,
        last_accessed: new Date().toISOString(),
      }).catch(() => {}))
    );
  }

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

DOCUMENTI INDICIZZATI (RAG) — ${ragChunks.length} frammenti rilevanti recuperati:
${ragContext || 'Nessun documento indicizzato corrisponde alla domanda.'}

AI MEMORY (${memories.length} memorie — scoped a questo contesto):

KNOWLEDGE BASE (${knowledge.length} articoli):
${knowledge.map(k => `• [${k.category}] ${k.title}: Prob: ${truncate(k.problem, 80)} → Sol: ${truncate(k.solution, 80)}`).join('\n') || 'Nessun articolo KB.'}

--- REGOLE DI RISPOSTA E SICUREZZA DATI ---
${{  
  admin: '✅ Accesso completo a tutti i dati.',
  company_admin: '✅ Accesso completo a tutti i dati.',
  project_manager: '🔒 Non rivelare: dati Super Admin, configurazioni sistema, piani di abbonamento, costi aziendali aggregati non legati ai propri progetti.',
  sales: '🔒 NON rivelare mai: margini operativi interni, costi di manodopera/materiali, alert finanziari, intelligence insights, timesheet, dati Super Admin, configurazioni sistema. Puoi parlare di preventivi, clienti e opportunità commerciali.',
  technician: '🔒 NON rivelare mai: valori contrattuali, margini, fatturato, incassato, costi interni, preventivi economici, intelligence insights, alert finanziari, dati di altri utenti. Parla SOLO di: attività operative, checklist, ticket, manutenzioni, istruzioni tecniche.',
  client: '🚫 ACCESSO ESTREMAMENTE LIMITATO. NON rivelare MAI: costi interni, margini, fatturato, fornitori, timesheet, preventivi di altri clienti, intelligence insights, dati del team, configurazioni aziendali. Mostra SOLO: stato avanzamento propri progetti, propri documenti, propri ticket, informazioni tecniche sulla propria proprietà.',
}[role] || '🔒 Accesso limitato — mostra solo dati operativi di base.'}

REGOLA ASSOLUTA: Se la domanda riguarda argomenti fuori dal tuo perimetro di ruolo, rispondi: "Queste informazioni non sono disponibili per il tuo profilo di accesso."
REGOLA ASSOLUTA: Non ragionare ad alta voce su dati che non puoi mostrare. Se un dato è riservato, non menzionarlo nemmeno indirettamente.

Rispondi SEMPRE in italiano, in modo preciso, operativo e conciso.
Quando suggerisci azioni, elencale chiaramente come azioni confermate dall'utente.
Cita le fonti dai dati interni quando pertinente (es. "Dal progetto X...", "Secondo il ticket Y...").
Se non hai dati sufficienti, dillo chiaramente invece di inventare.
Se citi informazioni da documenti indicizzati (RAG), indica la fonte con [Fonte: tipo - titolo].

USO MEMORIA:
- Le memorie sono ordinate per rilevanza e scoped al contesto attuale.
- Se noti nuove informazioni utili da memorizzare (preferenza, lezione, pattern), integralo nella risposta.
- Usa le memorie storiche per personalizzare le risposte (es. preferenze note del cliente, problemi ricorrenti).

AZIONI DISPONIBILI PER QUESTO RUOLO (suggeriscile quando appropriato — tutte richiedono conferma esplicita):
${(() => {
  const allActions = [
    { type: 'create_estimate_draft', label: 'Crea bozza preventivo' },
    { type: 'create_task', label: 'Crea task' },
    { type: 'create_ticket', label: 'Crea ticket supporto' },
    { type: 'create_checklist', label: 'Crea checklist' },
    { type: 'assign_technician', label: 'Assegna tecnico' },
    { type: 'generate_report', label: 'Genera report progetto' },
    { type: 'summarize_project', label: 'Riassumi stato progetto' },
    { type: 'suggest_pricing', label: 'Suggerisci prezzi' },
    { type: 'generate_handover', label: 'Genera report consegna' },
    { type: 'generate_meeting_notes', label: 'Genera verbale riunione' },
    { type: 'update_homepassport', label: 'Aggiorna Home Passport' },
  ];
  const allowed = ROLE_ALLOWED_ACTIONS[role];
  const visible = allowed === null ? allActions : allActions.filter(a => allowed.includes(a.type));
  if (visible.length === 0) return 'Nessuna azione disponibile per questo ruolo.';
  return visible.map(a => `- ${a.type}: ${a.label}`).join('\n');
})()}

NON suggerire azioni che il tuo ruolo non può eseguire.

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

  // ── Auto-extract and save new memories (fire-and-forget) ────────
  if (role !== 'client' && textResponse && textResponse.length > 100) {
    (async () => {
      try {
        const extractionPrompt = `Analizza questo scambio e identifica SOLO informazioni NUOVE da memorizzare (preferenze cliente, lezioni, pattern, soluzioni, problemi ricorrenti). Se non ci sono, rispondi con memories:[].
Domanda: ${message}
Risposta: ${truncate(textResponse, 400)}`;
        const extracted = await base44.integrations.Core.InvokeLLM({
          prompt: extractionPrompt,
          response_json_schema: {
            type: 'object',
            properties: {
              memories: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    memory_type: { type: 'string' },
                    title: { type: 'string' },
                    content: { type: 'string' },
                    tags: { type: 'array', items: { type: 'string' } },
                    relevance_score: { type: 'number' },
                  }
                }
              }
            }
          },
        });
        for (const mem of (extracted?.memories || []).slice(0, 3)) {
          if (!mem.title || !mem.content) continue;
          const existing = await base44.asServiceRole.entities.AIMemory.filter({ company_id: user.company_id, memory_type: mem.memory_type }, '-created_date', 5).catch(() => []);
          const dup = existing.find(m => m.title?.toLowerCase() === mem.title?.toLowerCase());
          if (dup) {
            base44.asServiceRole.entities.AIMemory.update(dup.id, { content: mem.content, relevance_score: Math.min(1, (dup.relevance_score||0.7)+0.05), access_count: (dup.access_count||0)+1, last_accessed: new Date().toISOString() }).catch(() => {});
          } else {
            base44.asServiceRole.entities.AIMemory.create({ company_id: user.company_id, memory_type: mem.memory_type||'operational_lesson', title: mem.title, content: mem.content, client_id: hintClientId||null, property_id: hintPropertyId||null, project_id: hintProjectId||null, linked_entity_type: hintProjectId?'project':hintClientId?'client':hintPropertyId?'property':'tenant', linked_entity_id: hintProjectId||hintClientId||hintPropertyId||user.company_id||'', tags: mem.tags||[], relevance_score: mem.relevance_score||0.75, confidence: 0.8, source: 'ai_chat', access_count: 0, last_accessed: new Date().toISOString(), is_active: true }).catch(() => {});
          }
        }
      } catch {}
    })();
  }

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