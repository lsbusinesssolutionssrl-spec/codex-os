import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return filter based on user role
    const filters = {
      Project: {},
      Estimate: {},
      Client: {},
      Property: {},
      Document: {},
      SupportTicket: {},
      GuardianSubscription: {},
      ChecklistItem: {},
      ProjectCost: {},
      Timesheet: {},
      PurchaseOrder: {},
    };

    // Admin vede tutto
    if (user.role === 'admin') {
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