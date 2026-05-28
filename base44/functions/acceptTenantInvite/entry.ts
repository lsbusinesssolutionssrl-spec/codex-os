import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * acceptTenantInvite
 * 
 * Handles invite acceptance flow:
 * 1. By membership_id (token from invite link)
 * 2. By email auto-activation (called from GlobalContextEngine)
 * 
 * Input:
 * - membership_id: optional, direct link activation
 * - auto_activate: optional boolean, activates all pending/invited memberships for authenticated user
 * - user_email: optional, used with auto_activate
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { membership_id, auto_activate, user_email } = body;

    const effectiveEmail = (user_email || user.email || '').trim().toLowerCase();
    const debug = {
      user_id: user.id,
      user_email: effectiveEmail,
      membership_id: membership_id || null,
      auto_activate: !!auto_activate,
      invited_memberships_found: 0,
      activated: [],
      errors: [],
    };

    // --- MODE 1: Direct activation by membership_id (invite link token) ---
    if (membership_id) {
      let membership;
      try {
        membership = await base44.asServiceRole.entities.TenantMembership.get(membership_id);
      } catch (e) {
        return Response.json({
          success: false,
          error: 'Invito non trovato.',
          debug: { ...debug, failure_reason: 'membership_not_found' },
        }, { status: 404 });
      }

      if (!membership) {
        return Response.json({
          success: false,
          error: 'Invito non trovato.',
          debug: { ...debug, failure_reason: 'membership_null' },
        }, { status: 404 });
      }

      if (membership.status === 'active') {
        return Response.json({
          success: true,
          already_active: true,
          membership,
          debug: { ...debug, note: 'already_active' },
        });
      }

      const invitedEmail = (membership.user_email || '').trim().toLowerCase();
      const emailMatch = invitedEmail === effectiveEmail;

      debug.invited_email = invitedEmail;
      debug.registered_email = effectiveEmail;
      debug.email_match = emailMatch;

      if (!emailMatch) {
        // Log warning but allow platform admin to repair separately
        return Response.json({
          success: false,
          email_mismatch: true,
          error: `Questa registrazione non corrisponde all'indirizzo email invitato.`,
          invited_email: invitedEmail,
          registered_email: effectiveEmail,
          debug: { ...debug, failure_reason: 'email_mismatch' },
        }, { status: 400 });
      }

      // Activate membership
      const updated = await base44.asServiceRole.entities.TenantMembership.update(membership_id, {
        user_id: user.id,
        user_email: effectiveEmail,
        status: 'active',
        joined_at: new Date().toISOString(),
        membership_type: membership.membership_type || 'customer_member',
      });

      debug.activated.push({
        membership_id,
        tenant_id: membership.tenant_id,
        old_status: membership.status,
        new_status: 'active',
        user_id_linked: user.id,
      });

      // Determine redirect path based on role
      const role = membership.tenant_role;
      const redirectPath = role === 'technician' ? '/technician' :
                           role === 'sales' ? '/estimates' :
                           '/app/admin/dashboard';

      return Response.json({
        success: true,
        membership: updated,
        redirect_path: redirectPath,
        debug,
      });
    }

    // --- MODE 2: Auto-activate all pending/invited memberships matching user email ---
    if (auto_activate) {
      // Find all memberships where user_email matches (case-insensitive, trim)
      const allMemberships = await base44.asServiceRole.entities.TenantMembership.filter({});
      
      const pendingForUser = allMemberships.filter(m => {
        const mEmail = (m.user_email || '').trim().toLowerCase();
        const statusMatch = ['invited', 'pending'].includes((m.status || '').toLowerCase());
        const emailMatch = mEmail === effectiveEmail;
        return statusMatch && emailMatch;
      });

      debug.invited_memberships_found = pendingForUser.length;

      if (pendingForUser.length === 0) {
        return Response.json({
          success: true,
          activated_count: 0,
          message: 'No pending invitations found for this email.',
          debug,
        });
      }

      let activatedCount = 0;
      for (const m of pendingForUser) {
        try {
          await base44.asServiceRole.entities.TenantMembership.update(m.id, {
            user_id: user.id,
            user_email: effectiveEmail,
            status: 'active',
            joined_at: new Date().toISOString(),
            membership_type: m.membership_type || 'customer_member',
          });
          activatedCount++;
          debug.activated.push({
            membership_id: m.id,
            tenant_id: m.tenant_id,
            tenant_role: m.tenant_role,
            old_status: m.status,
            new_status: 'active',
          });
        } catch (e) {
          debug.errors.push({ membership_id: m.id, error: e.message });
        }
      }

      return Response.json({
        success: true,
        activated_count: activatedCount,
        debug,
      });
    }

    return Response.json({
      success: false,
      error: 'Provide membership_id or auto_activate=true',
    }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});