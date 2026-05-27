import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Lock, Shield, CheckCircle2, XCircle, Key } from 'lucide-react';
import { useGlobalContext } from '@/lib/GlobalContextEngine';
import { RBACResolver } from '@/lib/RBACResolver';

/**
 * Route Guard Component
 * 
 * Protects routes by checking:
 * 1. Tenant context is resolved
 * 2. Module is enabled for tenant
 * 3. User has required permissions
 * 4. User role is allowed
 * 
 * Shows clear error messages instead of silent redirects
 */
export default function RouteGuard({ 
  children, 
  requiredModule, 
  requiredPermissions = [], 
  allowedRoles = [],
}) {
  const navigate = useNavigate();
  const globalContext = useGlobalContext();
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState(null);

  const {
    isContextResolved,
    contextType,
    enabledModules,
    permissions,
    activeTenantRole,
    activeTenant,
    failedChecks,
  } = globalContext;

  useEffect(() => {
    const checks = [];
    let accessDenied = false;
    let errorMessage = null;
    let debugInfo = null;

    // Check 1: Context must be resolved
    if (!isContextResolved) {
      accessDenied = true;
      errorMessage = {
        type: 'context_missing',
        title: 'Contesto Tenant Non Risolto',
        message: 'Il sistema non è riuscito a caricare il contesto del tenant. Effettua il logout e riprova.',
        details: failedChecks.map(f => f.message).join(', '),
      };
    }

    // Check 2: Module must be enabled (if required)
    if (!accessDenied && requiredModule && !enabledModules.includes(requiredModule)) {
      accessDenied = true;
      errorMessage = {
        type: 'module_disabled',
        title: 'Modulo Non Disponibile',
        message: `La funzionalità "${formatModuleName(requiredModule)}" non è abilitata per il tuo piano.`,
        details: 'Contatta il tuo amministratore per abilitare questo modulo.',
      };
    }

    // Check 3: Required permissions - USE CENTRALIZED RBAC ONLY
    if (!accessDenied && requiredPermissions.length > 0) {
      // Debug: Check permission resolution
      const permissionDebug = RBACResolver.getPermissionDebug(activeTenantRole, enabledModules);
      const hasAllRequired = requiredPermissions.every(perm => permissions.includes(perm));
      const missingPermissions = requiredPermissions.filter(perm => !permissions.includes(perm));
      
      debugInfo = {
        requiredPermissions,
        hasPermission: hasAllRequired,
        totalPermissions: permissions.length,
        permissionSource: 'RBACResolver (role + modules)',
        roleUsed: activeTenantRole,
        modulesUsed: enabledModules,
        breakdown: permissionDebug.breakdown,
      };

      if (missingPermissions.length > 0) {
        accessDenied = true;
        errorMessage = {
          type: 'permission_denied',
          title: 'Permesso Negato',
          message: 'Non hai i permessi necessari per accedere a questa sezione.',
          details: `Permesso richiesto: ${missingPermissions.join(', ')}`,
          debugInfo,
        };
      }
    }

    // Check 4: Role-based access
    if (!accessDenied && allowedRoles.length > 0 && !allowedRoles.includes(activeTenantRole)) {
      accessDenied = true;
      errorMessage = {
        type: 'role_denied',
        title: 'Accesso Non Autorizzato',
        message: `Il tuo ruolo "${activeTenantRole}" non può accedere a questa sezione.`,
        details: `Ruoli consentiti: ${allowedRoles.join(', ')}`,
      };
    }

    if (accessDenied) {
      setError(errorMessage);
    }
    
    setChecking(false);
  }, [isContextResolved, enabledModules, permissions, activeTenantRole, requiredModule, requiredPermissions, allowedRoles]);

  if (checking) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-red-200 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              {error.type === 'permission_denied' || error.type === 'role_denied' ? (
                <Lock className="w-6 h-6 text-red-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900 mb-2">{error.title}</h2>
              <p className="text-sm text-gray-600 mb-3">{error.message}</p>
              {error.details && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-4">
                  <p className="text-xs text-red-700 font-mono">{error.details}</p>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/')}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Torna alla Dashboard
                </button>
                <button
                  onClick={() => navigate('/company-settings')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Impostazioni
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced Developer Debug Panel */}
        {error?.debugInfo && (
          <div className="mt-4 bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
              <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                <Key className="w-3 h-3" />
                RBAC Permission Debug (Developer Only)
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {/* Permission Check Result */}
              <div className="flex items-center gap-2">
                {error.debugInfo.hasPermission ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="text-xs font-medium">
                  Permission Check: <span className={error.debugInfo.hasPermission ? 'text-green-600' : 'text-red-600'}>
                    {error.debugInfo.hasPermission ? 'PASSED' : 'FAILED'}
                  </span>
                </span>
              </div>

              {/* Required Permissions */}
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Required Permissions</p>
                <div className="flex flex-wrap gap-1">
                  {error.debugInfo.requiredPermissions.map(perm => (
                    <span key={perm} className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded font-mono">
                      {perm}
                    </span>
                  ))}
                </div>
              </div>

              {/* Permission Source */}
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Permission Source</p>
                <div className="text-xs text-gray-700 bg-blue-50 border border-blue-200 rounded p-2">
                  {error.debugInfo.permissionSource}
                </div>
              </div>

              {/* Role & Modules Used */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Role Used</p>
                  <div className="text-xs bg-gray-50 border border-gray-200 rounded p-1.5 font-mono">
                    {error.debugInfo.roleUsed || 'N/A'}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Total Permissions</p>
                  <div className="text-xs bg-gray-50 border border-gray-200 rounded p-1.5 font-mono">
                    {error.debugInfo.totalPermissions}
                  </div>
                </div>
              </div>

              {/* Enabled Modules */}
              {error.debugInfo.modulesUsed.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Enabled Modules</p>
                  <div className="flex flex-wrap gap-1">
                    {error.debugInfo.modulesUsed.map(m => (
                      <span key={m} className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-mono">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Guard Decision */}
              <div className="pt-2 border-t border-gray-200">
                <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Guard Decision</p>
                <div className="text-xs bg-red-50 border border-red-200 rounded p-2 text-red-700">
                  <strong>ACCESS DENIED</strong> - Missing required permissions
                </div>
              </div>

              {/* Permission Categories */}
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Permission Categories</p>
                <div className="grid grid-cols-2 gap-1">
                  {Object.entries(error.debugInfo.breakdown).slice(0, 6).map(([cat, perms]) => (
                    <div key={cat} className="text-[10px] flex justify-between bg-gray-50 border border-gray-200 rounded px-2 py-1">
                      <span className="font-medium text-gray-600">{cat}</span>
                      <span className="text-gray-500">{perms.length} perms</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Basic debug info (fallback) */}
        {!error?.debugInfo && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Debug Info (Developer Only)</h3>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-gray-600">
              <div>Context: {contextType}</div>
              <div>Tenant: {activeTenant?.name || 'N/A'}</div>
              <div>Role: {activeTenantRole || 'N/A'}</div>
              <div>Modules: {enabledModules.join(', ') || 'None'}</div>
              <div>Required Module: {requiredModule || 'None'}</div>
              <div>Required Permissions: {requiredPermissions.join(', ') || 'None'}</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return children;
}

function formatModuleName(moduleName) {
  const names = {
    financial_control: 'Controllo Finanziario',
    guardian: 'Guardian',
    ai_copilot: 'AI Copilot',
    intelligence: 'Intelligence',
    workflows: 'Workflows',
    property_intelligence: 'Property Intelligence',
  };
  return names[moduleName] || moduleName.replace(/_/g, ' ');
}