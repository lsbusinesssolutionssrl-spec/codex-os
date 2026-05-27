import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Handle inbound webhooks from external services
 * Placeholder for receiving webhooks from integrations
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get webhook ID from URL path
    const url = new URL(req.url);
    const webhookId = url.pathname.split('/').pop();

    if (!webhookId) {
      return Response.json({ 
        error: 'Webhook ID required' 
      }, { status: 400 });
    }

    // Find the webhook configuration
    const webhook = await base44.entities.WebhookSubscription.get(webhookId);
    
    if (!webhook) {
      return Response.json({ 
        error: 'Webhook not found' 
      }, { status: 404 });
    }

    // Verify signature (if secret key configured)
    if (webhook.secret_key) {
      const signature = req.headers.get('X-Webhook-Signature');
      const body = await req.text();
      
      const isValid = await verifySignature(body, signature, webhook.secret_key);
      
      if (!isValid) {
        return Response.json({ 
          error: 'Invalid signature' 
        }, { status: 401 });
      }
    }

    // Parse incoming payload
    const payload = await req.json().catch(() => ({}));

    // Log the inbound webhook
    await base44.entities.AuditLog.create({
      company_id: webhook.company_id,
      action: 'webhook.inbound',
      entity_type: 'WebhookSubscription',
      entity_id: webhook.id,
      details: {
        source: 'inbound',
        event_type: payload.type || 'unknown',
        headers: Object.fromEntries(req.headers),
        timestamp: new Date().toISOString(),
      },
      created_by: 'webhook:inbound',
    });

    // Process based on event type (placeholder for custom logic)
    const eventType = payload.type || payload.event_type || 'unknown';
    
    // Route to appropriate handler based on event type
    await processInboundEvent(base44, webhook, eventType, payload);

    return Response.json({
      success: true,
      processed: true,
      event_type: eventType,
    });
  } catch (error) {
    console.error('Inbound webhook error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});

async function verifySignature(body, signature, secret) {
  // Placeholder signature verification
  // In production, implement proper HMAC verification
  if (!signature) return false;
  
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(body);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const expectedSignature = await crypto.subtle.sign('HMAC', key, messageData);
  const expectedHex = Array.from(new Uint8Array(expectedSignature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return signature === expectedHex;
}

async function processInboundEvent(base44, webhook, eventType, payload) {
  // Placeholder for event-specific processing
  // This would route to different handlers based on event type
  
  const eventHandlers = {
    // Payment events (e.g., Stripe)
    'payment.completed': handlePaymentEvent,
    'payment.failed': handlePaymentEvent,
    
    // Calendar events (e.g., Google Calendar)
    'calendar.event.created': handleCalendarEvent,
    'calendar.event.updated': handleCalendarEvent,
    
    // Communication events (e.g., Slack, WhatsApp)
    'message.received': handleCommunicationEvent,
    
    // CRM events (e.g., HubSpot, Salesforce)
    'contact.created': handleCRMEvent,
    'contact.updated': handleCRMEvent,
    
    // Default handler
    'default': handleGenericEvent,
  };

  const handler = eventHandlers[eventType] || eventHandlers['default'];
  await handler(base44, webhook, payload);
}

async function handlePaymentEvent(base44, webhook, payload) {
  // Placeholder for payment processing
  console.log('Payment event:', payload);
}

async function handleCalendarEvent(base44, webhook, payload) {
  // Placeholder for calendar event processing
  console.log('Calendar event:', payload);
}

async function handleCommunicationEvent(base44, webhook, payload) {
  // Placeholder for communication event processing
  console.log('Communication event:', payload);
}

async function handleCRMEvent(base44, webhook, payload) {
  // Placeholder for CRM event processing
  console.log('CRM event:', payload);
}

async function handleGenericEvent(base44, webhook, payload) {
  // Generic event handler - create platform event
  await base44.entities.PlatformEvent.create({
    company_id: webhook.company_id,
    event_type: 'webhook.inbound',
    source: webhook.name,
    source_id: webhook.id,
    payload: payload,
    severity: 'Info',
    processed: false,
  });
}