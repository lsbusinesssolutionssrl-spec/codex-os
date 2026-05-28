import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * repairInviteAcceptance
 * 
 * Admin tool to repair a specific user's tenant membership after failed invite acceptance.
 * Used for immediate repairs like Luana's case.
 * 
 * Input:
 * - target_email: email of the user to repair (registered email)
 * - also_try_email: optional typo variant to check in invitations
 * - tenant_name: optional, narrow search to specific tenant
 * - force_create: optional boolean, create membership if none found
 * - tenant_role: optional, role to use if creating new membership (default: project_manager)
 * - tenant_id: optional, explicit tenant_id for force_create
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !['admin', 'super_admin', 'developer', 'platform_owner'].includes(user.role)) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      target_email,
      also_try_email,
      tenant_name,
      force_create = false,
      tenant_role = 'project_manager',
      tenant_id: explicitTenantId,
    } = body;

    if (!target_email) {
      return Response.json({ error: 'target_email is required' }, { status: 400 });
    }

    const normalizedEmail = target_email.trim().toLowerCase();
    const alsoTryNormalized = also_try_email ? also_try_email.trim().toLowerCase() : null;

    const report = {
      target_email: normalizedEmail,
      also_try_email: alsoTryNormalized,
      tenant_name_filter: tenant_name || null,
      steps: [],
      result: null,
    };

    // Step 1: Find the registered user
    const allUsers = await base44.asServiceRole.entities.User.list();
    const targetUser = allUsers.find(u =>
      (u.email || '').trim().toLowerCase() === normalizedEmail
    );

    report.steps.push({
      step: 'find_user',
      email_searched: normalizedEmail,
      found: !!targetUser,
      user_id: targetUser?.id || null,
      user_email: targetUser?.email || null,
    });

    if (!targetUser) {
      return Response.json({
        success: false,
        error: `User not found with email: ${normalizedEmail}`,
        report,
      }, { status: 404 });
    }

    // Step 2: Find all memberships for this user (already active = done)
    const existingMemberships = await base44.asServiceRole.entities.TenantMembership.filter({
      user_id: targetUser.id,
    });

    const activeMemberships = existingMemberships.filter(m => m.status === 'active');
    report.steps.push({
      step: 'check_existing_memberships',
      total_by_user_id: existingMemberships.length,
      active: activeMemberships.length,
    });

    if (activeMemberships.length > 0) {
      return Response.json({
        success: true,
        already_active: true,
        memberships: activeMemberships,
        report,
        message: 'User already has active memberships. No repair needed.',
      });
    }

    // Step 3: Search for pending/invited memberships by email (both variants)
    const allMemberships = await base44.asServiceRole.entities.TenantMembership.filter({});
    
    const searchEmails = [normalizedEmail];
    if (alsoTryNormalized) searchEmails.push(alsoTryNormalized);

    const pendingCandidates = allMemberships.filter(m => {
      const mEmail = (m.user_email || '').trim().toLowerCase();
      const statusMatch = ['invited', 'pending'].includes((m.status || '').toLowerCase());
      const emailMatch = searchEmails.includes(mEmail);
      return statusMatch && emailMatch;
    });

    report.steps.push({
      step: 'find_pending_memberships',
      emails_searched: searchEmails,
      candidates_found: pendingCandidates.length,
      candidates: pendingCandidates.map(m => ({
        id: m.id,
        user_email: m.user_email,
        tenant_id: m.tenant_id,
        tenant_role: m.tenant_role,
        status: m.status,
        invited_by: m.invited_by,
        invited_at: m.invited_at,
      })),
    });

    // Step 4: Filter by tenant name if provided
    let targetMemberships = pendingCandidates;
    if (tenant_name) {
      // Load companies to match by name
      const companies = await base44.asServiceRole.entities.Company.filter({});
      const matchingTenants = companies.filter(c =>
        (c.name || '').toLowerCase().includes(tenant_name.toLowerCase())
      );
      const matchingTenantIds = matchingTenants.map(c => c.id);
      
      targetMemberships = pendingCandidates.filter(m => matchingTenantIds.includes(m.tenant_id));
      
      report.steps.push({
        step: 'filter_by_tenant_name',
        tenant_name_filter: tenant_name,
        matching_tenants: matchingTenants.map(c => ({ id: c.id, name: c.name })),
        after_filter: targetMemberships.length,
      });
    }

    // Step 5: Activate found memberships
    if (targetMemberships.length > 0) {
      const repaired = [];
      for (const m of targetMemberships) {
        const emailMismatch = (m.user_email || '').trim().toLowerCase() !== normalizedEmail;
        
        await base44.asServiceRole.entities.TenantMembership.update(m.id, {
          user_id: targetUser.id,
          user_email: normalizedEmail, // always set to the registered (correct) email
          status: 'active',
          joined_at: new Date().toISOString(),
          membership_type: m.membership_type || 'customer_member',
        });

        repaired.push({
          membership_id: m.id,
          tenant_id: m.tenant_id,
          tenant_role: m.tenant_role,
          old_email: m.user_email,
          new_email: normalizedEmail,
          email_was_corrected: emailMismatch,
          old_status: m.status,
          new_status: 'active',
          user_id_linked: targetUser.id,
        });
      }

      report.steps.push({
        step: 'activate_memberships',
        repaired_count: repaired.length,
        repaired,
      });

      report.result = 'repaired';
      return Response.json({
        success: true,
        repaired_count: repaired.length,
        repaired,
        report,
        message: `Successfully repaired ${repaired.length} membership(s) for ${normalizedEmail}`,
      });
    }

    // Step 6: Force create if no pending memberships found
    if (force_create && explicitTenantId) {
      const newMembership = await base44.asServiceRole.entities.TenantMembership.create({
        tenant_id: explicitTenantId,
        user_id: targetUser.id,
        user_email: normalizedEmail,
        tenant_role,
        status: 'active',
        membership_type: 'customer_member',
        is_primary: true,
        joined_at: new Date().toISOString(),
        invited_by: user.email,
        invited_at: new Date().toISOString(),
      });

      report.steps.push({
        step: 'force_create',
        created_membership_id: newMembership.id,
        tenant_id: explicitTenantId,
        tenant_role,
      });

      report.result = 'created';
      return Response.json({
        success: true,
        created: true,
        membership: newMembership,
        report,
        message: `Membership created for ${normalizedEmail} with role ${tenant_role}`,
      });
    }

    // Nothing found, nothing created
    report.result = 'not_found';
    return Response.json({
      success: false,
      error: 'No pending invitations found. Use force_create=true with tenant_id to create manually.',
      report,
    }, { status: 404 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});