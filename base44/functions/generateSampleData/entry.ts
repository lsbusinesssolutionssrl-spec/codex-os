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

    // 5 Suppliers
    const suppliers = await base44.asServiceRole.entities.Supplier.bulkCreate([
      { name: 'Edil Roma SRL', category: 'Materials', phone: '+39 06 1234567', email: 'info@edilroma.it', address: 'Via Tiburtina 500, Roma', payment_terms: '30 days', rating: 4.5, annual_spend: 45000, notes: 'Fornitore principale' },
      { name: 'Elettro Fast', category: 'Electrical', phone: '+39 02 2345678', email: 'vendite@elettrofast.it', address: 'Viale Monza 120, Milano', payment_terms: '15 days', rating: 4.8, annual_spend: 32000, notes: 'Consegne veloci' },
      { name: 'Idro Point', category: 'Plumbing', phone: '+39 055 3456789', email: 'info@idropoint.it', address: 'Via Pratese 80, Firenze', payment_terms: '30 days', rating: 4.2, annual_spend: 28000, notes: '' },
      { name: 'Noleggi & Co', category: 'Equipment Rental', phone: '+39 011 4567890', email: 'noleggi@nolieco.it', address: 'Corso Francia 200, Torino', payment_terms: 'Immediate', rating: 4.0, annual_spend: 15000, notes: 'Noleggio piattaforme' },
      { name: 'Sub Pro SRL', category: 'Subcontractor', phone: '+39 051 5678901', email: 'info@subpro.it', address: 'Via Stalingrado 50, Bologna', payment_terms: '60 days', rating: 4.6, annual_spend: 52000, notes: 'Specializzati' },
    ]);

    // 18 Project Costs
    const projectCosts = await base44.asServiceRole.entities.ProjectCost.bulkCreate([
      { project_id: projects[0].id, cost_type: 'Material', category: 'Cavi', supplier_id: suppliers[0].id, description: 'Cavi elettrici 100m', quantity: 2, unit_cost: 150, total_cost: 300, date: '2026-05-05', paid: false },
      { project_id: projects[0].id, cost_type: 'Labor', category: 'Elettricista', description: 'Installazione impianto', quantity: 40, unit_cost: 25, total_cost: 1000, date: '2026-05-10', paid: false },
      { project_id: projects[0].id, cost_type: 'Material', category: 'Materiali', supplier_id: suppliers[1].id, description: 'Quadro elettrico', quantity: 1, unit_cost: 450, total_cost: 450, date: '2026-05-08', paid: true },
      { project_id: projects[1].id, cost_type: 'Material', category: 'Networking', supplier_id: suppliers[0].id, description: 'Cavi CAT6', quantity: 500, unit_cost: 1.5, total_cost: 750, date: '2026-06-02', paid: false },
      { project_id: projects[1].id, cost_type: 'Labor', category: 'Tecnico', description: 'Cablaggio', quantity: 80, unit_cost: 30, total_cost: 2400, date: '2026-06-05', paid: false },
      { project_id: projects[1].id, cost_type: 'Vehicle', category: 'Trasporto', description: 'Trasporto materiale', quantity: 100, unit_cost: 1, total_cost: 100, date: '2026-06-01', paid: true },
      { project_id: projects[2].id, cost_type: 'Material', category: 'Edilizia', supplier_id: suppliers[0].id, description: 'Pavimenti', quantity: 150, unit_cost: 45, total_cost: 6750, date: '2026-03-15', paid: true },
      { project_id: projects[2].id, cost_type: 'Labor', category: 'Posatore', description: 'Posa pavimenti', quantity: 60, unit_cost: 35, total_cost: 2100, date: '2026-03-20', paid: true },
      { project_id: projects[2].id, cost_type: 'Subcontractor', category: 'Idraulico', supplier_id: suppliers[4].id, description: 'Impianto idraulico', quantity: 1, unit_cost: 8000, total_cost: 8000, date: '2026-04-01', paid: false },
      { project_id: projects[2].id, cost_type: 'Other', category: 'Permessi', description: 'Permesso comunale', quantity: 1, unit_cost: 1200, total_cost: 1200, date: '2026-03-01', paid: true },
      { project_id: projects[3].id, cost_type: 'Material', category: 'Pittura', supplier_id: suppliers[0].id, description: 'Vernici', quantity: 50, unit_cost: 12, total_cost: 600, date: '2026-02-10', paid: true },
      { project_id: projects[3].id, cost_type: 'Labor', category: 'Imbianchino', description: 'Tinteggiatura', quantity: 40, unit_cost: 28, total_cost: 1120, date: '2026-02-15', paid: true },
      { project_id: projects[3].id, cost_type: 'Vehicle', category: 'Noleggio', supplier_id: suppliers[3].id, description: 'Piattaforma aerea', quantity: 5, unit_cost: 180, total_cost: 900, date: '2026-02-05', paid: true },
      { project_id: projects[3].id, cost_type: 'Other', category: 'Smaltimento', description: 'Smaltimento macerie', quantity: 1, unit_cost: 450, total_cost: 450, date: '2026-04-20', paid: false },
      { project_id: projects[0].id, cost_type: 'Other', category: 'Carburante', description: 'Trasferte', quantity: 1, unit_cost: 120, total_cost: 120, date: '2026-05-15', paid: false },
      { project_id: projects[1].id, cost_type: 'Subcontractor', category: 'Specializzato', supplier_id: suppliers[4].id, description: 'Configurazione server', quantity: 1, unit_cost: 1500, total_cost: 1500, date: '2026-06-10', paid: false },
      { project_id: projects[2].id, cost_type: 'Material', category: 'Infissi', supplier_id: suppliers[0].id, description: 'Porte interne', quantity: 6, unit_cost: 250, total_cost: 1500, date: '2026-04-10', paid: false },
      { project_id: projects[3].id, cost_type: 'Labor', category: 'Operaio', description: 'Manodopera varia', quantity: 20, unit_cost: 22, total_cost: 440, date: '2026-03-01', paid: true },
    ]);

    // 10 Timesheets
    const timesheets = await base44.asServiceRole.entities.Timesheet.bulkCreate([
      { employee_id: 'user1', project_id: projects[0].id, date: '2026-05-05', hours: 8, hourly_rate: 25, total_labor_cost: 200, notes: 'Installazione quadro' },
      { employee_id: 'user2', project_id: projects[0].id, date: '2026-05-06', hours: 6, hourly_rate: 25, total_labor_cost: 150, notes: 'Cablaggio' },
      { employee_id: 'user1', project_id: projects[1].id, date: '2026-06-02', hours: 8, hourly_rate: 30, total_labor_cost: 240, notes: 'Rack networking' },
      { employee_id: 'user3', project_id: projects[2].id, date: '2026-03-15', hours: 10, hourly_rate: 35, total_labor_cost: 350, notes: 'Posa pavimenti' },
      { employee_id: 'user2', project_id: projects[2].id, date: '2026-03-20', hours: 8, hourly_rate: 28, total_labor_cost: 224, notes: 'Rifiniture' },
      { employee_id: 'user1', project_id: projects[3].id, date: '2026-02-10', hours: 7, hourly_rate: 25, total_labor_cost: 175, notes: 'Pittura' },
      { employee_id: 'user3', project_id: projects[3].id, date: '2026-02-15', hours: 9, hourly_rate: 30, total_labor_cost: 270, notes: 'Pulizia' },
      { employee_id: 'user2', project_id: projects[0].id, date: '2026-05-10', hours: 8, hourly_rate: 25, total_labor_cost: 200, notes: 'Collaudo' },
      { employee_id: 'user1', project_id: projects[1].id, date: '2026-06-05', hours: 6, hourly_rate: 30, total_labor_cost: 180, notes: 'Test' },
      { employee_id: 'user3', project_id: projects[2].id, date: '2026-04-01', hours: 8, hourly_rate: 35, total_labor_cost: 280, notes: 'Idraulica' },
    ]);

    // 5 Purchase Orders
    const purchaseOrders = await base44.asServiceRole.entities.PurchaseOrder.bulkCreate([
      { project_id: projects[0].id, supplier_id: suppliers[1].id, order_number: 'PO-2026-001', status: 'Received', order_date: '2026-05-01', expected_delivery: '2026-05-08', actual_delivery: '2026-05-07', total_amount: 450, notes: 'Materiale elettrico' },
      { project_id: projects[1].id, supplier_id: suppliers[0].id, order_number: 'PO-2026-002', status: 'Ordered', order_date: '2026-06-01', expected_delivery: '2026-06-10', total_amount: 750, notes: 'Cavi networking' },
      { project_id: projects[2].id, supplier_id: suppliers[0].id, order_number: 'PO-2026-003', status: 'Received', order_date: '2026-03-10', expected_delivery: '2026-03-15', actual_delivery: '2026-03-14', total_amount: 6750, notes: 'Pavimenti' },
      { project_id: projects[2].id, supplier_id: suppliers[4].id, order_number: 'PO-2026-004', status: 'Partially Received', order_date: '2026-03-25', expected_delivery: '2026-04-05', total_amount: 8000, notes: 'Lavori idraulici' },
      { project_id: projects[3].id, supplier_id: suppliers[3].id, order_number: 'PO-2026-005', status: 'Closed', order_date: '2026-02-01', expected_delivery: '2026-02-05', actual_delivery: '2026-02-05', total_amount: 900, notes: 'Noleggio piattaforma' },
    ]);

    // 3 Financial Alerts
    const financialAlerts = await base44.asServiceRole.entities.FinancialAlert.bulkCreate([
      { alert_type: 'Margin Below Target', project_id: projects[0].id, severity: 'High', message: 'Margine progetto sotto il 25%', amount: 1200, created_date: '2026-05-15' },
      { alert_type: 'Invoice Overdue', severity: 'Critical', message: 'Fattura scaduta da 30 giorni', amount: 4500, due_date: '2026-04-26', created_date: '2026-05-20' },
      { alert_type: 'Project Over Budget', project_id: projects[2].id, severity: 'Medium', message: 'Costi superano budget del 10%', amount: 4500, created_date: '2026-04-10' },
    ]);

    // 3 Guardian Subscriptions
    const guardians = await base44.asServiceRole.entities.GuardianSubscription.bulkCreate([
      { client_id: clients[0].id, property_id: properties[0].id, start_date: '2026-01-01', monthly_price: 99, status: 'Active', included_services: 'Monitoraggio 24/7, intervento urgente', notes: 'Villa Rossi' },
      { client_id: clients[2].id, property_id: properties[2].id, start_date: '2026-02-01', monthly_price: 149, status: 'Active', included_services: 'Monitoraggio avanzato, manutenzione programmata', notes: 'Ufficio Verde' },
      { client_id: clients[4].id, property_id: properties[4].id, start_date: '2026-03-01', monthly_price: 199, status: 'Active', included_services: 'Pacchetto completo enterprise', notes: 'Capannone Gialli' },
    ]);

    return Response.json({
      message: 'Dati sample creati con successo!',
      counts: {
        clients: clients.length,
        properties: properties.length,
        estimates: estimates.length,
        projects: projects.length,
        checklists: checklists.length,
        tickets: tickets.length,
        suppliers: suppliers.length,
        projectCosts: projectCosts.length,
        timesheets: timesheets.length,
        purchaseOrders: purchaseOrders.length,
        financialAlerts: financialAlerts.length,
        guardians: guardians.length,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});