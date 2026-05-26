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

    // STRICT ROLE-BASED FILTERS
    // Admin/Company Admin: full access within company
    if (user.role === 'admin' || user.role === 'company_admin') {
      return Response.json({
        filters: {
          Project: { company_id },
          Estimate: { company_id },
          Client: { company_id },
          Property: { company_id },
          Document: { company_id },
          SupportTicket: { company_id },
          GuardianSubscription: { company_id },
          ChecklistItem: { company_id },
          ProjectCost: { company_id },
          Timesheet: { company_id },
          PurchaseOrder: { company_id },
          Supplier: { company_id },
          KnowledgeBase: { company_id },
          ProjectLearning: { company_id },
          IntelligenceInsight: { company_id },
          EstimatePreset: { company_id },
          FinancialAlert: { company_id },
        }
      });
    }

    // Project Manager: full project access, NO company settings/financial dashboards
    if (user.role === 'project_manager') {
      return Response.json({
        filters: {
          Project: { company_id },
          Estimate: { company_id },
          Client: { company_id },
          Property: { company_id },
          Document: { company_id },
          SupportTicket: { company_id },
          GuardianSubscription: { company_id },
          ChecklistItem: { company_id },
          ProjectCost: { company_id },
          Timesheet: { company_id },
          PurchaseOrder: { company_id },
          // NO access to: Supplier, KnowledgeBase, FinancialAlert, IntelligenceInsight
        },
        restricted_entities: ['Supplier', 'KnowledgeBase', 'FinancialAlert', 'IntelligenceInsight', 'EstimatePreset']
      });
    }

    // Technician: ONLY assigned projects/tasks/tickets - NO financial data
    if (user.role === 'technician') {
      const myProjects = await base44.entities.Project.filter({
        company_id,
        $or: [
          { created_by: user.email },
          { team_members: user.email }
        ]
      });
      const myProjectIds = myProjects.map(p => p.id);

      return Response.json({
        filters: {
          Project: { id: myProjectIds.length > 0 ? { $in: myProjectIds } : null },
          ChecklistItem: {
            $or: [
              { assigned_person: user.email },
              { created_by: user.email },
              { project_id: myProjectIds.length > 0 ? { $in: myProjectIds } : null }
            ]
          },
          SupportTicket: { assigned_technician: user.email },
          Document: { project_id: myProjectIds.length > 0 ? { $in: myProjectIds } : null },
          // NO access to: Client, Property, Estimate, GuardianSubscription, ProjectCost, Timesheet, PurchaseOrder, Supplier
        },
        restricted_entities: ['Client', 'Property', 'Estimate', 'GuardianSubscription', 'ProjectCost', 'Timesheet', 'PurchaseOrder', 'Supplier', 'KnowledgeBase', 'FinancialAlert', 'IntelligenceInsight', 'EstimatePreset']
      });
    }

    // Sales: Clients, Properties, Estimates - NO project financials
    if (user.role === 'sales') {
      return Response.json({
        filters: {
          Client: { company_id },
          Property: { company_id },
          Estimate: { company_id },
          Document: { company_id },
          Project: { company_id, created_by: user.email }, // Only projects from their estimates
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

    // Default: company_id filter only
    return Response.json({
      filters: {
        Project: { company_id },
        Estimate: { company_id },
        Client: { company_id },
        Property: { company_id },
        Document: { company_id },
        SupportTicket: { company_id },
        GuardianSubscription: { company_id },
        ChecklistItem: { company_id },
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});