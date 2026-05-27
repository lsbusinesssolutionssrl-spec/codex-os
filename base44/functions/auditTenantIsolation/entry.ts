import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can run this audit
    if (user.role !== 'admin' && user.role !== 'developer') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const audit = {
      timestamp: new Date().toISOString(),
      issues: [],
      summary: {
        total_records_checked: 0,
        missing_tenant_id: 0,
        sample_in_real_tenants: 0,
        orphan_records: 0,
        fixed: 0,
      }
    };

    // Entities to audit
    const entities = [
      'Client', 'Property', 'Estimate', 'Project', 'Task', 'SupportTicket',
      'Document', 'GuardianSubscription', 'ProjectCost', 'Timesheet', 'Supplier',
      'KnowledgeBase', 'IntelligenceInsight', 'AIMemory', 'Notification'
    ];

    // Get all companies to identify demo tenants
    const companies = await base44.entities.Company.list();
    const demoCompanyIds = companies
      .filter(c => c.slug?.includes('demo') || c.name?.toLowerCase().includes('demo'))
      .map(c => c.id);

    for (const entityName of entities) {
      try {
        const records = await base44.entities[entityName].list();
        audit.summary.total_records_checked += records.length;

        for (const record of records) {
          const issues = [];

          // Check 1: Missing company_id
          if (!record.company_id) {
            issues.push('missing_company_id');
            audit.summary.missing_tenant_id++;
          }

          // Check 2: Sample data in real tenant
          if (record.is_sample && !demoCompanyIds.includes(record.company_id)) {
            issues.push('sample_in_real_tenant');
            audit.summary.sample_in_real_tenants++;
          }

          // Check 3: Orphan record (company_id doesn't exist)
          if (record.company_id && !companies.find(c => c.id === record.company_id)) {
            issues.push('orphan_record');
            audit.summary.orphan_records++;
          }

          if (issues.length > 0) {
            audit.issues.push({
              entity: entityName,
              record_id: record.id,
              record_title: record.title || record.name || `ID: ${record.id}`,
              company_id: record.company_id,
              is_sample: record.is_sample || false,
              issues,
            });
          }
        }
      } catch (error) {
        // Entity might not exist, skip
        console.warn(`Could not audit ${entityName}:`, error.message);
      }
    }

    // Find global sample records (no company_id)
    const globalSampleRecords = [];
    for (const entityName of entities) {
      try {
        const records = await base44.entities[entityName].filter({ is_sample: true, company_id: null });
        if (records.length > 0) {
          globalSampleRecords.push({
            entity: entityName,
            count: records.length,
            record_ids: records.map(r => r.id)
          });
        }
      } catch {}
    }

    return Response.json({
      audit,
      global_sample_records: globalSampleRecords,
      demo_tenant_ids: demoCompanyIds,
      recommendations: [
        'Move all global sample records to Demo tenant',
        'Mark demo tenants with demo_mode = true',
        'Ensure all new tenants start with empty data',
        'Add company_id validation on entity creation',
      ]
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});