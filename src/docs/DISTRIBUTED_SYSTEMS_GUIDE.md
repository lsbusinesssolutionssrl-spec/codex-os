# Distributed Systems Implementation Guide

## Practical Guide for Building Scalable Distributed Services

---

## 1. Service Decomposition

### 1.1 Identifying Service Boundaries

**Domain-Driven Design Approach:**

```
Codex OS Bounded Contexts:

1. Identity Context
   - User authentication
   - Authorization
   - Role management
   - Session management

2. Project Management Context
   - Projects
   - Estimates
   - Clients
   - Properties

3. Workflow Context
   - Workflow definitions
   - Executions
   - Approvals
   - Automations

4. Communication Context
   - Notifications
   - Email
   - SMS
   - Push notifications

5. AI Context
   - LLM interactions
   - RAG search
   - Embeddings
   - AI suggestions

6. File Management Context
   - Upload/download
   - Storage
   - CDN
   - Document processing

7. Analytics Context
   - Metrics collection
   - Reporting
   - Dashboards
   - Usage tracking
```

### 1.2 Service API Design

```yaml
# OpenAPI Specification Example

openapi: 3.0.0
info:
  title: Project Service API
  version: 1.0.0

paths:
  /projects:
    get:
      summary: List projects
      parameters:
        - name: company_id
          in: query
          required: true
          schema:
            type: string
        - name: status
          in: query
          schema:
            type: string
            enum: [Lead, Survey, Estimate, Approved, In Progress]
        - name: limit
          in: query
          schema:
            type: integer
            default: 50
        - name: cursor
          in: query
          schema:
            type: string
      
      responses:
        200:
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Project'
                  next_cursor:
                    type: string
                    nullable: true
    
    post:
      summary: Create project
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateProjectRequest'
      
      responses:
        201:
          description: Project created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Project'

components:
  schemas:
    Project:
      type: object
      properties:
        id:
          type: string
        company_id:
          type: string
        title:
          type: string
        client_id:
          type: string
        status:
          type: string
        created_date:
          type: string
          format: date-time
    
    CreateProjectRequest:
      type: object
      required:
        - title
        - client_id
      properties:
        title:
          type: string
        client_id:
          type: string
        property_id:
          type: string
```

---

## 2. Data Consistency Patterns

### 2.1 Saga Pattern for Distributed Transactions

```javascript
// Example: Project Creation Saga

class ProjectCreationSaga {
  constructor() {
    this.steps = [
      { action: this.createProject, compensate: this.deleteProject },
      { action: this.createChecklist, compensate: this.deleteChecklist },
      { action: this.notifyTeam, compensate: this.sendCancellation },
      { action: this.startOnboardingWorkflow, compensate: this.cancelWorkflow },
    ];
  }
  
  async execute(payload) {
    const executedSteps = [];
    
    try {
      for (const step of this.steps) {
        const result = await step.action(payload);
        executedSteps.push({ step, result });
      }
      
      return { success: true, results: executedSteps };
      
    } catch (error) {
      // Compensate in reverse order
      for (const executed of executedSteps.reverse()) {
        try {
          await executed.step.compensate(executed.result, payload);
        } catch (compensationError) {
          console.error('Compensation failed:', compensationError);
          // Alert operations team
        }
      }
      
      throw error;
    }
  }
  
  async createProject(payload) {
    const project = await base44.entities.Project.create({
      title: payload.title,
      client_id: payload.client_id,
      company_id: payload.company_id,
    });
    return { type: 'project', id: project.id };
  }
  
  async deleteProject(result) {
    await base44.entities.Project.delete(result.id);
  }
  
  async createChecklist(payload) {
    const checklist = await base44.entities.ChecklistItem.create({
      project_id: payload.project_id,
      title: 'Initial Setup',
      status: 'To Do',
    });
    return { type: 'checklist', id: checklist.id };
  }
  
  async deleteChecklist(result) {
    await base44.entities.ChecklistItem.delete(result.id);
  }
  
  async notifyTeam(payload) {
    await base44.integrations.Core.SendEmail({
      to: payload.team_email,
      subject: 'New Project Created',
      body: `Project ${payload.title} has been created.`,
    });
    return { type: 'notification', sent: true };
  }
  
  async sendCancellation() {
    await base44.integrations.Core.SendEmail({
      to: payload.team_email,
      subject: 'Project Creation Cancelled',
      body: 'Project creation was cancelled due to an error.',
    });
  }
  
  async startOnboardingWorkflow(payload) {
    await base44.functions.invoke('executeWorkflow', {
      workflow_name: 'Project Onboarding',
      trigger_data: { project_id: payload.project_id },
    });
    return { type: 'workflow', started: true };
  }
  
  async cancelWorkflow() {
    // Workflow cancellation logic
  }
}

// Usage
const saga = new ProjectCreationSaga();
const result = await saga.execute({
  title: 'New Project',
  client_id: 'client_123',
  company_id: 'comp_456',
  team_email: 'team@company.com',
});
```

### 2.2 Event Sourcing

```javascript
// Event Store for Project

class ProjectEventStore {
  async appendEvents(projectId, events) {
    for (const event of events) {
      await base44.entities.PlatformEvent.create({
        company_id: event.company_id,
        event_type: `project.${event.type}`,
        source: 'Project',
        source_id: projectId,
        severity: 'Info',
        payload: event.data,
        metadata: {
          event_id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          version: event.version,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
  
  async getProjectHistory(projectId) {
    const events = await base44.entities.PlatformEvent.filter({
      source_id: projectId,
      event_type: { $regex: '^project\\.' },
    });
    
    return events.sort((a, b) => 
      new Date(a.created_date) - new Date(b.created_date)
    );
  }
  
  async rebuildProjectState(projectId) {
    const events = await this.getProjectHistory(projectId);
    
    let state = {
      id: projectId,
      version: 0,
    };
    
    for (const event of events) {
      state = this.applyEvent(state, event);
    }
    
    return state;
  }
  
  applyEvent(state, event) {
    switch (event.event_type) {
      case 'project.created':
        return {
          ...state,
          ...event.payload,
          version: state.version + 1,
        };
      
      case 'project.updated':
        return {
          ...state,
          ...event.payload.changes,
          version: state.version + 1,
        };
      
      case 'project.status_changed':
        return {
          ...state,
          status: event.payload.new_status,
          version: state.version + 1,
        };
      
      default:
        return state;
    }
  }
}
```

---

## 3. Load Balancing Strategies

### 3.1 Client-Side Load Balancing

```javascript
class LoadBalancer {
  constructor(services) {
    this.services = services;
    this.currentIndex = 0;
  }
  
  // Round-robin
  selectRoundRobin() {
    const service = this.services[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.services.length;
    return service;
  }
  
  // Weighted random
  selectWeightedRandom() {
    const totalWeight = this.services.reduce((sum, s) => sum + s.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const service of this.services) {
      if (random < service.weight) {
        return service;
      }
      random -= service.weight;
    }
    
    return this.services[0];
  }
  
  // Least connections
  async selectLeastConnections() {
    const stats = await Promise.all(
      this.services.map(async (service) => {
        const response = await fetch(`${service.url}/health`);
        const health = await response.json();
        return { ...service, connections: health.active_connections };
      })
    );
    
    return stats.reduce((min, s) => 
      s.connections < min.connections ? s : min
    );
  }
  
  // Health-aware
  selectHealthy() {
    const healthy = this.services.filter(s => 
      s.status === 'healthy' && 
      Date.now() - s.last_health_check < 30000
    );
    
    if (healthy.length === 0) {
      throw new Error('No healthy services available');
    }
    
    return this.selectRoundRobin.call({ services: healthy });
  }
}

// Usage
const lb = new LoadBalancer([
  { url: 'http://service-1:3000', weight: 3, status: 'healthy' },
  { url: 'http://service-2:3000', weight: 3, status: 'healthy' },
  { url: 'http://service-3:3000', weight: 2, status: 'healthy' },
]);

const service = lb.selectWeightedRandom();
const response = await fetch(`${service.url}/api/endpoint`);
```

### 3.2 Sticky Sessions

```javascript
// Session affinity for stateful connections

const sessionStore = new Map();

function getStickySession(userId, availableServices) {
  const existingSession = sessionStore.get(userId);
  
  if (existingSession && availableServices.includes(existingSession)) {
    return existingSession;
  }
  
  // Assign to least loaded service
  const service = availableServices[Math.floor(Math.random() * availableServices.length)];
  sessionStore.set(userId, service);
  
  // Session expires after 30 minutes
  setTimeout(() => sessionStore.delete(userId), 30 * 60 * 1000);
  
  return service;
}
```

---

## 4. Rate Limiting

### 4.1 Token Bucket Algorithm

```javascript
class TokenBucket {
  constructor(capacity, refillRate) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRate; // tokens per second
    this.lastRefill = Date.now();
  }
  
  async consume(tokens = 1) {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return { allowed: true, remaining: this.tokens };
    }
    
    return { allowed: false, retry_after: this.getTimeUntilRefill(tokens) };
  }
  
  refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const newTokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRate);
    
    this.tokens = newTokens;
    this.lastRefill = now;
  }
  
  getTimeUntilRefill(tokens) {
    const needed = tokens - this.tokens;
    return Math.ceil(needed / this.refillRate * 1000);
  }
}

// Per-tenant rate limiters
const rateLimiters = new Map();

function getRateLimiter(companyId, tier) {
  if (!rateLimiters.has(companyId)) {
    const limits = {
      starter: { capacity: 100, refillRate: 10 },
      growth: { capacity: 500, refillRate: 50 },
      business: { capacity: 2000, refillRate: 200 },
      enterprise: { capacity: 10000, refillRate: 1000 },
    };
    
    rateLimiters.set(
      companyId,
      new TokenBucket(limits[tier].capacity, limits[tier].refillRate)
    );
  }
  
  return rateLimiters.get(companyId);
}

// Middleware
async function rateLimitMiddleware(req, res, next) {
  const company = await getCurrentCompany(req);
  const limiter = getRateLimiter(company.id, company.tier);
  
  const result = await limiter.consume();
  
  res.setHeader('X-RateLimit-Limit', limiter.capacity);
  res.setHeader('X-RateLimit-Remaining', result.remaining);
  
  if (!result.allowed) {
    res.setHeader('Retry-After', result.retry_after / 1000);
    return res.status(429).json({
      error: 'Rate limit exceeded',
      retry_after: result.retry_after,
    });
  }
  
  next();
}
```

### 4.2 Distributed Rate Limiting (Redis)

```javascript
class RedisRateLimiter {
  constructor(redis, key, capacity, windowSeconds) {
    this.redis = redis;
    this.key = `rate_limit:${key}`;
    this.capacity = capacity;
    this.window = windowSeconds;
  }
  
  async consume() {
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - (now % this.window);
    const windowKey = `${this.key}:${windowStart}`;
    
    const multi = this.redis.multi();
    multi.incr(windowKey);
    multi.expire(windowKey, this.window * 2);
    
    const results = await multi.exec();
    const current = results[0][1];
    
    if (current <= this.capacity) {
      return {
        allowed: true,
        remaining: this.capacity - current,
        reset: windowStart + this.window,
      };
    }
    
    return {
      allowed: false,
      remaining: 0,
      reset: windowStart + this.window,
      retry_after: (windowStart + this.window) - now,
    };
  }
}

// Usage
const limiter = new RedisRateLimiter(redis, 'company:comp_123', 1000, 60);
const result = await limiter.consume();

if (!result.allowed) {
  return Response.json(
    { error: 'Rate limit exceeded', retry_after: result.retry_after },
    { status: 429 }
  );
}
```

---

## 5. Health Checks & Monitoring

### 5.1 Comprehensive Health Checks

```javascript
// Health check endpoint

Deno.serve(async (req) => {
  if (!req.url.endsWith('/health')) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkRedis(),
    checkMessageQueue(),
    checkExternalServices(),
  ]);
  
  const results = {
    database: checks[0],
    redis: checks[1],
    message_queue: checks[2],
    external_services: checks[3],
  };
  
  const allHealthy = checks.every(c => c.status === 'fulfilled' && c.value.healthy);
  
  return Response.json({
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime_seconds: process.uptime(),
    checks: results,
  }, {
    status: allHealthy ? 200 : 503,
  });
});

async function checkDatabase() {
  const start = Date.now();
  
  try {
    await base44.entities.Company.list(1);
    const latency = Date.now() - start;
    
    return {
      healthy: latency < 1000,
      latency_ms: latency,
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
    };
  }
}

async function checkRedis() {
  const start = Date.now();
  
  try {
    await redis.ping();
    const latency = Date.now() - start;
    
    return {
      healthy: latency < 100,
      latency_ms: latency,
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
    };
  }
}

async function checkMessageQueue() {
  try {
    const stats = await messageQueue.getQueueStats('default');
    
    return {
      healthy: stats.queued < 10000,
      queue_depth: stats.queued,
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
    };
  }
}

async function checkExternalServices() {
  const services = [
    { name: 'LLM', url: Deno.env.get('LLM_API_URL') },
    { name: 'Email', url: Deno.env.get('EMAIL_API_URL') },
  ];
  
  const results = {};
  
  for (const service of services) {
    try {
      const response = await fetch(service.url, { method: 'HEAD', timeout: 5000 });
      results[service.name] = {
        healthy: response.ok,
        status_code: response.status,
      };
    } catch (error) {
      results[service.name] = {
        healthy: false,
        error: error.message,
      };
    }
  }
  
  return results;
}
```

### 5.2 Metrics Collection

```javascript
// Prometheus-style metrics

const metrics = {
  counters: new Map(),
  gauges: new Map(),
  histograms: new Map(),
  
  inc(name, labels = {}, value = 1) {
    const key = this.makeKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
  },
  
  set(name, labels = {}, value) {
    const key = this.makeKey(name, labels);
    this.gauges.set(key, value);
  },
  
  observe(name, labels = {}, value) {
    const key = this.makeKey(name, labels);
    if (!this.histograms.has(key)) {
      this.histograms.set(key, []);
    }
    this.histograms.get(key).push(value);
  },
  
  makeKey(name, labels) {
    const labelStr = Object.entries(labels)
      .sort()
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    
    return labelStr ? `${name}{${labelStr}}` : name;
  },
  
  toString() {
    let output = '';
    
    for (const [key, value] of this.counters) {
      output += `# TYPE ${key.split('{')[0]} counter\n`;
      output += `${key} ${value}\n`;
    }
    
    for (const [key, value] of this.gauges) {
      output += `# TYPE ${key.split('{')[0]} gauge\n`;
      output += `${key} ${value}\n`;
    }
    
    for (const [key, values] of this.histograms) {
      const baseName = key.split('{')[0];
      output += `# TYPE ${baseName} histogram\n`;
      output += `${baseName}_count{...} ${values.length}\n`;
      output += `${baseName}_sum{...} ${values.reduce((a, b) => a + b, 0)}\n`;
    }
    
    return output;
  },
};

// Usage
metrics.inc('api_requests_total', { 
  endpoint: '/projects', 
  method: 'GET',
  status: '200' 
});

metrics.observe('api_latency_ms', {
  endpoint: '/projects',
}, responseTime);

metrics.set('queue_depth', { queue: 'default' }, queueSize);

// Expose metrics endpoint
Deno.serve(async (req) => {
  if (req.url.endsWith('/metrics')) {
    return new Response(metrics.toString(), {
      headers: { 'Content-Type': 'text/plain' },
    });
  }
});
```

---

## 6. Deployment Strategies

### 6.1 Blue-Green Deployment

```yaml
# Kubernetes deployment example

apiVersion: apps/v1
kind: Deployment
metadata:
  name: project-service-blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: project-service
      version: blue
  template:
    metadata:
      labels:
        app: project-service
        version: blue
    spec:
      containers:
      - name: project-service
        image: codex/project-service:v2.1.0
        ports:
        - containerPort: 3000
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10

---
apiVersion: v1
kind: Service
metadata:
  name: project-service
spec:
  selector:
    app: project-service
    version: blue  # Switch to 'green' for deployment
  ports:
  - port: 80
    targetPort: 3000
```

### 6.2 Canary Deployment

```javascript
// Gradual traffic shifting

const canaryConfig = {
  currentVersion: 'v2.0.0',
  canaryVersion: 'v2.1.0',
  canaryPercentage: 10, // Start with 10% traffic
  incrementPercentage: 10,
  checkInterval: 300000, // 5 minutes
  successThreshold: 0.95, // 95% success rate required
};

function routeRequest(userId) {
  const hash = simpleHash(userId);
  
  if (hash % 100 < canaryConfig.canaryPercentage) {
    return canaryConfig.canaryVersion;
  }
  
  return canaryConfig.currentVersion;
}

async function monitorCanary() {
  const canaryMetrics = await getMetrics('v2.1.0');
  const baselineMetrics = await getMetrics('v2.0.0');
  
  const canarySuccessRate = canaryMetrics.success_rate;
  const baselineSuccessRate = baselineMetrics.success_rate;
  
  if (canarySuccessRate >= canaryConfig.successThreshold) {
    // Increase canary traffic
    canaryConfig.canaryPercentage = Math.min(
      100,
      canaryConfig.canaryPercentage + canaryConfig.incrementPercentage
    );
    
    if (canaryConfig.canaryPercentage >= 100) {
      // Canary successful, promote to production
      canaryConfig.currentVersion = canaryConfig.canaryVersion;
      canaryConfig.canaryPercentage = 0;
    }
  } else {
    // Canary failing, rollback
    canaryConfig.canaryPercentage = 0;
    await alertTeam('Canary deployment failed', { canarySuccessRate });
  }
}

// Monitor every 5 minutes
setInterval(monitorCanary, canaryConfig.checkInterval);
```

---

**Version:** 1.0.0  
**Last Updated:** 2026-05-27