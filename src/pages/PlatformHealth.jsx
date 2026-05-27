import { useState, useEffect } from 'react';
import { Activity, Zap, Brain, Database, TrendingUp, AlertTriangle, CheckCircle2, Clock, RefreshCw, Server, Wifi, Shield, Cpu, HardDrive, FileText, Layers } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function PlatformHealth() {
  const [healthScore, setHealthScore] = useState(100);
  const [metrics, setMetrics] = useState({
    workflowFailures: 0,
    aiFailures: 0,
    storageUsage: 0,
    tenantStability: 100,
    unresolvedIssues: 0,
    systemLatency: 0,
    syncReliability: 100,
  });
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHealthMetrics();
  }, []);

  const loadHealthMetrics = async () => {
    try {
      const [workflows, aiLogs, companies, subscriptions, tickets, events] = await Promise.all([
        base44.entities.WorkflowExecution.list(undefined, 200),
        base44.entities.AIAuditLog.list(undefined, 200),
        base44.entities.Company.list(),
        base44.entities.CompanySubscription.list(),
        base44.entities.SupportTicket.list(),
        base44.entities.PlatformEvent.list(undefined, 100),
      ]);

      // Calculate metrics
      const failedWorkflows = workflows.filter(w => w.status === 'Failed').length;
      const failedAI = aiLogs.filter(a => a.status === 'error').length;
      const totalStorage = subscriptions.reduce((sum, s) => sum + (s.storage_used_gb || 0), 0);
      const unstableTenants = companies.filter(c => {
        const sub = subscriptions.find(s => s.company_id === c.id);
        return sub?.status === 'trial_expired' || sub?.status === 'suspended';
      }).length;
      const unresolved = tickets.filter(t => t.status !== 'Resolved' && t.status !== 'Closed').length;
      const criticalEvents = events.filter(e => e.severity === 'Critical' || e.severity === 'Error').length;

      // Calculate health score
      let score = 100;
      score -= Math.min(20, failedWorkflows * 2);
      score -= Math.min(20, failedAI * 2);
      score -= Math.min(15, unstableTenants * 5);
      score -= Math.min(15, unresolved * 3);
      score -= Math.min(15, criticalEvents * 3);
      score -= Math.min(15, totalStorage > 90 ? 15 : 0);

      score = Math.max(0, Math.min(100, score));

      setHealthScore(score);
      setMetrics({
        workflowFailures: failedWorkflows,
        aiFailures: failedAI,
        storageUsage: totalStorage,
        tenantStability: Math.round(((companies.length - unstableTenants) / companies.length) * 100) || 100,
        unresolvedIssues: unresolved,
        systemLatency: criticalEvents,
        syncReliability: Math.round(((workflows.length - failedWorkflows) / workflows.length) * 100) || 100,
      });

      // Generate alerts
      const newAlerts = [];
      if (failedWorkflows > 5) newAlerts.push({ type: 'warning', message: `${failedWorkflows} workflow failures detected` });
      if (failedAI > 10) newAlerts.push({ type: 'warning', message: `${failedAI} AI request failures` });
      if (unstableTenants > 0) newAlerts.push({ type: 'critical', message: `${unstableTenants} tenants at risk` });
      if (totalStorage > 80) newAlerts.push({ type: 'warning', message: `Storage at ${totalStorage}% capacity` });
      if (unresolved > 20) newAlerts.push({ type: 'info', message: `${unresolved} unresolved tickets` });

      setAlerts(newAlerts);
    } catch (error) {
      console.error('Health metrics load failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-400">Loading health metrics...</div>;

  const scoreColor = healthScore >= 80 ? '#10B981' : healthScore >= 60 ? '#F59E0B' : '#EF4444';
  const scoreLabel = healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : healthScore >= 40 ? 'Fair' : 'Critical';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Health</h1>
          <p className="text-sm text-gray-500 mt-0.5">Real-time system health and stability metrics</p>
        </div>
        <button
          onClick={loadHealthMetrics}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Health Score */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-6">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle cx="64" cy="64" r="56" stroke="#E5E7EB" strokeWidth="16" fill="none" />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke={scoreColor}
                strokeWidth="16"
                fill="none"
                strokeDasharray={`${(healthScore / 100) * 351.68} 351.68`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className="text-3xl font-bold" style={{ color: scoreColor }}>{healthScore}</span>
                <p className="text-xs text-gray-500 mt-0.5">/ 100</p>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Platform Health Score</h2>
            <p className="text-sm text-gray-600 mb-4">Overall system stability and performance</p>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: scoreColor }} />
              <span className="text-sm font-semibold" style={{ color: scoreColor }}>{scoreLabel}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Workflows</p>
                <p className="font-semibold text-gray-900">{metrics.syncReliability}% reliable</p>
              </div>
              <div>
                <p className="text-gray-500">AI Services</p>
                <p className="font-semibold text-gray-900">{100 - metrics.aiFailures} successful</p>
              </div>
              <div>
                <p className="text-gray-500">Tenants</p>
                <p className="font-semibold text-gray-900">{metrics.tenantStability}% stable</p>
              </div>
            </div>
          </div>
          <div className="w-px h-32 bg-gray-200" />
          <div className="space-y-3">
            <AlertItem type="critical" count={metrics.tenantStability < 100 ? 1 : 0} label="Tenants at Risk" />
            <AlertItem type="warning" count={metrics.workflowFailures} label="Workflow Failures" />
            <AlertItem type="warning" count={metrics.aiFailures} label="AI Failures" />
            <AlertItem type="info" count={metrics.unresolvedIssues} label="Unresolved Issues" />
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <MetricCard label="Workflow Failures" value={metrics.workflowFailures} icon={Zap} color={metrics.workflowFailures > 5 ? '#EF4444' : '#10B981'} />
        <MetricCard label="AI Failures" value={metrics.aiFailures} icon={Brain} color={metrics.aiFailures > 10 ? '#EF4444' : '#10B981'} />
        <MetricCard label="Storage Usage" value={`${metrics.storageUsage} GB`} icon={HardDrive} color={metrics.storageUsage > 80 ? '#F59E0B' : '#10B981'} />
        <MetricCard label="Tenant Stability" value={`${metrics.tenantStability}%`} icon={Server} color={metrics.tenantStability >= 90 ? '#10B981' : '#F59E0B'} />
        <MetricCard label="Unresolved Issues" value={metrics.unresolvedIssues} icon={AlertTriangle} color={metrics.unresolvedIssues > 20 ? '#F59E0B' : '#10B981'} />
        <MetricCard label="System Latency" value={metrics.systemLatency} icon={Clock} color={metrics.systemLatency > 5 ? '#F59E0B' : '#10B981'} />
        <MetricCard label="Sync Reliability" value={`${metrics.syncReliability}%`} icon={RefreshCw} color={metrics.syncReliability >= 95 ? '#10B981' : '#F59E0B'} />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Active Alerts</h3>
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 p-4 rounded-xl border ${
                alert.type === 'critical' ? 'bg-red-50 border-red-200' :
                alert.type === 'warning' ? 'bg-amber-50 border-amber-200' :
                'bg-blue-50 border-blue-200'
              }`}
            >
              {alert.type === 'critical' ? <AlertTriangle className="w-5 h-5 text-red-600" /> :
               alert.type === 'warning' ? <AlertTriangle className="w-5 h-5 text-amber-600" /> :
               <Activity className="w-5 h-5 text-blue-600" />}
              <span className={`text-sm font-medium ${
                alert.type === 'critical' ? 'text-red-700' :
                alert.type === 'warning' ? 'text-amber-700' :
                'text-blue-700'
              }`}>{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Recovery Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-blue-500" />
          Quick Recovery Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <RecoveryButton
            label="Retry Failed Workflows"
            count={metrics.workflowFailures}
            onClick={() => toast.info('Retrying failed workflows...')}
            disabled={metrics.workflowFailures === 0}
          />
          <RecoveryButton
            label="Clear AI Cache"
            count={metrics.aiFailures}
            onClick={() => toast.info('Clearing AI cache...')}
            disabled={metrics.aiFailures === 0}
          />
          <RecoveryButton
            label="Optimize Storage"
            count={metrics.storageUsage}
            onClick={() => toast.info('Optimizing storage...')}
            disabled={metrics.storageUsage === 0}
          />
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
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function AlertItem({ type, count, label }) {
  const colors = {
    critical: { bg: 'bg-red-100', text: 'text-red-700', dot: '#EF4444' },
    warning: { bg: 'bg-amber-100', text: 'text-amber-700', dot: '#F59E0B' },
    info: { bg: 'bg-blue-100', text: 'text-blue-700', dot: '#3B82F6' },
  }[type];

  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${colors.bg}`}>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.dot }} />
        <span className={`text-xs font-medium ${colors.text}`}>{label}</span>
      </div>
      <span className={`text-xs font-bold ${colors.text}`}>{count}</span>
    </div>
  );
}

function RecoveryButton({ label, count, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-between px-4 py-3 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      <span className="font-medium text-gray-700">{label}</span>
      {count > 0 && (
        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">{count}</span>
      )}
    </button>
  );
}