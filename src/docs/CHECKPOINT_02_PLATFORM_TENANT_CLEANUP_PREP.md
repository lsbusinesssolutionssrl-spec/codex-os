# CHECKPOINT_02_PLATFORM_TENANT_CLEANUP_PREP

**Date**: 2026-05-28
**Performed by**: Platform Owner
**Purpose**: Pre-cleanup snapshot of all tenant data before classification and archival

## TENANTS SNAPSHOT

### Tenant 1: Ls Business Solutions
- **tenant_id**: [TO BE FILLED]
- **email**: lsbusiness.solutions.srl@gmail.com
- **status**: Inactive
- **subscription**: No subscription
- **users**: 2
- **tenant_type**: [TO CLASSIFY]
- **created_at**: [TO BE FILLED]
- **created_by**: [TO BE FILLED]

### Tenant 2: Demo Tenant
- **tenant_id**: [TO BE FILLED]
- **email**: demo@codex.platform
- **plan**: Enterprise
- **status**: Active
- **users**: 0
- **tenant_type**: demo (presumed)
- **created_at**: [TO BE FILLED]
- **created_by**: [TO BE FILLED]

### Tenant 3: Ls Business Solutions Srl
- **tenant_id**: [TO BE FILLED]
- **email**: amministrazione@lsbusiness.it
- **plan**: Enterprise
- **status**: Active
- **users**: 0 (SUSPECTED DATA ISSUE)
- **tenant_type**: production_customer (presumed)
- **created_at**: [TO BE FILLED]
- **created_by**: [TO BE FILLED]

### Tenant 4: Codex Solution (Default)
- **tenant_id**: [TO BE FILLED]
- **email**: admin@codexsolution.it
- **plan**: Professional
- **status**: Active
- **MRR**: €99
- **tenant_type**: [TO CLASSIFY]
- **created_at**: [TO BE FILLED]
- **created_by**: [TO BE FILLED]

## CLEANUP PLAN

1. ✅ Create checkpoint (THIS FILE)
2. ⏳ Export all tenant data
3. ⏳ Classify each tenant
4. ⏳ Add tenant_type field to Company entity
5. ⏳ Create Tenant Cleanup Center page
6. ⏳ Fix user count display
7. ⏳ Fix platform sidebar
8. ⏳ Implement platform metrics filtering
9. ⏳ Execute archival (if needed)
10. ⏳ Verify regression tests

## SAFETY RULES

- NO hard deletes
- All archival actions require confirmation
- Preserve production tenant: Ls Business Solutions Srl
- Export data before any modification
- Test impersonation after cleanup
- Verify tenant isolation after cleanup