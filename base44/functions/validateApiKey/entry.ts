import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get API key from header
    const authHeader = req.headers.get('Authorization') || '';
    const apiKey = authHeader.replace('Bearer ', '');
    
    if (!apiKey) {
      return Response.json({ 
        valid: false, 
        error: 'Missing API key' 
      }, { status: 401 });
    }

    // Find API key (check prefix since we store hashed)
    const apiKeys = await base44.entities.APIKey.filter({ status: 'Active' });
    const matchingKey = apiKeys.find(k => apiKey.startsWith(k.key_prefix));
    
    if (!matchingKey) {
      return Response.json({ 
        valid: false, 
        error: 'Invalid API key' 
      }, { status: 401 });
    }

    // Check expiration
    if (matchingKey.expires_at && new Date(matchingKey.expires_at) < new Date()) {
      return Response.json({ 
        valid: false, 
        error: 'API key expired' 
      }, { status: 401 });
    }

    // Check IP whitelist (if configured)
    const clientIP = req.headers.get('X-Forwarded-For') || 'unknown';
    if (matchingKey.ip_whitelist && matchingKey.ip_whitelist.length > 0) {
      if (!matchingKey.ip_whitelist.includes(clientIP)) {
        return Response.json({ 
          valid: false, 
          error: 'IP not whitelisted' 
        }, { status: 403 });
      }
    }

    // Update usage tracking
    await base44.entities.APIKey.update(matchingKey.id, {
      last_used: new Date().toISOString(),
      usage_count: (matchingKey.usage_count || 0) + 1
    });

    // Log API usage for audit
    await base44.entities.AuditLog.create({
      company_id: matchingKey.company_id,
      action: 'api.key_used',
      entity_type: 'APIKey',
      entity_id: matchingKey.id,
      details: {
        key_name: matchingKey.name,
        key_type: matchingKey.type,
        ip_address: clientIP,
        endpoint: new URL(req.url).pathname,
      },
      created_by: `api:${matchingKey.key_prefix}`,
    });

    return Response.json({ 
      valid: true,
      company_id: matchingKey.company_id,
      permissions: matchingKey.permissions,
      rate_limit: matchingKey.rate_limit,
      type: matchingKey.type,
    });
  } catch (error) {
    return Response.json({ 
      valid: false, 
      error: error.message 
    }, { status: 500 });
  }
});