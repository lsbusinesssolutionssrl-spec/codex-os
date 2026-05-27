import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.role !== 'developer')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find demo tenant
    const demoCompanies = await base44.entities.Company.filter({ 
      $or: [
        { slug: { $regex: 'demo' } },
        { name: { $regex: 'demo', $options: 'i' } }
      ]
    });
    
    const demoCompany = demoCompanies[0];
    if (!demoCompany) {
      return Response.json({ 
        error: 'No demo tenant found. Run createDemoTenant first.' 
      }, { status: 400 });
    }

    const entities = [
      'Client', 'Property', 'Estimate', 'Project', 'Task', 'SupportTicket',
      'Document', 'GuardianSubscription', 'ProjectCost', 'Timesheet', 'Supplier',
      'KnowledgeBase', 'IntelligenceInsight', 'AIMemory', 'Notification',
      'ChecklistItem', 'PurchaseOrder', 'ProjectLearning', 'EstimatePreset',
      'FinancialAlert', 'Workflow', 'WorkflowExecution', 'WorkflowTemplate',
      'WebhookSubscription', 'PlatformIntegration', 'PropertyInsight',
      'PropertyRisk', 'PropertyEquipment', 'PropertyMaintenance',
      'MaintenanceSchedule', 'Comment'
    ];

    let totalFixed = 0;
    const results = [];

    for (const entityName of entities) {
      try {
        // Get records without company_id
        const records = await base44.entities[entityName].filter({ company_id: null });
        
        if (records.length === 0) continue;

        let entityFixed = 0;
        for (const record of records) {
          try {
            await base44.entities[entityName].update(record.id, {
              company_id: demoCompany.id,
              is_sample: true
            });
            entityFixed++;
            totalFixed++;
          } catch (error) {
            console.warn(`Failed to move ${entityName} ${record.id}:`, error.message);
          }
        }

        results.push({
          entity: entityName,
          moved: entityFixed
        });
      } catch (error) {
        console.warn(`Could not process ${entityName}:`, error.message);
        results.push({
          entity: entityName,
          error: error.message
        });
      }
    }

    // Log the fix
    await base44.entities.TenantActivationLog.create({
      company_id: demoCompany.id,
      event_type: 'data_integrity_fix',
      description: `Moved ${totalFixed} orphan records to demo tenant`,
      performed_by: user.email,
      metadata: { results, total_fixed: totalFixed }
    });

    return Response.json({
      success: true,
      demo_company_id: demoCompany.id,
      total_fixed: totalFixed,
      by_entity: results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});