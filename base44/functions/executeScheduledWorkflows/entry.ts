import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Scheduled Workflow Executor
 * 
 * Runs workflows with trigger_type = 'scheduled' based on their cron/schedule config.
 * This function should be called by a scheduled automation (e.g., every 5 minutes).
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    // Get all scheduled workflows
    const workflows = await base44.entities.Workflow.filter({
      is_active: true,
      trigger_type: 'scheduled',
    });

    const executed = [];
    const now = new Date();

    for (const workflow of workflows) {
      const triggerConfig = workflow.trigger_config || {};
      
      // Check if workflow should run now
      const shouldRun = checkSchedule(triggerConfig, now);
      
      if (shouldRun) {
        try {
          const result = await base44.functions.invoke('executeWorkflow', {
            workflow_id: workflow.id,
            trigger_data: {
              scheduled_at: now.toISOString(),
            },
          });
          
          executed.push({
            workflow_id: workflow.id,
            workflow_name: workflow.name,
            execution_id: result.execution_id,
            status: result.status,
          });
        } catch (error) {
          console.error(`Failed to execute scheduled workflow ${workflow.name}:`, error);
        }
      }
    }

    return Response.json({
      success: true,
      executed_count: executed.length,
      executed,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function checkSchedule(triggerConfig, now) {
  const { cron, schedule_type, interval_minutes, last_run } = triggerConfig;
  
  // Simple cron check (minute hour day month weekday)
  if (cron) {
    const [min, hour, day, month, weekday] = cron.split(' ');
    
    const currentMin = now.getMinutes();
    const currentHour = now.getHours();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth() + 1;
    const currentWeekday = now.getDay();
    
    // Check minute
    if (min !== '*' && min !== currentMin.toString()) {
      return false;
    }
    
    // Check hour
    if (hour !== '*' && hour !== currentHour.toString()) {
      return false;
    }
    
    // Check day
    if (day !== '*' && day !== currentDay.toString()) {
      return false;
    }
    
    // Check month
    if (month !== '*' && month !== currentMonth.toString()) {
      return false;
    }
    
    // Check weekday
    if (weekday !== '*' && weekday !== currentWeekday.toString()) {
      return false;
    }
    
    return true;
  }
  
  // Simple interval check
  if (interval_minutes) {
    if (!last_run) return true;
    const lastRunDate = new Date(last_run);
    const diffMinutes = (now - lastRunDate) / (1000 * 60);
    return diffMinutes >= interval_minutes;
  }
  
  return false;
}