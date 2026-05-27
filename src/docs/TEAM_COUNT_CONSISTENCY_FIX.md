# Team Count & Data Consistency Fix

## Problem
- **Dashboard** showed Team = 2
- **Team & Ruoli** page showed 0 members
- Data sources were inconsistent

## Root Cause
- Dashboard counted ALL `TenantMembership` records (line 26)
- Team page only displayed `status === 'active'` members (line 41)
- Pending/invited users were counted but not shown

## Solution

### 1. Dashboard Fix (`pages/TenantAdminDashboard`)
**Changed:**
```javascript
// BEFORE: Counted all memberships
team: team.length,

// AFTER: Count only active members (matches Team page)
const activeMembers = memberships.filter(m => m.status === 'active');
const pendingInvites = memberships.filter(m => ['invited', 'pending'].includes(m.status));

setStats({
  team: activeMembers.length,  // Now matches Team page
  pendingInvites: pendingInvites.length,  // Shows pending count separately
  totalMemberships: memberships.length,
});
```

**UI Enhancement:**
- Team stat card now shows subtitle: "2 inviti" when there are pending invitations
- Provides visibility into pending vs active members

### 2. Team Page Fix (`pages/TeamManagement`)
**Added:**
- Debug panel to diagnose membership issues
- Console logging for all membership states
- Shows all memberships including removed/suspended

**Debug Panel Features:**
- Tenant ID
- Total Memberships
- Active Members
- Pending Invites
- Removed Members
- Suspended Members
- Missing User Profiles
- Users Loaded Successfully

### 3. Single Source of Truth
Both pages now use:
```javascript
base44.entities.TenantMembership.filter({ tenant_id: activeTenant.id })
```

**Counting Logic:**
- Dashboard Team count = Active members only
- Team page list = Active members only
- Pending invitations shown separately in both places

## Acceptance Criteria ✅

- ✅ Dashboard Team count matches Team & Ruoli list
- ✅ Tenant admin appears in Team & Ruoli (if membership exists)
- ✅ Pending invitations appear clearly in "Inviti in Attesa" section
- ✅ All records are tenant_id filtered
- ✅ No cross-tenant users appear
- ✅ Debug panel explains count source
- ✅ Empty state rule enforced (if Team page empty, dashboard shows 0)

## Debug Instructions

If inconsistency persists:

1. **Open Team & Ruoli page**
2. **Click "🔍 Debug" button** (top left, next to "Invita Membro")
3. **Check:**
   - Total Memberships > 0?
   - Active Members count matches dashboard?
   - Missing User Profile = 0? (if > 0, user records are missing)
   - Check "All Memberships" list for status issues

4. **Common Issues:**
   - **Missing User Profile**: User was invited but hasn't registered yet
   - **Status = 'removed'**: Member was removed, doesn't count
   - **Status = 'suspended'**: Member suspended, doesn't count
   - **No memberships**: Tenant has no team members yet

## Data Flow

```
TenantMembership Entity (Source of Truth)
         ↓
    Filter by tenant_id
         ↓
    ┌────────────┬─────────────┐
    │            │             │
 Active      Pending      Removed/
 (counted)  (shown)     Suspended
                          (hidden)
```

## Files Modified
- `pages/TenantAdminDashboard.jsx` - Fixed team counting logic
- `pages/TeamManagement.jsx` - Added debug panel and enhanced logging

## Testing
1. Navigate to Dashboard
2. Note Team count (e.g., "2")
3. Navigate to Team & Ruoli
4. Verify "Membri Attivi" matches dashboard count
5. If there are pending invites, they appear in "Inviti in Attesa"
6. Use Debug panel to verify all memberships are loaded correctly