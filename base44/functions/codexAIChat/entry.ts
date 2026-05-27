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

  const role = user.role || 'user';
  const contextEntityList = [];

  // ── Gather Context ──────────────────────────────────────────────
  const [projects, tickets, estimates, clients, memories] = await Promise.all([
    base44.entities.Project.list('-updated_date', 5),
    base44.entities.SupportTicket.filter({ status: 'Open' }, '-created_date', 5),
    base44.entities.Estimate.list('-updated_date', 5),
    base44.entities.Client.list('-updated_date', 5),
    base44.asServiceRole.entities.AIMemory.filter({ is_active: true }, '-created_date', 10),
  ]);

  const [tasks, maintenance, knowledge] = await Promise.all([
    base44.entities.Task.filter({ status: 'In Progress' }, '-updated_date', 5).catch(() => []),
    base44.entities.MaintenanceSchedule.list('-next_due_date', 5).catch(() => []),
    base44.entities.KnowledgeBase.list('-created_date', 5).catch(() => []),
  ]);

  const sanitizedProjects = projects.map(p => sanitizeForRole(p, role));
  const sanitizedEstimates = estimates.map(e => sanitizeForRole(e, role));

  if (projects.length) contextEntityList.push('projects');
  if (tickets.length) contextEntityList.push('tickets');
  if (estimates.length) contextEntityList.push('estimates');
  if (clients.length) contextEntityList.push('clients');
  if (memories.length) contextEntityList.push('ai_memory');

  // ── Build System Prompt ─────────────────────────────────────────
  const today = new Date().toLocaleDateString('it-IT');

  const systemPrompt = `Sei Codex AI, l'assistente operativo intelligente di Codex OS — una piattaforma enterprise per aziende di costruzione, ristrutturazione, impianti elettrici, networking e manutenzione.

DATA OGGI: ${today}
UTENTE: ${user.full_name} (${user.email}) — Ruolo: ${role}
TENANT: ${user.company_id || 'default'}

--- CONTESTO OPERATIVO ATTUALE ---

PROGETTI RECENTI (${sanitizedProjects.length}):
${sanitizedProjects.map(p => `• [${p.status}] ${p.title} — PM: ${p.project_manager || '—'} | Scadenza: ${p.expected_end_date || '—'}${p.contract_value && role !== 'technician' && role !== 'client' ? ` | Valore: €${p.contract_value.toLocaleString('it-IT')}` : ''}`).join('\n') || 'Nessun progetto recente.'}

TICKET APERTI (${tickets.length}):
${tickets.map(t => `• [${t.priority}] ${t.title} — Tecnico: ${t.assigned_technician || 'non assegnato'}`).join('\n') || 'Nessun ticket aperto.'}

PREVENTIVI RECENTI (${sanitizedEstimates.length}):
${sanitizedEstimates.map(e => `• [${e.status}] ${e.title}${e.revenue && role === 'admin' ? ` — €${e.revenue?.toLocaleString('it-IT')}` : ''}`).join('\n') || 'Nessun preventivo recente.'}

CLIENTI RECENTI (${clients.length}):
${clients.map(c => `• ${c.name}${c.company_name ? ` (${c.company_name})` : ''} — ${c.email || ''}`).join('\n') || 'Nessun cliente.'}

MANUTENZIONI PROGRAMMATE:
${maintenance.map(m => `• ${m.title} — Scadenza: ${m.next_due_date || '—'} — Tecnico: ${m.assigned_technician || '—'}`).join('\n') || 'Nessuna manutenzione programmata.'}

MEMORIA OPERATIVA AI (${memories.length} elementi):
${memories.map(m => `• [${m.memory_type}] ${m.title}: ${truncate(m.content, 150)}`).join('\n') || 'Nessuna memoria operativa disponibile.'}

KNOWLEDGE BASE (${knowledge.length} articoli):
${knowledge.map(k => `• [${k.category}] ${k.title}: ${truncate(k.problem, 100)}`).join('\n') || 'Nessun articolo in KB.'}

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
- update_homepassport: Aggiorna Home Passport

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