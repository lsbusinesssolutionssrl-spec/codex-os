import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * REPAIR CURRENT TENANT ADMIN MEMBERSHIP
 * 
 * Creates missing TenantMembership for the current authenticated user.
 * This fixes the root cause where tenant_admin role exists without actual membership record.
 * 
 * IMPORTANT: This function uses service role to bypass permission checks,
 * as it's meant to repair broken tenant data.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get current authenticated user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get active tenant from user's company_id (legacy but still used)
    let activeTenant;
    
    // Try to get tenant from user's company_id first
    if (user.company_id) {
      activeTenant = await base44.entities.Company.get(user.company_id);
    }
    
    // If no company_id, try to find from existing memberships
    if (!activeTenant) {
      const memberships = await base44.entities.TenantMembership.filter({
        user_id: user.id,
        status: 'active',
      });
      
      if (memberships.length > 0) {
        activeTenant = await base44.entities.Company.get(memberships[0].tenant_id);
      }
    }
    
    if (!activeTenant) {
      return Response.json({ 
        error: 'No active tenant found',
        details: 'User is not associated with any tenant. Check company_id or create membership first.'
      }, { status: 400 });
    }

    // Check if membership already exists
    const existingMemberships = await base44.entities.TenantMembership.filter({
      tenant_id: activeTenant.id,
      user_id: user.id,
    });

    if (existingMemberships.length > 0) {
      // Membership exists, just update it to active and primary
      const membership = existingMemberships[0];
      await base44.entities.TenantMembership.update(membership.id, {
        status: 'active',
        is_primary: true,
        tenant_role: membership.tenant_role || 'tenant_admin',
        joined_at: membership.joined_at || new Date().toISOString(),
      });
      
      return Response.json({
        success: true,
        action: 'updated',
        membership: {
          id: membership.id,
          user_id: user.id,
          user_email: user.email,
          tenant_id: activeTenant.id,
          tenant_name: activeTenant.name,
          tenant_role: 'tenant_admin',
          status: 'active',
          is_primary: true,
        },
        message: 'Existing membership activated',
      });
    }

    // Create new TenantMembership for current user
    const newMembership = await base44.entities.TenantMembership.create({
      user_id: user.id,
      tenant_id: activeTenant.id,
      tenant_role: 'tenant_admin',
      status: 'active',
      is_primary: true,
      invited_by: 'system',
      invited_at: new Date().toISOString(),
      joined_at: new Date().toISOString(),
      default_workspace: 'executive',
      permissions: {
        can_create_projects: true,
        can_create_estimates: true,
        can_view_financials: true,
        can_manage_team: true,
        can_access_api: true,
      },
    });

    // Also update user's company_id for backward compatibility
    await base44.entities.User.update(user.id, {
      company_id: activeTenant.id,
      role: 'admin',
    });

    return Response.json({
      success: true,
      action: 'created',
      membership: {
        id: newMembership.id,
        user_id: user.id,
        user_email: user.email,
        tenant_id: activeTenant.id,
        tenant_name: activeTenant.name,
        tenant_role: 'tenant_admin',
        status: 'active',
        is_primary: true,
      },
      message: 'TenantMembership created successfully',
    });
  } catch (error) {
    console.error('Error repairing tenant membership:', error);
    return Response.json({ 
      error: 'Failed to repair tenant membership',
      details: error.message 
    }, { status: 500 });
  }
});