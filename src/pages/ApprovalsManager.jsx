import { useState, useEffect } from 'react';
import { Shield, Check, X, Clock, AlertTriangle, FileText, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ApprovalsManager() {
  const [loading, setLoading] = useState(true);
  const [approvals, setApprovals] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.WorkflowApproval.list();
      setApprovals(list);
    } catch (error) {
      toast.error('Impossibile caricare le approvazioni');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approvalId) => {
    try {
      await base44.entities.WorkflowApproval.update(approvalId, {
        status: 'Approved',
        approved_by: (await base44.auth.me()).email,
        approved_at: new Date().toISOString(),
      });

      // Resume workflow execution
      const approval = approvals.find(a => a.id === approvalId);
      if (approval) {
        await base44.functions.invoke('executeWorkflow', {
          workflow_id: approval.workflow_id,
          trigger_data: { approval_id: approvalId, approved: true },
        });
      }

      toast.success('Approvazione concessa');
      loadApprovals();
    } catch (error) {
      toast.error(`Errore: ${error.message}`);
    }
  };

  const handleReject = async (approvalId, reason) => {
    if (!reason) {
      reason = prompt('Motivo del rifiuto:');
      if (!reason) return;
    }

    try {
      await base44.entities.WorkflowApproval.update(approvalId, {
        status: 'Rejected',
        rejected_by: (await base44.auth.me()).email,
        rejected_at: new Date().toISOString(),
        rejection_reason: reason,
      });

      toast.success('Approvazione rifiutata');
      loadApprovals();
    } catch (error) {
      toast.error(`Errore: ${error.message}`);
    }
  };

  const filteredApprovals = approvals.filter(a => {
    if (filter === 'pending') return a.status === 'Pending';
    if (filter === 'approved') return a.status === 'Approved';
    if (filter === 'rejected') return a.status === 'Rejected';
    return true;
  });

  const stats = {
    pending: approvals.filter(a => a.status === 'Pending').length,
    approved: approvals.filter(a => a.status === 'Approved').length,
    rejected: approvals.filter(a => a.status === 'Rejected').length,
    total: approvals.length,
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
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-500" />
            Approvazioni Workflow
          </h1>
          <p className="text-sm text-gray-500 mt-1">Gestione approvazioni e autorizzazioni</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Totali" value={stats.total} color="#3B82F6" />
        <StatCard label="In Attesa" value={stats.pending} color="#F59E0B" />
        <StatCard label="Approvate" value={stats.approved} color="#10B981" />
        <StatCard label="Rifiutate" value={stats.rejected} color="#EF4444" />
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm rounded-lg transition-all ${
              filter === f
                ? 'bg-blue-500 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f === 'all' ? 'Tutte' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Approvals List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Lista Approvazioni</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {filteredApprovals.map(approval => (
            <div key={approval.id} className="p-5 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className={`w-4 h-4 ${
                      approval.status === 'Pending' ? 'text-amber-500' :
                      approval.status === 'Approved' ? 'text-emerald-500' : 'text-red-500'
                    }`} />
                    <h3 className="text-sm font-semibold text-gray-900">{approval.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{approval.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {approval.approval_type}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Ruolo: {approval.required_role}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Richiesto: {new Date(approval.requested_at).toLocaleString('it-IT')}
                    </span>
                    {approval.expires_at && (
                      <>
                        <span>·</span>
                        <span className={new Date(approval.expires_at) < new Date() ? 'text-red-600' : 'text-gray-500'}>
                          Scade: {new Date(approval.expires_at).toLocaleString('it-IT')}
                        </span>
                      </>
                    )}
                  </div>

                  {approval.status === 'Rejected' && approval.rejection_reason && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs text-red-700">
                        <strong>Motivo:</strong> {approval.rejection_reason}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={approval.status} />
                  
                  {approval.status === 'Pending' && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleApprove(approval.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs text-white bg-emerald-500 rounded-lg hover:bg-emerald-600"
                      >
                        <Check className="w-3.5 h-3.5" /> Approva
                      </button>
                      <button
                        onClick={() => handleReject(approval.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs text-white bg-red-500 rounded-lg hover:bg-red-600"
                      >
                        <X className="w-3.5 h-3.5" /> Rifiuta
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {filteredApprovals.length === 0 && (
          <div className="py-12 text-center text-gray-400">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Nessuna approvazione</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Pending: 'bg-amber-50 text-amber-700 border border-amber-200',
    Approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    Rejected: 'bg-red-50 text-red-700 border border-red-200',
    Escalated: 'bg-purple-50 text-purple-700 border border-purple-200',
    Expired: 'bg-gray-50 text-gray-700 border border-gray-200',
  };

  return (
    <span className={`text-xs px-3 py-1 rounded-full font-medium ${styles[status] || styles.Pending}`}>
      {status}
    </span>
  );
}