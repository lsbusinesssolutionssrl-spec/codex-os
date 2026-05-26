import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { issue_type, record_id } = await req.json();

    // 1. Fix duplicate clients - merge records
    if (issue_type === 'merge_duplicate_clients') {
      const { keep_id, merge_id } = await req.json();
      
      // Get both clients
      const keepClient = await base44.entities.Client.get(keep_id);
      const mergeClient = await base44.entities.Client.get(merge_id);
      
      if (!keepClient || !mergeClient) {
        return Response.json({ error: 'Client not found' }, { status: 404 });
      }
      
      // Update all references to merge_id -> keep_id
      const [properties, estimates, projects, tickets, guardians] = await Promise.all([
        base44.entities.Property.filter({ client_id: merge_id }),
        base44.entities.Estimate.filter({ client_id: merge_id }),
        base44.entities.Project.filter({ client_id: merge_id }),
        base44.entities.SupportTicket.filter({ client_id: merge_id }),
        base44.entities.GuardianSubscription.filter({ client_id: merge_id }),
      ]);
      
      // Update all references
      await Promise.all([
        ...properties.map(p => base44.entities.Property.update(p.id, { client_id: keep_id })),
        ...estimates.map(e => base44.entities.Estimate.update(e.id, { client_id: keep_id })),
        ...projects.map(p => base44.entities.Project.update(p.id, { client_id: keep_id })),
        ...tickets.map(t => base44.entities.SupportTicket.update(t.id, { client_id: keep_id })),
        ...guardians.map(g => base44.entities.GuardianSubscription.update(g.id, { client_id: keep_id })),
      ]);
      
      // Delete duplicate client
      await base44.entities.Client.delete(merge_id);
      
      return Response.json({ 
        success: true, 
        message: `Merged client ${mergeClient.email} into ${keepClient.email}`,
        updated: {
          properties: properties.length,
          estimates: estimates.length,
          projects: projects.length,
          tickets: tickets.length,
          guardians: guardians.length
        }
      });
    }
    
    // 2. Convert accepted estimate to project
    if (issue_type === 'convert_estimate_to_project') {
      const response = await base44.functions.invoke('convertEstimateToProject', { 
        estimate_id: record_id 
      });
      
      return Response.json({ 
        success: true, 
        message: 'Estimate converted to project',
        project_id: response.data.project_id
      });
    }
    
    // 3. Link project to client
    if (issue_type === 'link_project_client') {
      const { project_id, client_id } = await req.json();
      await base44.entities.Project.update(project_id, { client_id });
      return Response.json({ success: true, message: 'Project linked to client' });
    }
    
    // 4. Link project to property
    if (issue_type === 'link_project_property') {
      const { project_id, property_id } = await req.json();
      await base44.entities.Project.update(project_id, { property_id });
      return Response.json({ success: true, message: 'Project linked to property' });
    }
    
    // 5. Link guardian to property
    if (issue_type === 'link_guardian_property') {
      const { guardian_id, property_id } = await req.json();
      await base44.entities.GuardianSubscription.update(guardian_id, { property_id });
      return Response.json({ success: true, message: 'Guardian linked to property' });
    }
    
    // 6. Link ticket to client
    if (issue_type === 'link_ticket_client') {
      const { ticket_id, client_id } = await req.json();
      await base44.entities.SupportTicket.update(ticket_id, { client_id });
      return Response.json({ success: true, message: 'Ticket linked to client' });
    }
    
    // 7. Delete duplicate client (if no references)
    if (issue_type === 'delete_duplicate_client') {
      const client = await base44.entities.Client.get(record_id);
      
      // Check for references
      const [properties, estimates, projects, tickets, guardians] = await Promise.all([
        base44.entities.Property.filter({ client_id: record_id }),
        base44.entities.Estimate.filter({ client_id: record_id }),
        base44.entities.Project.filter({ client_id: record_id }),
        base44.entities.SupportTicket.filter({ client_id: record_id }),
        base44.entities.GuardianSubscription.filter({ client_id: record_id }),
      ]);
      
      const totalRefs = properties.length + estimates.length + projects.length + tickets.length + guardians.length;
      
      if (totalRefs > 0) {
        return Response.json({ 
          error: `Cannot delete: ${totalRefs} records reference this client. Use merge instead.`,
          status: 400
        });
      }
      
      await base44.entities.Client.delete(record_id);
      return Response.json({ success: true, message: 'Duplicate client deleted' });
    }
    
    return Response.json({ error: 'Unknown issue type' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});