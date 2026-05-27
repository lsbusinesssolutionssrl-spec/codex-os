import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { api_key_id } = await req.json();

    if (!api_key_id) {
      return Response.json({ 
        allowed: false, 
        error: 'Missing api_key_id' 
      }, { status: 400 });
    }

    const apiKey = await base44.entities.APIKey.get(api_key_id);
    
    if (!apiKey || apiKey.status !== 'Active') {
      return Response.json({ 
        allowed: false, 
        error: 'Invalid or inactive API key' 
      }, { status: 401 });
    }

    const rateLimit = apiKey.rate_limit || 100; // default 100 req/min
    
    // Check usage in last minute (placeholder - would need time-series data)
    // For now, just return the limit info
    return Response.json({
      allowed: true,
      rate_limit: rateLimit,
      remaining: rateLimit, // Placeholder - would track actual usage
      reset_in_seconds: 60,
      limit_type: apiKey.type,
    });
  } catch (error) {
    return Response.json({ 
      allowed: false, 
      error: error.message 
    }, { status: 500 });
  }
});