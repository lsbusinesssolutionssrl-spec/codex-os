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

    // Mark as demo
    await base44.asServiceRole.entities.Company.update(tenant_id, {
      demo_mode: true,
      name: `[DEMO] ${await base44.asServiceRole.entities.Company.get(tenant_id).then(c => c.name)}`,
    });

    return Response.json({
      success: true,
      message: `Tenant ${tenant_id} marked as demo`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});