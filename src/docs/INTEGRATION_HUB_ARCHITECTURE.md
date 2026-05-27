# Codex OS - Integration Hub Architecture

## Overview

Codex OS Integration Hub provides a unified architecture for connecting with external services through OAuth, API keys, and webhooks.

---

## 1. Supported Integrations

### Communication & Calendar

| Integration | Type | Auth Method | Status |
|-------------|------|-------------|--------|
| Google Calendar | OAuth 2.0 | App Connector | Ready |
| Outlook Calendar | OAuth 2.0 | App Connector | Ready |
| Gmail | OAuth 2.0 | App Connector | Ready |
| WhatsApp Business | API Key | Backend Function | Ready |
| Microsoft Teams | OAuth 2.0 | App Connector | Ready |
| Slack | OAuth 2.0 | App Connector | Ready |

### Automation & Payments

| Integration | Type | Auth Method | Status |
|-------------|------|-------------|--------|
| Zapier | Webhook | API Key | Ready |
| Stripe | OAuth 2.0 | App Connector | Ready |
| QuickBooks | OAuth 2.0 | App Connector | Ready |
| Xero | OAuth 2.0 | App Connector | Ready |

### Storage & Files

| Integration | Type | Auth Method | Status |
|-------------|------|-------------|--------|
| Google Drive | OAuth 2.0 | App Connector | Ready |
| OneDrive | OAuth 2.0 | App Connector | Ready |
| Dropbox | OAuth 2.0 | App Connector | Ready |

---

## 2. Integration Architecture

### Integration Entity Structure

```json
{
  "company_id": "comp_123",
  "name": "Google Calendar",
  "slug": "google-calendar",
  "category": "Calendar",
  "provider": "Google",
  "status": "Active",
  "auth_type": "OAuth 2.0",
  "config": {
    "client_id": "...",
    "client_secret": "...",
    "scopes": ["calendar.readonly", "calendar.events"],
    "redirect_uri": "https://codex.com/callback"
  },
  "enabled_features": ["calendar_sync", "event_creation"],
  "last_sync": "2026-05-27T10:30:00Z",
  "sync_frequency": "Real-time",
  "webhook_url": "https://codex.com/api/webhooks/google-calendar",
  "error_message": null,
  "usage_count": 1250
}
```

### Authentication Methods

#### OAuth 2.0 Flow

1. User clicks "Connect" in Integration Hub
2. Redirect to provider's OAuth consent screen
3. User grants permissions
4. Callback with authorization code
5. Exchange code for access token + refresh token
6. Store tokens securely (encrypted)
7. Use access token for API calls
8. Auto-refresh tokens when expired

#### API Key Flow

1. User enters API key in Integration Hub
2. Validate key with provider
3. Store encrypted in database
4. Use key in API request headers

#### Webhook Flow

1. Generate unique webhook URL
2. Configure webhook in provider dashboard
3. Verify webhook signatures
4. Process incoming events

---

## 3. Integration Details

### Google Calendar

**Scopes Required:**
- `https://www.googleapis.com/auth/calendar.readonly`
- `https://www.googleapis.com/auth/calendar.events`

**Features:**
- Sync calendar events
- Create/update/delete events
- Real-time webhook notifications
- Multi-calendar support

**Webhook Events:**
- `events` - Calendar event changes

---

### Outlook Calendar

**Scopes Required:**
- `Calendars.Read`
- `Calendars.ReadWrite`

**Features:**
- Sync Outlook events
- Create meetings
- Room scheduling
- Teams meeting integration

**Webhook Events:**
- `created`, `updated`, `deleted`

---

### Gmail

**Scopes Required:**
- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/gmail.send`

**Features:**
- Read emails
- Send emails
- Email templates
- Attachment handling

**Webhook Events:**
- `mailbox` - New email received

---

### WhatsApp Business

**Auth Method:** API Key (Meta Developer)

**Features:**
- Send messages
- Receive messages
- Message templates
- Media attachments

**Webhook Events:**
- `messages` - Incoming messages
- `statuses` - Message delivery status

---

### Microsoft Teams

**Scopes Required:**
- `ChannelMessage.Send`
- `Channel.Read.Basic`

**Features:**
- Send channel messages
- Create teams
- File sharing
- Meeting scheduling

**Webhook Events:**
- `message`, `member_joined_channel`

---

### Slack

**Scopes Required:**
- `channels:read`, `channels:write`
- `chat:write`
- `files:write`

**Features:**
- Send messages to channels
- Create channels
- File uploads
- User mentions

**Webhook Events:**
- `message`, `reaction_added`, `file_shared`

---

### Zapier

**Auth Method:** Webhook + API Key

**Features:**
- Trigger Zapier zaps
- Receive zap actions
- Custom webhooks

**Integration Points:**
- Project created → Trigger zap
- Estimate accepted → Trigger zap
- Ticket created → Trigger zap

---

### Stripe

**Auth Method:** OAuth 2.0

**Scopes Required:**
- `read_write`

**Features:**
- Process payments
- Create invoices
- Subscription management
- Payment links

**Webhook Events:**
- `payment_intent.succeeded`
- `payment_intent.failed`
- `invoice.paid`
- `customer.created`

---

### QuickBooks

**Auth Method:** OAuth 2.0

**Scopes Required:**
- `com.intuit.quickbooks.accounting`

**Features:**
- Sync invoices
- Customer sync
- Payment tracking
- Financial reports

**Webhook Events:**
- `Invoice`, `Payment`, `Customer`

---

### Xero

**Auth Method:** OAuth 2.0

**Scopes Required:**
- `accounting.transactions`
- `accounting.contacts`

**Features:**
- Invoice sync
- Bank reconciliation
- Expense tracking
- Financial reports

**Webhook Events:**
- `Invoices`, `Payments`, `Contacts`

---

### Google Drive

**Auth Method:** OAuth 2.0

**Scopes Required:**
- `https://www.googleapis.com/auth/drive.file`

**Features:**
- File upload/download
- Folder management
- File sharing
- Real-time sync

**Webhook Events:**
- `changes`, `file`, `file.update`

---

### OneDrive

**Auth Method:** OAuth 2.0

**Scopes Required:**
- `Files.ReadWrite`

**Features:**
- File sync
- SharePoint integration
- Version history
- Sharing links

**Webhook Events:**
- `updated`

---

### Dropbox

**Auth Method:** OAuth 2.0

**Scopes Required:**
- `files.content.write`
- `files.content.read`

**Features:**
- File storage
- Folder sync
- File requests
- Sharing

**Webhook Events:**
- `file_operations`

---

## 4. Integration Categories

### Calendar
- Google Calendar
- Outlook Calendar

### Communication
- Gmail
- WhatsApp Business
- Microsoft Teams
- Slack

### Automation
- Zapier

### Payments & Accounting
- Stripe
- QuickBooks
- Xero

### Storage
- Google Drive
- OneDrive
- Dropbox

---

## 5. Integration Status Tracking

### Status Values

| Status | Description |
|--------|-------------|
| Not Connected | Integration not configured |
| Connecting | OAuth flow in progress |
| Active | Connected and syncing |
| Error | Authentication or sync error |
| Suspended | Temporarily disabled |

### Health Monitoring

Track integration health:
- Last successful sync
- Error count (last 24h)
- API rate limit usage
- Token expiry status
- Webhook delivery rate

### Alert Conditions

- Token expiring soon (< 24h)
- High error rate (> 10%)
- Rate limit exceeded
- Webhook failures (> 5 consecutive)

---

## 6. Data Sync Architecture

### Sync Patterns

#### Real-time (Webhooks)
- Calendar events
- Messages
- Payments

#### Scheduled (Polling)
- Financial data (hourly)
- File sync (every 15 min)
- Contact sync (daily)

#### Manual
- Initial setup
- Force refresh
- Error recovery

### Sync Conflict Resolution

**Last Write Wins:**
- Calendar events
- Messages

**Merge:**
- Contacts
- Files (version control)

**Manual Review:**
- Financial transactions
- Invoices

---

## 7. Security & Compliance

### Data Protection

- Encrypt all tokens at rest (AES-256)
- Use HTTPS for all API calls
- Implement token rotation
- Store minimal user data
- Regular security audits

### OAuth Security

- Validate redirect URIs
- Use PKCE for public clients
- Implement token refresh
- Handle token revocation
- Scope minimization

### Compliance

- GDPR data handling
- Data residency requirements
- User consent management
- Data export capabilities
- Right to deletion

---

## 8. Error Handling

### Error Categories

**Authentication Errors:**
- Token expired → Auto-refresh
- Token revoked → Re-authenticate
- Invalid credentials → User notification

**Rate Limit Errors:**
- Soft limit → Queue requests
- Hard limit → Backoff and retry
- Permanent limit → Upgrade plan

**Network Errors:**
- Timeout → Retry with backoff
- DNS failure → Alert admin
- SSL error → Block and alert

### Retry Strategy

```javascript
const retryPolicy = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 60000,    // 1 minute
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};
```

---

## 9. Testing Strategy

### Integration Testing

1. **Sandbox Mode**
   - Use provider sandbox environments
   - Test with mock data
   - Validate all flows

2. **End-to-End Testing**
   - Full OAuth flow
   - Webhook delivery
   - Error scenarios

3. **Load Testing**
   - Rate limit handling
   - Concurrent requests
   - Large data volumes

### Monitoring

- API response times
- Error rates by integration
- Sync success rates
- User adoption metrics

---

## 10. Implementation Roadmap

### Phase 1: Foundation ✅
- [x] Integration entity structure
- [x] OAuth architecture
- [x] Webhook infrastructure
- [x] Error handling framework

### Phase 2: Core Integrations (Next)
- [ ] Google Calendar
- [ ] Gmail
- [ ] Slack
- [ ] Stripe

### Phase 3: Business Integrations
- [ ] QuickBooks
- [ ] Xero
- [ ] Zapier

### Phase 4: Extended Integrations
- [ ] Outlook
- [ ] Teams
- [ ] WhatsApp
- [ ] Google Drive
- [ ] OneDrive
- [ ] Dropbox

---

## 11. API Design

### Integration Management API

```
GET    /api/v1/integrations           - List all integrations
POST   /api/v1/integrations           - Create integration
GET    /api/v1/integrations/:id       - Get integration details
PUT    /api/v1/integrations/:id       - Update integration
DELETE /api/v1/integrations/:id       - Delete integration
POST   /api/v1/integrations/:id/connect - Start OAuth flow
POST   /api/v1/integrations/:id/disconnect - Disconnect
POST   /api/v1/integrations/:id/sync  - Trigger manual sync
GET    /api/v1/integrations/:id/logs  - Get sync logs
```

### OAuth Callback

```
GET /api/v1/integrations/:provider/callback?code=...&state=...
```

### Webhook Endpoints

```
POST /api/v1/webhooks/inbound/:integration_id
```

---

## 12. Configuration Management

### Environment Variables

```bash
# Google
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Microsoft
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...

# Slack
SLACK_CLIENT_ID=...
SLACK_CLIENT_SECRET=...

# Stripe
STRIPE_CLIENT_ID=...

# QuickBooks
QUICKBOOKS_CLIENT_ID=...
QUICKBOOKS_CLIENT_SECRET=...

# Xero
XERO_CLIENT_ID=...
XERO_CLIENT_SECRET=...

# Dropbox
DROPBOX_CLIENT_ID=...
DROPBOX_CLIENT_SECRET=...
```

### Integration Config Storage

```json
{
  "integration_id": "int_123",
  "company_id": "comp_456",
  "provider": "google-calendar",
  "config": {
    "access_token": "encrypted:...[AES-256]...",
    "refresh_token": "encrypted:...[AES-256]...",
    "token_expiry": "2026-05-27T12:00:00Z",
    "scopes": ["calendar.readonly"],
    "calendar_ids": ["primary", "cal_abc123"]
  },
  "metadata": {
    "connected_by": "user@codex.com",
    "connected_at": "2026-05-27T10:00:00Z",
    "last_sync": "2026-05-27T10:30:00Z"
  }
}
```

---

**Version**: 1.0.0  
**Status**: Architecture Ready (Implementation Pending)  
**Last Updated**: 2026-05-27