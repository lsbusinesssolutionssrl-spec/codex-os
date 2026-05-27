# Platform Access & Role System

## Overview

Enterprise role-based access control (RBAC) system with clear separation between platform-level and tenant-level access.

## Global Roles

### Platform-Level Roles

These roles have platform-wide access and do NOT require a tenant company:

1. **Super Admin** (`admin`)
   - Full platform access
   - Tenant management
   - System configuration
   - All developer tools
   - White label approval

2. **Platform Owner** (reserved)
   - Platform ownership rights
   - Billing access
   - Strategic controls

3. **Developer** (`developer`)
   - Developer tools access
   - API management
   - Integration configuration
   - System monitoring

### Tenant-Level Roles

These roles require a tenant company context:

4. **Tenant Admin** (`company_admin`)
   - Company-wide administration
   - User management
   - Subscription management
   - Feature configuration

5. **Project Manager** (`project_manager`)
   - Project oversight
   - Team coordination
   - Financial access
   - Document management

6. **Sales** (`sales`)
   - Client management
   - Estimate creation
   - Property management
   - Lead tracking

7. **Technician** (`technician`)
   - Field operations
   - Checklist execution
   - Ticket management
   - Project updates

8. **Finance** (`finance`)
   - Financial control
   - Invoice management
   - Cost tracking
   - Reporting

9. **Client** (`client`)
   - Client portal access
   - Project viewing
   - Document access
   - Estimate approval

## Context Separation

### Platform Context

Accessible ONLY to Super Admin / Platform Owner / Developer:

- **Super Admin Dashboard** (`/super-admin`)
  - Tenant overview
  - Platform KPIs
  - Health monitoring
  - Quick actions

- **Platform Settings** (`/platform-settings`)
  - System modules
  - Configuration hub
  - Platform stats
  - Admin tools

- **Tenant Management**
  - Create tenants
  - Configure subscriptions
  - Impersonate tenant admins
  - Suspend/activate tenants

- **SaaS Plans** (`/subscription-plans`)
  - Plan configuration
  - Feature definitions
  - Pricing management
  - Quota settings

- **Feature Flags**
  - Enable/disable features
  - Plan-based access
  - Custom limits
  - Rollout control

- **AI Providers** (`/ai-foundation`)
  - Model configuration
  - Provider setup
  - Usage monitoring
  - Cost management

- **Integrations** (`/integrations`)
  - Platform integrations
  - OAuth connectors
  - Webhook setup
  - API management

- **System Health** (`/system-status`)
  - Performance monitoring
  - Error tracking
  - Uptime monitoring
  - Resource usage

- **Audit Logs** (`/platform-health`, `/aiaudit`)
  - Platform events
  - User actions
  - Security logs
  - Compliance tracking

- **White Label Requests** (`/brand-approval`)
  - Brand theme approval
  - Review workflow
  - Quality control

### Tenant Context

Accessible to tenant users (requires company):

- **Clients** (`/clients`)
- **Properties** (`/properties`)
- **Estimates** (`/estimates`)
- **Projects** (`/projects`)
- **Documents** (`/documents`)
- **Guardian** (`/guardian`)
- **Financial Control** (`/financial-control`)
- **Team** (`/team`)
- **Company Settings** (`/company-settings`)
- **Tickets** (`/tickets`)
- **Checklists** (`/checklists`)
- **Timesheets** (`/timesheets`)
- **Purchase Orders** (`/purchase-orders`)

## Settings Page Behavior

### For Super Admin / Developer

When a platform-level user accesses `/company-settings`:

**Shows:**
- Platform modules grid
- Quick access to:
  - Platform Settings
  - Tenant Management
  - SaaS Plans
  - Feature Flags
  - AI Providers
  - Integrations
- Platform mode notice

**Does NOT show:**
- "Company not found" error
- Logout prompt
- Company configuration form

### For Tenant Users

When a tenant user accesses `/company-settings`:

**Shows:**
- Company information
- Brand settings
- Subscription details
- Usage & quotas

**Requires:**
- Valid company association
- Tenant context

## Navigation Visibility

### Super Admin / Developer Always See

**Platform Section:**
- Super Admin Dashboard
- Platform Settings
- Tenant Management
- SaaS Plans
- Feature Flags
- AI Architecture
- AI Providers
- Workflow Engine
- Integrations
- White Label Requests
- Platform Health
- Audit Logs
- Developer Settings
- API Keys
- System Status

**Tenant Tools:**
- Clients
- Properties
- Estimates
- Projects
- Home Passport
- Guardian
- Documents
- Financial Control
- Team
- Settings

### Tenant Admin Sees

**Tenant Tools:**
- Dashboard
- Clients
- Properties
- Estimates
- Projects
- Documents
- Guardian
- Financial Control (if enabled)
- Team
- Settings

**Does NOT see:**
- Developer settings
- Platform settings
- Global tenant management
- AI provider global config
- Super admin tools
- System health
- Audit logs (platform-wide)

## Company Required Guard

### Applies To

- Client
- Technician
- Sales
- Project Manager
- Finance
- Tenant Admin (for tenant-specific pages)

### Bypassed For

- Super Admin
- Platform Owner
- Developer

**Logic:**

```javascript
// In CompanySettings.jsx
if (user?.role === 'admin') {
  // Show platform modules
  return <PlatformModules />;
}

if (!company) {
  // Show error only for tenant users
  return <CompanyNotFound />;
}
```

## Workspace System

### Available Workspaces by Role

**Super Admin:**
- `super_admin` (default)
- `executive`
- `operations`
- `financial`
- `guardian`

**Tenant Admin:**
- `executive` (default)
- `operations`
- `financial`
- `sales`
- `guardian`

**Project Manager:**
- `operations` (default)
- `financial`

**Technician:**
- `technician` (default)

**Sales:**
- `sales` (default)

**Finance:**
- `financial` (default)

### Workspace Router

Located in `WorkspaceRouter.jsx`:

```javascript
switch (currentWorkspace) {
  case 'super_admin':
    return <SuperAdminWorkspace />;
  case 'executive':
    return <ExecutiveWorkspace />;
  // ... other workspaces
}
```

## Tenant Selector for Super Admin

### Location

Top navigation bar (header)

### Visibility

ONLY visible to:
- Super Admin
- Platform Owner
- Developer

### Options

1. **Platform Overview** (default)
   - Platform-wide data
   - System modules
   - No tenant context

2. **Select Tenant**
   - Dropdown of all tenants
   - Quick switch
   - Tenant preview

3. **Create New Tenant**
   - Opens onboarding wizard
   - Full setup flow

4. **Impersonate Tenant Admin**
   - View as tenant admin
   - Debug tenant issues
   - Support mode

## Platform Bootstrap

### When No Tenants Exist

Super Admin sees setup screen:

**"Platform Bootstrap"**

**Actions:**
1. Create first tenant
2. Configure SaaS plans
3. Configure platform branding
4. Configure AI providers
5. Configure billing placeholders
6. Invite developer/admin users

**Does NOT block:**
- Super Admin access
- Platform configuration
- System setup

## Emergency Admin Access

### Safe Fallback

If user has `platform_role = Super Admin` or `Developer`:

**Bypasses:**
- Tenant-only redirects
- Company required guards
- Tenant context checks

**Allows:**
- Access to Platform Settings
- Tenant creation
- Company setup
- All developer tools

**Implementation:**

```javascript
// In AuthContext or guards
const isPlatformUser = user?.role === 'admin' || user?.platform_role === 'developer';

if (isPlatformUser) {
  // Allow platform access
  return true;
}
```

## Access Debug Page (Developer Only)

### Location

`/developer/access-debug` (to be created)

### Shows

- Current user ID
- Email
- Platform role
- Tenant role
- Current tenant_id
- Selected tenant
- Permissions
- Visible modules
- Hidden modules
- Reason why menu is hidden
- Workspace context
- Feature flags

### Purpose

Debug access issues and verify role configuration.

## Implementation Files

### Core Files

- `pages/CompanySettings.jsx` - Settings with platform mode
- `pages/PlatformSettings.jsx` - Platform configuration hub
- `pages/SuperAdminDashboard.jsx` - Tenant management
- `components/workspace/WorkspaceContext.jsx` - Workspace logic
- `components/workspace/SuperAdminWorkspace.jsx` - Platform workspace
- `lib/AuthContext.jsx` - Authentication context
- `components/FeatureAccessGuard.jsx` - Feature guards

### Routing

- `/platform-settings` - Platform Settings
- `/super-admin` - Tenant Management
- `/subscription-plans` - SaaS Plans
- `/developer` - Developer Settings
- `/brand-approval` - White Label Queue
- `/company-settings` - Company/Platform Settings (role-aware)

## Final Expected Behavior

### When Login as Developer / Platform Owner

✅ **I see:**
- Full platform area
- All platform modules
- Developer tools
- System settings
- AI configuration
- Integration hub
- Audit logs

✅ **I can:**
- Create and configure tenants
- Configure company settings
- Configure plans and features
- Access developer settings
- Select or impersonate tenants
- View platform analytics
- Manage white label requests

❌ **I do NOT get:**
- Blocked by "company not configured"
- Redirected to tenant pages
- Limited access to platform tools
- Tenant-only restrictions

### When Login as Tenant User

✅ **I see:**
- My tenant workspace
- Company-specific data
- My role's modules
- Tenant settings

❌ **I do NOT see:**
- Platform settings
- Other tenant data
- Developer tools
- System configuration
- Global admin tools

## Security Considerations

1. **Role Verification**
   - Always check `user.role`
   - Verify platform roles separately
   - Don't trust client-side only

2. **Data Isolation**
   - Tenant data filtered by `company_id`
   - Platform data has no company filter
   - RLS policies enforce separation

3. **Audit Trail**
   - All admin actions logged
   - Tenant changes tracked
   - Platform config versioned

4. **Emergency Access**
   - Super Admin always has access
   - No single point of failure
   - Backup admin accounts recommended

## Testing Checklist

- [ ] Super Admin can access all platform pages
- [ ] Super Admin sees platform modules in Settings
- [ ] Super Admin is NOT blocked by company guard
- [ ] Tenant users see only their company data
- [ ] Tenant users are blocked from platform pages
- [ ] Workspace switching works correctly
- [ ] Navigation shows correct items per role
- [ ] Feature flags respect plan access
- [ ] Audit logs capture admin actions
- [ ] Emergency access works for platform users

## Future Enhancements

- [ ] Access debug page
- [ ] Platform bootstrap wizard
- [ ] Tenant selector UI component
- [ ] Role management UI
- [ ] Permission testing tools
- [ ] Audit log viewer
- [ ] Impersonation mode
- [ ] Multi-admin support
- [ ] Role templates
- [ ] Custom role creation