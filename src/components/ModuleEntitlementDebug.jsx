import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useGlobalContext } from '@/lib/GlobalContextEngine';
import { CheckCircle2, XCircle, AlertTriangle, Database, Shield, Zap, FileText, Layers, User, Building2, Minimize2, Maximize2 } from 'lucide-react';

export default function ModuleEntitlementDebug() {
  const [minimized, setMinimized] = useState(false);
  const { activeTenant, activeTenantRole, enabledModules, subscription, platformRole, isPlatformMode } = useGlobalContext();

  // CRITICAL: Show ONLY to platform users in platform mode
  const isInternalUser = ['super_admin', 'developer', 'platform_owner', 'admin'].includes(platformRole) && isPlatformMode;
  
  const [debug, setDebug] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDebug = async () => {
      if (!activeTenant) return;

      try {
        // Load subscription with plan
        const sub = await base44.entities.CompanySubscription.filter(
          { company_id: activeTenant.id, status: 'active' },
          '-created_date',
          1
        ).then(s => s[0]);

        let plan = null;
        if (sub?.plan_id) {
          const plans = await base44.entities.SubscriptionPlan.filter({ id: sub.plan_id });
          plan = plans[0] || null;
        }

        // Load feature flags
        const flags = await base44.entities.TenantFeatureFlag.filter({
          company_id: activeTenant.id
        });

        // Module entitlement check
        const modules = [
          { id: 'financial_control', name: 'Financial Control', route: '/financial-control' },
          { id: 'intelligence', name: 'Intelligence', route: '/intelligence' },
          { id: 'executive_insights', name: 'Executive Insights', route: '/executive-insights' },
          { id: 'business_intelligence', name: 'Business Intelligence', route: '/business-intelligence' },
          { id: 'team_performance', name: 'Team Performance', route: '/team-performance' },
          { id: 'risk_monitoring', name: 'Risk Monitoring', route: '/risk-monitoring' },
          { id: 'workflows', name: 'Workflows', route: '/workflows' },
          { id: 'ai_copilot', name: 'AI Copilot', route: '/ai' },
          { id: 'guardian', name: 'Guardian', route: '/guardian' },
        ];

        const entitlements = modules.map(mod => {
          const planIncludes = plan?.quotas?.[mod.id] || plan?.quotas?.advanced_analytics || plan?.quotas?.custom_reports || false;
          const featureFlag = flags.find(f => f.feature_name === mod.id);
          const flagEnabled = featureFlag?.enabled || false;
          const rolePermitted = activeTenantRole === 'tenant_admin' || activeTenantRole === 'project_manager';
          const enabled = enabledModules.includes(mod.id);

          let decision = 'denied';
          let reason = '';

          if (!activeTenant) {
            reason = 'No active tenant';
          } else if (!rolePermitted) {
            reason = `Role ${activeTenantRole} not permitted`;
          } else if (!planIncludes && !flagEnabled) {
            reason = 'Plan does not include this module';
          } else if (!enabled) {
            reason = 'Module not in enabledModules list';
          } else {
            decision = 'allowed';
            reason = 'All checks passed';
          }

          return {
            module: mod.name,
            moduleId: mod.id,
            planIncludes,
            featureFlagEnabled: flagEnabled,
            rolePermitted,
            finalDecision: decision,
            reason,
            enabledInContext: enabled,
          };
        });

        setDebug({
          tenant: activeTenant,
          subscription: sub,
          plan,
          featureFlags: flags,
          tenantRole: activeTenantRole,
          enabledModules,
          entitlements,
        });
      } catch (error) {
        console.error('Error loading debug data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDebug();
  }, [activeTenant, activeTenantRole, enabledModules]);

  if (!isInternalUser) return null;
  if (loading) return <div className="p-4 text-sm text-gray-500">Loading debug data...</div>;
  if (!debug) return <div className="p-4 text-sm text-red-600">No debug data available</div>;

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        <Zap className="w-4 h-4 text-blue-600" />
        <span className="text-xs font-semibold text-gray-700">Modules</span>
        <span className="text-xs text-gray-500">{enabledModules.length} active</span>
        <Maximize2 className="w-3 h-3 text-gray-400" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 max-w-md max-h-96 overflow-auto p-4 space-y-4 text-xs">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Database className="w-4 h-4" />
            Module Entitlement Debug
          </h3>
          <button
            onClick={() => setMinimized(true)}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <Minimize2 className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>

        {/* Tenant Info */}
        <div className="grid grid-cols-2 gap-2">
          <InfoCard label="Tenant" value={debug.tenant?.name} icon={Building2} />
          <InfoCard label="Role" value={debug.tenantRole} icon={User} />
          <InfoCard label="Plan" value={debug.plan?.name || 'No plan'} icon={Layers} />
          <InfoCard label="Status" value={debug.subscription?.status || 'No subscription'} icon={Shield} />
        </div>

        {/* Enabled Modules */}
        <div>
          <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Zap className="w-3 h-3" />
            Enabled Modules ({debug.enabledModules.length})
          </h4>
          <div className="flex flex-wrap gap-1">
            {debug.enabledModules.map(mod => (
              <span key={mod} className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-medium">
                {mod}
              </span>
            ))}
          </div>
        </div>

        {/* Feature Flags */}
        <div>
          <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <FileText className="w-3 h-3" />
            Feature Flags ({debug.featureFlags.length})
          </h4>
          <div className="space-y-1">
            {debug.featureFlags.map(flag => (
              <div key={flag.id} className="flex items-center gap-2">
                {flag.enabled ? (
                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                ) : (
                  <XCircle className="w-3 h-3 text-red-600" />
                )}
                <span className={flag.enabled ? 'text-green-700' : 'text-red-700'}>
                  {flag.feature_name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Module Entitlements */}
        <div>
          <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Shield className="w-3 h-3" />
            Module Entitlements
          </h4>
          <div className="space-y-2">
            {debug.entitlements.map(ent => {
              return (
                <div
                  key={ent.moduleId}
                  className={`p-2 rounded border ${
                    ent.finalDecision === 'allowed'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900">{ent.module}</span>
                    {ent.finalDecision === 'allowed' ? (
                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-600" />
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-gray-600">
                    <CheckItem label="Plan Includes" value={ent.planIncludes} />
                    <CheckItem label="Flag Enabled" value={ent.featureFlagEnabled} />
                    <CheckItem label="Role Permitted" value={ent.rolePermitted} />
                    <CheckItem label="In Context" value={ent.enabledInContext} />
                  </div>
                  <div className="mt-1 text-[10px]">
                    <span className="font-medium">Decision: </span>
                    <span className={ent.finalDecision === 'allowed' ? 'text-green-700' : 'text-red-700'}>
                      {ent.finalDecision}
                    </span>
                    <span className="text-gray-500"> - {ent.reason}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value, icon: Icon }) {
  return (
    <div className="p-2 bg-gray-50 rounded border border-gray-200">
      <div className="flex items-center gap-1 mb-1">
        <Icon className="w-3 h-3 text-gray-500" />
        <span className="text-[10px] text-gray-600">{label}</span>
      </div>
      <p className="text-xs font-semibold text-gray-900 truncate">{value}</p>
    </div>
  );
}

function CheckItem({ label, value }) {
  return (
    <div className="flex items-center gap-1">
      {value ? (
        <CheckCircle2 className="w-2.5 h-2.5 text-green-600" />
      ) : (
        <XCircle className="w-2.5 h-2.5 text-red-600" />
      )}
      <span className="text-[10px]">{label}: {value ? 'Yes' : 'No'}</span>
    </div>
  );
}