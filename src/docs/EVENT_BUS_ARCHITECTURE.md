# Codex OS - Cross-Module Event Bus Architecture

## Overview

Codex OS implements an internal event bus for loose coupling between modules. All cross-module communication happens through events instead of direct dependencies, enabling scalability, maintainability, and extensibility.

---

## 1. Core Principles

### 1.1 Event-Driven Architecture

**Benefits:**
- **Loose Coupling**: Modules don't depend on each other directly
- **Scalability**: Easy to add new event handlers without modifying existing code
- **Audit Trail**: All events are logged for debugging and compliance
- **Extensibility**: Third-party extensions can subscribe to events
- **Resilience**: Event handlers can fail independently without cascading failures

### 1.2 Event Flow

```
[Event Producer] → [Event Bus] → [Event Handlers]
     ↓                              ↓
[PlatformEvent]              [Workflow Execution]
recorded                     [Notification Sent]
                             [AI Analysis]
                             [External Webhook]
```

---

## 2. Event Categories

### 2.1 Entity Lifecycle Events

**Pattern:** `{entity}.{action}`

| Event | Trigger | Example Use Cases |
|-------|---------|-------------------|
| `project.created` | New project created | AI analysis, workflow start, notification |
| `project.updated` | Project modified | Timeline update, client notification |
| `project.status_changed` | Status field changed | Guardian monitoring, workflow trigger |
| `project.delivered` | Status = "Delivered" | Home Passport generation, satisfaction survey |
| `estimate.created` | New estimate | AI pricing review, follow-up scheduling |
| `estimate.sent` | Estimate sent to client | Follow-up automation, CRM sync |
| `estimate.accepted` | Client accepts estimate | Project creation, deposit invoice |
| `estimate.rejected` | Client rejects estimate | Feedback collection, win/loss analysis |
| `ticket.created` | New support ticket | Technician assignment, SLA tracking |
| `ticket.priority_changed` | Priority modified | Escalation, notification |
| `ticket.resolved` | Ticket resolved | Guardian billing, satisfaction survey |
| `guardian.created` | New subscription | Onboarding workflow, device setup |
| `guardian.renewed` | Subscription renewed | Payment processing, welcome email |
| `guardian.expiring` | Expiring soon (30 days) | Renewal reminder, retention offer |
| `guardian.cancelled` | Subscription cancelled | Exit survey, data archival |
| `property.updated` | Property details changed | Home Passport update, re-indexing |
| `client.created` | New client | Welcome email, CRM sync |
| `document.expiring` | Document near expiry | Renewal reminder, compliance alert |

---

### 2.2 Financial Events

| Event | Trigger | Example Use Cases |
|-------|---------|-------------------|
| `financial.alert` | Budget threshold exceeded | CFO notification, spending review |
| `payment.received` | Payment collected | Invoice marking, receipt email |
| `payment.overdue` | Payment overdue | Dunning email, late fee |
| `invoice.created` | Invoice generated | Email delivery, accounting sync |
| `invoice.sent` | Invoice sent to client | Payment reminder scheduling |
| `cost.recorded` | Project cost logged | Margin recalculation, alert if over budget |
| `budget.exceeded` | Budget threshold crossed | Approval workflow, notification |

---

### 2.3 Workflow Events

| Event | Trigger | Example Use Cases |
|-------|---------|-------------------|
| `workflow.started` | Workflow execution begins | Audit log, monitoring |
| `workflow.completed` | All steps completed | Success notification, cleanup |
| `workflow.failed` | Step failure | Alert to admin, retry logic |
| `workflow.approval_required` | Approval step reached | Notify approver, SLA tracking |
| `workflow.approved` | Approval granted | Continue execution, audit log |
| `workflow.rejected` | Approval denied | Notify requester, escalation |

---

### 2.4 AI Events

| Event | Trigger | Example Use Cases |
|-------|---------|-------------------|
| `ai.analysis.completed` | AI finishes analysis | Store insights, notify user |
| `ai.suggestion.generated` | AI makes suggestion | Present to user, A/B test |
| `ai.action.executed` | AI-triggered action completed | Audit log, user notification |
| `ai.anomaly.detected` | AI detects anomaly | Alert, create ticket |
| `ai.memory.saved` | Memory stored | Index for RAG, update knowledge |
| `ai.rag.query` | RAG search performed | Log for analytics, improve indexing |

---

### 2.5 Integration Events

| Event | Trigger | Example Use Cases |
|-------|---------|-------------------|
| `integration.synced` | External sync completed | Update last_sync, notify user |
| `integration.failed` | Sync failure | Alert, retry scheduling |
| `webhook.triggered` | Webhook sent | Log delivery, handle response |
| `webhook.delivered` | Webhook acknowledged | Mark as successful |
| `webhook.failed` | Webhook delivery failed | Retry, alert admin |

---

### 2.6 System Events

| Event | Trigger | Example Use Cases |
|-------|---------|-------------------|
| `user.login` | User logs in | Audit log, session tracking |
| `user.logout` | User logs out | Session cleanup |
| `user.role_changed` | User role modified | Permission update, notification |
| `company.subscription_changed` | Plan changed | Feature toggle, billing update |
| `quota.exceeded` | Usage quota exceeded | Block actions, upgrade prompt |
| `system.maintenance` | Scheduled maintenance | Notify users, graceful shutdown |

---

## 3. PlatformEvent Entity (Extended)

```json
{
  "name": "PlatformEvent",
  "type": "object",
  "properties": {
    "company_id": { "type": "string" },
    "event_type": {
      "type": "string",
      "enum": [
        "project.created",
        "project.updated",
        "project.status_changed",
        "project.delivered",
        "estimate.created",
        "estimate.sent",
        "estimate.accepted",
        "estimate.rejected",
        "ticket.created",
        "ticket.priority_changed",
        "ticket.resolved",
        "guardian.created",
        "guardian.renewed",
        "guardian.expiring",
        "guardian.cancelled",
        "property.updated",
        "client.created",
        "document.expiring",
        "financial.alert",
        "payment.received",
        "payment.overdue",
        "invoice.created",
        "invoice.sent",
        "cost.recorded",
        "budget.exceeded",
        "workflow.started",
        "workflow.completed",
        "workflow.failed",
        "workflow.approval_required",
        "workflow.approved",
        "workflow.rejected",
        "ai.analysis.completed",
        "ai.suggestion.generated",
        "ai.action.executed",
        "ai.anomaly.detected",
        "integration.synced",
        "integration.failed",
        "webhook.triggered",
        "webhook.delivered",
        "webhook.failed",
        "user.login",
        "user.logout",
        "user.role_changed",
        "company.subscription_changed",
        "quota.exceeded",
        "system.maintenance",
        "custom"
      ]
    },
    "source": { "type": "string" },
    "source_id": { "type": "string" },
    "payload": { "type": "object" },
    "severity": {
      "type": "string",
      "enum": ["Info", "Warning", "Error", "Critical"]
    },
    "processed": { "type": "boolean" },
    "processed_at": { "type": "string" },
    "subscribers_notified": { "type": "number" },
    "handlers_executed": { "type": "number" },
    "handlers_failed": { "type": "number" },
    "processing_time_ms": { "type": "number" },
    "retry_count": { "type": "number" },
    "error_message": { "type": "string" },
    "metadata": {
      "type": "object",
      "properties": {
        "user_email": { "type": "string" },
        "ip_address": { "type": "string" },
        "user_agent": { "type": "string" },
        "correlation_id": { "type": "string" },
        "trace_id": { "type": "string" }
      }
    }
  },
  "required": ["event_type", "source", "source_id"]
}
```

---

## 4. Event Bus Implementation

### 4.1 Event Publishing

```javascript
// lib/eventBus.js

export class EventBus {
  constructor() {
    this.subscribers = new Map();
  }

  /**
   * Publish an event to the bus
   * @param {string} eventType - e.g., 'project.created'
   * @param {object} payload - Event data
   * @param {object} context - Additional context (user, company, etc.)
   */
  async publish(eventType, payload, context = {}) {
    const event = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: eventType,
      payload,
      context,
      timestamp: new Date().toISOString(),
      correlationId: context.correlationId || `corr_${Date.now()}`,
    };

    // Persist event to PlatformEvent entity
    await this.persistEvent(event);

    // Notify all subscribers asynchronously
    const subscribers = this.getSubscribers(eventType);
    const promises = subscribers.map(handler => 
      this.executeHandler(handler, event).catch(err => {
        console.error(`Handler failed for ${eventType}:`, err);
        // Log failure but don't block other handlers
      })
    );

    await Promise.allSettled(promises);

    // Update event with processing stats
    await this.updateEventStats(event.id, {
      subscribers_notified: subscribers.length,
      processed: true,
      processed_at: new Date().toISOString(),
    });

    return event;
  }

  /**
   * Subscribe to an event type
   * @param {string} eventType - Event to subscribe to
   * @param {function} handler - Async handler function
   * @param {object} options - Subscription options
   */
  subscribe(eventType, handler, options = {}) {
    const subscribers = this.subscribers.get(eventType) || [];
    subscribers.push({
      handler,
      priority: options.priority || 0,
      filter: options.filter, // Optional filter function
      retry: options.retry || { max: 3, delay: 1000 },
    });
    this.subscribers.set(eventType, subscribers);
  }

  async executeHandler(subscriber, event) {
    // Apply filter if present
    if (subscriber.filter && !subscriber.filter(event)) {
      return;
    }

    // Execute with retry logic
    let lastError;
    for (let attempt = 1; attempt <= subscriber.retry.max; attempt++) {
      try {
        await subscriber.handler(event);
        return; // Success
      } catch (error) {
        lastError = error;
        if (attempt < subscriber.retry.max) {
          await this.sleep(subscriber.retry.delay * attempt);
        }
      }
    }

    throw lastError;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const eventBus = new EventBus();
```

---

### 4.2 Event Registration

```javascript
// lib/eventRegistry.js

import { eventBus } from './eventBus';

// Register all event handlers on app startup
export function registerEventHandlers() {
  // Project Events
  eventBus.subscribe('project.created', handleProjectCreated, { priority: 10 });
  eventBus.subscribe('project.status_changed', handleProjectStatusChanged);
  eventBus.subscribe('project.delivered', handleProjectDelivered);

  // Estimate Events
  eventBus.subscribe('estimate.accepted', handleEstimateAccepted, { priority: 10 });
  eventBus.subscribe('estimate.rejected', handleEstimateRejected);

  // Ticket Events
  eventBus.subscribe('ticket.created', handleTicketCreated);
  eventBus.subscribe('ticket.priority_changed', handleTicketPriorityChanged);
  eventBus.subscribe('ticket.resolved', handleTicketResolved);

  // Guardian Events
  eventBus.subscribe('guardian.expiring', handleGuardianExpiring);
  eventBus.subscribe('guardian.cancelled', handleGuardianCancelled);

  // Financial Events
  eventBus.subscribe('payment.received', handlePaymentReceived);
  eventBus.subscribe('payment.overdue', handlePaymentOverdue);
  eventBus.subscribe('financial.alert', handleFinancialAlert);

  // Workflow Events
  eventBus.subscribe('workflow.completed', handleWorkflowCompleted);
  eventBus.subscribe('workflow.failed', handleWorkflowFailed);

  // AI Events
  eventBus.subscribe('ai.anomaly.detected', handleAIAnomaly);
  eventBus.subscribe('ai.analysis.completed', handleAIAnalysisCompleted);
}
```

---

## 5. Example Event Handlers

### 5.1 AI Reacts to Workflows

```javascript
// handlers/ai/workflowHandlers.js

import { base44 } from '@/api/base44Client';

export async function handleWorkflowCompleted(event) {
  const { workflow_id, execution_id, entity_type, entity_id } = event.payload;

  // AI analyzes workflow execution for optimization opportunities
  const analysis = await base44.functions.invoke('generateContextualSuggestions', {
    context_type: 'workflow_execution',
    context_id: execution_id,
    analysis_type: 'optimization',
  });

  if (analysis.suggestions && analysis.suggestions.length > 0) {
    // Store AI insights
    await base44.entities.IntelligenceInsight.create({
      company_id: event.context.company_id,
      source_type: 'workflow_optimization',
      source_id: execution_id,
      insight_type: 'optimization',
      title: 'Workflow Optimization Opportunities',
      description: JSON.stringify(analysis.suggestions),
      confidence_score: analysis.confidence,
    });

    // Notify workflow owner
    await base44.functions.invoke('notifyProjectStatusChanged', {
      project_id: entity_id,
      notification_type: 'ai_suggestion',
      message: `AI found ${analysis.suggestions.length} optimization opportunities for your workflow`,
    });
  }
}

export async function handleWorkflowFailed(event) {
  const { workflow_id, error_message, step_id } = event.payload;

  // AI analyzes failure pattern
  const analysis = await base44.functions.invoke('generateContextualSuggestions', {
    context_type: 'workflow_failure',
    context_id: workflow_id,
    analysis_type: 'root_cause',
    error_context: error_message,
  });

  // Create high-priority alert
  await base44.entities.PlatformEvent.create({
    company_id: event.context.company_id,
    event_type: 'workflow.failed',
    source: 'workflow_engine',
    source_id: workflow_id,
    severity: 'Error',
    payload: {
      error: error_message,
      step_id,
      ai_analysis: analysis,
    },
  });
}
```

---

### 5.2 Workflows React to Tickets

```javascript
// handlers/workflows/ticketHandlers.js

import { base44 } from '@/api/base44Client';

export async function handleTicketCreated(event) {
  const { ticket_id, issue_type, priority, property_id } = event.payload;

  // Auto-assign based on issue type and technician availability
  const assignment = await base44.functions.invoke('generateContextualSuggestions', {
    context_type: 'ticket_assignment',
    context_id: ticket_id,
    analysis_type: 'resource_allocation',
  });

  if (assignment.assigned_technician) {
    await base44.entities.SupportTicket.update(ticket_id, {
      assigned_technician: assignment.assigned_technician,
    });
  }

  // Start appropriate workflow based on issue type
  if (priority === 'Urgent' || issue_type === 'Water Leak') {
    await base44.functions.invoke('executeWorkflow', {
      workflow_name: 'Emergency Response',
      trigger_type: 'entity_event',
      trigger_data: {
        entity_type: 'SupportTicket',
        entity_id: ticket_id,
      },
    });
  } else if (issue_type === 'Maintenance') {
    await base44.functions.invoke('executeWorkflow', {
      workflow_name: 'Standard Maintenance Request',
      trigger_type: 'entity_event',
      trigger_data: {
        entity_type: 'SupportTicket',
        entity_id: ticket_id,
      },
    });
  }

  // Send immediate acknowledgment to client
  await base44.integrations.Core.SendEmail({
    to: event.context.client_email,
    subject: `Ticket Created: ${event.payload.title}`,
    body: `Your support ticket has been created and assigned priority ${priority}. We'll respond within 24 hours.`,
  });
}

export async function handleTicketPriorityChanged(event) {
  const { ticket_id, old_priority, new_priority } = event.payload;

  // Escalate if priority increased to Urgent
  if (new_priority === 'Urgent' && old_priority !== 'Urgent') {
    await base44.functions.invoke('executeWorkflow', {
      workflow_name: 'Ticket Escalation',
      trigger_type: 'entity_event',
      trigger_data: {
        entity_type: 'SupportTicket',
        entity_id: ticket_id,
      },
    });

    // Notify manager
    await base44.entities.PlatformEvent.create({
      company_id: event.context.company_id,
      event_type: 'ticket.priority_changed',
      source: 'SupportTicket',
      source_id: ticket_id,
      severity: 'Warning',
      payload: {
        old_priority,
        new_priority,
        action: 'escalated_to_manager',
      },
    });
  }
}
```

---

### 5.3 Guardian Reacts to Home Passport

```javascript
// handlers/guardian/propertyHandlers.js

import { base44 } from '@/api/base44Client';

export async function handlePropertyUpdated(event) {
  const { property_id, changes } = event.payload;

  // Check if property has active Guardian subscription
  const subscriptions = await base44.entities.GuardianSubscription.filter({
    property_id,
    status: 'Active',
  });

  if (subscriptions.length === 0) {
    return; // No Guardian subscription, skip
  }

  // If interventions were added, analyze for maintenance needs
  if (changes.interventions) {
    const property = await base44.entities.Property.filter({ id: property_id });
    const analysis = await base44.functions.invoke('generateContextualSuggestions', {
      context_type: 'property_interventions',
      context_id: property_id,
      analysis_type: 'maintenance_planning',
      property_data: property[0],
    });

    if (analysis.recommendations && analysis.recommendations.length > 0) {
      // Create maintenance schedule entries
      for (const rec of analysis.recommendations) {
        await base44.entities.MaintenanceSchedule.create({
          company_id: event.context.company_id,
          property_id,
          guardian_subscription_id: subscriptions[0].id,
          maintenance_type: rec.type,
          description: rec.description,
          scheduled_date: rec.suggested_date,
          priority: rec.priority || 'Medium',
          status: 'scheduled',
        });
      }

      // Notify Guardian team
      await base44.entities.PlatformEvent.create({
        company_id: event.context.company_id,
        event_type: 'guardian.maintenance_scheduled',
        source: 'Property',
        source_id: property_id,
        severity: 'Info',
        payload: {
          subscription_id: subscriptions[0].id,
          recommendations_count: analysis.recommendations.length,
        },
      });
    }
  }
}
```

---

### 5.4 Notifications React to Events

```javascript
// handlers/notifications/eventHandlers.js

import { base44 } from '@/api/base44Client';

// Generic notification handler for all events
export async function handleEventNotification(event) {
  const { event_type, payload, context } = event;

  // Get notification preferences for affected users
  const preferences = await base44.entities.Notification.find({
    company_id: context.company_id,
    user_email: context.user_email,
  });

  // Check if user wants this type of notification
  const notificationConfig = preferences?.find(p => 
    p.event_types?.includes(event_type)
  );

  if (!notificationConfig || !notificationConfig.enabled) {
    return; // User doesn't want this notification
  }

  // Send notification through preferred channels
  const channels = notificationConfig.channels || ['push'];

  if (channels.includes('push')) {
    await sendPushNotification(context.user_email, {
      title: getNotificationTitle(event_type),
      body: getNotificationBody(event_type, payload),
      data: { event_type, source_id: payload.source_id },
    });
  }

  if (channels.includes('email')) {
    await base44.integrations.Core.SendEmail({
      to: context.user_email,
      subject: getNotificationTitle(event_type),
      body: getNotificationBody(event_type, payload, true),
    });
  }

  if (channels.includes('sms')) {
    // SMS integration (future)
    await sendSMS(context.user_phone, getNotificationBody(event_type, payload, false));
  }
}

function getNotificationTitle(eventType) {
  const titles = {
    'project.created': 'New Project Created',
    'estimate.accepted': 'Estimate Accepted!',
    'ticket.created': 'New Support Ticket',
    'payment.received': 'Payment Received',
    'guardian.expiring': 'Guardian Subscription Expiring',
    'workflow.completed': 'Workflow Completed',
  };
  return titles[eventType] || 'Notification';
}

function getNotificationBody(eventType, payload, long = false) {
  const bodies = {
    'project.created': `Project "${payload.title}" has been created.`,
    'estimate.accepted': `Great news! Your estimate for ${payload.title} has been accepted.`,
    'ticket.created': `New ticket: ${payload.title} (Priority: ${payload.priority})`,
    'payment.received': `Payment of €${payload.amount} received successfully.`,
    'guardian.expiring': `Your Guardian subscription expires in 30 days. Renew now to continue protection.`,
    'workflow.completed': `Workflow "${payload.workflow_name}" completed successfully.`,
  };
  return bodies[eventType] || 'Event notification';
}
```

---

## 6. Event Subscriptions Entity

```json
{
  "name": "EventSubscription",
  "type": "object",
  "properties": {
    "company_id": { "type": "string" },
    "name": { "type": "string" },
    "event_types": {
      "type": "array",
      "items": { "type": "string" }
    },
    "handler_type": {
      "type": "string",
      "enum": ["backend_function", "webhook", "workflow", "notification"]
    },
    "handler_config": {
      "type": "object",
      "properties": {
        "function_name": { "type": "string" },
        "webhook_url": { "type": "string" },
        "workflow_id": { "type": "string" },
        "notification_channels": { "type": "array" }
      }
    },
    "filter_conditions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "field": { "type": "string" },
          "operator": { "type": "string" },
          "value": {}
        }
      }
    },
    "status": {
      "type": "string",
      "enum": ["Active", "Inactive", "Error"]
    },
    "execution_count": { "type": "number" },
    "failure_count": { "type": "number" },
    "last_executed": { "type": "string" },
    "created_by": { "type": "string" }
  },
  "required": ["name", "event_types", "handler_type"]
}
```

---

## 7. Event Publishing Examples

### 7.1 Publishing from Entity Automation

```javascript
// functions/entityEventPublisher.js

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    // Map entity event to platform event
    const eventType = `${event.entity_name}.${event.type}`;

    // Publish to event bus
    await base44.entities.PlatformEvent.create({
      company_id: data.company_id,
      event_type: eventType,
      source: event.entity_name,
      source_id: event.entity_id,
      severity: 'Info',
      payload: {
        ...data,
        old_data,
        changed_fields: Object.keys(data).filter(k => 
          old_data && data[k] !== old_data[k]
        ),
      },
      metadata: {
        user_email: data.created_by,
        correlation_id: `evt_${event.entity_id}_${Date.now()}`,
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
```

### 7.2 Publishing from Backend Function

```javascript
// In any backend function

import { base44 } from '@/api/base44Client';

// After completing an operation
await base44.entities.PlatformEvent.create({
  company_id: company.id,
  event_type: 'estimate.accepted',
  source: 'Estimate',
  source_id: estimate.id,
  severity: 'Info',
  payload: {
    estimate_id: estimate.id,
    client_id: estimate.client_id,
    value: estimate.revenue,
    accepted_at: new Date().toISOString(),
  },
});
```

---

## 8. Event Monitoring & Debugging

### 8.1 Event Dashboard

**Metrics to Track:**
- Events published per hour/day
- Average processing time per event type
- Handler success/failure rates
- Most active event types
- Slowest handlers
- Retry rates

### 8.2 Event Replay

For debugging and recovery:

```javascript
// Replay failed events
async function replayEvent(eventId) {
  const event = await base44.entities.PlatformEvent.filter({ id: eventId });
  
  if (!event || event.length === 0) {
    throw new Error('Event not found');
  }

  // Re-execute all handlers
  const subscribers = eventBus.getSubscribers(event[0].event_type);
  await Promise.all(
    subscribers.map(handler => 
      eventBus.executeHandler(handler, event[0])
    )
  );
}
```

---

## 9. Implementation Roadmap

### Phase 1: Core Infrastructure (Q3 2026)
- [ ] PlatformEvent entity (extended)
- [ ] EventBus library
- [ ] Event registry
- [ ] Basic event publishing
- [ ] Entity automation integration

### Phase 2: Handler Implementation (Q4 2026)
- [ ] AI reaction handlers
- [ ] Workflow reaction handlers
- [ ] Guardian reaction handlers
- [ ] Notification handlers
- [ ] Financial alert handlers

### Phase 3: Advanced Features (Q1 2027)
- [ ] Event subscriptions UI
- [ ] Event monitoring dashboard
- [ ] Event replay functionality
- [ ] Custom event handlers (user-defined)
- [ ] Webhook subscriptions (external)

### Phase 4: Optimization (Q2 2027)
- [ ] Performance optimization
- [ ] Event prioritization
- [ ] Rate limiting
- [ ] Circuit breaker pattern
- [ ] Advanced filtering

---

## 10. Best Practices

### 10.1 Event Design

**DO:**
- Use clear, descriptive event names (`entity.action` pattern)
- Include all relevant context in payload
- Keep events immutable (don't modify after publishing)
- Use correlation IDs for tracing
- Log all events for audit trail

**DON'T:**
- Include sensitive data in events (passwords, tokens)
- Make events too large (keep under 1MB)
- Synchronous event handling (always async)
- Circular event dependencies (A triggers B triggers A)

### 10.2 Handler Design

**DO:**
- Make handlers idempotent (safe to retry)
- Handle errors gracefully
- Use retry logic with exponential backoff
- Keep handlers focused and small
- Log handler execution

**DON'T:**
- Perform long-running operations directly (use workflows)
- Block event publishing
- Have side effects outside handler scope
- Depend on handler execution order

---

**Version:** 1.0.0  
**Status:** Architecture Ready  
**Last Updated:** 2026-05-27