import { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { RBACResolver } from '@/lib/RBACResolver';

/**
 * GLOBAL CONTEXT ENGINE
 * 
 * Context-First Enterprise SaaS Architecture
 * 
 * Resolution Order:
 * 1. Authenticate user
 * 2. Load platform role
 * 3. Load tenant memberships
 * 4. Resolve active context
 * 5. Validate permissions
 * 6. Load enabled modules
 * 7. Render UI
 * 
 * Contexts:
 * - Platform Context (admin/developer without tenant)
 * - Tenant Context (active tenant membership)
 * - Client Portal Context (client role)
 * - Technician Context (technician role with limited access)
 */

const GlobalContextEngine = createContext(null);

// Context types
export const CONTEXT_TYPE = {
  PLATFORM: 'platform',
  TENANT: 'tenant',
  CLIENT_PORTAL: 'client_portal',
  TECHNICIAN: 'technician',
  UNRESOLVED: 'unresolved',
};

// Tenant states
export const TENANT_STATE = {
  INVITED: 'invited',
  ONBOARDING: 'onboarding',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  INCOMPLETE: 'incomplete',
  ARCHIVED: 'archived',
};

export function GlobalContextProvider({ children }) {
  // Core state
  const [user, setUser] = useState(null);
  const [platformRole, setPlatformRole] = useState(null);
  const [tenantMemberships, setTenantMemberships] = useState([]);
  const [activeTenant, setActiveTenant] = useState(null);
  const [activeMembership, setActiveMembership] = useState(null);
  const [activeTenantRole, setActiveTenantRole] = useState(null);
  const [contextType, setContextType] = useState(CONTEXT_TYPE.UNRESOLVED);
  const [workspaceType, setWorkspaceType] = useState(null);
  
  // Capabilities
  const [enabledModules, setEnabledModules] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [contextId, setContextId] = useState(`ctx_${Date.now()}`);
  
  // State tracking
  const [onboardingState, setOnboardingState] = useState(null);
  const [companySettingsState, setCompanySettingsState] = useState(null);
  const [sessionValid, setSessionValid] = useState(false);
  const [failedChecks, setFailedChecks] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setError(null);
        const failedChecksList = [];

        // STEP 1: Authenticate user
        const authenticatedUser = await base44.auth.me();
        if (!authenticatedUser) {
          failedChecksList.push({
            check: 'authentication',
            message: 'User not authenticated',
            critical: true,
          });
          setFailedChecks(failedChecksList);
          setLoading(false);
          return;
        }

        setUser(authenticatedUser);
        setSessionValid(true);

        // STEP 2: Load platform role
        const role = authenticatedUser.role || 'user';
        setPlatformRole(role);

        // CRITICAL: Only super_admin, developer, platform_owner are valid platform roles
        // Generic 'admin' role is NOT a platform role - it's a legacy tenant admin role
        const VALID_PLATFORM_ROLES = ['super_admin', 'developer', 'platform_owner'];
        const isPlatformUser = VALID_PLATFORM_ROLES.includes(role);

        // STEP 3: Load tenant memberships - ALWAYS load for all users
        let memberships = [];
        
        if (role === 'client') {
          // Client portal context - no membership needed
          setContextType(CONTEXT_TYPE.CLIENT_PORTAL);
          setWorkspaceType('client');
          setSessionValid(true);
          setLoading(false);
          return;
        }
        
        // Load memberships for ALL users (platform and tenant)
        // CRITICAL: Use backend function to bypass RLS - frontend queries are restricted
        try {
          const membershipResponse = await base44.functions.invoke('loadUserMemberships', {});
          memberships = membershipResponse.data.memberships || [];
          console.log('[GlobalContextEngine] Loaded memberships via backend:', memberships.length, memberships);
        } catch (error) {
          console.error('[GlobalContextEngine] Error loading memberships:', error);
          memberships = [];
        }
        setTenantMemberships(memberships);

        // STEP 4: Resolve active context with strict priority
        // PRIORITY 1: Tenant membership ALWAYS takes precedence over platform role
        // This ensures tenant admins are not forced into platform mode
        if (memberships.length > 0) {
          // Filter for active memberships only at resolution time
          const activeMemberships = memberships.filter(m => m.status === 'active');
          console.log('[GlobalContextEngine] Active memberships:', activeMemberships.length);
          
          if (activeMemberships.length === 0) {
            // No active memberships - this is an error state
            failedChecksList.push({
              check: 'no_active_membership',
              message: `User has ${memberships.length} memberships but none are active`,
              critical: true,
              memberships: memberships.map(m => ({ id: m.id, status: m.status, tenant_id: m.tenant_id })),
            });
            setFailedChecks(failedChecksList);
            setContextType(CONTEXT_TYPE.UNRESOLVED);
            setLoading(false);
            return;
          }
          
          // User has active tenant membership - use tenant context
          const primaryMembership = activeMemberships.find(m => m.is_primary) || activeMemberships[0];
          console.log('[GlobalContextEngine] Selected primary membership:', primaryMembership);
          setActiveMembership(primaryMembership);
          setActiveTenantRole(primaryMembership.tenant_role);

          // Load tenant company
          const tenant = await base44.entities.Company.get(primaryMembership.tenant_id);
          if (!tenant) {
            failedChecksList.push({
              check: 'tenant_exists',
              message: `Tenant ${primaryMembership.tenant_id} not found`,
              critical: true,
            });
            setFailedChecks(failedChecksList);
            setContextType(CONTEXT_TYPE.UNRESOLVED);
            setLoading(false);
            return;
          }

          await resolveTenantContext(primaryMembership, tenant);
          return;
        }

        // PRIORITY 2: Platform users WITHOUT tenant membership
        // Only users with valid platform roles AND no tenant membership get platform context
        if (isPlatformUser && memberships.length === 0) {
          // Check if impersonating a tenant
          const impersonateId = localStorage.getItem('impersonate_tenant_id');
          if (impersonateId) {
            const impersonatedMembership = await base44.entities.TenantMembership.filter({
              user_id: authenticatedUser.id,
              tenant_id: impersonateId,
            }).then(m => m[0] || null);
            
            if (impersonatedMembership) {
              await resolveTenantContext(impersonatedMembership);
              return;
            } else {
              // Try to load tenant directly
              const tenant = await base44.entities.Company.get(impersonateId);
              if (tenant) {
                await resolveTenantContext({
                  tenant_id: impersonateId,
                  tenant_role: 'tenant_admin',
                  status: 'active',
                }, tenant);
                return;
              }
            }
          }
          
          // Pure platform context (no tenant membership)
          setContextType(CONTEXT_TYPE.PLATFORM);
          setWorkspaceType('super_admin');
          setEnabledModules([]);
          setPermissions(['platform:read', 'platform:write', 'tenant:read']);
          setLoading(false);
          return;
        }

        // PRIORITY 3: Tenant users without membership (error state)
        failedChecksList.push({
          check: 'tenant_membership',
          message: 'No active TenantMembership found',
          critical: true,
        });
        setFailedChecks(failedChecksList);
        
        // Check if user has old company_id binding
        if (authenticatedUser.company_id) {
          failedChecksList.push({
            check: 'legacy_binding',
            message: 'User has legacy company_id but no TenantMembership',
            critical: true,
            repairable: true,
          });
        }
        
        setContextType(CONTEXT_TYPE.UNRESOLVED);
        setLoading(false);
        return;

        // Tenant user context
        if (memberships.length === 0) {
          failedChecksList.push({
            check: 'tenant_membership',
            message: 'No active TenantMembership found',
            critical: true,
          });
          setFailedChecks(failedChecksList);
          
          // Check if user has old company_id binding
          if (authenticatedUser.company_id) {
            failedChecksList.push({
              check: 'legacy_binding',
              message: 'User has legacy company_id but no TenantMembership',
              critical: true,
              repairable: true,
            });
          }
          
          setContextType(CONTEXT_TYPE.UNRESOLVED);
          setLoading(false);
          return;
        }

        // STEP 4b: Select active membership
        const primaryMembership = memberships.find(m => m.is_primary) || memberships[0];
        setActiveMembership(primaryMembership);
        setActiveTenantRole(primaryMembership.tenant_role);

        // Load tenant company
        const tenant = await base44.entities.Company.get(primaryMembership.tenant_id);
        if (!tenant) {
          failedChecksList.push({
            check: 'tenant_exists',
            message: `Tenant ${primaryMembership.tenant_id} not found`,
            critical: true,
          });
          setFailedChecks(failedChecksList);
          setContextType(CONTEXT_TYPE.UNRESOLVED);
          setLoading(false);
          return;
        }

        await resolveTenantContext(primaryMembership, tenant);

      } catch (err) {
        console.error('GlobalContextEngine error:', err);
        setError(err.message);
        setFailedChecks(prev => [...prev, {
          check: 'context_initialization',
          message: err.message,
          critical: true,
        }]);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const resolveTenantContext = async (membership, tenant = null) => {
    const failedChecksList = [];
    const hydrationSteps = {
      user_loaded: false,
      membership_loaded: false,
      tenant_loaded: false,
      plan_loaded: false,
      plan_modules_loaded: false,
      feature_flags_loaded: false,
      enabled_modules_built: false,
      module_permissions_built: false,
      context_finalized: false,
    };

    try {
      // STEP 1: Load tenant if not provided
      hydrationSteps.user_loaded = true;
      const loadedTenant = tenant || await base44.entities.Company.get(membership.tenant_id);
      if (!loadedTenant) {
        failedChecksList.push({
          check: 'tenant_load',
          message: 'Failed to load tenant company',
          critical: true,
        });
        setFailedChecks(failedChecksList);
        setContextType(CONTEXT_TYPE.UNRESOLVED);
        return;
      }
      hydrationSteps.tenant_loaded = true;
      setActiveTenant(loadedTenant);

      // STEP 2: Load subscription/plan
      hydrationSteps.membership_loaded = true;
      const subscription = await base44.entities.CompanySubscription.filter(
        { company_id: loadedTenant.id, status: 'active' },
        '-created_date',
        1
      ).then(subs => subs[0] || null);

      let tenantState = TENANT_STATE.ACTIVE;
      if (!subscription) {
        tenantState = TENANT_STATE.INCOMPLETE;
        failedChecksList.push({
          check: 'subscription',
          message: 'No active subscription found',
          critical: false,
          repairable: true,
        });
      } else {
        hydrationSteps.plan_loaded = true;
      }

      // STEP 3: Compute enabled modules (MUST happen BEFORE permissions)
      console.log('[Hydration] Loading enabled modules for subscription:', subscription?.plan_id);
      const modules = await computeEnabledModules(subscription, membership.tenant_role, loadedTenant.id);
      console.log('[Hydration] Final enabled modules:', modules);
      hydrationSteps.plan_modules_loaded = true;
      hydrationSteps.feature_flags_loaded = true;
      hydrationSteps.enabled_modules_built = true;
      setEnabledModules(modules);

      // STEP 4: Resolve permissions using centralized RBAC resolver (AFTER modules loaded)
      const resolved = RBACResolver.resolvePermissions(
        membership.tenant_role,
        modules,
        {}
      );
      console.log('[Hydration] Resolved permissions:', resolved.permissions.length);
      hydrationSteps.module_permissions_built = true;
      setPermissions(resolved.permissions);

      // STEP 5: Check onboarding state
      const onboardingComplete = checkOnboardingComplete(loadedTenant);
      if (!onboardingComplete) {
        tenantState = TENANT_STATE.ONBOARDING;
        failedChecksList.push({
          check: 'onboarding',
          message: 'Tenant onboarding incomplete',
          critical: false,
          repairable: true,
        });
      }

      setOnboardingState({
        complete: onboardingComplete,
        tenantState,
        missingSteps: getMissingOnboardingSteps(loadedTenant),
      });

      // STEP 6: Load company settings state
      const settingsComplete = checkCompanySettingsComplete(loadedTenant);
      setCompanySettingsState({
        complete: settingsComplete,
        missingFields: getMissingCompanyFields(loadedTenant),
      });

      // STEP 7: Set context type
      hydrationSteps.context_finalized = true;
      if (membership.tenant_role === 'technician') {
        setContextType(CONTEXT_TYPE.TECHNICIAN);
        setWorkspaceType('technician');
      } else {
        setContextType(CONTEXT_TYPE.TENANT);
        // Set default workspace based on role
        if (membership.tenant_role === 'tenant_admin' || membership.tenant_role === 'project_manager') {
          setWorkspaceType('executive');
        } else if (membership.tenant_role === 'sales') {
          setWorkspaceType('sales');
        } else {
          setWorkspaceType('operations');
        }
      }

      console.log('[Hydration] Complete:', hydrationSteps);
      setFailedChecks(failedChecksList);
      setSessionValid(true);
    } catch (error) {
      console.error('[Hydration] Error:', error);
      failedChecksList.push({
        check: 'hydration_failed',
        message: error.message,
        critical: true,
        hydrationSteps,
      });
      setFailedChecks(failedChecksList);
    }
  };

  const checkOnboardingComplete = (tenant) => {
    // Check critical onboarding steps
    const hasLogo = !!tenant.logo_url;
    const hasBrandColor = !!tenant.brand_color_primary;
    const hasSettings = !!tenant.settings;
    
    return hasLogo && hasBrandColor && hasSettings;
  };

  const getMissingOnboardingSteps = (tenant) => {
    const missing = [];
    if (!tenant.logo_url) missing.push('logo');
    if (!tenant.brand_color_primary) missing.push('branding');
    if (!tenant.settings) missing.push('settings');
    return missing;
  };

  const checkCompanySettingsComplete = (tenant) => {
    const required = ['name', 'email', 'address', 'settings'];
    return required.every(field => tenant[field]);
  };

  const getMissingCompanyFields = (tenant) => {
    const required = ['name', 'email', 'address', 'settings'];
    return required.filter(field => !tenant[field]);
  };

  // Deprecated: computePermissions replaced by RBACResolver
  // Kept for backward compatibility only
  const computePermissions = (tenantRole, subscription) => {
    const resolved = RBACResolver.resolvePermissions(tenantRole, []);
    return resolved.permissions;
  };

  const computeEnabledModules = async (subscription, tenantRole, companyId) => {
    console.log('[computeEnabledModules] Starting with:', { subscription, tenantRole, companyId });
    
    // Role-based restrictions - ALWAYS return empty for unsupported roles
    if (tenantRole === 'technician') {
      console.log('[computeEnabledModules] Technician role - returning limited modules');
      return ['projects', 'checklists', 'tickets', 'documents', 'maintenance'];
    }
    
    if (tenantRole === 'sales') {
      console.log('[computeEnabledModules] Sales role - returning limited modules');
      return ['clients', 'properties', 'estimates', 'documents', 'report'];
    }

    // STEP 1: Core modules ALWAYS available for tenant_admin and project_manager
    const modules = new Set([
      'projects', 'estimates', 'clients', 'documents', 'properties',
      'checklists', 'tickets', 'calendar', 'report', 'sop',
      'maintenance', 'guardian', 'core'
    ]);
    console.log('[computeEnabledModules] Core modules:', Array.from(modules));
    
    // STEP 2: Enterprise plan - explicit module mapping (fallback if quotas missing)
    const ENTERPRISE_MODULES = [
      'financial_control', 'ai_copilot', 'intelligence', 'workflows',
      'executive_insights', 'business_intelligence', 'team_performance', 'risk_monitoring'
    ];
    
    if (subscription?.plan_id) {
      console.log('[computeEnabledModules] Loading plan:', subscription.plan_id);
      try {
        const plans = await base44.entities.SubscriptionPlan.filter({ id: subscription.plan_id });
        if (plans.length > 0) {
          const plan = plans[0];
          const quotas = { ...plan.quotas, ...subscription.quotas };
          console.log('[computeEnabledModules] Plan quotas:', quotas);
          
          // Check quotas for premium modules
          if (quotas?.custom_reports || quotas?.financial_control) {
            modules.add('financial_control');
            console.log('[computeEnabledModules] Added financial_control via quota');
          }
          if (quotas?.ai_requests_per_month > 0) {
            modules.add('ai_copilot');
            console.log('[computeEnabledModules] Added ai_copilot via quota');
          }
          if (quotas?.advanced_analytics || quotas?.intelligence) {
            modules.add('intelligence');
            console.log('[computeEnabledModules] Added intelligence via quota');
          }
          if (quotas?.workflow_automation) {
            modules.add('workflows');
            console.log('[computeEnabledModules] Added workflows via quota');
          }
          if (quotas?.advanced_analytics || quotas?.custom_reports) {
            modules.add('executive_insights');
            modules.add('business_intelligence');
            console.log('[computeEnabledModules] Added executive_insights & business_intelligence via quota');
          }
          if (quotas?.max_users > 5 || quotas?.advanced_analytics) {
            modules.add('team_performance');
            console.log('[computeEnabledModules] Added team_performance via quota');
          }
          if (quotas?.advanced_analytics || quotas?.guardian_subscriptions > 0) {
            modules.add('risk_monitoring');
            console.log('[computeEnabledModules] Added risk_monitoring via quota');
          }
        }
      } catch (error) {
        console.error('[computeEnabledModules] Error loading plan:', error);
      }
    } else if (subscription?.status === 'active' && !subscription?.plan_id) {
      // Fallback: active subscription without plan_id = enterprise entitlement
      console.log('[computeEnabledModules] Active subscription without plan_id - adding enterprise modules');
      ENTERPRISE_MODULES.forEach(m => modules.add(m));
    }
    
    // STEP 3: Merge feature flags (CRITICAL - always load from companyId parameter)
    if (companyId) {
      console.log('[computeEnabledModules] Loading feature flags for company:', companyId);
      try {
        const featureFlags = await base44.entities.TenantFeatureFlag.filter({
          company_id: companyId,
          enabled: true
        });
        console.log('[computeEnabledModules] Found feature flags:', featureFlags);
        
        featureFlags.forEach(flag => {
          if (flag.enabled && flag.feature_name) {
            modules.add(flag.feature_name);
            console.log(`[computeEnabledModules] Added ${flag.feature_name} via feature flag`);
          }
        });
      } catch (error) {
        console.error('[computeEnabledModules] Error loading feature flags:', error);
      }
    }
    
    const result = Array.from(modules);
    console.log('[computeEnabledModules] Final modules:', result);
    return result;
  };

  const switchTenant = (membershipId) => {
    const membership = tenantMemberships.find(m => m.id === membershipId);
    if (membership) {
      setActiveMembership(membership);
      localStorage.setItem('active_membership_id', membershipId);
      resolveTenantContext(membership);
    }
  };

  const clearImpersonation = () => {
    localStorage.removeItem('impersonate_tenant_id');
    window.location.reload();
  };

  // Force reload for development/debugging
  const forceReload = () => {
    window.location.reload();
  };

  const value = {
    // Core context
    user,
    platformRole,
    tenantMemberships,
    activeTenant,
    activeMembership,
    activeTenantRole,
    contextType,
    workspaceType,
    
    // Capabilities
    enabledModules,
    permissions,
    
    // State
    onboardingState,
    companySettingsState,
    sessionValid,
    failedChecks,
    
    // Loading
    loading,
    error,
    
    // Debug IDs (CRITICAL - ensures single context instance)
    contextId,
    rbacContextId: `rbac_${contextId}`,
    moduleRegistryId: `mod_${contextId}`,
    
    // Actions
    switchTenant,
    clearImpersonation,
    refreshContext: () => {
      const newId = `ctx_${Date.now()}`;
      setContextId(newId);
      window.dispatchEvent(new CustomEvent('context_refresh', { detail: { contextId: newId } }));
    },
    
    // Helpers
    isPlatformMode: contextType === CONTEXT_TYPE.PLATFORM,
    isTenantMode: contextType === CONTEXT_TYPE.TENANT,
    isClientPortal: contextType === CONTEXT_TYPE.CLIENT_PORTAL,
    isTechnicianMode: contextType === CONTEXT_TYPE.TECHNICIAN,
    isContextResolved: contextType !== CONTEXT_TYPE.UNRESOLVED,
    canAccessModule: (module) => enabledModules.includes(module),
    hasPermission: (perm) => permissions.includes(perm),
    
    // Development
    forceReload,
  };

  return (
    <GlobalContextEngine.Provider value={value}>
      {children}
    </GlobalContextEngine.Provider>
  );
}

export const useGlobalContext = () => {
  const context = useContext(GlobalContextEngine);
  if (!context) {
    throw new Error('useGlobalContext must be used within GlobalContextProvider');
  }
  return context;
};