import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Trigger outbound webhooks for specific events
 * Called by entity automations when events occur
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event_type, entity_type, entity_id, data, company_id } = await req.json();

    if (!event_type || !company_id) {
      return Response.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Find active webhook subscriptions for this event
    const webhooks = await base44.entities.WebhookSubscription.filter({
      company_id: company_id,
      status: 'Active'
    });

    const matchingWebhooks = webhooks.filter(w => 
      w.events && w.events.includes(event_type)
    );

    if (matchingWebhooks.length === 0) {
      return Response.json({ 
        success: true, 
        triggered: 0,
        message: 'No webhooks subscribed to this event' 
      });
    }

    // Trigger each matching webhook
    const results = await Promise.allSettled(
      matchingWebhooks.map(async (webhook) => {
        const payload = {
          event: {
            type: event_type,
            entity_type: entity_type,
            entity_id: entity_id,
            timestamp: new Date().toISOString(),
          },
          data: data,
          company_id: company_id,
        };

        // Build headers
        const headers = {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': await generateSignature(payload, webhook.secret_key),
          'X-Webhook-Event': event_type,
          'X-Company-ID': company_id,
        };

        // Add custom headers if configured
        if (webhook.headers) {
          Object.assign(headers, webhook.headers);
        }

        // Send webhook
        const response = await fetch(webhook.endpoint_url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        const success = response.ok;
        
        // Update webhook stats
        const updates = {
          last_triggered: new Date().toISOString(),
          success_count: webhook.success_count + (success ? 1 : 0),
          failure_count: webhook.failure_count + (success ? 0 : 1),
        };

        if (!success) {
          const errorText = await response.text().catch(() => 'Unknown error');
          updates.last_error = `Status ${response.status}: ${errorText}`;
        }

        await base44.entities.WebhookSubscription.update(webhook.id, updates);

        return {
          webhook_id: webhook.id,
          success,
          status: response.status,
        };
      })
    );

    const successes = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failures = results.filter(r => r.status === 'rejected' || !r.value.success).length;

    // Create platform event for tracking
    await base44.entities.PlatformEvent.create({
      company_id: company_id,
      event_type: 'webhook.triggered',
      source: 'webhook_system',
      source_id: entity_id,
      payload: {
        event_type,
        entity_type,
        webhooks_triggered: matchingWebhooks.length,
        successes,
        failures,
      },
      severity: failures > 0 ? 'Warning' : 'Info',
      processed: true,
      processed_at: new Date().toISOString(),
      subscribers_notified: successes,
    });

    return Response.json({
      success: true,
      triggered: matchingWebhooks.length,
      successes,
      failures,
      results: results.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason }),
    });
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});

async function generateSignature(payload, secret) {
  // Simple HMAC-SHA256 signature (placeholder - would need crypto implementation)
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(JSON.stringify(payload));
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}