# Tenant Isolation & Sample Data Security

## Critical Security Fix

**Problem**: Newly created tenants could see all sample/demo projects and data created during development.

**Solution**: Strict tenant_id filtering + `is_sample` field to separate real tenant data from demo data.

---

## Architecture

### 1. Data Classification

All records belong to one of:

#### A. Real Tenant Data
- `company_id` = real tenant ID
- `is_sample` = false (or not set)
- **NEVER visible to other tenants**

#### B. Demo Tenant Data
- `company_id` = demo tenant ID
- `is_sample` = true
- **Only visible in demo tenant context**

#### C. Platform Templates
- `company_id` = null
- `is_template` = true
- **Reusable templates, NOT operational data**

---

## 2. Entity Schema Updates

Added `is_sample` field to ALL operational entities:

```json
{
  "is_sample": {
    "type": "boolean",
    "title": "Sample Data",
    "default": false
  }
}
```

**Entities updated:**
- Client
- Project
- Estimate
- Property
- SupportTicket
- GuardianSubscription
- ProjectCost
- Timesheet
- Supplier
- KnowledgeBase
- IntelligenceInsight
- AIMemory
- Notification
- Document
- ChecklistItem
- PurchaseOrder

---

## 3. Query Filtering (getUserFilters)

**Every query automatically filtered by:**

1. **company_id** - tenant isolation
2. **is_sample** - exclude demo data from real tenants

### Filter Logic

```javascript
// Check if tenant is demo
const isDemoTenant = company?.slug?.includes('demo') || 
                     company?.name?.toLowerCase().includes('demo') ||
                     company?.demo_mode === true;

// Real tenants: exclude sample data
const sampleFilter = isDemoTenant ? {} : { is_sample: { $ne: true } };

// Apply to all queries
Project: { company_id, ...sampleFilter }
```

### Role-Based Filters

All roles now enforce sample data exclusion:

- **Company Admin**: Full access within tenant, no sample data
- **Project Manager**: Full project access, no sample data
- **Technician**: Only assigned tasks, no sample data
- **Sales**: Clients/Properties/Estimates, no sample data
- **Client**: Only their own data, no sample data

---

## 4. Backend Functions

### auditTenantIsolation

**Purpose**: Find data integrity issues

**Checks:**
- Missing `company_id`
- Sample data in real tenants (`is_sample=true` + real `company_id`)
- Orphan records (`company_id` doesn't exist)
- Global sample records (no `company_id`)

**Usage:**
```javascript
const res = await base44.functions.invoke('auditTenantIsolation', {});
// Returns: audit report with issues and recommendations
```

### fixTenantIsolation

**Purpose**: Repair data integrity issues

**Actions:**
- `assign_to_demo` - Move to demo tenant
- `mark_as_template` - Mark as platform template
- `delete` - Remove record
- `fix_company_id` - Assign to specific tenant

**Usage:**
```javascript
await base44.functions.invoke('fixTenantIsolation', {
  action: 'assign_to_demo',
  entity_name: 'Project',
  record_ids: ['proj_123']
});
```

---

## 5. Tenant Isolation Audit Page

**Route**: `/tenant-isolation-audit` (Super Admin only)

**Features:**
- Real-time audit execution
- Issue categorization
- One-click fixes
- Progress tracking

**Audit Report Shows:**
- Records checked
- Missing tenant_id count
- Sample in real tenants count
- Orphan records count
- Issues fixed count

---

## 6. Company Entity Updates

Added `demo_mode` field:

```json
{
  "demo_mode": {
    "type": "boolean",
    "default": false,
    "title": "Demo Mode (show sample data)"
  }
}
```

**Demo Mode Behavior:**
- `true`: Show sample data (for demos/training)
- `false`: Hide all sample data (production tenants)

---

## 7. Tenant Onboarding Flow

### New Tenant Creation

**Default**: Start empty (NO sample data)

**Optional**: Import sample data
1. Duplicate sample records
2. Assign NEW `company_id`
3. Mark `is_sample = true`
4. Preserve relationships

**NEVER:**
- Share global sample records
- Show sample data across tenants

---

## 8. Data Migration

### Identify Problem Records

```sql
-- Missing company_id
SELECT * FROM "Project" WHERE "company_id" IS NULL;

-- Sample data in real tenants
SELECT * FROM "Project" 
WHERE "is_sample" = true 
AND "company_id" NOT IN (SELECT id FROM "Company" WHERE slug LIKE '%demo%');

-- Orphan records
SELECT * FROM "Project" 
WHERE "company_id" NOT IN (SELECT id FROM "Company");
```

### Fix Strategy

1. **Global sample data** → Move to Demo Tenant
2. **Orphan records** → Assign to Demo Tenant or delete
3. **Sample in real tenants** → Move to Demo Tenant
4. **Templates** → Mark as `is_template`, keep `company_id = null`

---

## 9. Prevention

### Validation Rules

**Before saving ANY operational record:**

```javascript
// Enforce company_id
if (!record.company_id) {
  throw new Error('company_id is required');
}

// Enforce tenant context
if (!tenantContext.activeTenant) {
  throw new Error('No active tenant context');
}
```

**Before rendering ANY list:**

```javascript
// Auto-apply filters
const filters = await getUserFilters();
const records = await base44.entities.Project.filter(filters);
```

**Before AI retrieval:**

```javascript
// Enforce tenant filter in RAG
const searchResults = await ragSearch({
  query,
  filters: { company_id: activeTenant.id }
});
```

---

## 10. Testing Checklist

### Test 1: New Tenant (Empty)
✅ Create tenant with "Start empty"
✅ Login as tenant admin
✅ Verify: ZERO clients, projects, tickets
✅ Verify: NO sample data visible

### Test 2: Demo Tenant
✅ Create demo tenant with sample data
✅ Verify: Sample data visible, labeled "Demo"
✅ Verify: Sample data NOT visible to other tenants

### Test 3: Real Tenant Isolation
✅ Login as real tenant admin
✅ Verify: Only own data visible
✅ Verify: ZERO sample/demo data
✅ Verify: Global search returns only own data

### Test 4: Technician View
✅ Login as technician in real tenant
✅ Verify: Only assigned tasks visible
✅ Verify: NO sample projects
✅ Verify: NO financial data from other tenants

### Test 5: AI Copilot
✅ Use AI in real tenant
✅ Verify: Retrieves only tenant's data
✅ Verify: NO sample/demo data in responses

### Test 6: Cross-Tenant Leak Test
✅ Create Tenant A with real data
✅ Create Tenant B (empty)
✅ Login as Tenant B
✅ Verify: Cannot see Tenant A's data
✅ Verify: Cannot see sample data

---

## 11. Security Guarantees

### Tenant Users See ONLY:
- Records where `record.company_id == user.company_id`
- Records where `record.is_sample == false` (unless demo tenant)
- Records explicitly shared with them

### NEVER See:
- Other tenants' data
- Global sample data
- Demo tenant data
- Platform templates (unless explicitly imported)

### Super Admin Can:
- View all tenants via tenant switcher
- Run integrity audits
- Fix data issues
- Impersonate tenant context

---

## 12. Monitoring

### Ongoing Checks

**Weekly Audit:**
```javascript
// Automated audit via scheduled function
const audit = await base44.functions.invoke('auditTenantIsolation', {});
if (audit.issues.length > 0) {
  // Alert platform team
}
```

**Metrics to Track:**
- Records without `company_id`
- Sample data in real tenants
- Orphan records
- Cross-tenant query leaks

---

## 13. Emergency Procedures

### If Data Leak Detected:

1. **Immediate**: Run `auditTenantIsolation`
2. **Contain**: Use `fixTenantIsolation` to move/fix records
3. **Investigate**: Check audit logs for source
4. **Prevent**: Add validation to prevent recurrence
5. **Notify**: Inform affected tenants if necessary

---

## Summary

**Before**: Sample data globally visible, no isolation
**After**: Strict tenant isolation, sample data contained

**Key Changes:**
1. `is_sample` field on all entities
2. `demo_mode` on Company
3. Auto-filtering in `getUserFilters`
4. Audit + fix functions
5. Integrity dashboard
6. Validation on save

**Result**: Production-ready multi-tenant SaaS security