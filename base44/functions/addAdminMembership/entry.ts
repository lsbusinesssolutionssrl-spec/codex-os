import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can use this function
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { targetUserEmail, companyId } = body;

    if (!targetUserEmail || !companyId) {
      return Response.json({ 
        error: 'Missing targetUserEmail or companyId',
        hint: 'Usage: ?targetUserEmail=user@example.com&companyId=abc123'
      }, { status: 400 });
    }

    // Find user by email
    const users = await base44.asServiceRole.entities.User.filter({ email: targetUserEmail });
    if (users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const targetUser = users[0];

    // Check if membership already exists
    const existingMemberships = await base44.asServiceRole.entities.TenantMembership.filter({
      user_id: targetUser.id,
      tenant_id: companyId,
    });

    if (existingMemberships.length > 0) {
      return Response.json({ 
        message: 'Membership already exists',
        membership: existingMemberships[0]
      });
    }

    // Create membership
    const membership = await base44.entities.TenantMembership.create({
      user_id: targetUser.id,
      tenant_id: companyId,
      tenant_role: 'tenant_admin',
      status: 'active',
      is_primary: true,
      permissions: {
        can_create_projects: true,
        can_create_estimates: true,
        can_view_financials: true,
        can_manage_team: true,
        can_access_api: true,
      },
      default_workspace: 'executive',
      language: 'it',
    });

    // Update user with company_id (legacy support)
    await base44.auth.updateMe({ company_id: companyId });

    return Response.json({
      message: 'Membership created successfully',
      membership: {
        id: membership.id,
        user_id: targetUser.id,
        tenant_id: companyId,
        tenant_role: membership.tenant_role,
        status: membership.status,
        is_primary: membership.is_primary,
      },
      user_updated: true,
    });
  } catch (error) {
    console.error('addAdminMembership error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});