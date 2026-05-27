# Tenant System Implementation Guide

## Quick Start

### 1. Understanding Contexts

You're now in a **real multi-tenant SaaS** with two modes:

**Platform Mode** (Super Admin only):
- Manage all tenants
- Switch between tenants
- No company_id restriction

**Tenant Mode** (Everyone else):
- Isolated to your company
- Can't switch tenants
- All data filtered by company_id

### 2. Using Tenant Context

```javascript
import { useTenant } from '@/components/tenant/TenantContext';

function MyComponent() {
  const { activeTenant, isPlatformMode, enabledModules } = useTenant();
  
  if (isPlatformMode) {
    // Platform admin view
  } else {
    // Tenant view - activeTenant.name, activeTenant.logo_url, etc.
  }
}
```

### 3. Fetching Data (CRITICAL)

**WRONG** - Data leakage risk:
```javascript
const projects = await base44.entities.Project.list();
```

**CORRECT** - Tenant-isolated:
```javascript
import { getCurrentTenantFilter } from '@/lib/tenantFilter';

const filter = await getCurrentTenantFilter();
const projects = await filter.list('Project', '-created_date');
```

### 4. Header Context Banner

Automatically shows:
- Platform: "Platform Administration"
- Tenant: "Tenant Workspace: [Company Name]"

### 5. Tenant Switcher

Only visible to Super Admin / Developer in top-right.

Tenant users NEVER see it.

---

## Architecture

### Context Providers

```jsx
<TenantProvider>  // NEW - wraps entire app
  <WorkspaceProvider>
    <Router>
      <App />
    </Router>
  </WorkspaceProvider>
</TenantProvider>
```

### Navigation

**Platform Nav** (admin only):
- /super-admin
- /tenant-onboarding
- /saas-plans-admin
- /platform-settings
- /brand-approval
- /developer
- /integrations
- /system-status
- /product-analytics
- /tenant-integrity

**Tenant Nav** (module-filtered):
- / (Command Center)
- /clients
- /projects
- /properties
- /estimates
- /documents
- /guardian (if enabled)
- /financial-control (if enabled)
- /ai (if enabled)
- /intelligence (if enabled)
- /workflows (if enabled)

---

## Module System

Modules are enabled based on subscription plan:

**Starter:**
- Core modules only (projects, estimates, clients, documents)

**Professional:**
- Starter + Guardian + Financial Control + AI Copilot

**Enterprise:**
- Professional + Intelligence + Workflows + White Label

Check in components:
```javascript
if (!enabledModules.includes('guardian')) {
  return null; // Don't show Guardian nav item
}
```

---

## Security

### User Entity

Every user MUST have:
```json
{
  "email": "user@company.com",
  "company_id": "abc123", // Required for tenant users
  "role": "project_manager"
}
```

Exceptions: `admin`, `developer` roles don't need company_id (platform mode).

### Data Entities

Every record MUST have:
```json
{
  "company_id": "abc123",
  "title": "..."
}
```

### Backend Filters

`getUserFilters` function returns:
- Platform users: `{ filters: {} }` (no restrictions)
- Tenant users: `{ filters: { Project: { company_id }, ... } }`

---

## Tenant Integrity Audit

Run at: `/tenant-integrity`

Checks:
- Users without company_id
- Companies without subscriptions
- Orphaned data (invalid company_id references)

Auto-fix available for user company assignments.

---

## Common Issues

### "User has no company_id"

**Problem:** Tenant user created without company_id.

**Fix:**
1. Go to /tenant-integrity
2. Click "Auto-fix" on the issue
3. Or manually update User entity with company_id

### "Seeing data from other tenants"

**Problem:** Using `.list()` instead of `.filter()`.

**Fix:**
```javascript
// WRONG
const clients = await base44.entities.Client.list();

// CORRECT
const filter = await getCurrentTenantFilter();
const clients = await filter.list('Client', '-created_date');
```

### "Menu shows platform items to tenant users"

**Problem:** Not checking `isPlatformMode`.

**Fix:**
```javascript
const visibleNav = isPlatformMode 
  ? PLATFORM_NAV_ITEMS 
  : TENANT_NAV_ITEMS.filter(item => enabledModules.includes(item.module));
```

---

## Testing

### As Super Admin:
1. Login as admin
2. See "Platform" in header
3. Use Tenant Switcher to view different companies
4. Check /tenant-integrity for issues

### As Tenant User:
1. Login as user@company.com
2. See company name in header
3. NO tenant switcher visible
4. All data filtered to your company

---

## Migration Checklist

- [ ] Remove BrandSelector component
- [ ] Add TenantProvider to App.jsx
- [ ] Replace WorkspaceSwitcher with TenantSwitcher
- [ ] Add ContextBanner to Layout
- [ ] Update getUserFilters for platform mode
- [ ] Run tenant integrity audit
- [ ] Fix any orphaned users/data
- [ ] Update all data queries to use TenantFilter

---

## Next Steps

1. **Module Gating:** Hide nav items based on enabledModules
2. **Impersonation:** Admin can "become" tenant user for support
3. **Onboarding:** Auto-create default data for new tenants
4. **Billing:** Integrate Stripe for subscription management
5. **Analytics:** Track per-tenant usage metrics

---

## Support

Issues with tenant isolation?
- Check /tenant-integrity first
- Review docs/MULTI_TENANT_ARCHITECTURE.md
- Verify all queries use TenantFilter