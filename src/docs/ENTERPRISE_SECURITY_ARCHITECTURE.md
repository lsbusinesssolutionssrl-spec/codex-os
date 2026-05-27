# Codex OS - Enterprise Security Architecture

## Overview

Comprehensive enterprise security features including SSO, MFA, IP restrictions, audit exports, and compliance frameworks.

---

## 1. Single Sign-On (SSO) Architecture

### 1.1 Supported Identity Providers

**SAML 2.0 Providers:**
- Okta
- Azure Active Directory (Microsoft Entra ID)
- OneLogin
- Ping Identity
- Keycloak
- Auth0
- Google Workspace

**OIDC Providers:**
- Google
- Microsoft
- Auth0
- Keycloak
- Custom OIDC providers

### 1.2 SSO Configuration Entity

```json
{
  "name": "SSOConfiguration",
  "type": "object",
  "properties": {
    "company_id": { "type": "string" },
    "provider_type": {
      "type": "string",
      "enum": ["saml", "oidc", "oauth2"]
    },
    "provider_name": {
      "type": "string",
      "enum": ["okta", "azure_ad", "onelogin", "ping", "keycloak", "auth0", "google", "custom"]
    },
    "enabled": { "type": "boolean", "default": false },
    "enforced": { "type": "boolean", "default": false },
    "entity_id": { "type": "string" },
    "acs_url": { "type": "string" },
    "sso_url": { "type": "string" },
    "slo_url": { "type": "string" },
    "certificate_public": { "type": "string" },
    "certificate_private": { "type": "string" },
    "client_id": { "type": "string" },
    "client_secret": { "type": "string" },
    "issuer": { "type": "string" },
    "scopes": {
      "type": "array",
      "items": { "type": "string" }
    },
    "attribute_mapping": {
      "type": "object",
      "properties": {
        "email": { "type": "string" },
        "full_name": { "type": "string" },
        "first_name": { "type": "string" },
        "last_name": { "type": "string" },
        "role": { "type": "string" },
        "groups": { "type": "string" },
        "department": { "type": "string" }
      }
    },
    "role_mapping": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "idp_group": { "type": "string" },
          "platform_role": { "type": "string" }
        }
      }
    },
    "auto_provision_users": { "type": "boolean", "default": true },
    "auto_deprovision_users": { "type": "boolean", "default": false },
    "login_hint": { "type": "string" },
    "idp_initiated_login": { "type": "boolean", "default": false },
    "sp_initiated_login": { "type": "boolean", "default": true },
    "session_timeout_hours": { "type": "number", "default": 8 },
    "created_date": { "type": "string" },
    "updated_date": { "type": "string" },
    "last_sync": { "type": "string" }
  },
  "required": ["company_id", "provider_type", "provider_name"]
}
```

### 1.3 SSO Session Entity

```json
{
  "name": "SSOSession",
  "type": "object",
  "properties": {
    "company_id": { "type": "string" },
    "user_email": { "type": "string" },
    "session_id": { "type": "string" },
    "idp_provider": { "type": "string" },
    "idp_user_id": { "type": "string" },
    "login_method": {
      "type": "string",
      "enum": ["sp_initiated", "idp_initiated"]
    },
    "login_time": { "type": "string" },
    "last_activity": { "type": "string" },
    "expiry_time": { "type": "string" },
    "ip_address": { "type": "string" },
    "user_agent": { "type": "string" },
    "status": {
      "type": "string",
      "enum": ["active", "expired", "revoked", "logged_out"]
    },
    "slo_requested": { "type": "boolean" },
    "metadata": { "type": "object" }
  },
  "required": ["company_id", "user_email", "session_id", "idp_provider"]
}
```

### 1.4 SAML Flow Implementation

```javascript
// functions/initiateSSO.js

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { saml } from 'npm:samlify@2.8.10';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { company_id } = await req.json();
    
    // Get SSO configuration
    const configs = await base44.entities.SSOConfiguration.filter({
      company_id,
      enabled: true,
    });
    
    if (configs.length === 0) {
      return Response.json({ error: 'SSO not configured' }, { status: 400 });
    }
    
    const config = configs[0];
    
    // Create SAML identity provider
    const idp = saml.IdentityProvider({
      metadata: config.metadata_xml,
      isEntityDescriptor: true,
    });
    
    // Create SAML service provider
    const sp = saml.ServiceProvider({
      entityID: config.entity_id,
      assertionConsumerService: [{
        Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
        Location: config.acs_url,
      }],
      singleLogoutService: [{
        Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
        Location: config.slo_url,
      }],
    });
    
    // Generate SAML request
    const { context } = sp.createLoginRequestURL(idp, {
      relayState: company_id,
    });
    
    return Response.json({ 
      success: true, 
      sso_url: context,
      provider: config.provider_name,
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// functions/handleSSOCallback.js

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { saml } from 'npm:samlify@2.8.10';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { SAMLResponse, RelayState } = await req.formData();
    
    // Get SSO configuration
    const configs = await base44.entities.SSOConfiguration.filter({
      company_id: RelayState,
      enabled: true,
    });
    
    if (configs.length === 0) {
      return Response.json({ error: 'SSO not configured' }, { status: 400 });
    }
    
    const config = configs[0];
    
    // Create IdP and SP
    const idp = saml.IdentityProvider({ metadata: config.metadata_xml });
    const sp = saml.ServiceProvider({
      entityID: config.entity_id,
      isAssertionEncrypted: false,
      requestSignatureAlgorithm: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
    });
    
    // Parse and validate SAML response
    const { extract } = await sp.parseLoginResponse(idp, 'post', {
      body: SAMLResponse,
      relayState: RelayState,
    });
    
    const { attributes, signature } = extract;
    
    // Validate signature
    if (!signature || !signature.valid) {
      throw new Error('Invalid SAML signature');
    }
    
    // Extract user attributes
    const email = attributes[config.attribute_mapping.email] || attributes.email;
    const fullName = attributes[config.attribute_mapping.full_name] || attributes.fullname;
    const groups = attributes[config.attribute_mapping.groups] || attributes.groups || [];
    
    if (!email) {
      throw new Error('Email not provided by IdP');
    }
    
    // Check if user exists
    let user = await base44.entities.User.filter({ email });
    
    if (user.length === 0 && config.auto_provision_users) {
      // Auto-provision user
      const role = mapRoleToPlatform(groups, config.role_mapping);
      
      await base44.users.inviteUser(email, role);
      user = await base44.entities.User.filter({ email });
    }
    
    if (user.length === 0) {
      throw new Error('User not found and auto-provisioning disabled');
    }
    
    // Create session
    const session = await base44.entities.SSOSession.create({
      company_id: RelayState,
      user_email: email,
      session_id: `sso_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      idp_provider: config.provider_name,
      idp_user_id: attributes.uid || email,
      login_method: 'sp_initiated',
      login_time: new Date().toISOString(),
      last_activity: new Date().toISOString(),
      expiry_time: new Date(Date.now() + config.session_timeout_hours * 60 * 60 * 1000).toISOString(),
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      user_agent: req.headers.get('user-agent'),
      status: 'active',
    });
    
    // Log SSO login event
    await base44.entities.AuditLog.create({
      company_id: RelayState,
      event_type: 'sso_login',
      user_email: email,
      details: {
        provider: config.provider_name,
        method: 'sp_initiated',
        ip_address: session.ip_address,
      },
      status: 'success',
    });
    
    // Generate platform token
    const token = await generatePlatformToken(user[0], session.session_id);
    
    return Response.json({
      success: true,
      token,
      user: {
        email: user[0].email,
        full_name: user[0].full_name,
        role: user[0].role,
      },
      session_id: session.session_id,
    });
    
  } catch (error) {
    // Log failed login
    await base44.entities.AuditLog.create({
      company_id: req.headers.get('x-company-id'),
      event_type: 'sso_login_failed',
      details: { error: error.message },
      status: 'failed',
    });
    
    return Response.json({ error: error.message }, { status: 401 });
  }
});

function mapRoleToPlatform(groups, roleMapping) {
  if (!roleMapping || roleMapping.length === 0) {
    return 'user'; // Default role
  }
  
  for (const mapping of roleMapping) {
    if (groups.includes(mapping.idp_group)) {
      return mapping.platform_role;
    }
  }
  
  return 'user'; // Default fallback
}
```

---

## 2. Multi-Factor Authentication (MFA)

### 2.1 MFA Configuration Entity

```json
{
  "name": "MFAConfiguration",
  "type": "object",
  "properties": {
    "company_id": { "type": "string" },
    "enabled": { "type": "boolean", "default": false },
    "enforced": { "type": "boolean", "default": false },
    "enforcement_rules": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "user_role": { "type": "string" },
          "require_mfa": { "type": "boolean" },
          "ip_ranges": { "type": "array", "items": { "type": "string" } },
          "login_location": { "type": "string" }
        }
      }
    },
    "allowed_methods": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["totp", "sms", "email", "webauthn", "backup_codes"]
      }
    },
    "default_method": {
      "type": "string",
      "enum": ["totp", "sms", "email", "webauthn"],
      "default": "totp"
    },
    "remember_device_days": { "type": "number", "default": 30 },
    "backup_codes_count": { "type": "number", "default": 10 },
    "sms_provider": {
      "type": "string",
      "enum": ["twilio", "aws_sns", "vonage"]
    },
    "grace_period_logins": { "type": "number", "default": 3 }
  },
  "required": ["company_id"]
}
```

### 2.2 User MFA Entity

```json
{
  "name": "UserMFA",
  "type": "object",
  "properties": {
    "company_id": { "type": "string" },
    "user_email": { "type": "string" },
    "enabled": { "type": "boolean", "default": false },
    "verified": { "type": "boolean", "default": false },
    "primary_method": {
      "type": "string",
      "enum": ["totp", "sms", "email", "webauthn"]
    },
    "totp_secret": { "type": "string" },
    "totp_verified": { "type": "boolean", "default": false },
    "phone_number": { "type": "string" },
    "phone_verified": { "type": "boolean", "default": false },
    "webauthn_credentials": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "credential_id": { "type": "string" },
          "public_key": { "type": "string" },
          "device_name": { "type": "string" },
          "created_date": { "type": "string" },
          "last_used": { "type": "string" }
        }
      }
    },
    "backup_codes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "code_hash": { "type": "string" },
          "used": { "type": "boolean" },
          "used_date": { "type": "string" }
        }
      }
    },
    "trusted_devices": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "device_id": { "type": "string" },
          "device_name": { "type": "string" },
          "trusted_until": { "type": "string" },
          "created_date": { "type": "string" }
        }
      }
    },
    "grace_period_remaining": { "type": "number" },
    "last_mfa_date": { "type": "string" },
    "failed_attempts": { "type": "number", "default": 0 },
    "locked_until": { "type": "string" }
  },
  "required": ["company_id", "user_email"]
}
```

### 2.3 TOTP Implementation

```javascript
// functions/setupTOTP.js

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { authenticator } from 'npm:otpauth@9.1.2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Generate TOTP secret
    const totp = new authenticator.TOTP({
      issuer: 'Codex OS',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });
    
    const secret = totp.getSecret();
    const otpauth = totp.toString();
    
    // Store secret (not verified yet)
    await base44.entities.UserMFA.upsert({
      company_id: user.company_id,
      user_email: user.email,
      totp_secret: secret,
      totp_verified: false,
    });
    
    // Generate QR code
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(otpauth)}&size=300x300`;
    
    return Response.json({
      success: true,
      secret: secret.base32,
      otpauth,
      qr_code_url: qrCodeUrl,
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// functions/verifyTOTP.js

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { authenticator } from 'npm:otpauth@9.1.2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { totp_code } = await req.json();
    const user = await base44.auth.me();
    
    const mfa = await base44.entities.UserMFA.filter({
      company_id: user.company_id,
      user_email: user.email,
    });
    
    if (mfa.length === 0 || !mfa[0].totp_secret) {
      return Response.json({ error: 'TOTP not configured' }, { status: 400 });
    }
    
    const totp = new authenticator.TOTP({
      issuer: 'Codex OS',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: authenticator.Secret.fromBase32(mfa[0].totp_secret),
    });
    
    const delta = totp.validate({ token: totp_code, window: 1 });
    
    if (delta === null) {
      // Invalid code
      await base44.entities.UserMFA.update(mfa[0].id, {
        failed_attempts: (mfa[0].failed_attempts || 0) + 1,
      });
      
      return Response.json({ 
        success: false, 
        error: 'Invalid TOTP code',
        attempts_remaining: 5 - (mfa[0].failed_attempts || 0),
      }, { status: 400 });
    }
    
    // Verify successful
    await base44.entities.UserMFA.update(mfa[0].id, {
      totp_verified: true,
      verified: true,
      enabled: true,
      failed_attempts: 0,
      last_mfa_date: new Date().toISOString(),
    });
    
    // Log MFA enablement
    await base44.entities.AuditLog.create({
      company_id: user.company_id,
      event_type: 'mfa_enabled',
      user_email: user.email,
      details: { method: 'totp' },
      status: 'success',
    });
    
    return Response.json({ success: true });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// functions/verifyMFA.js (for login)

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { authenticator } from 'npm:otpauth@9.1.2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { mfa_code, method = 'totp', session_id } = await req.json();
    
    const session = await base44.entities.SSOSession.filter({ session_id });
    
    if (session.length === 0) {
      return Response.json({ error: 'Invalid session' }, { status: 400 });
    }
    
    const mfa = await base44.entities.UserMFA.filter({
      company_id: session[0].company_id,
      user_email: session[0].user_email,
    });
    
    if (mfa.length === 0 || !mfa[0].enabled) {
      return Response.json({ error: 'MFA not enabled' }, { status: 400 });
    }
    
    // Check if locked
    if (mfa[0].locked_until && new Date(mfa[0].locked_until) > new Date()) {
      return Response.json({ 
        error: 'MFA temporarily locked due to failed attempts',
        locked_until: mfa[0].locked_until,
      }, { status: 403 });
    }
    
    let verified = false;
    
    if (method === 'totp') {
      const totp = new authenticator.TOTP({
        issuer: 'Codex OS',
        label: mfa[0].user_email,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: authenticator.Secret.fromBase32(mfa[0].totp_secret),
      });
      
      const delta = totp.validate({ token: mfa_code, window: 1 });
      verified = delta !== null;
      
    } else if (method === 'backup_codes') {
      const codeHash = await hashBackupCode(mfa_code);
      const backupCode = mfa[0].backup_codes?.find(bc => bc.code_hash === codeHash && !bc.used);
      
      if (backupCode) {
        verified = true;
        // Mark code as used
        const updatedCodes = mfa[0].backup_codes.map(bc => 
          bc.code_hash === codeHash ? { ...bc, used: true, used_date: new Date().toISOString() } : bc
        );
        await base44.entities.UserMFA.update(mfa[0].id, { backup_codes: updatedCodes });
      }
    }
    
    if (!verified) {
      const failedAttempts = (mfa[0].failed_attempts || 0) + 1;
      
      // Lock after 5 failed attempts
      if (failedAttempts >= 5) {
        await base44.entities.UserMFA.update(mfa[0].id, {
          failed_attempts: failedAttempts,
          locked_until: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
        });
        
        return Response.json({ 
          error: 'Too many failed attempts. Account locked for 15 minutes.',
          locked_until: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        }, { status: 403 });
      }
      
      await base44.entities.UserMFA.update(mfa[0].id, {
        failed_attempts: failedAttempts,
      });
      
      return Response.json({ 
        success: false, 
        error: 'Invalid MFA code',
        attempts_remaining: 5 - failedAttempts,
      }, { status: 400 });
    }
    
    // MFA verified successfully
    await base44.entities.UserMFA.update(mfa[0].id, {
      failed_attempts: 0,
      last_mfa_date: new Date().toISOString(),
    });
    
    await base44.entities.SSOSession.update(session[0].id, {
      status: 'active',
      mfa_verified: true,
    });
    
    // Log successful MFA
    await base44.entities.AuditLog.create({
      company_id: session[0].company_id,
      event_type: 'mfa_verified',
      user_email: session[0].user_email,
      details: { method, session_id },
      status: 'success',
    });
    
    return Response.json({ success: true });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function hashBackupCode(code) {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

---

## 3. IP Restrictions

### 3.1 IP Whitelist Entity

```json
{
  "name": "IPWhitelist",
  "type": "object",
  "properties": {
    "company_id": { "type": "string" },
    "name": { "type": "string" },
    "ip_ranges": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "start_ip": { "type": "string" },
          "end_ip": { "type": "string" },
          "cidr": { "type": "string" },
          "description": { "type": "string" }
        }
      }
    },
    "enabled": { "type": "boolean", "default": true },
    "enforcement_mode": {
      "type": "string",
      "enum": ["allow", "block"],
      "default": "allow"
    },
    "apply_to_roles": {
      "type": "array",
      "items": { "type": "string" }
    },
    "apply_to_endpoints": {
      "type": "array",
      "items": { "type": "string" }
    },
    "bypass_mfa": { "type": "boolean", "default": false },
    "created_by": { "type": "string" },
    "created_date": { "type": "string" }
  },
  "required": ["company_id", "ip_ranges"]
}
```

### 3.2 IP Restriction Middleware

```javascript
// middleware/ipRestriction.js

import ipaddr from 'npm:ipaddr.js@2.1.0';

export async function ipRestrictionMiddleware(req, company) {
  const clientIP = getClientIP(req);
  
  if (!clientIP) {
    return { allowed: true }; // Can't determine IP, allow
  }
  
  const whitelists = await base44.entities.IPWhitelist.filter({
    company_id: company.id,
    enabled: true,
  });
  
  if (whitelists.length === 0) {
    return { allowed: true }; // No restrictions configured
  }
  
  const user = await base44.auth.me();
  const userRole = user?.role;
  const endpoint = new URL(req.url).pathname;
  
  for (const whitelist of whitelists) {
    // Check if applies to user role
    if (whitelist.apply_to_roles && whitelist.apply_to_roles.length > 0) {
      if (!whitelist.apply_to_roles.includes(userRole)) {
        continue;
      }
    }
    
    // Check if applies to endpoint
    if (whitelist.apply_to_endpoints && whitelist.apply_to_endpoints.length > 0) {
      const applies = whitelist.apply_to_endpoints.some(pattern => 
        endpoint.match(new RegExp(pattern.replace('*', '.*')))
      );
      if (!applies) {
        continue;
      }
    }
    
    // Check IP against ranges
    const ipMatch = checkIPMatch(clientIP, whitelist.ip_ranges);
    
    if (whitelist.enforcement_mode === 'allow') {
      if (!ipMatch) {
        // IP not in allowed list
        await logIPViolation(company.id, user?.email, clientIP, 'not_in_whitelist');
        
        return {
          allowed: false,
          error: 'Access denied: IP address not in allowed list',
          code: 'IP_NOT_ALLOWED',
        };
      }
      
      if (whitelist.bypass_mfa) {
        return { allowed: true, bypass_mfa: true };
      }
      
    } else if (whitelist.enforcement_mode === 'block') {
      if (ipMatch) {
        // IP in blocked list
        await logIPViolation(company.id, user?.email, clientIP, 'in_blocklist');
        
        return {
          allowed: false,
          error: 'Access denied: IP address is blocked',
          code: 'IP_BLOCKED',
        };
      }
    }
  }
  
  return { allowed: true };
}

function getClientIP(req) {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip');
}

function checkIPMatch(ipString, ranges) {
  try {
    const ip = ipaddr.parse(ipString);
    
    for (const range of ranges) {
      if (range.cidr) {
        const [subnet, prefix] = range.cidr.split('/');
        const subnetAddr = ipaddr.parse(subnet);
        const prefixLen = parseInt(prefix);
        
        if (ip.kind() === subnetAddr.kind() && ip.match(subnetAddr, prefixLen)) {
          return true;
        }
      } else if (range.start_ip && range.end_ip) {
        const start = ipaddr.parse(range.start_ip);
        const end = ipaddr.parse(range.end_ip);
        
        if (ip.kind() === start.kind() && 
            ipaddr.compare(ip, start) >= 0 && 
            ipaddr.compare(ip, end) <= 0) {
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('IP validation error:', error);
    return false;
  }
}

async function logIPViolation(companyId, userEmail, ip, reason) {
  await base44.entities.AuditLog.create({
    company_id: companyId,
    event_type: 'ip_violation',
    user_email: userEmail,
    details: {
      ip_address: ip,
      reason,
      user_agent: req.headers.get('user-agent'),
      endpoint: new URL(req.url).pathname,
    },
    status: 'blocked',
  });
}
```

---

## 4. Audit Log Exports

### 4.1 Enhanced AuditLog Entity

```json
{
  "name": "AuditLog",
  "type": "object",
  "properties": {
    "company_id": { "type": "string" },
    "brand_id": { "type": "string" },
    "event_type": {
      "type": "string",
      "enum": [
        "login",
        "logout",
        "login_failed",
        "sso_login",
        "sso_login_failed",
        "mfa_enabled",
        "mfa_verified",
        "mfa_failed",
        "password_changed",
        "user_created",
        "user_updated",
        "user_deleted",
        "role_changed",
        "permission_changed",
        "data_export",
        "data_import",
        "api_key_created",
        "api_key_revoked",
        "ip_violation",
        "data_access",
        "data_modified",
        "data_deleted",
        "config_changed",
        "integration_added",
        "integration_removed",
        "workflow_executed",
        "workflow_failed",
        "compliance_event"
      ]
    },
    "user_email": { "type": "string" },
    "user_role": { "type": "string" },
    "ip_address": { "type": "string" },
    "user_agent": { "type": "string" },
    "endpoint": { "type": "string" },
    "method": { "type": "string" },
    "entity_type": { "type": "string" },
    "entity_id": { "type": "string" },
    "action": { "type": "string" },
    "details": { "type": "object" },
    "status": {
      "type": "string",
      "enum": ["success", "failed", "blocked", "warning"]
    },
    "risk_score": { "type": "number", "default": 0 },
    "session_id": { "type": "string" },
    "device_id": { "type": "string" },
    "location": {
      "type": "object",
      "properties": {
        "country": { "type": "string" },
        "city": { "type": "string" },
        "region": { "type": "string" },
        "coordinates": {
          "type": "object",
          "properties": {
            "latitude": { "type": "number" },
            "longitude": { "type": "number" }
          }
        }
      }
    },
    "created_date": { "type": "string" }
  },
  "required": ["company_id", "event_type", "status"]
}
```

### 4.2 Audit Export Function

```javascript
// functions/exportAuditLogs.js

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { Parser } from 'npm:json2csv@6.0.0-alpha.2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user.role !== 'admin' && user.role !== 'company_admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const { 
      start_date, 
      end_date, 
      event_types, 
      users, 
      format = 'csv',
      include_details = true,
    } = await req.json();
    
    // Build query
    const query = {
      company_id: user.company_id,
      created_date: {
        $gte: start_date,
        $lte: end_date,
      },
    };
    
    if (event_types && event_types.length > 0) {
      query.event_type = { $in: event_types };
    }
    
    if (users && users.length > 0) {
      query.user_email = { $in: users };
    }
    
    // Fetch audit logs
    const logs = await base44.entities.AuditLog.filter(query);
    
    // Sort by date descending
    logs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    
    // Format for export
    let fileContent;
    let mimeType;
    let extension;
    
    if (format === 'csv') {
      const fields = [
        'created_date',
        'event_type',
        'user_email',
        'user_role',
        'ip_address',
        'endpoint',
        'method',
        'entity_type',
        'entity_id',
        'action',
        'status',
        'risk_score',
      ];
      
      const parser = new Parser({ fields });
      fileContent = parser.parse(logs);
      mimeType = 'text/csv';
      extension = 'csv';
      
    } else if (format === 'json') {
      fileContent = JSON.stringify(logs, null, 2);
      mimeType = 'application/json';
      extension = 'json';
      
    } else if (format === 'pdf') {
      // Generate PDF report
      const pdfData = await generateAuditPDF(logs, {
        company_name: user.company_name,
        date_range: { start_date, end_date },
        generated_by: user.email,
      });
      fileContent = pdfData;
      mimeType = 'application/pdf';
      extension = 'pdf';
    }
    
    // Upload file
    const { file_url } = await base44.integrations.Core.UploadFile({
      file: new Blob([fileContent], { type: mimeType }),
    });
    
    // Log export event
    await base44.entities.AuditLog.create({
      company_id: user.company_id,
      event_type: 'data_export',
      user_email: user.email,
      details: {
        export_type: 'audit_logs',
        format,
        record_count: logs.length,
        date_range: { start_date, end_date },
      },
      status: 'success',
    });
    
    return Response.json({
      success: true,
      file_url,
      record_count: logs.length,
      format,
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function generateAuditPDF(logs, options) {
  const { jsPDF } = await import('npm:jspdf@4.0.0');
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('Audit Log Report', 20, 20);
  
  doc.setFontSize(12);
  doc.text(`Company: ${options.company_name}`, 20, 30);
  doc.text(`Date Range: ${options.date_range.start_date} - ${options.date_range.end_date}`, 20, 38);
  doc.text(`Generated: ${new Date().toISOString()}`, 20, 46);
  doc.text(`Generated By: ${options.generated_by}`, 20, 54);
  
  // Summary statistics
  const stats = {
    total: logs.length,
    by_event_type: {},
    by_status: {},
    by_user: {},
  };
  
  logs.forEach(log => {
    stats.by_event_type[log.event_type] = (stats.by_event_type[log.event_type] || 0) + 1;
    stats.by_status[log.status] = (stats.by_status[log.status] || 0) + 1;
    stats.by_user[log.user_email] = (stats.by_user[log.user_email] || 0) + 1;
  });
  
  doc.setFontSize(14);
  doc.text('Summary', 20, 70);
  
  doc.setFontSize(10);
  doc.text(`Total Events: ${stats.total}`, 20, 80);
  doc.text(`Successful: ${stats.by_status['success'] || 0}`, 20, 86);
  doc.text(`Failed: ${stats.by_status['failed'] || 0}`, 20, 92);
  doc.text(`Blocked: ${stats.by_status['blocked'] || 0}`, 20, 98);
  
  // Event breakdown
  let y = 110;
  doc.text('Events by Type:', 20, y);
  y += 6;
  
  Object.entries(stats.by_event_type)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([type, count]) => {
      doc.text(`  ${type}: ${count}`, 25, y);
      y += 5;
    });
  
  // Detailed logs (paginated)
  y += 10;
  doc.text('Detailed Logs', 20, y);
  y += 6;
  
  const pageSize = 50;
  const totalPages = Math.ceil(logs.length / pageSize);
  
  for (let page = 0; page < Math.min(5, totalPages); page++) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    
    const pageLogs = logs.slice(page * pageSize, (page + 1) * pageSize);
    
    pageLogs.forEach((log, idx) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      
      doc.text(
        `${new Date(log.created_date).toLocaleString()} - ${log.event_type} - ${log.user_email} - ${log.status}`,
        20,
        y
      );
      y += 5;
    });
  }
  
  return doc.output('arraybuffer');
}
```

---

## 5. Compliance Frameworks

### 5.1 Compliance Configuration Entity

```json
{
  "name": "ComplianceFramework",
  "type": "object",
  "properties": {
    "company_id": { "type": "string" },
    "framework": {
      "type": "string",
      "enum": [
        "gdpr",
        "hipaa",
        "soc2",
        "iso27001",
        "pci_dss",
        "ccpa",
        "fedramp",
        "hitec",
        "custom"
      ]
    },
    "enabled": { "type": "boolean", "default": false },
    "certification_date": { "type": "string" },
    "expiry_date": { "type": "string" },
    "auditor": { "type": "string" },
    "certificate_url": { "type": "string" },
    "controls": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "control_id": { "type": "string" },
          "control_name": { "type": "string" },
          "category": { "type": "string" },
          "status": {
            "type": "string",
            "enum": ["implemented", "partially_implemented", "not_implemented", "not_applicable"]
          },
          "evidence": {
            "type": "array",
            "items": { "type": "string" }
          },
          "last_reviewed": { "type": "string" },
          "next_review": { "type": "string" },
          "owner": { "type": "string" },
          "notes": { "type": "string" }
        }
      }
    },
    "data_residency": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["eu", "us", "uk", "ca", "au", "jp", "global"]
      }
    },
    "data_retention_days": { "type": "number" },
    "encryption_required": { "type": "boolean", "default": true },
    "audit_log_retention_days": { "type": "number", "default": 2555 },
    "mfa_required": { "type": "boolean", "default": false },
    "sso_required": { "type": "boolean", "default": false },
    "ip_restrictions_required": { "type": "boolean", "default": false },
    "data_classification_enabled": { "type": "boolean", "default": false },
    "dlp_enabled": { "type": "boolean", "default": false },
    "privacy_officer": { "type": "string" },
    "security_officer": { "type": "string" }
  },
  "required": ["company_id", "framework"]
}
```

### 5.2 GDPR Compliance Features

```javascript
// GDPR Data Subject Rights

// functions/gdprDataExport.js (Right to Access)

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { user_email } = await req.json();
    const requestingUser = await base44.auth.me();
    
    // Verify authorization (user can request their own data, admin can request any)
    if (requestingUser.email !== user_email && requestingUser.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Collect all user data
    const userData = {
      profile: await base44.entities.User.filter({ email: user_email }),
      projects: await base44.entities.Project.filter({ created_by: user_email }),
      estimates: await base44.entities.Estimate.filter({ created_by: user_email }),
      audit_logs: await base44.entities.AuditLog.filter({ user_email }),
      sessions: await base44.entities.SSOSession.filter({ user_email }),
      // Add more entities as needed
    };
    
    // Generate comprehensive report
    const report = {
      data_subject: user_email,
      request_date: new Date().toISOString(),
      generated_by: requestingUser.email,
      data_categories: userData,
      summary: {
        total_projects: userData.projects.length,
        total_estimates: userData.estimates.length,
        total_audit_events: userData.audit_logs.length,
        account_created: userData.profile[0]?.created_date,
        last_login: userData.sessions[0]?.last_activity,
      },
    };
    
    // Log data export
    await base44.entities.AuditLog.create({
      company_id: requestingUser.company_id,
      event_type: 'data_export',
      user_email: requestingUser.email,
      details: {
        export_type: 'gdpr_data_subject_access',
        subject_email: user_email,
      },
      status: 'success',
    });
    
    return Response.json({
      success: true,
      data: report,
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// functions/gdprDataDeletion.js (Right to be Forgotten)

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { user_email, confirmation } = await req.json();
    const requestingUser = await base44.auth.me();
    
    if (confirmation !== 'DELETE_ALL_DATA') {
      return Response.json({ 
        error: 'Confirmation required. Please set confirmation to "DELETE_ALL_DATA"' 
      }, { status: 400 });
    }
    
    // Soft delete - mark for deletion
    await base44.entities.User.update({ email: user_email }, {
      status: 'pending_deletion',
      deletion_requested: new Date().toISOString(),
      deletion_requested_by: requestingUser.email,
    });
    
    // Schedule deletion job (30-day grace period for GDPR)
    await base44.entities.AsyncJob.create({
      company_id: requestingUser.company_id,
      job_type: 'data_deletion',
      priority: 'high',
      status: 'scheduled',
      payload: {
        user_email,
        deletion_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      scheduled_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
    
    // Log deletion request
    await base44.entities.AuditLog.create({
      company_id: requestingUser.company_id,
      event_type: 'data_deletion_requested',
      user_email: requestingUser.email,
      details: {
        subject_email: user_email,
        deletion_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      status: 'success',
    });
    
    return Response.json({
      success: true,
      message: 'Deletion scheduled. Data will be deleted in 30 days.',
      deletion_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
```

### 5.3 Compliance Checklist

```javascript
// Compliance requirement mappings

const complianceRequirements = {
  gdpr: {
    'article_5_1a': {
      name: 'Lawfulness, fairness, transparency',
      controls: [
        'privacy_policy_published',
        'consent_management',
        'data_processing_agreements',
      ],
    },
    'article_5_1b': {
      name: 'Purpose limitation',
      controls: [
        'data_classification',
        'purpose_documentation',
      ],
    },
    'article_5_1c': {
      name: 'Data minimization',
      controls: [
        'data_retention_policies',
        'automatic_deletion',
      ],
    },
    'article_17': {
      name: 'Right to erasure',
      controls: [
        'data_export_functionality',
        'data_deletion_functionality',
        'deletion_workflows',
      ],
    },
    'article_20': {
      name: 'Right to data portability',
      controls: [
        'data_export_csv',
        'data_export_json',
        'structured_format',
      ],
    },
    'article_25': {
      name: 'Data protection by design',
      controls: [
        'encryption_at_rest',
        'encryption_in_transit',
        'access_controls',
        'audit_logging',
      ],
    },
    'article_30': {
      name: 'Records of processing activities',
      controls: [
        'audit_logs',
        'data_processing_register',
      ],
    },
    'article_32': {
      name: 'Security of processing',
      controls: [
        'mfa',
        'sso',
        'ip_restrictions',
        'encryption',
        'access_reviews',
      ],
    },
  },
  
  hipaa: {
    '164.308_a_1': {
      name: 'Security Management Process',
      controls: [
        'risk_assessment',
        'risk_management',
        'sanction_policy',
        'information_system_activity_review',
      ],
    },
    '164.308_a_4': {
      name: 'Information Access Management',
      controls: [
        'access_controls',
        'role_based_access',
        'minimum_necessary',
      ],
    },
    '164.312_a_1': {
      name: 'Access Control',
      controls: [
        'unique_user_identification',
        'emergency_access_procedure',
        'automatic_logoff',
        'encryption_decryption',
      ],
    },
    '164.312_b': {
      name: 'Audit Controls',
      controls: [
        'audit_logs',
        'log_monitoring',
        'log_retention',
      ],
    },
    '164.312_e_1': {
      name: 'Person or Entity Authentication',
      controls: [
        'mfa',
        'password_policies',
        'session_management',
      ],
    },
  },
  
  soc2: {
    'cc1_1': {
      name: 'Control Environment',
      controls: [
        'code_of_conduct',
        'organizational_structure',
        'accountability',
      ],
    },
    'cc6_1': {
      name: 'Logical and Physical Access Controls',
      controls: [
        'access_provisioning',
        'access_revocation',
        'access_reviews',
        'mfa',
        'encryption',
      ],
    },
    'cc6_6': {
      name: 'System Boundaries',
      controls: [
        'network_security',
        'firewall_configuration',
        'intrusion_detection',
      ],
    },
    'cc7_2': {
      name: 'System Monitoring',
      controls: [
        'intrusion_detection',
        'anomaly_detection',
        'incident_response',
      ],
    },
    'cc8_1': {
      name: 'Change Management',
      controls: [
        'change_approval_process',
        'testing_requirements',
        'deployment_procedures',
      ],
    },
  },
};

// Function to check compliance status

async function checkComplianceStatus(companyId, framework) {
  const frameworks = await base44.entities.ComplianceFramework.filter({
    company_id: companyId,
    framework,
  });
  
  if (frameworks.length === 0) {
    return { compliant: false, reason: 'Framework not configured' };
  }
  
  const config = frameworks[0];
  const requirements = complianceRequirements[framework];
  
  const assessment = {
    framework,
    assessment_date: new Date().toISOString(),
    total_controls: 0,
    implemented_controls: 0,
    compliance_percentage: 0,
    controls: [],
  };
  
  for (const [article, requirement] of Object.entries(requirements)) {
    for (const control of requirement.controls) {
      assessment.total_controls++;
      
      // Check if control is implemented
      const implemented = checkControlImplementation(config, control);
      
      if (implemented) {
        assessment.implemented_controls++;
      }
      
      assessment.controls.push({
        control_id: `${article}_${control}`,
        control_name: control,
        implemented,
        evidence: config.controls?.find(c => c.control_id === control)?.evidence,
      });
    }
  }
  
  assessment.compliance_percentage = Math.round(
    (assessment.implemented_controls / assessment.total_controls) * 100
  );
  
  assessment.compliant = assessment.compliance_percentage >= 80;
  
  return assessment;
}

function checkControlImplementation(config, control) {
  const controlMappings = {
    'mfa': config.mfa_required,
    'sso': config.sso_required,
    'ip_restrictions': config.ip_restrictions_required,
    'encryption': config.encryption_required,
    'audit_logs': config.audit_log_retention_days >= 365,
    'data_retention_policies': config.data_retention_days > 0,
    // Add more mappings
  };
  
  return controlMappings[control] || false;
}
```

---

## 6. Implementation Roadmap

### Phase 1: Foundation (Q3 2026)
- [ ] SSOConfiguration entity
- [ ] SAML/OIDC integration
- [ ] MFAConfiguration entity
- [ ] TOTP implementation
- [ ] Enhanced AuditLog entity
- [ ] Basic audit exports (CSV/JSON)

### Phase 2: Advanced Security (Q4 2026)
- [ ] IPWhitelist entity
- [ ] IP restriction middleware
- [ ] WebAuthn support
- [ ] Backup codes
- [ ] SSOSession entity
- [ ] UserMFA entity
- [ ] Audit log PDF generation

### Phase 3: Compliance (Q1 2027)
- [ ] ComplianceFramework entity
- [ ] GDPR data export
- [ ] GDPR data deletion
- [ ] HIPAA controls
- [ ] SOC2 controls
- [ ] Compliance assessment tool
- [ ] Data residency enforcement

### Phase 4: Enterprise Features (Q2 2027)
- [ ] SCIM provisioning
- [ ] Advanced threat detection
- [ ] Behavioral analytics
- [ ] Session recording
- [ ] Privileged access management
- [ ] Compliance automation
- [ ] Third-party audits

---

**Version:** 1.0.0  
**Status:** Architecture Ready  
**Last Updated:** 2026-05-27