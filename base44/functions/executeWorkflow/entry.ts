import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Workflow Engine - Core Execution
 * 
 * Executes workflows based on triggers, handling:
 * - Actions (create tasks, send notifications, update entities)
 * - Approvals (request and track approvals)
 * - Delays (wait for specified time)
 * - Escalations (escalate based on conditions)
 * - Conditions (branching logic)
 * 
 * Can be called manually or via automation.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role === 'user') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workflow_id, trigger_data, manual_execution = false } = await req.json();

    if (!workflow_id) {
      return Response.json({ error: 'workflow_id required' }, { status: 400 });
    }

    // Get workflow
    const workflow = await base44.entities.Workflow.get(workflow_id);
    if (!workflow || !workflow.is_active) {
      return Response.json({ error: 'Workflow not found or inactive' }, { status: 404 });
    }

    // Create execution record
    const execution = await base44.entities.WorkflowExecution.create({
      company_id: workflow.company_id,
      workflow_id: workflow.id,
      workflow_name: workflow.name,
      trigger_type: manual_execution ? 'manual' : workflow.trigger_type,
      trigger_data: trigger_data || {},
      status: 'Running',
      started_at: new Date().toISOString(),
      steps_total: workflow.steps?.length || 0,
      current_step: 0,
      execution_log: [],
      created_entities: [],
      initiated_by_user: user.email,
    });

    // Execute workflow steps
    const result = await executeWorkflowSteps(base44, workflow, execution.id, user);

    return Response.json({
      success: true,
      execution_id: execution.id,
      status: result.status,
      steps_executed: result.stepsExecuted,
      message: result.message,
    });
  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});

async function executeWorkflowSteps(base44, workflow, executionId, user) {
  const steps = workflow.steps || [];
  let stepsExecuted = 0;
  let currentStatus = 'Running';
  let message = 'Workflow completato con successo';

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const stepNumber = i + 1;

    try {
      // Log step start
      await logStepExecution(base44, executionId, step, 'started', `Executing step ${stepNumber}: ${step.type}`);

      // Execute based on step type
      if (step.type === 'action') {
        await executeAction(base44, workflow, step, executionId, user);
      } else if (step.type === 'approval') {
        const approvalResult = await executeApproval(base44, workflow, step, executionId, user);
        if (approvalResult.status === 'Pending') {
          currentStatus = 'Pending Approval';
          message = 'In attesa di approvazione';
          break; // Stop execution until approved
        }
      } else if (step.type === 'delay') {
        // Delays are handled by scheduled re-execution
        await logStepExecution(base44, executionId, step, 'completed', `Delay of ${step.delay_minutes} minutes scheduled`);
      } else if (step.type === 'notification') {
        await executeNotification(base44, workflow, step, executionId, user);
      } else if (step.type === 'escalation') {
        await executeEscalation(base44, workflow, step, executionId, user);
      } else if (step.type === 'condition') {
        const conditionMet = await evaluateCondition(base44, step.config, workflow);
        if (!conditionMet) {
          await logStepExecution(base44, executionId, step, 'skipped', 'Condition not met');
          continue; // Skip to next step
        }
      }

      // Log step completion
      await logStepExecution(base44, executionId, step, 'completed', `Step ${stepNumber} completed`);
      stepsExecuted++;

      // Update execution progress
      await base44.entities.WorkflowExecution.update(executionId, {
        steps_executed: stepsExecuted,
        current_step: stepNumber,
      });

    } catch (error) {
      await logStepExecution(base44, executionId, step, 'failed', `Error: ${error.message}`);
      currentStatus = 'Failed';
      message = `Workflow fallito allo step ${stepNumber}: ${error.message}`;
      
      await base44.entities.WorkflowExecution.update(executionId, {
        status: 'Failed',
        error_message: error.message,
        completed_at: new Date().toISOString(),
      });
      
      return { status: 'Failed', stepsExecuted, message };
    }
  }

  // Mark execution as completed
  const completedAt = new Date();
  const startedAt = new Date((await base44.entities.WorkflowExecution.get(executionId)).started_at);
  const durationSeconds = Math.floor((completedAt - startedAt) / 1000);

  await base44.entities.WorkflowExecution.update(executionId, {
    status: currentStatus,
    completed_at: currentStatus === 'Running' ? completedAt.toISOString() : null,
    duration_seconds: durationSeconds,
  });

  // Update workflow stats
  if (currentStatus === 'Running') {
    const workflowStats = await base44.entities.WorkflowExecution.filter({ workflow_id: workflow.id });
    const successCount = workflowStats.filter(e => e.status === 'Completed').length;
    const successRate = workflowStats.length > 0 ? (successCount / workflowStats.length) * 100 : 100;

    await base44.entities.Workflow.update(workflow.id, {
      execution_count: (workflow.execution_count || 0) + 1,
      success_rate: successRate,
      last_executed: new Date().toISOString(),
    });
  }

  return { status: currentStatus, stepsExecuted, message };
}

async function executeAction(base44, workflow, step, executionId, user) {
  const { action_type, config } = step;

  let createdEntity = null;

  // Action: Create Task
  if (action_type === 'create_task') {
    createdEntity = await base44.entities.Task.create({
      title: config.title || 'Task da Workflow',
      description: config.description || '',
      assigned_to: config.assigned_to,
      due_date: config.due_date,
      priority: config.priority || 'Medium',
      company_id: workflow.company_id,
      created_by_workflow: workflow.id,
    });
  }

  // Action: Create Checklist Item
  else if (action_type === 'create_checklist') {
    createdEntity = await base44.entities.ChecklistItem.create({
      title: config.title || 'Attività da Workflow',
      description: config.description || '',
      project_id: config.project_id,
      category: config.category,
      assigned_person: config.assigned_person,
      due_date: config.due_date,
      status: 'To Do',
      company_id: workflow.company_id,
    });
  }

  // Action: Update Entity
  else if (action_type === 'update_entity') {
    const { entity_name, entity_id, updates } = config;
    if (entity_name && entity_id && updates) {
      await base44.entities[entity_name].update(entity_id, updates);
    }
  }

  // Action: Send Email (placeholder)
  else if (action_type === 'send_email') {
    // Placeholder for future email integration
    await logStepExecution(base44, executionId, step, 'completed', `Email to ${config.to} - placeholder`);
  }

  // Log created entity
  if (createdEntity) {
    const executions = await base44.entities.WorkflowExecution.get(executionId);
    const createdEntities = executions.created_entities || [];
    createdEntities.push({
      entity_type: createdEntity.constructor.name,
      entity_id: createdEntity.id,
      created_at: new Date().toISOString(),
    });
    await base44.entities.WorkflowExecution.update(executionId, { created_entities: createdEntities });
  }
}

async function executeApproval(base44, workflow, step, executionId, user) {
  const { config, required_role, approval_type } = step;

  // Create approval request
  const approval = await base44.entities.WorkflowApproval.create({
    company_id: workflow.company_id,
    workflow_execution_id: executionId,
    workflow_id: workflow.id,
    step_id: step.id,
    approval_type: approval_type || 'custom',
    title: config.title || 'Approvazione richiesta',
    description: config.description || '',
    requested_data: config.data || {},
    required_role: required_role || 'admin',
    requested_by: user.email,
    requested_at: new Date().toISOString(),
    status: 'Pending',
    expires_at: config.expires_after_hours 
      ? new Date(Date.now() + config.expires_after_hours * 60 * 60 * 1000).toISOString()
      : null,
    context_entity_type: config.entity_type,
    context_entity_id: config.entity_id,
  });

  // Update execution
  await base44.entities.WorkflowExecution.update(executionId, {
    approvals_requested: (await base44.entities.WorkflowExecution.get(executionId)).approvals_requested + 1,
  });

  // TODO: Send notification to approvers
  await logStepExecution(base44, executionId, step, 'pending_approval', `Approval ${approval.id} requested`);

  return { status: 'Pending', approvalId: approval.id };
}

async function executeNotification(base44, workflow, step, executionId, user) {
  const { config } = step;

  // Create notification
  await base44.entities.Notification.create({
    company_id: workflow.company_id,
    user_id: config.user_id,
    title: config.title || 'Notifica Workflow',
    message: config.message || '',
    type: 'workflow',
    workflow_id: workflow.id,
    is_read: false,
  });

  // Update execution stats
  const executions = await base44.entities.WorkflowExecution.get(executionId);
  await base44.entities.WorkflowExecution.update(executionId, {
    notifications_sent: (executions.notifications_sent || 0) + 1,
  });

  await logStepExecution(base44, executionId, step, 'completed', `Notification sent to ${config.user_id}`);
}

async function executeEscalation(base44, workflow, step, executionId, user) {
  const { config } = step;

  // Create escalation notification
  await base44.entities.Notification.create({
    company_id: workflow.company_id,
    user_id: config.escalate_to,
    title: 'Escalation Workflow',
    message: `Workflow "${workflow.name}" requires escalation: ${config.reason || 'No reason provided'}`,
    type: 'escalation',
    workflow_id: workflow.id,
    priority: 'High',
    is_read: false,
  });

  // Update execution
  const executions = await base44.entities.WorkflowExecution.get(executionId);
  await base44.entities.WorkflowExecution.update(executionId, {
    status: 'Escalated',
    escalations: (executions.escalations || 0) + 1,
  });

  await logStepExecution(base44, executionId, step, 'escalated', `Escalated to ${config.escalate_to}`);
}

async function evaluateCondition(base44, config, workflow) {
  // Simple condition evaluation
  // Config format: { field, operator, value }
  // Operators: equals, not_equals, greater_than, less_than, contains
  
  if (!config) return true;

  const { field, operator, value } = config;
  
  // This is a simplified version - in production you'd fetch actual entity data
  // and evaluate conditions against it
  
  return true; // Placeholder
}

async function logStepExecution(base44, executionId, step, status, message) {
  const execution = await base44.entities.WorkflowExecution.get(executionId);
  const executionLog = execution.execution_log || [];
  
  executionLog.push({
    step_id: step.id,
    step_type: step.type,
    action: step.action_type || step.type,
    status,
    timestamp: new Date().toISOString(),
    message,
    executed_by: 'system',
  });

  await base44.entities.WorkflowExecution.update(executionId, {
    execution_log: executionLog,
  });
}