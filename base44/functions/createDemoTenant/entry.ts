import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.role !== 'developer')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create demo company
    const demoCompany = await base44.entities.Company.create({
      name: 'Demo Tenant',
      slug: 'demo-tenant',
      email: 'demo@codex.platform',
      demo_mode: true,
      status: 'active',
      brand_color_primary: '#F59E0B',
      brand_color_secondary: '#1147FF',
      settings: {
        currency: 'EUR',
        language: 'it',
        timezone: 'Europe/Rome',
        demo_mode: true
      }
    });

    // Create demo admin user (if doesn't exist)
    const existingDemoUsers = await base44.entities.User.filter({ email: 'demo@codex.platform' });
    if (existingDemoUsers.length === 0) {
      // Note: Can't create users directly, this would need to be done via invite
      console.log('Demo company created. Invite demo@codex.platform as admin.');
    }

    // Find all records without company_id and move them to demo tenant
    const entities = ['Project', 'Client', 'Property', 'Estimate', 'Task', 'Document', 'SupportTicket'];
    let movedCount = 0;

    for (const entityName of entities) {
      try {
        const records = await base44.entities[entityName].filter({ company_id: null });
        
        for (const record of records) {
          try {
            await base44.entities[entityName].update(record.id, {
              company_id: demoCompany.id,
              is_sample: true
            });
            movedCount++;
          } catch (error) {
            console.warn(`Failed to move ${entityName} ${record.id}:`, error.message);
          }
        }
      } catch (error) {
        console.warn(`Could not process ${entityName}:`, error.message);
      }
    }

    // Create subscription for demo tenant
    const plans = await base44.entities.SubscriptionPlan.list();
    const enterprisePlan = plans.find(p => p.name === 'Enterprise') || plans[0];
    
    if (enterprisePlan) {
      await base44.entities.CompanySubscription.create({
        company_id: demoCompany.id,
        plan_id: enterprisePlan.id,
        status: 'active',
        billing_cycle: 'monthly',
        mrr: 0, // Demo is free
        seats_used: 1,
        demo_mode: true
      });
    }

    // Log the creation
    await base44.entities.TenantActivationLog.create({
      company_id: demoCompany.id,
      event_type: 'tenant_created',
      description: 'Demo tenant created with sample data',
      performed_by: user.email,
      metadata: { moved_records: movedCount, demo_mode: true }
    });

    return Response.json({
      success: true,
      demo_company_id: demoCompany.id,
      demo_company_name: demoCompany.name,
      records_moved: movedCount,
      message: 'Demo tenant created. All global sample data moved here.'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});