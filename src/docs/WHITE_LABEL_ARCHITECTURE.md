# Codex OS - White Label Platform Architecture

## Overview

Codex OS White Label Platform enables partners to fully brand and customize the platform as their own, including custom domains, login pages, branding, PDFs, client portals, and email templates.

---

## 1. White Label Features

### 1.1 Custom Domains

**Capabilities:**
- Connect custom domain (e.g., `app.yourcompany.com`)
- Automatic SSL certificate provisioning
- DNS configuration guidance
- Domain verification
- Multiple domains per company
- Domain redirect (www → non-www)

**Technical Implementation:**
```
DNS Configuration:
- CNAME: app.yourcompany.com → app.codex.com
- A Record: yourcompany.com → [platform IP]

SSL/TLS:
- Automatic Let's Encrypt certificates
- Auto-renewal (90 days)
- HTTPS redirect enforced
```

---

### 1.2 Custom Login Pages

**Customization Options:**
- Company logo
- Background image/color
- Welcome message
- Color scheme (primary, secondary, accent)
- Footer text and links
- Social login buttons (enable/disable)
- Terms & Privacy links
- Support contact info

**Example Configuration:**
```json
{
  "login_page": {
    "logo_url": "https://cdn.company.com/logo.png",
    "background_image": "https://cdn.company.com/bg.jpg",
    "background_color": "#1a3a5c",
    "welcome_message": "Welcome to Company Portal",
    "primary_color": "#1147FF",
    "footer_text": "© 2026 Company Name. All rights reserved.",
    "footer_links": [
      {"label": "Privacy", "url": "/privacy"},
      {"label": "Terms", "url": "/terms"}
    ],
    "show_social_login": true,
    "support_email": "support@company.com"
  }
}
```

---

### 1.3 Custom Branding

**Brand Assets:**
- Logo (multiple sizes: favicon, header, login)
- Color palette (primary, secondary, accent, background)
- Typography (font families)
- Icon set (optional custom icons)

**Brand Configuration:**
```json
{
  "branding": {
    "company_name": "Company Name",
    "logo": {
      "header_url": "https://cdn.company.com/logo-header.png",
      "login_url": "https://cdn.company.com/logo-login.png",
      "favicon_url": "https://cdn.company.com/favicon.ico"
    },
    "colors": {
      "primary": "#1147FF",
      "secondary": "#0B2341",
      "accent": "#F58020",
      "background": "#FFFFFF",
      "text": "#1a1a1a"
    },
    "fonts": {
      "heading": "Inter",
      "body": "Roboto"
    },
    "theme": "light"
  }
}
```

---

### 1.4 Custom PDFs

**PDF Templates:**
- Estimates/Quotes
- Invoices
- Project Reports
- Completion Certificates
- Work Orders
- Contracts

**Customization Options:**
- Company logo and header
- Color scheme
- Font selection
- Layout (modern, classic, minimal)
- Footer with company info
- Terms & conditions
- Custom fields
- Watermark (optional)

**Template Structure:**
```json
{
  "pdf_templates": {
    "estimate": {
      "template_id": "modern-blue",
      "logo_url": "https://cdn.company.com/logo.png",
      "header_color": "#1147FF",
      "font": "Inter",
      "layout": "modern",
      "footer_text": "Company Name | VAT: IT12345678901 | info@company.com",
      "terms": "Payment due within 30 days...",
      "show_watermark": false
    },
    "invoice": {
      "template_id": "classic",
      "logo_url": "https://cdn.company.com/logo.png",
      "header_color": "#0B2341",
      "font": "Roboto",
      "layout": "classic",
      "footer_text": "Company Name | VAT: IT12345678901",
      "terms": "Payment instructions...",
      "show_watermark": false
    }
  }
}
```

---

### 1.5 Custom Client Portal

**Portal Customization:**
- Company branding (logo, colors)
- Custom domain (portal.company.com)
- Welcome message
- Feature toggles (what clients can see)
- Custom navigation
- Support widget integration
- Knowledge base integration

**Portal Configuration:**
```json
{
  "client_portal": {
    "enabled": true,
    "custom_domain": "portal.company.com",
    "branding": {
      "logo_url": "https://cdn.company.com/logo.png",
      "primary_color": "#1147FF",
      "welcome_message": "Welcome to Your Client Portal"
    },
    "features": {
      "show_projects": true,
      "show_estimates": true,
      "show_documents": true,
      "show_tickets": true,
      "show_payments": true,
      "show_timeline": true
    },
    "navigation": [
      {"label": "Projects", "path": "/projects"},
      {"label": "Documents", "path": "/documents"},
      {"label": "Support", "path": "/tickets"}
    ],
    "support": {
      "widget_enabled": true,
      "widget_type": "intercom",
      "widget_id": "abc123"
    }
  }
}
```

---

### 1.6 Custom Email Templates

**Email Templates:**
- Welcome email
- Password reset
- Estimate sent
- Project updates
- Invoice notifications
- Ticket notifications
- Meeting reminders
- Newsletter

**Template Customization:**
```json
{
  "email_templates": {
    "welcome": {
      "subject": "Welcome to {{company_name}}!",
      "logo_url": "https://cdn.company.com/logo.png",
      "header_color": "#1147FF",
      "footer_text": "© 2026 Company Name",
      "custom_content": "We're excited to have you on board..."
    },
    "estimate_sent": {
      "subject": "Your Estimate from {{company_name}}",
      "logo_url": "https://cdn.company.com/logo.png",
      "header_color": "#1147FF",
      "footer_text": "Questions? Reply to this email",
      "custom_content": "Please review your estimate attached..."
    }
  }
}
```

---

## 2. White Label Entity Model

### Brand Entity

```json
{
  "company_id": "comp_123",
  "name": "Company Brand",
  "slug": "company",
  "logo_url": "https://cdn.company.com/logo.png",
  "favicon_url": "https://cdn.company.com/favicon.ico",
  "primary_color": "#1147FF",
  "secondary_color": "#0B2341",
  "accent_color": "#F58020",
  "custom_domain": "app.company.com",
  "is_default": true,
  "email_template": "modern-blue",
  "pdf_template": "modern-blue",
  "login_page_config": {
    "background_image": "https://cdn.company.com/bg.jpg",
    "welcome_message": "Welcome to Company Portal",
    "show_logo": true
  },
  "portal_config": {
    "custom_welcome": "Welcome to Your Portal",
    "show_branding": true,
    "custom_css": ".header { background: #1147FF; }"
  },
  "status": "Active",
  "created_by": "admin@company.com"
}
```

### CustomDomain Entity

```json
{
  "company_id": "comp_123",
  "domain": "app.company.com",
  "type": "application",
  "status": "Verified",
  "dns_records": [
    {
      "type": "CNAME",
      "name": "app",
      "value": "app.codex.com",
      "status": "Verified"
    }
  ],
  "ssl_status": "Active",
  "ssl_expires_at": "2026-08-27T00:00:00Z",
  "verified_at": "2026-05-27T10:00:00Z",
  "created_by": "admin@company.com"
}
```

### EmailTemplate Entity

```json
{
  "company_id": "comp_123",
  "name": "Welcome Email",
  "slug": "welcome",
  "subject": "Welcome to {{company_name}}!",
  "template_type": "custom",
  "logo_url": "https://cdn.company.com/logo.png",
  "header_color": "#1147FF",
  "footer_text": "© 2026 Company Name",
  "custom_content": "We're excited to have you...",
  "variables": ["company_name", "user_name", "login_url"],
  "is_active": true,
  "created_by": "admin@company.com"
}
```

---

## 3. Implementation Details

### 3.1 Custom Domains

**DNS Verification Flow:**
```
1. User adds custom domain in settings
2. System generates DNS records (CNAME/TXT)
3. User configures DNS at their registrar
4. System periodically checks DNS propagation
5. Once verified, SSL certificate is provisioned
6. Domain becomes active (usually < 24 hours)
```

**SSL Certificate Management:**
- Automatic Let's Encrypt provisioning
- Auto-renewal 30 days before expiry
- Fallback to platform SSL if renewal fails
- Email notifications for expiring certs

---

### 3.2 Custom Login Pages

**Login Page Rendering:**
```jsx
// Dynamic login page based on brand
function LoginPage() {
  const brand = useBrandConfig();
  
  return (
    <div 
      className="login-page"
      style={{ 
        backgroundImage: `url(${brand.login_page.background_image})`,
        backgroundColor: brand.login_page.background_color
      }}
    >
      <img src={brand.login_page.logo_url} alt={brand.company_name} />
      <h1>{brand.login_page.welcome_message}</h1>
      {/* Login form with brand colors */}
      <button style={{ backgroundColor: brand.colors.primary }}>
        Sign In
      </button>
    </div>
  );
}
```

---

### 3.3 Custom Branding

**CSS Variable Injection:**
```css
/* Dynamic brand colors */
:root {
  --brand-primary: {{primary_color}};
  --brand-secondary: {{secondary_color}};
  --brand-accent: {{accent_color}};
  --brand-font-heading: {{heading_font}};
  --brand-font-body: {{body_font}};
}
```

**Theme Provider:**
```jsx
// Brand context provider
function BrandProvider({ children }) {
  const brand = useBrandConfig();
  
  return (
    <BrandContext.Provider value={brand}>
      <style jsx global>{`
        :root {
          --primary: ${brand.colors.primary};
          --secondary: ${brand.colors.secondary};
          --accent: ${brand.colors.accent};
        }
        body {
          font-family: ${brand.fonts.body};
        }
        h1, h2, h3 {
          font-family: ${brand.fonts.heading};
        }
      `}</style>
      {children}
    </BrandContext.Provider>
  );
}
```

---

### 3.4 Custom PDFs

**PDF Generation Flow:**
```
1. User requests PDF (estimate, invoice, etc.)
2. System loads company's PDF template config
3. Template is rendered with data + brand assets
4. PDF is generated using html2pdf or similar
5. PDF is delivered/downloaded
```

**Template Engine:**
```javascript
async function generatePDF(templateType, data, brandConfig) {
  const template = await loadTemplate(templateType, brandConfig.pdf_templates[templateType]);
  const html = await renderTemplate(template, { ...data, brand: brandConfig });
  const pdf = await html2pdf(html, {
    margin: 0,
    filename: `${templateType}_${data.id}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  });
  return pdf;
}
```

---

### 3.5 Custom Client Portal

**Portal Subdomain Routing:**
```javascript
// Detect portal domain and load brand config
function PortalLayout() {
  const domain = window.location.hostname;
  const brandConfig = useBrandByDomain(domain);
  
  if (!brandConfig) {
    return <NotFound />;
  }
  
  return (
    <BrandProvider value={brandConfig}>
      <PortalHeader logo={brandConfig.logo_url} />
      <Outlet />
    </BrandProvider>
  );
}
```

---

### 3.6 Custom Email Templates

**Email Rendering:**
```javascript
async function sendCustomEmail(template, recipient, variables, brandConfig) {
  const templateConfig = brandConfig.email_templates[template];
  
  // Replace variables
  let subject = templateConfig.subject;
  let content = templateConfig.custom_content;
  
  Object.entries(variables).forEach(([key, value]) => {
    subject = subject.replace(`{{${key}}}`, value);
    content = content.replace(`{{${key}}}`, value);
  });
  
  // Send with brand assets
  await sendEmail({
    to: recipient,
    subject,
    html: renderEmailTemplate(content, templateConfig, brandConfig),
    from: `${brandConfig.company_name} <noreply@${brandConfig.custom_domain}>`
  });
}
```

---

## 4. White Label Settings UI

### Settings Page Structure

```
/settings/white-label
├── /branding
│   ├── Logo & Favicon
│   ├── Colors
│   └── Typography
├── /domains
│   ├── Add Domain
│   ├── DNS Verification
│   └── SSL Status
├── /login-page
│   ├── Background
│   ├── Welcome Message
│   └── Footer
├── /pdf-templates
│   ├── Estimate Template
│   ├── Invoice Template
│   └── Report Template
├── /client-portal
│   ├── Portal Branding
│   ├── Feature Toggles
│   └── Navigation
└── /email-templates
    ├── Welcome Email
    ├── Transactional Emails
    └── Newsletter
```

---

## 5. API Design

### White Label API

```
GET    /api/v1/white-label/brand              - Get brand config
PUT    /api/v1/white-label/brand              - Update brand config
GET    /api/v1/white-label/domains            - List custom domains
POST   /api/v1/white-label/domains            - Add custom domain
DELETE /api/v1/white-label/domains/:id        - Remove domain
POST   /api/v1/white-label/domains/:id/verify - Verify DNS
GET    /api/v1/white-label/pdf-templates      - List PDF templates
PUT    /api/v1/white-label/pdf-templates/:id  - Update PDF template
GET    /api/v1/white-label/email-templates    - List email templates
PUT    /api/v1/white-label/email-templates/:id- Update email template
POST   /api/v1/white-label/preview            - Preview branding
```

---

## 6. Security & Compliance

### Domain Ownership Verification

**Methods:**
1. **DNS TXT Record**: Add verification token to DNS
2. **Email Verification**: Click verification link sent to domain admin
3. **File Upload**: Upload verification file to domain root

### SSL/TLS Security

- All custom domains require HTTPS
- Automatic certificate renewal
- HSTS headers enforced
- Minimum TLS 1.2

### Brand Asset Security

- Logo and assets served from CDN
- Signed URLs for private assets
- Rate limiting on asset requests
- Virus scanning on uploads

---

## 7. Quotas & Pricing

### White Label Tiers

| Tier | Custom Domains | Custom Login | Custom PDFs | Custom Portal | Custom Emails | Price |
|------|----------------|--------------|-------------|---------------|---------------|-------|
| **Starter** | 1 | ✓ | 3 templates | Basic | 3 templates | €49/mo |
| **Professional** | 3 | ✓ | Unlimited | Full | Unlimited | €99/mo |
| **Enterprise** | Unlimited | ✓ | Unlimited | Full + API | Unlimited | €249/mo |
| **Partner** | Unlimited | ✓ | Unlimited | Multi-tenant | Unlimited | Custom |

---

## 8. Roadmap

### Phase 1: Core Branding ✅ (Q2 2026)
- [x] Brand entity structure
- [x] Color customization
- [x] Logo upload
- [ ] Custom login page UI
- [ ] PDF template system

### Phase 2: Custom Domains (Q3 2026)
- [ ] Domain management UI
- [ ] DNS verification
- [ ] SSL provisioning
- [ ] Domain routing

### Phase 3: Client Portal (Q4 2026)
- [ ] Portal branding
- [ ] Feature toggles
- [ ] Custom navigation
- [ ] Support widget integration

### Phase 4: Email System (Q1 2027)
- [ ] Email template editor
- [ ] Variable substitution
- [ ] Email preview
- [ ] Send test emails

---

**Version:** 1.0.0  
**Status:** Architecture Ready  
**Last Updated:** 2026-05-27