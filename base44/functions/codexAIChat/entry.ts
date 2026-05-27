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

  // context_hint can carry { project_id, client_id, property_id } from frontend
  const hintProjectId = context_hint?.project_id;
  const hintClientId = context_hint?.client_id;
  const hintPropertyId = context_hint?.property_id;

  const role = user.role || 'user';
  const contextEntityList = [];

  // ── Gather Context — Full Platform ──────────────────────────────
  const [projects, tickets, estimates, clients, memories] = await Promise.all([
    base44.entities.Project.list('-updated_date', 8),
    base44.entities.SupportTicket.filter({ status: 'Open' }, '-created_date', 8),
    base44.entities.Estimate.list('-updated_date', 5),
    base44.entities.Client.list('-updated_date', 10),
    base44.asServiceRole.entities.AIMemory.filter({ is_active: true }, '-created_date', 15),
  ]);

  const [tasks, maintenance, knowledge, properties, suppliers] = await Promise.all([
    base44.entities.Task.filter({ status: 'In Progress' }, '-updated_date', 5).catch(() => []),
    base44.entities.MaintenanceSchedule.list('-next_due_date', 5).catch(() => []),
    base44.entities.KnowledgeBase.list('-created_date', 8).catch(() => []),
    base44.entities.Property.list('-updated_date', 5).catch(() => []),
    base44.entities.Supplier.list('-updated_date', 5).catch(() => []),
  ]);

  const [guardians, checklists, documents] = await Promise.all([
    base44.entities.GuardianSubscription.filter({ status: 'Active' }, '-created_date', 5).catch(() => []),
    base44.entities.ChecklistItem.filter({ status: 'Blocked' }, '-updated_date', 5).catch(() => []),
    base44.entities.Document.list('-created_date', 5).catch(() => []),
  ]);

  // Targeted context if hint provided
  let focusedProject = null, focusedClient = null, focusedProperty = null;
  let focusedCosts = [], focusedTickets = [];
  if (hintProjectId) {
    [focusedProject, focusedCosts, focusedTickets] = await Promise.all([
      base44.entities.Project.get(hintProjectId).catch(() => null),
      base44.entities.ProjectCost.filter({ project_id: hintProjectId }, '-date', 10).catch(() => []),
      base44.entities.SupportTicket.filter({ project_id: hintProjectId }, '-created_date', 5).catch(() => []),
    ]);
    if (focusedProject) focusedProject = sanitizeForRole(focusedProject, role);
  }
  if (hintClientId) focusedClient = await base44.entities.Client.get(hintClientId).catch(() => null);
  if (hintPropertyId) focusedProperty = await base44.entities.Property.get(hintPropertyId).catch(() => null);

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

  // ── Build System Prompt ─────────────────────────────────────────
  const today = new Date().toLocaleDateString('it-IT');

  const systemPrompt = `Sei Codex AI, l'assistente operativo intelligente di Codex OS — piattaforma enterprise per costruzioni, ristrutturazioni, impianti e manutenzione.

DATA OGGI: ${today}
UTENTE: ${user.full_name} (${user.email}) — Ruolo: ${role}
TENANT: ${user.company_id || 'default'}

--- CONTESTO OPERATIVO ATTUALE ---

${focusedProject ? `PROGETTO IN FOCUS:
• [${focusedProject.status}] ${focusedProject.title}
  PM: ${focusedProject.project_manager || '—'} | Inizio: ${focusedProject.start_date || '—'} | Fine prevista: ${focusedProject.expected_end_date || '—'}
  ${role === 'admin' || role === 'project_manager' ? `Valore: €${focusedProject.contract_value?.toLocaleString('it-IT') || '—'} | Costi: €${(focusedProject.material_costs || 0) + (focusedProject.labor_costs || 0)} | Note: ${truncate(focusedProject.notes, 200)}` : ''}
  Costi recenti (${focusedCosts.length}): ${focusedCosts.slice(0,3).map(c => `${c.description} €${c.total_cost}`).join(', ') || '—'}
  Ticket progetto: ${focusedTickets.map(t => `[${t.priority}] ${t.title}`).join(', ') || 'nessuno'}
` : ''}
${focusedClient ? `CLIENTE IN FOCUS: ${focusedClient.name} — ${focusedClient.email} — ${focusedClient.phone || '—'}
` : ''}
${focusedProperty ? `PROPRIETÀ IN FOCUS: ${focusedProperty.property_name} — ${focusedProperty.address || '—'} — ${focusedProperty.type || '—'} ${focusedProperty.square_meters ? focusedProperty.square_meters + 'mq' : ''}
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