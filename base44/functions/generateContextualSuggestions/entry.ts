/**
 * generateContextualSuggestions - Generates proactive AI suggestions based on current entity context
 * 
 * Payload:
 *   entity_type: string (estimate, project, ticket, property, checklist, guardian)
 *   entity_id: string
 *   user_email: string
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SUGGESTION_CONFIG = {
  estimate: {
    high_risk: ['Margin below 20%', 'Duration underestimated vs similar projects', 'Missing key scope items'],
    optimization: ['Consider premium package for higher margin', 'Add preventive maintenance upsell', 'Review supplier costs'],
    communication: ['Send follow-up email', 'Request site visit', 'Clarify exclusions'],
  },
  project: {
    high_risk: ['Delay risk detected', 'Budget overrun >10%', 'Blocked checklist items'],
    optimization: ['Reallocate resources', 'Fast-track critical path', 'Review change orders'],
    communication: ['Client progress update', 'Delay notification', 'Milestone celebration'],
  },
  ticket: {
    high_risk: ['Recurring issue detected', 'High priority unassigned', 'SLA breach risk'],
    optimization: ['Assign specialist technician', 'Bundle with nearby project', 'Escalate to supplier'],
    communication: ['Customer status update', 'Schedule site visit', 'Request photos'],
  },
  property: {
    high_risk: ['Maintenance overdue', 'System age >15 years', 'Multiple open tickets'],
    optimization: ['Preventive maintenance plan', 'Upgrade recommendation', 'Warranty check'],
    communication: ['Maintenance reminder', 'Inspection scheduling', 'Renewal notice'],
  },
};

function calculateConfidence(dataQuality, signalStrength, historicalMatch) {
  const score = (dataQuality * 0.4 + signalStrength * 0.4 + historicalMatch * 0.2);
  if (score >= 0.75) return { level: 'High', color: '#10B981' };
  if (score >= 0.5) return { level: 'Medium', color: '#F59E0B' };
  return { level: 'Low', color: '#EF4444' };
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { entity_type, entity_id } = await req.json();
  if (!entity_type || !entity_id) {
    return Response.json({ error: 'entity_type and entity_id required' }, { status: 400 });
  }

  const role = user.role || 'user';
  const suggestions = [];
  const insights = [];
  const quickActions = [];
  let confidence = { level: 'Medium', color: '#F59E0B' };

  // ── Fetch entity and related data ──────────────────────────────────────
  let entity = null;
  let relatedProjects = [], relatedTickets = [], relatedCosts = [], relatedChecklists = [];
  let historicalData = [], financials = null;

  try {
    switch (entity_type) {
      case 'estimate':
        entity = await base44.entities.Estimate.get(entity_id).catch(() => null);
        if (entity) {
          historicalData = await base44.entities.Estimate.filter({ 
            estimate_type: entity.estimate_type, 
            quality_level: entity.quality_level,
            status: 'Accepted' 
          }, '-created_date', 10).catch(() => []);
        }
        break;

      case 'project':
        entity = await base44.entities.Project.get(entity_id).catch(() => null);
        if (entity) {
          relatedCosts = await base44.entities.ProjectCost.filter({ project_id: entity_id }, '-date', 20).catch(() => []);
          relatedTickets = await base44.entities.SupportTicket.filter({ property_id: entity.property_id || '' }, '-created_date', 10).catch(() => []);
          relatedChecklists = await base44.entities.ChecklistItem.filter({ project_id: entity_id }, '-updated_date', 15).catch(() => []);
          financials = {
            budget: (entity.material_costs || 0) + (entity.labor_costs || 0) + (entity.other_costs || 0),
            actual: relatedCosts.reduce((s, c) => s + (c.total_cost || 0), 0),
            margin: entity.gross_margin_pct || 0,
          };
        }
        break;

      case 'ticket':
        entity = await base44.entities.SupportTicket.get(entity_id).catch(() => null);
        if (entity) {
          relatedTickets = await base44.entities.SupportTicket.filter({ 
            property_id: entity.property_id || '',
            issue_type: entity.issue_type 
          }, '-created_date', 5).catch(() => []);
        }
        break;

      case 'property':
        entity = await base44.entities.Property.get(entity_id).catch(() => null);
        if (entity) {
          relatedProjects = await base44.entities.Project.filter({ property_id: entity_id }, '-created_date', 10).catch(() => []);
          relatedTickets = await base44.entities.SupportTicket.filter({ property_id: entity_id }, '-created_date', 10).catch(() => []);
        }
        break;

      case 'checklist':
        entity = await base44.entities.ChecklistItem.get(entity_id).catch(() => null);
        break;

      case 'guardian':
        entity = await base44.entities.GuardianSubscription.get(entity_id).catch(() => null);
        break;
    }
  } catch (error) {
    console.error('Context fetch error:', error);
  }

  if (!entity) {
    return Response.json({ error: 'Entity not found' }, { status: 404 });
  }

  // ── Generate Contextual Suggestions ───────────────────────────────────
  const config = SUGGESTION_CONFIG[entity_type];

  // 1. Risk Detection
  if (entity_type === 'project' && financials) {
    const budgetDrift = ((financials.actual - financials.budget) / financials.budget) * 100;
    if (budgetDrift > 10) {
      suggestions.push({
        type: 'risk',
        severity: 'High',
        title: 'Budget Overrun Detected',
        description: `Project costs are ${budgetDrift.toFixed(1)}% over budget (€${(financials.actual - financials.budget).toLocaleString('it-IT')}).`,
        recommendation: 'Review cost breakdown and identify variance sources. Consider change order if scope expanded.',
        confidence: 0.85,
        data_sources: ['project_costs', 'original_budget'],
      });
    }
    if (budgetDrift < -15) {
      suggestions.push({
        type: 'opportunity',
        severity: 'Low',
        title: 'Under Budget - Potential Upsell',
        description: `Project is €${(financials.budget - financials.actual).toLocaleString('it-IT')} under budget. Client may appreciate value-add upgrades.`,
        recommendation: 'Propose premium finishes or extended warranty to increase margin.',
        confidence: 0.70,
        data_sources: ['project_costs', 'budget_analysis'],
      });
    }
  }

  if (entity_type === 'project' && entity.expected_end_date) {
    const daysUntilDeadline = Math.ceil((new Date(entity.expected_end_date) - new Date()) / (1000 * 60 * 60 * 24));
    const completionPct = relatedChecklists.length > 0 
      ? (relatedChecklists.filter(c => c.status === 'Done').length / relatedChecklists.length) * 100 
      : 0;
    const expectedProgress = ((Date.now() - new Date(entity.start_date || Date.now()).getTime()) / 
      (new Date(entity.expected_end_date) - new Date(entity.start_date || Date.now()).getTime())) * 100;
    
    if (daysUntilDeadline < 14 && completionPct < 80) {
      suggestions.push({
        type: 'risk',
        severity: 'High',
        title: 'Delay Risk - Critical Path',
        description: `Only ${daysUntilDeadline} days remaining with ${completionPct.toFixed(0)}% completion. Expected: ${expectedProgress.toFixed(0)}%.`,
        recommendation: 'Accelerate critical tasks, consider resource reallocation, prepare client communication.',
        confidence: 0.90,
        data_sources: ['checklist_progress', 'timeline', 'expected_end_date'],
      });
      quickActions.push({
        type: 'generate_delay_explanation',
        label: 'Generate Delay Explanation',
        icon: '📧',
        params: { project_id: entity_id, days_remaining: daysUntilDeadline, completion_pct: completionPct },
      });
    }
  }

  if (entity_type === 'estimate' && entity.revenue && entity.total_costs) {
    const margin = ((entity.revenue - entity.total_costs) / entity.revenue) * 100;
    if (margin < 20) {
      suggestions.push({
        type: 'risk',
        severity: 'High',
        title: 'Margin Below Target',
        description: `Current margin is ${margin.toFixed(1)}%, below the 20% target. Revenue: €${entity.revenue?.toLocaleString('it-IT')}, Costs: €${entity.total_costs?.toLocaleString('it-IT')}.`,
        recommendation: 'Review pricing, consider premium package, or negotiate scope adjustments.',
        confidence: 0.95,
        data_sources: ['estimate_financials', 'margin_target'],
      });
      quickActions.push({
        type: 'optimize_pricing',
        label: 'Optimize Pricing',
        icon: '💶',
        params: { estimate_id: entity_id, current_margin: margin },
      });
    }
    if (historicalData.length > 0) {
      const avgHistoricalRevenue = historicalData.reduce((s, e) => s + (e.revenue || 0), 0) / historicalData.length;
      if (entity.revenue < avgHistoricalRevenue * 0.85) {
        suggestions.push({
          type: 'insight',
          severity: 'Medium',
          title: 'Below Historical Average',
          description: `Similar ${entity.estimate_type} projects averaged €${avgHistoricalRevenue.toLocaleString('it-IT')} (+${((avgHistoricalRevenue / entity.revenue - 1) * 100).toFixed(0)}%).`,
          recommendation: 'Review scope completeness and quality level assumptions.',
          confidence: 0.75,
          data_sources: ['historical_estimates', 'project_type_comparison'],
        });
      }
    }
  }

  if (entity_type === 'ticket') {
    if (relatedTickets.length >= 3) {
      suggestions.push({
        type: 'insight',
        severity: 'Medium',
        title: 'Recurring Issue Pattern',
        description: `${relatedTickets.length} similar tickets at this property in recent months.`,
        recommendation: 'Investigate root cause. Consider preventive maintenance or system upgrade.',
        confidence: 0.80,
        data_sources: ['ticket_history', 'property_pattern'],
      });
    }
    if (!entity.assigned_technician && ['High', 'Urgent'].includes(entity.priority)) {
      suggestions.push({
        type: 'action_required',
        severity: 'High',
        title: 'High Priority Ticket Unassigned',
        description: 'Ticket requires immediate technician assignment.',
        recommendation: 'Assign available specialist or escalate to team lead.',
        confidence: 0.95,
        data_sources: ['ticket_status', 'priority_level'],
      });
      quickActions.push({
        type: 'assign_technician',
        label: 'Assign Technician',
        icon: '👷',
        params: { ticket_id: entity_id, priority: entity.priority },
      });
    }
  }

  if (entity_type === 'property') {
    const openTickets = relatedTickets.filter(t => t.status === 'Open').length;
    if (openTickets >= 3) {
      suggestions.push({
        type: 'risk',
        severity: 'Medium',
        title: 'Multiple Open Issues',
        description: `${openTickets} open tickets at this property.`,
        recommendation: 'Schedule comprehensive site inspection. Consider bundled intervention.',
        confidence: 0.85,
        data_sources: ['ticket_count', 'property_status'],
      });
    }
    if (entity.year_built && (new Date().getFullYear() - entity.year_built) > 15) {
      suggestions.push({
        type: 'opportunity',
        severity: 'Low',
        title: 'Aging Property - Upgrade Opportunity',
        description: `Property is ${new Date().getFullYear() - entity.year_built} years old. Major systems may need attention.`,
        recommendation: 'Propose comprehensive assessment and preventive maintenance plan.',
        confidence: 0.70,
        data_sources: ['property_age', 'system_lifecycle'],
      });
      quickActions.push({
        type: 'generate_maintenance_plan',
        label: 'Generate Maintenance Plan',
        icon: '📋',
        params: { property_id: entity_id, year_built: entity.year_built },
      });
    }
  }

  // 2. Quick Actions (contextual)
  if (entity_type === 'estimate') {
    quickActions.push(
      { type: 'generate_scope_of_work', label: 'Generate Scope of Work', icon: '📄', params: { estimate_id: entity_id } },
      { type: 'generate_customer_email', label: 'Generate Follow-up Email', icon: '📧', params: { estimate_id: entity_id, customer_name: entity.client_id } },
    );
  }
  if (entity_type === 'project') {
    quickActions.push(
      { type: 'generate_progress_report', label: 'Generate Progress Report', icon: '📊', params: { project_id: entity_id } },
      { type: 'generate_client_update', label: 'Generate Client Update', icon: '📧', params: { project_id: entity_id } },
    );
  }
  if (entity_type === 'ticket') {
    quickActions.push(
      { type: 'generate_resolution_steps', label: 'Generate Resolution Steps', icon: '🔧', params: { ticket_id: entity_id, issue_type: entity.issue_type } },
    );
  }

  // Calculate overall confidence
  const dataQuality = entity ? 0.9 : 0.3;
  const signalStrength = suggestions.length > 0 ? Math.min(1, suggestions.length / 3) : 0.2;
  const historicalMatch = historicalData.length > 0 ? 0.8 : 0.4;
  confidence = calculateConfidence(dataQuality, signalStrength, historicalMatch);

  // ── Audit Log ───────────────────────────────────────────────────────
  base44.asServiceRole.entities.AIAuditLog.create({
    user_email: user.email,
    user_role: role,
    session_id: `contextual_${entity_type}_${entity_id}`,
    prompt: `Contextual suggestions for ${entity_type}:${entity_id}`,
    context_used: [entity_type, ...(suggestions.map(s => s.data_sources).flat())],
    response_summary: `${suggestions.length} suggestions, ${quickActions.length} actions`,
    actions_suggested: quickActions,
    actions_executed: [],
    latency_ms: 0,
    context_entities: [entity_type],
  }).catch(() => {});

  return Response.json({
    suggestions,
    quickActions,
    confidence,
    entity_summary: {
      type: entity_type,
      id: entity_id,
      title: entity.title || entity.property_name || entity.name,
      status: entity.status,
    },
    data_sources_used: [
      entity_type,
      ...(relatedProjects.length ? ['related_projects'] : []),
      ...(relatedTickets.length ? ['related_tickets'] : []),
      ...(relatedCosts.length ? ['project_costs'] : []),
      ...(relatedChecklists.length ? ['checklist_items'] : []),
      ...(historicalData.length ? ['historical_data'] : []),
    ],
  });
});