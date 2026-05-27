import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Shield, Users, Zap, Brain, CreditCard, Settings,
  Play, Square, Ban, CheckCircle, AlertTriangle, Clock,
  TrendingUp, Activity, FileText, Home, ArrowLeft, Loader2,
  Eye, LogOut, Crown, Wifi
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const FEATURES = [
  { id: 'ai_estimator', label: 'AI Estimator', icon: Brain, plan: 'professional' },
  { id: 'financial_control', label: 'Financial Control', icon: TrendingUp, plan: 'professional' },
  { id: 'guardian', label: 'Guardian (Predictive Maintenance)', icon: Shield, plan: 'professional' },
  { id: 'workflow_automation', label: 'Workflow Automation', icon: Zap, plan: 'professional' },
  { id: 'predictive_intelligence', label: 'Predictive Intelligence', icon: Activity, plan: 'enterprise' },
  { id: 'white_label', label: 'White Label', icon: Crown, plan: 'enterprise' },
  { id: 'api_access', label: 'API Access', icon: Wifi, plan: 'enterprise' },
  { id: 'advanced_analytics', label: 'Advanced Analytics', icon: FileText, plan: 'professional' },
  { id: 'custom_integrations', label: 'Custom Integrations', icon: Settings, plan: 'enterprise' },
  { id: 'priority_support', label: 'Priority Support', icon: CheckCircle, plan: 'enterprise' },
];

const PLAN_COLORS = {
  starter: 'bg-blue-100 text-blue-700',
  professional: 'bg-purple-100 text-purple-700',
  enterprise: 'bg-yellow-100 text-yellow-700',
};

export default function TenantManagement() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [plan, setPlan] = useState(null);
  const [featureFlags, setFeatureFlags] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [impersonating, setImpersonating] = useState(false);

  useEffect(() => {
    loadTenantData();
  }, [companyId]);

  const loadTenantData = async () => {
    try {
      const [companies, subs, plans, flags, allUsers] = await Promise.all([
        base44.entities.Company.filter({ id: companyId }),
        base44.entities.CompanySubscription.filter({ company_id: companyId }),
        base44.entities.SubscriptionPlan.list(),
        base44.entities.TenantFeatureFlag.filter({ company_id: companyId }),
        base44.entities.User.filter({ company_id: companyId }),
      ]);

      if (!companies[0]) {
        toast.error('Tenant not found');
        navigate('/super-admin');
        return;
      }

      setTenant(companies[0]);
      setSubscription(subs[0] || null);
      if (subs[0]?.plan_id) {
        setPlan(plans.find(p => p.id === subs[0].plan_id) || null);
      }
      setFeatureFlags(flags);
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading tenant:', error);
      toast.error('Errore nel caricamento tenant');
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (featureName, enabled) => {
    try {
      const existing = featureFlags.find(f => f.feature_name === featureName);
      const feature = FEATURES.find(f => f.id === featureName);
      
      if (existing) {
        await base44.entities.TenantFeatureFlag.update(existing.id, { enabled });
      } else {
        await base44.entities.TenantFeatureFlag.create({
          company_id: companyId,
          feature_name: featureName,
          enabled,
          plan_required: feature?.plan || 'starter',
        });
      }

      await base44.entities.TenantActivationLog.create({
        company_id: companyId,
        event_type: enabled ? 'feature_enabled' : 'feature_disabled',
        description: `Feature ${featureName} ${enabled ? 'enabled' : 'disabled'}`,
        performed_by: (await base44.auth.me())?.email || 'system',
      });

      toast.success(`Feature ${enabled ? 'attivata' : 'disattivata'}`);
      loadTenantData();
    } catch (error) {
      toast.error('Errore nel toggle feature');
    }
  };

  const updateTenantStatus = async (newStatus) => {
    if (!subscription) return;
    
    setSaving(true);
    try {
      await base44.entities.CompanySubscription.update(subscription.id, { status: newStatus });
      
      await base44.entities.TenantActivationLog.create({
        company_id: companyId,
        event_type: `tenant_${newStatus}`,
        description: `Tenant status changed to ${newStatus}`,
        performed_by: (await base44.auth.me())?.email || 'system',
      });

      toast.success(`Tenant status updated to ${newStatus}`);
      loadTenantData();
    } catch (error) {
      toast.error('Errore aggiornamento status');
    } finally {
      setSaving(false);
    }
  };

  const startImpersonation = async () => {
    const adminUser = users.find(u => u.role === 'company_admin');
    if (!adminUser) {
      toast.error('No admin user found for this tenant');
      return;
    }

    try {
      await base44.entities.TenantImpersonation.create({
        company_id: companyId,
        super_admin_email: (await base44.auth.me())?.email || 'admin',
        impersonating_user_id: (await base44.auth.me())?.id,
        target_user_email: adminUser.email,
        started_at: new Date().toISOString(),
        status: 'active',
        reason: 'Support session',
      });

      await base44.entities.TenantActivationLog.create({
        company_id: companyId,
        event_type: 'impersonation_started',
        description: `Super admin started impersonating tenant`,
        performed_by: (await base44.auth.me())?.email || 'system',
      });

      setImpersonating(true);
      toast.success('Impersonation started - Banner will be shown');
    } catch (error) {
      toast.error('Errore avvio impersonation');
    }
  };

  const endImpersonation = async () => {
    try {
      const activeImp = await base44.entities.TenantImpersonation.filter({ 
        company_id: companyId, 
        status: 'active' 
      });

      if (activeImp[0]) {
        await base44.entities.TenantImpersonation.update(activeImp[0].id, {
          ended_at: new Date().toISOString(),
          status: 'ended',
        });
      }

      await base44.entities.TenantActivationLog.create({
        company_id: companyId,
        event_type: 'impersonation_ended',
        description: 'Impersonation session ended',
        performed_by: (await base44.auth.me())?.email || 'system',
      });

      setImpersonating(false);
      toast.success('Impersonation ended');
      navigate('/super-admin');
    } catch (error) {
      toast.error('Errore fine impersonation');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!tenant) return null;

  const statusColors = {
    active: 'text-green-600 bg-green-50',
    trial: 'text-blue-600 bg-blue-50',
    suspended: 'text-gray-600 bg-gray-100',
    cancelled: 'text-red-600 bg-red-50',
    past_due: 'text-orange-600 bg-orange-50',
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Banner Impersonation */}
      {impersonating && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white px-4 py-2 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            <span className="font-semibold">Impersona Tenant: {tenant.name}</span>
          </div>
          <button
            onClick={endImpersonation}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-white text-orange-600 rounded-lg hover:bg-orange-50"
          >
            <LogOut className="w-4 h-4" />
            Esci Impersona
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/super-admin')} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Gestione Tenant</h1>
          <p className="text-sm text-gray-500">{tenant.name}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={startImpersonation}
            disabled={impersonating}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium disabled:opacity-40"
            style={{ backgroundColor: '#F59E0B' }}
          >
            <Play className="w-4 h-4" />
            Impersona
          </button>
        </div>
      </div>

      {/* Tenant Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: tenant.brand_color_primary || '#1147FF' }}>
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{tenant.name}</p>
              <p className="text-xs text-gray-500">{tenant.email}</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[subscription?.status] || 'bg-gray-100'}`}>
                {subscription?.status || 'No subscription'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Plan</span>
              <span className="font-medium">{plan?.name || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">MRR</span>
              <span className="font-semibold">€{subscription?.mrr || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Utenti ({users.length})
          </h3>
          <div className="space-y-2">
            {users.slice(0, 5).map(u => (
              <div key={u.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{u.email}</span>
                <span className="text-xs px-2 py-1 bg-gray-100 rounded">{u.role}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Azioni Rapide</h3>
          <div className="space-y-2">
            {subscription?.status === 'active' && (
              <button
                onClick={() => updateTenantStatus('suspended')}
                disabled={saving}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-40"
              >
                <Ban className="w-4 h-4" />
                Sospendi Tenant
              </button>
            )}
            {subscription?.status === 'suspended' && (
              <button
                onClick={() => updateTenantStatus('active')}
                disabled={saving}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-600 bg-green-50 rounded-lg hover:bg-green-100 disabled:opacity-40"
              >
                <CheckCircle className="w-4 h-4" />
                Riattiva Tenant
              </button>
            )}
            <button
              onClick={() => navigate('/company-settings')}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <Settings className="w-4 h-4" />
              Vedi Impostazioni
            </button>
          </div>
        </div>
      </div>

      {/* Feature Flags */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Controllo Accesso Funzionalità
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(feature => {
            const flag = featureFlags.find(f => f.feature_name === feature.id);
            const enabled = flag?.enabled || false;
            const planRequired = feature.plan;
            const canEnable = !planRequired || 
              (plan?.name === 'professional' && ['starter', 'professional'].includes(planRequired)) ||
              (plan?.name === 'enterprise');

            return (
              <div 
                key={feature.id}
                className={`p-4 rounded-xl border-2 transition-all ${
                  enabled 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <feature.icon className={`w-5 h-5 ${enabled ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className="font-medium text-gray-900">{feature.label}</span>
                  </div>
                  <button
                    onClick={() => toggleFeature(feature.id, !enabled)}
                    disabled={!canEnable && !enabled}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      enabled 
                        ? 'bg-green-600 text-white' 
                        : canEnable
                          ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    {enabled ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded-full ${PLAN_COLORS[planRequired]}`}>
                    {planRequired}
                  </span>
                  <span className="text-xs text-gray-500">
                    {enabled ? 'Attivato' : canEnable ? 'Disattivato' : 'Richiede upgrade'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Log Attivazione */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Log Attivazione Recenti
        </h2>
        <div className="space-y-2">
          {/* This would load from TenantActivationLog entity */}
          <p className="text-sm text-gray-500 text-center py-4">
            I log di attivazione sono registrati automaticamente
          </p>
        </div>
      </div>
    </div>
  );
}

function Building2({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}