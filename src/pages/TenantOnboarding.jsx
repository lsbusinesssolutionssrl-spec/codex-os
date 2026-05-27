import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Upload, Palette, User, Hash, Users,
  ChevronRight, ChevronLeft, Check, Loader2
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const STEPS = [
  { id: 1, label: 'Dati Azienda', icon: Building2 },
  { id: 2, label: 'Logo + Brand', icon: Palette },
  { id: 3, label: 'Utente Admin', icon: User },
  { id: 4, label: 'Numerazione', icon: Hash },
  { id: 5, label: 'Invita Team', icon: Users },
  { id: 6, label: 'Riepilogo', icon: Check },
];

export default function TenantOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    email: '',
    phone: '',
    address: '',
    vat_number: '',
    country: 'Italia',
    timezone: 'Europe/Rome',
    currency: 'EUR',
    logo_url: '',
    brand_color_primary: '#1147FF',
    brand_color_secondary: '#0B2341',
    admin_email: '',
    admin_name: '',
    estimate_prefix: 'EST',
    estimate_start: '001',
    project_prefix: 'PRJ',
    project_start: '001',
    team_emails: '',
    subscription_plan: 'starter',
  });

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    update('logo_url', file_url);
    setUploadingLogo(false);
  };

  const handleFinish = async () => {
    setSaving(true);
    
    // Recupera i piani subscription per ottenere il plan_id
    const plans = await base44.entities.SubscriptionPlan.list();
    const selectedPlan = plans.find(p => p.name.toLowerCase() === form.subscription_plan.toLowerCase()) || plans[0];
    
    const company = await base44.entities.Company.create({
      name: form.name,
      slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      email: form.email,
      phone: form.phone,
      address: form.address,
      logo_url: form.logo_url,
      brand_color_primary: form.brand_color_primary,
      brand_color_secondary: form.brand_color_secondary,
      settings: {
        currency: form.currency,
        timezone: form.timezone,
        estimate_prefix: form.estimate_prefix,
        estimate_start: parseInt(form.estimate_start),
        project_prefix: form.project_prefix,
        project_start: parseInt(form.project_start),
      },
      status: 'active',
    });

    await base44.entities.CompanySubscription.create({
      company_id: company.id,
      plan_id: selectedPlan.id,
      status: 'trial',
      billing_cycle: 'monthly',
      trial_start: new Date().toISOString().split('T')[0],
      trial_end: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    });

    // CRITICAL: Create TenantMembership for the admin user
    // This ensures the user is properly bound to the tenant
    if (form.admin_email) {
      // First, find or create the admin user
      let adminUser;
      const existingUsers = await base44.entities.User.filter({ email: form.admin_email });
      
      if (existingUsers.length > 0) {
        adminUser = existingUsers[0];
        // Update existing user
        await base44.entities.User.update(adminUser.id, {
          company_id: company.id,
          role: 'company_admin',
        });
      } else {
        // Note: We can't create users directly, so we'll create an invitation
        // The user will be created when they accept the invitation
        await base44.users.inviteUser(form.admin_email, 'company_admin');
        adminUser = { id: 'pending', email: form.admin_email };
      }

      // Create TenantMembership (only if user exists)
      if (adminUser.id !== 'pending') {
        await base44.entities.TenantMembership.create({
          user_id: adminUser.id,
          tenant_id: company.id,
          tenant_role: 'tenant_admin',
          status: 'active',
          invited_by: (await base44.auth.me())?.email || 'system',
          invited_at: new Date().toISOString(),
          joined_at: new Date().toISOString(),
          is_primary: true,
          default_workspace: 'executive',
          permissions: {
            can_create_projects: true,
            can_create_estimates: true,
            can_view_financials: true,
            can_manage_team: true,
            can_access_api: true,
          },
        });
      }
    }

    // Log the tenant creation
    await base44.entities.TenantActivationLog.create({
      company_id: company.id,
      event_type: 'tenant_created',
      description: `Tenant created: ${company.name}`,
      performed_by: (await base44.auth.me())?.email || 'system',
      metadata: {
        admin_email: form.admin_email,
        plan: selectedPlan.name,
      },
    });

    setSaving(false);
    toast.success('Tenant creato con successo!');
    navigate('/super-admin');
  };

  const canNext = () => {
    if (step === 1) return form.name && form.email;
    if (step === 3) return form.admin_email;
    return true;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Onboarding Nuovo Tenant</h1>
          <p className="text-sm text-gray-500 mt-1">Configura una nuova azienda sulla piattaforma</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, idx) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className={`flex items-center gap-2 ${step === s.id ? 'text-blue-600' : step > s.id ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  step > s.id ? 'bg-green-100 text-green-600' :
                  step === s.id ? 'bg-blue-600 text-white' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {step > s.id ? <Check className="w-4 h-4" /> : s.id}
                </div>
                <span className="text-xs font-medium hidden sm:block">{s.label}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${step > s.id ? 'bg-green-300' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-900 mb-4">Informazioni Azienda</h2>
              <FormField label="Ragione Sociale *" value={form.name} onChange={v => update('name', v)} placeholder="Codex Solution Srl" />
              <FormField label="Slug (URL-safe) *" value={form.slug} onChange={v => update('slug', v)} placeholder="codex-solution" />
              <p className="text-xs text-gray-400 -mt-3">Identificativo univoco per URL (es: nome-azienda)</p>
              <FormField label="Email Aziendale *" value={form.email} onChange={v => update('email', v)} placeholder="info@azienda.it" type="email" />
              <FormField label="Telefono" value={form.phone} onChange={v => update('phone', v)} placeholder="+39 02 1234567" />
              <FormField label="Indirizzo" value={form.address} onChange={v => update('address', v)} placeholder="Via Roma 1, Milano" />
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Partita IVA" value={form.vat_number} onChange={v => update('vat_number', v)} placeholder="IT12345678901" />
                <FormField label="Paese" value={form.country} onChange={v => update('country', v)} placeholder="Italia" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Fuso Orario</label>
                  <select value={form.timezone} onChange={e => update('timezone', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
                    <option value="Europe/Rome">Europe/Rome (CET)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Valuta</label>
                  <select value={form.currency} onChange={e => update('currency', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
                    <option value="EUR">EUR (euro)</option>
                    <option value="USD">USD (dollaro)</option>
                    <option value="GBP">GBP (sterlina)</option>
                    <option value="AED">AED (dirham)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-semibold text-gray-900 mb-4">Logo e Branding</h2>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Logo Aziendale</label>
                <div className="flex items-center gap-4">
                  {form.logo_url ? (
                    <img src={form.logo_url} alt="Logo" className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                  <label className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploadingLogo ? 'Caricamento...' : 'Carica Logo'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Colore Primario</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.brand_color_primary} onChange={e => update('brand_color_primary', e.target.value)} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                    <span className="text-sm font-mono text-gray-600">{form.brand_color_primary}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Colore Secondario</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.brand_color_secondary} onChange={e => update('brand_color_secondary', e.target.value)} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                    <span className="text-sm font-mono text-gray-600">{form.brand_color_secondary}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 rounded-xl border border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-400 mb-3">Anteprima Brand</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: form.brand_color_primary }}>
                    {form.name?.[0] || 'C'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{form.name || 'Nome Azienda'}</p>
                    <p className="text-xs" style={{ color: form.brand_color_secondary }}>{form.email || 'email@azienda.it'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-900 mb-4">Utente Amministratore Tenant</h2>
              <p className="text-sm text-gray-500">Questo utente sarà l'amministratore principale per questo tenant.</p>
              <FormField label="Email Admin *" value={form.admin_email} onChange={v => update('admin_email', v)} placeholder="admin@azienda.it" type="email" />
              <FormField label="Nome Completo Admin" value={form.admin_name} onChange={v => update('admin_name', v)} placeholder="Mario Rossi" />
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Piano Abbonamento</label>
                <select value={form.subscription_plan} onChange={e => update('subscription_plan', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
                  <option value="starter">Starter (Trial)</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-900 mb-4">Numerazione Documenti</h2>
              <p className="text-sm text-gray-500">Configura come verranno numerati preventivi e progetti.</p>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Preventivi</p>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Prefisso" value={form.estimate_prefix} onChange={v => update('estimate_prefix', v)} placeholder="EST" />
                  <FormField label="Numero Iniziale" value={form.estimate_start} onChange={v => update('estimate_start', v)} placeholder="001" />
                </div>
                <p className="text-xs text-gray-400">Esempio: <strong>{form.estimate_prefix}-{form.estimate_start}</strong></p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Progetti</p>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Prefisso" value={form.project_prefix} onChange={v => update('project_prefix', v)} placeholder="PRJ" />
                  <FormField label="Numero Iniziale" value={form.project_start} onChange={v => update('project_start', v)} placeholder="001" />
                </div>
                <p className="text-xs text-gray-400">Esempio: <strong>{form.project_prefix}-{form.project_start}</strong></p>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-900 mb-4">Invita Team (Opzionale)</h2>
              <p className="text-sm text-gray-500">Inserisci le email dei membri del team. Una per riga.</p>
              <textarea
                value={form.team_emails}
                onChange={e => update('team_emails', e.target.value)}
                rows={6}
                placeholder={"team@azienda.it\ncommerciale@azienda.it\ntecnico@azienda.it"}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none"
              />
              <p className="text-xs text-gray-400">Le email di invito verranno inviate alla creazione del tenant.</p>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-900 mb-4">Riepilogo e Creazione</h2>
              <div className="space-y-3">
                <ReviewRow label="Azienda" value={form.name} />
                <ReviewRow label="Slug" value={form.slug || 'Auto-generato'} />
                <ReviewRow label="Email" value={form.email} />
                <ReviewRow label="Paese" value={form.country} />
                <ReviewRow label="Valuta" value={form.currency} />
                <ReviewRow label="Fuso Orario" value={form.timezone} />
                <ReviewRow label="Admin" value={form.admin_email} />
                <ReviewRow label="Piano" value={form.subscription_plan} />
                <ReviewRow label="Formato Preventivi" value={`${form.estimate_prefix}-${form.estimate_start}`} />
                <ReviewRow label="Formato Progetti" value={`${form.project_prefix}-${form.project_start}`} />
              </div>
              {form.team_emails && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-blue-700">Inviti team:</p>
                  <p className="text-xs text-blue-600 mt-1">{form.team_emails.split('\n').filter(Boolean).join(', ')}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => step > 1 && setStep(s => s - 1)}
            disabled={step === 1}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Indietro
          </button>
          {step < STEPS.length ? (
            <button
              onClick={() => canNext() && setStep(s => s + 1)}
              disabled={!canNext()}
              className="flex items-center gap-2 px-5 py-2 text-sm text-white rounded-lg font-medium disabled:opacity-40 transition-colors"
              style={{ backgroundColor: '#1147FF' }}
            >
              Continua
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 text-sm text-white rounded-lg font-medium disabled:opacity-40"
              style={{ backgroundColor: '#10B981' }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? 'Creazione in corso...' : 'Crea Tenant'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value || '—'}</span>
    </div>
  );
}