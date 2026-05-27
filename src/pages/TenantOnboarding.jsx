import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Upload, Palette, User, Hash, Users,
  ChevronRight, ChevronLeft, Check, Loader2
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const STEPS = [
  { id: 1, label: 'Company Info', icon: Building2 },
  { id: 2, label: 'Logo + Brand', icon: Palette },
  { id: 3, label: 'Admin User', icon: User },
  { id: 4, label: 'Numbering', icon: Hash },
  { id: 5, label: 'Invite Team', icon: Users },
  { id: 6, label: 'Review', icon: Check },
];

export default function TenantOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    vat_number: '',
    country: 'Italy',
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
    const company = await base44.entities.Company.create({
      name: form.name,
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
      status: 'trial',
      billing_cycle: 'monthly',
      trial_start: new Date().toISOString().split('T')[0],
      trial_end: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    });

    setSaving(false);
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
          <h1 className="text-2xl font-bold text-gray-900">New Tenant Onboarding</h1>
          <p className="text-sm text-gray-500 mt-1">Set up a new company on the platform</p>
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
              <h2 className="font-semibold text-gray-900 mb-4">Company Information</h2>
              <FormField label="Company Name *" value={form.name} onChange={v => update('name', v)} placeholder="Codex Solution Srl" />
              <FormField label="Company Email *" value={form.email} onChange={v => update('email', v)} placeholder="info@company.com" type="email" />
              <FormField label="Phone" value={form.phone} onChange={v => update('phone', v)} placeholder="+39 02 1234567" />
              <FormField label="Address" value={form.address} onChange={v => update('address', v)} placeholder="Via Roma 1, Milano" />
              <div className="grid grid-cols-2 gap-4">
                <FormField label="VAT Number" value={form.vat_number} onChange={v => update('vat_number', v)} placeholder="IT12345678901" />
                <FormField label="Country" value={form.country} onChange={v => update('country', v)} placeholder="Italy" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Timezone</label>
                  <select value={form.timezone} onChange={e => update('timezone', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
                    <option value="Europe/Rome">Europe/Rome (CET)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Currency</label>
                  <select value={form.currency} onChange={e => update('currency', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
                    <option value="EUR">EUR (euro)</option>
                    <option value="USD">USD (dollar)</option>
                    <option value="GBP">GBP (pound)</option>
                    <option value="AED">AED (dirham)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-semibold text-gray-900 mb-4">Logo and Branding</h2>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Company Logo</label>
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
                    {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.brand_color_primary} onChange={e => update('brand_color_primary', e.target.value)} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                    <span className="text-sm font-mono text-gray-600">{form.brand_color_primary}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Secondary Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.brand_color_secondary} onChange={e => update('brand_color_secondary', e.target.value)} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                    <span className="text-sm font-mono text-gray-600">{form.brand_color_secondary}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 rounded-xl border border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-400 mb-3">Brand Preview</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: form.brand_color_primary }}>
                    {form.name?.[0] || 'C'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{form.name || 'Company Name'}</p>
                    <p className="text-xs" style={{ color: form.brand_color_secondary }}>{form.email || 'email@company.com'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-900 mb-4">Tenant Admin User</h2>
              <p className="text-sm text-gray-500">This user will be the primary administrator for this tenant.</p>
              <FormField label="Admin Email *" value={form.admin_email} onChange={v => update('admin_email', v)} placeholder="admin@company.com" type="email" />
              <FormField label="Admin Full Name" value={form.admin_name} onChange={v => update('admin_name', v)} placeholder="Mario Rossi" />
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Subscription Plan</label>
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
              <h2 className="font-semibold text-gray-900 mb-4">Document Numbering</h2>
              <p className="text-sm text-gray-500">Configure how estimates and projects will be numbered.</p>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Estimates</p>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Prefix" value={form.estimate_prefix} onChange={v => update('estimate_prefix', v)} placeholder="EST" />
                  <FormField label="Start Number" value={form.estimate_start} onChange={v => update('estimate_start', v)} placeholder="001" />
                </div>
                <p className="text-xs text-gray-400">Example: <strong>{form.estimate_prefix}-{form.estimate_start}</strong></p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Projects</p>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Prefix" value={form.project_prefix} onChange={v => update('project_prefix', v)} placeholder="PRJ" />
                  <FormField label="Start Number" value={form.project_start} onChange={v => update('project_start', v)} placeholder="001" />
                </div>
                <p className="text-xs text-gray-400">Example: <strong>{form.project_prefix}-{form.project_start}</strong></p>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-900 mb-4">Invite Team (Optional)</h2>
              <p className="text-sm text-gray-500">Add team member emails. One per line.</p>
              <textarea
                value={form.team_emails}
                onChange={e => update('team_emails', e.target.value)}
                rows={6}
                placeholder={"team@company.com\nsales@company.com\ntech@company.com"}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none"
              />
              <p className="text-xs text-gray-400">Invitation emails will be sent when the tenant is created.</p>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-900 mb-4">Review and Create</h2>
              <div className="space-y-3">
                <ReviewRow label="Company" value={form.name} />
                <ReviewRow label="Email" value={form.email} />
                <ReviewRow label="Country" value={form.country} />
                <ReviewRow label="Currency" value={form.currency} />
                <ReviewRow label="Timezone" value={form.timezone} />
                <ReviewRow label="Admin" value={form.admin_email} />
                <ReviewRow label="Plan" value={form.subscription_plan} />
                <ReviewRow label="Estimate Format" value={`${form.estimate_prefix}-${form.estimate_start}`} />
                <ReviewRow label="Project Format" value={`${form.project_prefix}-${form.project_start}`} />
              </div>
              {form.team_emails && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-blue-700">Team invites:</p>
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
            Back
          </button>
          {step < STEPS.length ? (
            <button
              onClick={() => canNext() && setStep(s => s + 1)}
              disabled={!canNext()}
              className="flex items-center gap-2 px-5 py-2 text-sm text-white rounded-lg font-medium disabled:opacity-40 transition-colors"
              style={{ backgroundColor: '#1147FF' }}
            >
              Next
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
              {saving ? 'Creating...' : 'Create Tenant'}
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