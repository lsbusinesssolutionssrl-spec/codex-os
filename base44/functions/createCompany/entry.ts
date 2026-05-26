import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      name, 
      slug, 
      email, 
      tax_id, 
      address, 
      phone, 
      website, 
      industry,
      brand_color_primary = '#1147FF',
      brand_color_secondary = '#0B2341',
      plan_id = 'default'
    } = await req.json();

    // Validate required fields
    if (!name || !slug || !email) {
      return Response.json({ 
        error: 'Missing required fields: name, slug, email' 
      }, { status: 400 });
    }

    // Check slug uniqueness
    const existing = await base44.entities.Company.filter({ slug });
    if (existing.length > 0) {
      return Response.json({ 
        error: 'Company slug already exists' 
      }, { status: 409 });
    }

    // Create company
    const company = await base44.entities.Company.create({
      name,
      slug,
      email,
      tax_id: tax_id || null,
      address: address || null,
      phone: phone || null,
      website: website || null,
      industry: industry || null,
      brand_color_primary,
      brand_color_secondary,
      settings: {
        currency: 'EUR',
        language: 'it',
        timezone: 'Europe/Rome',
        date_format: 'DD/MM/YYYY',
        fiscal_year_start: '01/01'
      },
      status: 'active',
      created_date: new Date().toISOString()
    });

    // Create subscription (trial by default)
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14); // 14-day trial

    const subscription = await base44.entities.CompanySubscription.create({
      company_id: company.id,
      plan_id,
      status: 'trial',
      billing_cycle: 'monthly',
      trial_start: new Date().toISOString(),
      trial_end: trialEnd.toISOString(),
      current_period_start: new Date().toISOString(),
      current_period_end: trialEnd.toISOString(),
      seats_used: 1,
      storage_used_gb: 0
    });

    // Update user with company_id and company_admin role
    await base44.entities.User.update(user.id, {
      company_id: company.id,
      role: 'company_admin'
    });

    // Log initial usage
    await base44.entities.UsageLog.create({
      company_id: company.id,
      resource_type: 'user',
      resource_id: user.id,
      action: 'create',
      quantity: 1,
      timestamp: new Date().toISOString(),
      user_email: user.email
    });

    return Response.json({
      success: true,
      company,
      subscription,
      message: 'Company created successfully with 14-day trial'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});