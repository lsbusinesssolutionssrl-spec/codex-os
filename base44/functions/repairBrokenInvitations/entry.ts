import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin or tenant_admin can repair
    const isAdmin = user.role === 'admin' || user.role === 'developer';
    
    if (!isAdmin) {
      // Check if user is tenant_admin
      const membership = await base44.entities.TenantMembership.filter({
        user_id: user.id,
        tenant_role: 'tenant_admin',
        status: 'active'
      }).then(m => m[0] || null);
      
      if (!membership) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    console.log('[repairBrokenInvitations] Starting repair process...');

    // Get all memberships with status = invited/pending
    const allMemberships = await base44.asServiceRole.entities.TenantMembership.filter({
      status: 'invited'
    });

    console.log('[repairBrokenInvitations] Found', allMemberships.length, 'invited memberships');

    const repairLog = [];
    let repairedCount = 0;
    let orphanCount = 0;

    for (const membership of allMemberships) {
      const emailIssues = [];
      
      // Check if user_email is missing or invalid
      if (!membership.user_email || 
          membership.user_email === 'Unknown' || 
          membership.user_email === 'None' ||
          membership.user_email === 'null' ||
          !membership.user_email.includes('@')) {
        emailIssues.push(`Invalid user_email: ${membership.user_email}`);
      }

      // Try to get email from linked user
      let recoveredEmail = null;
      if (membership.user_id) {
        const linkedUser = await base44.asServiceRole.entities.User.get(membership.user_id);
        if (linkedUser && linkedUser.email) {
          recoveredEmail = linkedUser.email;
        }
      }

      // If still no email, mark as orphan
      if (emailIssues.length > 0 && !recoveredEmail) {
        orphanCount++;
        repairLog.push({
          membership_id: membership.id,
          tenant_id: membership.tenant_id,
          tenant_role: membership.tenant_role,
          status: membership.status,
          issue: emailIssues.join(', '),
          action: 'marked_as_orphan',
          recovered_email: null
        });
        
        // Mark as removed to hide from UI
        await base44.asServiceRole.entities.TenantMembership.update(membership.id, {
          status: 'removed',
          notes: (membership.notes || '') + ' [AUTO-REMOVED: broken invitation - email missing]'
        });
        
        console.log('[repairBrokenInvitations] Marked as orphan:', membership.id);
        continue;
      }

      // Repair the membership with recovered email
      if (emailIssues.length > 0 && recoveredEmail) {
        await base44.asServiceRole.entities.TenantMembership.update(membership.id, {
          user_email: recoveredEmail,
          notes: (membership.notes || '') + ' [AUTO-REPAIRED: email recovered from linked user]'
        });
        
        repairedCount++;
        repairLog.push({
          membership_id: membership.id,
          tenant_id: membership.tenant_id,
          tenant_role: membership.tenant_role,
          status: membership.status,
          issue: emailIssues.join(', '),
          action: 'repaired',
          recovered_email: recoveredEmail
        });
        
        console.log('[repairBrokenInvitations] Repaired:', membership.id, 'with email:', recoveredEmail);
      }
    }

    return Response.json({
      success: true,
      total_checked: allMemberships.length,
      repaired_count: repairedCount,
      orphan_count: orphanCount,
      repair_log: repairLog
    });

  } catch (error) {
    console.error('[repairBrokenInvitations] Error:', error);
    return Response.json({ 
      error: 'Errore repair: ' + error.message,
      stack: error.stack
    }, { status: 500 });
  }
});