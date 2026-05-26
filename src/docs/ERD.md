# Entity Relationship Diagram (ERD)
## Codex Solution - Database Schema

**Last Updated:** 2026-05-26  
**Status:** ✅ NORMALIZED - NO DUPLICATES

---

## Core Entities

### **Client**
*Primary customer entity*

```
Client {
  id: string (PK)
  name: string
  company_name: string
  email: string (UNIQUE)
  phone: string
  address: string
  type: enum [Private, Business, Public Administration, Partner]
  source: enum [Referral, Google, Social, Partner, Existing Client]
  notes: string
  created_date: datetime
  updated_date: datetime
  created_by: string
}
```

**Relationships:**
- 1:N → Property (client_id)
- 1:N → Estimate (client_id)
- 1:N → Project (client_id)
- 1:N → GuardianSubscription (client_id)
- 1:N → SupportTicket (client_id)
- 1:N → Document (client_id)

---

### **Property**
*Real estate / building entity*

```
Property {
  id: string (PK)
  property_name: string
  client_id: string (FK → Client)
  address: string
  type: enum [Apartment, Villa, Office, Industrial Building, Commercial Space]
  square_meters: number
  year_built: number
  electrical_notes: string
  plumbing_notes: string
  heating_cooling_notes: string
  networking_notes: string
  security_notes: string
  windows_doors_notes: string
  photos: string[] (URLs)
  floor_plans: string[] (URLs)
  documents: string[] (URLs)
  interventions: object[] (timeline)
  created_date: datetime
  updated_date: datetime
  created_by: string
}
```

**Relationships:**
- N:1 → Client (client_id)
- 1:N → Estimate (property_id)
- 1:N → Project (property_id)
- 1:N → GuardianSubscription (property_id)
- 1:N → SupportTicket (property_id)
- 1:N → Document (property_id)

---

### **Estimate**
*Project quote / proposal*

```
Estimate {
  id: string (PK)
  title: string
  client_id: string (FK → Client)
  property_id: string (FK → Property)
  status: enum [Draft, To Review, Sent, Accepted, Rejected, Expired, Converted to Project, Archived]
  estimate_type: enum [Bathroom, Full Home, Electrical System, Networking, Security, Roofing, Maintenance, Other]
  quality_level: enum [Essential, Smart, Intelligence]
  
  // Property details
  square_meters: number
  number_of_bathrooms: number
  number_of_rooms: number
  property_type: enum [Apartment, Villa, Office, Industrial Building, Commercial Space]
  location: string
  
  // Financial
  revenue: number
  material_cost: number
  labor_cost: number
  equipment_cost: number
  subcontractor_cost: number
  other_costs: number
  total_costs: number
  gross_margin: number
  gross_margin_pct: number
  
  // Project details
  estimated_duration: string
  project_summary: string
  included_works: string
  excluded_works: string
  assumptions: string
  payment_terms: string
  warranty_notes: string
  
  // Tracking
  follow_up_date: string
  expiry_date: string
  rejection_reason: enum [Price too high, Timing, Chose another company, Project postponed, Other]
  rejection_notes: string
  client_comments: string
  notes: string
  
  // Signature
  signature_url: string (URL)
  signed_at: datetime
  
  // Media
  survey_photos: string[] (URLs)
  
  created_date: datetime
  updated_date: datetime
  created_by: string
}
```

**Relationships:**
- N:1 → Client (client_id)
- N:1 → Property (property_id)
- 1:1 → Project (estimate_id in Project)

---

### **Project**
*Active construction / service project*

```
Project {
  id: string (PK)
  title: string
  client_id: string (FK → Client)
  property_id: string (FK → Property)
  estimate_id: string (FK → Estimate, nullable)
  status: enum [Lead, Survey, Estimate, Approved, In Progress, Testing, Delivered, Guardian Active, Archived]
  
  // Team
  project_manager: string (email)
  team_members: string[] (emails)
  
  // Timeline
  start_date: string
  expected_end_date: string
  actual_end_date: string
  estimated_duration: string
  
  // Financial
  contract_value: number
  approved_variations: number (default: 0)
  total_invoiced: number (default: 0)
  total_collected: number (default: 0)
  material_costs: number
  labor_costs: number
  other_costs: number
  
  // Metadata
  estimate_type: string
  quality_level: string
  
  // Media
  photos_before: object[] (URLs + metadata)
  photos_during: object[] (URLs + metadata)
  photos_after: object[] (URLs + metadata)
  documents: string[] (URLs)
  
  // Milestones
  milestones: object[]
  
  notes: string
  
  created_date: datetime
  updated_date: datetime
  created_by: string
}
```

**Relationships:**
- N:1 → Client (client_id)
- N:1 → Property (property_id)
- N:1 → Estimate (estimate_id)
- 1:N → ChecklistItem (project_id)
- 1:N → ProjectCost (project_id)
- 1:N → Timesheet (project_id)
- 1:N → PurchaseOrder (project_id)
- 1:N → Document (project_id)
- 1:N → KnowledgeBase (project_id)
- 1:N → ProjectLearning (project_id)

---

### **Home Passport** (Property Technical Dossier)
*NOT a separate entity - uses Property entity with interventions array*

```
Property.interventions: [
  {
    date: string,
    type: string,
    description: string,
    technician: string,
    notes: string,
    photos: string[],
    documents: string[]
  }
]
```

**Implementation:** Home Passport functionality is embedded in Property entity through:
- `electrical_notes`
- `plumbing_notes`
- `heating_cooling_notes`
- `networking_notes`
- `security_notes`
- `windows_doors_notes`
- `interventions` array (timeline)
- `photos` array
- `floor_plans` array
- `documents` array

---

## Service Entities

### **GuardianSubscription**
*Ongoing maintenance / monitoring service*

```
GuardianSubscription {
  id: string (PK)
  client_id: string (FK → Client)
  property_id: string (FK → Property, nullable)
  start_date: string
  monthly_price: number
  status: enum [Active, Paused, Cancelled]
  included_services: string
  notes: string
  
  created_date: datetime
  updated_date: datetime
  created_by: string
}
```

**Relationships:**
- N:1 → Client (client_id)
- N:1 → Property (property_id)
- 1:N → SupportTicket (guardian_id)

---

### **SupportTicket**
*Customer support request*

```
SupportTicket {
  id: string (PK)
  title: string
  client_id: string (FK → Client)
  property_id: string (FK → Property, nullable)
  guardian_id: string (FK → GuardianSubscription, nullable)
  issue_type: enum [Water Leak, Electrical, Network, Security, Maintenance, Other]
  priority: enum [Low, Medium, High, Urgent]
  status: enum [Open, In Progress, Waiting Client, Resolved, Closed]
  assigned_technician: string (email)
  photos: string[] (URLs)
  notes: string
  
  created_date: datetime
  updated_date: datetime
  created_by: string
}
```

**Relationships:**
- N:1 → Client (client_id)
- N:1 → Property (property_id)
- N:1 → GuardianSubscription (guardian_id)

---

### **ChecklistItem**
*Project task / quality control item*

```
ChecklistItem {
  id: string (PK)
  title: string
  description: string
  project_id: string (FK → Project)
  category: enum [Bathroom, Full Home, Electrical, Networking, Security, Roofing, Handover]
  assigned_person: string (email)
  due_date: string
  status: enum [To Do, In Progress, Done, Blocked]
  photos: string[] (URLs)
  notes: string
  geo_lat: number
  geo_lng: number
  signature_url: string (URL)
  is_anomaly: boolean
  
  created_date: datetime
  updated_date: datetime
  created_by: string
}
```

**Relationships:**
- N:1 → Project (project_id)

---

## Financial Entities

### **Supplier**
*Vendor / subcontractor*

```
Supplier {
  id: string (PK)
  name: string
  category: enum [Materials, Electrical, Plumbing, Construction, Equipment Rental, Subcontractor, Other]
  phone: string
  email: string
  address: string
  payment_terms: enum [Immediate, 7 days, 15 days, 30 days, 60 days, 90 days]
  rating: number (1-5)
  annual_spend: number
  notes: string
  
  created_date: datetime
  updated_date: datetime
  created_by: string
}
```

**Relationships:**
- 1:N → ProjectCost (supplier_id)
- 1:N → PurchaseOrder (supplier_id)

---

### **ProjectCost**
*Individual cost item for a project*

```
ProjectCost {
  id: string (PK)
  project_id: string (FK → Project)
  cost_type: enum [Material, Labor, Vehicle, Subcontractor, Other]
  category: string
  supplier_id: string (FK → Supplier, nullable)
  description: string
  quantity: number
  unit_cost: number
  total_cost: number
  date: string
  paid: boolean (default: false)
  payment_date: string
  notes: string
  
  created_date: datetime
  updated_date: datetime
  created_by: string
}
```

**Relationships:**
- N:1 → Project (project_id)
- N:1 → Supplier (supplier_id)

---

### **Timesheet**
*Employee work hours tracking*

```
Timesheet {
  id: string (PK)
  employee_id: string (FK → User.email)
  project_id: string (FK → Project)
  date: string
  hours: number
  hourly_rate: number
  total_labor_cost: number
  notes: string
  approved: boolean (default: false)
  approved_by: string (email)
  
  created_date: datetime
  updated_date: datetime
  created_by: string
}
```

**Relationships:**
- N:1 → User (employee_id)
- N:1 → Project (project_id)

---

### **PurchaseOrder**
*Supplier purchase order*

```
PurchaseOrder {
  id: string (PK)
  project_id: string (FK → Project)
  supplier_id: string (FK → Supplier)
  order_number: string (UNIQUE)
  status: enum [Draft, Ordered, Received, Partially Received, Closed]
  order_date: string
  expected_delivery: string
  actual_delivery: string
  total_amount: number
  items: object[]
  notes: string
  
  created_date: datetime
  updated_date: datetime
  created_by: string
}
```

**Relationships:**
- N:1 → Project (project_id)
- N:1 → Supplier (supplier_id)

---

### **Document**
*Generic document / file*

```
Document {
  id: string (PK)
  title: string
  type: enum [Contract, Estimate, Invoice, Certification, Warranty, Floor Plan, Photo, Other]
  file_url: string (URL)
  client_id: string (FK → Client, nullable)
  property_id: string (FK → Property, nullable)
  project_id: string (FK → Project, nullable)
  expiration_date: string
  notes: string
  
  created_date: datetime
  updated_date: datetime
  created_by: string
}
```

**Relationships:**
- N:1 → Client (client_id)
- N:1 → Property (property_id)
- N:1 → Project (project_id)

---

## Intelligence & Learning Entities

### **KnowledgeBase**
*Lessons learned / best practices*

```
KnowledgeBase {
  id: string (PK)
  title: string
  category: enum [Bathroom, Full Home, Electrical, Networking, Security, Roofing, Waterproofing, HVAC, Customer Management, Financial]
  project_id: string (FK → Project, nullable)
  problem: string
  cause: string
  solution: string
  photos: string[] (URLs)
  documents: string[] (URLs)
  recommendations: string
  lessons_learned: string
  tags: string[]
  created_by: string (email)
  is_active: boolean (default: true)
  
  created_date: datetime
  updated_date: datetime
  created_by: string
}
```

**Relationships:**
- N:1 → Project (project_id)

---

### **ProjectLearning**
*Post-project analysis*

```
ProjectLearning {
  id: string (PK)
  project_id: string (FK → Project)
  project_type: string
  category: string
  square_meters: number
  revenue: number
  estimated_costs: number
  actual_costs: number
  estimated_duration: string
  actual_duration: string
  gross_margin: number
  gross_margin_pct: number
  net_margin_pct: number
  estimate_accuracy_pct: number
  duration_accuracy_pct: number
  cost_accuracy_pct: number
  customer_satisfaction: number (1-5)
  what_went_well: string
  what_went_wrong: string
  improvements: string
  would_repeat: boolean
  team_members: string[] (emails)
  suppliers_involved: string[] (emails)
  notes: string
  
  created_date: datetime
  updated_date: datetime
  created_by: string
}
```

**Relationships:**
- 1:1 → Project (project_id)

---

### **IntelligenceInsight**
*AI-generated business insights*

```
IntelligenceInsight {
  id: string (PK)
  insight_type: enum [Profitability, Pricing, Team Performance, Supplier Performance, Project Health, Trend, Risk, Opportunity]
  category: string
  severity: enum [Low, Medium, High, Critical]
  title: string
  description: string
  recommendation: string
  impact: string
  metrics: {
    value: number
    trend: enum [up, down, stable]
    change_pct: number
  }
  project_id: string (FK → Project, nullable)
  is_actionable: boolean (default: true)
  is_read: boolean (default: false)
  
  created_date: datetime
  updated_date: datetime
  created_by: string
}
```

**Relationships:**
- N:1 → Project (project_id)

---

### **EstimatePreset**
*Template for quick estimate creation*

```
EstimatePreset {
  id: string (PK)
  name: string
  estimate_type: enum [Bathroom, Full Home, Electrical System, Networking, Security, Roofing, Maintenance, Other, Guardian]
  quality_level: enum [Essential, Smart, Intelligence]
  base_price: number
  material_cost_pct: number (default: 40)
  labor_cost_pct: number (default: 45)
  equipment_cost_pct: number (default: 5)
  subcontractor_cost_pct: number (default: 5)
  other_cost_pct: number (default: 5)
  included_works: string
  excluded_works: string
  payment_terms: string
  warranty_notes: string
  estimated_duration: string
  is_active: boolean (default: true)
  
  created_date: datetime
  updated_date: datetime
  created_by: string
}
```

---

## User Entity (Built-in)

```
User {
  id: string (PK)
  email: string (UNIQUE)
  full_name: string
  role: enum [admin, project_manager, technician, sales, client]
  created_date: datetime
}
```

**Relationships:**
- 1:N → Client (created_by)
- 1:N → Property (created_by)
- 1:N → Estimate (created_by)
- 1:N → Project (created_by, project_manager, team_members)
- 1:N → SupportTicket (assigned_technician, created_by)
- 1:N → ChecklistItem (assigned_person, created_by)
- 1:N → Timesheet (employee_id, approved_by)

---

## Relationship Diagram

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ 1:N
       ├──────────────────┬─────────────────┬──────────────────┬─────────────────┐
       │                  │                 │                  │                 │
       ▼                  ▼                 ▼                  ▼                 ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  Property   │   │  Estimate   │   │   Project   │   │  Guardian   │   │    Ticket   │
└──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └─────────────┘
       │                 │                 │                  │
       │                 └────────┬────────┘                  │
       │                          │                           │
       │                          ▼                           │
       │                    ┌─────────────┐                   │
       │                    │   Project   │◄──────────────────┘
       │                    └──────┬──────┘
       │                           │
       │         ┌─────────────────┼─────────────────┬──────────────────┐
       │         │                 │                 │                  │
       ▼         ▼                 ▼                 ▼                  ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  Document   │ │  Checklist  │ │ ProjectCost │ │  Timesheet  │ │PurchaseOrder│
└─────────────┘ └──────┬──────┘ └──────┬──────┘ └─────────────┘ └──────┬──────┘
                       │                │                                │
                       │                │                                │
                       │                ▼                                ▼
                       │         ┌─────────────┐                  ┌─────────────┐
                       │         │  Supplier   │◄─────────────────│  Supplier   │
                       │         └─────────────┘                  └─────────────┘
                       │
                       ▼
                ┌─────────────┐
                │  Knowledge  │
                │  Base       │
                └─────────────┘
```

---

## Normalization Status

### ✅ **3NF Compliant**

All entities are in Third Normal Form:
1. **1NF:** All attributes are atomic (no repeating groups)
2. **2NF:** All non-key attributes depend on full primary key
3. **3NF:** No transitive dependencies

### ✅ **No Duplicated Data**

- Client information stored ONCE → referenced by FK
- Property information stored ONCE → referenced by FK
- Supplier information stored ONCE → referenced by FK
- Financial data properly split (ProjectCost, Timesheet, PurchaseOrder)

### ✅ **Referential Integrity**

All foreign keys reference valid primary keys:
- `client_id` → Client.id
- `property_id` → Property.id
- `estimate_id` → Estimate.id
- `project_id` → Project.id
- `guardian_id` → GuardianSubscription.id
- `supplier_id` → Supplier.id
- `employee_id` → User.email
- `assigned_technician` → User.email
- `project_manager` → User.email
- `team_members` → User.email[]
- `assigned_person` → User.email

---

## Data Quality Rules

1. **Email Uniqueness:** Client.email must be unique
2. **Required FK:** All FK fields can be nullable where business logic allows
3. **Financial Consistency:** 
   - `total_costs = material_cost + labor_cost + equipment_cost + subcontractor_cost + other_costs`
   - `gross_margin = revenue - total_costs`
   - `gross_margin_pct = (gross_margin / revenue) * 100`
4. **Date Validity:** 
   - `start_date <= expected_end_date`
   - `expected_end_date <= actual_end_date` (when present)
5. **Status Transitions:** Enforced by business logic in frontend/backend

---

## Indexing Recommendations

```
// High priority indexes
Client: email (UNIQUE)
Property: client_id
Estimate: client_id, property_id, status
Project: client_id, property_id, status, estimate_id
GuardianSubscription: client_id, property_id, status
SupportTicket: client_id, property_id, guardian_id, status
ChecklistItem: project_id, status, due_date
ProjectCost: project_id, supplier_id, date
Timesheet: project_id, employee_id, date
PurchaseOrder: project_id, supplier_id, order_number (UNIQUE)
Document: client_id, property_id, project_id
```

---

## Security Notes

- Row-Level Security (RLS) implemented via `getUserFilters` function
- Signed URLs for document downloads (7-day expiration)
- Role-based access control (admin, PM, technician, sales, client)
- All sensitive financial data protected by RLS

---

**END OF ERD DOCUMENTATION**