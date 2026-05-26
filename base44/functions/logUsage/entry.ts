import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resource_type, resource_id, action = 'create', quantity = 1, metadata = {} } = await req.json();

    // Get user's company
    const users = await base44.entities.User.filter({ email: user.email });
    if (users.length === 0 || !users[0].company_id) {
      return Response.json({ error: 'User not associated with any company' }, { status: 404 });
    }

    const company_id = users[0].company_id;

    // Log usage
    const log = await base44.entities.UsageLog.create({
      company_id,
      resource_type,
      resource_id: resource_id || null,
      action,
      quantity,
      timestamp: new Date().toISOString(),
      user_email: user.email,
      metadata
    });

    return Response.json({ success: true, log });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});