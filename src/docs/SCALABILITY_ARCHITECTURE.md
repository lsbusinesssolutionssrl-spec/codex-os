# Codex OS - Scalability Architecture

## Overview

Comprehensive scalability architecture for supporting high tenant count, large datasets, async processing, and distributed services.

---

## 1. Scalability Goals

### 1.1 Target Metrics

| Metric | Current | Target (Year 1) | Target (Year 3) |
|--------|---------|-----------------|-----------------|
| Active Tenants | 10 | 500 | 5,000 |
| Users per Tenant | 20 | 100 | 500 |
| Daily API Requests | 10K | 5M | 50M |
| Database Size | 1GB | 500GB | 5TB |
| File Storage | 10GB | 5TB | 50TB |
| Concurrent Users | 50 | 5,000 | 50,000 |
| Workflow Executions/Day | 100 | 50K | 500K |

### 1.2 Performance SLAs

- API Response Time (p95): <500ms
- API Response Time (p99): <1000ms
- Workflow Execution Start: <5 seconds
- Email Delivery: <30 seconds
- Search Queries: <2 seconds
- File Upload (100MB): <30 seconds

---

## 2. Multi-Tenant Architecture

### 2.1 Tenant Isolation Strategies

**Current: Logical Isolation (Single Database)**
```
All tenants share same database tables
Row-level security via company_id
Pros: Simple, cost-effective
Cons: Noisy neighbor risk, harder to scale
```

**Future: Hybrid Approach**

```
Tier 1 (Small Tenants): Shared database, shared infrastructure
Tier 2 (Medium Tenants): Shared database, dedicated compute
Tier 3 (Enterprise): Dedicated database shard, dedicated infrastructure
```

### 2.2 Database Sharding Strategy

```javascript
// Shard key: company_id
// Hash-based sharding for even distribution

const shardCount = 16; // 2^4, can grow to 32, 64, 128...

function getShardId(companyId) {
  const hash = md5(companyId);
  const shardNum = parseInt(hash.substring(0, 8), 16) % shardCount;
  return `shard_${shardNum}`;
}

// Connection routing
async function getTenantConnection(companyId) {
  const shardId = getShardId(companyId);
  const connection = connectionPool.get(shardId);
  
  if (!connection) {
    throw new Error(`Shard ${shardId} not available`);
  }
  
  return connection;
}
```

### 2.3 Tenant Metadata Entity

```json
{
  "name": "TenantMetadata",
  "type": "object",
  "properties": {
    "company_id": { "type": "string" },
    "tier": {
      "type": "string",
      "enum": ["starter", "growth", "business", "enterprise"]
    },
    "shard_id": { "type": "string" },
    "region": { "type": "string" },
    "created_date": { "type": "string" },
    "status": {
      "type": "string",
      "enum": ["active", "suspended", "archived"]
    },
    "resource_limits": {
      "type": "object",
      "properties": {
        "max_users": { "type": "number" },
        "max_storage_gb": { "type": "number" },
        "max_api_calls_per_day": { "type": "number" },
        "max_workflows_per_hour": { "type": "number" },
        "max_file_size_mb": { "type": "number" }
      }
    },
    "feature_flags": {
      "type": "array",
      "items": { "type": "string" }
    },
    "custom_config": { "type": "object" }
  },
  "required": ["company_id", "tier", "shard_id"]
}
```

---

## 3. Large Dataset Handling

### 3.1 Database Optimization

**Indexing Strategy:**

```sql
-- Compound indexes for common query patterns
CREATE INDEX idx_projects_company_status ON Project(company_id, status, created_date DESC);
CREATE INDEX idx_estimates_company_status_date ON Estimate(company_id, status, created_date DESC);
CREATE INDEX idx_tickets_company_priority_status ON SupportTicket(company_id, priority, status);

-- Partial indexes for filtered queries
CREATE INDEX idx_active_guardian ON GuardianSubscription(company_id) WHERE status = 'Active';
CREATE INDEX idx_recent_telemetry ON IoTTelemetry(device_id, timestamp DESC) WHERE timestamp > NOW() - INTERVAL '30 days';

-- Covering indexes for read-heavy queries
CREATE INDEX idx_client_summary ON Client(company_id, name, email) INCLUDE (phone, type);
```

**Query Optimization:**

```javascript
// BAD: N+1 query problem
const projects = await base44.entities.Project.filter({ company_id });
for (const project of projects) {
  const client = await base44.entities.Client.filter({ id: project.client_id });
}

// GOOD: Eager loading
const projects = await base44.entities.Project.filter({ company_id });
const clientIds = projects.map(p => p.client_id);
const clients = await base44.entities.Client.filter({ id: { $in: clientIds } });
const clientMap = new Map(clients.map(c => [c.id, c]));
projects.forEach(p => p.client = clientMap.get(p.client_id));
```

**Pagination Patterns:**

```javascript
// Offset-based (simple, but slow for large offsets)
const page1 = await base44.entities.Project.list('-created_date', 50, 0);
const page2 = await base44.entities.Project.list('-created_date', 50, 50);

// Cursor-based (recommended for large datasets)
const firstPage = await base44.entities.Project.filter(
  { company_id },
  '-created_date',
  50
);
const lastCursor = firstPage[firstPage.length - 1].id;
const nextPage = await base44.entities.Project.filter(
  { company_id, id: { $lt: lastCursor } },
  '-created_date',
  50
);

// Time-based pagination (for time-series data)
const recentTelemetry = await base44.entities.IoTTelemetry.filter(
  { 
    device_id,
    timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
  },
  '-timestamp',
  1000
);
```

### 3.2 Data Archival Strategy

```javascript
// Archive old data to cold storage
export async function archiveOldData() {
  const companies = await base44.entities.Company.list();
  
  for (const company of companies) {
    // Archive usage logs older than 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const oldLogs = await base44.entities.UsageLog.filter({
      company_id: company.id,
      created_date: { $lt: ninetyDaysAgo.toISOString() }
    });
    
    if (oldLogs.length > 0) {
      // Export to cold storage (S3 Glacier)
      await exportToColdStorage(`usage_logs/${company.id}`, oldLogs);
      
      // Delete from hot storage
      await base44.entities.UsageLog.delete({
        company_id: company.id,
        created_date: { $lt: ninetyDaysAgo.toISOString() }
      });
    }
    
    // Archive completed workflows older than 1 year
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const oldWorkflows = await base44.entities.WorkflowExecution.filter({
      company_id: company.id,
      status: 'Completed',
      started_at: { $lt: oneYearAgo.toISOString() }
    });
    
    if (oldWorkflows.length > 0) {
      await exportToColdStorage(`workflows/${company.id}`, oldWorkflows);
      await base44.entities.WorkflowExecution.delete({
        company_id: company.id,
        status: 'Completed',
        started_at: { $lt: oneYearAgo.toISOString() }
      });
    }
  }
}

// Scheduled daily at 2 AM
// create_automation('archiveOldData', 'scheduled', { repeat_interval: 1, repeat_unit: 'days', start_time: '02:00' })
```

### 3.3 Read Replicas

```javascript
// Read-write splitting for high read traffic

const dbConfig = {
  write: {
    host: 'db-primary.codex.io',
    port: 5432,
    role: 'primary'
  },
  read: [
    { host: 'db-replica-1.codex.io', port: 5432, weight: 0.6 },
    { host: 'db-replica-2.codex.io', port: 5432, weight: 0.4 },
  ]
};

async function getDbConnection(operation) {
  if (operation === 'write') {
    return connectionPool.get('primary');
  }
  
  // Select read replica based on weight
  const replica = selectWeightedRandom(dbConfig.read);
  return connectionPool.get(replica.host);
}

// Usage
await base44.entities.Project.create(data); // Writes to primary
const projects = await base44.entities.Project.filter({}); // Reads from replica
```

---

## 4. Async Job Processing

### 4.1 Job Queue Entity

```json
{
  "name": "AsyncJob",
  "type": "object",
  "properties": {
    "company_id": { "type": "string" },
    "job_type": {
      "type": "string",
      "enum": [
        "pdf_generation",
        "email_batch",
        "data_export",
        "ai_analysis",
        "workflow_execution",
        "webhook_delivery",
        "data_import",
        "report_generation",
        "video_processing",
        "image_processing"
      ]
    },
    "priority": {
      "type": "string",
      "enum": ["low", "normal", "high", "critical"],
      "default": "normal"
    },
    "status": {
      "type": "string",
      "enum": ["pending", "queued", "processing", "completed", "failed", "cancelled"]
    },
    "payload": { "type": "object" },
    "result": { "type": "object" },
    "error_message": { "type": "string" },
    "attempts": { "type": "number", "default": 0 },
    "max_attempts": { "type": "number", "default": 3 },
    "scheduled_at": { "type": "string" },
    "started_at": { "type": "string" },
    "completed_at": { "type": "string" },
    "timeout_seconds": { "type": "number", "default": 300 },
    "worker_id": { "type": "string" },
    "retry_after_seconds": { "type": "number" },
    "dependencies": {
      "type": "array",
      "items": { "type": "string" }
    },
    "callback_url": { "type": "string" },
    "metadata": { "type": "object" }
  },
  "required": ["job_type", "status", "payload"]
}
```

### 4.2 Job Processing Functions

```javascript
// functions/enqueueJob.js

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { jobType, payload, priority = 'normal', scheduledAt = null } = await req.json();
    
    const job = await base44.entities.AsyncJob.create({
      company_id: payload.company_id,
      job_type: jobType,
      priority,
      status: scheduledAt ? 'pending' : 'queued',
      payload,
      scheduled_at: scheduledAt,
      attempts: 0,
    });
    
    return Response.json({ 
      success: true, 
      job_id: job.id,
      estimated_wait_time: await estimateWaitTime(jobType, priority)
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// functions/processAsyncJobs.js (worker function)

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const jobHandlers = {
  pdf_generation: handlePdfGeneration,
  email_batch: handleEmailBatch,
  data_export: handleDataExport,
  ai_analysis: handleAIAnalysis,
  workflow_execution: handleWorkflowExecution,
  webhook_delivery: handleWebhookDelivery,
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const workerId = Deno.env.get('WORKER_ID') || `worker_${Date.now()}`;
    
    // Claim next available job
    const job = await claimNextJob(base44, workerId);
    
    if (!job) {
      return Response.json({ message: 'No jobs available' });
    }
    
    // Process job
    const handler = jobHandlers[job.job_type];
    if (!handler) {
      throw new Error(`Unknown job type: ${job.job_type}`);
    }
    
    await base44.entities.AsyncJob.update(job.id, {
      status: 'processing',
      started_at: new Date().toISOString(),
      worker_id: workerId,
    });
    
    try {
      const result = await handler(job.payload, { timeout: job.timeout_seconds * 1000 });
      
      await base44.entities.AsyncJob.update(job.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        result,
      });
      
      // Trigger callback if configured
      if (job.callback_url) {
        await fetch(job.callback_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job_id: job.id, status: 'completed', result }),
        });
      }
      
    } catch (error) {
      const attempts = job.attempts + 1;
      
      if (attempts < job.max_attempts) {
        // Retry
        await base44.entities.AsyncJob.update(job.id, {
          status: 'queued',
          attempts,
          retry_after_seconds: Math.pow(2, attempts) * 60, // Exponential backoff
        });
      } else {
        // Mark as failed
        await base44.entities.AsyncJob.update(job.id, {
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString(),
        });
      }
    }
    
    return Response.json({ success: true, job_id: job.id });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function claimNextJob(base44, workerId) {
  // Get next job with priority ordering
  const jobs = await base44.entities.AsyncJob.filter({
    status: 'queued',
    scheduled_at: { $lte: new Date().toISOString() },
  });
  
  // Sort by priority and age
  const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
  jobs.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(a.created_date) - new Date(b.created_date);
  });
  
  if (jobs.length === 0) return null;
  
  // Claim first job (atomic operation in production)
  const claimed = await base44.entities.AsyncJob.update(jobs[0].id, {
    status: 'processing',
    worker_id: workerId,
  });
  
  return claimed;
}
```

### 4.3 Job Types and Handlers

```javascript
// PDF Generation Job
async function handlePdfGeneration(payload) {
  const { template_id, data, output_format = 'pdf' } = payload;
  
  // Generate PDF using existing function
  const result = await base44.functions.invoke('generateEstimatePDF', {
    estimate_id: data.estimate_id,
    template_id,
  });
  
  return { file_url: result.file_url };
}

// Email Batch Job
async function handleEmailBatch(payload) {
  const { emails, template_id, data } = payload;
  const results = [];
  
  for (const email of emails) {
    try {
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: template.subject,
        body: renderTemplate(template.body, data),
      });
      results.push({ email, status: 'sent' });
    } catch (error) {
      results.push({ email, status: 'failed', error: error.message });
    }
  }
  
  return { results, total: emails.length, success: results.filter(r => r.status === 'sent').length };
}

// Data Export Job
async function handleDataExport(payload) {
  const { entity_type, filters, format = 'csv' } = payload;
  
  const data = await base44.entities[entity_type].filter(filters);
  
  let fileContent;
  let mimeType;
  
  if (format === 'csv') {
    fileContent = convertToCSV(data);
    mimeType = 'text/csv';
  } else if (format === 'json') {
    fileContent = JSON.stringify(data, null, 2);
    mimeType = 'application/json';
  }
  
  const { file_url } = await base44.integrations.Core.UploadFile({
    file: new Blob([fileContent], { type: mimeType }),
  });
  
  return { file_url, record_count: data.length };
}

// AI Analysis Job
async function handleAIAnalysis(payload, { timeout }) {
  const { analysis_type, context_type, context_id } = payload;
  
  const result = await Promise.race([
    base44.functions.invoke('generateContextualSuggestions', {
      context_type,
      context_id,
      analysis_type,
    }),
    timeoutPromise(timeout),
  ]);
  
  return result;
}
```

---

## 5. Message Queue Architecture

### 5.1 Queue Types

```javascript
// Queue configuration
const queues = {
  // High-priority, low-latency
  critical: {
    max_size: 1000,
    workers: 10,
    timeout_seconds: 30,
    retry_policy: { max: 3, delay_seconds: 10 },
  },
  
  // Standard processing
  default: {
    max_size: 10000,
    workers: 20,
    timeout_seconds: 300,
    retry_policy: { max: 3, delay_seconds: 60 },
  },
  
  // Background, batch processing
  background: {
    max_size: 100000,
    workers: 5,
    timeout_seconds: 600,
    retry_policy: { max: 2, delay_seconds: 300 },
  },
  
  // Scheduled/delayed jobs
  scheduled: {
    max_size: 50000,
    workers: 3,
    timeout_seconds: 300,
    retry_policy: { max: 3, delay_seconds: 60 },
  },
};
```

### 5.2 Message Broker Integration

```javascript
// Redis-based message queue (production-ready)

import { Redis } from 'npm:ioredis@5.3.2';

const redis = new Redis({
  host: Deno.env.get('REDIS_HOST'),
  port: Deno.env.get('REDIS_PORT'),
  password: Deno.env.get('REDIS_PASSWORD'),
  maxRetriesPerRequest: 3,
});

class MessageQueue {
  async enqueue(queueName, message, options = {}) {
    const job = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      queue: queueName,
      payload: message,
      priority: options.priority || 0,
      created_at: Date.now(),
      scheduled_at: options.scheduledAt || Date.now(),
    };
    
    // Add to sorted set (priority queue)
    await redis.zadd(
      `queue:${queueName}`,
      job.priority,
      JSON.stringify(job)
    );
    
    return job.id;
  }
  
  async dequeue(queueName, workerId) {
    // Get highest priority job
    const jobs = await redis.zrange(`queue:${queueName}`, 0, 0, 'WITHSCORES');
    
    if (jobs.length === 0) {
      return null;
    }
    
    const job = JSON.parse(jobs[0]);
    
    // Remove from queue
    await redis.zrem(`queue:${queueName}`, jobs[0]);
    
    // Add to processing set
    await redis.set(
      `processing:${workerId}:${job.id}`,
      JSON.stringify({ ...job, started_at: Date.now() }),
      'EX',
      300 // 5 minute timeout
    );
    
    return job;
  }
  
  async complete(workerId, jobId, result) {
    await redis.del(`processing:${workerId}:${jobId}`);
    
    // Log completion
    await redis.incr('stats:jobs:completed');
  }
  
  async fail(workerId, jobId, error, retry = true) {
    const jobData = await redis.get(`processing:${workerId}:${jobId}`);
    const job = JSON.parse(jobData);
    
    await redis.del(`processing:${workerId}:${jobId}`);
    
    if (retry && job.attempts < 3) {
      // Re-queue with exponential backoff
      job.attempts = (job.attempts || 0) + 1;
      job.scheduled_at = Date.now() + Math.pow(2, job.attempts) * 60000;
      
      await redis.zadd(
        `queue:${job.queue}`,
        job.priority,
        JSON.stringify(job)
      );
    } else {
      // Move to dead letter queue
      await redis.lpush(
        `queue:dead_letter`,
        JSON.stringify({ ...job, error: error.message, failed_at: Date.now() })
      );
    }
  }
  
  async getQueueStats(queueName) {
    const queued = await redis.zcard(`queue:${queueName}`);
    const processing = await redis.keys(`processing:*:${queueName}:*`).then(keys => keys.length);
    const dead = await redis.llen(`queue:dead_letter`);
    
    return { queued, processing, dead };
  }
}

export const messageQueue = new MessageQueue();
```

### 5.3 Queue Monitoring

```javascript
// Real-time queue metrics

async function getQueueMetrics() {
  const queues = ['critical', 'default', 'background', 'scheduled'];
  const metrics = {};
  
  for (const queueName of queues) {
    const stats = await messageQueue.getQueueStats(queueName);
    metrics[queueName] = {
      ...stats,
      avg_wait_time_ms: await calculateAvgWaitTime(queueName),
      throughput_per_minute: await calculateThroughput(queueName),
      failure_rate: await calculateFailureRate(queueName),
    };
  }
  
  return metrics;
}

// Alerting on queue health
async function checkQueueHealth() {
  const metrics = await getQueueMetrics();
  
  for (const [queueName, stats] of Object.entries(metrics)) {
    // Alert if queue is backing up
    if (stats.queued > 10000) {
      await sendAlert('queue_backlog', { queue: queueName, size: stats.queued });
    }
    
    // Alert if high failure rate
    if (stats.failure_rate > 0.1) {
      await sendAlert('queue_failure_rate', { queue: queueName, rate: stats.failure_rate });
    }
    
    // Alert if jobs waiting too long
    if (stats.avg_wait_time_ms > 60000) {
      await sendAlert('queue_wait_time', { queue: queueName, wait_ms: stats.avg_wait_time_ms });
    }
  }
}

// Run every 5 minutes
// create_automation('checkQueueHealth', 'scheduled', { repeat_interval: 5, repeat_unit: 'minutes' })
```

---

## 6. Background Processing Workers

### 6.1 Worker Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Load Balancer                         │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  Worker 1    │   │  Worker 2    │   │  Worker N    │
│  (Critical)  │   │  (Default)   │   │  (Background)│
└──────────────┘   └──────────────┘   └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
                   ┌──────────────┐
                   │  Message     │
                   │  Queue       │
                   │  (Redis)     │
                   └──────────────┘
                            │
                            ▼
                   ┌──────────────┐
                   │  Database    │
                   │  (Sharded)   │
                   └──────────────┘
```

### 6.2 Worker Implementation

```javascript
// workers/jobWorker.js

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { messageQueue } from '../lib/messageQueue';

const WORKER_ID = Deno.env.get('WORKER_ID') || `worker_${Date.now()}`;
const WORKER_TYPE = Deno.env.get('WORKER_TYPE') || 'default';

const jobHandlers = {
  pdf_generation: { handler: handlePdfGeneration, timeout: 60000 },
  email_batch: { handler: handleEmailBatch, timeout: 300000 },
  data_export: { handler: handleDataExport, timeout: 300000 },
  ai_analysis: { handler: handleAIAnalysis, timeout: 120000 },
  workflow_execution: { handler: handleWorkflowExecution, timeout: 600000 },
  webhook_delivery: { handler: handleWebhookDelivery, timeout: 30000 },
  report_generation: { handler: handleReportGeneration, timeout: 300000 },
};

async function startWorker() {
  console.log(`Worker ${WORKER_ID} started (type: ${WORKER_TYPE})`);
  
  const queueName = WORKER_TYPE === 'critical' ? 'critical' : 
                    WORKER_TYPE === 'background' ? 'background' : 'default';
  
  while (true) {
    try {
      // Get next job from queue
      const job = await messageQueue.dequeue(queueName, WORKER_ID);
      
      if (!job) {
        // No jobs available, wait before polling again
        await sleep(1000);
        continue;
      }
      
      console.log(`Processing job ${job.id} (type: ${job.payload.job_type})`);
      
      const jobConfig = jobHandlers[job.payload.job_type];
      
      if (!jobConfig) {
        console.error(`Unknown job type: ${job.payload.job_type}`);
        await messageQueue.fail(WORKER_ID, job.id, new Error('Unknown job type'), false);
        continue;
      }
      
      // Execute with timeout
      try {
        const result = await Promise.race([
          jobConfig.handler(job.payload),
          timeoutPromise(jobConfig.timeout),
        ]);
        
        await messageQueue.complete(WORKER_ID, job.id, result);
        console.log(`Job ${job.id} completed successfully`);
        
      } catch (error) {
        console.error(`Job ${job.id} failed: ${error.message}`);
        await messageQueue.fail(WORKER_ID, job.id, error, true);
      }
      
    } catch (error) {
      console.error(`Worker error: ${error.message}`);
      await sleep(5000); // Wait before retrying
    }
  }
}

// Health check endpoint
Deno.serve(async (req) => {
  if (req.url.endsWith('/health')) {
    return Response.json({
      status: 'healthy',
      worker_id: WORKER_ID,
      worker_type: WORKER_TYPE,
      uptime_seconds: process.uptime(),
      memory_usage: process.memoryUsage(),
    });
  }
  
  return Response.json({ error: 'Not found' }, { status: 404 });
});

startWorker();
```

### 6.3 Worker Auto-Scaling

```javascript
// functions/scaleWorkers.js

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get queue metrics
    const metrics = await getQueueMetrics();
    
    const scalingDecisions = [];
    
    // Scale critical queue workers
    if (metrics.critical.queued > 500) {
      scalingDecisions.push({
        action: 'scale_up',
        worker_type: 'critical',
        current_count: await getWorkerCount('critical'),
        target_count: Math.min(20, await getWorkerCount('critical') + 5),
        reason: 'High critical queue backlog',
      });
    } else if (metrics.critical.queued < 50) {
      scalingDecisions.push({
        action: 'scale_down',
        worker_type: 'critical',
        current_count: await getWorkerCount('critical'),
        target_count: Math.max(5, await getWorkerCount('critical') - 2),
        reason: 'Low critical queue demand',
      });
    }
    
    // Scale default queue workers
    if (metrics.default.queued > 2000) {
      scalingDecisions.push({
        action: 'scale_up',
        worker_type: 'default',
        current_count: await getWorkerCount('default'),
        target_count: Math.min(50, await getWorkerCount('default') + 10),
        reason: 'High default queue backlog',
      });
    }
    
    // Execute scaling decisions
    for (const decision of scalingDecisions) {
      await executeScalingDecision(decision);
    }
    
    return Response.json({ decisions: scalingDecisions });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function executeScalingDecision(decision) {
  const { action, worker_type, target_count } = decision;
  
  if (action === 'scale_up') {
    // Deploy additional workers (Kubernetes, ECS, etc.)
    await deployWorkers(worker_type, target_count);
  } else if (action === 'scale_down') {
    // Gracefully terminate excess workers
    await terminateWorkers(worker_type, target_count);
  }
  
  console.log(`Scaled ${worker_type} workers to ${target_count}`);
}

// Run every 2 minutes
// create_automation('scaleWorkers', 'scheduled', { repeat_interval: 2, repeat_unit: 'minutes' })
```

---

## 7. Distributed Services

### 7.1 Service Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      API Gateway                              │
│                  (Rate Limiting, Auth)                        │
└──────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  User Service   │  │  Project        │  │  Notification   │
│  - Auth         │  │  Service        │  │  Service        │
│  - Profiles     │  │  - CRUD         │  │  - Email        │
│  - Roles        │  │  - Workflows    │  │  - SMS          │
│                 │  │  - Financials   │  │  - Push         │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                              ▼
                   ┌─────────────────┐
                   │   Event Bus     │
                   │   (Async Comms) │
                   └─────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  AI Service     │  │  File Service   │  │  Analytics      │
│  - LLM          │  │  - Upload       │  │  Service        │
│  - RAG          │  │  - Storage      │  │  - Metrics      │
│  - Embeddings   │  │  - CDN          │  │  - Reports      │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 7.2 Service Communication Patterns

**Synchronous (REST/gRPC):**
```javascript
// Direct service-to-service call
async function getUserProfile(userId) {
  const response = await fetch('http://user-service:3000/users/' + userId, {
    headers: {
      'Authorization': `Bearer ${serviceToken}`,
      'X-Service-Name': 'project-service',
    },
  });
  
  if (!response.ok) {
    throw new Error('User service unavailable');
  }
  
  return response.json();
}
```

**Asynchronous (Event-based):**
```javascript
// Publish event to event bus
async function publishUserEvent(eventType, payload) {
  await messageQueue.enqueue('events', {
    event_type: eventType,
    payload,
    timestamp: new Date().toISOString(),
  });
}

// Subscribe to events
messageQueue.subscribe('events', async (message) => {
  if (message.event_type === 'project.created') {
    await handleProjectCreated(message.payload);
  }
});
```

### 7.3 Service Discovery

```javascript
// Service registry

const serviceRegistry = {
  services: new Map(),
  
  register(serviceName, instance) {
    const instances = this.services.get(serviceName) || [];
    instances.push(instance);
    this.services.set(serviceName, instances);
  },
  
  unregister(serviceName, instanceId) {
    const instances = this.services.get(serviceName) || [];
    const filtered = instances.filter(i => i.id !== instanceId);
    this.services.set(serviceName, filtered);
  },
  
  getHealthyInstances(serviceName) {
    const instances = this.services.get(serviceName) || [];
    return instances.filter(i => i.status === 'healthy' && 
                                  Date.now() - i.last_heartbeat < 30000);
  },
  
  selectInstance(serviceName) {
    const healthy = this.getHealthyInstances(serviceName);
    if (healthy.length === 0) {
      throw new Error(`No healthy instances for ${serviceName}`);
    }
    
    // Round-robin selection
    const selected = healthy[Math.floor(Math.random() * healthy.length)];
    return selected;
  },
};

// Usage
const userService = serviceRegistry.selectInstance('user-service');
const response = await fetch(`${userService.url}/users/${userId}`);
```

### 7.4 Circuit Breaker Pattern

```javascript
class CircuitBreaker {
  constructor(serviceName, options = {}) {
    this.serviceName = serviceName;
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failures = 0;
    this.lastFailure = null;
  }
  
  async call(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailure > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error(`Circuit breaker OPEN for ${this.serviceName}`);
      }
    }
    
    try {
      const result = await fn();
      
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failures = 0;
      }
      
      return result;
      
    } catch (error) {
      this.failures++;
      this.lastFailure = Date.now();
      
      if (this.failures >= this.failureThreshold) {
        this.state = 'OPEN';
        console.error(`Circuit breaker OPEN for ${this.serviceName}`);
      }
      
      throw error;
    }
  }
}

// Usage
const userServiceBreaker = new CircuitBreaker('user-service', {
  failureThreshold: 5,
  resetTimeout: 60000,
});

async function getUser(userId) {
  return userServiceBreaker.call(async () => {
    const response = await fetch(`http://user-service/users/${userId}`);
    return response.json();
  });
}
```

---

## 8. Caching Strategy

### 8.1 Multi-Level Caching

```javascript
// L1: In-Memory Cache (per instance)
const l1Cache = new Map();
const l1CacheTTL = 60000; // 1 minute

// L2: Redis Cache (shared)
const redis = new Redis();
const l2CacheTTL = 300000; // 5 minutes

// L3: Database (persistent)

async function getCached(key, fetchFn, options = {}) {
  const { ttl = l2CacheTTL, useL1 = true } = options;
  
  // Check L1 cache
  if (useL1) {
    const l1Entry = l1Cache.get(key);
    if (l1Entry && Date.now() - l1Entry.timestamp < l1CacheTTL) {
      return l1Entry.data;
    }
  }
  
  // Check L2 cache
  const l2Data = await redis.get(`cache:${key}`);
  if (l2Data) {
    const parsed = JSON.parse(l2Data);
    
    // Populate L1
    if (useL1) {
      l1Cache.set(key, { data: parsed, timestamp: Date.now() });
    }
    
    return parsed;
  }
  
  // Fetch from source
  const data = await fetchFn();
  
  // Store in caches
  await redis.setex(`cache:${key}`, ttl / 1000, JSON.stringify(data));
  if (useL1) {
    l1Cache.set(key, { data, timestamp: Date.now() });
  }
  
  return data;
}

// Usage
async function getClient(clientId) {
  return getCached(`client:${clientId}`, async () => {
    const clients = await base44.entities.Client.filter({ id: clientId });
    return clients[0];
  }, { ttl: 300000 });
}
```

### 8.2 Cache Invalidation

```javascript
// Invalidate cache on data changes

async function invalidateClientCache(clientId) {
  // Remove from L2 cache
  await redis.del(`cache:client:${clientId}`);
  
  // Broadcast invalidation to all instances
  await redis.publish('cache:invalidate', JSON.stringify({
    pattern: `client:${clientId}`,
    timestamp: Date.now(),
  }));
}

// Listen for invalidation events
redis.subscribe('cache:invalidate');
redis.on('cache:invalidate', (message) => {
  const { pattern } = JSON.parse(message);
  
  // Clear matching L1 cache entries
  for (const key of l1Cache.keys()) {
    if (key.startsWith(pattern)) {
      l1Cache.delete(key);
    }
  }
});
```

---

## 9. Implementation Roadmap

### Phase 1: Foundation (Q3 2026)
- [ ] AsyncJob entity
- [ ] Basic job queue implementation
- [ ] Worker infrastructure
- [ ] Database indexing optimization
- [ ] Query optimization
- [ ] Basic caching (Redis)

### Phase 2: Scaling (Q4 2026)
- [ ] Database sharding
- [ ] Read replicas
- [ ] Message queue (Redis)
- [ ] Worker auto-scaling
- [ ] Circuit breaker pattern
- [ ] Service discovery

### Phase 3: Distributed Services (Q1 2027)
- [ ] Service decomposition
- [ ] Event bus implementation
- [ ] API gateway
- [ ] Distributed caching
- [ ] Health monitoring
- [ ] Graceful degradation

### Phase 4: Advanced (Q2 2027)
- [ ] Multi-region deployment
- [ ] CDN integration
- [ ] Edge computing
- [ ] Predictive scaling
- [ ] Advanced observability
- [ ] Cost optimization

---

## 10. Performance Benchmarks

### Target Performance by Tier

| Metric | Starter | Growth | Business | Enterprise |
|--------|---------|--------|----------|------------|
| API p95 Latency | <500ms | <400ms | <300ms | <200ms |
| Concurrent Users | 50 | 200 | 1000 | 5000 |
| Daily API Calls | 10K | 100K | 1M | 10M |
| Storage | 10GB | 100GB | 1TB | 10TB |
| Workflow Executions/Day | 100 | 1K | 10K | 100K |

---

**Version:** 1.0.0  
**Status:** Architecture Ready  
**Last Updated:** 2026-05-27