import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Service role for scheduled automation (no user context)
    const companyRes = await base44.asServiceRole.functions.invoke('getCurrentCompany', {});
    const companyId = companyRes.data?.company?.id;
    
    if (!companyId) {
      return Response.json({ error: 'No company found' }, { status: 400 });
    }

    // Get all properties for this company
    const properties = await base44.asServiceRole.entities.Property.filter({ company_id: companyId });
    
    let insightsGenerated = 0;
    let errors = 0;

    // Generate insights for each property
    for (const property of properties) {
      try {
        const result = await base44.asServiceRole.functions.invoke('generatePredictiveInsights', {
          property_id: property.id,
        });
        
        insightsGenerated += result.data?.predictions_count || 0;
      } catch (error) {
        console.error(`Error generating insights for property ${property.id}:`, error);
        errors++;
      }
    }

    return Response.json({
      success: true,
      properties_processed: properties.length,
      insights_generated: insightsGenerated,
      errors,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});