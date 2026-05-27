import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Users, AlertTriangle, CheckCircle, XCircle, 
  Wrench, Loader2, Building2, Mail, UserCog, Trash2,
  RefreshCw, Ban, FileText, Search
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const SEVERITY_COLORS = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  warning: 'bg-blue-100 text-blue-700 border-blue-200',
};

const SEVERITY_ICONS = {
  critical: XCircle,
  high: AlertTriangle,
  medium: AlertTriangle,
  warning: FileText,
};

export default function TenantMembershipRepair() {
  const navigate = useNavigate();
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [repairing, setRepairing] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    runAudit();
  }, []);

  const runAudit = async () => {
    setLoading(true);
    try {
      const result = await base44.functions.invoke('auditTenantMemberships', {});
      setAudit(result.data);
    } catch (error) {
      console.error('Audit failed:', error);
      toast.error('Errore durante l\'audit');
    } finally {
      setLoading(false);
    }
  };

  const executeRepair = async (action, params) => {
    setRepairing(`${action}-${params.user_id || params.tenant_id || params.membership_id}`);
    try {
      const result = await base44.functions.invoke('repairTenantMembership', {
        action,
        ...params,
      });
      toast.success(result.data.action || 'Riparazione completata');
      await runAudit();
    } catch (error) {
      console.error('Repair failed:', error);
      toast.error(error.message || 'Errore durante la riparazione');
    } finally {
      setRepairing(null);
    }
  };

  const filteredIssues = audit?.issues.filter(issue => {
    const matchFilter = filter === 'all' || issue.severity === filter;
    const matchSearch = !searchTerm || 
      issue.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchFilter && matchSearch;
  }) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!audit) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenant Membership Repair Center</h1>
          <p className="text-sm text-gray-500">Diagnostica e riparazione problemi di appartenenza tenant</p>
        </div>
        <button
          onClick={runAudit}
          className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg hover:opacity-90"
          style={{ backgroundColor: '#1147FF' }}
        >
          <RefreshCw className="w-4 h-4" />
          Re-run Audit
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          label="Utenti Totali" 
          value={audit.stats.total_users} 
          icon={Users} 
          color="#1147FF" 
        />
        <StatCard 
          label="Tenant Totali" 
          value={audit.stats.total_companies} 
          icon={Building2} 
          color="#10B981" 
        />
        <StatCard 
          label="Membership Totali" 
          value={audit.stats.total_memberships} 
          icon={Shield} 
          color="#F59E0B" 
        />
        <StatCard 
          label="Problemi Trovati" 
          value={audit.issues.length} 
          icon={AlertTriangle} 
          color="#EF4444" 
        />
      </div>

      {/* Issue Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          label="Senza Membership" 
          value={audit.stats.users_without_membership} 
          icon={UserCog} 
          color="#EF4444" 
          subtext="Critico"
        />
        <StatCard 
          label="Membership Multiple" 
          value={audit.stats.users_with_multiple_memberships} 
          icon={Users} 
          color="#F59E0B" 
          subtext="Attenzione"
        />
        <StatCard 
          label="Membership Orfane" 
          value={audit.stats.orphan_memberships} 
          icon={Trash2} 
          color="#6B7280" 
          subtext="Da eliminare"
        />
        <StatCard 
          label="Ruoli Mancanti" 
          value={audit.stats.missing_tenant_role} 
          icon={Ban} 
          color="#3B82F6" 
          subtext="Da assegnare"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            placeholder="Cerca per email o tenant..." 
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" 
          />
        </div>
        <select 
          value={filter} 
          onChange={e => setFilter(e.target.value)} 
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
        >
          <option value="all">Tutti i livelli</option>
          <option value="critical">Critici ({audit.issues.filter(i => i.severity === 'critical').length})</option>
          <option value="high">Alti ({audit.issues.filter(i => i.severity === 'high').length})</option>
          <option value="medium">Medi ({audit.issues.filter(i => i.severity === 'medium').length})</option>
          <option value="warning">Bassi ({audit.issues.filter(i => i.severity === 'warning').length})</option>
        </select>
      </div>

      {/* Issues List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Problemi Trovati ({filteredIssues.length})</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {filteredIssues.map((issue, idx) => {
            const Icon = SEVERITY_ICONS[issue.severity];
            return (
              <div key={idx} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-4 h-4 ${issue.severity === 'critical' ? 'text-red-600' : issue.severity === 'high' ? 'text-orange-600' : 'text-yellow-600'}`} />
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${SEVERITY_COLORS[issue.severity]}`}>
                        {issue.severity}
                      </span>
                      <span className="text-xs text-gray-500">{issue.type}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">{issue.description}</p>
                    <div className="text-xs text-gray-500 space-y-1">
                      {issue.user_email && <div>Email: {issue.user_email}</div>}
                      {issue.company_name && <div>Tenant: {issue.company_name}</div>}
                      {issue.company_id && !issue.company_name && <div>Tenant ID: {issue.company_id}</div>}
                      {issue.membership_id && <div>Membership ID: {issue.membership_id}</div>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {issue.fix === 'create_membership' && (
                      <button
                        onClick={() => executeRepair('create_membership', { 
                          user_id: issue.user_id, 
                          tenant_id: issue.company_id,
                          tenant_role: 'project_manager',
                        })}
                        disabled={repairing === `create_membership-${issue.user_id}`}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-40"
                      >
                        <Wrench className="w-3 h-3" />
                        {repairing === `create_membership-${issue.user_id}` ? 'Creazione...' : 'Crea Membership'}
                      </button>
                    )}
                    {issue.fix === 'delete_membership' && (
                      <button
                        onClick={() => executeRepair('delete_membership', { membership_id: issue.membership_id })}
                        disabled={repairing === `delete_membership-${issue.membership_id}`}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-40"
                      >
                        <Trash2 className="w-3 h-3" />
                        {repairing === `delete_membership-${issue.membership_id}` ? 'Eliminazione...' : 'Elimina'}
                      </button>
                    )}
                    {issue.fix === 'assign_tenant_role' && (
                      <select
                        onChange={e => executeRepair('assign_tenant_role', { 
                          membership_id: issue.membership_id,
                          tenant_role: e.target.value,
                        })}
                        disabled={repairing === `assign_tenant_role-${issue.membership_id}`}
                        className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white disabled:opacity-40"
                      >
                        <option value="">Assegna ruolo...</option>
                        <option value="tenant_admin">Tenant Admin</option>
                        <option value="project_manager">Project Manager</option>
                        <option value="technician">Technician</option>
                        <option value="sales">Sales</option>
                      </select>
                    )}
                    {issue.fix === 'set_primary_membership' && (
                      <button
                        onClick={() => executeRepair('set_primary_membership', { 
                          user_id: issue.user_id,
                          membership_id: issue.memberships[0]?.membership_id,
                        })}
                        disabled={repairing === `set_primary_membership-${issue.user_id}`}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40"
                      >
                        <CheckCircle className="w-3 h-3" />
                        {repairing === `set_primary_membership-${issue.user_id}` ? 'Impostazione...' : 'Imposta Primaria'}
                      </button>
                    )}
                    {issue.fix === 'create_missing_membership' && (
                      <button
                        onClick={() => executeRepair('create_membership', { 
                          user_id: issue.user_id, 
                          tenant_id: issue.company_id,
                          tenant_role: 'project_manager',
                        })}
                        disabled={repairing === `create_membership-${issue.user_id}`}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-40"
                      >
                        <Wrench className="w-3 h-3" />
                        {repairing === `create_membership-${issue.user_id}` ? 'Creazione...' : 'Crea Missing'}
                      </button>
                    )}
                    {issue.fix === 'assign_tenant_admin' && (
                      <button
                        onClick={() => executeRepair('repair_tenant_admin', { tenant_id: issue.company_id })}
                        disabled={repairing === `repair_tenant_admin-${issue.company_id}`}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-40"
                      >
                        <UserCog className="w-3 h-3" />
                        {repairing === `repair_tenant_admin-${issue.company_id}` ? 'Assegnazione...' : 'Assegna Admin'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {filteredIssues.length === 0 && (
            <div className="py-16 text-center text-gray-400 text-sm">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
              Nessun problema trovato. Ottimo lavoro!
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Azioni Rapide</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => executeRepair('migrate_legacy_user', { user_id: 'all' })}
            className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 text-left"
          >
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">Migra Tutti i Legacy</span>
            </div>
            <p className="text-xs text-gray-500">Crea membership per tutti gli utenti con company_id ma senza membership</p>
          </button>
          <button
            onClick={async () => {
              if (confirm('Sei sicuro di voler eliminare tutte le membership orfane?')) {
                const orphans = audit.issues.filter(i => i.fix === 'delete_membership');
                for (const orphan of orphans) {
                  await executeRepair('delete_membership', { membership_id: orphan.membership_id });
                }
              }
            }}
            className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 text-left"
          >
            <div className="flex items-center gap-2 mb-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              <span className="font-medium text-gray-900">Elimina Tutte le Orfane</span>
            </div>
            <p className="text-xs text-gray-500">Elimina {audit.issues.filter(i => i.fix === 'delete_membership').length} membership orfane</p>
          </button>
          <button
            onClick={async () => {
              if (confirm('Creare membership per tutti gli utenti senza?')) {
                const missing = audit.issues.filter(i => i.fix === 'create_membership' || i.fix === 'create_missing_membership');
                for (const issue of missing) {
                  await executeRepair('create_membership', { 
                    user_id: issue.user_id, 
                    tenant_id: issue.company_id,
                    tenant_role: 'project_manager',
                  });
                }
              }
            }}
            className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 text-left"
          >
            <div className="flex items-center gap-2 mb-2">
              <UserCog className="w-5 h-5 text-green-600" />
              <span className="font-medium text-gray-900">Crea Tutte le Membership</span>
            </div>
            <p className="text-xs text-gray-500">Crea {audit.stats.users_without_membership} membership mancanti</p>
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, subtext }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </div>
  );
}