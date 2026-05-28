# TenantMembership Auto-Repair System

## Overview
Sistema completo di auto-riparazione e provisioning per TenantMembership che garantisce:
- Contesto tenant sempre risolto
- Zero regressioni dovute a membership mancanti
- Provisioning atomico e rollback automatico

## Components

### 1. Backend Functions

#### `resolveOrRepairTenantMembership`
**Scopo**: Auto-riparazione intelligente delle membership

**Condizioni Sicure** (crea membership SOLO se):
- ✅ User email matches tenant.tenant_admin_email
- ✅ User has legacy company_id binding
- ✅ User accepted pending invitation
- ✅ Developer/SuperAdmin explicit repair

**NON crea mai** membership solo perché l'utente è loggato.

**Return Values**:
```json
{
  "success": true,
  "action": "created_from_legacy_binding|reactivated|found_existing|accepted_invitation",
  "membership": { ... },
  "reason": "..."
}
```

#### `provisionTenantComplete`
**Scopo**: Creazione atomica di tenant completi

**Steps Atomici**:
1. Create Tenant (Company)
2. Create Admin Membership
3. Create Subscription
4. Create Feature Flags
5. Log Provisioning Event

**Rollback Automatico**: Se uno step fallisce, tutti gli enti creati vengono eliminati.

### 2. Frontend Components

#### `QuickMembershipRepair` (Component)
- Popup di emergenza quando il contesto è unresolved
- Chiama `resolveOrRepairTenantMembership` automaticamente
- Auto-reload dopo riparazione

#### `TenantMembershipRepair` (Page)
- Pagina completa di diagnostica e riparazione
- Mostra stato corrente delle membership
- Permette repair manuale

### 3. Integration Points

#### GlobalContextEngine
```javascript
// AUTO-REPAIR: If no memberships found, attempt to repair
if (memberships.length === 0 && authenticatedUser.company_id) {
  const repairResponse = await base44.functions.invoke('resolveOrRepairTenantMembership', {});
  if (repairResponse.data.success) {
    memberships = [repairResponse.data.membership];
    setTenantMemberships(memberships);
  }
}
```

#### loadUserMemberships
- Backend function che bypassa RLS
- Usata dal GlobalContextEngine per caricare membership
- Previene errori di lettura frontend

## Usage Scenarios

### Scenario 1: Legacy Binding
**Problem**: User ha `company_id` ma non `TenantMembership`
**Solution**: Auto-crea membership da legacy binding
**Result**: context_type = tenant, tenant_role = tenant_admin

### Scenario 2: Email Match
**Problem**: Tenant creato con admin email, ma membership mancante
**Solution**: Match email → crea membership
**Result**: User associato al tenant corretto

### Scenario 3: Pending Invitation
**Problem**: User invitato ma non ha ancora accettato
**Solution**: Accetta automaticamente se email match
**Result**: status = active, joined_at = now

### Scenario 4: Inactive Membership
**Problem**: Membership esiste ma status != active
**Solution**: Reactiva membership
**Result**: status = active

## Acceptance Criteria

✅ **Regression Tests**:
- context_type = tenant (NOT unresolved)
- tenant_role = tenant_admin (NOT empty)
- activeTenant exists (NOT null)
- enabledModules >= 21 (NOT 0)
- permissions >= 80 (NOT 0)
- TenantMembership.count >= 1 (NOT 0)

✅ **Team Page**:
- Team count = 1 (minimum)
- Current admin visible
- Role = Tenant Admin
- Status = Active

✅ **Dashboard**:
- Team count matches Team page
- No "unresolved" errors
- All modules accessible

## Safety Guarantees

1. **Never Creates Orphan Memberships**: Richiede prova esplicita di autorizzazione
2. **Never Overwrites Existing Active Memberships**: Rispetta membership esistenti
3. **Rollback on Failure**: Provisioning atomico con rollback completo
4. **Audit Logging**: Tutti i repair sono tracciati in TenantActivationLog
5. **Email Verification**: Match email richiesto per auto-creazione

## Debug & Monitoring

### Diagnostics
- `debugUserContext` function: Mostra stato completo del contesto
- `loadUserMemberships` function: Verifica membership esistenti
- `TenantMembershipRepair` page: UI per diagnostica e repair

### Logs
Tutte le funzioni loggano:
- User email e ID
- Tenant ID e nome
- Azione eseguita
- Motivo della decisione
- Errori (se presenti)

## Future Improvements

1. **Webhook Integration**: Auto-repair triggered da eventi esterni
2. **Batch Repair**: Ripara multiple membership in parallelo
3. **Predictive Repair**: Anticipa problemi prima che causino errori
4. **Admin Dashboard**: UI per super-admin per gestire repair multipli

## Rollback Plan

Se il sistema causa problemi:
1. Disabilita auto-repair in GlobalContextEngine
2. Usa `repairCurrentTenantMembership` per fix manuali
3. Monitora logs per identificare cause root

## Testing

### Manual Testing
1. Crea tenant senza membership → verifica auto-repair
2. Rimuovi membership → verifica riattivazione
3. Cambia user company_id → verifica aggiornamento

### Automated Testing
- RegressionTestRunner include test per membership
- ContextVerification monitora stato in real-time
- HydrationDebugPanel traccia tutti gli step

## Conclusion

Questo sistema garantisce che:
- **Zero utenti bloccati** senza contesto tenant
- **Zero regressioni** dovute a membership mancanti
- **100% audit trail** di tutte le riparazioni
- **Provisioning affidabile** con rollback automatico