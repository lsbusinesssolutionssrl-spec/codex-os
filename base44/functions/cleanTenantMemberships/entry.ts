import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !['admin', 'developer', 'tenant_admin'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { tenantId } = await req.json().catch(() => ({}));

    if (!tenantId) {
      return Response.json({ error: 'tenantId required' }, { status: 400 });
    }

    // Get all memberships for this tenant
    const memberships = await base44.asServiceRole.entities.TenantMembership.filter({
      tenant_id: tenantId,
    });

    const actions = [];
    const errors = [];

    // STEP 1: Backfill missing emails
    for (const membership of memberships) {
      if (!membership.email) {
        try {
          const linkedUser = await base44.asServiceRole.entities.User.filter({
            id: membership.user_id,
          }).then(u => u[0]);

          if (linkedUser) {
            await base44.asServiceRole.entities.TenantMembership.update(membership.id, {
              email: linkedUser.email,
            });
            actions.push({
              action: 'backfilled_email',
              membership_id: membership.id,
              user_email: linkedUser.email,
            });
          }
        } catch (error) {
          errors.push({
            membership_id: membership.id,
            error: error.message,
          });
        }
      }
    }

    // STEP 2: Find duplicate customer memberships (same user_id + tenant_id)
    const customerMemberships = memberships.filter(m => 
      m.membership_type === 'customer_member' || !m.membership_type
    );

    // Group by user_id
    const byUser = {};
    customerMemberships.forEach(m => {
      if (!byUser[m.user_id]) {
        byUser[m.user_id] = [];
      }
      byUser[m.user_id].push(m);
    });

    // STEP 3: For each user with multiple memberships, keep only the best one
    for (const [userId, userMemberships] of Object.entries(byUser)) {
      if (userMemberships.length <= 1) {
        continue;
      }

      // Sort by priority: active > invited > removed
      // Then by role: tenant_admin > project_manager > technician > viewer
      const rolePriority = {
        tenant_admin: 4,
        project_manager: 3,
        sales: 2,
        technician: 1,
        viewer: 0,
      };

      const statusPriority = {
        active: 3,
        pending: 2,
        invited: 1,
        removed: 0,
        suspended: -1,
      };

      const sorted = userMemberships.sort((a, b) => {
        // First by status
        const statusDiff = (statusPriority[b.status] || 0) - (statusPriority[a.status] || 0);
        if (statusDiff !== 0) return statusDiff;
        
        // Then by role
        return (rolePriority[b.tenant_role] || 0) - (rolePriority[a.tenant_role] || 0);
      });

      // Keep the best membership
      const best = sorted[0];
      
      // Archive/update the rest
      for (let i = 1; i < sorted.length; i++) {
        const duplicate = sorted[i];
        
        try {
          if (duplicate.status === 'invited' || duplicate.status === 'pending') {
            // Archive duplicate invite
            await base44.asServiceRole.entities.TenantMembership.update(duplicate.id, {
              status: 'removed',
              archived_reason: 'duplicate_invite',
              archived_at: new Date().toISOString(),
            });
            actions.push({
              action: 'archived_duplicate_invite',
              membership_id: duplicate.id,
              user_id: userId,
              old_role: duplicate.tenant_role,
              kept_membership_id: best.id,
              kept_role: best.tenant_role,
            });
          } else if (duplicate.status === 'active') {
            // Demote duplicate active membership to removed (role history)
            await base44.asServiceRole.entities.TenantMembership.update(duplicate.id, {
              status: 'removed',
              archived_reason: 'duplicate_active_membership',
              archived_at: new Date().toISOString(),
            });
            actions.push({
              action: 'archived_duplicate_active',
              membership_id: duplicate.id,
              user_id: userId,
              old_role: duplicate.tenant_role,
              kept_membership_id: best.id,
              kept_role: best.tenant_role,
            });
          } else if (duplicate.status === 'removed') {
            // Already removed, just ensure it's marked as historical
            actions.push({
              action: 'kept_as_history',
              membership_id: duplicate.id,
              user_id: userId,
              status: duplicate.status,
            });
          }
        } catch (error) {
          errors.push({
            membership_id: duplicate.id,
            error: error.message,
          });
        }
      }

      // Ensure the best membership has is_primary = true
      if (!best.is_primary) {
        await base44.asServiceRole.entities.TenantMembership.update(best.id, {
          is_primary: true,
        });
        actions.push({
          action: 'set_primary_membership',
          membership_id: best.id,
          user_id: userId,
        });
      }
    }

    // STEP 4: Handle internal_support vs customer_member separation
    const platformOwnerEmails = ['lsbusiness.solutions.srl@gmail.com'];
    
    for (const membership of memberships) {
      const linkedUser = await base44.asServiceRole.entities.User.filter({
        id: membership.user_id,
      }).then(u => u[0]);

      if (!linkedUser) continue;

      // If platform owner, ensure membership_type = internal_support
      if (platformOwnerEmails.includes(linkedUser.email)) {
        if (membership.membership_type !== 'internal_support') {
          await base44.asServiceRole.entities.TenantMembership.update(membership.id, {
            membership_type: 'internal_support',
          });
          actions.push({
            action: 'converted_to_internal_support',
            membership_id: membership.id,
            user_email: linkedUser.email,
            old_type: membership.membership_type,
          });
        }
      }
    }

    // STEP 5: Recalculate counts
    const updatedMemberships = await base44.asServiceRole.entities.TenantMembership.filter({
      tenant_id: tenantId,
    });

    const customerMembers = updatedMemberships.filter(m => 
      (m.membership_type === 'customer_member' || !m.membership_type) &&
      m.status === 'active'
    );

    const pendingInvites = updatedMemberships.filter(m => 
      (m.membership_type === 'customer_member' || !m.membership_type) &&
      (m.status === 'invited' || m.status === 'pending')
    );

    const internalSupport = updatedMemberships.filter(m => 
      m.membership_type === 'internal_support' &&
      m.status === 'active'
    );

    const historical = updatedMemberships.filter(m => 
      m.status === 'removed' || m.archived_reason
    );

    // Build detailed invitation audit report
    const invitationAudit = {
      total_records: updatedMemberships.length,
      accepted_invites: updatedMemberships.filter(m => m.joined_at).length,
      pending_invites: pendingInvites.length,
      historical_removed: historical.length,
      by_email: {},
    };

    // Group by email for duplicate detection
    updatedMemberships.forEach(m => {
      const email = m.email || m.user_email || 'unknown';
      if (!invitationAudit.by_email[email]) {
        invitationAudit.by_email[email] = [];
      }
      invitationAudit.by_email[email].push({
        membership_id: m.id,
        role: m.tenant_role,
        status: m.status,
        membership_type: m.membership_type,
        is_primary: m.is_primary,
        invited_at: m.invited_at,
        joined_at: m.joined_at,
        archived_reason: m.archived_reason,
      });
    });

    return Response.json({
      success: true,
      actions,
      errors,
      summary: {
        total_memberships: updatedMemberships.length,
        customer_members_active: customerMembers.length,
        pending_invites: pendingInvites.length,
        internal_support: internalSupport.length,
        historical_removed: historical.length,
      },
      invitation_audit: invitationAudit,
      message: `Membership cleanup completed. ${actions.length} actions performed.`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});