import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Platform admin only' }, { status: 403 });
    }

    const { tenant_id } = await req.json();
    
    if (!tenant_id) {
      return Response.json({ error: 'tenant_id required' }, { status: 400 });
    }

    // Archive the tenant
    await base44.asServiceRole.entities.Company.update(tenant_id, {
      status: 'archived',
    });

    // Archive all memberships
    const memberships = await base44.asServiceRole.entities.TenantMembership.filter({
      tenant_id: tenant_id,
    });

    for (const membership of memberships) {
      await base44.asServiceRole.entities.TenantMembership.update(membership.id, {
        status: 'removed',
      });
    }

    return Response.json({
      success: true,
      message: `Tenant ${tenant_id} archived successfully`,
      archived_memberships: memberships.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});