import { useState, useEffect } from 'react';
import { Building2, Search, Filter, Archive, Eye, EyeOff, AlertTriangle, CheckCircle, Users, DollarSign, Activity } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const TENANT_TYPES = [
  { value: 'production_customer', label: 'Production Customer', color: '#10B981' },
  { value: 'internal', label: 'Internal', color: '#7C3AED' },
  { value: 'demo', label: 'Demo', color: '#F59E0B' },
  { value: 'default_seed', label: 'Default Seed', color: '#6B7280' },
  { value: 'duplicate', label: 'Duplicate', color: '#EF4444' },
  { value: 'archived', label: 'Archived', color: '#9CA3AF' },
];

const VISIBILITY_OPTIONS = [
  { value: 'visible', label: 'Visible', color: '#10B981' },
  { value: 'hidden', label: 'Hidden', color: '#F59E0B' },
  { value: 'platform_only', label: 'Platform Only', color: '#7C3AED' },
];

export default function TenantCleanupCenter() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveReason, setArchiveReason] = useState('');

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      const companies = await base44.asServiceRole.entities.Company.list();
      const subscriptions = await base44.asServiceRole.entities.CompanySubscription.list();
      const memberships = await base44.asServiceRole.entities.TenantMembership.list();

      const tenantsData = companies.map(company => {
        const sub = subscriptions.find(s => s.company_id === company.id && s.status === 'active');
        const companyMemberships = memberships.filter(m => m.tenant_id === company.id && m.status === 'active');
        const customerMembers = companyMemberships.filter(m => m.membership_type === 'customer_member');
        const internalSupport = companyMemberships.filter(m => m.membership_type === 'internal_support');

        return {
          ...company,
          subscription: sub,
          mrr: sub?.mrr || 0,
          customerCount: customerMembers.length,
          internalSupportCount: internalSupport.length,
          totalMembers: companyMemberships.length,
          hasData: company.demo_mode || false,
        };
      });

      setTenants(tenantsData);
    } catch (error) {
      console.error('Error loading tenants:', error);
      toast.error('Errore nel caricamento tenant');
    } finally {
      setLoading(false);
    }
  };

  const classifyTenant = async (tenantId, tenantType, visibility) => {
    try {
      await base44.asServiceRole.entities.Company.update(tenantId, {
        tenant_type: tenantType,
        visibility,
      });
      toast.success('Tenant classificato con successo');
      loadTenants();
    } catch (error) {
      toast.error('Errore nella classificazione');
    }
  };

  const archiveTenant = async () => {
    if (!selectedTenant || !archiveReason) {
      toast.error('Seleziona un tenant e inserisci un motivo');
      return;
    }

    try {
      const currentUser = await base44.auth.me();
      await base44.asServiceRole.entities.Company.update(selectedTenant.id, {
        archived: true,
        archived_reason: archiveReason,
        archived_at: new Date().toISOString(),
        archived_by: currentUser.email,
        visibility: 'hidden',
      });
      toast.success('Tenant archiviato con successo');
      setShowArchiveModal(false);
      setArchiveReason('');
      setSelectedTenant(null);
      loadTenants();
    } catch (error) {
      toast.error('Errore nell\'archiviazione');
    }
  };

  const filteredTenants = tenants.filter(tenant => {
    if (filter !== 'all' && tenant.tenant_type !== filter && !(filter === 'archived' && tenant.archived)) {
      if (filter === 'archived') return false;
      if (tenant.tenant_type !== filter) return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return tenant.name.toLowerCase().includes(query) || 
             tenant.email.toLowerCase().includes(query) ||
             tenant.slug.toLowerCase().includes(query);
    }
    return true;
  });

  const stats = {
    total: tenants.length,
    production: tenants.filter(t => t.tenant_type === 'production_customer' && !t.archived).length,
    demo: tenants.filter(t => t.tenant_type === 'demo' || t.demo_mode).length,
    archived: tenants.filter(t => t.archived).length,
    totalMRR: tenants.filter(t => !t.archived && t.tenant_type === 'production_customer').reduce((sum, t) => sum + (t.mrr || 0), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenant Cleanup Center</h1>
          <p className="text-sm text-gray-500 mt-0.5">Classifica, archivia e gestisci i tenant</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard label="Totale Tenant" value={stats.total} icon={Building2} color="#1147FF" />
        <StatCard label="Production" value={stats.production} icon={CheckCircle} color="#10B981" />
        <StatCard label="Demo" value={stats.demo} icon={Activity} color="#F59E0B" />
        <StatCard label="Archived" value={stats.archived} icon={Archive} color="#9CA3AF" />
        <StatCard label="MRR Totale" value={`€${stats.totalMRR}`} icon={DollarSign} color="#10B981" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca tenant per nome, email, slug..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none"
        >
          <option value="all">Tutti i tenant</option>
          <option value="production_customer">Production Customer</option>
          <option value="internal">Internal</option>
          <option value="demo">Demo</option>
          <option value="default_seed">Default Seed</option>
          <option value="duplicate">Duplicate</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Tenant List */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Tenant ({filteredTenants.length})</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {filteredTenants.map(tenant => (
            <div key={tenant.id} className={`p-4 ${tenant.archived ? 'bg-gray-50 opacity-75' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {tenant.logo_url ? (
                    <img src={tenant.logo_url} alt="" className="w-12 h-12 object-contain" />
                  ) : (
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: tenant.brand_color_primary || '#1147FF' }}
                    >
                      {tenant.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{tenant.name}</h3>
                      {tenant.archived && (
                        <span className="px-2 py-0.5 text-xs font-medium text-gray-700 bg-gray-200 rounded-full">
                          Archiviato
                        </span>
                      )}
                      {tenant.demo_mode && (
                        <span className="px-2 py-0.5 text-xs font-medium text-amber-700 bg-amber-100 rounded-full">
                          Demo Mode
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{tenant.email}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {tenant.customerCount} customer + {tenant.internalSupportCount} support
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        MRR: €{tenant.mrr || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        {tenant.subscription?.plan_id ? 'Active' : 'No Plan'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={tenant.tenant_type || 'production_customer'}
                    onChange={(e) => classifyTenant(tenant.id, e.target.value, tenant.visibility || 'visible')}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none"
                  >
                    {TENANT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  <select
                    value={tenant.visibility || 'visible'}
                    onChange={(e) => classifyTenant(tenant.id, tenant.tenant_type || 'production_customer', e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none"
                  >
                    {VISIBILITY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {!tenant.archived && (
                    <button
                      onClick={() => {
                        setSelectedTenant(tenant);
                        setShowArchiveModal(true);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Archivia tenant"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              {tenant.archived && tenant.archived_reason && (
                <div className="mt-2 text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded">
                  <strong>Motivo:</strong> {tenant.archived_reason}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Archive Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-semibold text-gray-900">Archivia Tenant</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Stai per archiviare <strong>{selectedTenant?.name}</strong>. Questa azione:
            </p>
            <ul className="text-sm text-gray-600 mb-4 space-y-1 list-disc list-inside">
              <li>Nasconderà il tenant dalle metriche production</li>
              <li>Manterrà tutti i dati (nessuna eliminazione)</li>
              <li>Impedirà nuovi accessi utente</li>
            </ul>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo archiviazione</label>
              <textarea
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none h-24"
                placeholder="Es: Tenant duplicato, test, abandoned..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowArchiveModal(false);
                  setArchiveReason('');
                  setSelectedTenant(null);
                }}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Annulla
              </button>
              <button
                onClick={archiveTenant}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Archivia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
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