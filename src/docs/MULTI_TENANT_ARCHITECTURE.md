# Codex OS Multi-Tenant SaaS Architecture

## Overview

Codex OS è una piattaforma **enterprise multi-tenant SaaS** con isolamento reale dei dati e contesti di lavoro separati.

---

## Core Concepts

### 1. **Platform Owner Context** (Super Admin / Developer)

**Chi:** Solo Super Admin e Developer

**Cosa vede:**
- Dashboard multi-tenant
- Tutti i tenant (aziende)
- Piani SaaS e subscription
- Feature flags
- Audit log platform-wide
- White label requests
- System health

**NON è un tenant** - è il contesto di gestione della piattaforma.

### 2. **Tenant Company Context** (Cliente SaaS)

**Esempi:** Rossi Costruzioni, Alfa Impianti, Studio Beta

**Isolamento:**
- ✅ Database context isolato (tramite company_id filters)
- ✅ Utenti isolati (ogni user ha company_id)
- ✅ Progetti isolati
- ✅ Clienti isolati
- ✅ Financials isolati
- ✅ Branding isolato
- ✅ AI memory isolata

**Tenant users:**
- `company_admin` - Admin dell'azienda
- `project_manager` - PM
- `technician` - Tecnico
- `sales` - Commerciale
- `client` - Cliente finale (portal)

### 3. **Product / Module Context**

**NON sono tenant** - sono moduli abilitati dal piano SaaS:

- Guardian (manutenzione programmata)
- Home Passport (digital twin proprietà)
- Financial Control (margini, costi)
- AI Copilot (assistente contestuale)
- Intelligence (analytics avanzati)
- Workflow Engine (automazioni)
- White Label (branding personalizzato)

---

## Architecture Implementation

### Tenant Context Engine

```javascript
// components/tenant/TenantContext
const { activeTenant, isPlatformMode, enabledModules } = useTenant();
```

**Platform Mode:**
- `isPlatformMode = true`
- `activeTenant = null`
- Menu: PLATFORM_NAV_ITEMS
- Accesso: Super Admin / Developer only

**Tenant Mode:**
- `isPlatformMode = false`
- `activeTenant = { company data }`
- `enabledModules = ['guardian', 'financial_control', ...]`
- Menu: TENANT_NAV_ITEMS (filtered by modules)

---

## Data Isolation

### Middleware: TenantFilter

```javascript
// lib/tenantFilter
const filter = await getCurrentTenantFilter();
const projects = await filter.list('Project', '-created_date');
```

**TUTTE le query devono passare da TenantFilter** per garantire isolamento.

### RLS Filters (Row Level Security)

```javascript
// functions/getUserFilters
{
  Project: { company_id: "abc123" },
  Estimate: { company_id: "abc123" },
  Client: { company_id: "abc123" },
  // ...
}
```

**Platform users** ricevono filtri vuoti (possono vedere tutto).

**Tenant users** ricevono filtri strict per company_id.

---

## Tenant Switching

### Solo per Super Admin / Developer

```javascript
// components/tenant/TenantSwitcher
<TenantSwitcher />
```

**Funzionalità:**
- Switch tra Platform e tenant specifici
- Impersonation mode (x-impersonate-tenant-id header)
- Branding del tenant attivo
- Reload contestuale

### Tenant Users

**NON vedono il tenant switcher** - sono vincolati al loro company_id.

---

## Module Activation

### Piani SaaS abilitano moduli

```javascript
// Starter Plan
enabledModules: ['projects', 'estimates', 'clients', 'documents']

// Professional Plan
enabledModules: [...Starter, 'guardian', 'financial_control', 'ai_copilot']

// Enterprise Plan
enabledModules: [...Professional, 'intelligence', 'workflows', 'white_label']
```

### Menu dinamico

Il sidebar filtra le voci in base ai moduli abilitati:

```javascript
// components/Layout
const visibleNav = TENANT_NAV_ITEMS.filter(item => {
  if (item.module && !enabledModules.includes(item.module)) {
    return false; // Modulo non abilitato
  }
  return true;
});
```

---

## Security Model

### 1. User Entity

```json
{
  "email": "user@company.com",
  "company_id": "abc123", // Obbligatorio per tenant users
  "role": "project_manager"
}
```

### 2. All Data Entities

```json
{
  "company_id": "abc123", // Obbligatorio
  "title": "Project Alpha",
  // ...
}
```

### 3. Backend Verification

```javascript
// functions/getUserFilters
if (!company_id && !['admin', 'developer'].includes(user.role)) {
  return Response.json({ error: 'Tenant user must have company_id' }, { status: 403 });
}
```

---

## Tenant Onboarding

### Wizard: /tenant-onboarding

1. **Dati Azienda**
   - Ragione sociale
   - Slug (URL-safe)
   - Email, VAT, Address

2. **Logo + Brand**
   - Upload logo
   - Colori primari/secondari

3. **Utente Admin**
   - Email admin tenant
   - Invito automatico

4. **Subscription**
   - Piano (Starter/Professional/Enterprise)
   - Trial 14 giorni

5. **Numerazione**
   - Prefissi preventivi/progetti

6. **Attivazione**
   - Company creata
   - Subscription attiva
   - Moduli abilitati
   - Workspace pronto

---

## Integrity Audit

### /tenant-integrity

Verifica automatica:
- ✅ Utenti senza company_id
- ✅ Aziende senza subscription
- ✅ Dati orfani (company_id invalido)
- ✅ Moduli non allineati al piano

**Auto-fix:** Assegna company_id inferito dai dati esistenti.

---

## Context Banner

Header mostra SEMPRE il contesto attivo:

**Platform:**
```
🛡️ Platform Administration — Gestione multi-tenant
Super Admin Mode
```

**Tenant:**
```
🏢 Tenant Workspace: Rossi Costruzioni
Isolato • Solo dati aziendali ✓
```

---

## Best Practices

### ✅ DO

1. Usare SEMPRE `TenantFilter` per query
2. Verificare `company_id` in backend functions
3. Mostrare contesto attivo (ContextBanner)
4. Filtrare menu per moduli abilitati
5. Audit regolari con TenantIntegrityAudit

### ❌ DON'T

1. Usare `base44.entities.X.list()` senza filtri
2. Permettere tenant switching a utenti tenant
3. Mischiare moduli con tenant (Guardian ≠ tenant)
4. Mostrare dati cross-tenant
5. Hardcodare company_id

---

## Migration Notes

### Da vecchio sistema a nuovo:

1. **Rimuovere BrandSelector finto**
2. **Aggiungere TenantProvider** in App.jsx
3. **Sostituire WorkspaceSwitcher** con TenantSwitcher
4. **Aggiornare getUserFilters** per platform mode
5. **Audit integrity** e fix dati orfani

---

## File Structure

```
components/tenant/
  ├── TenantContext.jsx      # Contesto attivo
  ├── TenantSwitcher.jsx     # Solo platform users
  └── ContextBanner.jsx      # Header indicator

lib/
  └── tenantFilter.js        # Middleware isolation

pages/
  └── TenantIntegrityAudit.jsx

functions/
  └── getUserFilters.js      # RLS filters
```

---

## Summary

**Prima:**
- ❌ Brand selector finto (Codex Solution/Living/Guardian)
- ❌ Nessun isolamento tenant
- ❌ Moduli mischiati con tenant
- ❌ Menu ibrido platform/tenant

**Adesso:**
- ✅ Tenant context engine reale
- ✅ Isolamento dati per company_id
- ✅ Platform vs Tenant separation
- ✅ Moduli abilitati da piano SaaS
- ✅ Tenant switching solo admin
- ✅ Integrity audit automatico

Codex OS è ora una **vera piattaforma enterprise multi-tenant SaaS**.