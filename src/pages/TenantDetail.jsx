import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Building2, Users, Shield, CreditCard, Zap,
  Palette, FileText, Activity, CheckCircle, AlertTriangle,
  Edit, Wrench, Ban, Play, Pause
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function TenantDetail() {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState(null);

  useEffect(() => {
    loadTenant();
  }, [tenantId]);

  const loadTenant = async () => {
    setLoading(true);
    try {
      const tenantData = await base44.entities.Company.get(tenantId);
      setTenant(tenantData);

      // Load related data
      const [subscription, plan, users, memberships, featureFlags, logs, brandThemes] = await Promise.all([
        base44.entities.CompanySubscription.filter({ company_id: tenantId }).then(s => s[0]),
        base44.entities.SubscriptionPlan.list(),
        base44.entities.User.filter({ company_id: tenantId }),
        base44.entities.TenantMembership.filter({ tenant_id: tenantId }),
        base44.entities.TenantFeatureFlag.filter({ company_id: tenantId }),
        base44.entities.TenantActivationLog.filter({ company_id: tenantId }),
        base44.entities.BrandTheme.filter({ company_id: tenantId }),
      ]);

      const activePlan = subscription ? plan.find(p => p.id === subscription.plan_id) : null;
      const activeMembership = memberships.find(m => m.is_primary) || memberships[0];

      setDetails({
        subscription,
        plan: activePlan,
        users,
        memberships,
        featureFlags,
        logs,
        brandThemes,
        activeMembership,
        enabledModules: featureFlags.filter(f => f.enabled).length,
      });
    } catch (error) {
      console.error('Error loading tenant details:', error);
      toast.error('Errore nel caricamento dettagli tenant');
    } finally {
      setLoading(false);
    }
  };

  const handleRepair = async () => {
    try {
      const result = await base44.functions.invoke('provisionTenant', {
        action: 'repair_existing_tenant',
        tenant_id: tenantId,
        admin_email: tenant?.email,
      });
      
      if (result.success) {
        toast.success('Tenant riparato con successo!');
        loadTenant();
      }
    } catch (error) {
      toast.error('Errore repair: ' + error.message);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await base44.functions.invoke('updateTenantStatus', {
        tenant_id: tenantId,
        status: newStatus,
      });
      toast.success(`Stato aggiornato a: ${newStatus}`);
      loadTenant();
    } catch (error) {
      toast.error('Errore aggiornamento stato: ' + error.message);
    }
  };

  if (loading || !tenant) {
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
            onClick={() => navigate('/platform/tenants')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{tenant.name}</h1>
            <p className="text-sm text-gray-500">{tenant.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRepair}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium"
            style={{ backgroundColor: '#F59E0B' }}
          >
            <Wrench className="w-4 h-4" />
            Ripara Provisioning
          </button>
          {details?.subscription?.status === 'active' ? (
            <button
              onClick={() => handleStatusChange('suspended')}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium"
              style={{ backgroundColor: '#EF4444' }}
            >
              <Pause className="w-4 h-4" />
              Sospendi
            </button>
          ) : (
            <button
              onClick={() => handleStatusChange('active')}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium"
              style={{ backgroundColor: '#10B981' }}
            >
              <Play className="w-4 h-4" />
              Riattiva
            </button>
          )}
        </div>
      </div>

      {/* Company Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Informazioni Company
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Nome:</span>
            <p className="font-medium">{tenant.name}</p>
          </div>
          <div>
            <span className="text-gray-500">Slug:</span>
            <p className="font-medium">{tenant.slug}</p>
          </div>
          <div>
            <span className="text-gray-500">Email:</span>
            <p className="font-medium">{tenant.email}</p>
          </div>
          <div>
            <span className="text-gray-500">Stato:</span>
            <p className="font-medium capitalize">{tenant.status}</p>
          </div>
          <div>
            <span className="text-gray-500">Creato:</span>
            <p className="font-medium">{tenant.created_date ? new Date(tenant.created_date).toLocaleDateString('it-IT') : '—'}</p>
          </div>
          <div>
            <span className="text-gray-500">Colori Brand:</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-6 h-6 rounded border" style={{ backgroundColor: tenant.brand_color_primary }} />
              <div className="w-6 h-6 rounded border" style={{ backgroundColor: tenant.brand_color_secondary }} />
            </div>
          </div>
        </div>
      </div>

      {/* Subscription & Plan */}
      {details?.subscription && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Subscription & Billing
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Piano:</span>
              <p className="font-medium">{details.plan?.name || '—'}</p>
            </div>
            <div>
              <span className="text-gray-500">Stato:</span>
              <p className="font-medium capitalize">{details.subscription.status}</p>
            </div>
            <div>
              <span className="text-gray-500">MRR:</span>
              <p className="font-medium">€{details.subscription.mrr?.toLocaleString('it-IT') || '0'}</p>
            </div>
            <div>
              <span className="text-gray-500">Utenti:</span>
              <p className="font-medium">{details.subscription.seats_used || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Membership Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Tenant Membership
        </h2>
        {details?.activeMembership ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Membership Attiva</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Tenant Role:</span>
                <p className="font-medium">{details.activeMembership.tenant_role}</p>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <p className="font-medium capitalize">{details.activeMembership.status}</p>
              </div>
              <div>
                <span className="text-gray-500">Is Primary:</span>
                <p className="font-medium">{details.activeMembership.is_primary ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <span className="text-gray-500">Default Workspace:</span>
                <p className="font-medium capitalize">{details.activeMembership.default_workspace}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm font-medium">Nessuna membership attiva trovata</span>
          </div>
        )}
      </div>

      {/* Feature Flags */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Feature Flags & Moduli ({details?.enabledModules || 0} attivi)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {details?.featureFlags.map(flag => (
            <div key={flag.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-sm font-medium text-gray-700">{flag.feature_name}</span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                flag.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
              }`}>
                {flag.enabled ? 'Attivo' : 'Disabilitato'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Users */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Utenti ({details?.users?.length || 0})
        </h2>
        <div className="space-y-2">
          {details?.users.map(user => (
            <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <p className="font-medium text-gray-900">{user.full_name || user.email}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700 capitalize">
                {user.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Brand Themes */}
      {details?.brandThemes?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Brand Themes
          </h2>
          <div className="space-y-3">
            {details.brandThemes.map(theme => (
              <div key={theme.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{theme.theme_name}</h3>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    theme.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {theme.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded border-2" style={{ backgroundColor: theme.colors?.primary }} title="Primary" />
                  <div className="w-8 h-8 rounded border-2" style={{ backgroundColor: theme.colors?.secondary }} title="Secondary" />
                  <div className="w-8 h-8 rounded border-2" style={{ backgroundColor: theme.colors?.accent }} title="Accent" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Logs */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Audit Logs (Ultimi 10)
        </h2>
        <div className="space-y-2">
          {details?.logs?.slice(0, 10).map(log => (
            <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <Activity className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{log.event_type}</p>
                <p className="text-xs text-gray-500 mt-0.5">{log.description}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {log.created_date ? new Date(log.created_date).toLocaleString('it-IT') : ''} · {log.performed_by}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}