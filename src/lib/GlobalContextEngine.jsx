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

        // CRITICAL: Define platform roles that can access Platform Mode
        const PLATFORM_ROLES = ['admin', 'developer'];
        const isPlatformUser = PLATFORM_ROLES.includes(role);

        // STEP 3: Load tenant memberships
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
        memberships = await base44.entities.TenantMembership.filter({
          user_id: authenticatedUser.id,
          status: 'active',
        });
        setTenantMemberships(memberships);

        // STEP 4: Resolve active context with strict priority
        // PRIORITY 1: Tenant users (even if they have platform role, tenant membership takes precedence)
        if (memberships.length > 0) {
          // User has active tenant membership - use tenant context
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
          return;
        }

        // PRIORITY 2: Platform users WITHOUT tenant membership
        if (isPlatformUser) {
          // Check if impersonating a tenant
          const impersonateId = localStorage.getItem('impersonate_tenant_id');
          if (impersonateId) {
            const impersonatedMembership = memberships.find(m => m.tenant_id === impersonateId);
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
    
    // Load tenant if not provided
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

    setActiveTenant(loadedTenant);

    // Check tenant state
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
    }

    // Check onboarding state
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

    // Load company settings state
    const settingsComplete = checkCompanySettingsComplete(loadedTenant);
    setCompanySettingsState({
      complete: settingsComplete,
      missingFields: getMissingCompanyFields(loadedTenant),
    });

    // STEP 5: Resolve permissions using centralized RBAC resolver
    const resolved = RBACResolver.resolvePermissions(
      membership.tenant_role,
      modules, // enabled modules
      {} // feature flags (can be loaded separately)
    );
    setPermissions(resolved.permissions);

    // STEP 6: Load enabled modules
    console.log('Loading enabled modules for subscription:', subscription?.plan_id);
    const modules = await computeEnabledModules(subscription, membership.tenant_role);
    console.log('Final enabled modules:', modules);
    setEnabledModules(modules);

    // Set context type
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

    setFailedChecks(failedChecksList);
    setSessionValid(true);
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

  const computeEnabledModules = async (subscription, tenantRole) => {
    // Core modules always available
    const modules = ['projects', 'estimates', 'clients', 'documents', 'properties', 'checklists', 'tickets', 'calendar', 'report', 'documents', 'sop', 'maintenance', 'guardian'];
    
    // Role-based restrictions
    if (tenantRole === 'technician') {
      return ['projects', 'checklists', 'tickets', 'documents', 'maintenance'];
    }
    
    if (tenantRole === 'sales') {
      return ['clients', 'properties', 'estimates', 'documents', 'report'];
    }
    
    // Subscription-based modules - Enterprise/Professional get all premium features
    if (subscription) {
      // Load plan details to check quotas
      let quotas = {};
      if (subscription.plan_id) {
        try {
          const plans = await base44.entities.SubscriptionPlan.filter({ id: subscription.plan_id });
          if (plans.length > 0) {
            quotas = plans[0].quotas || {};
            console.log('Loaded plan quotas:', quotas);
          }
        } catch (error) {
          console.error('Error loading subscription plan:', error);
        }
      }
      
      // Also check subscription-level quotas
      if (subscription.quotas) {
        quotas = { ...quotas, ...subscription.quotas };
      }
      
      console.log('Computing modules - Quotas:', quotas);
      
      // Financial Control - enabled by custom_reports OR financial_control quota
      if (quotas?.custom_reports || quotas?.financial_control) {
        modules.push('financial_control');
        console.log('Financial Control enabled');
      }
      
      // AI Copilot - enabled by AI requests quota
      if (quotas?.ai_requests_per_month > 0) {
        modules.push('ai_copilot');
        console.log('AI Copilot enabled');
      }
      
      // Intelligence - enabled by advanced_analytics OR intelligence quota
      if (quotas?.advanced_analytics || quotas?.intelligence) {
        modules.push('intelligence');
        console.log('Intelligence enabled');
      }
      
      // Workflows - enabled by workflow_automation quota
      if (quotas?.workflow_automation) {
        modules.push('workflows');
        console.log('Workflows enabled');
      }
      
      // Executive Insights / Business Intelligence
      if (quotas?.advanced_analytics || quotas?.custom_reports) {
        modules.push('executive_insights');
        modules.push('business_intelligence');
        console.log('Executive Insights & Business Intelligence enabled');
      }
      
      // Team Performance
      if (quotas?.max_users > 5 || quotas?.advanced_analytics) {
        modules.push('team_performance');
        console.log('Team Performance enabled');
      }
      
      // Risk Monitoring
      if (quotas?.advanced_analytics || quotas?.guardian_subscriptions > 0) {
        modules.push('risk_monitoring');
        console.log('Risk Monitoring enabled');
      }
    }
    
    // Load feature flags for this company
    if (activeTenant?.id) {
      try {
        const featureFlags = await base44.entities.TenantFeatureFlag.filter({
          company_id: activeTenant.id,
          enabled: true
        });
        
        console.log('Feature flags:', featureFlags);
        
        // Add modules from feature flags
        featureFlags.forEach(flag => {
          if (flag.enabled && !modules.includes(flag.feature_name)) {
            modules.push(flag.feature_name);
            console.log(`Module ${flag.feature_name} enabled via feature flag`);
          }
        });
      } catch (error) {
        console.error('Error loading feature flags:', error);
      }
    }
    
    console.log('Final enabled modules:', modules);
    return modules;
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
    
    // Actions
    switchTenant,
    clearImpersonation,
    
    // Helpers
    isPlatformMode: contextType === CONTEXT_TYPE.PLATFORM,
    isTenantMode: contextType === CONTEXT_TYPE.TENANT,
    isClientPortal: contextType === CONTEXT_TYPE.CLIENT_PORTAL,
    isTechnicianMode: contextType === CONTEXT_TYPE.TECHNICIAN,
    isContextResolved: contextType !== CONTEXT_TYPE.UNRESOLVED,
    canAccessModule: (module) => enabledModules.includes(module),
    hasPermission: (perm) => permissions.includes(perm),
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