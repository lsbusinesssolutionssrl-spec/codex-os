import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, Users, Activity, AlertTriangle, CheckCircle, Clock, Database, Cpu, HardDrive } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ProductAnalytics() {
  const navigate = useNavigate();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalTenants: 0,
    activeTenants: 0,
    trialTenants: 0,
    expiredTrials: 0,
    suspendedTenants: 0,
    totalUsers: 0,
    totalProjects: 0,
    totalEstimates: 0,
    totalTickets: 0,
    aiQueries: 0,
    storageUsed: 0,
    featureUsage: [],
    tenantHealth: [],
  });

  useEffect(() => {
    base44.auth.me().then(u => {
      if (u?.role !== 'admin') { navigate('/'); return; }
      setIsSuperAdmin(true);
      loadAnalytics();
    });
  }, []);

  const loadAnalytics = async () => {
    try {
      const [companies, subscriptions, users, projects, estimates, tickets, memories] = await Promise.all([
        base44.entities.Company.list(),
        base44.entities.CompanySubscription.list(),
        base44.entities.User.list(),
        base44.entities.Project.list(undefined, 500),
        base44.entities.Estimate.list(undefined, 500),
        base44.entities.SupportTicket.list(undefined, 500),
        base44.entities.AIMemory.list(undefined, 200),
      ]);

      const activeSubs = subscriptions.filter(s => s.status === 'active');
      const trialSubs = subscriptions.filter(s => s.status === 'trial');
      const expiredTrials = subscriptions.filter(s => s.status === 'trial_expired');
      const suspendedSubs = subscriptions.filter(s => s.status === 'suspended');

      // Calculate tenant health
      const tenantHealth = companies.map(c => {
        const sub = subscriptions.find(s => s.company_id === c.id);
        const companyProjects = projects.filter(p => p.company_id === c.id).length;
        const companyUsers = users.filter(u => u.company_id === c.id).length;
        const companyEstimates = estimates.filter(e => e.company_id === c.id).length;
        const companyMemories = memories.filter(m => m.created_by?.includes(c.id)).length;
        
        let score = 0;
        if (sub?.status === 'active') score += 40;
        if (sub?.status === 'trial') score += 20;
        if (companyProjects > 5) score += 20;
        if (companyUsers > 2) score += 15;
        if (companyEstimates > 3) score += 15;
        if (companyMemories > 0) score += 10;

        let health = 'Inactive';
        if (score >= 80) health = 'Healthy';
        else if (score >= 60) health = 'Needs Attention';
        else if (score >= 40) health = 'At Risk';

        return {
          company_id: c.id,
          company_name: c.name,
          health,
          score,
          status: sub?.status || 'No subscription',
          projects: companyProjects,
          users: companyUsers,
          lastLogin: c.updated_date,
        };
      });

      // Feature usage
      const featureUsage = [
        { feature: 'Logins', count: users.length, icon: Users },
        { feature: 'Projects Created', count: projects.length, icon: Activity },
        { feature: 'Estimates Created', count: estimates.length, icon: BarChart3 },
        { feature: 'Tickets Closed', count: tickets.filter(t => t.status === 'Resolved').length, icon: CheckCircle },
        { feature: 'AI Queries', count: memories.length, icon: Cpu },
      ];

      // Storage (placeholder)
      const storageUsed = subscriptions.reduce((sum, s) => sum + (s.storage_used_gb || 0), 0);

      setAnalytics({
        totalTenants: companies.length,
        activeTenants: activeSubs.length,
        trialTenants: trialSubs.length,
        expiredTrials: expiredTrials.length,
        suspendedTenants: suspendedSubs.length,
        totalUsers: users.length,
        totalProjects: projects.length,
        totalEstimates: estimates.length,
        totalTickets: tickets.length,
        aiQueries: memories.length,
        storageUsed,
        featureUsage,
        tenantHealth,
      });
    } catch (error) {
      console.error('Analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isSuperAdmin || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Platform-wide usage and tenant health</p>
        </div>
      </div>

      {/* High-Level Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard label="Total Tenants" value={analytics.totalTenants} icon={Database} color="#1147FF" />
        <MetricCard label="Active" value={analytics.activeTenants} icon={CheckCircle} color="#10B981" />
        <MetricCard label="Trials" value={analytics.trialTenants} icon={Clock} color="#3B82F6" />
        <MetricCard label="Expired" value={analytics.expiredTrials} icon={AlertTriangle} color="#F59E0B" />
        <MetricCard label="Suspended" value={analytics.suspendedTenants} icon={AlertTriangle} color="#EF4444" />
      </div>

      {/* Usage Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard label="Total Users" value={analytics.totalUsers} icon={Users} color="#0B2341" />
        <MetricCard label="Projects" value={analytics.totalProjects} icon={Activity} color="#10B981" />
        <MetricCard label="Estimates" value={analytics.totalEstimates} icon={BarChart3} color="#8B5CF6" />
        <MetricCard label="Tickets" value={analytics.totalTickets} icon={CheckCircle} color="#EF4444" />
        <MetricCard label="AI Queries" value={analytics.aiQueries} icon={Cpu} color="#F59E0B" />
      </div>

      {/* Feature Usage */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          Feature Usage
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {analytics.featureUsage.map((item, idx) => (
            <div key={idx} className="text-center p-4 bg-gray-50 rounded-xl">
              <item.icon className="w-6 h-6 mx-auto mb-2" style={{ color: '#1147FF' }} />
              <p className="text-2xl font-bold text-gray-900">{item.count}</p>
              <p className="text-xs text-gray-500 mt-1">{item.feature}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tenant Health */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-green-500" />
          Tenant Health Scores
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Tenant</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Health</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Score</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Status</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Projects</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Users</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {analytics.tenantHealth.map((tenant, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{tenant.company_name}</td>
                  <td className="text-center py-3 px-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      tenant.health === 'Healthy' ? 'bg-green-100 text-green-700' :
                      tenant.health === 'Needs Attention' ? 'bg-yellow-100 text-yellow-700' :
                      tenant.health === 'At Risk' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {tenant.health}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4 font-bold text-gray-900">{tenant.score}/100</td>
                  <td className="text-center py-3 px-4">
                    <span className="text-xs text-gray-600">{tenant.status}</span>
                  </td>
                  <td className="text-center py-3 px-4 text-gray-600">{tenant.projects}</td>
                  <td className="text-center py-3 px-4 text-gray-600">{tenant.users}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Storage */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-purple-500" />
          Storage Usage
        </h3>
        <div className="flex items-center gap-4">
          <div className="text-3xl font-bold text-gray-900">{analytics.storageUsed.toFixed(2)} GB</div>
          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, (analytics.storageUsed / 100) * 100)}%`, backgroundColor: '#1147FF' }}
            />
          </div>
          <div className="text-sm text-gray-500">of 100 GB</div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, color }) {
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