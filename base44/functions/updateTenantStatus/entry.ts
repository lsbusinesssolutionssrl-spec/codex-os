import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { companyId, status, onboardingStep } = payload;

    if (!companyId) {
      return Response.json({ error: 'Missing companyId' }, { status: 400 });
    }

    // Update Company entity
    const updates = {};
    
    if (status) {
      updates.status = status;
    }

    // Update Company
    const company = await base44.entities.Company.update(companyId, updates);

    return Response.json({
      success: true,
      company,
      message: `Company ${companyId} updated successfully`,
    });
  } catch (error) {
    console.error('Error updating tenant status:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});