# Single Source of Truth - Global Context Architecture

## Critical Issue Resolved

**Problem:** Application was showing DIFFERENT RBAC contexts on different pages:
- Page A: "From Modules: 71" ✅
- Page B: "From Modules: 0" ❌

**Root Cause:** Potential duplicate context providers or stale React state.

**Solution:** Implemented strict singleton context architecture with verification.

## Architecture Overview

### BEFORE (Potentially Broken)

```
App.jsx
├─ AuthProvider
└─ GlobalContextProvider  ← Instance #1
    ├─ Layout
    │   └─ Page A  ← Uses Context #1 ✅
    └─ Route /page-b
        └─ Page B  ← Uses Context #2? ❌ (if duplicate exists)
```

### AFTER (Fixed)

```
App.jsx
├─ AuthProvider
└─ GlobalContextProvider  ← SINGLE Instance
    ├─ Layout
    │   ├─ ContextVerification  ← Monitors context ID
    │   ├─ RBACDebugPanel  ← Shows context ID
    │   └─ Page A  ← Uses Context #1 ✅
    └─ Routes
        └─ Page B  ← Uses SAME Context #1 ✅
```

## Mandatory Singletons

### 1. GlobalContextProvider ✅

**Location:** `lib/GlobalContextEngine.jsx`

**Responsibility:**
- Authenticate user
- Resolve tenant memberships
- Compute enabled modules
- Resolve permissions via RBACResolver
- Maintain single source of truth

**Usage:**
```jsx
// App.jsx - ONLY ONCE
<AuthProvider>
  <QueryClientProvider client={queryClientInstance}>
    <GlobalContextProvider>  {/* ← SINGLE INSTANCE */}
      <Router>
        <AuthenticatedApp />
      </Router>
    </GlobalContextProvider>
  </QueryClientProvider>
</AuthProvider>
```

### 2. RBACResolver ✅

**Location:** `lib/RBACResolver.js`

**Responsibility:**
- Pure function (no state)
- Resolves permissions from role + modules
- No caching, no side effects
- Always returns fresh computation

**Usage:**
```javascript
import { RBACResolver } from '@/lib/RBACResolver';

const resolved = RBACResolver.resolvePermissions(
  'tenant_admin',
  ['financial_control', 'intelligence']
);
// Always deterministic
```

### 3. ModuleRegistry ✅

**Location:** Embedded in GlobalContextEngine

**Responsibility:**
- Tracks enabled modules per tenant
- Computed from subscription + feature flags
- No separate state - part of GlobalContext

## Context ID Verification

### Implemented Debug IDs

Every context instance now has unique IDs:

```javascript
{
  contextId: `ctx_${timestamp}`,
  rbacContextId: `rbac_${contextId}`,
  moduleRegistryId: `mod_${contextId}`,
}
```

**Verification Components:**

1. **ContextVerification** (Top center overlay)
   - Shows all 3 context IDs
   - Detects multiple context instances
   - Shows warning if IDs differ across renders

2. **RBACDebugPanel** (Bottom left)
   - Shows context IDs
   - Shows permission breakdown
   - Developer only

3. **ModuleEntitlementDebug** (Bottom right)
   - Shows module entitlements
   - Shows context source
   - Admin only

## Forbidden Patterns

### ❌ DO NOT CREATE

```jsx
// FORBIDDEN: Duplicate provider
function Page() {
  return (
    <GlobalContextProvider>  {/* ❌ NO! */}
      <MyComponent />
    </GlobalContextProvider>
  );
}

// FORBIDDEN: Local RBAC state
function MyComponent() {
  const [permissions, setPermissions] = useState([]);  /* ❌ NO! */
  // Use useGlobalContext().permissions instead
}

// FORBIDDEN: Recompute permissions locally
function AnotherComponent() {
  const localPerms = computePermissions(role);  /* ❌ NO! */
  // Use useGlobalContext().permissions instead
}

// FORBIDDEN: Multiple context instances
function RouteWrapper() {
  return (
    <GlobalContextProvider>  {/* ❌ NO! Already in App.jsx */}
      <Page />
    </GlobalContextProvider>
  );
}
```

### ✅ ALWAYS USE

```jsx
// CORRECT: Single provider in App.jsx
function App() {
  return (
    <GlobalContextProvider>  {/* ✅ ONE instance */}
      <Router>
        <AppContent />
      </Router>
    </GlobalContextProvider>
  );
}

// CORRECT: Consume from global context
function AnyPage() {
  const { permissions, enabledModules } = useGlobalContext();  /* ✅ YES */
  
  return <div>{/* render */}</div>;
}

// CORRECT: Use centralized resolver
function CheckPermission() {
  const { hasPermission } = useGlobalContext();  /* ✅ YES */
  
  if (!hasPermission('financials:read')) {
    return <PermissionDenied />;
  }
}
```

## Context Initialization Flow

### CORRECT FLOW

```
1. App Mounts
   ↓
2. AuthProvider initializes
   ↓
3. GlobalContextProvider initializes ONCE
   ├─ Authenticates user
   ├─ Loads tenant memberships
   ├─ Resolves active tenant
   ├─ Computes enabled modules
   ├─ Resolves permissions via RBACResolver
   └─ Sets contextId = `ctx_${timestamp}`
   ↓
4. All pages consume SAME context
   ├─ contextId matches across all pages ✅
   ├─ permissions match across all pages ✅
   └─ enabledModules match across all pages ✅
```

## Verification Checklist

### ✅ ALL MUST PASS

1. **Single Provider**
   - ✅ Only ONE `<GlobalContextProvider>` in App.jsx
   - ✅ No providers in routes
   - ✅ No providers in pages
   - ✅ No providers in Layout

2. **Context ID Consistency**
   - ✅ All pages show SAME contextId
   - ✅ All pages show SAME rbacContextId
   - ✅ All pages show SAME moduleRegistryId
   - ✅ ContextVerification shows no warnings

3. **Permission Consistency**
   - ✅ All pages show SAME permission count
   - ✅ All pages show SAME module count
   - ✅ RBAC debug matches across pages
   - ✅ No "From Modules: 0" when modules enabled

4. **No Local State**
   - ✅ No page has local `useState` for permissions
   - ✅ No page recomputes modules locally
   - ✅ No page has fallback RBAC logic
   - ✅ All use `useGlobalContext()`

## Debug Tools

### 1. ContextVerification Overlay

**Location:** Top center of screen

**Shows:**
- Context ID
- RBAC ID
- Module Registry ID
- Warning if multiple contexts detected
- Success message if single instance verified

**Visibility:** Admin/Developer roles only

### 2. RBACDebugPanel

**Location:** Bottom left corner

**Shows:**
- User context
- Enabled modules
- Permission summary
- Permission categories
- Live permission tests
- Context IDs

**Visibility:** Always visible (for debugging)

### 3. ModuleEntitlementDebug

**Location:** Bottom right corner (collapsible)

**Shows:**
- Tenant info
- Subscription details
- Feature flags
- Module entitlements
- Pass/fail for each module

**Visibility:** Admin/Developer only

## Expected Behavior

### CORRECT STATE

```
Context ID: ctx_1716825600000
RBAC ID: rbac_ctx_1716825600000
Module Registry: mod_ctx_1716825600000

tenant_admin
enterprise plan
enabled modules:
  - financial_control
  - intelligence
  - ai_copilot
  - guardian
  - workflows

permissions:
  - From Role: 35
  - From Modules: 47
  - Total: 82

All pages show SAME values ✅
```

### INCORRECT STATE (BUG)

```
Page A:
  Context ID: ctx_1716825600000
  Total Permissions: 82
  From Modules: 47

Page B:
  Context ID: ctx_1716825700000  ← DIFFERENT!
  Total Permissions: 35
  From Modules: 0  ← BUG!

⚠️ Multiple Context Instances Detected
```

## Troubleshooting

### If "From Modules: 0" appears

1. **Check ContextVerification overlay**
   - Does it show warning about multiple contexts?
   - Do context IDs match across pages?

2. **Check RBACDebugPanel**
   - What is the contextId?
   - Navigate to another page
   - Does contextId change? (BAD)

3. **Check App.jsx**
   - Is there only ONE GlobalContextProvider?
   - Are there any providers in routes?

4. **Check pages**
   - Any page creating local RBAC state?
   - Any page recomputing permissions?

5. **Refresh context**
   - Use `refreshContext()` from GlobalContext
   - Or logout/login

### If permissions differ across pages

**IMMEDIATE ACTION:**
1. Open ContextVerification
2. Check if warning appears
3. If yes → Find duplicate provider
4. If no → Check for stale closure

## Conclusion

**The entire platform now operates from ONE unified enterprise state graph:**

- ✅ Single GlobalContextProvider
- ✅ Single RBAC resolution
- ✅ Single module registry
- ✅ Context ID verification
- ✅ No duplicate state
- ✅ No local RBAC computation
- ✅ All pages consume same context

**If ContextVerification shows "✓ Single Context Instance Verified":**
- All pages MUST show same permissions
- All pages MUST show same modules
- No "From Modules: 0" errors
- No "Permission Denied" for authorized users

**This is the single source of truth architecture.**