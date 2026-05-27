import { useEffect, useState } from 'react';
import { useGlobalContext } from '@/lib/GlobalContextEngine';
import { AlertCircle, CheckCircle2, Shield } from 'lucide-react';

/**
 * CONTEXT VERIFICATION COMPONENT
 * 
 * Ensures only ONE GlobalContext instance exists application-wide.
 * Shows warning if multiple contexts detected.
 */

export default function ContextVerification() {
  const { 
    contextId, 
    rbacContextId, 
    moduleRegistryId,
    permissions,
    enabledModules,
    activeTenantRole,
  } = useGlobalContext();

  const [contextHistory, setContextHistory] = useState([]);
  const [multipleContextsDetected, setMultipleContextsDetected] = useState(false);

  useEffect(() => {
    // Track context ID changes
    setContextHistory(prev => {
      const newHistory = [...prev, { id: contextId, timestamp: Date.now() }];
      // Keep last 10
      if (newHistory.length > 10) newHistory.shift();
      
      // Check for duplicate different IDs (indicates multiple providers)
      const uniqueIds = new Set(newHistory.map(h => h.id));
      if (uniqueIds.size > 1 && newHistory.length > 2) {
        setMultipleContextsDetected(true);
      }
      
      return newHistory;
    });
  }, [contextId]);

  // Only show for admins/developers
  if (activeTenantRole !== 'tenant_admin' && activeTenantRole !== 'admin' && activeTenantRole !== 'developer') {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] max-w-2xl w-full px-4">
      {/* Context ID Display */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-xs font-semibold text-gray-700">Context Verification</span>
        </div>
        <div className="p-3 space-y-2">
          {/* Context IDs */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-blue-50 border border-blue-200 rounded p-2">
              <p className="text-[9px] font-semibold text-blue-700 uppercase">Context ID</p>
              <p className="text-[10px] font-mono text-blue-800 truncate">{contextId}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded p-2">
              <p className="text-[9px] font-semibold text-green-700 uppercase">RBAC ID</p>
              <p className="text-[10px] font-mono text-green-800 truncate">{rbacContextId}</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded p-2">
              <p className="text-[9px] font-semibold text-purple-700 uppercase">Module Registry</p>
              <p className="text-[10px] font-mono text-purple-800 truncate">{moduleRegistryId}</p>
            </div>
          </div>

          {/* Permission Summary */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Total Permissions:</span>
            <span className="font-semibold text-gray-700">{permissions.length}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Enabled Modules:</span>
            <span className="font-semibold text-gray-700">{enabledModules.length}</span>
          </div>

          {/* Warning if multiple contexts */}
          {multipleContextsDetected && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-red-900">⚠️ Multiple Context Instances Detected</p>
                <p className="text-[10px] text-red-700 mt-0.5">
                  This indicates duplicate GlobalContextProvider instances. Check App.jsx and route wrappers.
                </p>
              </div>
            </div>
          )}

          {/* Success message */}
          {!multipleContextsDetected && contextHistory.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <p className="text-xs font-medium text-green-900">✓ Single Context Instance Verified</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}