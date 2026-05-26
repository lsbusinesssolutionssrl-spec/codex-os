# Codex OS — Multi-Tenant Architecture
## Commercial Distribution Ready

**Version:** 2.0  
**Date:** 2026-05-26

---

## 1. Overview

Codex OS è stato trasformato da applicazione single-tenant a piattaforma **multi-tenant SaaS** pronta per la distribuzione commerciale. Ogni azienda (tenant) opera in isolamento completo, con dati, impostazioni, e subscription separate.

---

## 2. Tenant Architecture

### Company Entity (Tenant)
Ogni azienda è rappresentata dall'entity `Company`:
- **Isolamento**: Tutti i dati sono filtrati per `company_id`
- **Brand personalizzato**: Logo, colori primari/secondari
- **Settings aziendali**: Currency, language, timezone, formati data
- **Slug univoco**: Identificatore URL-safe per routing futuro

### User Association
- Ogni utente appartiene a **una sola company** tramite `company_id`
- Ruoli estesi: `company_admin` (gestisce subscription e settings aziendali)
- Ruoli esistenti: `admin`, `project_manager`, `technician`, `sales`, `client`

---

## 3. Data Isolation

### Entity-Level Isolation
Tutte le entity principali includono `company_id`:
- Client, Property, Estimate, Project
- SupportTicket, GuardianSubscription, Document
- ChecklistItem, Supplier, Timesheet, PurchaseOrder
- User (associazione)

### Row-Level Security (RLS)
Backend function `getUserFilters` applica filtri automatici:
```javascript
// Tutti i record devono avere company_id = user's company
{ company_id: userCompanyId }
```

### Backend Functions
Tutte le funzioni backend devono:
1. Verificare autenticazione utente
2. Recuperare `company_id` dall'utente
3. Applicare filtro `company_id` a tutte le query

---

## 4. Subscription & Billing

### Subscription Plans
Entity `SubscriptionPlan` definisce piani con:
- **Prezzi**: Mensili e annuali
- **Quote**: Limiti configurabili per risorsa
- **Features**: Lista di funzionalità incluse
- **Stripe integration**: Price IDs per checkout

### Company Subscription
Entity `CompanySubscription` traccia:
- Piano attivo e ciclo di billing
- Periodo corrente e trial
- Stripe subscription/customer IDs
- Utilizzo corrente (seats, storage)

### Usage Tracking
Entity `UsageLog` registra:
- Ogni creazione/aggiornamento di risorse
- Consumo di AI request, storage, ticket
- Timestamp e user_email per audit

### Quota Enforcement
Function `checkQuota`:
- Verifica limiti prima di creare risorse
- Supporta resource_type: user, project, estimate, ticket, storage, ai_request, client, property
- Restituisce: allowed, current, limit, remaining, exceeded

---

## 5. Entity Schemas

### Core Entities

#### Company
```json
{
  "name": "Company Name",
  "slug": "company-slug",
  "email": "admin@company.com",
  "brand_color_primary": "#1147FF",
  "brand_color_secondary": "#0B2341",
  "settings": {
    "currency": "EUR",
    "language": "it",
    "timezone": "Europe/Rome"
  }
}
```

#### SubscriptionPlan
```json
{
  "name": "Professional",
  "price_monthly": 99,
  "price_yearly": 990,
  "quotas": {
    "max_users": 10,
    "max_projects": 50,
    "max_storage_gb": 20,
    "max_estimates_per_month": 100,
    "ai_requests_per_month": 500
  },
  "features": ["AI Estimator", "Advanced Reports", "Priority Support"]
}
```

#### CompanySubscription
```json
{
  "company_id": "...",
  "plan_id": "...",
  "status": "active",
  "billing_cycle": "monthly",
  "trial_end": "2026-06-09",
  "mrr": 99,
  "seats_used": 3,
  "storage_used_gb": 2.5
}
```

---

## 6. Backend Functions

### createCompany
Crea nuova azienda con:
- Company record
- Subscription (trial 14 giorni)
- User associato come `company_admin`
- Log utilizzo iniziale

**Endpoint:** `POST /functions/createCompany`

### getCurrentCompany
Recupera company, subscription e user corrente.

**Endpoint:** `GET /functions/getCurrentCompany`

### checkQuota
Verifica limiti prima di creare risorse.

**Input:**
```json
{
  "resource_type": "project",
  "action": "create",
  "quantity": 1
}
```

**Output:**
```json
{
  "allowed": true,
  "current": 12,
  "limit": 50,
  "remaining": 38,
  "exceeded": false
}
```

### logUsage
Registra consumo di risorse.

**Input:**
```json
{
  "resource_type": "ai_request",
  "action": "consume",
  "quantity": 1,
  "metadata": { "model": "gpt-4o-mini" }
}
```

---

## 7. Frontend Pages

### Company Settings (`/company-settings`)
Gestione impostazioni aziendali:
- **Tab Generale**: Nome, email, tax ID, indirizzo
- **Tab Brand**: Logo upload, colori primari/secondari
- **Tab Subscription**: Piano corrente, billing, MRR
- **Tab Usage**: Barre di utilizzo per utenti, progetti, storage

### Subscription Plans (`/subscription-plans`)
Upgrade/downgrade piano:
- Grid 3 piani (Starter, Professional, Enterprise)
- Features e quote per piano
- Toggle monthly/yearly billing
- Stripe integration (placeholder)

---

## 8. Security & Access Control

### Authentication
- Utenti autenticati tramite Base44 auth
- `company_id` recuperato da User entity
- Sessioni isolate per company

### Authorization
- RLS applica filtri `company_id` automaticamente
- Ruoli `company_admin` e `admin` gestiscono settings
- Clienti vedono solo i propri dati (portal)

### Data Leakage Prevention
- Nessuna query senza filtro `company_id`
- Backend functions validano sempre l'appartenenza
- Usage log tracciano tutte le operazioni

---

## 9. Billing Integration (Stripe Ready)

### Required Setup
1. **Stripe Products**: Crea prodotti per ogni piano
2. **Price IDs**: Popola `stripe_price_id_monthly` e `stripe_price_id_yearly`
3. **Webhooks**: Configura endpoint per:
   - `invoice.payment_succeeded` → aggiorna `last_payment_date`, `last_payment_amount`
   - `customer.subscription.updated` → sync status, period dates
   - `customer.subscription.deleted` → imposta `cancelled_at`, `status: cancelled`

### Checkout Flow
```javascript
// 1. User seleziona piano
// 2. Redirect a Stripe Checkout Session
// 3. Stripe webhook conferma pagamento
// 4. CompanySubscription aggiornata
```

---

## 10. Migration Path

### Existing Data (Single-Tenant)
Tutti i record esistenti devono essere aggiornati:
```javascript
// Script di migrazione
const companyId = 'default-company-id';
await Promise.all([
  base44.entities.Client.updateMany({}, { company_id: companyId }),
  base44.entities.Property.updateMany({}, { company_id: companyId }),
  // ... tutte le entity
]);
```

### Default Company
Crea una company "default" per dati legacy:
```json
{
  "name": "Codex Solution (Default)",
  "slug": "default",
  "email": "admin@codexsolution.it"
}
```

---

## 11. Onboarding Flow

### Self-Signup
1. User visita `/subscription-plans`
2. Seleziona piano e billing cycle
3. Compila form company (nome, email, slug)
4. `createCompany` crea:
   - Company record
   - Subscription (trial 14 giorni)
   - User come `company_admin`
5. Redirect a `/company-settings` per configurazione

### Manual Invite (Admin)
1. Admin crea company da dashboard
2. Invita utenti via email
3. Utenti registrati associati a company
4. Ruolo default: `user` o specifico

---

## 12. Quota Examples

### Starter Plan (€49/mese)
```json
{
  "max_users": 3,
  "max_projects": 10,
  "max_storage_gb": 5,
  "max_estimates_per_month": 20,
  "max_tickets_per_month": 30,
  "ai_requests_per_month": 50
}
```

### Professional Plan (€99/mese)
```json
{
  "max_users": 10,
  "max_projects": 50,
  "max_storage_gb": 20,
  "max_estimates_per_month": 100,
  "max_tickets_per_month": 100,
  "ai_requests_per_month": 500,
  "custom_reports": true
}
```

### Enterprise Plan (€249/mese)
```json
{
  "max_users": null,
  "max_projects": null,
  "max_storage_gb": 100,
  "max_estimates_per_month": null,
  "max_tickets_per_month": null,
  "ai_requests_per_month": 2000,
  "custom_reports": true,
  "api_access": true,
  "priority_support": true,
  "white_label": true
}
```

---

## 13. Monitoring & Analytics

### Metrics to Track
- **MRR (Monthly Recurring Revenue)**: Somma di tutte le subscription attive
- **Churn Rate**: Cancellazioni / totale subscription
- **Usage per Tenant**: Quota consumption per azienda
- **Active Users**: MAU/DAU per company

### Alerts
- Quota superata (>90% utilizzo)
- Subscription in scadenza
- Trial in scadenza (3 giorni prima)

---

## 14. Next Steps

### Phase 1 (Completed)
- ✅ Multi-tenant entity schema
- ✅ Company isolation
- ✅ Subscription plans
- ✅ Usage tracking
- ✅ Quota enforcement

### Phase 2 (TODO)
- [ ] Stripe integration completa
- [ ] Webhook handling per billing events
- [ ] Email notifications (trial expiry, quota warnings)
- [ ] Admin dashboard per platform metrics
- [ ] Self-service upgrade/downgrade

### Phase 3 (Future)
- [ ] White-label customization
- [ ] Custom domains per company
- [ ] API rate limiting per tenant
- [ ] Advanced analytics per company
- [ ] Reseller/multi-brand support

---

**Codex OS è ora pronto per la distribuzione commerciale multi-tenant.**