# CHECKPOINT 03 — FULL APP AUDIT PRE-FIX
Data: 2026-05-28
Stato: PRE-FIX — solo analisi, nessuna modifica applicata

---

## SISTEMI STABILI — NON TOCCARE

| Sistema | File | Stato |
|---|---|---|
| GlobalContextEngine | lib/GlobalContextEngine.jsx | ✅ STABILE |
| RBACResolver | lib/RBACResolver.js | ✅ STABILE |
| TenantMembership resolver | functions/loadUserMemberships | ✅ STABILE |
| Impersonation / effectiveUser | GlobalContextEngine.jsx | ✅ STABILE |
| Platform vs Tenant context | GlobalContextEngine.jsx | ✅ STABILE |
| Sidebar routing | components/Layout | ✅ STABILE |
| Platform routes (/super-admin, /platform/*) | App.jsx | ✅ STABILE |
| Tenant routes (/app/admin/*, /clients, /estimates...) | App.jsx | ✅ STABILE |
| Module hydration + enabledModules | GlobalContextEngine.jsx | ✅ STABILE |
| Invite system backend | functions/inviteTenantUser, acceptTenantInvite | ✅ STABILE |
| Team & Ruoli base | pages/TeamManagement | ✅ STABILE |
| ClientService | lib/ClientService.js | ✅ STABILE |
| PropertyService | lib/PropertyService.js | ✅ STABILE |
| I18n service | lib/I18n.js | ✅ STABILE |
| EstimateDetail save+redirect | pages/EstimateDetail | ✅ STABILE (fixato in sessione) |

---

## ROUTE MAP al momento del checkpoint

### Platform / Super Admin (richiede role=admin)
| Route | Pagina | Sidebar | Stato |
|---|---|---|---|
| /super-admin | SuperAdminDashboard | Platform | ✅ |
| /platform/tenants | TenantManagement | Platform | ✅ |
| /platform/tenants/:tenantId | TenantDetail | Platform | ✅ |
| /platform/tenant-cleanup | TenantCleanupCenter | Platform | ✅ |
| /platform/route-health | RouteHealthDashboard | Platform | ✅ |
| /saas-plans-admin | SaasPlansAdmin | Platform | ✅ |
| /platform-settings | PlatformSettings | Platform | ✅ |
| /brand-approval | BrandApprovalQueue | Platform | ✅ |
| /developer | DeveloperSettings | Platform | ✅ |
| /system-status | SystemStatus | Platform | ✅ |
| /product-analytics | ProductAnalytics | Platform | ✅ |
| /provisioning-validator | ProvisioningValidator | Platform | ✅ |
| /company-settings/modules | ModuleActivationManager | Platform | ✅ |
| /integrations | IntegrationHub | Platform | ✅ |
| /api-keys | ApiKeys | Platform | ✅ |

### Tenant Admin (richiede TenantMembership active)
| Route | Pagina | Sidebar | Stato |
|---|---|---|---|
| /app/admin/dashboard | TenantAdminDashboard | Tenant | ✅ |
| /app/admin/team | TeamManagement | Tenant | ✅ |
| /app/admin/modules | ModuleManagement | Tenant | ✅ |
| /clients | Clients | Tenant | ✅ |
| /clients/:id | ClientDetail | Tenant | ✅ |
| /properties | Properties | Tenant | ✅ |
| /properties/:id | PropertyDetail | Tenant | ✅ |
| /projects | Projects | Tenant | ⚠️ CRITICO: no tenant filter |
| /projects/:id | ProjectDetail | Tenant | ⚠️ da verificare |
| /estimates | Estimates | Tenant | ✅ |
| /estimates/:id | EstimateDetail | Tenant | ✅ |
| /financial-control | FinancialControl | Tenant | ✅ |
| /guardian | Guardian | Tenant | ✅ |
| /ai | CodexAI | Tenant | ✅ |
| /intelligence | CodexIntelligence | Tenant | ✅ |
| /workflows | Workflows | Tenant | ✅ |
| /company-settings | CompanySettings | Tenant | ✅ |
| /documents | Documents | Tenant | ✅ |
| /tickets | Tickets | Tenant | ✅ |

---

## TENANT PRODUZIONE AL CHECKPOINT

### Ls Business Solutions Srl (production_customer)
- company_id: 6a174d3989ac2d2ad8a0df0c
- admin: amministrazione@lsbusiness.it
- plan: Enterprise (6a162031d3dc9016538a3758)
- subscription status: active
- enabledModules: 21+
- memberships active: 1 (tenant_admin)
- memberships removed: 3

### Tenant interno (demo/dev)
- company_id: 6a1786e722c0cccc0a7f69f3
- creato da: amministrazione@lsbusiness.it
- da classificare / archiviare

---

## ENTITIES AL CHECKPOINT
Tutte le entities hanno campo company_id, ad eccezione di:
- User (built-in, isolato per email/user_id)
- TenantMembership (isolation = tenant_id)
- CompanySubscription (company_id OK)
- SubscriptionPlan (globale, no tenant)
- BrandTheme (company_id OK)

---

## NOTE PER ROLLBACK
Se qualcosa regredisce dopo i fix successivi, ripristinare:
1. lib/GlobalContextEngine.jsx (non toccare)
2. components/Layout (non toccare sidebar logic)
3. App.jsx routes (non aggiungere/rimuovere senza dichiarare)
4. lib/ClientService.js (stabile)
5. lib/PropertyService.js (stabile)
6. lib/I18n.js (stabile)