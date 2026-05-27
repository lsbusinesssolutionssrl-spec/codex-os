/**
 * RBAC PERMISSION RESOLVER
 * 
 * Centralized hierarchical permission inheritance system.
 * Resolves permissions from role + enabled modules + feature flags.
 * 
 * Usage:
 *   const permissions = RBACResolver.resolvePermissions('tenant_admin', ['financial_control'], {});
 */

// Role-based default permissions
const ROLE_DEFAULTS = {
  tenant_admin: [
    'tenant:read',
    'tenant:write',
    'team:manage',
    'billing:read',
    'billing:write',
    'projects:read',
    'projects:write',
    'clients:read',
    'clients:write',
    'estimates:read',
    'estimates:write',
    'properties:read',
    'properties:write',
    'documents:read',
    'documents:write',
    'tickets:read',
    'tickets:write',
    'checklists:read',
    'checklists:write',
    'guardian:read',
    'guardian:write',
    'maintenance:read',
    'maintenance:write',
    'sop:read',
    'sop:write',
    'calendar:read',
    'calendar:write',
    'report:read',
    'report:write',
  ],
  
  project_manager: [
    'tenant:read',
    'projects:read',
    'projects:write',
    'clients:read',
    'estimates:read',
    'estimates:write',
    'properties:read',
    'documents:read',
    'documents:write',
    'tickets:read',
    'tickets:write',
    'checklists:read',
    'checklists:write',
    'team:read',
    'calendar:read',
    'report:read',
    'maintenance:read',
    'sop:read',
  ],
  
  technician: [
    'tenant:read',
    'projects:read',
    'checklists:read',
    'checklists:write',
    'tickets:read',
    'tickets:write',
    'documents:read',
    'maintenance:read',
    'sop:read',
  ],
  
  sales: [
    'tenant:read',
    'clients:read',
    'clients:write',
    'properties:read',
    'properties:write',
    'estimates:read',
    'estimates:write',
    'documents:read',
    'report:read',
  ],
  
  viewer: [
    'tenant:read',
    'projects:read',
    'documents:read',
  ],
  
  // Platform roles
  admin: [
    'platform:read',
    'platform:write',
    'tenant:read',
    'tenant:write',
    'system:admin',
  ],
  
  developer: [
    'platform:read',
    'platform:write',
    'tenant:read',
    'api:access',
  ],
};

// Module-specific permission expansions
const MODULE_PERMISSIONS = {
  financial_control: [
    'financials:read',
    'financials:write',
    'financials:analytics',
    'financials:dashboard',
    'financials:export',
    'costs:read',
    'costs:write',
    'timesheets:read',
    'timesheets:write',
    'purchase_orders:read',
    'purchase_orders:write',
    'cash_flow:read',
  ],
  
  intelligence: [
    'intelligence:read',
    'intelligence:write',
    'analytics:read',
    'analytics:export',
    'insights:read',
  ],
  
  ai_copilot: [
    'ai:read',
    'ai:write',
    'ai:chat',
    'ai:actions',
  ],
  
  workflows: [
    'workflows:read',
    'workflows:write',
    'workflows:execute',
    'workflows:manage',
    'automations:read',
    'automations:write',
  ],
  
  executive_insights: [
    'executive:read',
    'executive:analytics',
    'reports:advanced',
  ],
  
  business_intelligence: [
    'bi:read',
    'bi:write',
    'bi:dashboards',
    'bi:reports',
  ],
  
  team_performance: [
    'team:performance',
    'team:analytics',
    'team:reports',
  ],
  
  risk_monitoring: [
    'risk:read',
    'risk:alerts',
    'risk:manage',
  ],
  
  guardian: [
    'guardian:read',
    'guardian:write',
    'guardian:manage',
    'subscriptions:read',
    'subscriptions:write',
  ],
  
  maintenance: [
    'maintenance:read',
    'maintenance:write',
    'maintenance:schedule',
  ],
  
  sop: [
    'sop:read',
    'sop:write',
    'sop:manage',
  ],
  
  documents: [
    'documents:read',
    'documents:write',
    'documents:manage',
    'documents:share',
  ],
  
  tickets: [
    'tickets:read',
    'tickets:write',
    'tickets:manage',
  ],
  
  checklists: [
    'checklists:read',
    'checklists:write',
    'checklists:manage',
  ],
  
  calendar: [
    'calendar:read',
    'calendar:write',
    'calendar:manage',
  ],
  
  report: [
    'reports:read',
    'reports:write',
    'reports:export',
  ],
};

/**
 * Resolve permissions for a user based on role, enabled modules, and feature flags
 */
export const RBACResolver = {
  /**
   * Get base permissions for a role
   */
  getRoleDefaults: (role) => {
    return ROLE_DEFAULTS[role] || ROLE_DEFAULTS.viewer;
  },

  /**
   * Get permissions granted by enabled modules
   */
  getModulePermissions: (enabledModules) => {
    const permissions = [];
    
    enabledModules.forEach(module => {
      const modulePerms = MODULE_PERMISSIONS[module] || [];
      permissions.push(...modulePerms);
    });
    
    return permissions;
  },

  /**
   * Resolve complete permission set
   */
  resolvePermissions: (role, enabledModules = [], featureFlags = {}) => {
    // Start with role defaults
    const basePermissions = RBACResolver.getRoleDefaults(role);
    
    // Add module-specific permissions
    const modulePermissions = RBACResolver.getModulePermissions(enabledModules);
    
    // Combine and deduplicate
    const allPermissions = [...new Set([...basePermissions, ...modulePermissions])];
    
    return {
      permissions: allPermissions,
      basePermissions,
      modulePermissions,
      inheritedFrom: {
        role,
        modules: enabledModules,
        featureFlags,
      },
    };
  },

  /**
   * Check if a permission is granted
   */
  hasPermission: (resolvedPermissions, required) => {
    return resolvedPermissions.permissions.includes(required);
  },

  /**
   * Check if ANY of the permissions are granted
   */
  hasAnyPermission: (resolvedPermissions, requiredArray) => {
    return requiredArray.some(perm => resolvedPermissions.permissions.includes(perm));
  },

  /**
   * Check if ALL permissions are granted
   */
  hasAllPermissions: (resolvedPermissions, requiredArray) => {
    return requiredArray.every(perm => resolvedPermissions.permissions.includes(perm));
  },

  /**
   * Get permission debug info
   */
  getPermissionDebug: (role, enabledModules = []) => {
    const resolved = RBACResolver.resolvePermissions(role, enabledModules);
    
    return {
      role,
      enabledModules,
      totalPermissions: resolved.permissions.length,
      basePermissions: {
        count: resolved.basePermissions.length,
        permissions: resolved.basePermissions,
      },
      modulePermissions: {
        count: resolved.modulePermissions.length,
        permissions: resolved.modulePermissions,
      },
      breakdown: RBACResolver.getPermissionBreakdown(resolved.permissions),
    };
  },

  /**
   * Get permission breakdown by category
   */
  getPermissionBreakdown: (permissions) => {
    const categories = {};
    
    permissions.forEach(perm => {
      const [category] = perm.split(':');
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(perm);
    });
    
    return categories;
  },
};

export default RBACResolver;