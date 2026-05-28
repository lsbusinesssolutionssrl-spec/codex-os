import { useState } from 'react';
import { useGlobalContext } from '@/lib/GlobalContextEngine';
import { CheckCircle2, XCircle, Loader2, Activity, Minimize2, Maximize2 } from 'lucide-react';

/**
 * HYDRATION DEBUG PANEL
 * Shows exact step where context hydration fails
 */

export default function HydrationDebugPanel() {
  const [minimized, setMinimized] = useState(false);
  const { 
    failedChecks,
    sessionValid,
    activeTenant,
    activeTenantRole,
    enabledModules,
    permissions,
    contextType,
    platformRole,
    isPlatformMode,
  } = useGlobalContext();

  // CRITICAL: Show ONLY to platform users in platform mode
  const isInternalUser = ['super_admin', 'developer', 'platform_owner', 'admin'].includes(platformRole) && isPlatformMode;
  if (!isInternalUser) return null;

  // Extract hydration steps from failed checks if available
  const hydrationSteps = failedChecks.find(c => c.hydrationSteps)?.hydrationSteps || {};

  const steps = [
    { id: 'user_loaded', label: 'User loaded' },
    { id: 'membership_loaded', label: 'Membership loaded' },
    { id: 'tenant_loaded', label: 'Tenant loaded' },
    { id: 'plan_loaded', label: 'Plan loaded' },
    { id: 'plan_modules_loaded', label: 'Plan modules loaded' },
    { id: 'feature_flags_loaded', label: 'Feature flags loaded' },
    { id: 'enabled_modules_built', label: 'Enabled modules built' },
    { id: 'module_permissions_built', label: 'Module permissions built' },
    { id: 'context_finalized', label: 'Context finalized' },
  ];

  const failureStep = steps.find(s => hydrationSteps[s.id] === false);
  const completedSteps = steps.filter(s => hydrationSteps[s.id] === true).length;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[90]">
      {minimized ? (
        <button
          onClick={() => setMinimized(false)}
          className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <Activity className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-semibold text-gray-700">Hydration</span>
          <div className="flex items-center gap-1">
            <span className="text-xs text-green-600 font-medium">{completedSteps}/{steps.length}</span>
            <Maximize2 className="w-3 h-3 text-gray-400" />
          </div>
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 max-w-2xl w-full overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-semibold text-gray-700">Context Hydration Steps</span>
            </div>
            <div className="flex items-center gap-2">
              {failureStep && (
                <span className="text-xs text-red-600 font-medium">
                  Failed: {failureStep.label}
                </span>
              )}
              <button
                onClick={() => setMinimized(true)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                <Minimize2 className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
          </div>
          <div className="p-3 space-y-2 max-h-96 overflow-auto">
            {/* Steps */}
            <div className="space-y-1">
              {steps.map(step => {
                const status = hydrationSteps[step.id];
                const isFailed = failureStep?.id === step.id;
                
                return (
                  <div
                    key={step.id}
                    className={`flex items-center justify-between text-xs p-2 rounded ${
                      isFailed ? 'bg-red-50 border border-red-200' :
                      status === true ? 'bg-green-50' :
                      status === false ? 'bg-red-50' :
                      'bg-gray-50'
                    }`}
                  >
                    <span className="text-gray-700">{step.label}</span>
                    <div className="flex items-center gap-2">
                      {status === undefined ? (
                        <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                      ) : status === true ? (
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                      ) : (
                        <XCircle className="w-3 h-3 text-red-600" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="pt-2 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Context:</span>
                  <span className="ml-2 font-medium text-gray-700">{contextType}</span>
                </div>
                <div>
                  <span className="text-gray-500">Tenant Role:</span>
                  <span className="ml-2 font-medium text-gray-700">{activeTenantRole || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Enabled Modules:</span>
                  <span className="ml-2 font-semibold text-gray-700">{enabledModules.length}</span>
                </div>
                <div>
                  <span className="text-gray-500">Permissions:</span>
                  <span className="ml-2 font-semibold text-gray-700">{permissions.length}</span>
                </div>
              </div>
            </div>

            {/* Error details */}
            {failedChecks.length > 0 && (
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-1">Failed Checks:</p>
                <div className="space-y-1">
                  {failedChecks.map((check, i) => (
                    <div key={i} className="text-xs text-red-600 bg-red-50 p-1.5 rounded">
                      <span className="font-medium">{check.check}:</span> {check.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}