import { useGlobalContext, CONTEXT_TYPE } from '@/lib/GlobalContextEngine';
import { Loader2, AlertTriangle, Shield, Building2, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * CONTEXT GATE
 * 
 * Blocks module rendering without valid tenant context.
 * Enforces context-first architecture.
 * 
 * Usage:
 * <ContextGate requiredContext="tenant">
 *   <IntelligenceModule />
 * </ContextGate>
 */

export function ContextGate({ 
  children, 
  requiredContext = 'any',
  requiredModule,
  requiredPermission,
  fallback,
}) {
  const {
    contextType,
    isContextResolved,
    isPlatformMode,
    isTenantMode,
    isClientPortal,
    isTechnicianMode,
    activeTenant,
    activeMembership,
    sessionValid,
    loading,
    canAccessModule,
    hasPermission,
    failedChecks,
    onboardingState,
  } = useGlobalContext();

  // Show loading while context resolves
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Resolving context...</p>
        </div>
      </div>
    );
  }

  // Context not resolved - show error
  if (!isContextResolved || !sessionValid) {
    const criticalFailure = failedChecks.find(f => f.critical);
    
    if (fallback) {
      return fallback;
    }

    return (
      <div className="flex items-center justify-center h-64">
        <div className="max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-orange-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Context Resolution Failed</h2>
          <p className="text-sm text-gray-600 mb-4">
            {criticalFailure?.message || 'Unable to resolve tenant context'}
          </p>
          {criticalFailure?.repairable && (
            <button className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg">
              Repair Context
            </button>
          )}
        </div>
      </div>
    );
  }

  // Check context type requirement
  if (requiredContext !== 'any') {
    if (requiredContext === 'tenant' && !isTenantMode) {
      return (
        <ContextWarning
          title="Tenant Context Required"
          message="This module requires an active tenant context. Please switch to a tenant workspace."
          icon={Building2}
        />
      );
    }

    if (requiredContext === 'platform' && !isPlatformMode) {
      return (
        <ContextWarning
          title="Platform Context Required"
          message="This module is only available to platform administrators."
          icon={Shield}
        />
      );
    }
  }

  // Check module access
  if (requiredModule && !canAccessModule(requiredModule)) {
    return (
      <ContextWarning
        title="Module Not Accessible"
        message={`The "${requiredModule}" module is not enabled for your current plan or role.`}
        icon={AlertTriangle}
      />
    );
  }

  // Check permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <ContextWarning
        title="Permission Denied"
        message={`You don't have permission to access this feature.`}
        icon={Shield}
      />
    );
  }

  // Check onboarding state for tenant modules
  if (isTenantMode && onboardingState && !onboardingState.complete) {
    // Allow critical modules, block others
    const criticalModules = ['company-settings', 'activation-wizard'];
    if (!criticalModules.includes(requiredModule)) {
      return (
        <ContextWarning
          title="Onboarding Incomplete"
          message="Please complete the tenant onboarding process before accessing this module."
          icon={UserCheck}
          actionLabel="Complete Onboarding"
          actionUrl="/activation-wizard"
        />
      );
    }
  }

  // All checks passed - render children
  return children;
}

function ContextWarning({ title, message, icon: Icon, actionLabel, actionUrl }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="max-w-md text-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
          <Icon className="w-8 h-8 text-orange-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        {actionLabel && actionUrl && (
          <Link
            to={actionUrl}
            className="inline-flex items-center px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {actionLabel}
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * TENANT MODULE GATE
 * 
 * Specialized gate for tenant modules.
 * Blocks rendering unless active tenant context exists.
 */
export function TenantModuleGate({ children, module }) {
  return (
    <ContextGate
      requiredContext="tenant"
      requiredModule={module}
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading tenant context...</p>
          </div>
        </div>
      }
    >
      {children}
    </ContextGate>
  );
}

/**
 * PLATFORM MODULE GATE
 * 
 * Specialized gate for platform-only modules.
 */
export function PlatformModuleGate({ children }) {
  return (
    <ContextGate
      requiredContext="platform"
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Platform access required...</p>
          </div>
        </div>
      }
    >
      {children}
    </ContextGate>
  );
}

export default ContextGate;