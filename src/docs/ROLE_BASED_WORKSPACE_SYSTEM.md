# ROLE-BASED ENTERPRISE WORKSPACE SYSTEM

## Overview

Codex OS now provides **dedicated operational workspaces** for each user role, transforming from a one-size-fits-all interface into a multi-experience enterprise platform.

## Architecture

### Workspace Layer

A new abstraction layer sits between users and the core platform:

```
User → Workspace Context → Role-Based UX → Unified Backend
```

### Core Principles

1. **Unified Backend**: Single source of truth for all data
2. **Dedicated Experiences**: Each role gets optimized UX
3. **Contextual Navigation**: Only relevant tools shown
4. **Reduced Cognitive Load**: Hide unnecessary complexity
5. **Enterprise Organization**: Structured, premium feel

## Available Workspaces

### 1. Super Admin / Developer Workspace
**Color**: Purple (#7C3AED)

**For**: Platform administrators, developers

**Features**:
- Tenant management
- Platform analytics
- AI systems monitoring
- Workflow engine controls
- Integration hub
- Event bus observability
- Developer settings
- API key management
- System health monitoring

**Experience**: Powerful, technical, enterprise-grade

---

### 2. Executive Workspace
**Color**: Amber (#F59E0B)

**For**: Company owners, CEOs, executives

**Features**:
- Operational health dashboard
- Project portfolio overview
- Margin intelligence
- Financial overview
- AI operational signals
- Predictive risks
- Guardian performance
- Team performance metrics
- Strategic alerts

**Experience**: Strategic, decision-focused, high-level

---

### 3. Operations / Project Management Workspace
**Color**: Blue (#1147FF)

**For**: Project managers, operations managers

**Features**:
- Active projects dashboard
- Scheduling tools
- Task management
- Ticket system
- Field operations
- Delay detection
- Project risks
- Technician assignments
- Workflow bottlenecks
- AI recommendations

**Experience**: Fast, operational, highly actionable

---

### 4. Technician Workspace
**Color**: Emerald (#10B981)

**For**: Field technicians, installers

**Features**:
- Assigned projects ONLY
- Today's tasks
- Checklists
- Support tickets
- Navigation tools
- Photo upload
- Voice notes
- SOP access
- AI field assistant

**Hidden**: Financials, analytics, enterprise controls

**Experience**: Ultra-simple, touch-first, mobile-optimized, low-friction

---

### 5. Sales Workspace
**Color**: Orange (#F58020)

**For**: Sales team, estimators

**Features**:
- Lead pipeline
- Estimate management
- Follow-up tracking
- Customer communications
- AI estimate assistant
- Conversion analytics
- Guardian opportunities

**AI Assistance**:
- Estimate generation
- Pricing optimization
- Follow-up suggestions
- Upsell opportunities

**Experience**: Commercial, pipeline-focused, conversion-optimized

---

### 6. Financial Workspace
**Color**: Cyan (#06B6D4)

**For**: Financial managers, accountants

**Features**:
- Project profitability
- Cash flow analysis
- Overdue payments
- Margin analysis
- Supplier costs
- Forecast intelligence
- Financial alerts

**Hidden**: Operational clutter

**Experience**: Analytical, focused, numbers-first

---

### 7. Guardian Workspace
**Color**: Purple (#8B5CF6)

**For**: Guardian program managers

**Features**:
- Subscription management
- Property health scores
- Maintenance scheduling
- Warranty tracking
- Inspection planning
- Predictive insights
- Renewal opportunities

**Experience**: Proactive, intelligent, service-oriented

---

## Role-to-Workspace Mapping

| User Role | Available Workspaces | Default |
|-----------|---------------------|---------|
| `admin` | Super Admin, Executive, Operations, Financial, Guardian | Executive |
| `company_admin` | Executive, Operations, Financial, Sales, Guardian | Executive |
| `project_manager` | Operations, Financial | Operations |
| `technician` | Technician | Technician |
| `sales` | Sales | Sales |

---

## Workspace Switching

Authorized users can switch between available workspaces:

1. Click workspace switcher in header
2. Select desired workspace
3. Instant context switch
4. Preference saved per user

**Audit Logging**: All workspace switches logged for compliance

---

## Implementation Details

### Components Created

```
components/workspace/
├── WorkspaceContext.jsx      # Context provider & hooks
├── WorkspaceSwitcher.jsx     # UI dropdown
├── SuperAdminWorkspace.jsx   # Platform controls
├── ExecutiveWorkspace.jsx    # Strategic oversight
├── OperationsWorkspace.jsx   # Project coordination
├── TechnicianWorkspace.jsx   # Field operations
├── SalesWorkspace.jsx        # Commercial pipeline
├── FinancialWorkspace.jsx    # Financial ops
└── GuardianWorkspace.jsx     # Lifecycle management

pages/
└── WorkspaceRouter.jsx       # Route-based workspace selection
```

### Context API

```javascript
const { 
  currentWorkspace, 
  userRole, 
  availableWorkspaces, 
  config, 
  switchWorkspace 
} = useWorkspace();
```

### Local Storage

Workspace preference persisted per user:
```javascript
localStorage.setItem(`workspace_${user.email}`, workspaceId);
```

---

## UX Design Principles

### Visual Identity

Each workspace has:
- Unique color scheme
- Dedicated icon
- Custom gradient hero
- Role-specific messaging

### Information Architecture

**Show**:
- Role-relevant KPIs
- Contextual quick actions
- Dedicated tool modules
- Operational focus areas

**Hide**:
- Unrelated menus
- Irrelevant financials
- Cross-role features
- Cognitive overload

### Mobile Optimization

Technician workspace specifically designed for:
- Large touch targets (48px+)
- Simplified navigation
- Offline capability
- Quick photo/voice capture
- Minimal scrolling

---

## AI Adaptation by Workspace

### Technician AI
- SOP retrieval
- Troubleshooting guidance
- Quick summaries
- Checklists

### Executive AI
- Risk alerts
- Profitability insights
- Strategic recommendations
- High-level summaries

### Sales AI
- Estimate generation
- Follow-up automation
- Upsell detection
- Pricing optimization

### Operations AI
- Scheduling optimization
- Resource allocation
- Delay prediction
- Bottleneck detection

---

## Governance & Security

### Access Control

- Workspace access enforced by role
- Cross-workspace switching restricted
- Audit logging enabled
- No privilege escalation

### Data Consistency

- Unified backend prevents fragmentation
- Real-time sync across workspaces
- Single source of truth maintained

---

## Future Enhancements

### Planned
1. **Workspace Personalization**
   - Pin tools
   - Custom layouts
   - Saved filters
   - Widget reordering

2. **Client Workspace**
   - Premium portal experience
   - Project timeline
   - Document access
   - AI summaries

3. **Guardian Customer Workspace**
   - Property health dashboard
   - Maintenance timeline
   - Warranty tracking
   - Renewal management

4. **Advanced Impersonation**
   - Admin can view as other roles
   - Customer support mode
   - Training mode

---

## Enterprise UX Inspiration

This system draws from:
- **Salesforce**: Role-based clouds
- **ServiceNow**: Operational workspaces
- **Linear**: Focused, contextual UX
- **Palantir**: Intelligence dashboards
- **Monday.com**: Role-aware views

---

## Success Metrics

Measure:
- Role adoption rate
- Time-to-task completion
- User satisfaction by role
- Feature discovery rate
- Cognitive load reduction
- Mobile adoption (technicians)

---

## Conclusion

The Role-Based Workspace System transforms Codex OS from a generic platform into a **multi-experience enterprise operating system** where every user experiences an environment optimized for their specific responsibilities.

This is enterprise UX at scale: unified backend, dedicated experiences, operational clarity.