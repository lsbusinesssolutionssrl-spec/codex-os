# Codex OS - API-First Architecture

## Overview

Codex OS is built on an API-first architecture, enabling seamless integrations, extensions, and ecosystem services.

---

## 1. API Routes (Prepared)

### Core Entity Endpoints (v1)

```
Base URL: /api/v1

Authentication:
POST /api/v1/auth/validate          - Validate API key
POST /api/v1/auth/rate-limit        - Check rate limit

Entities:
GET    /api/v1/clients              - List clients
POST   /api/v1/clients              - Create client
GET    /api/v1/clients/:id          - Get client
PUT    /api/v1/clients/:id          - Update client
DELETE /api/v1/clients/:id          - Delete client

GET    /api/v1/properties           - List properties
POST   /api/v1/properties           - Create property
GET    /api/v1/properties/:id       - Get property
PUT    /api/v1/properties/:id       - Update property
DELETE /api/v1/properties/:id       - Delete property

GET    /api/v1/estimates            - List estimates
POST   /api/v1/estimates            - Create estimate
GET    /api/v1/estimates/:id        - Get estimate
PUT    /api/v1/estimates/:id        - Update estimate
DELETE /api/v1/estimates/:id        - Delete estimate
POST   /api/v1/estimates/:id/accept - Accept estimate
POST   /api/v1/estimates/:id/reject - Reject estimate

GET    /api/v1/projects             - List projects
POST   /api/v1/projects             - Create project
GET    /api/v1/projects/:id         - Get project
PUT    /api/v1/projects/:id         - Update project
DELETE /api/v1/projects/:id         - Delete project
GET    /api/v1/projects/:id/financial - Get financials

GET    /api/v1/guardian             - List guardian subscriptions
POST   /api/v1/guardian             - Create subscription
GET    /api/v1/guardian/:id         - Get subscription
PUT    /api/v1/guardian/:id                   - Update subscription

GET    /api/v1/tickets              - List tickets
POST   /api/v1/tickets              - Create ticket
GET    /api/v1/tickets/:id          - Get ticket
PUT    /api/v1/tickets/:id          - Update ticket

GET    /api/v1/documents            - List documents
POST   /api/v1/documents            - Upload document
GET    /api/v1/documents/:id        - Get document
DELETE /api/v1/documents/:id        - Delete document

GET    /api/v1/workflows            - List workflows
POST   /api/v1/workflows            - Create workflow
POST   /api/v1/workflows/:id/execute - Execute workflow

GET    /api/v1/ai/query             - Query AI
POST   /api/v1/ai/suggest           - Get AI suggestions
```

---

## 2. Authentication

### API Key Authentication

```javascript
// Request headers
Authorization: Bearer sk_PROD123...

// Response on success
{
  "valid": true,
  "company_id": "comp_123",
  "permissions": ["read", "write"],
  "rate_limit": 200,
  "type": "Read-Write"
}

// Response on failure
{
  "valid": false,
  "error": "Invalid API key"
}
```

### API Key Types

| Type | Permissions | Rate Limit | Use Case |
|------|-------------|------------|----------|
| Read-Only | GET only | 100 req/min | Data sync, reporting |
| Read-Write | GET, POST, PUT, DELETE | 200 req/min | Full integration |
| Admin | All + user management | 500 req/min | Admin tools |
| Webhook | Webhook operations | 1000 req/min | Webhook endpoints |

---

## 3. Rate Limiting

### Limits by API Key Type

```
Read-Only:  100 requests/minute
Read-Write: 200 requests/minute
Admin:      500 requests/minute
Webhook:    1000 requests/minute
```

### Rate Limit Response Headers

```
X-RateLimit-Limit: 200
X-RateLimit-Remaining: 195
X-RateLimit-Reset: 1625140800
```

### Rate Limit Exceeded

```json
{
  "error": "Rate limit exceeded",
  "retry_after": 45
}
```

---

## 4. Permissions

### Permission Model

Each API key has granular permissions:

```json
{
  "permissions": [
    "entities:Client:read",
    "entities:Client:write",
    "entities:Project:read",
    "functions:generateReport",
    "webhooks:subscribe"
  ]
}
```

### Permission Format

```
<resource>:<action>

Resources:
- entities:<EntityName>
- functions:<FunctionName>
- webhooks:<action>
- integrations:<action>

Actions:
- read
- write
- delete
- execute
- subscribe
```

---

## 5. Tenant Isolation

### Company ID Scoping

All queries are automatically scoped by `company_id`:

```javascript
// Backend function example
const user = await base44.auth.me();
const company_id = user.company_id;

// All entity queries filtered by company_id
const projects = await base44.entities.Project.filter({
  company_id: company_id
});
```

### Cross-Tenant Access Prevention

- Database-level filtering on `company_id`
- API keys bound to specific company
- No cross-tenant queries allowed
- Audit logs track tenant context

---

## 6. Audit Logs

### Tracked Actions

All API operations are logged:

```json
{
  "company_id": "comp_123",
  "action": "api.entity.create",
  "entity_type": "Project",
  "entity_id": "proj_456",
  "details": {
    "api_key_id": "key_789",
    "ip_address": "192.168.1.1",
    "endpoint": "/api/v1/projects",
    "method": "POST",
    "timestamp": "2026-05-27T10:30:00Z"
  },
  "created_by": "api:sk_PROD123",
  "created_date": "2026-05-27T10:30:00Z"
}
```

### Audit Log Entity Fields

```json
{
  "company_id": "string",
  "action": "string",
  "entity_type": "string",
  "entity_id": "string",
  "details": "object",
  "created_by": "string",
  "created_date": "datetime"
}
```

### Audit Export

Audit logs can be exported for compliance:
- CSV export
- JSON export
- Date range filtering
- Action type filtering

---

## 7. API Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-05-27T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "INVALID_API_KEY",
    "message": "The provided API key is invalid",
    "details": { ... }
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| INVALID_API_KEY | 401 | API key not found |
| API_KEY_EXPIRED | 401 | API key has expired |
| IP_NOT_WHITELISTED | 403 | IP address not allowed |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| PERMISSION_DENIED | 403 | Insufficient permissions |
| TENANT_MISMATCH | 403 | Cross-tenant access attempt |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid request data |
| INTERNAL_ERROR | 500 | Server error |

---

## 8. API Versioning

### Version Strategy

- URL versioning: `/api/v1/...`
- Backward compatible changes allowed within major version
- Breaking changes require new major version
- Deprecation notices 6 months in advance

### Current Version

```
v1.0.0 - Initial release (2026-05-27)
```

---

## 9. Implementation Status

### ✅ Ready (Placeholders)

- [x] API key authentication
- [x] Rate limiting structure
- [x] Permission model
- [x] Tenant isolation
- [x] Audit logging
- [x] Error handling
- [x] Response format

### 🔄 Next Steps

- [ ] Implement actual API route handlers
- [ ] Add request validation
- [ ] Implement rate limit tracking (Redis)
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Create SDK libraries
- [ ] Set up API analytics

---

## 10. Security Best Practices

### API Key Management

- Store keys hashed (SHA-256)
- Never expose full keys in responses
- Show only prefix (e.g., `sk_PROD123...`)
- Rotate keys regularly
- Revoke compromised keys immediately

### HTTPS Only

- All API calls must use HTTPS
- Redirect HTTP to HTTPS
- TLS 1.3 recommended

### Input Validation

- Validate all request parameters
- Sanitize inputs
- Use JSON schema validation
- Limit payload size (10MB max)

### Output Filtering

- Filter sensitive fields from responses
- Respect field
- Never expose internal IDs unnecessarily

---

## 11. Example Usage

### cURL Example

```bash
# List projects
curl -X GET https://api.codex.com/api/v1/projects \
  -H "Authorization: Bearer sk_PROD123..." \
  -H "Content-Type: application/json"

# Create project
curl -X POST https://api.codex.com/api/v1/projects \
  -H "Authorization: Bearer sk_PROD123..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Bathroom Renovation",
    "client_id": "client_456",
    "property_id": "prop_789"
  }'
```

### JavaScript Example

```javascript
const response = await fetch('https://api.codex.com/api/v1/projects', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer sk_PROD123...',
    'Content-Type': 'application/json',
  },
});

const data = await response.json();
console.log(data);
```

### Python Example

```python
import requests

headers = {
    'Authorization': 'Bearer sk_PROD123...',
    'Content-Type': 'application/json',
}

response = requests.get(
    'https://api.codex.com/api/v1/projects',
    headers=headers
)

projects = response.json()
print(projects)
```

---

## 12. Monitoring & Analytics

### Tracked Metrics

- Total API calls
- Success/failure rate
- Latency (p50, p95, p99)
- Rate limit hits
- Most used endpoints
- Error distribution
- API key usage

### Dashboard Metrics

Real-time monitoring of:
- Requests per second
- Average response time
- Error rate
- Active API keys
- Top consumers

---

**Version**: 1.0.0  
**Status**: Architecture Ready (Implementation Pending)  
**Last Updated**: 2026-05-27