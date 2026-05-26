import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's company_id from User entity
    const users = await base44.entities.User.filter({ email: user.email });
    if (users.length === 0 || !users[0].company_id) {
      return Response.json({ error: 'User not associated with any company' }, { status: 404 });
    }

    const company = await base44.entities.Company.get(users[0].company_id);
    const subscription = await base44.entities.CompanySubscription.filter({ 
      company_id: users[0].company_id,
      status: 'active'
    }).then(subs => subs[0] || null);

    return Response.json({
      company,
      subscription,
      user
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});