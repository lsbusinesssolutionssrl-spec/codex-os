import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Allow all users to validate (called from frontend before save)
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entity_name, data } = await req.json();

    if (!entity_name || !data) {
      return Response.json({ 
        error: 'Missing entity_name or data' 
      }, { status: 400 });
    }

    // Get user's company_id
    const users = await base44.entities.User.filter({ email: user.email });
    const company_id = users[0]?.company_id;

    // Platform users can save without company_id (templates)
    if (user.role === 'admin' || user.role === 'developer') {
      const isTemplate = data.is_template === true;
      const hasCompany = !!data.company_id;
      
      // If no company_id, must be marked as template
      if (!hasCompany && !isTemplate) {
        return Response.json({
          valid: false,
          error: 'Platform data must be marked as is_template=true',
          suggestion: 'Set is_template: true or provide company_id'
        });
      }
      
      return Response.json({ valid: true });
    }

    // Tenant users MUST have company_id
    if (!company_id) {
      return Response.json({
        valid: false,
        error: 'User must belong to a company',
        critical: true
      });
    }

    // Check if data has company_id
    if (!data.company_id) {
      return Response.json({
        valid: false,
        error: 'company_id is required',
        auto_fix: { company_id },
        critical: true
      });
    }

    // Verify company_id matches user's company
    if (data.company_id !== company_id) {
      return Response.json({
        valid: false,
        error: 'Cannot save data to another tenant',
        expected_company_id: company_id,
        critical: true
      });
    }

    // All checks passed
    return Response.json({
      valid: true,
      company_id,
      message: 'Tenant validation passed'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});