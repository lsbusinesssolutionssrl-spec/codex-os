import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Automation Handler - Triggered by entity events
 * 
 * This function is called by platform automations when:
 * - Entity is created
 * - Entity is updated
 * - Entity is deleted
 * 
 * It matches the event against active workflows and executes them.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Parse the automation payload
    const { event, data, old_data } = await req.json();
    
    if (!event || !event.entity_name || !event.entity_type) {
      return Response.json({ error: 'Invalid event payload' }, { status: 400 });
    }

    // Get matching workflows
    const workflows = await base44.entities.Workflow.filter({
      is_active: true,
      trigger_type: 'entity_event',
    });

    const executed = [];

    for (const workflow of workflows) {
      const triggerConfig = workflow.trigger_config || {};
      
      // Check if workflow matches this event
      if (
        triggerConfig.entity_name === event.entity_name &&
        triggerConfig.event_type === event.event_type
      ) {
        // Evaluate conditions if present
        const conditions = triggerConfig.conditions || [];
        let conditionsMet = true;
        
        for (const condition of conditions) {
          const fieldValue = data[condition.field];
          
          if (condition.operator === 'equals' && fieldValue !== condition.value) {
            conditionsMet = false;
            break;
          }
          if (condition.operator === 'not_equals' && fieldValue === condition.value) {
            conditionsMet = false;
            break;
          }
          if (condition.operator === 'gt' && fieldValue <= condition.value) {
            conditionsMet = false;
            break;
          }
          if (condition.operator === 'lt' && fieldValue >= condition.value) {
            conditionsMet = false;
            break;
          }
        }
        
        if (conditionsMet) {
          // Execute workflow
          try {
            const result = await base44.functions.invoke('executeWorkflow', {
              workflow_id: workflow.id,
              trigger_data: {
                event,
                data,
                old_data,
              },
            });
            
            executed.push({
              workflow_id: workflow.id,
              workflow_name: workflow.name,
              execution_id: result.execution_id,
              status: result.status,
            });
          } catch (error) {
            console.error(`Failed to execute workflow ${workflow.name}:`, error);
          }
        }
      }
    }

    return Response.json({
      success: true,
      event_type: event.event_type,
      entity_name: event.entity_name,
      workflows_executed: executed.length,
      executed,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});