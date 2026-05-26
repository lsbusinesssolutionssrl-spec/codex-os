import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import jsPDF from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { report_type } = await req.json();
    
    const [projects, costs, estimates, guardians, suppliers, timesheets] = await Promise.all([
      base44.entities.Project.list(),
      base44.entities.ProjectCost.list(),
      base44.entities.Estimate.list(),
      base44.entities.GuardianSubscription.list(),
      base44.entities.Supplier.list(),
      base44.entities.Timesheet.list(),
    ]);

    const doc = new jsPDF();
    
    // Title based on report type
    doc.setFontSize(18);
    const titles = {
      'financial': 'Report Finanziario Mensile',
      'supplier': 'Report Fornitori',
      'technician': 'Report Produttività Tecnici',
      'cashflow': 'Report Cash Flow',
    };
    doc.text(titles[report_type] || 'Report', 20, 20);
    
    doc.setFontSize(10);
    doc.text(`Generato: ${new Date().toLocaleDateString('it-IT')}`, 20, 30);
    
    let y = 45;
    
    if (report_type === 'financial') {
      // Monthly Financial Report
      const currentMonth = new Date().getMonth();
      const monthlyProjects = projects.filter(p => 
        p.start_date && new Date(p.start_date).getMonth() === currentMonth
      );
      
      doc.setFontSize(14);
      doc.text('Riepilogo Mensile', 20, y);
      y += 10;
      
      doc.setFontSize(10);
      monthlyProjects.forEach(p => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(`${p.title}: €${(p.contract_value || 0).toLocaleString('it-IT')}`, 20, y);
        y += 8;
      });
      
      y += 5;
      doc.setFontSize(12);
      doc.text('Guardian MRR/ARR', 20, y);
      y += 8;
      const mrr = guardians.reduce((sum, g) => sum + (g.monthly_price || 0), 0);
      doc.setFontSize(10);
      doc.text(`MRR: €${mrr.toLocaleString('it-IT')} | ARR: €${(mrr * 12).toLocaleString('it-IT')}`, 20, y);
      
    } else if (report_type === 'supplier') {
      // Supplier Report
      doc.setFontSize(12);
      doc.text('Elenco Fornitori', 20, y);
      y += 10;
      
      doc.setFontSize(10);
      suppliers.forEach(s => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(`${s.name} - ${s.category} - Rating: ${s.rating || '—'} ★`, 20, y);
        y += 8;
      });
      
    } else if (report_type === 'technician') {
      // Technician Productivity
      const userHours = {};
      timesheets.forEach(t => {
        userHours[t.employee_id] = (userHours[t.employee_id] || 0) + (t.hours || 0);
      });
      
      doc.setFontSize(12);
      doc.text('Ore per Tecnico', 20, y);
      y += 10;
      
      doc.setFontSize(10);
      Object.entries(userHours).forEach(([userId, hours]) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(`Tecnico ${userId}: ${hours} ore`, 20, y);
        y += 8;
      });
      
    } else if (report_type === 'cashflow') {
      // Cash Flow Report
      const today = new Date();
      const days30 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      const days60 = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
      const days90 = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
      
      const calcIncoming = (endDate) => projects
        .filter(p => p.expected_end_date && new Date(p.expected_end_date) <= endDate)
        .reduce((sum, p) => sum + ((p.contract_value || 0) - (p.payment_collected || 0)), 0);
      
      const calcOutgoing = (endDate) => costs
        .filter(c => c.date && new Date(c.date) <= endDate && !c.paid)
        .reduce((sum, c) => sum + (c.total_cost || 0), 0);
      
      doc.setFontSize(12);
      doc.text('Proiezioni Cash Flow', 20, y);
      y += 10;
      
      doc.setFontSize(10);
      [
        { label: '30 Giorni', date: days30 },
        { label: '60 Giorni', date: days60 },
        { label: '90 Giorni', date: days90 },
      ].forEach(({ label, date }) => {
        if (y > 270) { doc.addPage(); y = 20; }
        const inc = calcIncoming(date);
        const out = calcOutgoing(date);
        doc.text(`${label}: Incassi €${inc.toLocaleString('it-IT')} | Pagamenti €${out.toLocaleString('it-IT')} | Netto €${(inc - out).toLocaleString('it-IT')}`, 20, y);
        y += 8;
      });
    }
    
    const pdfBytes = doc.output('arraybuffer');
    
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=Report_${report_type}_${new Date().toISOString().split('T')[0]}.pdf`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});