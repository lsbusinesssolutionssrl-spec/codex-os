import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Shield, Clock, CheckCircle2, AlertTriangle, Play, Plus, Activity, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function Workflows() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [workflows, setWorkflows] = useState([]);
  const [stats, setStats] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Get tenant filter
      const filtersRes = await base44.functions.invoke('getUserFilters', {}).catch(() => ({ data: { filters: {} } }));
      const companyId = filtersRes.data.filters?.Workflow?.company_id || filtersRes.data.filters?.company_id;

      // If no company_id, show empty state
      if (!companyId) {
        setWorkflows([]);
        setPendingApprovals([]);
        setStats({ total: 0, active: 0, totalExec: 0, successRate: 0 });
        setLoading(false);
        return;
      }

      // Load with tenant filter
      const [wfList, executions, approvals] = await Promise.all([
        base44.entities.Workflow.filter({ company_id: companyId }, '-created_date', 50),
        base44.entities.WorkflowExecution.filter({ company_id: companyId }, '-created_date', 100),
        base44.entities.WorkflowApproval.filter({ status: 'Pending', company_id: companyId }),
      ]);

      setWorkflows(wfList);
      setPendingApprovals(approvals);

      // Stats
      const active = wfList.filter(w => w.is_active).length;
      const totalExec = executions.length;
      const completed = executions.filter(e => e.status === 'Completed').length;
      const successRate = totalExec > 0 ? ((completed / totalExec) * 100).toFixed(1) : 0;

      setStats({
        total: wfList.length,
        active,
        totalExec,
        successRate,
      });
    } catch (error) {
      console.error('Error loading workflows:', error);
      setWorkflows([]);
      setPendingApprovals([]);
      setStats({ total: 0, active: 0, totalExec: 0, successRate: 0 });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-400">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Caricamento...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-500" />
            Workflows
          </h1>
          <p className="text-sm text-gray-500 mt-1">Automazioni e orchestrazione operativa</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/workflow-analytics')}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <Activity className="w-4 h-4" /> Analytics
          </button>
          <button
            onClick={() => navigate('/workflows/builder')}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg"
            style={{ background: 'linear-gradient(135deg, #1147FF 0%, #0B2341 100%)' }}
          >
            <Plus className="w-4 h-4" /> Nuovo Workflow
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Workflow Totali" value={stats.total} icon={Zap} color="#3B82F6" />
        <StatCard label="Workflow Attivi" value={stats.active} icon={Play} color="#10B981" />
        <StatCard label="Esecuzioni Totali" value={stats.totalExec} icon={CheckCircle2} color="#06b6d4" />
        <StatCard label="Success Rate" value={`${stats.successRate}%`} icon={TrendingUp} color="#10B981" />
      </div>

      {/* Pending Approvals Alert */}
      {pendingApprovals.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-semibold text-amber-900">Approvazioni in Sospeso ({pendingApprovals.length})</h2>
          </div>
          <div className="space-y-2">
            {pendingApprovals.slice(0, 3).map(approval => (
              <div key={approval.id} className="flex items-center justify-between text-sm">
                <span className="text-amber-800">{approval.title}</span>
                <span className="text-amber-600 text-xs">{approval.required_role}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workflows List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Tutti i Workflow</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Nome</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Categoria</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Trigger</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Stato</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Esecuzioni</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Success Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {workflows.map(wf => (
                <tr
                  key={wf.id}
                  onClick={() => navigate(`/workflows/builder?edit=${wf.id}`)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-gray-900">{wf.name}</div>
                    <div className="text-xs text-gray-400">{wf.description}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs text-gray-600">{wf.category}</span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`text-[10px] px-2 py-1 rounded-full ${
                      wf.trigger_type === 'entity_event' ? 'bg-blue-50 text-blue-700' :
                      wf.trigger_type === 'scheduled' ? 'bg-purple-50 text-purple-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {wf.trigger_type}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`text-[10px] px-2 py-1 rounded-full ${
                      wf.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {wf.is_active ? 'Attivo' : 'Inattivo'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="text-xs text-gray-600">{wf.execution_count || 0}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={`text-xs font-semibold ${
                      (wf.success_rate || 100) >= 90 ? 'text-emerald-600' :
                      (wf.success_rate || 100) >= 70 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {wf.success_rate || 100}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {workflows.length === 0 && (
          <div className="py-12 text-center">
            <Zap className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Nessun workflow configurato</p>
            <button
              onClick={() => navigate('/workflows/builder')}
              className="mt-4 flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg"
              style={{ background: 'linear-gradient(135deg, #1147FF 0%, #0B2341 100%)' }}
            >
              <Plus className="w-4 h-4" /> Crea il Primo Workflow
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
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