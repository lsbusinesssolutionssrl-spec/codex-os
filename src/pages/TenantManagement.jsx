import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Building2, Users, Shield, Activity, CreditCard, Zap, 
  Eye, Edit, Wrench, Pause, Play, Ban, CheckCircle,
  AlertTriangle, ArrowLeft, Search, Filter
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function TenantManagement() {
  const navigate = useNavigate();
  const { tenantId } = useParams();
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    if (tenantId && tenants.length > 0) {
      const tenant = tenants.find(t => t.id === tenantId);
      if (tenant) setSelectedTenant(tenant);
    }
  }, [tenantId, tenants]);

  const loadTenants = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      if (!['admin', 'developer'].includes(user?.role)) {
        toast.error('Accesso riservato ai Super Admin');
        navigate('/');
        return;
      }

      const [companies, subscriptions, plans, users, memberships, featureFlags] = await Promise.all([
        base44.entities.Company.list(),
        base44.entities.CompanySubscription.list(),
        base44.entities.SubscriptionPlan.list(),
        base44.entities.User.list(),
        base44.entities.TenantMembership.list(),
        base44.entities.TenantFeatureFlag.list(),
      ]);

      const enriched = companies.map(c => {
        const sub = subscriptions.find(s => s.company_id === c.id);
        const plan = sub ? plans.find(p => p.id === sub.plan_id) : null;
        const companyUsers = users.filter(u => u.company_id === c.id);
        const companyMemberships = memberships.filter(m => m.tenant_id === c.id);
        const companyFeatures = featureFlags.filter(f => f.company_id === c.id);
        
        return {
          ...c,
          subscription: sub,
          plan,
          userCount: companyUsers.length,
          tenantAdmin: companyUsers.find(u => u.role === 'company_admin')?.email || '—',
          memberships: companyMemberships,
          features: companyFeatures,
          enabledModules: companyFeatures.filter(f => f.enabled).length,
        };
      });

      setTenants(enriched);
    } catch (error) {
      console.error('Error loading tenants:', error);
      toast.error('Errore nel caricamento tenant');
    } finally {
      setLoading(false);
    }
  };

  const filteredTenants = tenants.filter(t => {
    const matchSearch = !searchTerm || 
      t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !statusFilter || t.subscription?.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleRepair = async (tenant) => {
    try {
      const result = await base44.functions.invoke('provisionTenant', {
        action: 'repair_existing_tenant',
        tenant_id: tenant.id,
        admin_email: tenant.email,
      });
      
      if (result.success) {
        toast.success('Tenant riparato con successo!');
        loadTenants();
      }
    } catch (error) {
      toast.error('Errore repair: ' + error.message);
    }
  };

  const handleStatusChange = async (tenant, newStatus) => {
    try {
      await base44.functions.invoke('updateTenantStatus', {
        tenant_id: tenant.id,
        status: newStatus,
      });
      toast.success(`Tenant ${newStatus === 'active' ? 'riattivato' : 'sospeso'}`);
      loadTenants();
    } catch (error) {
      toast.error('Errore aggiornamento stato: ' + error.message);
    }
  };

  const statusConfig = {
    active: 'text-green-600 bg-green-50',
    trial: 'text-blue-600 bg-blue-50',
    past_due: 'text-orange-600 bg-orange-50',
    suspended: 'text-gray-600 bg-gray-100',
    cancelled: 'text-red-600 bg-red-50',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/platform-settings')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestione Tenant</h1>
            <p className="text-sm text-gray-500">Panoramica e gestione di tutti i tenant</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/tenant-onboarding')}
          className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium"
          style={{ backgroundColor: '#1147FF' }}
        >
          <Building2 className="w-4 h-4" />
          Nuovo Tenant
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Tenant Totali" value={tenants.length} icon={Building2} color="#1147FF" />
        <StatCard label="Attivi" value={tenants.filter(t => t.subscription?.status === 'active').length} icon={CheckCircle} color="#10B981" />
        <StatCard label="Trial" value={tenants.filter(t => t.subscription?.status === 'trial').length} icon={Activity} color="#F59E0B" />
        <StatCard label="A Rischio" value={tenants.filter(t => t.subscription?.status === 'past_due').length} icon={AlertTriangle} color="#EF4444" />
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            placeholder="Cerca tenant..." 
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg" 
          />
        </div>
        <select 
          value={statusFilter} 
          onChange={e => setStatusFilter(e.target.value)} 
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
        >
          <option value="">Tutti gli stati</option>
          <option value="active">Attivo</option>
          <option value="trial">Trial</option>
          <option value="past_due">In Ritardo</option>
          <option value="suspended">Sospeso</option>
          <option value="cancelled">Cancellato</option>
        </select>
      </div>

      {/* Tenant Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Tutti i Tenant</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Company</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Admin</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Piano</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Stato</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Utenti</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Moduli</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Creato</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredTenants.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {t.logo_url ? (
                        <img src={t.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: t.brand_color_primary || '#1147FF' }}>
                          {t.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{t.name}</p>
                        <p className="text-xs text-gray-400">{t.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-center py-3 px-4 text-gray-600">{t.tenantAdmin}</td>
                  <td className="text-center py-3 px-4">
                    <span className="text-xs text-gray-600">{t.plan?.name || '—'}</span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${statusConfig[t.subscription?.status] || 'bg-gray-100 text-gray-600'}`}>
                      {t.subscription?.status || '—'}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4 text-gray-600">{t.userCount}</td>
                  <td className="text-center py-3 px-4">
                    <span className="text-xs text-gray-600">{t.enabledModules} attivi</span>
                  </td>
                  <td className="text-center py-3 px-4 text-gray-600">
                    {t.created_date ? new Date(t.created_date).toLocaleDateString('it-IT') : '—'}
                  </td>
                  <td className="text-center py-3 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => navigate(`/platform/tenants/${t.id}`)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                        title="Dettagli"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRepair(t)}
                        className="p-1.5 text-gray-400 hover:text-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
                        title="Ripara Provisioning"
                      >
                        <Wrench className="w-4 h-4" />
                      </button>
                      {t.subscription?.status === 'active' ? (
                        <button
                          onClick={() => handleStatusChange(t, 'suspended')}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Sospendi"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(t, 'active')}
                          className="p-1.5 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                          title="Riattiva"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTenants.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400 text-sm">Nessun tenant trovato</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
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