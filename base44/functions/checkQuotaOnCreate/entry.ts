import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Automation function: called on entity create to check quota before allowing
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (!data || !event || event.type !== 'create') {
      return Response.json({ allowed: true }); // Only check on create
    }

    const entityName = event.entity_name;
    const record = data;

    // Map entity to resource_type
    const entityToResource = {
      'User': 'user',
      'Project': 'project',
      'Estimate': 'estimate',
      'SupportTicket': 'ticket',
      'Client': 'client',
      'Property': 'property',
      'GuardianSubscription': 'guardian_subscription'
    };

    const resource_type = entityToResource[entityName];
    if (!resource_type) {
      return Response.json({ allowed: true }); // No quota for this entity
    }

    // Get company_id from the record being created
    const company_id = record.company_id;
    if (!company_id) {
      return Response.json({ 
        allowed: false, 
        error: 'Missing company_id - cannot enforce quota' 
      }, { status: 400 });
    }

    // Get active subscription for this company
    const subscriptions = await base44.entities.CompanySubscription.filter({
      company_id,
      status: 'active'
    });

    if (subscriptions.length === 0) {
      return Response.json({ 
        allowed: false, 
        error: 'No active subscription found for this company' 
      }, { status: 402 });
    }

    const subscription = subscriptions[0];
    const plan = await base44.entities.SubscriptionPlan.get(subscription.plan_id);
    
    if (!plan || !plan.is_active) {
      return Response.json({ 
        allowed: false, 
        error: 'Subscription plan is not active' 
      }, { status: 402 });
    }

    const quotas = plan.quotas || {};
    const quotaKey = `max_${resource_type}`;
    const quotaLimit = quotas[quotaKey];

    // If no quota defined, allow
    if (!quotaLimit) {
      return Response.json({ allowed: true });
    }

    // Count current usage
    let currentUsage;
    if (resource_type === 'user') {
      const users = await base44.entities.User.filter({ company_id });
      currentUsage = users.length;
    } else if (resource_type === 'project') {
      const projects = await base44.entities.Project.filter({ company_id });
      currentUsage = projects.length;
    } else if (resource_type === 'estimate') {
      // Count estimates created this month
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const estimates = await base44.entities.Estimate.filter({ company_id });
      currentUsage = estimates.filter(e => new Date(e.created_date) >= monthStart).length;
    } else if (resource_type === 'ticket') {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const tickets = await base44.entities.SupportTicket.filter({ company_id });
      currentUsage = tickets.filter(t => new Date(t.created_date) >= monthStart).length;
    } else if (resource_type === 'client') {
      const clients = await base44.entities.Client.filter({ company_id });
      currentUsage = clients.length;
    } else if (resource_type === 'property') {
      const properties = await base44.entities.Property.filter({ company_id });
      currentUsage = properties.length;
    } else if (resource_type === 'guardian_subscription') {
      const guardians = await base44.entities.GuardianSubscription.filter({ company_id });
      currentUsage = guardians.length;
    } else {
      currentUsage = 0;
    }

    const allowed = (currentUsage + 1) <= quotaLimit;

    if (!allowed) {
      return Response.json({
        allowed: false,
        error: `Quota exceeded for ${resource_type}. Current: ${currentUsage}, Limit: ${quotaLimit}. Please upgrade your plan.`,
        current: currentUsage,
        limit: quotaLimit
      }, { status: 402 });
    }

    return Response.json({ allowed: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});