import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenant_id, email, role, language = 'it', message } = await req.json();

    // Validation
    if (!tenant_id || !email || !role) {
      return Response.json({ 
        error: 'Missing required fields: tenant_id, email, role',
        details: { tenant_id: !!tenant_id, email: !!email, role: !!role }
      }, { status: 400 });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json({ error: 'Email non valida' }, { status: 400 });
    }

    // Allowed tenant roles (NOT platform roles)
    const ALLOWED_TENANT_ROLES = [
      'tenant_admin',
      'project_manager',
      'sales',
      'finance',
      'technician',
      'viewer'
    ];

    if (!ALLOWED_TENANT_ROLES.includes(role)) {
      return Response.json({ 
        error: 'Ruolo non consentito. Ruoli permessi: ' + ALLOWED_TENANT_ROLES.join(', '),
        attempted_role: role
      }, { status: 403 });
    }

    // Verify current user is tenant admin of this tenant
    const membership = await base44.entities.TenantMembership.filter({
      user_id: user.id,
      tenant_id,
      tenant_role: 'tenant_admin',
      status: 'active'
    }).then(m => m[0] || null);

    if (!membership) {
      return Response.json({ 
        error: 'Permessi insufficienti. Devi essere Tenant Admin per invitare membri.',
        user_id: user.id,
        tenant_id,
        current_role: membership?.tenant_role
      }, { status: 403 });
    }

    // Verify tenant is active
    const tenant = await base44.entities.Company.get(tenant_id);
    if (!tenant || tenant.archived || tenant.status !== 'active') {
      return Response.json({ error: 'Tenant non attivo' }, { status: 400 });
    }

    // Get all tenant memberships for duplicate checks
    const allTenantMemberships = await base44.entities.TenantMembership.filter({
      tenant_id
    });

    // DUPLICATE CHECK 1: Active member
    const activeMember = allTenantMemberships.find(m => {
      const memberEmail = m.user?.email || m.user_email;
      return memberEmail?.toLowerCase() === email.toLowerCase() && m.status === 'active';
    });

    if (activeMember) {
      return Response.json({ 
        error: 'Questo utente è già membro del team.',
        existing_membership_id: activeMember.id,
        existing_role: activeMember.tenant_role
      }, { status: 409 });
    }

    // DUPLICATE CHECK 2: Pending invitation
    const pendingInvite = allTenantMemberships.find(m => {
      const memberEmail = m.user?.email || m.user_email;
      return memberEmail?.toLowerCase() === email.toLowerCase() && ['invited', 'pending'].includes(m.status);
    });

    if (pendingInvite) {
      return Response.json({ 
        error: 'Esiste già un invito in attesa per questo indirizzo email.',
        existing_membership_id: pendingInvite.id,
        existing_role: pendingInvite.tenant_role,
        invited_at: pendingInvite.invited_at
      }, { status: 409 });
    }

    // Try to find existing user by email
    const existingUser = await base44.entities.User.filter({
      email
    }).then(u => u[0] || null);

    // Create TenantMembership with user_email for invited users (user_id optional)
    const newMembership = await base44.entities.TenantMembership.create({
      user_id: existingUser?.id || null, // null for new invites
      user_email: email, // Always store email for display
      tenant_id,
      tenant_role: role,
      status: 'invited',
      membership_type: 'customer_member',
      invited_by: user.email,
      invited_at: new Date().toISOString(),
      language,
      is_primary: false,
      notes: message || null
    });

    // EMAIL PLACEHOLDER - In production, send real invitation email
    const emailSent = false; // Placeholder - real email service not configured yet
    const inviteLink = `/accept-invite/${newMembership.id}`;

    console.log('[inviteTenantUser] Success:', {
      membership_id: newMembership.id,
      email,
      role,
      tenant_id,
      user_id: existingUser?.id,
      email_sent: emailSent,
      invite_link: inviteLink
    });

    return Response.json({
      success: true,
      membership: newMembership,
      email_sent: emailSent,
      invite_link: inviteLink,
      message: emailSent 
        ? 'Invito inviato con successo' 
        : 'Invito creato - email non configurata (usa il link per invitare)'
    });

  } catch (error) {
    console.error('[inviteTenantUser] Error:', error);
    return Response.json({ 
      error: 'Errore backend: ' + error.message,
      stack: error.stack
    }, { status: 500 });
  }
});