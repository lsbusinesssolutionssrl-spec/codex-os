import { useState, useEffect } from 'react';
import { useGlobalContext } from '@/lib/GlobalContextEngine';
import { RBACResolver } from '@/lib/RBACResolver';
import { Shield, CheckCircle2, XCircle, AlertCircle, Key, Zap, UserCheck } from 'lucide-react';

/**
 * RBAC DEBUG PANEL
 * 
 * Shows resolved permissions, inheritance chain, and permission sources.
 * For development and debugging only.
 */

export default function RBACDebugPanel() {
  const { 
    user, 
    activeTenantRole, 
    enabledModules, 
    permissions,
    contextType,
    isPlatformMode,
  } = useGlobalContext();

  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    if (activeTenantRole && enabledModules) {
      const debug = RBACResolver.getPermissionDebug(activeTenantRole, enabledModules);
      setDebugInfo(debug);
    }
  }, [activeTenantRole, enabledModules]);

  if (!user) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-md max-h-96 overflow-auto bg-white rounded-lg shadow-lg border border-gray-200 text-xs">
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2 sticky top-0">
        <Shield className="w-3.5 h-3.5 text-blue-600" />
        <span className="font-semibold text-gray-700">RBAC Debug Panel</span>
      </div>
      
      <div className="p-3 space-y-3">
        {/* User Context */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <UserCheck className="w-3 h-3 text-gray-400" />
            <span className="font-medium text-gray-600">User Context</span>
          </div>
          <div className="space-y-0.5 ml-4">
            <div className="flex justify-between">
              <span className="text-gray-500">Email:</span>
              <span className="text-gray-700 truncate max-w-[200px]">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Platform Role:</span>
              <span className="text-gray-700">{user.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tenant Role:</span>
              <span className="text-gray-700">{activeTenantRole || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Context:</span>
              <span className="text-gray-700">{contextType}</span>
            </div>
          </div>
        </div>

        {/* Enabled Modules */}
        {enabledModules && enabledModules.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Zap className="w-3 h-3 text-blue-500" />
              <span className="font-medium text-gray-600">Enabled Modules ({enabledModules.length})</span>
            </div>
            <div className="flex flex-wrap gap-1 ml-4">
              {enabledModules.map(m => (
                <span key={m} className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Permission Summary */}
        {debugInfo && (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Key className="w-3 h-3 text-gray-400" />
              <span className="font-medium text-gray-600">Permission Summary</span>
            </div>
            <div className="space-y-1 ml-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Permissions:</span>
                <span className="font-semibold text-gray-700">{debugInfo.totalPermissions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">From Role:</span>
                <span className="text-gray-700">{debugInfo.basePermissions.count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">From Modules:</span>
                <span className="text-gray-700">{debugInfo.modulePermissions.count}</span>
              </div>
            </div>
          </div>
        )}

        {/* Permission Categories */}
        {debugInfo && (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <AlertCircle className="w-3 h-3 text-gray-400" />
              <span className="font-medium text-gray-600">Categories</span>
            </div>
            <div className="ml-4 space-y-0.5">
              {Object.entries(debugInfo.breakdown).slice(0, 8).map(([cat, perms]) => (
                <div key={cat} className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-600 font-medium">{cat}</span>
                  <span className="text-gray-500">{perms.length} perms</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Specific Permission */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1.5 mb-1.5">
            <CheckCircle2 className="w-3 h-3 text-gray-400" />
            <span className="font-medium text-gray-600">Test Permission</span>
          </div>
          <div className="ml-4 space-y-1">
            <PermissionTest 
              permission="financials:read" 
              permissions={permissions}
              label="Financial Control Access"
            />
            <PermissionTest 
              permission="projects:write" 
              permissions={permissions}
              label="Project Write Access"
            />
            <PermissionTest 
              permission="intelligence:read" 
              permissions={permissions}
              label="Intelligence Access"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PermissionTest({ permission, permissions, label }) {
  const hasAccess = permissions.includes(permission);
  
  return (
    <div className="flex items-center justify-between text-[10px]">
      <span className="text-gray-600">{label}</span>
      <div className="flex items-center gap-1">
        <span className="text-gray-500 font-mono">{permission}</span>
        {hasAccess ? (
          <CheckCircle2 className="w-3 h-3 text-green-600" />
        ) : (
          <XCircle className="w-3 h-3 text-red-600" />
        )}
      </div>
    </div>
  );
}