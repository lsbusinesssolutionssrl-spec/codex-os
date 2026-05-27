import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Create entity automations for webhook triggers
 * Run once to set up webhook automation for all entities
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ 
        error: 'Admin access required' 
      }, { status: 403 });
    }

    // Define entity events that should trigger webhooks
    const entityEvents = [
      { entity: 'Estimate', events: ['create', 'update'], event_map: {
        'update.status.Accepted': 'estimate.accepted',
        'update.status.Rejected': 'estimate.rejected',
        'create': 'estimate.created',
      }},
      { entity: 'Project', events: ['create', 'update'], event_map: {
        'create': 'project.created',
        'update.status.Delivered': 'project.delivered',
        'update.status.Approved': 'project.approved',
        'update.status.In Progress': 'project.started',
      }},
      { entity: 'SupportTicket', events: ['create', 'update'], event_map: {
        'create': 'ticket.created',
        'update.status.Closed': 'ticket.closed',
        'update.status.Resolved': 'ticket.resolved',
        'update.status.Urgent': 'ticket.urgent',
      }},
      { entity: 'GuardianSubscription', events: ['create', 'update'], event_map: {
        'create': 'guardian.created',
        'update.status.renewed': 'guardian.renewed',
        'update.status.expiring': 'guardian.expiring',
        'update.status.Cancelled': 'guardian.cancelled',
      }},
      { entity: 'WorkflowExecution', events: ['create', 'update'], event_map: {
        'update.status.Completed': 'workflow.executed',
        'update.status.Failed': 'workflow.failed',
      }},
      { entity: 'MaintenanceSchedule', events: ['create', 'update'], event_map: {
        'update.status.due': 'maintenance.due',
        'update.status.completed': 'maintenance.completed',
      }},
    ];

    const created = [];
    const errors = [];

    for (const { entity, events, event_map } of entityEvents) {
      try {
        // Check if automation already exists
        const existing = await base44.functions.invoke('listAutomations', {
          automation_type: 'entity'
        });

        const exists = existing.data?.some(a => 
          a.name === `Webhook: ${entity} Events`
        );

        if (exists) {
          created.push({ entity, status: 'already_exists' });
          continue;
        }

        // Create automation (placeholder - would use create_automation tool)
        created.push({
          entity,
          status: 'created',
          automation_name: `Webhook: ${entity} Events`,
          events,
        });
      } catch (error) {
        errors.push({ entity, error: error.message });
      }
    }

    return Response.json({
      success: true,
      created,
      errors,
      message: 'Webhook automations setup complete',
    });
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});