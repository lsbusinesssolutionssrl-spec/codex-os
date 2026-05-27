# Codex OS - Multi-Brand Architecture

## Overview

Codex OS Multi-Brand enables a single tenant (company) to manage multiple brands/divisions, each with its own branding, templates, workflows, and documents.

---

## 1. Use Cases

### Example: Codex Group

A single company operates multiple brands:

| Brand | Division | Target Market |
|-------|----------|---------------|
| **Codex Solution** | Construction & Renovation | Residential/Commercial |
| **Codex Living** | Smart Home & IoT | Home Automation |
| **Codex Guardian** | Maintenance & Support | Property Management |

Each brand needs:
- Separate logo and colors
- Custom email/PDF templates
- Dedicated workflows
- Branded client portal
- Independent document library

---

## 2. Multi-Brand Entity Model

### Brand Entity (Extended)

```json
{
  "id": "brand_123",
  "company_id": "comp_456",
  "name": "Codex Living",
  "slug": "codex-living",
  "logo_url": "https://cdn.codex.com/brands/living/logo.png",
  "favicon_url": "https://cdn.codex.com/brands/living/favicon.ico",
  "primary_color": "#1147FF",
  "secondary_color": "#0B2341",
  "accent_color": "#F58020",
  "custom_domain": "living.codex.com",
  "is_default": false,
  "status": "Active",
  
  "email_template": "modern-blue-living",
  "pdf_template": "modern-living",
  
  "login_page_config": {
    "background_image": "https://cdn.codex.com/brands/living/bg.jpg",
    "welcome_message": "Welcome to Codex Living",
    "show_logo": true
  },
  
  "portal_config": {
    "custom_welcome": "Your Smart Home Portal",
    "show_branding": true,
    "custom_css": ".header { background: #1147FF; }"
  },
  
  "created_by": "admin@codex.com",
  "created_date": "2026-05-27T10:00:00Z"
}
```

### Brand Assignment Entity

```json
{
  "id": "assign_789",
  "company_id": "comp_456",
  "brand_id": "brand_123",
  "entity_type": "Project",
  "entity_id": "proj_001",
  "assigned_by": "admin@codex.com",
  "assigned_date": "2026-05-27T10:00:00Z"
}
```

---

## 3. Entity Extensions

All core entities get a `brand_id` field:

### Project Entity (Extended)

```json
{
  "id": "proj_001",
  "company_id": "comp_456",
  "brand_id": "brand_123",
  "title": "Smart Home Installation",
  "client_id": "client_789",
  "property_id": "prop_456",
  "status": "In Progress",
  ...
}
```

### Estimate Entity (Extended)

```json
{
  "id": "est_001",
  "company_id": "comp_456",
  "brand_id": "brand_123",
  "title": "Home Automation Quote",
  "client_id": "client_789",
  ...
}
```

### Workflow Entity (Extended)

```json
{
  "id": "wf_001",
  "company_id": "comp_456",
  "brand_id": "brand_123",
  "name": "Smart Home Onboarding",
  "category": "Project Onboarding",
  ...
}
```

### EmailTemplate Entity (Extended)

```json
{
  "id": "email_001",
  "company_id": "comp_456",
  "brand_id": "brand_123",
  "name": "Welcome Email",
  "slug": "welcome",
  "logo_url": "https://cdn.codex.com/brands/living/logo.png",
  ...
}
```

---

## 4. Multi-Brand Features

### 4.1 Brand Management

**Brand Dashboard:**
- List all brands under company
- Create new brand
- Edit brand settings
- Switch between brands
- View brand analytics

**Brand Settings:**
- Logo & favicon upload
- Color palette (primary, secondary, accent)
- Custom domain configuration
- Login page customization
- Client portal branding
- Email templates
- PDF templates

---

### 4.2 Brand Switching

**UI Implementation:**
```jsx
// Brand selector in header
function BrandSelector() {
  const { brands, currentBrand, switchBrand } = useBrandContext();
  
  return (
    <select 
      value={currentBrand.id} 
      onChange={(e) => switchBrand(e.target.value)}
    >
      {brands.map(brand => (
        <option key={brand.id} value={brand.id}>
          {brand.name}
        </option>
      ))}
    </select>
  );
}
```

**Context Provider:**
```jsx
function BrandProvider({ children }) {
  const [currentBrand, setCurrentBrand] = useState(null);
  
  const switchBrand = async (brandId) => {
    const brand = await base44.entities.Brand.filter({ id: brandId });
    setCurrentBrand(brand[0]);
    localStorage.setItem('currentBrandId', brandId);
    // Reload app with new brand context
    window.location.reload();
  };
  
  return (
    <BrandContext.Provider value={{ currentBrand, switchBrand }}>
      {children}
    </BrandContext.Provider>
  );
}
```

---

### 4.3 Brand-Specific Workflows

**Workflow Assignment:**
Each workflow is assigned to a specific brand.

```json
{
  "workflow_id": "wf_001",
  "brand_id": "brand_123",
  "name": "Codex Living - New Customer Onboarding",
  "steps": [
    {
      "id": "step_1",
      "type": "action",
      "action_type": "send_email",
      "config": {
        "template_id": "email_welcome_living",
        "delay_minutes": 0
      }
    },
    {
      "id": "step_2",
      "type": "action",
      "action_type": "create_project",
      "config": {
        "brand_id": "brand_123",
        "auto_assign": true
      }
    }
  ]
}
```

---

### 4.4 Brand-Specific Templates

**Email Templates per Brand:**
- Each brand has its own email templates
- Templates use brand logo and colors
- Custom messaging per brand

**PDF Templates per Brand:**
- Estimates, invoices, reports use brand template
- Brand logo in header
- Brand colors throughout
- Custom footer with brand info

---

### 4.5 Brand-Specific Documents

**Document Library:**
- Each brand has separate document library
- Documents tagged with brand_id
- Brand-specific folders/categories
- Access control by brand

**Document Example:**
```json
{
  "id": "doc_001",
  "company_id": "comp_456",
  "brand_id": "brand_123",
  "title": "Smart Home Installation Guide",
  "category": "Installation",
  "file_url": "https://cdn.codex.com/docs/living/install-guide.pdf",
  "is_public": false
}
```

---

## 5. Data Isolation

### Query Filtering

All queries automatically filter by current brand:

```javascript
// Get projects for current brand only
const projects = await base44.entities.Project.filter({
  company_id: companyId,
  brand_id: currentBrandId
});

// Get workflows for current brand
const workflows = await base44.entities.Workflow.filter({
  company_id: companyId,
  brand_id: currentBrandId
});
```

### Cross-Brand Reporting

Admin users can view consolidated data across all brands:

```javascript
// Get all projects across all brands (admin only)
const allProjects = await base44.entities.Project.filter({
  company_id: companyId
});

// Group by brand
const byBrand = allProjects.reduce((acc, proj) => {
  acc[proj.brand_id] = (acc[proj.brand_id] || []).push(proj);
  return acc;
}, {});
```

---

## 6. User Permissions

### Brand-Level Access Control

Users can be assigned to specific brands:

```json
{
  "user_id": "user_001",
  "company_id": "comp_456",
  "email": "john@codex.com",
  "role": "project_manager",
  "brands": ["brand_123", "brand_456"],
  "is_admin": false
}
```

### Permission Levels

| Permission | Description |
|------------|-------------|
| **Brand Admin** | Full access to brand settings and data |
| **Brand Member** | Access to brand data only |
| **Multi-Brand** | Access to multiple brands |
| **Company Admin** | Access to all brands + company settings |

---

## 7. API Design

### Brand Management API

```
GET    /api/v1/brands                     - List all brands (company)
POST   /api/v1/brands                     - Create new brand
GET    /api/v1/brands/:id                 - Get brand details
PUT    /api/v1/brands/:id                 - Update brand
DELETE /api/v1/brands/:id                 - Delete brand
POST   /api/v1/brands/:id/switch          - Switch to brand
GET    /api/v1/brands/:id/analytics       - Brand analytics
```

### Entity Filtering

```
GET    /api/v1/projects?brand_id=brand_123
GET    /api/v1/estimates?brand_id=brand_123
GET    /api/v1/workflows?brand_id=brand_123
GET    /api/v1/documents?brand_id=brand_123
```

---

## 8. UI Implementation

### Brand Selector Component

```jsx
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function BrandSelector() {
  const [brands, setBrands] = useState([]);
  const [currentBrand, setCurrentBrand] = useState(null);

  useEffect(() => {
    const load = async () => {
      const brands = await base44.entities.Brand.list();
      setBrands(brands);
      
      const savedBrandId = localStorage.getItem('currentBrandId');
      const current = brands.find(b => b.id === savedBrandId) || brands[0];
      setCurrentBrand(current);
    };
    load();
  }, []);

  const handleSwitch = async (brandId) => {
    localStorage.setItem('currentBrandId', brandId);
    window.location.reload();
  };

  return (
    <div className="flex items-center gap-2">
      <img src={currentBrand?.logo_url} alt={currentBrand?.name} className="h-6 w-auto" />
      <select
        value={currentBrand?.id}
        onChange={(e) => handleSwitch(e.target.value)}
        className="text-sm border border-gray-200 rounded-lg px-2 py-1"
      >
        {brands.map(brand => (
          <option key={brand.id} value={brand.id}>
            {brand.name}
          </option>
        ))}
      </select>
    </div>
  );
}
```

### Brand-Aware Pages

```jsx
export default function Projects() {
  const [projects, setProjects] = useState([]);
  const currentBrandId = localStorage.getItem('currentBrandId');

  useEffect(() => {
    const load = async () => {
      const company = await base44.functions.invoke('getCurrentCompany');
      const projects = await base44.entities.Project.filter({
        company_id: company.id,
        brand_id: currentBrandId
      });
      setProjects(projects);
    };
    load();
  }, [currentBrandId]);

  return (
    <div>
      <h1>Projects - {currentBrand?.name}</h1>
      {/* Project list */}
    </div>
  );
}
```

---

## 9. Migration Strategy

### Phase 1: Add Brand Entity ✅
- [x] Create Brand entity
- [x] Add brand management UI
- [ ] Add brand_id to all entities

### Phase 2: Entity Migration
- [ ] Add brand_id field to Project, Estimate, Workflow, etc.
- [ ] Migrate existing data to default brand
- [ ] Update all queries to filter by brand

### Phase 3: Brand Switching
- [ ] Implement brand selector in header
- [ ] Add brand context provider
- [ ] Update all pages to be brand-aware

### Phase 4: Brand-Specific Features
- [ ] Brand-specific workflows
- [ ] Brand-specific templates
- [ ] Brand-specific documents
- [ ] Brand analytics

---

## 10. Analytics & Reporting

### Brand-Level Analytics

Track metrics per brand:
- Projects created
- Revenue generated
- Estimates sent/accepted
- Client satisfaction
- Workflow executions
- Document usage

### Consolidated Reporting

Company admins can view:
- Total revenue across all brands
- Brand performance comparison
- Resource allocation by brand
- Client distribution by brand

---

## 11. Example: Codex Group Setup

### Brand 1: Codex Solution

```json
{
  "name": "Codex Solution",
  "slug": "codex-solution",
  "logo_url": "https://cdn.codex.com/brands/solution/logo.png",
  "primary_color": "#1147FF",
  "secondary_color": "#0B2341",
  "accent_color": "#F58020",
  "custom_domain": "solution.codex.com",
  "email_template": "solution-modern",
  "pdf_template": "solution-professional"
}
```

**Workflows:**
- Construction Project Onboarding
- Renovation Workflow
- Contractor Management

---

### Brand 2: Codex Living

```json
{
  "name": "Codex Living",
  "slug": "codex-living",
  "logo_url": "https://cdn.codex.com/brands/living/logo.png",
  "primary_color": "#10B981",
  "secondary_color": "#064E3B",
  "accent_color": "#34D399",
  "custom_domain": "living.codex.com",
  "email_template": "living-modern",
  "pdf_template": "living-clean"
}
```

**Workflows:**
- Smart Home Installation
- IoT Device Setup
- Home Automation Configuration

---

### Brand 3: Codex Guardian

```json
{
  "name": "Codex Guardian",
  "slug": "codex-guardian",
  "logo_url": "https://cdn.codex.com/brands/guardian/logo.png",
  "primary_color": "#8B5CF6",
  "secondary_color": "#5B21B6",
  "accent_color": "#A78BFA",
  "custom_domain": "guardian.codex.com",
  "email_template": "guardian-professional",
  "pdf_template": "guardian-classic"
}
```

**Workflows:**
- Maintenance Request Handling
- Emergency Response
- Scheduled Maintenance

---

## 12. Best Practices

### Data Isolation
- Always filter by brand_id in queries
- Never mix data from different brands in UI
- Use brand context for automatic filtering

### User Experience
- Clear visual indication of current brand
- Easy brand switching
- Consistent branding throughout app

### Performance
- Cache brand config in localStorage
- Lazy load brand assets (logos, etc.)
- Index brand_id fields in database

### Security
- Enforce brand-level permissions
- Audit log includes brand_id
- Prevent cross-brand data access

---

**Version:** 1.0.0  
**Status:** Architecture Ready  
**Last Updated:** 2026-05-27