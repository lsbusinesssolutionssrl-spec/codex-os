import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Platform users (admin/developer) don't have a company context by default
    if (['admin', 'developer'].includes(user.role)) {
      return Response.json({
        company: null,
        subscription: null,
        user,
        is_platform_user: true,
        message: 'Platform users do not have a company context'
      });
    }

    // Tenant users MUST have a company_id
    if (!user.company_id) {
      return Response.json({ 
        error: 'User not associated with any company. Please contact administrator.',
        user_email: user.email,
        user_role: user.role,
      }, { status: 404 });
    }

    // Load company using service role (tenant isolation handled by company_id)
    const company = await base44.asServiceRole.entities.Company.get(user.company_id);
    if (!company) {
      return Response.json({ 
        error: 'Company not found. The company_id may be invalid.',
        company_id: user.company_id,
      }, { status: 404 });
    }

    // Load subscription
    const subscriptions = await base44.asServiceRole.entities.CompanySubscription.filter({ 
      company_id: user.company_id,
      status: 'active'
    });
    const subscription = subscriptions[0] || null;

    return Response.json({
      company,
      subscription,
      user,
      is_platform_user: false,
    });
  } catch (error) {
    console.error('getCurrentCompany error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});