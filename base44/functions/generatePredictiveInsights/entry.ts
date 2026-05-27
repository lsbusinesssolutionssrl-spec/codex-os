import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { property_id } = await req.json();
    
    if (!property_id) {
      return Response.json({ error: 'Property ID required' }, { status: 400 });
    }

    // Fetch all property data
    const [property, tickets, projects, equipment, maintenance, risks, insights] = await Promise.all([
      base44.entities.Property.get(property_id),
      base44.entities.SupportTicket.filter({ property_id }),
      base44.entities.Project.filter({ property_id }),
      base44.entities.PropertyEquipment.filter({ property_id }).catch(() => []),
      base44.entities.PropertyMaintenance.filter({ property_id }).catch(() => []),
      base44.entities.PropertyRisk.filter({ property_id }).catch(() => []),
      base44.entities.PropertyInsight.filter({ property_id }).catch(() => []),
    ]);

    const generatedInsights = [];
    const predictions = [];

    // HVAC Analysis
    const hvacEquipment = equipment.filter(e => e.category === 'HVAC');
    const hvacMaintenance = maintenance.filter(m => m.category === 'HVAC' && m.status === 'Completed');
    const lastHVAC = hvacMaintenance.sort((a, b) => new Date(b.completed_date) - new Date(a.completed_date))[0];
    const monthsSinceHVAC = lastHVAC 
      ? Math.floor((new Date() - new Date(lastHVAC.completed_date)) / (1000 * 60 * 60 * 24 * 30))
      : 999;

    if (monthsSinceHVAC > 12) {
      predictions.push({
        type: 'maintenance',
        category: 'HVAC',
        title: 'Manutenzione HVAC Scaduta',
        description: `L'ultimo intervento HVAC risale a ${monthsSinceHVAC} mesi fa. La manutenzione ordinaria è raccomandata ogni 12 mesi.`,
        ai_reasoning: `Analisi temporale: ultimo intervento ${lastHVAC.completed_date}. Intervallo raccomandato: 12 mesi. Differenza: ${monthsSinceHVAC - 12} mesi di ritardo.`,
        priority: 'High',
        estimated_cost_savings: 500,
        time_horizon: 'Immediate (0-30 days)',
        suggested_action: 'Programmare manutenzione ordinaria HVAC',
      });
    }

    // Electrical Age Analysis
    const electricalAge = new Date().getFullYear() - (property.year_built || new Date().getFullYear());
    if (electricalAge > 25) {
      predictions.push({
        type: 'upgrade_recommendation',
        category: 'Electrical',
        title: 'Impianto Elettrico Obsoleto',
        description: `L'impianto elettrico ha circa ${electricalAge} anni. Gli impianti oltre 25 anni richiedono ispezione approfondita e potenziale aggiornamento.`,
        ai_reasoning: `Anno costruzione: ${property.year_built}. Età impianto: ${electricalAge} anni. Standard moderni: 25 anni vita utile. Rischio: non conformità normative attuali.`,
        priority: 'High',
        estimated_cost_savings: 2000,
        time_horizon: 'Short-term (1-6 months)',
        suggested_action: 'Ispezione impianto elettrico e valutazione aggiornamento',
      });
    }

    // Plumbing Risk Analysis
    const waterLeaks = tickets.filter(t => t.issue_type === 'Water Leak').length;
    if (waterLeaks >= 3) {
      predictions.push({
        type: 'risk_reduction',
        category: 'Plumbing',
        title: 'Rischio Idraulico Elevato',
        description: `Registrati ${waterLeaks} ticket per perdite d'acqua. Pattern ricorrente indica potenziale problema strutturale negli impianti.`,
        ai_reasoning: `Ticket analisi: ${waterLeaks} eventi "Water Leak" in ${tickets.length} ticket totali (${((waterLeaks/tickets.length)*100).toFixed(1)}%). Soglia critica: 3 eventi.`,
        priority: 'Critical',
        estimated_cost_savings: 5000,
        time_horizon: 'Immediate (0-30 days)',
        suggested_action: 'Ispezione completa impianti idraulici con termografia',
      });
    }

    // Roofing Lifecycle Analysis
    const roofAge = new Date().getFullYear() - (property.year_built || new Date().getFullYear());
    const roofingProjects = projects.filter(p => p.title.toLowerCase().includes('tetto') || p.title.toLowerCase().includes('copertura'));
    const lastRoofing = roofingProjects.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
    const actualRoofAge = lastRoofing 
      ? (new Date() - new Date(lastRoofing.created_date)) / (1000 * 60 * 60 * 24 * 365)
      : roofAge;

    if (actualRoofAge > 20) {
      predictions.push({
        type: 'predictive_maintenance',
        category: 'Roofing',
        title: 'Ispezione Tetto Raccomandata',
        description: `Il tetto ha circa ${Math.round(actualRoofAge)} anni dall'ultimo intervento. Tettti oltre 20 anni richiedono ispezione annuale per prevenire infiltrazioni.`,
        ai_reasoning: `Età tetto: ${Math.round(actualRoofAge)} anni. Degrado tipico guaina: 20-25 anni. Rischio infiltrazioni: alto dopo 20 anni senza manutenzione.`,
        priority: 'Medium',
        estimated_cost_savings: 3000,
        time_horizon: 'Short-term (1-6 months)',
        suggested_action: 'Ispezione impermeabilizzazione e manto di copertura',
      });
    }

    // Equipment Warranty Tracking
    const expiringWarranties = equipment.filter(e => {
      if (!e.warranty_expiration) return false;
      const daysUntilExpiry = (new Date(e.warranty_expiration) - new Date()) / (1000 * 60 * 60 * 24);
      return daysUntilExpiry > 0 && daysUntilExpiry <= 90;
    });

    if (expiringWarranties.length > 0) {
      predictions.push({
        type: 'lifecycle_planning',
        category: 'Equipment',
        title: `Garanzie in Scadenza (${expiringWarranties.length})`,
        description: `${expiringWarranties.length} equipaggiamenti hanno garanzia in scadenza nei prossimi 90 giorni.`,
        ai_reasoning: `Monitoraggio garanzie: ${expiringWarranties.map(e => e.name).join(', ')}. Scadenza entro 90 giorni. Opportunità: eseguire manutenzione prima della scadenza.`,
        priority: 'Medium',
        estimated_cost_savings: 1000,
        time_horizon: 'Short-term (1-6 months)',
        suggested_action: 'Programmare manutenzione pre-scadenza garanzia',
      });
    }

    // Cost Optimization: Energy Efficiency
    const hasRenewableEnergy = equipment.some(e => e.category === 'Renewable Energy');
    if (!hasRenewableEnergy && property.square_meters && property.square_meters > 100) {
      predictions.push({
        type: 'efficiency_improvement',
        category: 'Energy',
        title: 'Opportunità Efficienza Energetica',
        description: `Proprietà di ${property.square_meters} mq senza sistemi di energia rinnovabile. Valutare installazione fotovoltaico o solare termico.`,
        ai_reasoning: `Superficie: ${property.square_meters} mq. Energia rinnovabile: assente. Potenziale risparmio: 30-50% bolletta energetica. ROI tipico: 5-7 anni.`,
        priority: 'Low',
        estimated_cost_savings: 1500,
        time_horizon: 'Long-term (1+ years)',
        suggested_action: 'Valutazione fattibilità impianto fotovoltaico',
      });
    }

    // Create insights in database
    for (const prediction of predictions) {
      const insight = await base44.entities.PropertyInsight.create({
        company_id: property.company_id,
        property_id,
        insight_type: prediction.type === 'maintenance' ? 'Predictive Maintenance' :
                     prediction.type === 'risk_reduction' ? 'Risk Reduction' :
                     prediction.type === 'efficiency_improvement' ? 'Efficiency Improvement' :
                     prediction.type === 'upgrade_recommendation' ? 'Upgrade Recommendation' : 'Lifecycle Planning',
        title: prediction.title,
        description: prediction.description,
        ai_reasoning: prediction.ai_reasoning,
        priority: prediction.priority,
        estimated_impact: prediction.priority === 'Critical' ? 'High' : prediction.priority === 'High' ? 'Medium' : 'Low',
        estimated_cost_savings: prediction.estimated_cost_savings,
        time_horizon: prediction.time_horizon,
        actionable: true,
        suggested_action: prediction.suggested_action,
        status: 'New',
        generated_date: new Date().toISOString(),
        metadata: { category: prediction.category },
      });
      
      generatedInsights.push(insight);
    }

    return Response.json({
      insights: generatedInsights,
      predictions_count: predictions.length,
      property_id,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});