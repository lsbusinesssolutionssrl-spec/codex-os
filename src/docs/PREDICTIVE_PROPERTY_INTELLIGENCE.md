# Predictive Property Intelligence

## Panoramica

Codex OS evolve da piattaforma di gestione progetti a **piattaforma di intelligence del ciclo di vita degli immobili**.

Il sistema trasforma ogni proprietà in un **digital twin** intelligente che:
- Monitora lo stato di salute in tempo reale
- Predice manutenzioni future
- Identifica rischi operativi
- Genera insight azionabili
- Ottimizza i costi del ciclo di vita

---

## Nuove Entity

### PropertyEquipment
Traccia tutti gli equipaggiamenti installati in una proprietà.

**Campi chiave:**
- `installation_date`, `warranty_expiration`, `expected_lifespan_years`
- `maintenance_interval_months`, `last_maintenance_date`, `next_maintenance_due`
- `linked_documents`, `linked_tickets`
- `replacement_cost_estimate`

**Categorie:** HVAC, Electrical, Plumbing, Security, Networking, Renewable Energy, Appliances

---

### PropertyMaintenance
Gestisce manutenzioni preventive, correttive e predittive.

**Campi chiave:**
- `maintenance_type`: Preventive, Corrective, Predictive, Inspection, Emergency
- `scheduled_date`, `completed_date`
- `checklist` (strutturata)
- `ai_generated`, `ai_reasoning`

**Integrazione:** Può essere generata automaticamente dall'AI sulla base di analisi predittive.

---

### PropertyRisk
Identifica e monitora rischi operativi.

**Campi chiave:**
- `risk_type`: Water Leak, Electrical Hazard, Structural, HVAC Failure, ecc.
- `severity`, `confidence_level` (0-100%)
- `ai_reasoning`: Spiegazione del perché il rischio è stato identificato
- `evidence`: Link a ticket, progetti, o altre entità che supportano il rischio
- `recommended_actions`, `estimated_cost_impact`

**Esempio:**
```
Risk: "Rischio Idraulico Elevato"
Type: Water Leak
Severity: Critical
Confidence: 90%
AI Reasoning: "3 ticket per perdite negli ultimi 6 mesi. Pattern ricorrente indica problema strutturale."
Evidence: [ticket_123, ticket_456, ticket_789]
Recommended Actions: ["Ispezione completa con termografia", "Sostituzione tubazioni"]
Estimated Cost Impact: €5000
```

---

### PropertyInsight
Genera insight azionabili basati su AI.

**Campi chiave:**
- `insight_type`: Predictive Maintenance, Cost Optimization, Risk Reduction, Efficiency Improvement
- `ai_reasoning`: Spiegazione dettagliata del ragionamento AI
- `estimated_cost_savings`
- `time_horizon`: Immediate, Short-term, Medium-term, Long-term
- `actionable`, `suggested_action`
- `status`: New, Reviewed, Actioned, Dismissed

**Esempio:**
```
Insight: "Manutenzione HVAC Scaduta"
Type: Predictive Maintenance
AI Reasoning: "Ultimo intervento: 2024-03-15. Intervallo raccomandato: 12 mesi. Ritardo: 5 mesi."
Estimated Savings: €500 (prevenzione guasti maggiori)
Time Horizon: Immediate (0-30 days)
Suggested Action: "Programmare manutenzione ordinaria HVAC"
```

---

## Componenti UI

### PredictivePropertyHealth
Componente avanzato che calcola il Property Health Score con analisi predittiva.

**Features:**
- Health Score 0-100 con 6 categorie (Electrical, Plumbing, HVAC, Roofing, Security, Networking)
- Manutenzioni predette con timeframe e costo stimato
- Problemi rilevati con livello di confidenza
- Raccomandazioni AI (con indicazione se generate da AI)

**Algoritmo:**
```javascript
// Electrical: età impianto + ticket correlati + note
score = 100 - (age * 1.5) - (tickets * 10) - (projects * 5)

// Plumbing: perdite registrate + anni senza interventi
score = 100 - (leaks * 12) - (years_since_maintenance * 5)

// HVAC: mesi senza manutenzione + età equipaggiamenti
score = 100 - (months_overdue * 3) - (equipment_age * 5)

// Roofing: età tetto + anni dall'ultimo intervento
score = 100 - (roof_age * 2)
```

---

### LifecycleTimeline
Timeline completa di tutti gli eventi della proprietà.

**Eventi tracciati:**
- Progetti (start/end date)
- Ticket (created_date)
- Manutenzioni (scheduled/completed date)
- Installazioni equipaggiamenti (installation_date)
- Rischi identificati (detected_date)
- Insight generati (generated_date)

**Filtri:** all, project, maintenance, ticket, equipment, risk, insight

---

### PropertyIntelligence (Dashboard Portafoglio)
Vista a livello di portafoglio per property manager.

**KPI:**
- Proprietà totali
- Salute media del portafoglio
- Proprietà critiche
- Manutenzioni upcoming (30 giorni)
- Equipaggiamenti tracciati
- Garanzie in scadenza (90 giorni)
- Rischi attivi
- Risparmio predetto totale

**Distribuzione salute:** Visualizzazione della distribuzione Excellent/Good/Warning/Critical

**Top Risks:** I 5 rischi più critici del portafoglio

---

## Backend Functions

### generatePredictiveInsights
Genera insight predittivi per una proprietà usando AI.

**Input:**
```json
{ "property_id": "..." }
```

**Analisi effettuate:**
1. **HVAC**: Controlla scadenza manutenzioni
2. **Electrical**: Valuta obsolescenza impianto
3. **Plumbing**: Identifica pattern di perdite ricorrenti
4. **Roofing**: Calcola età tetto e raccomanda ispezioni
5. **Equipment**: Traccia garanzie in scadenza
6. **Energy**: Suggerisce efficienza energetica

**Output:**
```json
{
  "insights": [...],
  "predictions_count": 6,
  "property_id": "..."
}
```

---

## AI Reasoning Layer

Ogni insight/rischio include una spiegazione dettagliata del **perché** è stato generato.

**Esempio:**
```
"Roof inspection suggested because:
- last intervention 6 years ago
- humidity-related tickets increased by 40%
- similar properties showed waterproofing failures at 5-7 years
- current age: 23 years (threshold: 20 years)"
```

**Benefici:**
- Trasparenza decisionale
- Fiducia nell'AI
- Audit trail
- Apprendimento continuo

---

## IoT-Ready Architecture

Il sistema è predisposto per integrazione IoT futura:

**Entity IoTDevice già esistente** supporta:
- Smart Thermostat
- Leak Sensor
- Energy Monitor
- Security Camera
- HVAC Controller
- Water/Electric Meter
- Motion/Door Sensors

**Integrazione futura:**
- Telemetria in tempo reale
- Alert automatici da sensori
- Manutenzione basata su condizioni reali (non solo tempo)
- Ottimizzazione energetica automatica

---

## Property Knowledge Graph

Relazioni tra entità:

```
Property
├── Equipment (installed)
│   ├── Maintenance (scheduled/completed)
│   └── Tickets (linked)
├── Projects (interventions)
│   └── Costs
├── Tickets (issues)
│   └── Maintenance (corrective)
├── Risks (identified)
│   └── Mitigation Actions
└── Insights (AI-generated)
    └── Actioned → Maintenance/Projects
```

**Query esempi:**
- "Mostra tutte le proprietà con rischio 'Water Leak' critico"
- "Quali equipaggiamenti hanno garanzia in scadenza e ticket aperti?"
- "Genera report costi manutenzione per categoria negli ultimi 12 mesi"

---

## Executive View

La dashboard **Property Intelligence** fornisce:

1. **Portfolio Health**: Salute media e distribuzione
2. **Risk Exposure**: Proprietà a maggior rischio
3. **Maintenance Backlog**: Manutenzioni pendenti
4. **Predicted Costs**: Costi di intervento predetti
5. **Opportunity Pipeline**: Insight azionabili per generazione revenue

---

## Implementation Status

✅ **Completato:**
- Entity: PropertyEquipment, PropertyMaintenance, PropertyRisk, PropertyInsight
- Componenti: PredictivePropertyHealth, LifecycleTimeline
- Funzione: generatePredictiveInsights
- Dashboard: PropertyIntelligence
- Integrazione in PropertyDetail

🔄 **Prossimi step:**
- Automazione generazione insight (scheduled)
- Integrazione IoT (sensori reali)
- Machine learning su pattern storici
- Benchmarking tra proprietà simili
- Alerting proattivo (email/SMS)

---

## Business Value

**Per Property Manager:**
- Riduzione costi manutenzione: 20-30%
- Prevenzione guasti critici
- Pianificazione budget accurata
- Aumento soddisfazione clienti

**Per Clienti:**
- Proprietà sempre in salute
- Minor downtime
- Trasparenza sullo stato
- Risparmio lungo termine

**Per Codex OS:**
- Differenziazione competitiva
- Revenue ricorrente (Guardian predittivo)
- Upsell su servizi professionali
- Data moat (più dati → AI migliore)

---

## Security & Privacy

- Tutti i dati sono tenant-scoped (company_id)
- AI reasoning è trasparente e auditabile
- Nessun dato sensibile nei modelli AI
- Compliance GDPR mantenuta

---

## Future Enhancements

1. **Computer Vision**: Analisi automatica foto per identificare danni
2. **NLP**: Estrazione insight da note e documenti non strutturati
3. **Predictive Analytics**: ML su dati storici per previsioni accurate
4. **Benchmarking**: Confronto con proprietà simili
5. **Automazione**: Creazione automatica ticket/manutenzioni da insight
6. **Mobile**: App tecnico con AR per identificazione equipaggiamenti