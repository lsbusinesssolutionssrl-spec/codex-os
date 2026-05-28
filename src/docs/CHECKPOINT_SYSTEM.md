# CHECKPOINT SYSTEM - TENANT ADMIN STABILITY
# Last Updated: 2026-05-28
# Status: REGRESSION DETECTED - NEEDS STABILIZATION

## CURRENT STATE AUDIT

### Context State (from GlobalContextEngine):
- [ ] context_type = 'tenant'
- [ ] tenant_role = 'tenant_admin'
- [ ] platform_role != 'admin'
- [ ] activeTenant exists
- [ ] enabledModules >= 21
- [ ] permissions >= 80

### Membership State:
- [ ] TenantMembership exists for current user
- [ ] membership.status = 'active'
- [ ] Team & Ruoli shows members
- [ ] Dashboard count matches Team page

### Routing State:
- [ ] /app/admin/* routes work
- [ ] legacy /admin/* redirects work
- [ ] platform routes hidden from tenant
- [ ] no route ambiguity

### Data State:
- [ ] no sample data visible
- [ ] no demo users
- [ ] all data tenant-owned

---

## CHECKPOINT 1: CONTEXT STABLE
Status: ❌ FAIL

Issues:
- Context may be resolving as platform instead of tenant
- platform_role may still be 'admin' for tenant users
- TenantMembership may not be loading

Required Actions:
1. Verify amministrazione@lsbusiness.it has TenantMembership
2. Remove platform_role = 'admin' from user
3. Ensure context priority: membership > platform_role

---

## CHECKPOINT 2: MEMBERSHIP STABLE  
Status: ❌ FAIL

Issues:
- Team & Ruoli may not show members
- Invitations may not load
- Dashboard count mismatch

Required Actions:
1. Verify TenantTeamService loads correctly
2. Ensure invitations query uses correct filters
3. Match dashboard/team counts

---

## CHECKPOINT 3: MODULES STABLE
Status: ❌ FAIL

Issues:
- enabledModules may reset after fixes
- Enterprise modules may not load
- Feature flags may not merge

Required Actions:
1. Verify subscription plan loads
2. Ensure enterprise modules enabled
3. Merge feature flags correctly

---

## CHECKPOINT 4: ROUTING STABLE
Status: ❌ FAIL

Issues:
- Route ambiguity /admin vs /app/admin
- Platform routes visible to tenant
- Sidebar shows wrong navigation

Required Actions:
1. Lock tenant routes to /app/admin/*
2. Redirect legacy /admin/* to /app/admin/*
3. Hide platform nav from tenant sidebar

---

## CHECKPOINT 5: DATA CLEAN
Status: ❌ FAIL

Issues:
- Sample data may appear
- Demo users visible
- Fake subscriptions

Required Actions:
1. Remove all sample data generation
2. Clean demo tenants
3. Verify all data is tenant-owned

---

## ROLLBACK PLAN

If regression continues:

1. **Immediate Rollback Target**: Last known stable state
   - Date: before regression started
   - Commit: N/A (manual rollback)

2. **Critical Files to Restore**:
   - lib/GlobalContextEngine.jsx
   - components/Layout.jsx
   - App.jsx
   - pages/TenantAdminDashboard.jsx
   - pages/TeamManagement.jsx

3. **Database State**:
   - Verify TenantMembership exists
   - Remove platform_role = 'admin'
   - Clean sample data

---

## NEXT ACTIONS (IN ORDER)

1. ✅ Create regression test suite (DONE)
2. ✅ Create test runner component (DONE)
3. ⏳ Run initial regression tests
4. ⏳ Document failures
5. ⏳ Fix ONE issue at a time
6. ⏳ Re-run tests after each fix
7. ⏳ Do not proceed if tests fail
8. ⏳ Rollback if regression worsens

---

## ACCEPTANCE CRITERIA (ALL MUST PASS)

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

---

## TEST RESULTS LOG

### Run 1: 2026-05-28 (Initial)
- Test A (Context): ❌ FAIL
- Test B (Team): ❌ FAIL
- Test C (Platform Isolation): ❌ FAIL
- Test D (Routes): ❌ FAIL
- Test E (No Sample Data): ❌ FAIL
- Test F (Platform Routes): ❌ FAIL

**Action**: Stabilization required before any feature work