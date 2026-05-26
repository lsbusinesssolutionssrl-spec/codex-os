import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // 5 Clients
    const clients = await base44.asServiceRole.entities.Client.bulkCreate([
      { name: 'Marco', company_name: 'Rossi SRL', email: 'marco.rossi@email.it', phone: '+39 333 1234567', address: 'Via Roma 10, Milano', type: 'Business', source: 'Referral', notes: 'Cliente storico' },
      { name: 'Giulia', company_name: 'Bianchi', email: 'giulia.bianchi@email.it', phone: '+39 333 2345678', address: 'Corso Italia 25, Roma', type: 'Private', source: 'Google', notes: '' },
      { name: 'Alessandro', company_name: 'Verde SpA', email: 'a.verde@verde.it', phone: '+39 333 3456789', address: 'Piazza Dante 5, Torino', type: 'Business', source: 'Partner', notes: 'Contratto annuale' },
      { name: 'Francesca', company_name: 'Neri', email: 'francesca.neri@email.it', phone: '+39 333 4567890', address: 'Via Garibaldi 18, Firenze', type: 'Private', source: 'Social', notes: '' },
      { name: 'Luca', company_name: 'Gialli SRL', email: 'luca.gialli@gialli.it', phone: '+39 333 5678901', address: 'Viale Europa 30, Bologna', type: 'Business', source: 'Existing Client', notes: 'Cliente premium' },
    ]);

    // 5 Properties
    const properties = await base44.asServiceRole.entities.Property.bulkCreate([
      { property_name: 'Villa Rossi', client_id: clients[0].id, address: 'Via dei Pini 15, Milano', type: 'Villa', square_meters: 250, year_built: 2010, electrical_notes: 'Impianto del 2010, da aggiornare', plumbing_notes: 'Buone condizioni', networking_notes: 'Cablaggio CAT6 presente' },
      { property_name: 'Appartamento Bianchi', client_id: clients[1].id, address: 'Corso Italia 25, Roma', type: 'Apartment', square_meters: 85, year_built: 1985, electrical_notes: 'Da rifare completamente', plumbing_notes: 'Tubi in ferro, sostituire', security_notes: 'Installare allarme' },
      { property_name: 'Ufficio Verde', client_id: clients[2].id, address: 'Piazza Dante 5, Torino', type: 'Office', square_meters: 400, year_built: 2015, electrical_notes: 'Impianto a norma', networking_notes: 'Server room presente', security_notes: 'Videosorveglianza attiva' },
      { property_name: 'Casa Neri', client_id: clients[3].id, address: 'Via Garibaldi 18, Firenze', type: 'Villa', square_meters: 180, year_built: 2005, heating_cooling_notes: 'Caldaia del 2018', electrical_notes: 'Quadro elettrico da aggiornare' },
      { property_name: 'Capannone Gialli', client_id: clients[4].id, address: 'Viale Europa 30, Bologna', type: 'Industrial Building', square_meters: 1200, year_built: 2000, electrical_notes: 'Impianto trifase', plumbing_notes: 'Impianto antincendio presente', security_notes: 'Cancello automatico' },
    ]);

    // 6 Estimates
    const estimates = await base44.asServiceRole.entities.Estimate.bulkCreate([
      { title: 'Ristrutturazione Bagno Villa Rossi', client_id: clients[0].id, property_id: properties[0].id, estimate_type: 'Bathroom', quality_level: 'Smart', revenue: 15000, material_cost: 6000, labor_cost: 5000, other_costs: 1000, status: 'Sent', estimated_duration: '3 settimane', included_works: 'Demolizione, rifacimento completo, sanitari', excluded_works: 'Mobili' },
      { title: 'Impianto Elettrico Appartamento Bianchi', client_id: clients[1].id, property_id: properties[1].id, estimate_type: 'Electrical System', quality_level: 'Essential', revenue: 8000, material_cost: 3000, labor_cost: 3500, other_costs: 500, status: 'Accepted', estimated_duration: '2 settimane', included_works: 'Quadro elettrico, punti luce', excluded_works: 'Muratura' },
      { title: 'Rete Dati Ufficio Verde', client_id: clients[2].id, property_id: properties[2].id, estimate_type: 'Networking', quality_level: 'Intelligence', revenue: 25000, material_cost: 10000, labor_cost: 10000, other_costs: 2000, status: 'Sent', estimated_duration: '4 settimane', included_works: 'Cablaggio strutturato, rack, switch', excluded_works: 'Opere murarie' },
      { title: 'Sicurezza Casa Neri', client_id: clients[3].id, property_id: properties[3].id, estimate_type: 'Security', quality_level: 'Smart', revenue: 12000, material_cost: 5000, labor_cost: 4500, other_costs: 1000, status: 'Draft', estimated_duration: '1 settimana', included_works: 'Allarme, videosorveglianza', excluded_works: 'Manutenzione' },
      { title: 'Ristrutturazione Completa Capannone Gialli', client_id: clients[4].id, property_id: properties[4].id, estimate_type: 'Full Home', quality_level: 'Intelligence', revenue: 120000, material_cost: 50000, labor_cost: 45000, other_costs: 10000, status: 'To Review', estimated_duration: '12 settimane', included_works: 'Elettrico, idraulico, pavimenti', excluded_works: 'Arredi' },
      { title: 'Manutenzione Impianti Villa Rossi', client_id: clients[0].id, property_id: properties[0].id, estimate_type: 'Maintenance', quality_level: 'Essential', revenue: 3000, material_cost: 800, labor_cost: 1800, other_costs: 200, status: 'Accepted', estimated_duration: '3 giorni', included_works: 'Controllo generale', excluded_works: 'Ricambi' },
    ]);

    // 4 Projects (converted from estimates)
    const projects = await base44.asServiceRole.entities.Project.bulkCreate([
      { title: estimates[1].title, client_id: clients[1].id, property_id: properties[1].id, status: 'In Progress', contract_value: estimates[1].revenue, material_costs: estimates[1].material_cost, labor_costs: estimates[1].labor_cost, other_costs: estimates[1].other_costs, start_date: '2026-05-01', expected_end_date: '2026-05-31', notes: estimates[1].included_works },
      { title: estimates[2].title, client_id: clients[2].id, property_id: properties[2].id, status: 'Approved', contract_value: estimates[2].revenue, material_costs: estimates[2].material_cost, labor_costs: estimates[2].labor_cost, other_costs: estimates[2].other_costs, start_date: '2026-06-01', expected_end_date: '2026-06-30', notes: estimates[2].included_works },
      { title: 'Ristrutturazione Villa Rossi', client_id: clients[0].id, property_id: properties[0].id, status: 'Testing', contract_value: 45000, material_costs: 18000, labor_costs: 18000, other_costs: 4000, start_date: '2026-03-01', expected_end_date: '2026-05-31', actual_end_date: '2026-05-20', notes: 'Progetto completo' },
      { title: 'Appartamento Bianchi', client_id: clients[1].id, property_id: properties[1].id, status: 'Delivered', contract_value: 35000, material_costs: 15000, labor_costs: 13000, other_costs: 3000, start_date: '2026-01-15', expected_end_date: '2026-04-30', actual_end_date: '2026-04-28', notes: 'Consegnato' },
    ]);

    // 10 Checklist Items
    const checklists = await base44.asServiceRole.entities.ChecklistItem.bulkCreate([
      { title: 'Demolizione esistente', description: 'Rimuovere vecchi sanitari', project_id: projects[0].id, category: 'Bathroom', status: 'Done', assigned_person: 'Mario', due_date: '2026-05-10' },
      { title: 'Posa tubazioni', description: 'Installare nuove tubazioni', project_id: projects[0].id, category: 'Bathroom', status: 'In Progress', assigned_person: 'Luigi', due_date: '2026-05-20' },
      { title: 'Installazione quadro elettrico', project_id: projects[0].id, category: 'Electrical', status: 'To Do', assigned_person: 'Mario', due_date: '2026-05-25' },
      { title: 'Cablaggio rack', description: 'Organizzare cavi nel rack', project_id: projects[1].id, category: 'Networking', status: 'To Do', assigned_person: 'Anna', due_date: '2026-06-15' },
      { title: 'Test connettività', project_id: projects[1].id, category: 'Networking', status: 'To Do', assigned_person: 'Anna', due_date: '2026-06-25' },
      { title: 'Posa pavimenti', project_id: projects[2].id, category: 'Full Home', status: 'Done', assigned_person: 'Giorgio', due_date: '2026-04-15' },
      { title: 'Tinteggiatura', project_id: projects[2].id, category: 'Full Home', status: 'Done', assigned_person: 'Giorgio', due_date: '2026-05-10' },
      { title: 'Collaudo impianti', project_id: projects[2].id, category: 'Electrical', status: 'In Progress', assigned_person: 'Mario', due_date: '2026-05-25' },
      { title: 'Pulizia finale', project_id: projects[3].id, category: 'Handover', status: 'Done', assigned_person: 'Luigi', due_date: '2026-04-27' },
      { title: 'Consegna chiavi', project_id: projects[3].id, category: 'Handover', status: 'Done', assigned_person: 'Marco', due_date: '2026-04-28' },
    ]);

    // 5 Support Tickets
    const tickets = await base44.asServiceRole.entities.SupportTicket.bulkCreate([
      { title: 'Perdita acqua cucina', client_id: clients[0].id, property_id: properties[0].id, issue_type: 'Water Leak', priority: 'High', status: 'Open', notes: 'Urgente', assigned_technician: 'Luigi' },
      { title: 'Cortocircuito presa', client_id: clients[1].id, property_id: properties[1].id, issue_type: 'Electrical', priority: 'Urgent', status: 'In Progress', notes: 'Pericolo scossa', assigned_technician: 'Mario' },
      { title: 'Rete WiFi lenta', client_id: clients[2].id, property_id: properties[2].id, issue_type: 'Network', priority: 'Medium', status: 'Open', notes: '', assigned_technician: 'Anna' },
      { title: 'Allarme falso', client_id: clients[3].id, property_id: properties[3].id, issue_type: 'Security', priority: 'Low', status: 'Waiting Client', notes: 'Da verificare', assigned_technician: 'Marco' },
      { title: 'Manutenzione caldaia', client_id: clients[4].id, property_id: properties[4].id, issue_type: 'Maintenance', priority: 'Medium', status: 'Resolved', notes: 'Fatto', assigned_technician: 'Luigi' },
    ]);

    return Response.json({
      message: 'Dati sample creati con successo!',
      counts: { clients: clients.length, properties: properties.length, estimates: estimates.length, projects: projects.length, checklists: checklists.length, tickets: tickets.length },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});