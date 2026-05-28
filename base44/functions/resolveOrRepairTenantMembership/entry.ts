import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * TENANT MEMBERSHIP RESOLVER & AUTO-REPAIR
 * 
 * Automatically creates or repairs TenantMembership when:
 * 1. User email matches tenant.tenant_admin_email
 * 2. User email matches pending tenant invitation
 * 3. Tenant was provisioned with this admin email but membership creation failed
 * 
 * NEVER creates membership just because user is logged in.
 * Requires explicit authorization proof.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ 
        success: false, 
        error: 'Unauthorized',
        reason: 'user_not_authenticated'
      }, { status: 401 });
    }

    console.log('[resolveOrRepairTenantMembership] User:', user.email, user.id, user.role);

    // STEP 1: Check if membership already exists (use service role to bypass RLS)
    const existingMemberships = await base44.asServiceRole.entities.TenantMembership.filter({
      user_id: user.id,
    });

    console.log('[resolveOrRepairTenantMembership] Found existing memberships:', existingMemberships.length);

    // If membership exists and is active, return it
    const activeMembership = existingMemberships.find(m => m.status === 'active');
    if (activeMembership) {
      console.log('[resolveOrRepairTenantMembership] Active membership found:', activeMembership.id);
      return Response.json({
        success: true,
        action: 'found_existing',
        membership: activeMembership,
        reason: 'active_membership_already_exists',
      });
    }

    // STEP 2: If membership exists but inactive, try to reactivate
    if (existingMemberships.length > 0) {
      const inactiveMembership = existingMemberships[0];
      console.log('[resolveOrRepairTenantMembership] Found inactive membership:', inactiveMembership.id, inactiveMembership.status);
      
      // Reactivate if it's the same user
      await base44.asServiceRole.entities.TenantMembership.update(inactiveMembership.id, {
        status: 'active',
        joined_at: new Date().toISOString(),
      });

      console.log('[resolveOrRepairTenantMembership] Reactivated membership:', inactiveMembership.id);
      
      return Response.json({
        success: true,
        action: 'reactivated',
        membership: {
          ...inactiveMembership,
          status: 'active',
          joined_at: new Date().toISOString(),
        },
        reason: 'inactive_membership_reactivated',
      });
    }

    // STEP 3: No membership found - check safe auto-repair conditions
    
    // 3A: Check if user company_id points to a tenant (legacy binding)
    if (user.company_id) {
      console.log('[resolveOrRepairTenantMembership] User has legacy company_id:', user.company_id);
      
      const tenant = await base44.asServiceRole.entities.Company.get(user.company_id);
      
      if (tenant) {
        console.log('[resolveOrRepairTenantMembership] Found tenant via company_id:', tenant.name);
        
        // SAFE CONDITION: User has legacy company_id binding - this proves they should have membership
        const newMembership = await base44.asServiceRole.entities.TenantMembership.create({
          user_id: user.id,
          tenant_id: tenant.id,
          tenant_role: 'tenant_admin',
          status: 'active',
          is_primary: true,
          invited_by: 'system_auto_repair',
          invited_at: new Date().toISOString(),
          joined_at: new Date().toISOString(),
          notes: 'Auto-repaired from legacy company_id binding',
        });

        console.log('[resolveOrRepairTenantMembership] Created membership from legacy binding:', newMembership.id);
        
        return Response.json({
          success: true,
          action: 'created_from_legacy_binding',
          membership: newMembership,
          reason: 'user_had_legacy_company_id_binding',
          tenant: {
            id: tenant.id,
            name: tenant.name,
          },
        });
      }
    }

    // 3B: Check if user email matches any tenant's admin email or invitations
    const allTenants = await base44.asServiceRole.entities.Company.filter({
      status: 'active',
    });

    console.log('[resolveOrRepairTenantMembership] Checking', allTenants.length, 'tenants for email match');

    for (const tenant of allTenants) {
      // Check tenant admin email match
      const tenantAdminEmail = tenant.settings?.tenant_admin_email || tenant.email;
      
      if (tenantAdminEmail === user.email) {
        console.log('[resolveOrRepairTenantMembership] Email match found for tenant:', tenant.name);
        
        // SAFE CONDITION: User email matches tenant admin email
        const newMembership = await base44.asServiceRole.entities.TenantMembership.create({
          user_id: user.id,
          tenant_id: tenant.id,
          tenant_role: 'tenant_admin',
          status: 'active',
          is_primary: true,
          invited_by: 'system_auto_repair',
          invited_at: new Date().toISOString(),
          joined_at: new Date().toISOString(),
          notes: 'Auto-repaired: user email matches tenant admin email',
        });

        console.log('[resolveOrRepairTenantMembership] Created membership from email match:', newMembership.id);
        
        return Response.json({
          success: true,
          action: 'created_from_email_match',
          membership: newMembership,
          reason: 'user_email_matches_tenant_admin_email',
          tenant: {
            id: tenant.id,
            name: tenant.name,
          },
        });
      }

      // Check pending invitations
      const invitations = await base44.asServiceRole.entities.TenantMembership.filter({
        tenant_id: tenant.id,
        status: 'invited',
      });

      const pendingInvite = invitations.find(inv => {
        // Try to match by user email if available
        if (inv.user_email === user.email) return true;
        return false;
      });

      if (pendingInvite) {
        console.log('[resolveOrRepairTenantMembership] Found pending invite for user:', pendingInvite.id);
        
        // Update the invitation to active
        await base44.asServiceRole.entities.TenantMembership.update(pendingInvite.id, {
          user_id: user.id,
          status: 'active',
          joined_at: new Date().toISOString(),
        });

        return Response.json({
          success: true,
          action: 'accepted_invitation',
          membership: {
            ...pendingInvite,
            user_id: user.id,
            status: 'active',
            joined_at: new Date().toISOString(),
          },
          reason: 'user_accepted_pending_invitation',
          tenant: {
            id: tenant.id,
            name: tenant.name,
          },
        });
      }
    }

    // STEP 4: No safe conditions met - cannot auto-repair
    console.log('[resolveOrRepairTenantMembership] No safe auto-repair conditions met');
    
    return Response.json({
      success: false,
      error: 'Cannot auto-create membership',
      reason: 'no_safe_conditions_met',
      details: {
        user_email: user.email,
        user_id: user.id,
        user_company_id: user.company_id,
        checks_performed: [
          'existing_membership_check: FAILED (none found)',
          'legacy_company_id_check: FAILED (no company_id or tenant not found)',
          'tenant_admin_email_match: FAILED (no match)',
          'pending_invitation_check: FAILED (no pending invites)',
        ],
      },
    }, { status: 404 });

  } catch (error) {
    console.error('[resolveOrRepairTenantMembership] Error:', error);
    return Response.json({ 
      error: error.message,
      reason: 'internal_server_error',
    }, { status: 500 });
  }
});