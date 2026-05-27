import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Platform users (admin/developer) - check if they have a primary tenant membership
    let companyId = user.company_id;
    
    if (!companyId && ['admin', 'developer'].includes(user.role)) {
      // Check for primary tenant membership
      const memberships = await base44.asServiceRole.entities.TenantMembership.filter({
        user_id: user.id,
        is_primary: true,
        status: 'active'
      });
      
      if (memberships.length > 0) {
        companyId = memberships[0].tenant_id;
        console.log('Platform user using primary membership company_id:', companyId);
      }
    }

    // If still no company_id, check for any active membership
    if (!companyId) {
      const memberships = await base44.asServiceRole.entities.TenantMembership.filter({
        user_id: user.id,
        status: 'active'
      });
      
      if (memberships.length > 0) {
        companyId = memberships[0].tenant_id;
        console.log('Using first active membership company_id:', companyId);
      }
    }

    // No company association found
    if (!companyId) {
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