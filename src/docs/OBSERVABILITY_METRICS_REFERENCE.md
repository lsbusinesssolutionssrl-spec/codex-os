# Platform Observability - Metrics Reference

## Complete Metrics Catalog

---

## Integration Metrics

### integration.failure_rate
- **Type**: Gauge (percentage)
- **Dimensions**: `integration_type`, `company_id`, `error_type`
- **Period**: 1h, 24h
- **Alert Threshold**: >10% (warning), >20% (critical)

### integration.success_rate
- **Type**: Gauge (percentage)
- **Dimensions**: `integration_type`, `company_id`
- **Period**: 1h, 24h

### integration.response_time_avg
- **Type**: Gauge (milliseconds)
- **Dimensions**: `integration_type`, `endpoint`
- **Period**: 1h

### integration.response_time_p95
- **Type**: Gauge (milliseconds)
- **Dimensions**: `integration_type`, `endpoint`
- **Period**: 1h

### integration.requests_total
- **Type**: Counter
- **Dimensions**: `integration_type`, `company_id`, `status`
- **Period**: Cumulative

---

## API Metrics

### api.requests_total
- **Type**: Counter
- **Dimensions**: `endpoint`, `method`, `status_code`, `company_id`
- **Period**: Cumulative

### api.latency_avg
- **Type**: Gauge (milliseconds)
- **Dimensions**: `endpoint`, `method`
- **Period**: 1h, 24h

### api.latency_p95
- **Type**: Gauge (milliseconds)
- **Dimensions**: `endpoint`, `method`
- **Period**: 1h, 24h

### api.latency_p99
- **Type**: Gauge (milliseconds)
- **Dimensions**: `endpoint`, `method`
- **Period**: 1h, 24h

### api.error_rate
- **Type**: Gauge (percentage)
- **Dimensions**: `endpoint`, `method`, `error_type`
- **Period**: 1h

### api.rate_limit_hits
- **Type**: Counter
- **Dimensions**: `api_key_id`, `company_id`
- **Period**: Cumulative

### api.rate_limit_remaining
- **Type**: Gauge
- **Dimensions**: `api_key_id`, `company_id`
- **Period**: Current window

### api.request_size_avg
- **Type**: Gauge (bytes)
- **Dimensions**: `endpoint`, `method`
- **Period**: 1h

### api.response_size_avg
- **Type**: Gauge (bytes)
- **Dimensions**: `endpoint`, `method`
- **Period**: 1h

---

## Extension Metrics

### extension.active_users
- **Type**: Gauge
- **Dimensions**: `extension_slug`, `company_id`
- **Period**: 1d

### extension.feature_usage
- **Type**: Counter
- **Dimensions**: `extension_slug`, `feature`, `company_id`
- **Period**: 1d, 7d, 30d

### extension.error_rate
- **Type**: Gauge (percentage)
- **Dimensions**: `extension_slug`, `error_type`
- **Period**: 1h

### extension.installation_count
- **Type**: Gauge
- **Dimensions**: `extension_slug`, `company_id`
- **Period**: Current

### extension.uninstall_rate
- **Type**: Gauge (percentage)
- **Dimensions**: `extension_slug`
- **Period**: 7d, 30d

### extension.performance_impact
- **Type**: Gauge (milliseconds added latency)
- **Dimensions**: `extension_slug`, `feature`
- **Period**: 1h

---

## Webhook Metrics

### webhook.delivery_rate
- **Type**: Gauge (percentage)
- **Dimensions**: `webhook_id`, `company_id`
- **Period**: 1h, 24h

### webhook.latency_avg
- **Type**: Gauge (milliseconds)
- **Dimensions**: `webhook_id`
- **Period**: 1h

### webhook.latency_p95
- **Type**: Gauge (milliseconds)
- **Dimensions**: `webhook_id`
- **Period**: 1h

### webhook.retry_rate
- **Type**: Gauge (percentage)
- **Dimensions**: `webhook_id`, `retry_count`
- **Period**: 1h

### webhook.failure_rate_by_status
- **Type**: Gauge (percentage)
- **Dimensions**: `webhook_id`, `http_status_code`
- **Period**: 1h, 24h

### webhook.payload_size_avg
- **Type**: Gauge (bytes)
- **Dimensions**: `webhook_id`, `event_type`
- **Period**: 1h

### webhook.queue_depth
- **Type**: Gauge
- **Dimensions**: `company_id`
- **Period**: Current

---

## Workflow Metrics

### workflow.execution_time_avg
- **Type**: Gauge (milliseconds)
- **Dimensions**: `workflow_name`, `company_id`
- **Period**: 1h, 24h

### workflow.execution_time_p95
- **Type**: Gauge (milliseconds)
- **Dimensions**: `workflow_name`, `company_id`
- **Period**: 1h, 24h

### workflow.success_rate
- **Type**: Gauge (percentage)
- **Dimensions**: `workflow_name`, `company_id`
- **Period**: 1h, 24h

### workflow.failure_rate
- **Type**: Gauge (percentage)
- **Dimensions**: `workflow_name`, `failure_reason`
- **Period**: 1h, 24h

### workflow.step_latency
- **Type**: Gauge (milliseconds)
- **Dimensions**: `workflow_name`, `step_type`, `step_name`
- **Period**: 1h

### workflow.approval_wait_time_avg
- **Type**: Gauge (milliseconds)
- **Dimensions**: `workflow_name`, `approval_type`
- **Period**: 24h, 7d

### workflow.queue_depth
- **Type**: Gauge
- **Dimensions**: `company_id`, `priority`
- **Period**: Current

### workflow.executions_total
- **Type**: Counter
- **Dimensions**: `workflow_name`, `company_id`, `status`
- **Period**: Cumulative

### workflow.steps_executed
- **Type**: Counter
- **Dimensions**: `workflow_name`, `step_type`
- **Period**: Cumulative

---

## AI Metrics

### ai.request_latency_avg
- **Type**: Gauge (milliseconds)
- **Dimensions**: `model`, `company_id`
- **Period**: 1h, 24h

### ai.request_latency_p95
- **Type**: Gauge (milliseconds)
- **Dimensions**: `model`, `company_id`
- **Period**: 1h, 24h

### ai.request_latency_p99
- **Type**: Gauge (milliseconds)
- **Dimensions**: `model`, `company_id`
- **Period**: 1h, 24h

### ai.tokens_total
- **Type**: Counter
- **Dimensions**: `model`, `token_type` (input/output), `company_id`
- **Period**: 1h, 24h, cumulative

### ai.tokens_avg_per_request
- **Type**: Gauge
- **Dimensions**: `model`, `token_type`
- **Period**: 1h, 24h

### ai.requests_total
- **Type**: Counter
- **Dimensions**: `model`, `company_id`, `status`
- **Period**: Cumulative

### ai.error_rate
- **Type**: Gauge (percentage)
- **Dimensions**: `model`, `error_type`
- **Period**: 1h

### ai.rag_search_latency_avg
- **Type**: Gauge (milliseconds)
- **Dimensions**: `company_id`
- **Period**: 1h, 24h

### ai.rag_search_latency_p95
- **Type**: Gauge (milliseconds)
- **Dimensions**: `company_id`
- **Period**: 1h, 24h

### ai.rag_results_count_avg
- **Type**: Gauge
- **Dimensions**: `company_id`
- **Period**: 1h

### ai.cost_total
- **Type**: Gauge (USD)
- **Dimensions**: `company_id`, `service` (llm/embeddings/ocr)
- **Period**: 1d, 7d, 30d, cumulative

### ai.cost_per_request_avg
- **Type**: Gauge (USD)
- **Dimensions**: `company_id`, `model`
- **Period**: 1d

### ai.suggestion_acceptance_rate
- **Type**: Gauge (percentage)
- **Dimensions**: `suggestion_type`, `company_id`
- **Period**: 7d, 30d

---

## Tenant Resource Metrics

### tenant.storage_used
- **Type**: Gauge (bytes)
- **Dimensions**: `company_id`
- **Period**: Current

### tenant.storage_quota_percentage
- **Type**: Gauge (percentage)
- **Dimensions**: `company_id`
- **Period**: Current

### tenant.api_calls_total
- **Type**: Counter
- **Dimensions**: `company_id`, `endpoint_category`
- **Period**: 1d, 7d, 30d, cumulative

### tenant.api_calls_rate
- **Type**: Gauge (requests/minute)
- **Dimensions**: `company_id`
- **Period**: Current

### tenant.database_queries_total
- **Type**: Counter
- **Dimensions**: `company_id`, `entity_type`
- **Period**: 1d, cumulative

### tenant.database_query_latency_avg
- **Type**: Gauge (milliseconds)
- **Dimensions**: `company_id`, `entity_type`
- **Period**: 1h

### tenant.file_uploads_total
- **Type**: Counter
- **Dimensions**: `company_id`, `file_type`
- **Period**: 1d, cumulative

### tenant.file_uploads_size_total
- **Type**: Gauge (bytes)
- **Dimensions**: `company_id`
- **Period**: 1d, cumulative

### tenant.quota_consumption
- **Type**: Gauge (percentage)
- **Dimensions**: `company_id`, `quota_type` (api/ai/storage/compute)
- **Period**: Current month

### tenant.compute_time_total
- **Type**: Gauge (seconds)
- **Dimensions**: `company_id`
- **Period**: 1d, cumulative

### tenant.active_users
- **Type**: Gauge
- **Dimensions**: `company_id`
- **Period**: 1d, 7d, 30d

### tenant.session_duration_avg
- **Type**: Gauge (minutes)
- **Dimensions**: `company_id`
- **Period**: 7d

---

## System Health Metrics

### system.health_score
- **Type**: Gauge (0-100)
- **Dimensions**: None (global)
- **Period**: Current

### system.uptime_percentage
- **Type**: Gauge (percentage)
- **Dimensions**: `service`
- **Period**: 24h, 7d, 30d

### system.error_rate
- **Type**: Gauge (percentage)
- **Dimensions**: `service`
- **Period**: 1h, 24h

### system.active_incidents
- **Type**: Gauge
- **Dimensions**: `severity`
- **Period**: Current

### system.mean_time_to_detection
- **Type**: Gauge (minutes)
- **Dimensions**: None
- **Period**: 30d rolling

### system.mean_time_to_resolution
- **Type**: Gauge (minutes)
- **Dimensions**: None
- **Period**: 30d rolling

---

## Business Metrics

### business.revenue_total
- **Type**: Gauge (EUR)
- **Dimensions**: `company_id`, `revenue_type` (subscription/usage/overage)
- **Period**: 1m, cumulative

### business.customer_count
- **Type**: Gauge
- **Dimensions**: `plan_type`
- **Period**: Current

### business.churn_rate
- **Type**: Gauge (percentage)
- **Dimensions**: `plan_type`
- **Period**: 30d, 90d

### business.customer_lifetime_value
- **Type**: Gauge (EUR)
- **Dimensions**: `plan_type`
- **Period**: Current

### business.cost_per_customer
- **Type**: Gauge (EUR)
- **Dimensions**: `plan_type`
- **Period**: 1m

### business.gross_margin
- **Type**: Gauge (percentage)
- **Dimensions**: None
- **Period**: 1m

---

## Metric Aggregation Rules

### Time-Based Aggregation

**Raw Data** → **1-minute buckets** → **5-minute buckets** → **1-hour buckets** → **1-day buckets**

- Raw data: 90 days retention
- 1-minute: 7 days retention
- 5-minute: 30 days retention
- 1-hour: 1 year retention
- 1-day: 5 years retention

### Dimensional Aggregation

Metrics can be aggregated across dimensions:

```
// Example: Roll up from per-company to global
api.requests_total (company_id=X) + 
api.requests_total (company_id=Y) + 
... = api.requests_total (global)
```

---

## Alert Configurations

### Integration Failure Alert
```json
{
  "name": "Integration Failure Rate Critical",
  "metric": "integration.failure_rate",
  "condition": "> 0.20",
  "duration": "5m",
  "dimensions": {
    "integration_type": "*"
  },
  "severity": "critical",
  "channels": ["pagerduty", "slack"],
  "runbook_url": "https://runbooks.codex.io/integration-failure"
}
```

### API Latency Alert
```json
{
  "name": "API Latency High",
  "metric": "api.latency_p95",
  "condition": "> 1000",
  "duration": "15m",
  "dimensions": {
    "endpoint": "/api/v1/*"
  },
  "severity": "warning",
  "channels": ["slack"],
  "runbook_url": "https://runbooks.codex.io/api-latency"
}
```

### Quota Exceeded Alert
```json
{
  "name": "Tenant Quota Exceeded",
  "metric": "tenant.quota_consumption",
  "condition": ">= 1.0",
  "duration": "0m",
  "dimensions": {
    "quota_type": "*"
  },
  "severity": "critical",
  "channels": ["email", "slack"],
  "runbook_url": "https://runbooks.codex.io/quota-exceeded"
}
```

---

**Version:** 1.0.0  
**Last Updated:** 2026-05-27