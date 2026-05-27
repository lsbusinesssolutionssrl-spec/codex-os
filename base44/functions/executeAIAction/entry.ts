/**
 * executeAIAction — Secure AI Action Executor
 *
 * Every AI-suggested action must pass through this function.
 * Guarantees: permission validation → execution → audit logging
 *
 * Payload:
 *   action_type: string (required)
 *   params: object — action-specific parameters
 *   session_id: string — chat session ID
 *   confirmed: boolean — must be true (frontend confirms before calling)
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── Permission Matrix ─────────────────────────────────────────────
// role → allowed action_types (null = all)
const PERMISSIONS = {
  admin: null, // all actions
  company_admin: null,
  project_manager: [
    'create_task', 'create_checklist', 'create_ticket',
    'assign_technician', 'generate_report', 'summarize_project',
    'generate_meeting_notes', 'generate_handover',
  ],
  sales: ['create_estimate_draft', 'suggest_pricing', 'summarize_project'],
  technician: ['create_task', 'create_checklist', 'create_ticket'],
  user: ['create_task', 'create_ticket'],
  client: [], // no AI actions for portal clients
};

function isAllowed(role, actionType) {
  const allowed = PERMISSIONS[role];
  if (allowed === null) return true;
  if (!allowed) return false;
  return allowed.includes(actionType);
}

// ── Action Executors ──────────────────────────────────────────────
async function executeAction(base44, actionType, params, user) {
  switch (actionType) {

    case 'create_estimate_draft': {
      const estimate = await base44.entities.Estimate.create({
        title: params.title || 'Bozza Preventivo — AI',
        client_id: params.client_id || null,
        property_id: params.property_id || null,
        estimate_type: params.estimate_type || 'Other',
        quality_level: params.quality_level || 'Smart',
        status: 'Draft',
        notes: params.notes || `Bozza generata da Codex AI — ${new Date().toLocaleDateString('it-IT')}`,
        company_id: user.company_id,
      });
      return { success: true, entity: 'Estimate', id: estimate.id, label: estimate.title };
    }

    case 'create_task': {
      const task = await base44.entities.Task.create({
        title: params.title || 'Task — Codex AI',
        description: params.description || '',
        assigned_to: params.assigned_to || null,
        project_id: params.project_id || null,
        priority: params.priority || 'Medium',
        status: 'To Do',
        due_date: params.due_date || null,
        company_id: user.company_id,
      });
      return { success: true, entity: 'Task', id: task.id, label: task.title };
    }

    case 'create_checklist': {
      const item = await base44.entities.ChecklistItem.create({
        title: params.title || 'Checklist — Codex AI',
        description: params.description || '',
        project_id: params.project_id || null,
        category: params.category || 'Other',
        assigned_person: params.assigned_person || null,
        status: 'To Do',
        company_id: user.company_id,
      });
      return { success: true, entity: 'ChecklistItem', id: item.id, label: item.title };
    }

    case 'create_ticket': {
      const ticket = await base44.entities.SupportTicket.create({
        title: params.title || 'Ticket — Codex AI',
        client_id: params.client_id || null,
        property_id: params.property_id || null,
        issue_type: params.issue_type || 'Other',
        priority: params.priority || 'Medium',
        status: 'Open',
        notes: params.notes || '',
        company_id: user.company_id,
      });
      return { success: true, entity: 'SupportTicket', id: ticket.id, label: ticket.title };
    }

    case 'assign_technician': {
      if (!params.project_id && !params.ticket_id) throw new Error('project_id o ticket_id richiesto');
      if (!params.technician) throw new Error('technician richiesto');
      if (params.project_id) {
        await base44.entities.Project.update(params.project_id, { project_manager: params.technician });
        return { success: true, entity: 'Project', id: params.project_id, label: `Tecnico ${params.technician} assegnato al progetto` };
      } else {
        await base44.entities.SupportTicket.update(params.ticket_id, { assigned_technician: params.technician });
        return { success: true, entity: 'SupportTicket', id: params.ticket_id, label: `Tecnico ${params.technician} assegnato al ticket` };
      }
    }

    case 'generate_report': {
      if (!params.project_id) throw new Error('project_id richiesto');
      const result = await base44.functions.invoke('generateProjectReport', {
        project_id: params.project_id,
        report_type: params.report_type || 'full',
      });
      return { success: true, entity: 'Report', label: 'Report progetto generato', data: result };
    }

    case 'summarize_project': {
      if (!params.project_id) throw new Error('project_id richiesto');
      const project = await base44.entities.Project.get(params.project_id);
      const costs = await base44.entities.ProjectCost.filter({ project_id: params.project_id }, '-date', 20).catch(() => []);
      const tickets = await base44.entities.SupportTicket.filter({ project_id: params.project_id }, '-created_date', 10).catch(() => []);
      const summary = await base44.integrations.Core.InvokeLLM({
        prompt: `Genera un riepilogo operativo conciso per il progetto:
Titolo: ${project.title}
Stato: ${project.status}
PM: ${project.project_manager || '—'}
Inizio: ${project.start_date || '—'} | Fine prevista: ${project.expected_end_date || '—'}
Valore: €${project.contract_value || 0}
Note: ${project.notes || 'nessuna'}
Costi registrati: ${costs.length} voci — totale €${costs.reduce((s, c) => s + (c.total_cost || 0), 0)}
Ticket aperti: ${tickets.filter(t => t.status === 'Open').length}

Includi: stato corrente, punti critici, prossime azioni suggerite. Formato markdown.`,
      });
      return { success: true, entity: 'Project', id: params.project_id, label: 'Riepilogo progetto', summary };
    }

    case 'suggest_pricing': {
      const learnings = await base44.entities.ProjectLearning.list('-created_date', 20).catch(() => []);
      const estimates = await base44.entities.Estimate.filter({ estimate_type: params.estimate_type }, '-created_date', 10).catch(() => []);
      const suggestion = await base44.integrations.Core.InvokeLLM({
        prompt: `Suggerisci un range di prezzo per:
Tipo: ${params.estimate_type || '—'}
Livello qualità: ${params.quality_level || '—'}
Mq: ${params.square_meters || '—'}

Storico preventivi accettati: ${estimates.filter(e => e.status === 'Accepted').length} su ${estimates.length}
Revenue media storica: €${Math.round(estimates.filter(e => e.revenue).reduce((s, e) => s + e.revenue, 0) / (estimates.filter(e => e.revenue).length || 1))}
Learnings disponibili: ${learnings.length}

Rispondi con range prezzo, margine target, e motivazione. Formato markdown.`,
      });
      return { success: true, entity: 'Estimate', label: 'Suggerimento pricing', summary: suggestion };
    }

    case 'generate_meeting_notes': {
      const notes = await base44.integrations.Core.InvokeLLM({
        prompt: `Genera un verbale riunione professionale per:
Oggetto: ${params.subject || 'Riunione operativa'}
Partecipanti: ${params.participants || '—'}
Data: ${params.date || new Date().toLocaleDateString('it-IT')}
Progetto: ${params.project_id || 'Generale'}
Note/agenda: ${params.agenda || '—'}

Includi: apertura, punti discussi, decisioni prese, action items con responsabili e scadenze. Formato markdown.`,
      });
      return { success: true, entity: 'Notes', label: 'Verbale riunione generato', summary: notes };
    }

    case 'generate_handover': {
      if (!params.project_id) throw new Error('project_id richiesto');
      const project = await base44.entities.Project.get(params.project_id);
      const docs = await base44.entities.Document.filter({ project_id: params.project_id }, '-created_date', 20).catch(() => []);
      const checklists = await base44.entities.ChecklistItem.filter({ project_id: params.project_id }, '-updated_date', 20).catch(() => []);
      const report = await base44.integrations.Core.InvokeLLM({
        prompt: `Genera un report di consegna progetto per:
Progetto: ${project.title}
Stato: ${project.status}
Fine reale: ${project.actual_end_date || 'non ancora chiuso'}
Valore contratto: €${project.contract_value || 0}
Documenti allegati: ${docs.map(d => d.title).join(', ') || 'nessuno'}
Checklist completate: ${checklists.filter(c => c.status === 'Done').length}/${checklists.length}
Note: ${project.notes || '—'}

Includi: riepilogo lavori eseguiti, garanzie, manutenzioni programmate, contatti. Formato markdown professionale.`,
      });
      return { success: true, entity: 'Project', id: params.project_id, label: 'Report consegna generato', summary: report };
    }

    case 'update_homepassport': {
      if (!params.property_id) throw new Error('property_id richiesto');
      const updates = {};
      if (params.electrical_notes) updates.electrical_notes = params.electrical_notes;
      if (params.plumbing_notes) updates.plumbing_notes = params.plumbing_notes;
      if (params.networking_notes) updates.networking_notes = params.networking_notes;
      if (params.security_notes) updates.security_notes = params.security_notes;
      if (params.heating_cooling_notes) updates.heating_cooling_notes = params.heating_cooling_notes;
      if (params.notes) updates.notes = params.notes;
      if (Object.keys(updates).length === 0) throw new Error('Nessun campo da aggiornare');
      await base44.entities.Property.update(params.property_id, updates);
      // Re-index home passport for RAG
      base44.functions.invoke('ragIndexDocument', {
        source_type: 'home_passport',
        source_id: params.property_id,
        force_reindex: true,
      }).catch(() => {});
      return { success: true, entity: 'Property', id: params.property_id, label: 'Home Passport aggiornato' };
    }

    default:
      throw new Error(`Azione sconosciuta: ${actionType}`);
  }
}

// ── Main Handler ──────────────────────────────────────────────────
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { action_type, params = {}, session_id = 'unknown', confirmed = false } = body;

  if (!action_type) return Response.json({ error: 'action_type richiesto' }, { status: 400 });
  if (!confirmed) return Response.json({ error: 'Conferma obbligatoria (confirmed: true)' }, { status: 400 });

  const role = user.role || 'user';

  // ── Permission check ────────────────────────────────────────────
  if (!isAllowed(role, action_type)) {
    // Audit the denied attempt
    await base44.asServiceRole.entities.AIAuditLog.create({
      user_email: user.email,
      user_role: role,
      session_id,
      prompt: `ACTION_DENIED: ${action_type}`,
      context_used: ['permission_check'],
      response_summary: `Azione ${action_type} negata per ruolo ${role}`,
      actions_suggested: [],
      actions_executed: [],
      latency_ms: 0,
    }).catch(() => {});
    return Response.json({ error: `Permesso negato: il ruolo "${role}" non può eseguire "${action_type}"` }, { status: 403 });
  }

  // ── Execute action ──────────────────────────────────────────────
  const startMs = Date.now();
  let result = null;
  let errorMsg = null;

  try {
    result = await executeAction(base44, action_type, params, user);
  } catch (err) {
    errorMsg = err.message;
  }

  const latencyMs = Date.now() - startMs;

  // ── Audit log (always) ─────────────────────────────────────────
  await base44.asServiceRole.entities.AIAuditLog.create({
    user_email: user.email,
    user_role: role,
    session_id,
    prompt: `ACTION: ${action_type} — params: ${JSON.stringify(params).slice(0, 300)}`,
    context_used: ['ai_action_executor'],
    response_summary: result
      ? `✅ ${action_type} eseguito — ${result.label || ''}`
      : `❌ ${action_type} fallito — ${errorMsg}`,
    actions_suggested: [],
    actions_executed: result ? [{ type: action_type, params, result }] : [],
    latency_ms: latencyMs,
  }).catch(() => {});

  if (errorMsg) {
    return Response.json({ error: errorMsg }, { status: 500 });
  }

  return Response.json({
    success: true,
    action_type,
    result,
    latency_ms: latencyMs,
  });
});