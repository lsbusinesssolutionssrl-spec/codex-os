# Property Knowledge Graph Architecture

## Panoramica

Codex OS implementa un **Property Knowledge Graph** che connette tutte le entità del sistema in una rete semantica di relazioni, abilitando query complesse e insight contestuali.

---

## Entity Core del Graph

### Nodi Principali

```
Company (Tenant)
├── Client
│   └── Property
│       ├── Equipment
│       ├── Maintenance
│       ├── Risk
│       ├── Insight
│       ├── IoTDevice
│       └── Project
│           ├── Task
│           ├── Cost
│           └── Checklist
├── Supplier
├── User
└── Document
```

---

## Relazioni (Edges)

### 1. Property → Systems

**Relation:** `HAS_EQUIPMENT`
```typescript
Property {
  id: "prop_123"
}
-- [HAS_EQUIPMENT] -->
PropertyEquipment {
  id: "equip_456",
  name: "HVAC System",
  category: "HVAC",
  installation_date: "2020-03-15",
  warranty_expiration: "2025-03-15"
}
```

**Properties:**
- installation_date
- warranty_status
- maintenance_count
- replacement_cost

---

### 2. Equipment → Maintenance

**Relation:** `REQUIRES_MAINTENANCE`
```typescript
PropertyEquipment {
  id: "equip_456"
}
-- [REQUIRES_MAINTENANCE] -->
PropertyMaintenance {
  id: "maint_789",
  maintenance_type: "Preventive",
  scheduled_date: "2024-06-01",
  status: "Scheduled",
  cost: 300
}
```

**Properties:**
- maintenance_interval_months
- last_maintenance_date
- next_due_date
- total_cost_ytd

---

### 3. Equipment → Tickets

**Relation:** `HAS_ISSUE`
```typescript
PropertyEquipment {
  id: "equip_456"
}
-- [HAS_ISSUE {severity: 'High', count: 3}] -->
SupportTicket {
  id: "ticket_001",
  issue_type: "HVAC Failure",
  status: "Open",
  created_date: "2024-05-20"
}
```

**Properties:**
- issue_count
- last_issue_date
- recurring (boolean)
- resolution_rate

---

### 4. Property → Projects

**Relation:** `INTERVENTION_HISTORY`
```typescript
Property {
  id: "prop_123"
}
-- [INTERVENTION_HISTORY] -->
Project {
  id: "proj_999",
  title: "HVAC Replacement",
  status: "Delivered",
  contract_value: 5000,
  start_date: "2023-08-01",
  end_date: "2023-08-15"
}
```

**Properties:**
- intervention_count
- total_invested
- last_intervention_date
- roi_estimate

---

### 5. Project → Costs

**Relation:** `INCURRED_COST`
```typescript
Project {
  id: "proj_999"
}
-- [INCURRED_COST] -->
ProjectCost {
  id: "cost_111",
  cost_type: "Material",
  category: "HVAC Equipment",
  total_cost: 3000,
  paid: true
}
```

**Properties:**
- cost_category
- actual_vs_budget
- payment_status

---

### 6. Project → Documents

**Relation:** `HAS_DOCUMENTATION`
```typescript
Project {
  id: "proj_999"
}
-- [HAS_DOCUMENTATION] -->
Document {
  id: "doc_222",
  type: "Invoice",
  url: "s3://...",
  related_entity_type: "Project",
  related_entity_id: "proj_999"
}
```

**Properties:**
- document_type
- upload_date
- expiry_date (if applicable)

---

### 7. Property → Risks

**Relation:** `HAS_RISK`
```typescript
Property {
  id: "prop_123"
}
-- [HAS_RISK {severity: 'Critical'}] -->
PropertyRisk {
  id: "risk_333",
  risk_type: "Water Leak",
  severity: "Critical",
  confidence_level: 90,
  estimated_cost_impact: 5000
}
```

**Properties:**
- risk_severity
- confidence
- mitigation_status
- cost_impact

---

### 8. Risk → Maintenance

**Relation:** `MITIGATED_BY`
```typescript
PropertyRisk {
  id: "risk_333"
}
-- [MITIGATED_BY] -->
PropertyMaintenance {
  id: "maint_444",
  title: "Plumbing Inspection",
  maintenance_type: "Corrective",
  status: "Scheduled"
}
```

**Properties:**
- mitigation_effectiveness
- risk_reduction_pct

---

### 9. Property → Insights

**Relation:** `HAS_INSIGHT`
```typescript
Property {
  id: "prop_123"
}
-- [HAS_INSIGHT {priority: 'High'}] -->
PropertyInsight {
  id: "insight_555",
  insight_type: "Predictive Maintenance",
  title: "HVAC Maintenance Overdue",
  estimated_cost_savings: 500,
  actionable: true
}
```

**Properties:**
- insight_priority
- estimated_impact
- action_status

---

### 10. Insight → Action

**Relation:** `GENERATES_ACTION`
```typescript
PropertyInsight {
  id: "insight_555"
}
-- [GENERATES_ACTION] -->
PropertyMaintenance {
  id: "maint_666",
  title: "HVAC Maintenance",
  ai_generated: true,
  ai_reasoning: "..."
}
```

**Properties:**
- action_taken
- action_date
- outcome

---

### 11. Client → Property

**Relation:** `OWNS_PROPERTY`
```typescript
Client {
  id: "client_777",
  name: "Mario Rossi"
}
-- [OWNS_PROPERTY] -->
Property {
  id: "prop_123",
  property_name: "Villa Verde"
}
```

**Properties:**
- ownership_type
- acquisition_date
- portfolio_priority

---

### 12. Supplier → Project

**Relation:** `CONTRACTED_FOR`
```typescript
Supplier {
  id: "supp_888",
  name: "Idraulica Rossi Srl",
  category: "Plumbing"
}
-- [CONTRACTED_FOR] -->
Project {
  id: "proj_999",
  title: "Bathroom Renovation"
}
```

**Properties:**
- contract_value
- performance_rating
- repeat_collaboration

---

## Graph Queries (Esempi)

### Query 1: Property Health Traversal

```javascript
// Get full health picture for a property
const property = await base44.entities.Property.get(propId);

const healthData = {
  equipment: await base44.entities.PropertyEquipment.filter({ property_id: propId }),
  maintenance: await base44.entities.PropertyMaintenance.filter({ property_id: propId }),
  tickets: await base44.entities.SupportTicket.filter({ property_id: propId }),
  risks: await base44.entities.PropertyRisk.filter({ property_id: propId }),
  insights: await base44.entities.PropertyInsight.filter({ property_id: propId }),
  projects: await base44.entities.Project.filter({ property_id: propId }),
};

// Calculate health score
const score = calculateHealthScore(healthData);
```

---

### Query 2: Recurring Issues Detection

```javascript
// Find equipment with repeated failures
const equipment = await base44.entities.PropertyEquipment.filter({ property_id: propId });

const recurringIssues = await Promise.all(
  equipment.map(async (equip) => {
    const tickets = await base44.entities.SupportTicket.filter({
      property_id: propId,
      // Filter by equipment name in title/description
    });
    
    if (tickets.length >= 2) {
      return {
        equipment: equip,
        issue_count: tickets.length,
        last_occurrence: tickets.sort(...)[0],
      };
    }
  })
);
```

---

### Query 3: Lifecycle Cost Analysis

```javascript
// Total cost of ownership for equipment
async function getLifecycleCost(equipmentId) {
  const equipment = await base44.entities.PropertyEquipment.get(equipmentId);
  
  // Find all related maintenance
  const maintenance = await base44.entities.PropertyMaintenance.filter({
    equipment_id: equipmentId,
  });
  const maintenanceCost = maintenance.reduce((sum, m) => sum + (m.cost || 0), 0);
  
  // Find related projects (installations/upgrades)
  const projects = await base44.entities.Project.filter({
    property_id: equipment.property_id,
    // Filter by equipment category
  });
  const projectCost = projects.reduce((sum, p) => sum + (p.contract_value || 0), 0);
  
  return {
    initial_cost: projectCost,
    maintenance_cost: maintenanceCost,
    total_lifecycle_cost: projectCost + maintenanceCost,
    years_in_service: calculateYearsInService(equipment.installation_date),
    annual_cost: (projectCost + maintenanceCost) / calculateYearsInService(equipment.installation_date),
  };
}
```

---

### Query 4: Risk Propagation

```javascript
// How one risk affects other systems
async function getRiskPropagation(riskId) {
  const risk = await base44.entities.PropertyRisk.get(riskId);
  
  // Find related equipment
  const relatedEquipment = await findEquipmentByRiskType(risk.risk_type);
  
  // Find related properties (if multi-property risk)
  const relatedProperties = await findPropertiesAtRisk(risk.risk_type);
  
  // Calculate total exposure
  const totalExposure = relatedEquipment.reduce((sum, e) => 
    sum + (e.replacement_cost_estimate || 0), 0);
  
  return {
    primary_risk: risk,
    affected_equipment: relatedEquipment,
    affected_properties: relatedProperties,
    total_exposure: totalExposure,
    recommended_actions: risk.recommended_actions,
  };
}
```

---

### Query 5: Insight-to-Action Tracking

```javascript
// Track how many insights become actions
async function getInsightConversion(propertyId) {
  const insights = await base44.entities.PropertyInsight.filter({
    property_id: propertyId,
  });
  
  const conversionData = await Promise.all(
    insights.map(async (insight) => {
      // Check if insight generated maintenance
      const maintenance = await base44.entities.PropertyMaintenance.filter({
        property_id: propertyId,
        ai_generated: true,
        // Match by insight reference
      });
      
      return {
        insight,
        converted: maintenance.length > 0,
        actions: maintenance,
      };
    })
  );
  
  const conversionRate = conversionData.filter(d => d.converted).length / insights.length;
  
  return {
    total_insights: insights.length,
    converted_insights: conversionData.filter(d => d.converted).length,
    conversion_rate: conversionRate,
    total_actions: conversionData.reduce((sum, d) => sum + d.actions.length, 0),
  };
}
```

---

## Graph Visualization

### Node Types
- **Property** (center node)
- **Equipment** (connected to property)
- **Maintenance** (connected to equipment/property)
- **Ticket** (connected to property/equipment)
- **Risk** (connected to property)
- **Insight** (connected to property)
- **Project** (connected to property)
- **Client** (connected to property)
- **Supplier** (connected to projects)

### Edge Weights
- **Strong** (weight=3): Direct relationships (property-equipment)
- **Medium** (weight=2): Indirect relationships (equipment-maintenance)
- **Weak** (weight=1): Temporal relationships (property-project)

---

## Implementation Patterns

### Pattern 1: Entity References

```javascript
// Store entity references in metadata
PropertyInsight {
  linked_entities: [
    { entity_type: 'PropertyEquipment', entity_id: 'equip_123' },
    { entity_type: 'PropertyRisk', entity_id: 'risk_456' },
  ]
}
```

### Pattern 2: Bidirectional Links

```javascript
// Equipment → Tickets
PropertyEquipment {
  linked_tickets: ['ticket_1', 'ticket_2']
}

// Ticket → Equipment (reverse)
SupportTicket {
  related_equipment_id: 'equip_123'
}
```

### Pattern 3: Aggregated Metrics

```javascript
// Pre-calculated graph metrics on property
Property {
  graph_metrics: {
    total_equipment: 15,
    active_tickets: 3,
    pending_maintenance: 5,
    active_risks: 2,
    total_invested: 150000,
    health_score: 78,
    last_updated: '2024-05-27'
  }
}
```

---

## AI/ML Opportunities

### 1. Link Prediction
```
Predict: Which equipment will need maintenance next?
Features: Age, maintenance history, ticket patterns, seasonality
Model: Graph neural network (GNN)
```

### 2. Node Classification
```
Predict: Is this property high-risk?
Features: Equipment age, ticket frequency, maintenance compliance
Model: Random forest on graph features
```

### 3. Community Detection
```
Find: Clusters of properties with similar issues
Use case: Benchmarking, pattern recognition
Algorithm: Louvain community detection
```

### 4. Centrality Analysis
```
Find: Most critical equipment in property network
Metric: Betweenness centrality
Action: Prioritize maintenance for high-centrality nodes
```

---

## Benefits

**Operational:**
- Query complesse su dati correlati
- Identificazione pattern nascosti
- Decisioni basate su contesto completo

**AI/ML:**
- Feature engineering da relazioni
- Training data arricchito
- Predictive accuracy migliorata

**Business:**
- Upsell identificato tramite pattern
- Risk exposure quantificato
- ROI per intervento calcolato

---

## Future Enhancements

1. **Graph Database**: Migrare a Neo4j o Amazon Neptune per query più efficienti
2. **Real-time Updates**: Subscription a cambiamenti nel graph
3. **Visual Explorer**: UI per navigare il knowledge graph
4. **Semantic Search**: Ricerca basata su relazioni, non solo keyword
5. **Recommendation Engine**: "Properties like this also had..."

---

## Security

- **Tenant Isolation**: company_id filter su tutte le query
- **Access Control**: Property-scoped permissions
- **Audit Trail**: Log di tutte le traversals
- **Data Minimization**: Only necessary relationships exposed