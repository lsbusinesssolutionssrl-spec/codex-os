# Property Knowledge Graph Architecture

## Panoramica

Codex OS implementa un **Property Knowledge Graph** che connette tutte le entità relative alle proprietà in una rete semantica interconnessa. Questo permette all'AI di ragionare su relazioni complesse e generare insight predittivi avanzati.

---

## Nodi del Grafo (Entities)

### Core Nodes

```
📍 Property (Nodo Centrale)
├── 🏢 Client (proprietario)
├── 🏗️ Projects (interventi)
├── 🎫 Tickets (issue)
├── 🔧 Equipment (sistemi)
├── 🛠️ Maintenance (manutenzioni)
├── ⚠️ Risks (rischi)
├── 💡 Insights (AI recommendations)
├── 📄 Documents (certificazioni)
└── 👷 Suppliers (fornitori)
```

---

## Relazioni del Grafo

### 1. Property ↔ Client

**Relazione:** `OWNED_BY` / `OWNS`
```typescript
Property {
  client_id: string → Client.id
}

Client {
  properties: Property[] (derived)
}
```

**Query Example:**
```javascript
// Trova tutte le proprietà di un cliente
const properties = await base44.entities.Property.filter({ 
  client_id: clientId 
});
```

---

### 2. Property ↔ Projects

**Relazione:** `HAS_PROJECT` / `BELONGS_TO`
```typescript
Property {
  projects: Project[] (derived via property_id)
}

Project {
  property_id: string → Property.id
}
```

**Relazioni Derivative:**
- `Project → Estimate` (CONVERTED_FROM)
- `Project → ProjectCost` (HAS_COST)
- `Project → Task` (HAS_TASK)

**Query Example:**
```javascript
// Storico interventi per proprietà
const projects = await base44.entities.Project.filter({ 
  property_id: propertyId 
});
```

---

### 3. Property ↔ Tickets

**Relazione:** `HAS_TICKET` / `REPORTED_AT`
```typescript
Property {
  tickets: SupportTicket[] (derived via property_id)
}

SupportTicket {
  property_id: string → Property.id
}
```

**Relazioni Derivative:**
- `Ticket → Client` (REPORTED_BY)
- `Ticket → Technician` (ASSIGNED_TO)
- `Ticket → GuardianSubscription` (COVERED_BY)

**Pattern Detection:**
```javascript
// Rileva issue ricorrenti
const tickets = await base44.entities.SupportTicket.filter({ 
  property_id: propertyId 
});

const issuePatterns = {};
tickets.forEach(t => {
  const key = t.issue_type;
  issuePatterns[key] = (issuePatterns[key] || 0) + 1;
});

// Se issue_type >= 3 → rischio ricorrenza
if (issuePatterns['Water Leak'] >= 3) {
  // Crea risk: "Perdite ricorrenti"
}
```

---

### 4. Property ↔ Equipment

**Relazione:** `HAS_EQUIPMENT` / `INSTALLED_IN`
```typescript
Property {
  equipment: PropertyEquipment[] (derived via property_id)
}

PropertyEquipment {
  property_id: string → Property.id
}
```

**Relazioni Equipment:**
- `Equipment → Maintenance` (REQUIRES)
- `Equipment → Tickets` (HAS_ISSUE)
- `Equipment → Supplier` (SUPPLIED_BY)
- `Equipment → Documents` (HAS_MANUAL)

**Lifecycle Tracking:**
```typescript
PropertyEquipment {
  installation_date: date
  warranty_expiration: date
  expected_lifespan_years: number
  last_maintenance_date: date
  next_maintenance_due: date
  status: enum
}
```

---

### 5. Property ↔ Maintenance

**Relazione:** `REQUIRES_MAINTENANCE` / `PERFORMED_AT`
```typescript
Property {
  maintenance: PropertyMaintenance[] (derived via property_id)
}

PropertyMaintenance {
  property_id: string → Property.id
  equipment_id?: string → PropertyEquipment.id
}
```

**Relazioni Derivative:**
- `Maintenance → Equipment` (PERFORMED_ON)
- `Maintenance → Supplier` (PERFORMED_BY)
- `Maintenance → Project` (GENERATED_FROM)

**Compliance Tracking:**
```javascript
// Calcola compliance rate
const maintenance = await base44.entities.PropertyMaintenance.filter({ 
  property_id: propertyId 
});

const total = maintenance.length;
const completed = maintenance.filter(m => m.status === 'Completed').length;
const overdue = maintenance.filter(m => 
  m.status === 'Scheduled' && new Date(m.scheduled_date) < new Date()
).length;

const complianceRate = (completed / total * 100);
```

---

### 6. Property ↔ Risks

**Relazione:** `HAS_RISK` / `AFFECTS`
```typescript
Property {
  risks: PropertyRisk[] (derived via property_id)
}

PropertyRisk {
  property_id: string → Property.id
  linked_maintenance_id?: string → PropertyMaintenance.id
  linked_ticket_id?: string → SupportTicket.id
}
```

**Risk Evidence Graph:**
```typescript
PropertyRisk {
  evidence: string[] // Array di entity IDs
  // Example: ["ticket_123", "ticket_456", "project_789"]
  
  ai_reasoning: string // Spiegazione del rischio
  confidence_level: number // 0-100
}
```

**Risk Propagation:**
```javascript
// Se risk_type = "Water Leak" e severity = "Critical"
// → Crea maintenance preventiva
// → Crea insight AI
// → Notifica cliente

if (risk.severity === 'Critical') {
  await base44.entities.PropertyMaintenance.create({
    property_id: risk.property_id,
    maintenance_type: 'Emergency',
    title: `Intervento urgente: ${risk.title}`,
    ai_generated: true,
    ai_reasoning: `Generato da rischio critico: ${risk.ai_reasoning}`,
  });
  
  await base44.entities.PropertyInsight.create({
    property_id: risk.property_id,
    insight_type: 'Risk Reduction',
    title: `Mitigazione: ${risk.title}`,
    suggested_action: risk.recommended_actions[0],
  });
}
```

---

### 7. Property ↔ AI Insights

**Relazione:** `HAS_INSIGHT` / `GENERATED_FOR`
```typescript
Property {
  insights: PropertyInsight[] (derived via property_id)
}

PropertyInsight {
  property_id: string → Property.id
  linked_entities: {
    entity_type: string
    entity_id: string
  }[]
}
```

**Insight Types:**
- `Predictive Maintenance` → linked to Equipment
- `Cost Optimization` → linked to Projects
- `Risk Reduction` → linked to Risks
- `Efficiency Improvement` → linked to Equipment/Property
- `Lifecycle Planning` → linked to multiple entities

**AI Reasoning Chain:**
```javascript
// Example: AI genera insight connesso a multiple entities
const insight = await base44.entities.PropertyInsight.create({
  property_id: propertyId,
  insight_type: 'Predictive Maintenance',
  title: 'Sostituzione HVAC raccomandata',
  description: 'HVAC ha 18 anni, efficienza < 70%',
  ai_reasoning: `
    Equipment età: 18 anni (installation_date: 2008)
    Efficiency degradation: 32% (da telemetry)
    Manutenzioni: 3 negli ultimi 5 anni (sotto media)
    Ticket correlati: 2 (HVAC Failure)
    Costo sostituzione: €8,000
    Costo riparazioni annuali: €1,200
    ROI sostituzione: 6.7 anni
  `,
  linked_entities: [
    { entity_type: 'PropertyEquipment', entity_id: hvacId },
    { entity_type: 'PropertyMaintenance', entity_id: maintId },
    { entity_type: 'SupportTicket', entity_id: ticketId1 },
    { entity_type: 'SupportTicket', entity_id: ticketId2 },
  ],
  estimated_cost_savings: 15000, // 10 anni di riparazioni evitate
  time_horizon: 'Long-term (1+ years)',
});
```

---

### 8. Property ↔ Suppliers

**Relazione:** `SERVED_BY` / `SERVES`
```typescript
// Indiretta tramite Projects, Maintenance, Equipment
Property {
  suppliers: Supplier[] (derived via relationships)
}

Project {
  supplier_id?: string → Supplier.id
}

PropertyMaintenance {
  supplier_id?: string → Supplier.id
}

PropertyEquipment {
  supplier_id?: string → Supplier.id
}
```

**Supplier Network:**
```javascript
// Trova tutti i fornitori per una proprietà
const [projects, maintenance, equipment] = await Promise.all([
  base44.entities.Project.filter({ property_id: propertyId }),
  base44.entities.PropertyMaintenance.filter({ property_id: propertyId }),
  base44.entities.PropertyEquipment.filter({ property_id: propertyId }),
]);

const supplierIds = new Set([
  ...projects.map(p => p.supplier_id).filter(Boolean),
  ...maintenance.map(m => m.supplier_id).filter(Boolean),
  ...equipment.map(e => e.supplier_id).filter(Boolean),
]);

const suppliers = await base44.entities.Supplier.filter({ 
  id: { $in: Array.from(supplierIds) } 
});
```

---

### 9. Systems Interconnections

**Equipment ↔ Projects:**
```typescript
// Un progetto può installare/modificare equipment
Project {
  title: "Sostituzione HVAC"
  // Dopo completamento:
  → Crea PropertyEquipment (nuovo HVAC)
  → Aggiorna PropertyEquipment.status (decommissioned per vecchio)
}
```

**Equipment ↔ Maintenance:**
```typescript
PropertyEquipment {
  last_maintenance_date: date
  next_maintenance_due: date
  maintenance_interval_months: number
}

PropertyMaintenance {
  equipment_id: string → PropertyEquipment.id
  // After completion:
  → Aggiorna Equipment.last_maintenance_date
  → Calcola Equipment.next_maintenance_due
}
```

**Tickets ↔ Risks:**
```javascript
// Pattern: 3+ ticket stesso issue_type → Risk
const ticketsByType = {};
tickets.forEach(t => {
  ticketsByType[t.issue_type] = (ticketsByType[t.issue_type] || 0) + 1;
});

Object.entries(ticketsByType).forEach(([type, count]) => {
  if (count >= 3) {
    await base44.entities.PropertyRisk.create({
      property_id: propertyId,
      risk_type: mapIssueToRisk(type),
      severity: count >= 5 ? 'Critical' : 'High',
      confidence_level: 85 + (count * 3),
      evidence: tickets.filter(t => t.issue_type === type).map(t => t.id),
      ai_reasoning: `${count} ticket per ${type} negli ultimi 12 mesi`,
    });
  }
});
```

---

## Graph Traversal Examples

### Example 1: Impact Analysis

**Query:** "Qual è l'impatto totale di un rischio su una proprietà?"

```javascript
async function calculateRiskImpact(riskId) {
  const risk = await base44.entities.PropertyRisk.get(riskId);
  
  // 1. Trova ticket correlati
  const tickets = await base44.entities.SupportTicket.filter({ 
    property_id: risk.property_id,
    issue_type: mapRiskToIssue(risk.risk_type)
  });
  
  // 2. Trova equipment interessato
  const equipment = await base44.entities.PropertyEquipment.filter({
    property_id: risk.property_id,
    category: mapRiskToCategory(risk.risk_type)
  });
  
  // 3. Trova manutenzione necessaria
  const maintenance = await base44.entities.PropertyMaintenance.filter({
    property_id: risk.property_id,
    status: 'Scheduled'
  });
  
  // 4. Calcola costo totale
  const totalCost = 
    tickets.reduce((sum, t) => sum + (t.estimated_cost || 0), 0) +
    equipment.reduce((sum, e) => sum + (e.replacement_cost_estimate || 0), 0) +
    maintenance.reduce((sum, m) => sum + (m.cost || 0), 0);
  
  return {
    risk,
    impact: {
      tickets: tickets.length,
      equipment: equipment.length,
      maintenance: maintenance.length,
      total_cost: totalCost,
      timeline: getTimeline(tickets, equipment, maintenance),
    }
  };
}
```

### Example 2: Predictive Maintenance Chain

**Query:** "Quali manutenzioni saranno necessarie nei prossimi 6 mesi?"

```javascript
async function predictMaintenance(propertyId, months = 6) {
  const [equipment, maintenanceHistory, risks, insights] = await Promise.all([
    base44.entities.PropertyEquipment.filter({ property_id: propertyId }),
    base44.entities.PropertyMaintenance.filter({ property_id: propertyId }),
    base44.entities.PropertyRisk.filter({ property_id: propertyId, status: { $ne: 'Resolved' } }),
    base44.entities.PropertyInsight.filter({ property_id: propertyId, status: 'New' }),
  ]);
  
  const predictions = [];
  
  // 1. Equipment-based predictions
  equipment.forEach(e => {
    if (e.next_maintenance_due) {
      const dueDate = new Date(e.next_maintenance_due);
      const monthsUntilDue = (dueDate - new Date()) / (1000 * 60 * 60 * 24 * 30);
      
      if (monthsUntilDue <= months) {
        predictions.push({
          type: 'scheduled',
          equipment: e.name,
          due_date: dueDate,
          priority: monthsUntilDue <= 1 ? 'High' : 'Medium',
          source: 'Equipment schedule',
        });
      }
    }
    
    // Age-based replacement
    const age = new Date().getFullYear() - new Date(e.installation_date).getFullYear();
    if (age >= e.expected_lifespan_years * 0.9) {
      predictions.push({
        type: 'replacement',
        equipment: e.name,
        reason: `Età: ${age} anni (vita utile: ${e.expected_lifespan_years})`,
        priority: 'High',
        estimated_cost: e.replacement_cost_estimate,
      });
    }
  });
  
  // 2. Risk-based predictions
  risks.filter(r => r.severity === 'Critical' || r.severity === 'High').forEach(r => {
    predictions.push({
      type: 'preventive',
      reason: `Mitigazione rischio: ${r.title}`,
      priority: r.severity,
      source: 'Risk engine',
    });
  });
  
  // 3. AI insights
  insights.forEach(i => {
    if (i.insight_type === 'Predictive Maintenance') {
      predictions.push({
        type: 'ai_generated',
        title: i.title,
        reasoning: i.ai_reasoning,
        estimated_savings: i.estimated_cost_savings,
      });
    }
  });
  
  return predictions.sort((a, b) => {
    const priorityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}
```

### Example 3: Property Health Score (Graph-Based)

```javascript
async function calculatePropertyHealthScore(propertyId) {
  const [property, tickets, projects, equipment, maintenance, risks] = await Promise.all([
    base44.entities.Property.get(propertyId),
    base44.entities.SupportTicket.filter({ property_id: propertyId }),
    base44.entities.Project.filter({ property_id: propertyId }),
    base44.entities.PropertyEquipment.filter({ property_id: propertyId }),
    base44.entities.PropertyMaintenance.filter({ property_id: propertyId }),
    base44.entities.PropertyRisk.filter({ property_id: propertyId }),
  ]);
  
  let score = 100;
  const factors = [];
  
  // Factor 1: Active tickets (-3 per ticket)
  const activeTickets = tickets.filter(t => t.status !== 'Resolved' && t.status !== 'Closed').length;
  score -= activeTickets * 3;
  factors.push({ name: 'Active Tickets', impact: -activeTickets * 3, value: activeTickets });
  
  // Factor 2: Equipment age
  const oldEquipment = equipment.filter(e => {
    const age = new Date().getFullYear() - new Date(e.installation_date).getFullYear();
    return age > e.expected_lifespan_years * 0.8;
  }).length;
  score -= oldEquipment * 5;
  factors.push({ name: 'Old Equipment', impact: -oldEquipment * 5, value: oldEquipment });
  
  // Factor 3: Maintenance compliance
  const overdueMaintenance = maintenance.filter(m => 
    m.status === 'Scheduled' && new Date(m.scheduled_date) < new Date()
  ).length;
  score -= overdueMaintenance * 4;
  factors.push({ name: 'Overdue Maintenance', impact: -overdueMaintenance * 4, value: overdueMaintenance });
  
  // Factor 4: Active risks
  const activeRisks = risks.filter(r => r.status !== 'Resolved' && r.status !== 'Mitigating').length;
  const criticalRisks = risks.filter(r => r.severity === 'Critical').length;
  score -= activeRisks * 5 + criticalRisks * 10;
  factors.push({ 
    name: 'Active Risks', 
    impact: -(activeRisks * 5 + criticalRisks * 10), 
    value: `${activeRisks} (${criticalRisks} critical)` 
  });
  
  // Factor 5: Recent projects (positive if completed)
  const recentProjects = projects.filter(p => {
    const endDate = new Date(p.actual_end_date || p.expected_end_date);
    const monthsAgo = (new Date() - endDate) / (1000 * 60 * 60 * 24 * 30);
    return monthsAgo <= 12 && p.status === 'Delivered';
  }).length;
  score += recentProjects * 2;
  factors.push({ name: 'Recent Projects', impact: recentProjects * 2, value: recentProjects });
  
  return {
    score: Math.max(0, Math.min(100, score)),
    factors,
    severity: score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Warning' : 'Critical',
  };
}
```

---

## Knowledge Graph Benefits

### 1. AI Reasoning Enhancement

**Senza Graph:**
```
"Manutenzione HVAC raccomandata"
```

**Con Graph:**
```
"Manutenzione HVAC raccomandata PERCHÉ:
- Equipment: 14 mesi senza manutenzione (intervallo: 12 mesi)
- Ticket: 2 chiamate per 'HVAC Failure' negli ultimi 3 mesi
- Risk: 'HVAC Efficiency Degradation' con severity: High
- Insight AI: Efficienza calata dal 92% al 74%
- Progetto 2010: Installazione originale (16 anni fa)
- Equipaggiamento correlato: Thermostat ha 8 anni (within lifespan)

AZIONI RACCOMANDATE:
1. Ispezione immediata (entro 7 giorni)
2. Preventivo sostituzione (se efficienza < 70%)
3. Monitoraggio telemetria (se IoT disponibile)

COSTI STIMATI:
- Manutenzione: €300
- Sostituzione (se necessaria): €5,000-8,000
- Inazione: €1,200/anno in riparazioni + €400/anno in energia extra"
```

### 2. Predictive Capabilities

**Pattern Recognition:**
```javascript
// Se Property A ha:
// - 3 water leak tickets
// - età impianto idraulico > 20 anni
// - maintenance compliance < 50%
// → Genera risk: "Probabile perdita strutturale"
// → Genera insight: "Sostituzione tubazioni raccomandata"
// → Genera maintenance: "Ispezione termografica"
```

### 3. Cross-Property Learning

```javascript
// Se 5 proprietà con:
// - Stesso tipo di HVAC
// - Stessa età (15-18 anni)
// - Tutte hanno avuto failures negli ultimi 6 mesi
// → Genera insight per TUTTE le proprietà con HVAC simile
// "Pattern rilevato: HVAC model X ha failure rate 80% a 15 anni"
```

---

## Implementation Status

### ✅ Implemented (Phase 1)

- [x] Entity: Property
- [x] Entity: PropertyEquipment
- [x] Entity: PropertyMaintenance
- [x] Entity: PropertyRisk
- [x] Entity: PropertyInsight
- [x] Entity: SupportTicket
- [x] Entity: Project
- [x] Entity: Supplier
- [x] Function: generatePredictiveInsights (graph traversal)
- [x] Component: PredictivePropertyHealth (health score)
- [x] Component: LifecycleTimeline (graph visualization)
- [x] Component: PredictiveGuardian (opportunity detection)

### 🔄 In Progress (Phase 2)

- [ ] Entity: IoTDevice (IoT-ready)
- [ ] Entity: IoTReading (design pronto)
- [ ] Function: ingestIoTTelemetry (design pronto)
- [ ] Real-time graph updates (subscriptions)

### 📋 Future (Phase 3)

- [ ] Graph database integration (Neo4j)
- [ ] ML-based relationship discovery
- [ ] Automated insight generation
- [ ] Cross-property pattern learning

---

## Query Performance

### Optimization Strategies

1. **Indexing:**
   - `property_id` su tutte le entity correlate
   - `status` per filtering rapido
   - `created_date` per timeline queries

2. **Caching:**
   - Health scores: cache 1 ora
   - Risk assessments: cache 30 min
   - Insights: cache fino a update

3. **Pagination:**
   - Max 50 results per query
   - Cursor-based pagination per timeline

4. **Parallel Fetching:**
   ```javascript
   const [tickets, projects, equipment, maintenance, risks] = await Promise.all([...]);
   ```

---

## Business Value

### Per Property Manager:
- **Decisioni basate su dati completi** (non silos)
- **Identificazione pattern invisibili** (cross-entity)
- **Prioritizzazione intelligente** (impact-based)

### Per Clienti:
- **Trasparenza totale** (tutte le relazioni visibili)
- **Prevenzione proattiva** (AI vede problemi prima che accadano)
- **Ottimizzazione costi** (lifecycle planning)

### Per Codex OS:
- **Competitive moat** (più dati → AI migliore → più clienti)
- **Revenue ricorrente** (subscription su insight premium)
- **Scalabilità** (graph cresce con ogni property)

---

## Next Steps

1. **Graph Visualization UI**
   - Interactive node-link diagram
   - Filter by entity type
   - Click to navigate relationships

2. **Graph-Based AI**
   - Graph neural networks per prediction
   - Embedding per similarity search
   - Automated relationship discovery

3. **Real-Time Updates**
   - WebSocket subscriptions per graph changes
   - Instant insight regeneration
   - Live health score updates

---

**Il Property Knowledge Graph è l'infrastruttura semantica che abilita l'intelligenza predittiva di Codex OS.** 🧠