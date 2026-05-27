# Codex OS - Platform Observability Architecture

## Overview

Comprehensive observability system for monitoring platform health, performance, and usage across all modules and tenants.

---

## 1. Observability Pillars

### 1.1 Metrics
Quantitative measurements of system behavior over time.

### 1.2 Logs
Timestamped records of discrete events.

### 1.3 Traces
End-to-end request journey across services.

---

## 2. UsageLog Entity (Extended)

```json
{
  "name": "UsageLog",
  "type": "object",
  "properties": {
    "company_id": { "type": "string" },
    "brand_id": { "type": "string" },
    "log_type": {
      "type": "string",
      "enum": [
        "api_call",
        "integration_call",
        "extension_usage",
        "webhook_delivery",
        "workflow_execution",
        "ai_request",
        "entity_operation",
        "file_upload",
        "user_action"
      ]
    },
    "source": { "type": "string" },
    "source_id": { "type": "string" },
    "action": { "type": "string" },
    "status": {
      "type": "string",
      "enum": ["success", "error", "timeout", "rate_limited"]
    },
    "duration_ms": { "type": "number" },
    "metadata": {
      "type": "object",
      "properties": {
        "endpoint": { "type": "string" },
        "method": { "type": "string" },
        "status_code": { "type": "number" },
        "error_message": { "type": "string" },
        "retry_count": { "type": "number" },
        "user_email": { "type": "string" },
        "ip_address": { "type": "string" },
        "user_agent": { "type": "string" },
        "request_size_bytes": { "type": "number" },
        "response_size_bytes": { "type": "number" },
        "integration_type": { "type": "string" },
        "extension_slug": { "type": "string" },
        "workflow_name": { "type": "string" },
        "ai_model": { "type": "string" },
        "ai_tokens_used": { "type": "number" },
        "entity_name": { "type": "string" },
        "entity_operation": { "type": "string" },
        "quota_type": { "type": "string" },
        "quota_remaining": { "type": "number" }
      }
    },
    "created_date": { "type": "string" }
  },
  "required": ["company_id", "log_type", "action", "status"]
}
```

---

## 3. Tracking Categories

### 3.1 Integration Failures

**What to Track:**
- Failed API calls to external services
- Authentication errors
- Rate limiting responses
- Timeout errors
- Connection failures
- Invalid responses

**Metrics:**
```javascript
{
  "metric": "integration.failure_rate",
  "dimensions": {
    "integration_type": "googlecalendar",
    "company_id": "comp_123",
    "error_type": "authentication"
  },
  "value": 0.05, // 5% failure rate
  "period": "1h"
}
```

**Implementation:**
```javascript
// Log integration failure
await base44.entities.UsageLog.create({
  company_id,
  log_type: 'integration_call',
  source: 'PlatformIntegration',
  source_id: integration.id,
  action: `invoke.${endpoint}`,
  status: 'error',
  duration_ms: responseTime,
  metadata: {
    integration_type: integration.name,
    endpoint,
    error_message: error.message,
    status_code: error.status,
    retry_count: retries,
  },
});

// Trigger alert if failure rate exceeds threshold
if (failureRate > 0.1) {
  await base44.entities.PlatformEvent.create({
    company_id,
    event_type: 'integration.failed',
    source: 'PlatformIntegration',
    source_id: integration.id,
    severity: 'Error',
    payload: {
      failure_rate: failureRate,
      error_type: error.message,
      period: 'last_hour',
    },
  });
}
```

---

### 3.2 API Usage

**What to Track:**
- All API endpoint calls
- Request/response sizes
- Response times
- Status codes
- Authentication method
- Rate limit consumption

**Metrics:**
```javascript
{
  "metric": "api.requests_total",
  "dimensions": {
    "endpoint": "/api/v1/projects",
    "method": "GET",
    "status_code": 200,
    "company_id": "comp_123"
  },
  "value": 1250,
  "period": "1h"
}

{
  "metric": "api.latency_p95",
  "dimensions": {
    "endpoint": "/api/v1/projects",
    "method": "GET"
  },
  "value": 245, // ms
  "period": "1h"
}

{
  "metric": "api.rate_limit_remaining",
  "dimensions": {
    "api_key_id": "key_456",
    "company_id": "comp_123"
  },
  "value": 850, // requests remaining
  "period": "current_window"
}
```

**Implementation:**
```javascript
// Middleware to log all API calls
async function apiUsageMiddleware(req, res, next) {
  const startTime = Date.now();
  const company = await getCurrentCompany(req);
  
  res.on('finish', async () => {
    const duration = Date.now() - startTime;
    
    await base44.entities.UsageLog.create({
      company_id: company.id,
      log_type: 'api_call',
      source: 'API',
      source_id: req.path,
      action: `${req.method} ${req.path}`,
      status: res.statusCode >= 400 ? 'error' : 'success',
      duration_ms: duration,
      metadata: {
        endpoint: req.path,
        method: req.method,
        status_code: res.statusCode,
        request_size_bytes: req.headers['content-length'],
        response_size_bytes: res.get('content-length'),
        user_email: req.user?.email,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        api_key_id: req.apiKey?.id,
        rate_limit_remaining: res.get('X-RateLimit-Remaining'),
      },
    });
  });
  
  next();
}
```

---

### 3.3 Extension Usage

**What to Track:**
- Extension activation/deactivation
- Feature usage within extensions
- Extension errors
- Performance impact
- User adoption

**Metrics:**
```javascript
{
  "metric": "extension.active_users",
  "dimensions": {
    "extension_slug": "ai-estimator",
    "company_id": "comp_123"
  },
  "value": 45,
  "period": "1d"
}

{
  "metric": "extension.feature_usage",
  "dimensions": {
    "extension_slug": "ai-estimator",
    "feature": "generate_estimate",
    "company_id": "comp_123"
  },
  "value": 127,
  "period": "1d"
}

{
  "metric": "extension.error_rate",
  "dimensions": {
    "extension_slug": "ai-estimator",
    "error_type": "timeout"
  },
  "value": 0.02, // 2%
  "period": "1h"
}
```

**Implementation:**
```javascript
// Track extension usage
export async function trackExtensionUsage(extensionSlug, feature, userId, duration, status = 'success') {
  await base44.entities.UsageLog.create({
    company_id: currentCompany.id,
    log_type: 'extension_usage',
    source: 'Extension',
    source_id: extensionSlug,
    action: feature,
    status,
    duration_ms: duration,
    metadata: {
      extension_slug: extensionSlug,
      feature,
      user_email: userId,
    },
  });

  // Update extension usage count
  const extension = await base44.entities.Extension.filter({ slug: extensionSlug });
  if (extension.length > 0) {
    await base44.entities.Extension.update(extension[0].id, {
      usage_count: (extension[0].usage_count || 0) + 1,
      last_used: new Date().toISOString(),
    });
  }
}
```

---

### 3.4 Webhook Failures

**What to Track:**
- Webhook delivery attempts
- Success/failure status
- Response times
- HTTP status codes
- Retry attempts
- Payload sizes

**Metrics:**
```javascript
{
  "metric": "webhook.delivery_rate",
  "dimensions": {
    "webhook_id": "wh_123",
    "company_id": "comp_123"
  },
  "value": 0.95, // 95% success rate
  "period": "1h"
}

{
  "metric": "webhook.latency_avg",
  "dimensions": {
    "webhook_id": "wh_123"
  },
  "value": 342, // ms
  "period": "1h"
}

{
  "metric": "webhook.retry_rate",
  "dimensions": {
    "webhook_id": "wh_123",
    "retry_count": 2
  },
  "value": 15, // number of retries
  "period": "1h"
}
```

**Implementation:**
```javascript
// functions/triggerWebhook.js (enhanced)

async function deliverWebhook(webhook, payload) {
  const startTime = Date.now();
  let retries = 0;
  let success = false;
  let lastError = null;

  while (retries < webhook.retry_policy.max_retries && !success) {
    try {
      const response = await fetch(webhook.endpoint_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': generateSignature(payload, webhook.secret_key),
          ...webhook.headers,
        },
        body: JSON.stringify(payload),
      });

      const duration = Date.now() - startTime;

      // Log successful delivery
      await base44.entities.UsageLog.create({
        company_id: webhook.company_id,
        log_type: 'webhook_delivery',
        source: 'WebhookSubscription',
        source_id: webhook.id,
        action: 'deliver',
        status: 'success',
        duration_ms: duration,
        metadata: {
          endpoint: webhook.endpoint_url,
          status_code: response.status,
          request_size_bytes: JSON.stringify(payload).length,
          retry_count: retries,
        },
      });

      // Update webhook stats
      await base44.entities.WebhookSubscription.update(webhook.id, {
        last_triggered: new Date().toISOString(),
        success_count: (webhook.success_count || 0) + 1,
      });

      success = true;
      return { success: true, response };

    } catch (error) {
      lastError = error;
      retries++;

      // Log failure
      await base44.entities.UsageLog.create({
        company_id: webhook.company_id,
        log_type: 'webhook_delivery',
        source: 'WebhookSubscription',
        source_id: webhook.id,
        action: 'deliver',
        status: 'error',
        duration_ms: Date.now() - startTime,
        metadata: {
          endpoint: webhook.endpoint_url,
          error_message: error.message,
          retry_count: retries,
        },
      });

      // Wait before retry (exponential backoff)
      if (retries < webhook.retry_policy.max_retries) {
        const delay = webhook.retry_policy.retry_delay_seconds * Math.pow(2, retries - 1);
        await sleep(delay * 1000);
      }
    }
  }

  // All retries failed
  await base44.entities.WebhookSubscription.update(webhook.id, {
    failure_count: (webhook.failure_count || 0) + 1,
    last_error: lastError.message,
  });

  // Trigger alert
  await base44.entities.PlatformEvent.create({
    company_id: webhook.company_id,
    event_type: 'webhook.failed',
    source: 'WebhookSubscription',
    source_id: webhook.id,
    severity: 'Error',
    payload: {
      error: lastError.message,
      retries_attempted: retries,
      endpoint: webhook.endpoint_url,
    },
  });

  return { success: false, error: lastError };
}
```

---

### 3.5 Workflow Latency

**What to Track:**
- Workflow execution time
- Step-by-step duration
- Queue wait time
- Approval delays
- Bottlenecks

**Metrics:**
```javascript
{
  "metric": "workflow.execution_time_avg",
  "dimensions": {
    "workflow_name": "Project Onboarding",
    "company_id": "comp_123"
  },
  "value": 4500, // ms
  "period": "1h"
}

{
  "metric": "workflow.step_latency",
  "dimensions": {
    "workflow_name": "Project Onboarding",
    "step_type": "approval",
    "step_name": "Manager Approval"
  },
  "value": 125000, // ms (includes wait time)
  "period": "1h"
}

{
  "metric": "workflow.queue_depth",
  "dimensions": {
    "company_id": "comp_123"
  },
  "value": 12, // workflows waiting
  "period": "current"
}
```

**Implementation:**
```javascript
// Enhanced workflow execution tracking

export async function executeWorkflowWithTracking(workflow, triggerData) {
  const startTime = Date.now();
  
  const execution = await base44.entities.WorkflowExecution.create({
    company_id: workflow.company_id,
    workflow_id: workflow.id,
    workflow_name: workflow.name,
    trigger_type: workflow.trigger_type,
    trigger_data: triggerData,
    status: 'Running',
    started_at: new Date().toISOString(),
    steps_total: workflow.steps.length,
  });

  // Track execution start
  await base44.entities.UsageLog.create({
    company_id: workflow.company_id,
    log_type: 'workflow_execution',
    source: 'Workflow',
    source_id: workflow.id,
    action: 'start',
    status: 'success',
    duration_ms: 0,
    metadata: {
      workflow_name: workflow.name,
      execution_id: execution.id,
      trigger_type: workflow.trigger_type,
    },
  });

  // Execute steps with timing
  const stepResults = [];
  for (let i = 0; i < workflow.steps.length; i++) {
    const step = workflow.steps[i];
    const stepStart = Date.now();

    try {
      const result = await executeStep(step, execution);
      const stepDuration = Date.now() - stepStart;

      stepResults.push({
        step_id: step.id,
        step_type: step.type,
        status: 'success',
        duration_ms: stepDuration,
        timestamp: new Date().toISOString(),
      });

      // Log step completion
      await base44.entities.UsageLog.create({
        company_id: workflow.company_id,
        log_type: 'workflow_execution',
        source: 'Workflow',
        source_id: workflow.id,
        action: `step.${step.type}`,
        status: 'success',
        duration_ms: stepDuration,
        metadata: {
          workflow_name: workflow.name,
          execution_id: execution.id,
          step_id: step.id,
          step_type: step.type,
        },
      });

      execution.execution_log.push(stepResults[stepResults.length - 1]);
      execution.steps_executed = i + 1;
      await base44.entities.WorkflowExecution.update(execution.id, {
        steps_executed: execution.steps_executed,
        execution_log: execution.execution_log,
      });

    } catch (error) {
      const stepDuration = Date.now() - stepStart;

      stepResults.push({
        step_id: step.id,
        step_type: step.type,
        status: 'error',
        duration_ms: stepDuration,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      // Log step failure
      await base44.entities.UsageLog.create({
        company_id: workflow.company_id,
        log_type: 'workflow_execution',
        source: 'Workflow',
        source_id: workflow.id,
        action: `step.${step.type}`,
        status: 'error',
        duration_ms: stepDuration,
        metadata: {
          workflow_name: workflow.name,
          execution_id: execution.id,
          step_id: step.id,
          error_message: error.message,
        },
      });

      // Mark execution as failed
      await base44.entities.WorkflowExecution.update(execution.id, {
        status: 'Failed',
        error_message: error.message,
        completed_at: new Date().toISOString(),
        duration_seconds: (Date.now() - startTime) / 1000,
      });

      // Trigger alert
      await base44.entities.PlatformEvent.create({
        company_id: workflow.company_id,
        event_type: 'workflow.failed',
        source: 'Workflow',
        source_id: workflow.id,
        severity: 'Error',
        payload: {
          execution_id: execution.id,
          step_id: step.id,
          error: error.message,
        },
      });

      throw error;
    }
  }

  // Mark execution as completed
  const totalDuration = Date.now() - startTime;
  await base44.entities.WorkflowExecution.update(execution.id, {
    status: 'Completed',
    completed_at: new Date().toISOString(),
    duration_seconds: totalDuration / 1000,
  });

  // Log completion
  await base44.entities.UsageLog.create({
    company_id: workflow.company_id,
    log_type: 'workflow_execution',
    source: 'Workflow',
    source_id: workflow.id,
    action: 'complete',
    status: 'success',
    duration_ms: totalDuration,
    metadata: {
      workflow_name: workflow.name,
      execution_id: execution.id,
      steps_executed: workflow.steps.length,
    },
  });

  return execution;
}
```

---

### 3.6 AI Latency

**What to Track:**
- LLM request/response times
- Token usage (input/output)
- Model selection
- RAG search latency
- Embedding generation time
- Cost per request

**Metrics:**
```javascript
{
  "metric": "ai.request_latency_p95",
  "dimensions": {
    "model": "gpt-4o-mini",
    "company_id": "comp_123"
  },
  "value": 1250, // ms
  "period": "1h"
}

{
  "metric": "ai.tokens_total",
  "dimensions": {
    "model": "gpt-4o-mini",
    "token_type": "output",
    "company_id": "comp_123"
  },
  "value": 45000,
  "period": "1h"
}

{
  "metric": "ai.rag_search_latency",
  "dimensions": {
    "company_id": "comp_123"
  },
  "value": 340, // ms
  "period": "1h"
}

{
  "metric": "ai.cost_total",
  "dimensions": {
    "company_id": "comp_123",
    "service": "llm"
  },
  "value": 2.45, // USD
  "period": "1d"
}
```

**Implementation:**
```javascript
// Enhanced AI request tracking

export async function invokeLLMWithTracking(params) {
  const startTime = Date.now();
  const company = await getCurrentCompany();

  try {
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: params.prompt,
      add_context_from_internet: params.addContext,
      response_json_schema: params.schema,
      model: params.model,
      file_urls: params.fileUrls,
    });

    const duration = Date.now() - startTime;
    const tokensUsed = estimateTokens(response);

    // Log AI usage
    await base44.entities.UsageLog.create({
      company_id: company.id,
      log_type: 'ai_request',
      source: 'AI',
      source_id: params.contextId || 'unknown',
      action: params.action || 'invoke_llm',
      status: 'success',
      duration_ms: duration,
      metadata: {
        ai_model: params.model || 'automatic',
        ai_tokens_used: tokensUsed,
        context_type: params.contextType,
        context_id: params.contextId,
        request_size_bytes: params.prompt.length,
        response_size_bytes: JSON.stringify(response).length,
      },
    });

    // Update AI memory
    await base44.entities.AIMemory.create({
      company_id: company.id,
      memory_type: 'api_usage',
      content: JSON.stringify({
        model: params.model,
        duration_ms: duration,
        tokens: tokensUsed,
        context: params.contextId,
      }),
      metadata: {
        cost_estimate: calculateCost(params.model, tokensUsed),
      },
    });

    return response;

  } catch (error) {
    const duration = Date.now() - startTime;

    // Log failure
    await base44.entities.UsageLog.create({
      company_id: company.id,
      log_type: 'ai_request',
      source: 'AI',
      source_id: params.contextId || 'unknown',
      action: params.action || 'invoke_llm',
      status: 'error',
      duration_ms: duration,
      metadata: {
        ai_model: params.model || 'automatic',
        error_message: error.message,
      },
    });

    throw error;
  }
}

// RAG search tracking
export async function ragSearchWithTracking(query, options = {}) {
  const startTime = Date.now();
  const company = await getCurrentCompany();

  try {
    const results = await base44.functions.invoke('ragSearch', {
      query,
      ...options,
    });

    const duration = Date.now() - startTime;

    // Log RAG usage
    await base44.entities.UsageLog.create({
      company_id: company.id,
      log_type: 'ai_request',
      source: 'RAG',
      source_id: 'search',
      action: 'rag_search',
      status: 'success',
      duration_ms: duration,
      metadata: {
        query_length: query.length,
        results_count: results.length,
        retrieval_time_ms: duration,
      },
    });

    return results;

  } catch (error) {
    const duration = Date.now() - startTime;

    await base44.entities.UsageLog.create({
      company_id: company.id,
      log_type: 'ai_request',
      source: 'RAG',
      source_id: 'search',
      action: 'rag_search',
      status: 'error',
      duration_ms: duration,
      metadata: {
        error_message: error.message,
      },
    });

    throw error;
  }
}
```

---

### 3.7 Tenant Resource Usage

**What to Track:**
- Storage usage per tenant
- API calls per tenant
- Compute time per tenant
- Database queries per tenant
- File uploads per tenant
- Quota consumption

**Metrics:**
```javascript
{
  "metric": "tenant.storage_used",
  "dimensions": {
    "company_id": "comp_123"
  },
  "value": 2500000000, // bytes (2.5GB)
  "period": "current"
}

{
  "metric": "tenant.api_calls",
  "dimensions": {
    "company_id": "comp_123",
    "endpoint_category": "entities"
  },
  "value": 15420,
  "period": "1d"
}

{
  "metric": "tenant.quota_consumption",
  "dimensions": {
    "company_id": "comp_123",
    "quota_type": "ai_requests"
  },
  "value": 0.75, // 75% of quota used
  "period": "current_month"
}
```

**Implementation:**
```javascript
// Track tenant resource usage

export async function trackTenantResourceUsage(companyId, resourceType, amount, metadata = {}) {
  await base44.entities.UsageLog.create({
    company_id: companyId,
    log_type: 'user_action',
    source: 'ResourceTracker',
    source_id: resourceType,
    action: `consume.${resourceType}`,
    status: 'success',
    duration_ms: 0,
    metadata: {
      quota_type: resourceType,
      amount_consumed: amount,
      ...metadata,
    },
  });

  // Check quota limits
  const quota = await checkQuota(companyId, resourceType);
  
  if (quota.exceeded) {
    // Trigger quota exceeded event
    await base44.entities.PlatformEvent.create({
      company_id: companyId,
      event_type: 'quota.exceeded',
      source: 'ResourceTracker',
      source_id: resourceType,
      severity: 'Warning',
      payload: {
        quota_type: resourceType,
        limit: quota.limit,
        used: quota.used,
        percentage: (quota.used / quota.limit) * 100,
      },
    });
  }
}

// Periodic resource usage aggregation
export async function aggregateTenantUsage() {
  const companies = await base44.entities.Company.list();

  for (const company of companies) {
    // Calculate storage usage
    const files = await base44.entities.Document.filter({ company_id: company.id });
    const totalStorage = files.reduce((sum, doc) => sum + (doc.file_size_bytes || 0), 0);

    // Calculate API usage (last 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const apiLogs = await base44.entities.UsageLog.filter({
      company_id: company.id,
      log_type: 'api_call',
    });
    const recentLogs = apiLogs.filter(log => new Date(log.created_date) > oneDayAgo);

    // Update company usage stats
    await base44.entities.Company.update(company.id, {
      storage_used_bytes: totalStorage,
      api_calls_24h: recentLogs.length,
      last_usage_calculation: new Date().toISOString(),
    });
  }
}
```

---

## 4. Observability Dashboard

### 4.1 System Status Dashboard

**Key Metrics:**
- System health score (0-100)
- Active integrations
- Failed webhooks (last 24h)
- Average API latency
- AI request volume
- Workflow success rate
- Tenant quota alerts

### 4.2 Tenant-Specific Dashboards

**Per-Tenant Metrics:**
- Resource consumption (storage, API, AI)
- Cost breakdown
- Performance metrics
- Error rates
- Usage trends

---

## 5. Alerting Rules

### 5.1 Critical Alerts

| Metric | Threshold | Action |
|--------|-----------|--------|
| Integration failure rate | >20% (5min) | Page on-call |
| API error rate | >5% (5min) | Page on-call |
| Webhook delivery failure | >50% (1h) | Notify admin |
| Workflow failure rate | >10% (1h) | Notify admin |
| AI latency p95 | >5000ms (15min) | Notify team |
| Tenant quota exceeded | 100% | Block + notify |

### 5.2 Warning Alerts

| Metric | Threshold | Action |
|--------|-----------|--------|
| Integration failure rate | >5% (1h) | Email notification |
| API latency p95 | >1000ms (15min) | Slack notification |
| Extension error rate | >5% (1h) | Notify developer |
| Storage usage | >80% quota | Email customer |
| Workflow queue depth | >50 | Notify ops |

---

## 6. Implementation Roadmap

### Phase 1: Core Logging (Q3 2026)
- [ ] Enhanced UsageLog entity
- [ ] API call logging
- [ ] Integration failure tracking
- [ ] Webhook delivery logging
- [ ] Basic dashboard

### Phase 2: Advanced Metrics (Q4 2026)
- [ ] Workflow latency tracking
- [ ] AI latency and token tracking
- [ ] Extension usage analytics
- [ ] Tenant resource tracking
- [ ] Alert system

### Phase 3: Observability Platform (Q1 2027)
- [ ] Real-time metrics dashboard
- [ ] Custom alert rules
- [ ] Trend analysis
- [ ] Cost tracking
- [ ] Performance optimization recommendations

### Phase 4: Advanced Analytics (Q2 2027)
- [ ] ML-based anomaly detection
- [ ] Predictive scaling
- [ ] Automated optimization
- [ ] Customer-facing usage reports
- [ ] Benchmarking across tenants

---

## 7. Data Retention

| Data Type | Retention | Storage |
|-----------|-----------|---------|
| UsageLog (all types) | 90 days | Hot storage |
| Aggregated metrics (hourly) | 1 year | Warm storage |
| Aggregated metrics (daily) | 5 years | Cold storage |
| Error logs | 1 year | Hot storage |
| Performance metrics | 2 years | Warm storage |

---

**Version:** 1.0.0  
**Status:** Architecture Ready  
**Last Updated:** 2026-05-27