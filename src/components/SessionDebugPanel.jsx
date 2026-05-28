import { useState, useEffect } from 'react';
import { useGlobalContext, CONTEXT_TYPE, TENANT_STATE } from '@/lib/GlobalContextEngine';
import { 
  Shield, Building2, User, Activity, AlertTriangle, CheckCircle, CheckCircle2,
  XCircle, Clock, ChevronRight, ChevronDown, RefreshCw, Terminal, Maximize2, Minimize2
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

/**
 * SESSION DEBUG PANEL
 * 
 * Developer-only diagnostic tool showing live session state.
 * Only accessible to platform admins.
 */

export default function SessionDebugPanel() {
  const [minimized, setMinimized] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const globalContext = useGlobalContext();
  
  const {
    user,
    platformRole,
    tenantMemberships,
    activeTenant,
    activeMembership,
    activeTenantRole,
    contextType,
    workspaceType,
    enabledModules,
    permissions,
    onboardingState,
    companySettingsState,
    sessionValid,
    failedChecks,
    loading,
    error,
    isPlatformMode,
    isTenantMode,
  } = globalContext;

  // CRITICAL: Show ONLY to platform users in platform mode
  const isInternalUser = ['super_admin', 'developer', 'platform_owner', 'admin'].includes(platformRole) && isPlatformMode;
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTenants: 0,
    activeSubscriptions: 0,
  });

  useEffect(() => {
    if (expanded && isPlatformMode) {
      loadPlatformStats();
    }
  }, [expanded]);

  if (!isInternalUser) return null;

  const loadPlatformStats = async () => {
    try {
      const [companies, subscriptions] = await Promise.all([
        base44.asServiceRole.entities.Company.list(),
        base44.asServiceRole.entities.CompanySubscription.filter({ status: 'active' }),
      ]);
      
      setStats({
        totalUsers: companies.reduce((sum, c) => sum + (c._user_count || 0), 0),
        totalTenants: companies.length,
        activeSubscriptions: subscriptions.length,
      });
    } catch (err) {
      console.error('Failed to load platform stats:', err);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    window.location.reload();
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="fixed bottom-32 left-4 z-[100] flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
      >
        <Terminal className="w-4 h-4" />
        <span className="text-sm font-medium">Session Debug</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-32 left-4 z-[100] w-[450px] max-h-[80vh] overflow-y-auto bg-white rounded-xl shadow-2xl border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-gray-600" />
          <h3 className="text-sm font-bold text-gray-900">Session & Context Debug</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh Session"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setExpanded(false)}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Session Status */}
        <DebugSection title="Session Status">
          <div className="space-y-2">
            <StatusRow 
              label="Session Valid" 
              valid={sessionValid} 
              icon={Activity}
            />
            <StatusRow 
              label="Context Resolved" 
              valid={globalContext.isContextResolved} 
              icon={CheckCircle}
            />
            <StatusRow 
              label="Loading" 
              valid={!loading} 
              inverse
              icon={Clock}
            />
            {error && (
              <div className="text-xs text-red-600 bg-red-50 px-2 py-1.5 rounded border border-red-100">
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>
        </DebugSection>

        {/* User Context */}
        <DebugSection title="User Context">
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Email</span>
              <span className="font-mono text-gray-900">{user?.email || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Platform Role</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                platformRole === 'admin' ? 'bg-purple-100 text-purple-700' :
                platformRole === 'developer' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {platformRole || '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Tenant Role</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                activeTenantRole ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {activeTenantRole || '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Context Type</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                contextType === CONTEXT_TYPE.PLATFORM ? 'bg-purple-100 text-purple-700' :
                contextType === CONTEXT_TYPE.TENANT ? 'bg-blue-100 text-blue-700' :
                contextType === CONTEXT_TYPE.CLIENT_PORTAL ? 'bg-green-100 text-green-700' :
                'bg-red-100 text-red-700'
              }`}>
                {contextType}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Workspace</span>
              <span className="font-mono text-gray-900">{workspaceType || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Reason</span>
              <span className="text-gray-700 text-right">
                {tenantMemberships.length > 0 ? 'Has TenantMembership' : 
                 platformRole === 'admin' || platformRole === 'developer' ? 'Platform role' : 'No context'}
              </span>
            </div>
          </div>
        </DebugSection>

        {/* Tenant Context */}
        {isTenantMode && (
          <DebugSection title="Tenant Context">
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Tenant</span>
                <span className="font-medium text-gray-900">{activeTenant?.name || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Tenant Role</span>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                  {activeTenantRole || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Membership Status</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  activeMembership?.status === 'active' ? 'bg-green-100 text-green-700' :
                  'bg-orange-100 text-orange-700'
                }`}>
                  {activeMembership?.status || '—'}
                </span>
              </div>
            </div>
          </DebugSection>
        )}

        {/* Platform Stats */}
        {isPlatformMode && (
          <DebugSection title="Platform Stats">
            <div className="grid grid-cols-3 gap-2">
              <StatCard label="Tenants" value={stats.totalTenants} />
              <StatCard label="Users" value={stats.totalUsers} />
              <StatCard label="Active Subs" value={stats.activeSubscriptions} />
            </div>
          </DebugSection>
        )}

        {/* Memberships */}
        <DebugSection title={`Tenant Memberships (${tenantMemberships.length})`}>
          <div className="space-y-1.5">
            {tenantMemberships.length === 0 ? (
              <div className="text-xs text-gray-400 italic">No active memberships</div>
            ) : (
              tenantMemberships.map(m => (
                <div key={m.id} className="text-xs p-2 bg-gray-50 rounded border border-gray-100">
                  <div className="font-medium text-gray-900">{m.tenant_id}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-gray-500">Role:</span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-xs">
                      {m.tenant_role}
                    </span>
                    <span className="text-gray-500">Status:</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                      m.status === 'active' ? 'bg-green-100 text-green-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {m.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </DebugSection>

        {/* Enabled Modules */}
        <DebugSection title={`Enabled Modules (${enabledModules.length})`}>
          <div className="flex flex-wrap gap-1.5">
            {enabledModules.length === 0 ? (
              <div className="text-xs text-gray-400 italic">No modules enabled</div>
            ) : (
              enabledModules.map(mod => (
                <span key={mod} className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded border border-blue-100">
                  {mod}
                </span>
              ))
            )}
          </div>
        </DebugSection>

        {/* Permissions */}
        <DebugSection title={`Permissions (${permissions.length})`}>
          <div className="flex flex-wrap gap-1.5">
            {permissions.length === 0 ? (
              <div className="text-xs text-gray-400 italic">No permissions</div>
            ) : (
              permissions.map(perm => (
                <span key={perm} className="px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded border border-purple-100">
                  {perm}
                </span>
              ))
            )}
          </div>
        </DebugSection>

        {/* Onboarding State */}
        {onboardingState && (
          <DebugSection title="Onboarding State">
            <div className="space-y-2">
              <StatusRow 
                label="Complete" 
                valid={onboardingState.complete} 
                icon={CheckCircle}
              />
              <div className="text-xs">
                <span className="text-gray-500">State:</span>
                <span className="ml-2 px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                  {onboardingState.tenantState}
                </span>
              </div>
              {onboardingState.missingSteps && onboardingState.missingSteps.length > 0 && (
                <div className="text-xs">
                  <span className="text-gray-500">Missing:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {onboardingState.missingSteps.map(step => (
                      <span key={step} className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded">
                        {step}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DebugSection>
        )}

        {/* Failed Checks */}
        {failedChecks.length > 0 && (
          <DebugSection title="Failed Checks">
            <div className="space-y-1.5">
              {failedChecks.map((check, idx) => (
                <div key={idx} className="text-xs p-2 bg-red-50 rounded border border-red-100">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-3 h-3 text-red-600 flex-shrink-0" />
                    <span className="font-medium text-red-900">{check.check}</span>
                  </div>
                  <div className="text-red-700 mt-1">{check.message}</div>
                  {check.repairable && (
                    <div className="text-xs text-red-600 mt-1 italic">Repairable</div>
                  )}
                </div>
              ))}
            </div>
          </DebugSection>
        )}
      </div>
    </div>
  );
}

function DebugSection({ title, children }) {
  return (
    <div>
      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
        <ChevronRight className="w-3 h-3" />
        {title}
      </h4>
      {children}
    </div>
  );
}

function StatusRow({ label, valid, icon: Icon, inverse }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500 flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </span>
      {valid === (inverse ? false : true) ? (
        <CheckCircle className="w-3.5 h-3.5 text-green-600" />
      ) : (
        <XCircle className="w-3.5 h-3.5 text-red-600" />
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-lg p-2 text-center border border-gray-100">
      <div className="text-lg font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}