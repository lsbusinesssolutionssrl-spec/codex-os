import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.2.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { project_id, report_type } = await req.json();
    
    if (!project_id || !report_type) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Fetch project data
    const projects = await base44.entities.Project.filter({ id: project_id });
    if (!projects[0]) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }
    
    const project = projects[0];
    
    // Fetch related data
    const clients = await base44.entities.Client.filter({ id: project.client_id });
    const client = clients[0] || null;
    
    let property = null;
    if (project.property_id) {
      const props = await base44.entities.Property.filter({ id: project.property_id });
      property = props[0] || null;
    }
    
    const checklists = await base44.entities.ChecklistItem.filter({ project_id });
    
    // Initialize PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Header with Codex branding
    doc.setFillColor(11, 35, 65); // #0B2341
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setFillColor(17, 71, 255); // #1147FF
    doc.rect(0, 35, pageWidth, 5, 'F');
    
    // Company name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('CODEX SOLUTION', 20, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Report Professionale', 20, 33);
    
    // Report title based on type
    const reportTitles = {
      'progress': 'STATO AVANZAMENTO LAVORI',
      'financial': 'RIEPILOGO COSTI',
      'completion': 'RELAZIONE DI CONCLUSIONE',
      'checklist': 'CHECKLIST COMPLETA'
    };
    
    doc.setTextColor(11, 35, 65);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(reportTitles[report_type] || 'REPORT PROGETTO', pageWidth - 20, 25, { align: 'right' });
    
    let y = 55;
    
    // Project info section
    doc.setDrawColor(229, 231, 235);
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(15, y - 10, pageWidth - 30, 35, 3, 3, 'F');
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(11, 35, 65);
    doc.text('PROGETTO', 20, y);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    doc.text(`Titolo: ${project.title}`, 20, y + 8);
    doc.text(`Cliente: ${client ? client.name : 'N/A'}`, 20, y + 15);
    if (property) {
      doc.text(`Proprietà: ${property.property_name}`, 20, y + 22);
    }
    doc.text(`Stato: ${project.status}`, pageWidth - 20, y, { align: 'right' });
    doc.text(`Data: ${new Date().toLocaleDateString('it-IT')}`, pageWidth - 20, y + 8, { align: 'right' });
    
    y += 50;
    
    // Content based on report type
    if (report_type === 'progress') {
      // Progress report
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(11, 35, 65);
      doc.text('STATO ATTUALE', 20, y);
      y += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(75, 85, 99);
      
      const lines = doc.splitTextToSize(
        project.notes || 'Nessuna nota disponibile.',
        pageWidth - 40
      );
      doc.text(lines, 20, y);
      y += lines.length * 5 + 10;
      
      // Milestones
      if (project.milestones && project.milestones.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('MILESTONE', 20, y);
        y += 8;
        
        project.milestones.forEach((m, idx) => {
          const status = m.done ? '✓' : '○';
          const color = m.done ? '#10B981' : '#6B7280';
          doc.setTextColor(75, 85, 99);
          doc.setFont('helvetica', 'normal');
          doc.text(`${status} ${m.title}`, 25, y);
          if (m.due_date) {
            doc.setFontSize(9);
            doc.text(`(Scadenza: ${new Date(m.due_date).toLocaleDateString('it-IT')})`, 35, y);
            doc.setFontSize(10);
          }
          y += 8;
          
          if (y > pageHeight - 30) {
            doc.addPage();
            y = 30;
          }
        });
      }
      
      // Checklist progress
      if (checklists.length > 0) {
        y += 5;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('ATTIVITÀ', 20, y);
        y += 8;
        
        const doneCount = checklists.filter(c => c.status === 'Done').length;
        const progress = Math.round((doneCount / checklists.length) * 100);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Completamento: ${progress}% (${doneCount}/${checklists.length})`, 20, y);
        y += 10;
        
        // Progress bar
        doc.setFillColor(229, 231, 235);
        doc.rect(20, y - 3, pageWidth - 40, 6, 'F');
        doc.setFillColor(17, 71, 255);
        doc.rect(20, y - 3, (pageWidth - 40) * (progress / 100), 6, 'F');
        
        y += 15;
        
        // Activity list (first 15)
        checklists.slice(0, 15).forEach(c => {
          const statusIcon = {
            'Done': '✓',
            'In Progress': '→',
            'To Do': '○',
            'Blocked': '!'
          }[c.status] || '○';
          
          doc.text(`${statusIcon} ${c.title}`, 25, y);
          y += 6;
          
          if (y > pageHeight - 30) {
            doc.addPage();
            y = 30;
          }
        });
      }
    } else if (report_type === 'financial') {
      // Financial report
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(11, 35, 65);
      doc.text('RIEPILOGO FINANZIARIO', 20, y);
      y += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(75, 85, 99);
      
      const contractValue = project.contract_value || 0;
      const materialCosts = project.material_costs || 0;
      const laborCosts = project.labor_costs || 0;
      const otherCosts = project.other_costs || 0;
      const totalCosts = materialCosts + laborCosts + otherCosts;
      const grossMargin = contractValue - totalCosts;
      const grossMarginPct = contractValue > 0 ? ((grossMargin / contractValue) * 100) : 0;
      const paymentCollected = project.payment_collected || 0;
      const remainingBalance = contractValue - paymentCollected;
      
      const financialData = [
        { label: 'Valore Contratto', value: contractValue, bold: true },
        { label: 'Costo Materiali', value: -materialCosts },
        { label: 'Costo Manodopera', value: -laborCosts },
        { label: 'Altri Costi', value: -otherCosts },
        { label: 'Costi Totali', value: -totalCosts, bold: true },
        { label: 'Margine Lordo', value: grossMargin, bold: true },
        { label: 'Margine %', value: `${grossMarginPct.toFixed(1)}%`, isPercent: true },
        { label: 'Pagamenti Ricevuti', value: paymentCollected },
        { label: 'Saldo Residuo', value: remainingBalance, bold: true }
      ];
      
      financialData.forEach(item => {
        if (item.bold) {
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setFont('helvetica', 'normal');
        }
        
        doc.text(item.label, 20, y);
        
        if (item.isPercent) {
          doc.text(item.value, pageWidth - 20, y, { align: 'right' });
        } else {
          const formattedValue = typeof item.value === 'number' 
            ? `€${item.value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : item.value;
          doc.text(formattedValue, pageWidth - 20, y, { align: 'right' });
        }
        
        y += 7;
      });
      
      // Margin indicator
      y += 5;
      const marginColor = grossMarginPct >= 35 ? '#10B981' : grossMarginPct >= 25 ? '#F59E0B' : '#EF4444';
      const marginStatus = grossMarginPct >= 35 ? 'OTTIMO' : grossMarginPct >= 25 ? 'NORMALE' : 'CRITICO';
      
      doc.setFillColor(marginColor);
      doc.roundedRect(20, y - 3, 60, 6, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text(`MARGINE: ${marginStatus}`, 23, y + 2);
    } else if (report_type === 'completion') {
      // Completion report
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(11, 35, 65);
      doc.text('DETTAGLI PROGETTO', 20, y);
      y += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(75, 85, 99);
      
      const details = [
        { label: 'Data Inizio', value: project.start_date ? new Date(project.start_date).toLocaleDateString('it-IT') : 'N/A' },
        { label: 'Data Fine Prevista', value: project.expected_end_date ? new Date(project.expected_end_date).toLocaleDateString('it-IT') : 'N/A' },
        { label: 'Durata Stimata', value: project.estimated_duration || 'N/A' },
        { label: 'Project Manager', value: project.project_manager || 'N/A' },
        { label: 'Team Members', value: project.team_members ? project.team_members.join(', ') : 'N/A' }
      ];
      
      details.forEach(d => {
        doc.setFont('helvetica', 'bold');
        doc.text(`${d.label}:`, 20, y);
        doc.setFont('helvetica', 'normal');
        doc.text(d.value, pageWidth - 20, y, { align: 'right' });
        y += 7;
      });
      
      y += 5;
      
      // Photos info
      const photosBefore = project.photos_before ? project.photos_before.length : 0;
      const photosDuring = project.photos_during ? project.photos_during.length : 0;
      const photosAfter = project.photos_after ? project.photos_after.length : 0;
      
      doc.setFont('helvetica', 'bold');
      doc.text('DOCUMENTAZIONE FOTOGRAFICA', 20, y);
      y += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Foto Before: ${photosBefore}`, 20, y);
      doc.text(`Foto During: ${photosDuring}`, 20, y + 7);
      doc.text(`Foto After: ${photosAfter}`, 20, y + 14);
      
      if (photosBefore + photosDuring + photosAfter > 0) {
        doc.setTextColor(17, 71, 255);
        doc.text('(Disponibili nella piattaforma)', pageWidth - 20, y + 14, { align: 'right' });
      }
    } else if (report_type === 'checklist') {
      // Full checklist report
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(11, 35, 65);
      doc.text('CHECKLIST COMPLETA', 20, y);
      y += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(75, 85, 99);
      
      const categories = [...new Set(checklists.map(c => c.category).filter(Boolean))];
      
      if (categories.length === 0) {
        doc.text('Nessuna checklist presente.', 20, y);
      } else {
        categories.forEach(category => {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(11, 35, 65);
          doc.text(category.toUpperCase(), 20, y);
          y += 7;
          
          const categoryItems = checklists.filter(c => c.category === category);
          categoryItems.forEach(item => {
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(75, 85, 99);
            
            const statusIcon = {
              'Done': '✓',
              'In Progress': '→',
              'To Do': '○',
              'Blocked': '!'
            }[item.status] || '○';
            
            doc.text(`${statusIcon} ${item.title}`, 25, y);
            
            if (item.assigned_person) {
              doc.setFontSize(9);
              doc.text(`Resp: ${item.assigned_person}`, 35, y);
              doc.setFontSize(10);
            }
            
            y += 7;
            
            if (y > pageHeight - 30) {
              doc.addPage();
              y = 30;
            }
          });
          
          y += 3;
        });
      }
    }
    
    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(156, 163, 175);
      doc.text(
        `Codex Solution - Report generato il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')} | Pagina ${i} di ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
    
    // Generate PDF
    const pdfBytes = doc.output('arraybuffer');
    
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Report_${project.title.replace(/[^a-z0-9]/gi, '_')}_${report_type}.pdf"`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});