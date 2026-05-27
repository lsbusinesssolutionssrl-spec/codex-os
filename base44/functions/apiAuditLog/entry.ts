import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * API Audit Log Automation
 * Logs all API access for compliance and security monitoring
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    // Extract relevant info based on event type
    const auditEntry = {
      company_id: data.company_id,
      action: `api.${event.type}`,
      entity_type: event.entity_name,
      entity_id: event.entity_id,
      details: {
        event_type: event.type,
        timestamp: new Date().toISOString(),
      },
      created_by: data.created_by || 'system',
    };

    // Create audit log entry
    await base44.entities.AuditLog.create(auditEntry);

    return Response.json({ 
      success: true,
      logged: true 
    });
  } catch (error) {
    console.error('Audit log error:', error);
    // Don't fail the main operation if audit logging fails
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});