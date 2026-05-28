import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useGlobalContext } from '@/lib/GlobalContextEngine';
import { Building2, Trash2, Archive, Merge, Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TenantCleanupCenter() {
  const { isPlatformMode, platformRole } = useGlobalContext();
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null);

  useEffect(() => {
    if (isPlatformMode && platformRole === 'admin') {
      loadAudit();
    }
  }, []);

  const loadAudit = async () => {
    try {
      const response = await base44.functions.invoke('auditTenantDuplicates', {});
      setAudit(response.data);
    } catch (error) {
      console.error('Failed to load audit:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveTenant = async (tenantId) => {
    if (!confirm('Archiviare questo tenant? Questa azione non può essere annullata.')) return;
    
    setActionInProgress(tenantId);
    try {
      await base44.functions.invoke('archiveTenant', { tenant_id: tenantId });
      await loadAudit();
    } catch (error) {
      alert('Errore: ' + error.message);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleMarkAsDemo = async (tenantId) => {
    if (!confirm('Segnare questo tenant come demo?')) return;
    
    setActionInProgress(tenantId);
    try {
      await base44.functions.invoke('markTenantAsDemo', { tenant_id: tenantId });
      await loadAudit();
    } catch (error) {
      alert('Errore: ' + error.message);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleAssignSubscription = async (tenantId) => {
    if (!confirm('Assegnare subscription Enterprise a questo tenant?')) return;
    
    setActionInProgress(tenantId);
    try {
      await base44.functions.invoke('assignTenantPlan', { 
        tenant_id: tenantId,
        plan_name: 'Enterprise'
      });
      await loadAudit();
    } catch (error) {
      alert('Errore: ' + error.message);
    } finally {
      setActionInProgress(null);
    }
  };

  if (!isPlatformMode || platformRole !== 'admin') {
    return (
      <div className="p-8 text-center text-gray-500">
        <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h2 className="text-lg font-semibold mb-2">Accesso Riservato</h2>
        <p>Solo gli amministratori platform possono accedere a questo strumento.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">🧹 Tenant Cleanup Center</h1>
        <p className="text-gray-600">Gestisci tenant duplicati, demo e orfani</p>
      </div>

      {/* Summary Stats */}
      {audit && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Tenants" value={audit.summary.total_tenants} />
          <StatCard label="Real Tenants" value={audit.summary.real_tenants} color="green" />
          <StatCard label="Demo Tenants" value={audit.summary.demo_tenants} color="orange" />
          <StatCard label="Possibili Duplicati" value={audit.summary.possible_duplicates} color="red" />
        </div>
      )}

      {/* Recommendations */}
      {audit?.recommendations?.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Raccomandazioni
          </h3>
          <ul className="space-y-1">
            {audit.recommendations.map((rec, i) => (
              <li key={i} className="text-sm text-amber-700">
                • {rec.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tenants List */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Tenant Audit ({audit?.tenants?.length || 0})</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {audit?.tenants?.map(tenant => (
            <div key={tenant.tenant_id} className="p-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{tenant.name}</h3>
                  <TenantTypeBadge type={tenant.tenant_type} />
                  {tenant.is_duplicate_target && (
                    <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">
                      Duplicato
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 space-x-3">
                  <span>ID: <code className="text-xs bg-gray-100 px-1">{tenant.tenant_id}</code></span>
                  <span>•</span>
                  <span>Admin: {tenant.admin_email}</span>
                  <span>•</span>
                  <span>Users: {tenant.users_count}</span>
                  <span>•</span>
                  <span>Plan: {tenant.plan}</span>
                </div>
                {tenant.notes && (
                  <p className="text-xs text-gray-500 mt-1">{tenant.notes}</p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {tenant.tenant_type === 'real' && !tenant.has_subscription && (
                  <Button
                    size="sm"
                    onClick={() => handleAssignSubscription(tenant.tenant_id)}
                    disabled={actionInProgress === tenant.tenant_id}
                    className="text-xs"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Assign Plan
                  </Button>
                )}
                
                {tenant.tenant_type !== 'demo' && tenant.users_count === 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMarkAsDemo(tenant.tenant_id)}
                    disabled={actionInProgress === tenant.tenant_id}
                    className="text-xs"
                  >
                    <Archive className="w-3 h-3 mr-1" />
                    Mark as Demo
                  </Button>
                )}
                
                {tenant.tenant_type === 'orphan' && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleArchiveTenant(tenant.tenant_id)}
                    disabled={actionInProgress === tenant.tenant_id}
                    className="text-xs"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Archive
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    orange: 'bg-orange-50 text-orange-700',
    red: 'bg-red-50 text-red-700',
  };
  
  return (
    <div className={`p-4 rounded-lg ${colors[color] || colors.blue}`}>
      <p className="text-xs font-medium mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function TenantTypeBadge({ type }) {
  const badges = {
    real: 'bg-green-100 text-green-700',
    demo: 'bg-orange-100 text-orange-700',
    default: 'bg-gray-100 text-gray-700',
    platform_owner_org: 'bg-blue-100 text-blue-700',
    orphan: 'bg-red-100 text-red-700',
  };
  
  const labels = {
    real: 'Real',
    demo: 'Demo',
    default: 'Default',
    platform_owner_org: 'Platform Owner',
    orphan: 'Orphan',
  };
  
  return (
    <span className={`text-xs px-2 py-0.5 rounded ${badges[type] || badges.real}`}>
      {labels[type] || type}
    </span>
  );
}