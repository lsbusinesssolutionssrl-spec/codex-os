import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { estimate_id } = await req.json();
    
    if (!estimate_id) {
      return Response.json({ error: 'Estimate ID required' }, { status: 400 });
    }

    // Fetch estimate data
    const estimates = await base44.entities.Estimate.filter({ id: estimate_id });
    if (!estimates[0]) {
      return Response.json({ error: 'Estimate not found' }, { status: 404 });
    }
    
    const estimate = estimates[0];
    
    // Fetch client and property data
    const clients = await base44.entities.Client.filter({ id: estimate.client_id });
    const client = clients[0];
    
    let property = null;
    if (estimate.property_id) {
      const props = await base44.entities.Property.filter({ id: estimate.property_id });
      property = props[0];
    }

    // Create PDF
    const doc = new jsPDF();
    
    // Header band - Navy blue
    doc.setFillColor(11, 35, 65);
    doc.rect(0, 0, 210, 38, 'F');
    
    // Orange accent line
    doc.setFillColor(245, 130, 32);
    doc.rect(0, 38, 210, 3, 'F');
    
    // Logo text in header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text('CODEX SOLUTION', 20, 18);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 210, 230);
    doc.text('www.codexsolution.it', 20, 26);
    
    // Doc type top right
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(245, 130, 32);
    doc.text('PREVENTIVO', 150, 18);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 210, 230);
    doc.text(new Date().toLocaleDateString('it-IT'), 150, 26);
    
    // Title
    let y = 52;
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(11, 35, 65);
    doc.text(estimate.title || 'Preventivo', 20, y);
    y += 8;
    
    // Client + property info box
    doc.setFillColor(248, 249, 252);
    doc.rect(20, y, client ? 170 : 170, client ? 22 : 12, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 90, 110);
    
    if (client) {
      doc.text(`Cliente: ${client.name}${client.company_name ? ' ' + client.company_name : ''}`, 25, y + 7);
      if (client.email) doc.text(`Email: ${client.email}`, 25, y + 13);
      if (client.phone) doc.text(`Tel: ${client.phone}`, 110, y + 7);
      if (property) doc.text(`Proprietà: ${property.property_name}`, 110, y + 13);
      y += 26;
    } else {
      y += 14;
    }
    
    // Blue section: economic summary
    y += 4;
    doc.setFillColor(17, 71, 255);
    doc.rect(20, y, 170, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('RIEPILOGO ECONOMICO', 25, y + 5.5);
    y += 12;
    
    doc.setTextColor(30, 30, 30);
    const rows = [
      ['Ricavi Stimati', `€ ${(estimate.revenue || 0).toLocaleString('it-IT')}`],
      ['Costo Materiali', `€ ${(estimate.material_cost || 0).toLocaleString('it-IT')}`],
      ['Costo Manodopera', `€ ${(estimate.labor_cost || 0).toLocaleString('it-IT')}`],
      ['Altri Costi', `€ ${(estimate.other_costs || 0).toLocaleString('it-IT')}`],
    ];
    
    rows.forEach(([label, val], idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(248, 249, 252);
        doc.rect(20, y - 4, 170, 8, 'F');
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(60, 70, 90);
      doc.text(label, 25, y);
      doc.text(val, 160, y, { align: 'right' });
      y += 8;
    });
    
    // Margin row highlighted
    doc.setFillColor(11, 35, 65);
    doc.rect(20, y - 4, 170, 9, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('Margine Lordo', 25, y + 1);
    doc.setTextColor(245, 130, 32);
    doc.text(`€ ${(estimate.gross_margin || 0).toLocaleString('it-IT')} (${estimate.gross_margin_pct || 0}%)`, 160, y + 1, { align: 'right' });
    y += 13;
    
    // Details section
    if (estimate.estimate_type || estimate.quality_level || estimate.estimated_duration) {
      doc.setFillColor(17, 71, 255);
      doc.rect(20, y, 170, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text('DETTAGLI INTERVENTO', 25, y + 5.5);
      y += 12;
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 70, 90);
      
      if (estimate.estimate_type) {
        doc.text(`Tipo: ${estimate.estimate_type}`, 25, y);
        y += 7;
      }
      if (estimate.quality_level) {
        doc.text(`Livello qualità: ${estimate.quality_level}`, 25, y);
        y += 7;
      }
      if (estimate.estimated_duration) {
        doc.text(`Durata stimata: ${estimate.estimated_duration}`, 25, y);
        y += 7;
      }
      if (estimate.payment_terms) {
        doc.text(`Condizioni di pagamento: ${estimate.payment_terms}`, 25, y);
        y += 7;
      }
      y += 3;
    }
    
    // Included works
    if (estimate.included_works) {
      doc.setFillColor(17, 71, 255);
      doc.rect(20, y, 170, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text('LAVORI INCLUSI', 25, y + 5.5);
      y += 12;
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 70, 90);
      const lines = doc.splitTextToSize(estimate.included_works, 160);
      doc.text(lines, 25, y);
      y += lines.length * 6 + 5;
    }
    
    // Excluded works
    if (estimate.excluded_works) {
      doc.setFillColor(17, 71, 255);
      doc.rect(20, y, 170, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text('LAVORI ESCLUSI', 25, y + 5.5);
      y += 12;
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 70, 90);
      const lines = doc.splitTextToSize(estimate.excluded_works, 160);
      doc.text(lines, 25, y);
      y += lines.length * 6 + 5;
    }
    
    // Footer
    doc.setFillColor(11, 35, 65);
    doc.rect(0, 282, 210, 15, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(180, 190, 210);
    doc.text('Codex Solution · Documento generato automaticamente', 105, 290, { align: 'center' });
    
    // Add acceptance link
    doc.setFontSize(7);
    doc.setTextColor(150, 160, 180);
    doc.text(`Per accettare online: ${Deno.env.get('BASE44_APP_URL') || 'https://app.base44.com'}/estimate-acceptance/${estimate.id}`, 105, 297, { align: 'center' });
    
    // Return PDF as base64
    const pdfBase64 = doc.output('datauristring');
    
    return Response.json({ 
      success: true, 
      pdf: pdfBase64,
      filename: `preventivo-${(estimate.title || 'codex').replace(/\s+/g, '-').toLowerCase()}.pdf`
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});