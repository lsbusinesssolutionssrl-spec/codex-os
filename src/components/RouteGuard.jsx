import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Lock, Shield } from 'lucide-react';
import { useGlobalContext } from '@/lib/GlobalContextEngine';

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

    // Check 3: Required permissions
    if (!accessDenied && requiredPermissions.length > 0) {
      const missingPermissions = requiredPermissions.filter(perm => !permissions.includes(perm));
      if (missingPermissions.length > 0) {
        accessDenied = true;
        errorMessage = {
          type: 'permission_denied',
          title: 'Permesso Negato',
          message: 'Non hai i permessi necessari per accedere a questa sezione.',
          details: `Permesso richiesto: ${missingPermissions.join(', ')}`,
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
        
        {/* Developer debug info */}
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