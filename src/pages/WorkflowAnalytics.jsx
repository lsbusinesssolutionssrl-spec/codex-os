import { useState, useEffect } from 'react';
import { Zap, CheckCircle2, AlertTriangle, Clock, TrendingUp, Play, Calendar, Users, Mail, Shield, Activity } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function WorkflowAnalytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [executions, setExecutions] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [workflows, executionsList, approvals] = await Promise.all([
        base44.entities.Workflow.list(),
        base44.entities.WorkflowExecution.list(),
        base44.entities.WorkflowApproval.filter({ status: 'Pending' }),
      ]);

      // Calculate stats
      const totalWorkflows = workflows.length;
      const activeWorkflows = workflows.filter(w => w.is_active).length;
      const totalExecutions = executionsList.length;
      const completedExecutions = executionsList.filter(e => e.status === 'Completed').length;
      const failedExecutions = executionsList.filter(e => e.status === 'Failed').length;
      const pendingExecutions = executionsList.filter(e => e.status === 'Pending Approval' || e.status === 'Running').length;
      
      const successRate = totalExecutions > 0 ? ((completedExecutions / totalExecutions) * 100).toFixed(1) : 0;
      const avgDuration = executionsList.filter(e => e.duration_seconds).reduce((sum, e) => sum + e.duration_seconds, 0) / (completedExecutions || 1);
      
      const totalApprovals = approvals.length;
      const totalNotifications = executionsList.reduce((sum, e) => sum + (e.notifications_sent || 0), 0);
      const totalEscalations = executionsList.reduce((sum, e) => sum + (e.escalations || 0), 0);

      // Automation savings (estimated time saved)
      const avgManualTimeMinutes = 15; // Estimate: each automated task saves 15 min
      const totalTasksCreated = executionsList.reduce((sum, e) => sum + (e.created_entities?.length || 0), 0);
      const timeSavedHours = ((totalTasksCreated * avgManualTimeMinutes) / 60).toFixed(1);

      setStats({
        totalWorkflows,
        activeWorkflows,
        totalExecutions,
        completedExecutions,
        failedExecutions,
        pendingExecutions,
        successRate,
        avgDuration: Math.round(avgDuration),
        totalApprovals,
        totalNotifications,
        totalEscalations,
        timeSavedHours,
      });

      setExecutions(executionsList.slice(0, 20)); // Last 20
      setPendingApprovals(approvals);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-400">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Caricamento analytics...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-500" />
            Workflow Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-1">Monitoraggio prestazioni automazioni</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <KpiCard label="Workflow Totali" value={stats.totalWorkflows} icon={Zap} color="#3B82F6" />
        <KpiCard label="Workflow Attivi" value={stats.activeWorkflows} icon={Play} color="#10B981" />
        <KpiCard label="Esecuzioni Totali" value={stats.totalExecutions} icon={CheckCircle2} color="#06b6d4" />
        <KpiCard label="Success Rate" value={`${stats.successRate}%`} icon={TrendingUp} color={parseFloat(stats.successRate) >= 90 ? '#10B981' : '#F59E0B'} />
        <KpiCard label="Tempo Medio" value={`${stats.avgDuration}s`} icon={Clock} color="#8B5CF6" />
        <KpiCard label="Ore Risparmiate" value={stats.timeSavedHours} icon={Calendar} color="#059669" />
      </div>

      {/* Detailed Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <p className="text-xs font-semibold text-gray-700">Esecuzioni Completate</p>
          </div>
          <p className="text-2xl font-bold text-emerald-700">{stats.completedExecutions}</p>
          <p className="text-xs text-gray-400 mt-1">{stats.failedExecutions} fallite</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-amber-500" />
            <p className="text-xs font-semibold text-gray-700">Approvazioni in Attesa</p>
          </div>
          <p className="text-2xl font-bold text-amber-700">{stats.totalApprovals}</p>
          <p className="text-xs text-gray-400 mt-1">{stats.pendingExecutions} workflow in corso</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="w-4 h-4 text-blue-500" />
            <p className="text-xs font-semibold text-gray-700">Notifiche Inviate</p>
          </div>
          <p className="text-2xl font-bold text-blue-700">{stats.totalNotifications}</p>
          <p className="text-xs text-gray-400 mt-1">{stats.totalEscalations} escalation</p>
        </div>
      </div>

      {/* Recent Executions */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Esecuzioni Recenti</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Workflow</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Trigger</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Stato</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Step</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Durata</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {executions.map(exec => (
                <tr key={exec.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-gray-900">{exec.workflow_name}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs text-gray-500 capitalize">{exec.trigger_type}</span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <StatusBadge status={exec.status} />
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="text-xs text-gray-600">{exec.steps_executed}/{exec.steps_total}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="text-xs text-gray-600">{exec.duration_seconds || 0}s</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="text-xs text-gray-400">
                      {new Date(exec.started_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {executions.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-400">Nessuna esecuzione recente</div>
        )}
      </div>

      {/* Pending Approvals */}
      {pendingApprovals.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-500" />
              Approvazioni in Sospeso
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingApprovals.map(approval => (
              <div key={approval.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{approval.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{approval.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>Richiesto da: {approval.requested_by}</span>
                      <span>·</span>
                      <span>Ruolo: {approval.required_role}</span>
                      <span>·</span>
                      <span>{new Date(approval.requested_at).toLocaleString('it-IT')}</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    In Attesa
                  </span>
                </div>
              </div>
            ))}
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
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold" style={{ color }}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    'Running': 'bg-blue-50 text-blue-700 border border-blue-200',
    'Completed': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    'Failed': 'bg-red-50 text-red-700 border border-red-200',
    'Pending Approval': 'bg-amber-50 text-amber-700 border border-amber-200',
    'Escalated': 'bg-purple-50 text-purple-700 border border-purple-200',
  };
  
  return (
    <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${styles[status] || 'bg-gray-50 text-gray-600 border border-gray-200'}`}>
      {status}
    </span>
  );
}