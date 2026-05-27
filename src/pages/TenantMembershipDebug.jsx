import { useState, useEffect } from 'react';
import { 
  Shield, User, Building2, Activity, CheckCircle, 
  AlertTriangle, XCircle, Database, Zap, FileText,
  Cpu, Layers, Wifi, Clock
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function TenantMembershipDebug() {
  const [debug, setDebug] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDebug();
  }, []);

  const loadDebug = async () => {
    try {
      const user = await base44.auth.me();
      if (!user) return;

      const [memberships, companies, featureFlags, subscription] = await Promise.all([
        base44.entities.TenantMembership.filter({ user_id: user.id }),
        user.company_id ? [await base44.entities.Company.get(user.company_id)] : [],
        user.company_id ? await base44.entities.TenantFeatureFlag.filter({ company_id: user.company_id }) : [],
        user.company_id ? await base44.entities.CompanySubscription.filter({ company_id: user.company_id }).then(s => s[0]) : null,
      ]);

      const activeMembership = memberships.find(m => m.is_primary) || memberships.find(m => m.status === 'active');

      setDebug({
        user,
        memberships,
        company: companies[0] || null,
        featureFlags,
        subscription,
        activeMembership,
        platform_role: user.role,
        tenant_role: activeMembership?.tenant_role || null,
        has_company_id: !!user.company_id,
        has_membership: memberships.length > 0,
        is_platform: ['admin', 'developer'].includes(user.role),
      });
    } catch (error) {
      console.error('Debug load failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center text-gray-400 py-12">Loading debug info...</div>
      </div>
    );
  }

  if (!debug) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tenant Membership Debug Panel</h1>
        <button
          onClick={loadDebug}
          className="px-4 py-2 text-sm text-white rounded-lg hover:opacity-90"
          style={{ backgroundColor: '#1147FF' }}
        >
          Refresh
        </button>
      </div>

      {/* User Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Current User
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Email:</span>
            <p className="font-medium">{debug.user.email}</p>
          </div>
          <div>
            <span className="text-gray-500">Platform Role:</span>
            <p className="font-medium">{debug.platform_role}</p>
          </div>
          <div>
            <span className="text-gray-500">Company ID:</span>
            <p className={`font-medium ${debug.has_company_id ? 'text-green-600' : 'text-red-600'}`}>
              {debug.user.company_id || 'MISSING'}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Is Platform:</span>
            <p className="font-medium">{debug.is_platform ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>

      {/* Membership Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Tenant Membership Status
        </h2>
        <div className="space-y-3">
          <StatusRow 
            label="Has Company ID" 
            value={debug.has_company_id} 
            icon={Building2}
          />
          <StatusRow 
            label="Has Membership Record" 
            value={debug.has_membership} 
            icon={FileText}
          />
          <StatusRow 
            label="Has Active Membership" 
            value={!!debug.activeMembership} 
            icon={CheckCircle}
          />
          {debug.activeMembership && (
            <>
              <div className="border-t border-gray-100 pt-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Tenant ID:</span>
                    <p className="font-medium">{debug.activeMembership.tenant_id}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Tenant Role:</span>
                    <p className="font-medium">{debug.activeMembership.tenant_role}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <p className="font-medium capitalize">{debug.activeMembership.status}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Is Primary:</span>
                    <p className="font-medium">{debug.activeMembership.is_primary ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Company Context */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Company Context
        </h2>
        {debug.company ? (
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-gray-500">Company Name:</span>
              <p className="font-medium">{debug.company.name}</p>
            </div>
            <div>
              <span className="text-gray-500">Slug:</span>
              <p className="font-medium">{debug.company.slug}</p>
            </div>
            <div>
              <span className="text-gray-500">Status:</span>
              <p className="font-medium capitalize">{debug.company.status}</p>
            </div>
            {debug.subscription && (
              <div>
                <span className="text-gray-500">Subscription:</span>
                <p className="font-medium">{debug.subscription.status} - {debug.subscription.plan_id}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-400 flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            No company context loaded
          </div>
        )}
      </div>

      {/* Enabled Features */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Enabled Features
        </h2>
        {debug.featureFlags && debug.featureFlags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {debug.featureFlags.filter(f => f.enabled).map(f => (
              <span key={f.id} className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                {f.feature_name}
              </span>
            ))}
            {debug.featureFlags.filter(f => !f.enabled).map(f => (
              <span key={f.id} className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                {f.feature_name} (disabled)
              </span>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-400">No feature flags configured</div>
        )}
      </div>

      {/* Issues Detection */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Issues Detected
        </h2>
        <div className="space-y-2">
          {!debug.has_company_id && !debug.is_platform && (
            <IssueBadge 
              severity="critical"
              text="User has no company_id assigned"
            />
          )}
          {!debug.has_membership && !debug.is_platform && (
            <IssueBadge 
              severity="critical"
              text="User has no TenantMembership record"
            />
          )}
          {debug.has_company_id && !debug.has_membership && (
            <IssueBadge 
              severity="high"
              text="User has company_id but no membership (legacy user)"
            />
          )}
          {debug.memberships.length > 1 && (
            <IssueBadge 
              severity="warning"
              text={`User has ${debug.memberships.length} memberships (multiple)`}
            />
          )}
          {debug.activeMembership && !debug.activeMembership.is_primary && (
            <IssueBadge 
              severity="warning"
              text="No primary membership set"
            />
          )}
          {!debug.company && debug.has_company_id && (
            <IssueBadge 
              severity="high"
              text="Company reference exists but company not found"
            />
          )}
          {debug.is_platform && (
            <IssueBadge 
              severity="info"
              text="Platform user - tenant context not required"
            />
          )}
          {(!debug.is_platform && debug.has_company_id && debug.has_membership && debug.company) && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>All checks passed - tenant membership is valid</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Cpu className="w-5 h-5" />
          Quick Actions
        </h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => window.location.href = '/tenant-membership-repair'}
            className="px-4 py-2 text-sm text-white rounded-lg hover:opacity-90"
            style={{ backgroundColor: '#F59E0B' }}
          >
            Open Repair Center
          </button>
          <button
            onClick={() => window.location.href = '/tenant-isolation-audit'}
            className="px-4 py-2 text-sm text-white rounded-lg hover:opacity-90"
            style={{ backgroundColor: '#10B981' }}
          >
            Run Integrity Audit
          </button>
          <button
            onClick={() => window.location.href = '/super-admin'}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Super Admin Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusRow({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value ? (
          <CheckCircle className="w-4 h-4 text-green-600" />
        ) : (
          <XCircle className="w-4 h-4 text-red-600" />
        )}
        <span className={`text-sm font-medium ${value ? 'text-green-600' : 'text-red-600'}`}>
          {value ? 'Yes' : 'No'}
        </span>
      </div>
    </div>
  );
}

function IssueBadge({ severity, text }) {
  const colors = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200',
  };

  const icons = {
    critical: XCircle,
    high: AlertTriangle,
    warning: AlertTriangle,
    info: Activity,
  };

  const Icon = icons[severity];

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${colors[severity]}`}>
      <Icon className="w-4 h-4" />
      <span>{text}</span>
    </div>
  );
}