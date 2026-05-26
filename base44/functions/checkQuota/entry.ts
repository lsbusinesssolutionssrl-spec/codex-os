import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resource_type, action = 'create', quantity = 1 } = await req.json();

    // Get user's company
    const users = await base44.entities.User.filter({ email: user.email });
    if (users.length === 0 || !users[0].company_id) {
      return Response.json({ error: 'User not associated with any company' }, { status: 404 });
    }

    const company_id = users[0].company_id;

    // Get active subscription
    const subscriptions = await base44.entities.CompanySubscription.filter({
      company_id,
      status: 'active'
    });

    if (subscriptions.length === 0) {
      return Response.json({ 
        error: 'No active subscription found',
        allowed: false 
      }, { status: 402 });
    }

    const subscription = subscriptions[0];
    const plan = await base44.entities.SubscriptionPlan.get(subscription.plan_id);
    
    if (!plan || !plan.is_active) {
      return Response.json({ 
        error: 'Subscription plan is not active',
        allowed: false 
      }, { status: 402 });
    }

    const quotas = plan.quotas || {};
    const quotaKey = `max_${resource_type}`;
    const quotaLimit = quotas[quotaKey];

    // If no quota defined for this resource, allow
    if (!quotaLimit) {
      return Response.json({ allowed: true, current: 0, limit: null });
    }

    // Count current usage
    let currentUsage;
    if (resource_type === 'storage') {
      // Calculate storage from UsageLog
      const logs = await base44.entities.UsageLog.filter({
        company_id,
        resource_type: 'storage'
      });
      currentUsage = logs.reduce((sum, log) => sum + (log.quantity || 0), 0);
    } else if (resource_type === 'ai_request' || resource_type === 'estimate' || resource_type === 'ticket') {
      // Count for current month
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const logs = await base44.entities.UsageLog.filter({
        company_id,
        resource_type,
        action: 'create'
      });
      currentUsage = logs.filter(log => new Date(log.timestamp) >= monthStart).length;
    } else {
      // Count active records
      const entityMap = {
        'user': 'User',
        'project': 'Project',
        'client': 'Client',
        'property': 'Property',
        'guardian_subscription': 'GuardianSubscription'
      };
      const entityName = entityMap[resource_type];
      if (entityName) {
        const records = await base44.entities[entityName].filter({ company_id });
        currentUsage = records.length;
      } else {
        currentUsage = 0;
      }
    }

    const allowed = (currentUsage + quantity) <= quotaLimit;

    return Response.json({
      allowed,
      current: currentUsage,
      limit: quotaLimit,
      remaining: Math.max(0, quotaLimit - currentUsage),
      exceeded: !allowed
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});