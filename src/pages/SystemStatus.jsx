import { useState, useEffect } from 'react';
import { Zap, Activity, Shield, Clock, TrendingUp, CheckCircle2, AlertTriangle, BarChart2, FileText, Users, Mail, Globe } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';

/**
 * System Status Dashboard
 * 
 * High-level overview of Codex Autonomous Workflows Engine
 * Shows system health, automation metrics, and quick actions
 */

export default function SystemStatus() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const [workflows, executions, approvals, projects, tickets] = await Promise.all([
        base44.entities.Workflow.list(),
        base44.entities.WorkflowExecution.list(),
        base44.entities.WorkflowApproval.list(),
        base44.entities.Project.list(),
        base44.entities.SupportTicket.list(),
      ]);

      const activeWorkflows = workflows.filter(w => w.is_active).length;
      const recentExecutions = executions.filter(e => {
        const started = new Date(e.started_at);
        const now = new Date();
        const diffHours = (now - started) / (1000 * 60 * 60);
        return diffHours <= 24;
      });
      
      const pendingApprovals = approvals.filter(a => a.status === 'Pending').length;
      const failedExecutions = executions.filter(e => e.status === 'Failed').length;
      const successRate = executions.length > 0 
        ? ((executions.filter(e => e.status === 'Completed').length / executions.length) * 100).toFixed(1)
        : 0;

      // Automation rate
      const automatedProjects = projects.filter(p => p.status === 'In Progress' || p.status === 'Approved').length;
      const totalActive = projects.filter(p => ['Lead', 'Survey', 'Estimate', 'Approved', 'In Progress', 'Testing'].includes(p.status)).length;
      const automationRate = totalActive > 0 ? ((automatedProjects / totalActive) * 100).toFixed(1) : 0;

      setStatus({
        activeWorkflows,
        executionsToday: recentExecutions.length,
        pendingApprovals,
        failedExecutions,
        successRate,
        automationRate,
        totalWorkflows: workflows.length,
        totalExecutions: executions.length,
      });
    } catch (error) {
      console.error('Failed to load status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-400">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Caricamento stato sistema...
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
            Stato Sistema
          </h1>
          <p className="text-sm text-gray-500 mt-1">Panoramica Codex Autonomous Workflows Engine</p>
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

      {/* System Health */}
      <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl border border-blue-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">System Health</h2>
            <p className="text-sm text-gray-500 mt-1">Stato operativo del sistema di automazione</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-700">Operativo</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <HealthMetric label="Workflow Attivi" value={status.activeWorkflows} icon={Zap} color="#3B82F6" />
          <HealthMetric label="Esecuzioni (24h)" value={status.executionsToday} icon={Activity} color="#06b6d4" />
          <HealthMetric label="Success Rate" value={`${status.successRate}%`} icon={TrendingUp} color="#10B981" />
          <HealthMetric label="Automazione" value={`${status.automationRate}%`} icon={BarChart2} color="#8B5CF6" />
        </div>
      </div>

      {/* Alerts */}
      {(status.pendingApprovals > 0 || status.failedExecutions > 0) && (
        <div className="space-y-3">
          {status.pendingApprovals > 0 && (
            <AlertCard
              type="warning"
              title={`${status.pendingApprovals} approvazioni in attesa`}
              description="Sono presenti approvazioni che richiedono attenzione"
              action="Vai alle Approvazioni"
              onClick={() => navigate('/approvals')}
            />
          )}
          {status.failedExecutions > 0 && (
            <AlertCard
              type="critical"
              title={`${status.failedExecutions} esecuzioni fallite`}
              description="Alcuni workflow non sono stati completati con successo"
              action="Verifica Log"
              onClick={() => navigate('/workflow-analytics')}
            />
          )}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickStat
          title="Totale Workflow"
          value={status.totalWorkflows}
          description="Workflow configurati"
          icon={FileText}
        />
        <QuickStat
          title="Esecuzioni Totali"
          value={status.totalExecutions}
          description="Dall'attivazione"
          icon={Clock}
        />
        <QuickStat
          title="Approvazioni"
          value={status.pendingApprovals}
          description="In attesa di revisione"
          icon={Shield}
        />
      </div>

      {/* System Capabilities */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Funzionalità Sistema</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <CapabilityCard icon={Zap} label="Event-Driven" description="Trigger automatici" />
          <CapabilityCard icon={Shield} label="Approvals" description="Human-in-the-loop" />
          <CapabilityCard icon={Clock} label="Scheduled" description="Automazioni ricorrenti" />
          <CapabilityCard icon={Globe} label="Integrations" description="Connettori esterni" />
          <CapabilityCard icon={Mail} label="Notifications" description="Multi-channel" />
          <CapabilityCard icon={Users} label="Escalations" description="Alert automatici" />
          <CapabilityCard icon={BarChart2} label="Analytics" description="Metriche e KPI" />
          <CapabilityCard icon={FileText} label="Audit Log" description="Tracciamento completo" />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Azioni Rapide</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickAction label="Nuovo Workflow" icon={Zap} onClick={() => navigate('/workflows/builder')} />
          <QuickAction label="Verifica Approvazioni" icon={Shield} onClick={() => navigate('/approvals')} />
          <QuickAction label="Analytics" icon={BarChart2} onClick={() => navigate('/workflow-analytics')} />
          <QuickAction label="Integrazioni" icon={Globe} onClick={() => navigate('/integrations')} />
        </div>
      </div>
    </div>
  );
}

function HealthMetric({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-lg p-3 border border-gray-100">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className="text-xl font-bold" style={{ color }}>{value}</p>
    </div>
  );
}

function AlertCard({ type, title, description, action, onClick }) {
  const styles = {
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    critical: 'bg-red-50 border-red-200 text-red-800',
  };

  const icons = {
    warning: AlertTriangle,
    critical: AlertTriangle,
  };

  const Icon = icons[type] || AlertTriangle;

  return (
    <div className={`p-4 rounded-xl border ${styles[type]}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-xs mt-1 opacity-90">{description}</p>
          </div>
        </div>
        <button
          onClick={onClick}
          className="px-3 py-1.5 text-xs font-medium bg-white/50 hover:bg-white rounded-lg transition-colors"
        >
          {action}
        </button>
      </div>
    </div>
  );
}

function QuickStat({ title, value, description, icon: Icon }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-gray-400" />
        <span className="text-xs text-gray-500 font-medium">{title}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{description}</p>
    </div>
  );
}

function CapabilityCard({ icon: Icon, label, description }) {
  return (
    <div className="p-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-white hover:border-gray-200 transition-all">
      <Icon className="w-4 h-4 text-blue-500 mb-2" />
      <p className="text-xs font-semibold text-gray-900">{label}</p>
      <p className="text-[10px] text-gray-500 mt-0.5">{description}</p>
    </div>
  );
}

function QuickAction({ label, icon: Icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-blue-300 transition-all text-left"
    >
      <Icon className="w-4 h-4 text-blue-500" />
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </button>
  );
}