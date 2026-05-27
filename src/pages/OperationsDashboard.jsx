import { useState, useEffect } from 'react';
import { Zap, Activity, Shield, Clock, TrendingUp, AlertTriangle, CheckCircle2, Play } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';

export default function OperationsDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const [workflows, executions, approvals, projects, tickets] = await Promise.all([
        base44.entities.Workflow.list(),
        base44.entities.WorkflowExecution.list(),
        base44.entities.WorkflowApproval.list(),
        base44.entities.Project.list(),
        base44.entities.SupportTicket.list(),
      ]);

      // Workflow metrics
      const activeWorkflows = workflows.filter(w => w.is_active).length;
      const totalExecutions = executions.length;
      const completedExecutions = executions.filter(e => e.status === 'Completed').length;
      const successRate = totalExecutions > 0 ? ((completedExecutions / totalExecutions) * 100).toFixed(1) : 0;
      const pendingApprovals = approvals.filter(a => a.status === 'Pending').length;
      
      // Calculate automation rate
      const automatedTasks = executions.reduce((sum, e) => sum + (e.created_entities?.length || 0), 0);
      const totalTasks = projects.reduce((sum, p) => sum + (p.tasks_count || 0), 0) + automatedTasks;
      const automationRate = totalTasks > 0 ? ((automatedTasks / totalTasks) * 100).toFixed(1) : 0;

      // Recent activity
      const recent = executions.slice(0, 10).map(e => ({
        type: 'workflow',
        title: e.workflow_name,
        status: e.status,
        timestamp: e.started_at,
      }));

      // Alerts
      const alertsList = [];
      
      // Check for failed workflows
      const failedWorkflows = executions.filter(e => e.status === 'Failed').length;
      if (failedWorkflows > 0) {
        alertsList.push({
          type: 'warning',
          title: `${failedWorkflows} workflow falliti`,
          description: 'Alcuni workflow non sono stati completati con successo',
        });
      }

      // Check for pending approvals
      if (pendingApprovals > 0) {
        alertsList.push({
          type: 'info',
          title: `${pendingApprovals} approvazioni in attesa`,
          description: 'Sono presenti approvazioni che richiedono attenzione',
        });
      }

      // Check for low margin projects
      const lowMarginProjects = projects.filter(p => {
        const margin = p.contract_value - (p.material_costs + p.labor_costs + p.other_costs);
        const marginPct = p.contract_value > 0 ? (margin / p.contract_value) * 100 : 0;
        return marginPct < 25;
      }).length;

      if (lowMarginProjects > 0) {
        alertsList.push({
          type: 'critical',
          title: `${lowMarginProjects} progetti con margine basso`,
          description: 'Margine inferiore al 25% - richiede attenzione',
        });
      }

      setMetrics({
        activeWorkflows,
        totalExecutions,
        successRate,
        automationRate,
        pendingApprovals,
      });

      setRecentActivity(recent);
      setAlerts(alertsList);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-400">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Caricamento metriche...
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
            Operations Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">Panoramica automazioni e stato operativo</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/workflows')}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Workflows
          </button>
          <button
            onClick={() => navigate('/approvals')}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Approvazioni
          </button>
          <button
            onClick={() => navigate('/workflow-analytics')}
            className="px-4 py-2 text-sm text-white rounded-lg"
            style={{ background: 'linear-gradient(135deg, #1147FF 0%, #0B2341 100%)' }}
          >
            Analytics
          </button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert, idx) => (
            <AlertCard key={idx} alert={alert} />
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard label="Workflow Attivi" value={metrics.activeWorkflows} icon={Zap} color="#3B82F6" />
        <KpiCard label="Esecuzioni" value={metrics.totalExecutions} icon={Play} color="#06b6d4" />
        <KpiCard label="Success Rate" value={`${metrics.successRate}%`} icon={TrendingUp} color="#10B981" />
        <KpiCard label="Automazione" value={`${metrics.automationRate}%`} icon={Activity} color="#8B5CF6" />
        <KpiCard label="In Attesa" value={metrics.pendingApprovals} icon={Shield} color="#F59E0B" />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Attività Recente</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {recentActivity.map((activity, idx) => (
            <div key={idx} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-400">{new Date(activity.timestamp).toLocaleString('it-IT')}</p>
                </div>
              </div>
              <StatusBadge status={activity.status} />
            </div>
          ))}
        </div>
        {recentActivity.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-400">Nessuna attività recente</div>
        )}
      </div>
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

function AlertCard({ alert }) {
  const styles = {
    critical: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const icons = {
    critical: AlertTriangle,
    warning: AlertTriangle,
    info: Activity,
  };

  const Icon = icons[alert.type] || AlertTriangle;

  return (
    <div className={`p-4 rounded-xl border ${styles[alert.type]}`}>
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold">{alert.title}</p>
          <p className="text-xs mt-1 opacity-90">{alert.description}</p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    Running: 'bg-blue-50 text-blue-700 border border-blue-200',
    Failed: 'bg-red-50 text-red-700 border border-red-200',
    'Pending Approval': 'bg-amber-50 text-amber-700 border border-amber-200',
    Escalated: 'bg-purple-50 text-purple-700 border border-purple-200',
  };

  return (
    <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}