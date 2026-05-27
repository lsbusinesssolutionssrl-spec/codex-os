import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.role !== 'developer')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { action, entity_name, record_ids, target_company_id } = await req.json();

    if (!action || !entity_name) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    let fixed = 0;
    const results = [];

    // Get demo tenant for sample data
    const demoCompanies = await base44.entities.Company.filter({ 
      $or: [
        { slug: { $regex: 'demo' } },
        { name: { $regex: 'demo', $options: 'i' } }
      ]
    });
    const demoCompanyId = target_company_id || demoCompanies[0]?.id;

    if (!demoCompanyId && action !== 'delete') {
      return Response.json({ 
        error: 'No demo tenant found. Create one first or specify target_company_id.' 
      }, { status: 400 });
    }

    for (const recordId of record_ids || []) {
      try {
        const record = await base44.entities[entity_name].get(recordId);
        
        if (!record) {
          results.push({ record_id: recordId, status: 'not_found' });
          continue;
        }

        if (action === 'assign_to_demo') {
          await base44.entities[entity_name].update(recordId, {
            company_id: demoCompanyId,
            is_sample: true
          });
          results.push({ record_id: recordId, status: 'assigned_to_demo' });
          fixed++;
        } 
        else if (action === 'mark_as_template') {
          await base44.entities[entity_name].update(recordId, {
            is_template: true,
            company_id: null
          });
          results.push({ record_id: recordId, status: 'marked_as_template' });
          fixed++;
        }
        else if (action === 'delete') {
          await base44.entities[entity_name].delete(recordId);
          results.push({ record_id: recordId, status: 'deleted' });
          fixed++;
        }
        else if (action === 'fix_company_id') {
          await base44.entities[entity_name].update(recordId, {
            company_id: target_company_id
          });
          results.push({ record_id: recordId, status: 'company_id_fixed' });
          fixed++;
        }
      } catch (error) {
        results.push({ 
          record_id: recordId, 
          status: 'error', 
          error: error.message 
        });
      }
    }

    // Log the fix action
    await base44.entities.TenantActivationLog.create({
      company_id: demoCompanyId || 'system',
      event_type: 'data_integrity_fix',
      description: `Fixed ${fixed} records in ${entity_name}: ${action}`,
      performed_by: user.email,
      metadata: { action, entity_name, record_ids, results }
    });

    return Response.json({
      success: true,
      fixed_count: fixed,
      results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});