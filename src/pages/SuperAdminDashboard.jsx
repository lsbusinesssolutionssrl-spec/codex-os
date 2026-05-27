import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Building2, Users, TrendingUp, DollarSign, AlertTriangle,
  CheckCircle, Clock, BarChart2, Activity, Shield, Eye, Globe, CreditCard
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      if (u?.role !== 'admin') { navigate('/'); return; }
      setIsSuperAdmin(true);
      setAuthChecked(true);
    });
  }, []);

  const { data: companies = [] } = useQuery({
    queryKey: ['superadmin-companies'],
    queryFn: () => base44.entities.Company.list(),
    enabled: isSuperAdmin,
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['superadmin-subscriptions'],
    queryFn: () => base44.entities.CompanySubscription.list(),
    enabled: isSuperAdmin,
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['superadmin-plans'],
    queryFn: () => base44.entities.SubscriptionPlan.list(),
    enabled: isSuperAdmin,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['superadmin-users'],
    queryFn: () => base44.entities.User.list(),
    enabled: isSuperAdmin,
  });

  const { data: allProjects = [] } = useQuery({
    queryKey: ['superadmin-projects'],
    queryFn: () => base44.entities.Project.list(undefined, 200),
    enabled: isSuperAdmin,
  });

  const { data: allEstimates = [] } = useQuery({
    queryKey: ['superadmin-estimates'],
    queryFn: () => base44.entities.Estimate.list(undefined, 200),
    enabled: isSuperAdmin,
  });

  if (!authChecked) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
    </div>
  );

  const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
  const trialSubscriptions = subscriptions.filter(s => s.status === 'trial');
  const churnRisk = subscriptions.filter(s => s.status === 'past_due' || s.cancel_at_period_end);
  const mrr = activeSubscriptions.reduce((sum, s) => sum + (s.mrr || 0), 0);
  const arr = mrr * 12;

  const enrichedCompanies = companies.map(c => {
    const sub = subscriptions.find(s => s.company_id === c.id);
    const plan = sub ? plans.find(p => p.id === sub.plan_id) : null;
    return {
      ...c,
      subscription: sub,
      plan,
      projectCount: allProjects.filter(p => p.company_id === c.id).length,
      estimateCount: allEstimates.filter(e => e.company_id === c.id).length,
      userCount: users.filter(u => u.company_id === c.id).length,
    };
  });

  const statusColor = {
    active: 'text-green-600 bg-green-50',
    trial: 'text-blue-600 bg-blue-50',
    past_due: 'text-red-600 bg-red-50',
    suspended: 'text-gray-600 bg-gray-100',
    cancelled: 'text-red-600 bg-red-50',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1147FF' }}>
              <Shield className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Super Admin</h1>
          </div>
          <p className="text-sm text-gray-500">Platform-wide analytics and tenant management</p>
        </div>
        <button
          onClick={() => navigate('/tenant-onboarding')}
          className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium"
          style={{ backgroundColor: '#1147FF' }}
        >
          <Building2 className="w-4 h-4" />
          New Tenant
        </button>
      </div>

      {/* Platform KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Tenants" value={companies.length} icon={Building2} color="#1147FF" />
        <KpiCard label="Active Subscriptions" value={activeSubscriptions.length} icon={CheckCircle} color="#10B981" />
        <KpiCard label="MRR" value={`€${mrr.toLocaleString('it-IT')}`} icon={DollarSign} color="#F59E0B" />
        <KpiCard label="ARR" value={`€${arr.toLocaleString('it-IT')}`} icon={TrendingUp} color="#8B5CF6" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Trials" value={trialSubscriptions.length} icon={Clock} color="#3B82F6" />
        <KpiCard label="Churn Risk" value={churnRisk.length} icon={AlertTriangle} color="#EF4444" />
        <KpiCard label="Platform Users" value={users.length} icon={Users} color="#0B2341" />
        <KpiCard label="Total Projects" value={allProjects.length} icon={Activity} color="#10B981" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-gray-500" />
            Subscription Breakdown
          </h3>
          <div className="space-y-2">
            {['active', 'trial', 'past_due', 'suspended', 'cancelled'].map(s => {
              const count = subscriptions.filter(sub => sub.status === s).length;
              if (!count) return null;
              return (
                <div key={s} className="flex items-center justify-between">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${statusColor[s] || 'bg-gray-100 text-gray-600'}`}>{s.replace('_', ' ')}</span>
                  <span className="font-bold text-gray-900">{count}</span>
                </div>
              );
            })}
            {subscriptions.length === 0 && <p className="text-xs text-gray-400">No subscriptions yet</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-500" />
            Platform Activity
          </h3>
          <div className="space-y-3">
            <MetricRow label="Total Estimates" value={allEstimates.length} />
            <MetricRow label="Total Projects" value={allProjects.length} />
            <MetricRow label="Avg Projects / Tenant" value={companies.length ? (allProjects.length / companies.length).toFixed(1) : 0} />
            <MetricRow label="Avg Users / Tenant" value={companies.length ? (users.length / companies.length).toFixed(1) : 0} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-gray-500" />
            Plans Distribution
          </h3>
          <div className="space-y-2">
            {plans.map(plan => {
              const count = subscriptions.filter(s => s.plan_id === plan.id).length;
              return (
                <div key={plan.id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{plan.name}</span>
                  <span className="font-bold text-gray-900">{count}</span>
                </div>
              );
            })}
            {plans.length === 0 && <p className="text-xs text-gray-400">No plans configured</p>}
          </div>
        </div>
      </div>

      {/* Tenant Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">All Tenants</h2>
          <span className="text-xs text-gray-400">{companies.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Company</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Plan</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Status</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Users</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Projects</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">MRR</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {enrichedCompanies.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {c.logo_url ? (
                        <img src={c.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: c.brand_color_primary || '#1147FF' }}>
                          {c.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className="text-xs text-gray-600">{c.plan?.name || '—'}</span>
                  </td>
                  <td className="text-center py-3 px-4">
                    {c.subscription ? (
                      <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${statusColor[c.subscription.status] || 'bg-gray-100 text-gray-600'}`}>
                        {c.subscription.status?.replace('_', ' ')}
                      </span>
                    ) : <span className="text-xs text-gray-400">No sub</span>}
                  </td>
                  <td className="text-center py-3 px-4 text-gray-600">{c.userCount}</td>
                  <td className="text-center py-3 px-4 text-gray-600">{c.projectCount}</td>
                  <td className="text-center py-3 px-4 font-medium text-gray-900">
                    {c.subscription?.mrr ? `€${c.subscription.mrr}` : '—'}
                  </td>
                  <td className="text-center py-3 px-4">
                    <button
                      onClick={() => navigate(`/company-settings`)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                      title="View Settings"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {companies.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400 text-sm">No tenants yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Churn Risk Alert */}
      {churnRisk.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-red-900">Churn Risk ({churnRisk.length})</h3>
          </div>
          <div className="space-y-2">
            {churnRisk.map(s => {
              const co = companies.find(c => c.id === s.company_id);
              return (
                <div key={s.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-2 border border-red-100">
                  <span className="text-sm font-medium text-gray-900">{co?.name || s.company_id}</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColor[s.status] || 'bg-gray-100'}`}>{s.status?.replace('_', ' ')}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function MetricRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}