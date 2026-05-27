# White Label & Brand Governance System

## Overview

Enterprise-grade branding customization system with controlled white labeling, approval workflows, and design token governance.

## Architecture

### Core Entities

1. **BrandTheme** - Branding configuration
   - Logo, favicon, colors
   - Typography, terminology
   - Email footer, login background
   - Custom domain support
   - Version tracking
   - Approval status

2. **BrandAuditLog** - Complete audit trail
   - All branding changes
   - Approval/rejection events
   - Rollback history
   - Version diffs

## White Label Tiers

### Professional (€99/mo)
- ✅ Logo upload
- ✅ Primary color
- ✅ PDF branding
- ❌ Full dashboard branding
- ❌ Login page customization
- ❌ Remove "Powered by"

### Enterprise (€249/mo)
- ✅ All Professional features +
- ✅ Full dashboard branding
- ✅ Login page branding
- ✅ Client portal branding
- ✅ Email branding
- ✅ Custom domain
- ❌ Remove "Powered by"

### Elite (Custom Pricing)
- ✅ All Enterprise features +
- ✅ Advanced workspace naming
- ✅ White-label onboarding
- ✅ Remove "Powered by" badge
- ✅ Premium branding package
- ✅ Dedicated support

## Design Token System

### Semantic Color Tokens

```javascript
{
  primary: '#1147FF',        // Primary actions, links
  primary_hover: '#0F3AE8',  // Hover states
  secondary: '#0B2341',      // Secondary elements
  accent: '#F58020',         // Accent highlights
  background: '#FFFFFF',     // Page background
  surface: '#F8FAFC',        // Cards, panels
  border: '#E2E8F0',         // Borders, dividers
  success: '#10B981',        // Success states
  warning: '#F59E0B',        // Warning states
  danger: '#EF4444'          // Error states
}
```

### Typography Tokens

```javascript
{
  font_family: 'Inter',
  heading_scale: 'normal' | 'compact' | 'spacious'
}
```

### Custom Terminology

```javascript
{
  platform_name: 'Codex OS',    // "Codex OS" → "YourBrand"
  project_label: 'Project',     // "Projects" → "Jobs"
  client_label: 'Client'        // "Clients" → "Customers"
}
```

## Approval Workflow

### Status Flow

```
Draft → Pending Approval → Approved → Active
                      ↓
                Rejected
                      ↓
              Needs Revision → Draft
```

### Tenant Actions

1. **Create Theme**
   - Configure branding
   - Save as draft
   - Preview in real-time

2. **Submit for Approval**
   - Locks theme from editing
   - Notifies Super Admin
   - Status: "Pending Approval"

3. **Revision** (if needed)
   - Admin requests changes
   - Tenant receives feedback
   - Edit and resubmit

### Super Admin Actions

1. **Review**
   - View all pending themes
   - Preview impact
   - Compare versions

2. **Approve**
   - Theme becomes "Approved"
   - Can be activated by tenant
   - Logged in BrandAuditLog

3. **Reject**
   - Provide reason
   - Theme locked
   - Tenant must create new

4. **Request Revision**
   - Provide feedback
   - Theme returns to "Draft"
   - Tenant can edit and resubmit

## Brand Preview System

### Live Preview Modes

1. **Dashboard Preview**
   - Navigation with custom colors
   - KPI cards with branding
   - Buttons and actions

2. **Mobile Preview**
   - Responsive layout
   - Touch-optimized UI
   - Mobile navigation

3. **Login Page Preview**
   - Custom background
   - Logo placement
   - Branded login form

### Preview Features

- Real-time color updates
- Logo/favicon visualization
- Terminology changes
- Typography preview

## Brand Governance Rules

### Protected Elements

**Cannot be changed:**
- Core navigation structure
- Operational workflows
- Layout architecture
- Accessibility features
- Security indicators

### Validation Rules

**Color Accessibility:**
- Minimum contrast ratio: 4.5:1 (WCAG AA)
- No pure red/green for status
- Sufficient hover state contrast

**Typography:**
- Only approved fonts
- Readable sizes (min 14px body)
- Proper heading hierarchy

**Branding:**
- Logo aspect ratio preserved
- Favicon square format
- No offensive content

## Version Control

### Theme Versioning

Each submission creates new version:
- v1.0 → Initial submission
- v1.1 → Minor revision
- v2.0 → Major redesign

### Rollback

Tenants can rollback to previous approved version:
1. Select historical theme
2. Click "Activate"
3. Previous version becomes active
4. Logged in BrandAuditLog

### Audit Log Events

- `theme_created` - New draft
- `theme_submitted` - Sent for approval
- `theme_approved` - Approved by admin
- `theme_rejected` - Rejected with reason
- `theme_revised` - Revision requested
- `theme_activated` - Made active
- `theme_rolled_back` - Reverted to previous
- `color_changed` - Color token updated
- `logo_changed` - Logo updated
- `terminology_changed` - Labels changed

## Implementation

### Frontend Components

**WhiteLabelCenter** (`/white-label`)
- Main branding interface
- Real-time preview
- Draft management
- Theme history

**BrandPreviewModal**
- Multi-mode preview
- Dashboard/mobile/login views
- Live color updates

**LogoUploader**
- File upload handling
- Image optimization
- Preview display

**BrandApprovalQueue** (`/brand-approval`)
- Super Admin review interface
- Approve/reject/revision actions
- Theme comparison

### Backend Functions

**approveBrandTheme**
```javascript
{
  themeId: "string",
  approvedBy: "admin@email.com"
}
```

**rejectBrandTheme**
```javascript
{
  themeId: "string",
  reason: "string"
}
```

**activateBrandTheme**
```javascript
{
  themeId: "string",
  companyId: "string"
}
```

### Entity Filtering

All branding queries filtered by `company_id`:
```javascript
const themes = await base44.entities.BrandTheme.filter({
  company_id: company.id
});
```

## UX Protection

### What Tenants CAN Customize

✅ Visual branding:
- Logos and icons
- Color schemes
- Typography (limited)
- Background images

✅ Terminology:
- Platform name
- Feature labels
- Custom messaging

✅ Email/PDF branding:
- Email footers
- PDF headers
- Report branding

### What Tenants CANNOT Change

❌ Operational elements:
- Navigation structure
- Workflow logic
- Data models
- Security features

❌ Core UI architecture:
- Layout grids
- Component hierarchy
- Interaction patterns
- Accessibility features

❌ Platform functionality:
- Feature availability
- User permissions
- Integration settings

## Enterprise Experience

### Premium Features

**Custom Domain** (Enterprise+)
- `yourbrand.com` → Codex OS
- SSL certificate included
- DNS configuration guide

**White-Label Onboarding** (Elite)
- Custom welcome messages
- Branded tutorial flows
- Company-specific guidance

**Remove "Powered by"** (Elite)
- Clean footer
- No platform attribution
- Fully branded experience

### Quality Assurance

**Automated Checks:**
- Color contrast validation
- Image format verification
- Token consistency

**Manual Review:**
- Super Admin approval required
- Design quality check
- Brand guideline compliance

## Security Considerations

1. **No CSS Injection**
   - Controlled tokens only
   - No arbitrary styles
   - Sanitized inputs

2. **No HTML Modifications**
   - Fixed structure
   - Token-based theming
   - No custom scripts

3. **Audit Trail**
   - All changes logged
   - Version history
   - Rollback capability

4. **Access Control**
   - Enterprise/Elite only
   - Company-scoped themes
   - Approval required

## Usage Flow

### Tenant Flow

1. Navigate to `/white-label`
2. Configure branding
3. Preview in real-time
4. Save as draft OR submit for approval
5. Wait for admin review
6. If approved → activate theme
7. If revision needed → edit and resubmit

### Super Admin Flow

1. Navigate to `/brand-approval`
2. Review pending themes
3. Preview impact
4. Approve / Reject / Request revision
5. Monitor brand audit logs

## Monitoring

### Brand Adoption Metrics

- Themes submitted per month
- Approval rate
- Average review time
- Revision frequency

### Quality Metrics

- Accessibility compliance
- Brand guideline adherence
- User satisfaction scores

## Deployment Checklist

- [ ] Deploy BrandTheme entity
- [ ] Deploy BrandAuditLog entity
- [ ] Create WhiteLabelCenter page
- [ ] Create BrandApprovalQueue page
- [ ] Create preview components
- [ ] Add routing to App.jsx
- [ ] Test approval workflow
- [ ] Test preview system
- [ ] Verify tier restrictions
- [ ] Document for tenants

## Future Enhancements

- [ ] Automated accessibility checking
- [ ] AI-powered color suggestions
- [ ] Brand guideline templates
- [ ] Multi-brand support (holdings)
- [ ] A/B testing for branding
- [ ] Analytics integration
- [ ] Custom font uploads
- [ ] Dark mode support

## Support

For branding support, contact the Super Admin team.

For technical issues, use the platform support channel.