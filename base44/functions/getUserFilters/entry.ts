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
    };

    // Admin vede tutto
    if (user.role === 'admin') {
      return Response.json({ filters });
    }

    // Project Manager vede tutti i progetti
    if (user.role === 'project_manager') {
      return Response.json({ filters });
    }

    // Technician vede solo progetti dove è assegnato o creatore
    if (user.role === 'technician') {
      filters.Project = {
        $or: [
          { created_by: user.email },
          { team_members: user.email }
        ]
      };
      filters.Estimate = { created_by: user.email };
    }

    // Sales vede tutti i clienti e preventivi, ma solo progetti collegati ai suoi clienti
    if (user.role === 'sales') {
      filters.Estimate = {};
      filters.Client = {};
      filters.Property = {};
      // Progetti solo per i suoi clienti (da filtrare in frontend)
    }

    // Client vede solo i propri dati
    if (user.role === 'client') {
      filters.Client = { email: user.email };
      filters.Property = { client_id: { $in: [] } }; // Da popolare con i client ID
      filters.Estimate = { client_id: { $in: [] } };
      filters.Project = { client_id: { $in: [] } };
    }

    return Response.json({ filters });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});