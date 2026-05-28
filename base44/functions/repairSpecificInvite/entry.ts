import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { membership_id, email } = await req.json();

    if (!membership_id || !email) {
      return Response.json({ 
        error: 'Missing required fields: membership_id, email'
      }, { status: 400 });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json({ error: 'Email non valida' }, { status: 400 });
    }

    console.log('[repairSpecificInvite] Repairing membership:', membership_id, 'with email:', email);

    // Get the membership
    const membership = await base44.asServiceRole.entities.TenantMembership.get(membership_id);
    
    if (!membership) {
      return Response.json({ error: 'Membership not found' }, { status: 404 });
    }

    // Update with correct email
    const updatedMembership = await base44.asServiceRole.entities.TenantMembership.update(membership_id, {
      user_email: email,
      // Keep existing values
      tenant_role: membership.tenant_role || 'project_manager',
      status: membership.status || 'invited',
      membership_type: membership.membership_type || 'customer_member',
      // Ensure visibility flags
      notes: (membership.notes || '') + ' [REPAIRED: email added manually on ' + new Date().toISOString() + ']'
    });

    console.log('[repairSpecificInvite] Successfully repaired:', {
      membership_id: updatedMembership.id,
      email: updatedMembership.user_email,
      tenant_role: updatedMembership.tenant_role,
      status: updatedMembership.status,
      tenant_id: updatedMembership.tenant_id
    });

    return Response.json({
      success: true,
      membership: updatedMembership,
      message: `Invito riparato con email: ${email}`
    });

  } catch (error) {
    console.error('[repairSpecificInvite] Error:', error);
    return Response.json({ 
      error: 'Errore repair: ' + error.message,
      stack: error.stack
    }, { status: 500 });
  }
});