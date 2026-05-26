# 🏗️ Codex OS - Architecture Review & Productization Plan

## Executive Summary

Codex OS è stato trasformato da tool interno a piattaforma SaaS. Questo documento identifica problemi architetturali, duplicazioni e opportunità di ottimizzazione.

---

## 📊 Audit Summary

- **Entità Totali:** 19
- **Record Totali:** ~100+ (sample data)
- **Criticità:** 2
- **Problemi Media:** 5
- **Problemi Low:** 3

---

## 🔴 CRITICAL ISSUES (Priorità 1)

### 1. Broken Workflow: Estimate → Project Conversion
**Problema:** Preventivi accettati non si convertono automaticamente in progetti  
**Impatto:** Duplicazione dati, errore manuale, inconsistenza  
**Soluzione:** 
- Aggiungere campo `estimate_id` a Project entity
- Creare automazione o funzione "Converti in Progetto"
- Ereditare automaticamente costi e margini da Estimate

### 2. Permission Issues: Campi Finanziari
**Problema:** Technician possono modificare margini e costi  
**Impatto:** Rischio sicurezza, dati finanziari compromessi  
**Soluzione:**
- Implementare RLS (Row Level Security)
- Limitare edit campi finanziari ad admin/PM
- Creare viste separate per ruoli

---

## 🟠 MEDIUM ISSUES (Priorità 2)

### 3. Duplicated Fields
**Entità:** Estimate vs Project  
**Campi duplicati:**
- `revenue` vs `contract_value`
- `material_cost` vs `material_costs`
- `labor_cost` vs `labor_costs`
- `gross_margin`, `gross_margin_pct`

**Raccomandazione:** Unificare naming, calcolare on-the-fly

### 4. Duplicated Logic
**Entità:** EstimatePreset vs EstimateTemplate  
**Problema:** Due entità per lo stesso scopo (templating preventivi)  
**Soluzione:** Unificare in singola entità "EstimateTemplate"

### 5. Unused Tables
- **SOPTemplate:** 0 record → Rimuovere o incentivare
- **EstimateTemplate:** 0 record → Duplicato con EstimatePreset

### 6. Inconsistent Naming
- `payment_collected` vs `total_collected`
- `actual_costs` vs `material_costs + labor_costs + other_costs`

### 7. Navigation Issues
- Nessun breadcrumb nelle pagine dettaglio
- Client Portal isolato senza "Torna alla Dashboard"

---

## 🟢 OPTIMIZATION OPPORTUNITIES (Priorità 3)

### 8. Calcoli On-The-Fly
**Attuale:** `gross_margin`, `gross_margin_pct` memorizzati  
**Ottimizzazione:** Calcolare in frontend o con funzione dedicata  
**Benefit:** Riduzione duplicazione, consistenza garantita

### 9. Relazioni Esplicite
**Mancanti:**
- `estimate_id` in Project
- `project_id` in GuardianSubscription
- `property_id` in Estimate (già esiste, verificare uso)

**Benefit:** Traceability completa del flusso

### 10. Stato "Archived"
**Problema:** Nessun modo per archiviare progetti/estimate vecchi  
**Soluzione:** Aggiungere stato "Archived" o flag `is_archived`  
**Benefit:** Migliore organizzazione, performance queries

### 11. Indicizzazione
**Suggerimento:** Aggiungere indici su:
- `client_id`
- `project_id`
- `status`
- `created_date`

**Benefit:** Query più veloci su grandi dataset

---

## 📐 Entity Relationship Map

```
Client (1) ──→ (N) Property
Client (1) ──→ (N) Estimate
Client (1) ──→ (N) Project
Client (1) ──→ (N) GuardianSubscription
Client (1) ──→ (N) SupportTicket

Property (1) ──→ (N) Project
Property (1) ──→ (N) SupportTicket

Estimate (1) ──→ (1?) Project [MANCANTE estimate_id]

Project (1) ──→ (N) ChecklistItem
Project (1) ──→ (N) ProjectCost
Project (1) ──→ (N) Timesheet
Project (1) ──→ (N) PurchaseOrder
Project (1) ──→ (N) KnowledgeBase
Project (1) ──→ (1) ProjectLearning
Project (1) ──→ (N) IntelligenceInsight

Supplier (1) ──→ (N) ProjectCost
Supplier (1) ──→ (N) PurchaseOrder

GuardianSubscription (1) ──→ (N) SupportTicket
```

---

## 🎯 Productization Roadmap

### Phase 1: Core Fixes (1-2 settimane)
- [ ] Aggiungere `estimate_id` a Project
- [ ] Implementare conversione Estimate → Project
- [ ] Unificare campi duplicati (naming convention)
- [ ] Implementare RLS per ruoli

### Phase 2: Data Cleanup (1 settimana)
- [ ] Rimuovere EstimateTemplate (usare EstimatePreset)
- [ ] Rimuovere SOPTemplate se non usato
- [ ] Aggiungere stato "Archived"
- [ ] Migrare dati esistenti

### Phase 3: Performance (1 settimana)
- [ ] Calcoli on-the-fly per margini
- [ ] Indicizzazione database
- [ ] Ottimizzare query frequenti

### Phase 4: UX Improvements (1 settimana)
- [ ] Aggiungere breadcrumb
- [ ] Link "Torna alla Dashboard" nel Client Portal
- [ ] Migliorare navigazione tra entità correlate

### Phase 5: SaaS Readiness (2 settimane)
- [ ] Multi-tenancy (se necessario)
- [ ] Billing integration (Stripe)
- [ ] Usage tracking
- [ ] Onboarding flow

---

## 📋 Entity Health Status

| Entity | Records | Fields | Issues | Status |
|--------|---------|--------|--------|--------|
| Estimate | ~6 | 38 | 3 | ⚠️ Warning |
| Project | ~4 | 32 | 2 | ⚠️ Warning |
| Client | ~5 | 8 | 0 | ✅ Good |
| Property | ~5 | 14 | 0 | ✅ Good |
| ProjectCost | ~18 | 12 | 0 | ✅ Good |
| GuardianSubscription | ~3 | 7 | 1 | ⚠️ Warning |

---

## 🔐 Security Recommendations

1. **Row Level Security (RLS)**
   - Clienti vedono solo i loro dati
   - Technician vedono solo progetti assegnati
   - Admin vedono tutto

2. **Field-Level Permissions**
   - Campi finanziari editabili solo da admin/PM
   - Campi sensibili (margini, costi) read-only per technician

3. **Audit Trail**
   - Tracciare chi modifica cosa
   - Log delle modifiche critiche

---

## 📈 Metrics to Track

- **Conversion Rate:** Estimate → Project
- **Average Margin:** Per project type
- **Time to Delivery:** Stima vs reale
- **Customer Satisfaction:** Post-project
- **Guardian MRR:** Monthly recurring revenue
- **Support Ticket Resolution Time**

---

## 🚀 Next Steps

1. **Review questo documento** con il team
2. **Prioritizzare** le issue per impatto/sforzo
3. **Creare ticket** per ogni fix
4. **Implementare** in ordine di priorità
5. **Testare** ogni cambiamento
6. **Documentare** le modifiche

---

**Ultimo Audit:** 2026-05-26  
**Prossima Review:** Dopo Phase 1 completion