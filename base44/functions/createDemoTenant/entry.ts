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
    let demoUserId = null;
    
    if (existingDemoUsers.length === 0) {
      // Invite the demo user
      try {
        await base44.users.inviteUser('demo@codex.platform', 'company_admin');
        console.log('Demo user invited. They will be created upon acceptance.');
      } catch (error) {
        console.warn('Could not invite demo user:', error.message);
      }
    } else {
      demoUserId = existingDemoUsers[0].id;
      
      // Update user with company binding
      await base44.entities.User.update(demoUserId, {
        company_id: demoCompany.id,
        role: 'company_admin',
      });
      
      // Create TenantMembership
      const existingMembership = await base44.entities.TenantMembership.filter({
        user_id: demoUserId,
        tenant_id: demoCompany.id,
      });
      
      if (existingMembership.length === 0) {
        await base44.entities.TenantMembership.create({
          user_id: demoUserId,
          tenant_id: demoCompany.id,
          tenant_role: 'tenant_admin',
          status: 'active',
          invited_by: user.email,
          invited_at: new Date().toISOString(),
          joined_at: new Date().toISOString(),
          is_primary: true,
          default_workspace: 'executive',
          permissions: {
            can_create_projects: true,
            can_create_estimates: true,
            can_view_financials: true,
            can_manage_team: true,
            can_access_api: true,
          },
        });
      }
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