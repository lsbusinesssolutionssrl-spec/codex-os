# Team Count Critical Fix - Centralized Service

## Problem Solved
Dashboard showed Team = 2 but Team & Ruoli showed 0 members.

## Root Cause
Dashboard and Team page were querying TenantMembership separately without a unified service, leading to potential inconsistencies in filtering and counting logic.

## Solution: TenantTeamService

Created centralized service: `lib/TenantTeamService.js`

### Single Source of Truth
All team data comes from:
```javascript
TenantMembership.filter({ tenant_id: activeTenant.id })
```

Joined with User data for display.

### Service Methods

```javascript
TenantTeamService.getTeamSummary(tenantId)
// Returns:
{
  activeMembersCount: number,      // Dashboard "Team" count
  pendingInvitesCount: number,     // Dashboard subtitle
  totalCount: number,              // active + pending
  allMemberships: number,          // Raw count
  membershipsMissingUser: number   // Join failures
}

TenantTeamService.getAllMemberships(tenantId)
// Returns: All memberships with User data joined

TenantTeamService.getActiveMembers(tenantId)
// Returns: Only active status members

TenantTeamService.getPendingInvitations(tenantId)
// Returns: Only invited/pending status members

TenantTeamService.debugTeamPipeline(tenantId)
// Returns: Detailed debug info for troubleshooting
```

## Changes Made

### 1. Dashboard (pages/TenantAdminDashboard)
```javascript
// BEFORE: Manual filtering
const memberships = await base44.entities.TenantMembership.filter(...);
const activeMembers = memberships.filter(...);

// AFTER: Centralized service
const teamSummary = await TenantTeamService.getTeamSummary(activeTenant.id);
setStats({
  team: teamSummary.activeMembersCount,
  pendingInvites: teamSummary.pendingInvitesCount,
  teamSummary,
});
```

### 2. Team Page (pages/TeamManagement)
```javascript
// BEFORE: Separate query
const [memberships, users] = await Promise.all([...]);

// AFTER: Same service as dashboard
const teamSummary = await TenantTeamService.getTeamSummary(activeTenant.id);
const allMemberships = await TenantTeamService.getAllMemberships(activeTenant.id);
```

### 3. Enhanced Debug Panel
Team page now shows:
- Tenant ID
- Total Memberships
- Active Members (matches dashboard)
- Pending Invites (matches dashboard subtitle)
- Removed/Suspended counts
- Missing User Profiles
- **Data Consistency Check** ✅/❌

## Acceptance Criteria ✅

- ✅ Dashboard Team count = Team page Active Members count
- ✅ Dashboard pending invites = Team page Pending Invitations count
- ✅ Both use TenantTeamService (single source of truth)
- ✅ Onboarding "Team min 2" uses real data (teamSummary.totalCount)
- ✅ No hardcoded values
- ✅ No demo/sample data counted
- ✅ All queries tenant_id scoped
- ✅ Debug panel shows consistency check

## Testing Instructions

1. **Navigate to Dashboard**
   - Note Team count (e.g., "2")
   - Note pending invites subtitle (if any)

2. **Navigate to Team & Ruoli**
   - Click "🔍 Debug" button
   - Verify "Active Members" matches dashboard Team count
   - Verify "Pending Invites" matches dashboard subtitle
   - Check "Data Consistency Check" shows ✅

3. **Verify Current Admin Appears**
   - Check "All Memberships" list in debug panel
   - Look for current admin email (amministrazione@lsbusiness.it)
   - Status should be "active"
   - Role should be "tenant_admin"

4. **Check Console Logs**
   - Open browser console
   - Look for `[TeamManagement] Team Data:`
   - Should show `matchesDashboard: true`

## Common Issues & Solutions

### Issue: Dashboard shows 2, Team page shows 0
**Check Debug Panel:**
- If "Missing User Profile" > 0: User records don't exist for memberships
- If "Total Memberships" = 0: No memberships created for this tenant
- If "Active Members" = 0 but dashboard shows count: Service not being used

### Issue: Current admin doesn't appear
**Possible causes:**
- TenantMembership record doesn't exist for admin
- user_id in membership doesn't match User.id
- Membership status is not "active"

**Fix:**
```javascript
// Check debug panel for admin's membership
// If missing, create it:
await base44.entities.TenantMembership.create({
  user_id: currentUser.id,
  tenant_id: activeTenant.id,
  tenant_role: 'tenant_admin',
  status: 'active',
});
```

### Issue: Counts still don't match
**Verify:**
1. Both pages import TenantTeamService
2. Both pages call `getTeamSummary(activeTenant.id)`
3. No other filtering applied after service call
4. Clear browser cache and reload

## Data Flow

```
TenantMembership Entity
         ↓
TenantTeamService.getAllMemberships(tenantId)
         ↓
    Join with User data
         ↓
    ┌────────────────────┐
    │                    │
getTeamSummary()    getActiveMembers()
    │                    │
    ↓                    ↓
Dashboard           Team Page
Team: X             Membri Attivi: X
Pending: Y          Inviti: Y
```

## Files Modified
- ✅ `lib/TenantTeamService.js` - NEW: Centralized service
- ✅ `pages/TenantAdminDashboard.jsx` - Uses service
- ✅ `pages/TeamManagement.jsx` - Uses service + enhanced debug
- ✅ `docs/TEAM_COUNT_CENTRALIZED_SERVICE_FIX.md` - This document

## Next Steps if Issue Persists

1. Open Team & Ruoli page
2. Click "🔍 Debug"
3. Screenshot the debug panel
4. Check console logs for `[TeamManagement] Team Data:`
5. Verify both pages are using the service (check imports)