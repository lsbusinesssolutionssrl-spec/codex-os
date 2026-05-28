import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Platform admin only' }, { status: 403 });
    }

    // Platform owner emails that should be marked as internal_support
    const PLATFORM_OWNER_EMAILS = ['lsbusiness.solutions.srl@gmail.com'];

    // Load all memberships
    const allMemberships = await base44.asServiceRole.entities.TenantMembership.list();
    
    // Load all users
    const allUsers = await base44.asServiceRole.entities.User.list();
    
    let updatedCount = 0;
    let updates = [];

    for (const membership of allMemberships) {
      const matchedUser = allUsers.find(u => u.id === membership.user_id);
      const userEmail = matchedUser?.email || 'Unknown';
      
      // Check if should be internal_support
      if (PLATFORM_OWNER_EMAILS.includes(userEmail)) {
        // Update to internal_support if not already set
        if (membership.membership_type !== 'internal_support') {
          await base44.asServiceRole.entities.TenantMembership.update(membership.id, {
            membership_type: 'internal_support',
          });
          updatedCount++;
          updates.push({
            membership_id: membership.id,
            tenant_id: membership.tenant_id,
            user_email: userEmail,
            action: 'set_internal_support',
          });
        }
      } else {
        // Ensure customer members have membership_type set
        if (!membership.membership_type || membership.membership_type === 'system') {
          await base44.asServiceRole.entities.TenantMembership.update(membership.id, {
            membership_type: 'customer_member',
          });
          updatedCount++;
          updates.push({
            membership_id: membership.id,
            tenant_id: membership.tenant_id,
            user_email: userEmail,
            action: 'set_customer_member',
          });
        }
      }
    }

    return Response.json({
      success: true,
      updated_count: updatedCount,
      updates,
      message: `Updated ${updatedCount} memberships with membership_type`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});