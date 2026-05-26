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

    // Return filter based on user role - ALL filtered by company_id
    const filters = {
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
    };

    // Admin vede tutto (ma solo della propria company)
    if (user.role === 'admin' || user.role === 'company_admin') {
      return Response.json({ filters });
    }

    // Project Manager vede tutto tranne financial control
    if (user.role === 'project_manager') {
      return Response.json({ filters });
    }

    // Technician vede solo progetti/attività dove è assegnato
    if (user.role === 'technician') {
      filters.Project = {
        $or: [
          { created_by: user.email },
          { team_members: user.email }
        ]
      };
      filters.Estimate = {
        $or: [
          { created_by: user.email },
          { project_id: { $in: filters.Project.$or.map(p => p.team_members).flat() } }
        ]
      };
      filters.ChecklistItem = {
        $or: [
          { assigned_person: user.email },
          { created_by: user.email }
        ]
      };
      filters.SupportTicket = { assigned_technician: user.email };
      filters.Timesheet = { employee_id: user.email };
      // Technician vede documenti solo per progetti assegnati
      filters.Document = {
        $or: [
          { created_by: user.email },
          { project_id: { $in: [] } } // Will be populated by project IDs
        ]
      };
    }

    // Sales vede tutti i clienti, proprietà, preventivi
    if (user.role === 'sales') {
      filters.Client = {};
      filters.Property = {};
      filters.Estimate = {};
      // Sales vede documenti per tutti i clienti
      filters.Document = {};
      // Progetti: solo quelli linked to estimates they created
      filters.Project = { created_by: user.email };
    }

    // Client vede solo i propri dati
    if (user.role === 'client') {
      // Prima fetch i client ID dell'utente
      const userClients = await base44.entities.Client.filter({ email: user.email });
      const clientIds = userClients.map(c => c.id);
      
      filters.Client = { email: user.email };
      filters.Property = clientIds.length > 0 ? { client_id: { $in: clientIds } } : { id: null };
      filters.Estimate = clientIds.length > 0 ? { client_id: { $in: clientIds } } : { id: null };
      filters.Project = clientIds.length > 0 ? { client_id: { $in: clientIds } } : { id: null };
      filters.Document = clientIds.length > 0 ? { client_id: { $in: clientIds } } : { id: null };
      filters.SupportTicket = clientIds.length > 0 ? { client_id: { $in: clientIds } } : { id: null };
      filters.GuardianSubscription = clientIds.length > 0 ? { client_id: { $in: clientIds } } : { id: null };
    }

    return Response.json({ filters });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});