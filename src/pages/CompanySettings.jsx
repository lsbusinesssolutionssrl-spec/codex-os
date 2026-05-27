import { useState, useEffect } from 'react';
import { Building2, Palette, Users, CreditCard, Save, Shield, Zap, Brain, Globe, CheckCircle2, AlertTriangle, Settings, FileText, Bell, Key, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useGlobalContext } from '@/lib/GlobalContextEngine';

export default function CompanySettings() {
  const navigate = useNavigate();
  const globalContext = useGlobalContext();
  const { activeTenant, contextType, platformRole, enabledModules } = globalContext;
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [form, setForm] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const { tenantMemberships } = globalContext;

  useEffect(() => {
    const load = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      // SECURITY FIX: Platform users should go to PlatformSettings
      if (['admin', 'developer'].includes(currentUser?.role) && contextType === 'platform') {
        navigate('/platform-settings');
        return;
      }
      
      try {
        const res = await base44.functions.invoke('getCurrentCompany', {});
        setCompany(res.data.company);
        setForm(res.data.company);
        setSubscription(res.data.subscription);
        if (res.data.subscription?.plan_id) {
          const plans = await base44.entities.SubscriptionPlan.filter({ id: res.data.subscription.plan_id });
          if (plans.length > 0) setPlan(plans[0]);
        }
      } catch (error) {
        console.error('Error loading company settings:', error);
        toast.error('Impossibile caricare le impostazioni company');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await base44.entities.Company.update(company.id, form);
      setCompany(updated);
      toast.success('Impostazioni salvate');
    } catch (error) {
      toast.error('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async () => {
    if (!logoFile) return;
    setUploadingLogo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: logoFile });
      const updated = await base44.entities.Company.update(company.id, { logo_url: file_url });
      setCompany(updated);
      setForm(updated);
      toast.success('Logo caricato');
    } catch (error) {
      toast.error('Errore upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-400">Caricamento...</div>;
  
  // SECURITY FIX: Redirect platform users to PlatformSettings
  if (['admin', 'developer'].includes(user?.role) && contextType === 'platform') {
    return null; // Will redirect in useEffect
  }

  if (!company) {
    // Check if user has memberships but company settings missing
    const hasMembership = tenantMemberships && tenantMemberships.length > 0;
    const activeMembership = tenantMemberships?.find(m => m.is_primary) || tenantMemberships?.[0];
    
    if (hasMembership && activeMembership) {
      // User has membership but company settings incomplete - show wizard
      return (
        <div className="p-6 max-w-2xl mx-auto mt-10 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center space-y-4">
            <Building2 className="w-12 h-12 text-orange-400 mx-auto" />
            <h2 className="font-bold text-gray-900">Configurazione Company Incompleta</h2>
            <p className="text-sm text-gray-500">
              Il tuo utente è associato al tenant <strong>{activeMembership.tenant_id}</strong> ma le impostazioni company non sono state completate.
            </p>
            <button 
              onClick={() => window.location.href = '/activation-wizard'} 
              className="px-4 py-2 text-sm text-white rounded-lg font-medium"
              style={{ backgroundColor: '#1147FF' }}
            >
              Completa Configurazione
            </button>
          </div>
        </div>
      );
    }
    
    // No membership - show repair option for ANY user (they might be tenant admin)
    if (user) {
      return (
        <div className="p-6 max-w-2xl mx-auto mt-10 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="font-bold text-gray-900">Tenant Membership Non Trovata</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Il tuo utente (<strong>{user.email}</strong>) non ha una TenantMembership attiva. Questo significa che non sei collegato a nessun tenant/company.
                </p>
              </div>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold text-orange-900 text-sm mb-2">Perché vedi questo errore?</h3>
              <ul className="text-xs text-orange-800 space-y-1 list-disc list-inside">
                <li>Il tuo account esiste ma non è collegato a nessun tenant</li>
                <li>Un Super Admin ha creato un tenant ma non ti ha aggiunto come membro</li>
                <li>La membership è stata rimossa o è in stato non attivo</li>
              </ul>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {user?.role === 'admin' && (
                <>
                  <button 
                    onClick={() => window.location.href = '/tenant-membership-repair'} 
                    className="px-4 py-2 text-sm text-white rounded-lg font-medium"
                    style={{ backgroundColor: '#F59E0B' }}
                  >
                    Apri Repair Center
                  </button>
                  <button 
                    onClick={() => window.location.href = '/super-admin'} 
                    className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Super Admin Dashboard
                  </button>
                </>
              )}
              <button 
                onClick={() => window.location.href = '/tenant-membership-debug'} 
                className="px-4 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
              >
                Debug Membership
              </button>
              <button 
                onClick={() => base44.auth.logout()} 
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
            
            {user?.role !== 'admin' && (
              <div className="text-xs text-gray-500 border-t border-gray-100 pt-3">
                <p className="font-medium">Contatta un amministratore per:</p>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  <li>Creare una TenantMembership per il tuo utente</li>
                  <li>Collegarti al tenant corretto</li>
                  <li>Assegnarti il ruolo appropriato (Tenant Admin, Project Manager, etc.)</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    // Fallback
    return (
      <div className="p-6 max-w-md mx-auto mt-20 bg-white rounded-2xl border border-gray-200 shadow-lg text-center space-y-4">
        <Building2 className="w-12 h-12 text-gray-300 mx-auto" />
        <h2 className="font-bold text-gray-900">Company Non Trovata</h2>
        <p className="text-sm text-gray-500">
          Il tuo utente non è associato a nessuna company. Contatta l'amministratore per creare o assegnare una company.
        </p>
        <button 
          onClick={() => base44.auth.logout()} 
          className="px-4 py-2 text-sm text-white rounded-lg font-medium"
          style={{ backgroundColor: '#1147FF' }}
        >
          Logout
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'Profilo Azienda', icon: Building2 },
    { id: 'team', label: 'Team & Ruoli', icon: Users },
    { id: 'brand', label: 'Branding', icon: Palette },
    { id: 'modules', label: 'Moduli Attivi', icon: Zap },
    { id: 'subscription', label: 'Fatturazione', icon: CreditCard },
    { id: 'usage', label: 'Utilizzo', icon: CheckCircle2 },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Impostazioni</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configurazione tenant</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 text-xs font-medium text-white rounded-lg" style={{ backgroundColor: '#1147FF' }}>
            {globalContext.activeTenantRole || 'tenant'}
          </div>
          <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium disabled:opacity-40" style={{ backgroundColor: '#1147FF' }}>
            <Save className="w-4 h-4" /> {saving ? 'Salvataggio...' : 'Salva'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 mb-4">Profilo Azienda</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nome Azienda" value={form.name} onChange={v => setForm(f => ({...f, name: v}))} />
            <Field label="Email" value={form.email} onChange={v => setForm(f => ({...f, email: v}))} type="email" />
            <Field label="Telefono" value={form.phone} onChange={v => setForm(f => ({...f, phone: v}))} />
            <Field label="Partita IVA / Codice Fiscale" value={form.tax_id} onChange={v => setForm(f => ({...f, tax_id: v}))} className="sm:col-span-2" />
            <Field label="Indirizzo" value={form.address} onChange={v => setForm(f => ({...f, address: v}))} className="sm:col-span-2" />
            <Field label="Sito Web" value={form.website} onChange={v => setForm(f => ({...f, website: v}))} className="sm:col-span-2" />
            <Field label="Settore" value={form.industry} onChange={v => setForm(f => ({...f, industry: v}))} />
          </div>
        </div>
      )}

      {/* Team Tab */}
      {activeTab === 'team' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 mb-4">Team & Ruoli</h2>
          <button
            onClick={() => navigate('/team')}
            className="flex items-center gap-2 px-4 py-3 text-sm text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#1147FF' }}
          >
            <Users className="w-4 h-4" />
            Gestisci Team e Permessi
          </button>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-medium">Gestione Utenti</p>
            <p className="text-xs text-blue-600 mt-1">Invita nuovi membri, assegna ruoli e gestisci i permessi del team.</p>
          </div>
        </div>
      )}

      {/* Modules Tab */}
      {activeTab === 'modules' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 mb-4">Moduli Attivi</h2>
          <button
            onClick={() => navigate('/company-settings/modules')}
            className="flex items-center gap-2 px-4 py-3 text-sm text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#1147FF' }}
          >
            <Zap className="w-4 h-4" />
            Attiva/Disattiva Moduli
          </button>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {enabledModules.map(module => (
              <div key={module} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-semibold text-green-900 capitalize">{module.replace('_', ' ')}</p>
                <p className="text-xs text-green-700 mt-0.5">Attivo</p>
              </div>
            ))}
          </div>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800 font-medium">Moduli Disponibili</p>
            <p className="text-xs text-amber-700 mt-1">Alcuni moduli richiedono un upgrade del piano. Contatta il supporto per abilitare funzionalità aggiuntive.</p>
          </div>
        </div>
      )}

      {/* Brand Tab */}
      {activeTab === 'brand' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 mb-4">Identità Brand</h2>
          
          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
            <div className="flex items-center gap-4">
              {company.logo_url ? (
                <img src={company.logo_url} alt="Logo" className="w-20 h-20 object-contain border border-gray-200 rounded-lg p-2" />
              ) : (
                <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400">
                  <Building2 className="w-8 h-8" />
                </div>
              )}
              <div className="flex-1">
                <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files[0])} className="block w-full text-sm text-gray-500" />
                <button onClick={uploadLogo} disabled={!logoFile || uploadingLogo} className="mt-2 px-3 py-1.5 text-xs text-white rounded-lg font-medium disabled:opacity-40" style={{ backgroundColor: '#1147FF' }}>
                  {uploadingLogo ? 'Upload...' : 'Carica Logo'}
                </button>
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.brand_color_primary || '#1147FF'} onChange={e => setForm(f => ({...f, brand_color_primary: e.target.value}))} className="w-10 h-10 border border-gray-200 rounded cursor-pointer" />
                <input type="text" value={form.brand_color_primary || '#1147FF'} onChange={e => setForm(f => ({...f, brand_color_primary: e.target.value}))} className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.brand_color_secondary || '#0B2341'} onChange={e => setForm(f => ({...f, brand_color_secondary: e.target.value}))} className="w-10 h-10 border border-gray-200 rounded cursor-pointer" />
                <input type="text" value={form.brand_color_secondary || '#0B2341'} onChange={e => setForm(f => ({...f, brand_color_secondary: e.target.value}))} className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg" />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <p className="text-xs text-gray-500 mb-2">Anteprima Brand</p>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 text-xs text-white rounded" style={{ backgroundColor: form.brand_color_primary }}>Primary</div>
              <div className="px-3 py-1.5 text-xs text-white rounded" style={{ backgroundColor: form.brand_color_secondary }}>Secondary</div>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Tab */}
      {activeTab === 'subscription' && subscription && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 mb-4">Abbonamento & Fatturazione</h2>
          
          {plan && (
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                <span className="text-sm text-gray-500 capitalize">{subscription.billing_cycle}</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
              <div className="text-2xl font-bold text-gray-900">
                €{subscription.billing_cycle === 'yearly' ? plan.price_yearly : plan.price_monthly}
                <span className="text-sm font-normal text-gray-500">/{subscription.billing_cycle === 'yearly' ? 'anno' : 'mese'}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <InfoCard label="Stato" value={subscription.status} />
            <InfoCard label="Fine Trial" value={subscription.trial_end ? new Date(subscription.trial_end).toLocaleDateString('it-IT') : '—'} />
            <InfoCard label="Prossima Fatturazione" value={subscription.next_billing_date ? new Date(subscription.next_billing_date).toLocaleDateString('it-IT') : '—'} />
            <InfoCard label="MRR" value={`€${subscription.mrr || 0}`} />
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-medium">💡 Piano corrente: {plan?.name || 'N/A'}</p>
            <p className="text-xs text-blue-600 mt-1">Contatta il supporto per cambiare piano o cancellare l'abbonamento.</p>
          </div>
        </div>
      )}

      {/* Usage Tab */}
      {activeTab === 'usage' && subscription && plan && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 mb-4">Utilizzo & Quote</h2>
          
          <div className="space-y-4">
            <UsageBar 
              label="Utenti" 
              current={subscription.seats_used || 0} 
              limit={plan.quotas?.max_users || 0} 
              icon={Users}
            />
            <UsageBar 
              label="Progetti" 
              current={0} 
              limit={plan.quotas?.max_projects || 0} 
              icon={Building2}
              fetchCount
            />
            <UsageBar 
              label="Storage" 
              current={subscription.storage_used_gb || 0} 
              limit={plan.quotas?.max_storage_gb || 0} 
              icon={CheckCircle2}
              suffix="GB"
            />
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Quote del Piano</h3>
            <div className="grid grid-cols-2 gap-3">
              <QuotaItem label="Preventivi/mese" value={plan.quotas?.max_estimates_per_month} />
              <QuotaItem label="Ticket/mese" value={plan.quotas?.max_tickets_per_month} />
              <QuotaItem label="Clienti max" value={plan.quotas?.max_clients} />
              <QuotaItem label="Proprietà max" value={plan.quotas?.max_properties} />
              <QuotaItem label="AI requests/mese" value={plan.quotas?.ai_requests_per_month} />
              <QuotaItem label="Guardian subscriptions" value={plan.quotas?.guardian_subscriptions} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', disabled = false, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input 
        type={type} 
        value={value || ''} 
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none disabled:bg-gray-50" 
      />
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="p-3 border border-gray-20 border border-gray-200 rounded-lg">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

function UsageBar({ label, current, limit, icon: Icon, suffix = '', fetchCount = false }) {
  const pct = limit > 0 ? Math.min(100, (current / limit) * 100) : 0;
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-orange-500' : 'bg-green-500';
  
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <span className="text-xs text-gray-500">{current}{suffix} / {limit}{suffix}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function QuotaItem({ label, value }) {
  return (
    <div className="p-2 bg-gray-50 rounded-lg">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value || '∞'}</p>
    </div>
  );
}

function ModuleCard({ title, description, icon: Icon, path, color }) {
  return (
    <button
      onClick={() => window.location.href = path}
      className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all text-left"
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-5 h-5" style={{ color: color }} />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      </div>
    </button>
  );
}