# Codex OS - Webhook System

## Overview

Codex OS provides a comprehensive webhook system for real-time event notifications and external integrations.

---

## 1. Supported Events

### Entity Events

| Event | Trigger | Payload |
|-------|---------|---------|
| `estimate.accepted` | Estimate status → Accepted | Estimate data, client info, property details |
| `estimate.rejected` | Estimate status → Rejected | Estimate data, rejection reason |
| `estimate.created` | New estimate created | Estimate data |
| `project.created` | New project created | Project data, estimate reference |
| `project.delivered` | Project status → Delivered | Project data, completion details |
| `project.approved` | Project status → Approved | Project data |
| `project.started` | Project status → In Progress | Project data, team assignments |
| `ticket.created` | New ticket created | Ticket data, priority, issue type |
| `ticket.closed` | Ticket status → Closed | Ticket data, resolution notes |
| `ticket.resolved` | Ticket status → Resolved | Ticket data |
| `ticket.urgent` | Ticket priority → Urgent | Ticket data, escalation info |
| `guardian.created` | New guardian subscription | Subscription data, property info |
| `guardian.renewed` | Guardian subscription renewed | Subscription data, renewal terms |
| `guardian.expiring` | Guardian subscription expiring | Subscription data, expiry date |
| `guardian.cancelled` | Guardian subscription cancelled | Subscription data, cancellation reason |
| `workflow.executed` | Workflow execution completed | Execution data, steps completed |
| `workflow.failed` | Workflow execution failed | Execution data, error details |
| `maintenance.due` | Maintenance schedule due | Schedule data, property info |
| `maintenance.completed` | Maintenance completed | Schedule data, completion notes |

### System Events

| Event | Trigger |
|-------|---------|
| `user.login` | User logs in |
| `user.logout` | User logs out |
| `api.key_used` | API key used |
| `integration.synced` | Integration sync completed |
| `integration.failed` | Integration sync failed |
| `extension.installed` | Extension installed |
| `extension.updated` | Extension updated |

---

## 2. Outbound Webhooks

### Configuration

Webhooks are configured via the `WebhookSubscription` entity:

```json
{
  "name": "Project Notifications",
  "endpoint_url": "https://example.com/webhooks/codex",
  "events": ["project.created", "project.delivered"],
  "status": "Active",
  "secret_key": "whsec_...",
  "headers": {
    "X-Custom-Header": "value"
  },
  "retry_policy": {
    "max_retries": 3,
    "retry_delay_seconds": 60,
    "exponential_backoff": true
  }
}
```

### Webhook Payload Format

```json
{
  "event": {
    "type": "project.created",
    "entity_type": "Project",
    "entity_id": "proj_123",
    "timestamp": "2026-05-27T10:30:00Z"
  },
  "data": {
    "id": "proj_123",
    "title": "Bathroom Renovation",
    "client_id": "client_456",
    "status": "Lead",
    ...
  },
  "company_id": "comp_789"
}
```

### Security Headers

```
X-Webhook-Signature: sha256=abc123...
X-Webhook-Event: project.created
X-Company-ID: comp_789
```

### Signature Verification

All outbound webhooks are signed using HMAC-SHA256:

```javascript
// Node.js example
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

### Retry Policy

Failed webhooks are retried with exponential backoff:

| Attempt | Delay |
|---------|-------|
| 1 | 60 seconds |
| 2 | 120 seconds |
| 3 | 240 seconds |

After 3 failures, the webhook is marked as `Error` and requires manual intervention.

---

## 3. Inbound Webhooks

### Setup

Inbound webhooks allow external services to send events to Codex:

```
POST /api/v1/webhooks/inbound/:webhook_id
```

### Configuration

Create a `WebhookSubscription` with inbound enabled:

```json
{
  "name": "Stripe Payments",
  "endpoint_url": "https://codex.com/api/v1/webhooks/inbound/wh_123",
  "events": ["payment.completed", "payment.failed"],
  "status": "Active",
  "secret_key": "whsec_inbound_...",
  "is_inbound": true
}
```

### Supported Inbound Events

#### Payment Events (Stripe, PayPal)

```json
{
  "type": "payment.completed",
  "data": {
    "amount": 5000,
    "currency": "EUR",
    "customer_id": "cust_123",
    "invoice_id": "inv_456"
  }
}
```

#### Calendar Events (Google Calendar, Outlook)

```json
{
  "type": "calendar.event.created",
  "data": {
    "event_id": "evt_123",
    "title": "Site Survey",
    "start_time": "2026-05-28T09:00:00Z",
    "end_time": "2026-05-28T10:00:00Z",
    "attendees": ["tech@codex.com"]
  }
}
```

#### Communication Events (Slack, WhatsApp)

```json
{
  "type": "message.received",
  "data": {
    "channel": "#support",
    "user": "user_123",
    "message": "I need help with...",
    "timestamp": "2026-05-27T10:30:00Z"
  }
}
```

#### CRM Events (HubSpot, Salesforce)

```json
{
  "type": "contact.created",
  "data": {
    "contact_id": "cont_123",
    "name": "John Doe",
    "email": "john@example.com",
    "company": "Example Inc"
  }
}
```

---

## 4. Webhook Management

### Create Webhook Subscription

```bash
curl -X POST https://api.codex.com/api/v1/webhooks \
  -H "Authorization: Bearer sk_PROD..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Project Updates",
    "endpoint_url": "https://example.com/webhook",
    "events": ["project.created", "project.delivered"],
    "secret_key": "whsec_..."
  }'
```

### List Webhooks

```bash
curl -X GET https://api.codex.com/api/v1/webhooks \
  -H "Authorization: Bearer sk_PROD..."
```

### Update Webhook

```bash
curl -X PUT https://api.codex.com/api/v1/webhooks/:id \
  -H "Authorization: Bearer sk_PROD..." \
  -d '{
    "status": "Inactive"
  }'
```

### Delete Webhook

```bash
curl -X DELETE https://api.codex.com/api/v1/webhooks/:id \
  -H "Authorization: Bearer sk_PROD..."
```

### Test Webhook

```bash
curl -X POST https://api.codex.com/api/v1/webhooks/:id/test \
  -H "Authorization: Bearer sk_PROD..."
```

---

## 5. Monitoring & Debugging

### Webhook Logs

Each webhook delivery is logged:

```json
{
  "webhook_id": "wh_123",
  "event_type": "project.created",
  "timestamp": "2026-05-27T10:30:00Z",
  "status": "success",
  "response_code": 200,
  "response_time_ms": 245,
  "attempt": 1
}
```

### Webhook Statistics

Track success/failure rates:

- `success_count`: Total successful deliveries
- `failure_count`: Total failed deliveries
- `last_triggered`: Last delivery attempt
- `last_error`: Last error message

### Debug Mode

Enable debug mode for detailed logging:

```json
{
  "id": "wh_123",
  "debug_mode": true
}
```

Debug logs include:
- Full request headers
- Request body
- Response headers
- Response body
- Timing information

---

## 6. Event Filtering

### Advanced Filtering

Filter events based on conditions:

```json
{
  "name": "High-Value Projects",
  "endpoint_url": "https://example.com/webhook",
  "events": ["project.created"],
  "filter_conditions": [
    {
      "field": "data.contract_value",
      "operator": "gte",
      "value": 50000
    }
  ]
}
```

### Supported Operators

- `equals`
- `not_equals`
- `gt` (greater than)
- `gte` (greater than or equal)
- `lt` (less than)
- `lte` (less than or equal)
- `contains`
- `in_list`

---

## 7. Implementation Status

### ✅ Ready

- [x] Outbound webhook trigger function
- [x] Inbound webhook handler
- [x] Signature generation & verification
- [x] Event type mapping
- [x] Retry policy structure
- [x] Audit logging
- [x] Error handling

### 🔄 Next Steps

- [ ] Create entity automations for each entity
- [ ] Implement webhook dashboard UI
- [ ] Add webhook testing tool
- [ ] Create webhook delivery queue (Redis)
- [ ] Add webhook analytics
- [ ] Implement dead letter queue for failed webhooks

---

## 8. Example Use Cases

### Use Case 1: Notify Slack on Project Delivery

```json
{
  "name": "Slack Project Notifications",
  "endpoint_url": "https://hooks.slack.com/services/XXX/YYY/ZZZ",
  "events": ["project.delivered", "project.created"],
  "headers": {
    "Content-Type": "application/json"
  }
}
```

### Use Case 2: Sync Projects to External CRM

```json
{
  "name": "CRM Sync",
  "endpoint_url": "https://crm.example.com/api/webhooks/codex",
  "events": [
    "project.created",
    "project.updated",
    "client.created",
    "estimate.accepted"
  ],
  "secret_key": "whsec_crm_sync_..."
}
```

### Use Case 3: Payment Processing via Stripe

```json
{
  "name": "Stripe Payments",
  "endpoint_url": "https://codex.com/api/v1/webhooks/inbound/wh_stripe",
  "events": ["payment.completed", "payment.failed"],
  "is_inbound": true,
  "secret_key": "whsec_stripe_..."
}
```

### Use Case 4: Automated Reporting

```json
{
  "name": "BI Dashboard Updates",
  "endpoint_url": "https://bi.example.com/webhooks/codex",
  "events": [
    "project.created",
    "project.delivered",
    "estimate.accepted",
    "ticket.closed"
  ],
  "headers": {
    "X-API-Key": "bi_api_key"
  }
}
```

---

## 9. Security Best Practices

### Outbound Webhooks

- Always use HTTPS endpoints
- Sign all payloads with HMAC-SHA256
- Include unique event IDs for idempotency
- Rotate secret keys regularly
- Monitor for failed deliveries

### Inbound Webhooks

- Verify signatures on all incoming requests
- Validate payload structure
- Implement rate limiting per webhook
- Use IP whitelisting for known senders
- Log all inbound events for audit

### General

- Never expose secret keys in client-side code
- Use environment variables for secrets
- Implement replay attack protection (timestamp validation)
- Monitor webhook delivery patterns for anomalies

---

## 10. Troubleshooting

### Common Issues

**Webhook not triggering:**
- Check webhook status is `Active`
- Verify event type matches subscription
- Check company_id scoping

**Signature verification failing:**
- Ensure secret key matches on both sides
- Check payload encoding (UTF-8)
- Verify signature algorithm (HMAC-SHA256)

**High failure rate:**
- Check endpoint availability
- Review timeout settings (default: 30s)
- Verify SSL certificate validity
- Check firewall rules

### Debug Checklist

1. ✅ Webhook status is `Active`
2. ✅ Event type is subscribed
3. ✅ Endpoint URL is reachable
4. ✅ SSL certificate is valid
5. ✅ Secret key matches
6. ✅ No firewall blocking
7. ✅ Timeout is sufficient
8. ✅ Payload size is within limits

---

**Version**: 1.0.0  
**Status**: Architecture Ready (Implementation Pending)  
**Last Updated**: 2026-05-27