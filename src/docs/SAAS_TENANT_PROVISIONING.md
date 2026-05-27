# SaaS Tenant Provisioning and Activation System

## Overview

Codex OS now includes a comprehensive multi-tenant SaaS architecture that enables platform owners to sell, provision, and manage customer companies as isolated tenants with feature-based access control.

## Architecture

### Core Entities

1. **Company** - Tenant organization
   - Isolated data container
   - Custom branding (logo, colors)
   - Settings and configuration

2. **CompanySubscription** - Tenant subscription
   - Plan assignment (Starter/Professional/Enterprise)
   - Billing status (Trial/Active/Suspended/Cancelled)
   - Usage tracking (MRR, seats, storage)

3. **SubscriptionPlan** - Available plans
   - Feature quotas (users, projects, storage)
   - Pricing (monthly/yearly)
   - Feature flags

4. **TenantFeatureFlag** - Feature access control
   - Per-tenant feature enablement
   - Plan-based restrictions
   - Custom limits

5. **TenantActivationLog** - Audit trail
   - All tenant lifecycle events
   - Impersonation sessions
   - Feature changes

6. **TenantImpersonation** - Support tool
   - Super admin impersonation tracking
   - Session logging
   - Security audit

## User Roles

### Super Admin (Platform Owner)

**Access**: `/super-admin`

**Capabilities**:
- Create new tenants via onboarding wizard
- View all tenants with health scores
- Manage subscription plans
- Suspend/reactivate tenants
- Impersonate tenant admins for support
- View platform-wide analytics
- Configure feature flags per tenant
- Access activation logs

**Restrictions**:
- Cannot access other tenants' data directly
- All actions logged in TenantActivationLog

### Tenant Admin (Company Admin)

**Access**: Company workspace only

**Capabilities**:
- Invite team members
- Manage company settings
- Configure branding
- View subscription and usage
- Access enabled features only
- Create clients, properties, projects
- Use AI features if enabled

**Restrictions**:
- Cannot see other tenants
- Cannot access Super Admin panel
- Cannot modify platform settings
- Limited by plan quotas
- Cannot access disabled features

### Tenant Users

**Roles**: Project Manager, Sales, Technician, Finance, Client

**Capabilities**:
- Access only their company's data
- Role-based feature access
- Limited by tenant's plan

## Tenant Lifecycle

### 1. Creation (Super Admin)

**Flow**: `/tenant-onboarding`

1. Company information
2. Logo and branding
3. Admin user creation
4. Document numbering
5. Team invitations
6. Plan selection
7. Review and create

**Automated Actions**:
- Generate tenant_id
- Create isolated environment
- Apply plan quotas
- Set feature flags
- Create default templates
- Log activation event

### 2. Activation Checklist

**Page**: `/activation-wizard`

**Required Items**:
- ✅ Company profile completed
- ✅ Logo uploaded
- ✅ Plan selected
- ✅ Tenant admin created
- ✅ Users invited (min 2)
- ✅ Modules enabled (min 1)
- ✅ Estimate templates configured
- ✅ First client created
- ✅ First project created

**Progress Tracking**:
- Visual progress bar
- Completion percentage
- Quick setup actions

### 3. Ongoing Management

**Tenant Management Page**: `/tenant/:companyId`

**Features**:
- Tenant overview
- User management
- Feature flag controls
- Status changes (suspend/reactivate)
- Impersonation
- Activation logs

## Feature Access Control

### Plan Tiers

**Starter** (€49/mo):
- Basic features only
- 3 users, 10 projects, 5GB storage
- No AI Estimator
- No Financial Control
- No Guardian
- No API access

**Professional** (€99/mo):
- All Starter features +
- AI Estimator
- Financial Control
- Guardian (20 subscriptions)
- Advanced Analytics
- 10 users, 50 projects, 20GB storage
- 100 estimates/month

**Enterprise** (€249/mo):
- All Professional features +
- Predictive Intelligence
- White Label
- API Access
- Custom Integrations
- Priority Support
- 50 users, 200 projects, 100GB storage

### Feature Flags

Controlled via `TenantFeatureFlag` entity:

```javascript
{
  company_id: "tenant_id",
  feature_name: "ai_estimator",
  enabled: true,
  plan_required: "professional",
  custom_limit: 100
}
```

### Guard Components

**Frontend**: `<FeatureAccessGuard requiredPlan="professional">`

**Hook**: `const { hasAccess } = useFeatureAccess('ai_estimator')`

**Behavior**:
- Shows upgrade prompt if access denied
- Prevents navigation to restricted pages
- Graceful degradation (no broken pages)

## Impersonation System

### Use Case

Super Admin needs to troubleshoot tenant issues by experiencing the platform from their perspective.

### Flow

1. Super Admin clicks "Impersonate" on tenant management page
2. System creates `TenantImpersonation` record
3. Orange banner appears: "Impersonating Tenant: [Name]"
4. Super Admin sees tenant's view
5. All actions logged
6. "Exit Impersonation" button returns to Super Admin view

### Security

- All impersonation sessions logged
- Banner always visible during impersonation
- Cannot modify critical tenant data without confirmation
- Audit trail in `TenantActivationLog`

## Tenant Statuses

| Status | Login Allowed | Can Create | Billing |
|--------|--------------|------------|---------|
| Trial | ✅ Full access | ✅ Yes | Free |
| Active | ✅ Full access | ✅ Yes | Normal |
| Suspended | ⚠️ Billing only | ❌ No | Paused |
| Cancelled | ⚠️ Read-only | ❌ No | Ended |
| Past Due | ⚠️ Limited | ⚠️ Warning | Overdue |

### Suspended Tenant Behavior

- Login redirects to billing/upgrade page
- All data preserved
- No new projects/estimates
- Existing projects read-only
- Banner: "Account suspended - Contact support"

## Data Isolation

### Entity Filtering

**ALL entities must include `company_id`**:

```javascript
// Backend function
const projects = await base44.entities.Project.filter({
  company_id: company.id
});

// Frontend
const clients = await base44.entities.Client.filter(
  getUserFilters().Client || {}
);
```

### User Entity

Users belong to a company:

```javascript
{
  email: "user@company.com",
  company_id: "tenant_id",
  role: "project_manager"
}
```

### Security Rules

- Users can only access their company's data
- Cross-tenant queries return empty
- RLS (Row Level Security) enforced
- No tenant can access another's data

## Backend Functions

### `updateTenantStatus`

**Purpose**: Change tenant subscription status

**Payload**:
```javascript
{
  companyId: "string",
  newStatus: "active|suspended|cancelled",
  reason: "string (optional)"
}
```

**Access**: Super Admin only

**Logs**: TenantActivationLog entry

### `assignTenantPlan`

**Purpose**: Assign or upgrade tenant plan

**Payload**:
```javascript
{
  companyId: "string",
  planId: "string",
  billingCycle: "monthly|yearly"
}
```

**Access**: Super Admin only

**Logs**: TenantActivationLog entry

## Activation Checklist Automation

Track completion automatically:

```javascript
const checklist = CHECKLIST_ITEMS.map(item => {
  if (item.entity === 'Company') {
    return !!company[item.field];
  } else if (item.entity === 'User') {
    return users.length >= item.min;
  }
  // ... etc
});
```

## Usage Monitoring

### Quotas

Tracked in `CompanySubscription`:

```javascript
{
  seats_used: 5,
  storage_used_gb: 2.3,
  mrr: 99.0
}
```

### Overages

- Warn at 80% quota usage
- Block at 100% (unless Enterprise)
- Show upgrade prompts

### Analytics

**Super Admin Dashboard**:
- Total tenants
- MRR/ARR
- Health scores
- Churn risk
- Feature adoption

**Tenant Dashboard**:
- Usage vs quotas
- Plan details
- Upgrade options

## Deployment Checklist

- [ ] Create entity schemas
- [ ] Deploy backend functions
- [ ] Update App.jsx routes
- [ ] Add FeatureAccessGuard to protected pages
- [ ] Implement quota checking
- [ ] Test impersonation flow
- [ ] Verify data isolation
- [ ] Test upgrade/downgrade flows
- [ ] Document for tenants
- [ ] Train support team

## Security Considerations

1. **Never expose `company_id` in client-side code without validation**
2. **Always filter by `company_id` in backend functions**
3. **Log all Super Admin actions**
4. **Impersonation requires explicit exit**
5. **Feature flags checked on every protected route**
6. **Quotas enforced server-side**

## Future Enhancements

- [ ] Automated trial expiry handling
- [ ] Self-service plan upgrades (Stripe integration)
- [ ] Tenant-specific custom domains
- [ ] White-label portals
- [ ] Usage-based billing
- [ ] Automated dunning (payment recovery)
- [ ] Tenant health scoring AI
- [ ] Churn prediction

## Support

For platform support, contact the Super Admin team.

For tenant support, use impersonation to troubleshoot directly.