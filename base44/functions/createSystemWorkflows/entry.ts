import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Crea template di sistema predefiniti per workflow comuni.
 * Eseguito una volta all'inizializzazione.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const templates = await createSystemTemplates(base44, user);

    return Response.json({
      success: true,
      templates_created: templates.length,
      templates,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function createSystemTemplates(base44, user) {
  const created = [];

  // 1. Project Onboarding Workflow
  const onboarding = await base44.entities.WorkflowTemplate.create({
    company_id: 'system',
    name: 'Onboarding Nuovo Progetto',
    description: 'Automazione completa per l\'onboarding di un nuovo progetto approvato',
    category: 'Project Onboarding',
    trigger_type: 'entity_event',
    trigger_config: {
      entity_name: 'Project',
      event_type: 'create',
      conditions: [{ field: 'status', operator: 'equals', value: 'Approved' }],
    },
    steps: [
      {
        id: 'step_1',
        type: 'notification',
        config: {
          title: 'Nuovo Progetto Approvato',
          message: 'Il progetto {{project.title}} è stato approvato. Inizio onboarding.',
          notify_roles: ['admin', 'project_manager'],
        },
        order: 0,
      },
      {
        id: 'step_2',
        type: 'action',
        action_type: 'create_checklist',
        config: {
          title: 'Kickoff Meeting',
          description: 'Organizzare meeting di kickoff con il cliente',
          category: 'Project Management',
          due_date_offset_days: 3,
        },
        order: 1,
      },
      {
        id: 'step_3',
        type: 'action',
        action_type: 'create_checklist',
        config: {
          title: 'Verifica Documentazione',
          description: 'Controllare tutta la documentazione contrattuale',
          category: 'Quality Control',
          due_date_offset_days: 5,
        },
        order: 2,
      },
      {
        id: 'step_4',
        type: 'action',
        action_type: 'create_checklist',
        config: {
          title: 'Pianificazione Cantiere',
          description: 'Pianificare accesso al cantiere e logistica',
          category: 'Project Management',
          due_date_offset_days: 7,
        },
        order: 3,
      },
      {
        id: 'step_5',
        type: 'notification',
        config: {
          title: 'Checklist Onboarding Create',
          message: 'Tutte le attività di onboarding sono state create per il progetto {{project.title}}',
          notify_roles: ['project_manager'],
        },
        order: 4,
      },
    ],
    is_system: true,
    is_active: true,
    risk_level: 'Low',
    estimated_duration_minutes: 15,
    tags: ['onboarding', 'project', 'automated'],
  });
  created.push(onboarding);

  // 2. Ticket Escalation Workflow
  const escalation = await base44.entities.WorkflowTemplate.create({
    company_id: 'system',
    name: 'Escalation Ticket Urgente',
    description: 'Gestione automatica escalation per ticket urgenti non risolti',
    category: 'Ticket Escalation',
    trigger_type: 'entity_event',
    trigger_config: {
      entity_name: 'SupportTicket',
      event_type: 'update',
      conditions: [
        { field: 'priority', operator: 'equals', value: 'Urgent' },
        { field: 'status', operator: 'not_equals', value: 'Resolved' },
      ],
    },
    steps: [
      {
        id: 'step_1',
        type: 'delay',
        delay_minutes: 2880, // 48 hours
        order: 0,
      },
      {
        id: 'step_2',
        type: 'condition',
        config: {
          field: 'status',
          operator: 'not_equals',
          value: 'Resolved',
        },
        order: 1,
      },
      {
        id: 'step_3',
        type: 'escalation',
        config: {
          escalate_to_role: 'project_manager',
          reason: 'Ticket urgente non risolto dopo 48 ore',
        },
        order: 2,
      },
      {
        id: 'step_4',
        type: 'notification',
        config: {
          title: 'Ticket in Escalation',
          message: 'Il ticket {{ticket.title}} è stato escalato al Project Manager',
          notify_roles: ['project_manager', 'admin'],
        },
        order: 3,
      },
    ],
    is_system: true,
    is_active: true,
    risk_level: 'High',
    estimated_duration_minutes: 2880,
    tags: ['ticket', 'escalation', 'urgent'],
  });
  created.push(escalation);

  // 3. Guardian Renewal Workflow
  const guardian = await base44.entities.WorkflowTemplate.create({
    company_id: 'system',
    name: 'Rinnovo Guardian Subscription',
    description: 'Automazione per gestione rinnovi abbonamenti Guardian',
    category: 'Guardian Renewal',
    trigger_type: 'scheduled',
    trigger_config: {
      cron: '0 9 * * *', // Every day at 9 AM
    },
    steps: [
      {
        id: 'step_1',
        type: 'condition',
        config: {
          field: 'subscription.end_date',
          operator: 'lt',
          value: '30_days_from_now',
        },
        order: 0,
      },
      {
        id: 'step_2',
        type: 'notification',
        config: {
          title: 'Subscription in Scadenza',
          message: 'La subscription Guardian per {{client.name}} scade tra {{days}} giorni',
          notify_roles: ['sales', 'admin'],
        },
        order: 1,
      },
      {
        id: 'step_3',
        type: 'action',
        action_type: 'create_task',
        config: {
          title: 'Contatto per Rinnovo Guardian',
          description: 'Contattare il cliente per il rinnovo della subscription',
          assigned_to_role: 'sales',
          due_date_offset_days: 7,
          priority: 'Medium',
        },
        order: 2,
      },
    ],
    is_system: true,
    is_active: true,
    risk_level: 'Medium',
    estimated_duration_minutes: 5,
    tags: ['guardian', 'renewal', 'sales'],
  });
  created.push(guardian);

  // 4. Project Completion Workflow
  const completion = await base44.entities.WorkflowTemplate.create({
    company_id: 'system',
    name: 'Completamento Progetto',
    description: 'Workflow per la chiusura e consegna del progetto',
    category: 'Project Completion',
    trigger_type: 'entity_event',
    trigger_config: {
      entity_name: 'Project',
      event_type: 'update',
      conditions: [{ field: 'status', operator: 'equals', value: 'Delivered' }],
    },
    steps: [
      {
        id: 'step_1',
        type: 'action',
        action_type: 'create_checklist',
        config: {
          title: 'Ispezione Finale',
          description: 'Eseguire ispezione finale con il cliente',
          category: 'Handover',
          due_date_offset_days: 2,
        },
        order: 0,
      },
      {
        id: 'step_2',
        type: 'action',
        action_type: 'create_checklist',
        config: {
          title: 'Generazione Home Passport',
          description: 'Preparare documentazione Home Passport',
          category: 'Handover',
          due_date_offset_days: 5,
        },
        order: 1,
      },
      {
        id: 'step_3',
        type: 'approval',
        approval_type: 'project',
        config: {
          title: 'Approvazione Chiusura Progetto',
          description: 'Il progetto è pronto per la chiusura definitiva',
          required_role: 'admin',
        },
        required_role: 'admin',
        order: 2,
      },
      {
        id: 'step_4',
        type: 'notification',
        config: {
          title: 'Progetto Completato',
          message: 'Il progetto {{project.title}} è stato completato e consegnato',
          notify_roles: ['admin', 'sales'],
        },
        order: 3,
      },
    ],
    is_system: true,
    is_active: true,
    risk_level: 'Medium',
    estimated_duration_minutes: 10,
    tags: ['completion', 'handover', 'project'],
  });
  created.push(completion);

  // 5. Financial Alert Workflow
  const financial = await base44.entities.WorkflowTemplate.create({
    company_id: 'system',
    name: 'Alert Margine Basso',
    description: 'Notifica automatica per progetti con margine inferiore al target',
    category: 'Financial Alert',
    trigger_type: 'entity_event',
    trigger_config: {
      entity_name: 'Project',
      event_type: 'update',
      conditions: [{ field: 'gross_margin_pct', operator: 'lt', value: 25 }],
    },
    steps: [
      {
        id: 'step_1',
        type: 'escalation',
        config: {
          escalate_to_role: 'admin',
          reason: 'Margine progetto inferiore al 25%',
        },
        order: 0,
      },
      {
        id: 'step_2',
        type: 'approval',
        approval_type: 'financial',
        config: {
          title: 'Revisione Margine Progetto',
          description: 'Il progetto ha un margine inferiore al target. Richiede approvazione per continuare.',
          required_role: 'admin',
        },
        required_role: 'admin',
        order: 1,
      },
    ],
    is_system: true,
    is_active: true,
    risk_level: 'Critical',
    estimated_duration_minutes: 2,
    tags: ['financial', 'margin', 'alert'],
  });
  created.push(financial);

  // 6. Estimate Follow-up Workflow
  const estimate = await base44.entities.WorkflowTemplate.create({
    company_id: 'system',
    name: 'Follow-up Preventivo',
    description: 'Automazione follow-up per preventivi inviati',
    category: 'Estimate Follow-up',
    trigger_type: 'entity_event',
    trigger_config: {
      entity_name: 'Estimate',
      event_type: 'update',
      conditions: [{ field: 'status', operator: 'equals', value: 'Sent' }],
    },
    steps: [
      {
        id: 'step_1',
        type: 'delay',
        delay_minutes: 4320, // 3 days
        order: 0,
      },
      {
        id: 'step_2',
        type: 'action',
        action_type: 'create_task',
        config: {
          title: 'Follow-up Preventivo',
          description: 'Contattare il cliente per feedback sul preventivo',
          assigned_to_role: 'sales',
          due_date_offset_days: 2,
          priority: 'Medium',
        },
        order: 1,
      },
    ],
    is_system: true,
    is_active: true,
    risk_level: 'Low',
    estimated_duration_minutes: 4320,
    tags: ['estimate', 'followup', 'sales'],
  });
  created.push(estimate);

  return created;
}