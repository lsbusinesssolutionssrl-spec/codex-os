import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's company_id for multi-tenant isolation
    const users = await base44.entities.User.filter({ email: user.email });
    const company_id = users[0]?.company_id || null;

    // PLATFORM MODE: Super Admin / Developer
    // No default filters - they can access all tenants via tenant switcher
    if (user.role === 'admin' || user.role === 'developer') {
      // Check if impersonating a specific tenant
      const impersonateId = req.headers.get('x-impersonate-tenant-id');
      
      if (impersonateId) {
        // Admin is viewing a specific tenant's data
        return Response.json({
          filters: {
            Project: { company_id: impersonateId },
            Estimate: { company_id: impersonateId },
            Client: { company_id: impersonateId },
            Property: { company_id: impersonateId },
            Document: { company_id: impersonateId },
            SupportTicket: { company_id: impersonateId },
            GuardianSubscription: { company_id: impersonateId },
            ChecklistItem: { company_id: impersonateId },
            ProjectCost: { company_id: impersonateId },
            Timesheet: { company_id: impersonateId },
            PurchaseOrder: { company_id: impersonateId },
            Supplier: { company_id: impersonateId },
            KnowledgeBase: { company_id: impersonateId },
            ProjectLearning: { company_id: impersonateId },
            IntelligenceInsight: { company_id: impersonateId },
            EstimatePreset: { company_id: impersonateId },
            FinancialAlert: { company_id: impersonateId },
          },
          is_impersonating: true,
          impersonated_tenant_id: impersonateId,
        });
      }
      
      // Platform mode - no filters, can see all tenants
      return Response.json({
        filters: {},
        is_platform_mode: true,
      });
    }

    // TENANT MODE: All other roles belong to a specific company
    if (!company_id) {
      return Response.json({ 
        error: 'Tenant user must have company_id',
        filters: {}
      }, { status: 403 });
    }

    // Check if this is a demo tenant
    const currentCompany = await base44.entities.Company.get(company_id);
    const isDemoTenant = currentCompany?.slug?.includes('demo') || 
                         currentCompany?.name?.toLowerCase().includes('demo') ||
                         currentCompany?.demo_mode === true;

    // Company Admin: full access within their company
    if (user.role === 'company_admin') {
      // CRITICAL: Exclude sample data from real tenants
      const sampleFilter = isDemoTenant ? {} : { is_sample: { $ne: true } };
      
      return Response.json({
        filters: {
          Project: { company_id, ...sampleFilter },
          Estimate: { company_id, ...sampleFilter },
          Client: { company_id, ...sampleFilter },
          Property: { company_id, ...sampleFilter },
          Document: { company_id, ...sampleFilter },
          SupportTicket: { company_id, ...sampleFilter },
          GuardianSubscription: { company_id, ...sampleFilter },
          ChecklistItem: { company_id, ...sampleFilter },
          ProjectCost: { company_id, ...sampleFilter },
          Timesheet: { company_id, ...sampleFilter },
          PurchaseOrder: { company_id, ...sampleFilter },
          Supplier: { company_id, ...sampleFilter },
          KnowledgeBase: { company_id, ...sampleFilter },
          ProjectLearning: { company_id, ...sampleFilter },
          IntelligenceInsight: { company_id, ...sampleFilter },
          EstimatePreset: { company_id, ...sampleFilter },
          FinancialAlert: { company_id, ...sampleFilter },
        }
      });
    }

    // Project Manager: full project access, NO company settings/financial dashboards
    if (user.role === 'project_manager') {
      const sampleFilter = isDemoTenant ? {} : { is_sample: { $ne: true } };
      
      return Response.json({
        filters: {
          Project: { company_id, ...sampleFilter },
          Estimate: { company_id, ...sampleFilter },
          Client: { company_id, ...sampleFilter },
          Property: { company_id, ...sampleFilter },
          Document: { company_id, ...sampleFilter },
          SupportTicket: { company_id, ...sampleFilter },
          GuardianSubscription: { company_id, ...sampleFilter },
          ChecklistItem: { company_id, ...sampleFilter },
          ProjectCost: { company_id, ...sampleFilter },
          Timesheet: { company_id, ...sampleFilter },
          PurchaseOrder: { company_id, ...sampleFilter },
          // NO access to: Supplier, KnowledgeBase, FinancialAlert, IntelligenceInsight
        },
        restricted_entities: ['Supplier', 'KnowledgeBase', 'FinancialAlert', 'IntelligenceInsight', 'EstimatePreset']
      });
    }

    // Technician: ONLY assigned projects/tasks/tickets - NO financial data
    if (user.role === 'technician') {
      const sampleFilter = isDemoTenant ? {} : { is_sample: { $ne: true } };
      
      const myProjects = await base44.entities.Project.filter({
        company_id,
        ...sampleFilter,
        $or: [
          { created_by: user.email },
          { team_members: user.email }
        ]
      });
      const myProjectIds = myProjectIds.map(p => p.id);

      return Response.json({
        filters: {
          Project: { id: myProjectIds.length > 0 ? { $in: myProjectIds } : null, ...sampleFilter },
          ChecklistItem: {
            $or: [
              { assigned_person: user.email },
              { created_by: user.email },
              { project_id: myProjectIds.length > 0 ? { $in: myProjectIds } : null }
            ],
            company_id,
            ...sampleFilter
          },
          SupportTicket: { assigned_technician: user.email, company_id, ...sampleFilter },
          Document: { project_id: myProjectIds.length > 0 ? { $in: myProjectIds } : null, company_id, ...sampleFilter },
          // NO access to: Client, Property, Estimate, GuardianSubscription, ProjectCost, Timesheet, PurchaseOrder, Supplier
        },
        restricted_entities: ['Client', 'Property', 'Estimate', 'GuardianSubscription', 'ProjectCost', 'Timesheet', 'PurchaseOrder', 'Supplier', 'KnowledgeBase', 'FinancialAlert', 'IntelligenceInsight', 'EstimatePreset']
      });
    }

    // Sales: Clients, Properties, Estimates - NO project financials
    if (user.role === 'sales') {
      const sampleFilter = isDemoTenant ? {} : { is_sample: { $ne: true } };
      
      return Response.json({
        filters: {
          Client: { company_id, ...sampleFilter },
          Property: { company_id, ...sampleFilter },
          Estimate: { company_id, ...sampleFilter },
          Document: { company_id, ...sampleFilter },
          Project: { company_id, created_by: user.email, ...sampleFilter },
          // NO access to: ProjectCost, Timesheet, PurchaseOrder, Supplier, FinancialAlert
        },
        restricted_entities: ['ProjectCost', 'Timesheet', 'PurchaseOrder', 'Supplier', 'FinancialAlert', 'IntelligenceInsight']
      });
    }

    // Client: ONLY their own data
    if (user.role === 'client') {
      const userClients = await base44.entities.Client.filter({ email: user.email });
      const clientIds = userClients.map(c => c.id);
      
      if (clientIds.length === 0) {
        return Response.json({
          filters: {},
          restricted_entities: ['all']
        });
      }

      return Response.json({
        filters: {
          Client: { id: { $in: clientIds } },
          Property: { client_id: { $in: clientIds } },
          Estimate: { client_id: { $in: clientIds } },
          Project: { client_id: { $in: clientIds } },
          Document: { client_id: { $in: clientIds } },
          SupportTicket: { client_id: { $in: clientIds } },
          GuardianSubscription: { client_id: { $in: clientIds } },
          // NO access to: ProjectCost, Timesheet, PurchaseOrder, Supplier, KnowledgeBase, FinancialAlert, IntelligenceInsight
        },
        restricted_entities: ['ProjectCost', 'Timesheet', 'PurchaseOrder', 'Supplier', 'KnowledgeBase', 'FinancialAlert', 'IntelligenceInsight', 'EstimatePreset']
      });
    }

    // Default: company_id filter only (with sample data exclusion)
    const sampleFilter = isDemoTenant ? {} : { is_sample: { $ne: true } };
    
    return Response.json({
      filters: {
        Project: { company_id, ...sampleFilter },
        Estimate: { company_id, ...sampleFilter },
        Client: { company_id, ...sampleFilter },
        Property: { company_id, ...sampleFilter },
        Document: { company_id, ...sampleFilter },
        SupportTicket: { company_id, ...sampleFilter },
        GuardianSubscription: { company_id, ...sampleFilter },
        ChecklistItem: { company_id, ...sampleFilter },
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});