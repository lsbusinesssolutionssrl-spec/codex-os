# REGRESSION TEST SUITE - TENANT ADMIN SYSTEM
# Version: 1.0.0
# Last Stable State: 2026-05-28

## TEST A — TENANT CONTEXT STABILITY
```
User: amministrazione@lsbusiness.it
Expected State:
- context_type = 'tenant' (NOT 'platform')
- tenant_role = 'tenant_admin'
- platform_role = null OR 'user' (NOT 'admin')
- activeTenant.id = LS Business Solutions Srl ID
- enabledModules.length >= 21
- permissions.length >= 80
- sessionValid = true
- isContextResolved = true

UI Verification:
- Top badge shows "LS Business Solutions Srl"
- Sidebar shows tenant modules (Clienti, Progetti, etc.)
- NO platform modules visible (Nuovo Tenant, Piani SaaS, etc.)
- ContextBanner shows tenant workspace
```

## TEST B — TEAM & MEMBERSHIP
```
Expected State:
- TenantMembership.count >= 1 (current admin)
- current admin appears in Team & Ruoli page
- Dashboard team count = Team page count
- invitations visible if status = 'invited' or 'pending'

UI Verification:
- Team & Ruoli shows at least 1 active member
- Dashboard shows same count
- Invitations section visible if pending invites exist
- Debug panel shows matching counts
```

## TEST C — PLATFORM ISOLATION
```
Tenant admin MUST NOT see:
- /super-admin route accessible
- /tenant-onboarding in sidebar
- /saas-plans-admin in sidebar
- /platform-settings in sidebar
- /brand-approval in sidebar
- /developer in sidebar
- /integrations in sidebar
- /system-status in sidebar
- /product-analytics in sidebar

UI Verification:
- Sidebar has ONLY tenant modules
- No platform navigation items
- No platform routes accessible
```

## TEST D — TENANT ROUTES
```
Expected accessible routes:
- /app/admin/dashboard → TenantAdminDashboard
- /app/admin/team → TeamManagement
- /app/admin/modules → ModuleManagement
- /clients → Clients
- /projects → Projects
- /properties → Properties
- /estimates → Estimates
- /documents → Documents
- /financial-control → FinancialControl
- /ai → CodexAI
- /intelligence → CodexIntelligence

UI Verification:
- All routes render correct pages
- No 404 errors
- No redirect to platform pages
```

## TEST E — NO SAMPLE/FAKE DATA
```
Forbidden data:
- NO "Marco Rossi" users
- NO "Giulia Bianchi" users
- NO "Alessandro Verde" users
- NO fake Guardian subscriptions
- NO fake intelligence scores
- NO fake revenue metrics
- NO fake team members
- NO demo companies except explicit demo tenant

UI Verification:
- All data is real tenant data
- No placeholder/demo content visible
```

## TEST F — PLATFORM ROUTE ISOLATION
```
Platform routes restricted to:
- platform_role = 'super_admin' OR 'developer' ONLY

Routes:
- /platform/*
- /super-admin/*
- /developer/*
- /tenant-onboarding
- /saas-plans-admin

Security Check:
- Tenant admin gets 403 or redirect
- Platform users without tenant membership can access
```

---

# CHECKPOINT SYSTEM

## CHECKPOINT 1: CONTEXT STABLE
- [ ] context_type = 'tenant'
- [ ] tenant_role = 'tenant_admin'
- [ ] platform_role != 'admin'
- [ ] activeTenant exists
- [ ] enabledModules >= 21
- [ ] permissions >= 80

## CHECKPOINT 2: MEMBERSHIP STABLE
- [ ] TenantMembership exists for current user
- [ ] membership.status = 'active'
- [ ] membership.is_primary = true (if only one tenant)
- [ ] Team & Ruoli shows members
- [ ] Dashboard count matches Team page

## CHECKPOINT 3: MODULES STABLE
- [ ] enabledModules loaded from subscription
- [ ] enterprise modules enabled
- [ ] feature flags merged correctly
- [ ] modules persist after refresh
- [ ] no modules disappear

## CHECKPOINT 4: ROUTING STABLE
- [ ] /app/admin/* routes work
- [ ] legacy /admin/* redirects work
- [ ] platform routes hidden from tenant
- [ ] no route ambiguity
- [ ] sidebar shows correct nav

## CHECKPOINT 5: DATA CLEAN
- [ ] no sample data
- [ ] no demo users
- [ ] no fake subscriptions
- [ ] no placeholder content
- [ ] all data is tenant-owned

---

# CURRENT STATE AUDIT (Fill before each fix)

## Audit Timestamp: ___________

### Context State:
- context_type: ___________
- tenant_role: ___________
- platform_role: ___________
- activeTenant.id: ___________
- enabledModules.count: ___________
- permissions.count: ___________

### Membership State:
- TenantMembership.count: ___________
- current_user_membership exists: Y/N
- membership.status: ___________
- Team page count: ___________
- Dashboard count: ___________
- Counts match: Y/N

### Routing State:
- Current route: ___________
- Sidebar type: tenant/platform
- Platform routes visible: Y/N
- Route conflicts: Y/N

### Data State:
- Sample data visible: Y/N
- Fake users visible: Y/N
- All data tenant-owned: Y/N

### Test Results:
- Test A (Context): PASS/FAIL
- Test B (Team): PASS/FAIL
- Test C (Platform Isolation): PASS/FAIL
- Test D (Routes): PASS/FAIL
- Test E (No Sample Data): PASS/FAIL
- Test F (Platform Routes): PASS/FAIL

---

# ROLLBACK PROCEDURE

If regression detected:

1. STOP all changes immediately
2. Document which test failed
3. Identify last passing checkpoint
4. Rollback to that checkpoint
5. Re-run full test suite
6. Only proceed if ALL tests pass

---

# SINGLE SOURCE OF TRUTH

Tenant admin state MUST come from:
1. TenantMembership entity (user_id + tenant_id + tenant_role)
2. activeTenant from membership.tenant_id
3. ModuleRegistry from subscription + feature flags
4. RBACResolver from tenant_role + modules

FORBIDDEN sources:
- platform_role = 'admin'
- hardcoded email checks
- localStorage roles
- legacy company_id
- old admin routes
- demo tenant logic
- cached roles

---

# ACCEPTANCE CRITERIA (ALL MUST PASS)

- [ ] tenant admin remains tenant after refresh
- [ ] no platform mode for tenant user
- [ ] Team & Ruoli shows real tenant members
- [ ] invitations persist after refresh
- [ ] dashboard counts match detail pages
- [ ] enabledModules remain loaded
- [ ] permissions remain loaded
- [ ] modules do not disappear
- [ ] routes remain stable
- [ ] sample/demo data never returns
- [ ] debug panels confirm coherent context
- [ ] regression test suite passes after refresh