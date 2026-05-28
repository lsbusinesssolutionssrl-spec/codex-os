import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Users, Shield, Activity, CreditCard, Zap, 
  AlertTriangle, CheckCircle, Clock, TrendingUp, Search,
  Play, Eye, Pause, Ban, Crown, Loader2
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [platformData, setPlatformData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const user = await (await import('@/api/base44Client')).base44.auth.me();
      if (user?.role !== 'admin') { 
        toast.error('Accesso riservato ai Super Admin');
        navigate('/'); 
        return; 
      }
      setAuthChecked(true);
    } catch (error) {
      toast.error('Errore autenticazione');
      navigate('/');
    }
  };

  useEffect(() => {
    if (!authChecked) return;
    loadPlatformData();
  }, [authChecked]);

  const loadPlatformData = async () => {
    setLoading(true);
    try {
      // Use new getPlatformMetrics with filters (excludes demo/archived/internal by default)
      const result = await base44.functions.invoke('getPlatformMetrics', {
        includeDemo: false,
        includeInternal: false,
        includeArchived: false,
      });
      setPlatformData(result.data);
    } catch (error) {
      console.error('Error loading platform data:', error);
      toast.error('Errore nel caricamento dati platform: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredTenants = platformData?.tenants.filter(t => {
    const matchSearch = !searchTerm || 
      t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !statusFilter || t.subscription?.status === statusFilter;
    return matchSearch && matchStatus;
  }) || [];

  const healthScore = (t) => {
    let score = 0;
    if (t.subscription?.status === 'active') score += 40;
    if (t.subscription?.status === 'trial') score += 20;
    if (t.userCount > 2) score += 15;
    if (t.subscription?.mrr > 0) score += 25;
    if (t.subscription?.seats_used > 1) score += 20;
    
    if (score >= 80) return { label: 'Healthy', color: 'text-green-600 bg-green-50' };
    if (score >= 60) return { label: 'Needs Attention', color: 'text-yellow-600 bg-yellow-50' };
    if (score >= 40) return { label: 'At Risk', color: 'text-orange-600 bg-orange-50' };
    return { label: 'Inactive', color: 'text-gray-600 bg-gray-100' };
  };

  const statusConfig = {
    active: 'text-green-600 bg-green-50',
    trial: 'text-blue-600 bg-blue-50',
    trial_expired: 'text-orange-600 bg-orange-50',
    past_due: 'text-red-600 bg-red-50',
    suspended: 'text-gray-600 bg-gray-100',
    cancelled: 'text-red-600 bg-red-50',
  };

  if (!authChecked || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Caricamento dati platform...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1147FF' }}>
              <Shield className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Pannello di Controllo Super Admin</h1>
          </div>
          <p className="text-sm text-gray-500">Gestione e supervisione tenant platform-wide</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/tenant-onboarding')}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium"
            style={{ backgroundColor: '#1147FF' }}
          >
            <Building2 className="w-4 h-4" />
            Nuovo Tenant
          </button>
          <button
            onClick={() => navigate('/saas-plans-admin')}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <CreditCard className="w-4 h-4" />
            Piani SaaS
          </button>
        </div>
      </div>

      {/* Platform KPIs */}
      {platformData?.metrics && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label="Tenant Totali" value={platformData.metrics.totalTenants} icon={Building2} color="#1147FF" />
            <KpiCard label="Attivi" value={platformData.metrics.activeTenants} icon={CheckCircle} color="#10B981" />
            <KpiCard label="MRR" value={`€${(platformData.metrics.mrr || 0).toLocaleString('it-IT')}`} icon={TrendingUp} color="#F59E0B" />
            <KpiCard label="A Rischio" value={platformData.metrics.atRisk} icon={AlertTriangle} color="#EF4444" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label="Trial" value={platformData.metrics.trial} icon={Clock} color="#3B82F6" />
            <KpiCard label="Utenti Totali" value={platformData.metrics.totalUsers} icon={Users} color="#0B2341" />
            <KpiCard label="Sospesi" value={platformData.metrics.suspended} icon={Ban} color="#6B7280" />
            <KpiCard label="Enterprise" value={platformData.metrics.enterprise} icon={Crown} color="#8B5CF6" />
          </div>
        </>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            placeholder="Cerca tenant per nome o email..." 
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100" 
          />
        </div>
        <select 
          value={statusFilter} 
          onChange={e => setStatusFilter(e.target.value)} 
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none"
        >
          <option value="">Tutti gli stati</option>
          <option value="active">Attivo</option>
          <option value="trial">Trial</option>
          <option value="trial_expired">Trial Scaduto</option>
          <option value="past_due">In Ritardo</option>
          <option value="suspended">Sospeso</option>
          <option value="cancelled">Cancellato</option>
        </select>
        <button
          onClick={() => navigate('/platform/tenant-cleanup')}
          className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium"
          style={{ backgroundColor: '#1147FF' }}
        >
          <Activity className="w-4 h-4" />
          Tenant Cleanup
        </button>
      </div>

      {/* Tenant Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Tutti i Tenant</h2>
          <span className="text-xs text-gray-400">{filteredTenants.length} totali</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Company</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Salute</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Piano</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Stato</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Utenti</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">MRR</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Tipo</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredTenants.map(t => {
                const health = healthScore(t);
                return (
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
                    <td className="text-center py-3 px-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${health.color}`}>
                        {health.label}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="text-xs text-gray-600">{t.plan?.name || '—'}</span>
                    </td>
                    <td className="text-center py-3 px-4">
                      {t.subscription ? (
                        <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${statusConfig[t.subscription.status] || 'bg-gray-100 text-gray-600'}`}>
                          {t.subscription.status?.replace('_', ' ')}
                        </span>
                      ) : <span className="text-xs text-gray-400">No subscription</span>}
                    </td>
                    <td className="text-center py-3 px-4 text-gray-600">{t.userCount}</td>
                    <td className="text-center py-3 px-4 font-medium text-gray-900">
                      {t.subscription?.mrr ? `€${t.subscription.mrr}` : '—'}
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        t.tenant_type === 'production_customer' ? 'bg-green-100 text-green-700' :
                        t.tenant_type === 'demo' ? 'bg-amber-100 text-amber-700' :
                        t.tenant_type === 'internal' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {t.tenant_type || 'production'}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => navigate(`/platform/tenants/${t.id}`)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Dettagli Tenant"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {t.archived ? (
                          <span className="text-xs text-gray-400 px-2">Archiviato</span>
                        ) : (
                          <button
                            onClick={() => navigate(`/platform/tenant-cleanup`)}
                            className="p-1.5 text-gray-400 hover:text-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
                            title="Classifica/Archivia"
                          >
                            <Activity className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredTenants.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400 text-sm">Nessun tenant trovato</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/tenant-onboarding')}
          className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all text-left"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1147FF' }}>
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900">Crea Nuovo Tenant</h3>
          </div>
          <p className="text-sm text-gray-500">Configura una nuova company con wizard di onboarding</p>
        </button>

        <button
          onClick={() => navigate('/saas-plans-admin')}
          className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all text-left"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F59E0B' }}>
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900">Gestione Piani SaaS</h3>
          </div>
          <p className="text-sm text-gray-500">Crea, modifica e assegna piani ai tenant</p>
        </button>

        <button
          onClick={() => navigate('/product-analytics')}
          className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all text-left"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#8B5CF6' }}>
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900">Analytics Platform</h3>
          </div>
          <p className="text-sm text-gray-500">Visualizza metriche utilizzo e salute tenant</p>
        </button>
      </div>

      {/* Debug Info */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Platform Mode Debug</h3>
        <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
          <div>Context Type: <strong>platform</strong></div>
          <div>Query Mode: <strong>service role (no tenant filters)</strong></div>
          <div>Tenants Loaded: <strong>{platformData?.tenants.length || 0}</strong></div>
          <div>Total Users: <strong>{platformData?.metrics.totalUsers || 0}</strong></div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, color }) {
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