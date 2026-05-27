import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Palette, CheckCircle, AlertCircle, Clock, Save,
  FileText, TrendingUp, Shield, Crown, Loader2, Eye, Upload
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { usePlanAccess } from '@/hooks/useFeatureAccess';
import BrandPreviewModal from '@/components/brand/BrandPreviewModal';
import LogoUploader from '@/components/brand/LogoUploader';

const TIERS = {
  professional: {
    label: 'Professional',
    color: '#8B5CF6',
    features: ['logo', 'primary_color', 'pdf_branding']
  },
  enterprise: {
    label: 'Enterprise',
    color: '#F59E0B',
    features: ['full_branding', 'login_branding', 'portal_branding', 'email_branding', 'custom_domain']
  },
  elite: {
    label: 'Elite',
    color: '#EF4444',
    features: ['advanced_naming', 'white_label_onboarding', 'remove_powered_by', 'premium_branding']
  }
};

const DEFAULT_COLORS = {
  primary: '#1147FF',
  secondary: '#0B2341',
  accent: '#F58020',
  background: '#FFFFFF',
  surface: '#F8FAFC',
  border: '#E2E8F0',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444'
};

export default function WhiteLabelCenter() {
  const navigate = useNavigate();
  const { hasAccess: hasEnterpriseAccess, currentPlan } = usePlanAccess('enterprise');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyId, setCompanyId] = useState(null);
  const [brandThemes, setBrandThemes] = useState([]);
  const [activeTheme, setActiveTheme] = useState(null);
  const [previewMode, setPreviewMode] = useState('dashboard');
  const [showPreview, setShowPreview] = useState(false);
  
  const [form, setForm] = useState({
    theme_name: '',
    logo_url: '',
    favicon_url: '',
    colors: { ...DEFAULT_COLORS },
    typography: {
      font_family: 'Inter',
      heading_scale: 'normal'
    },
    terminology: {
      platform_name: 'Codex OS',
      project_label: 'Project',
      client_label: 'Client'
    },
    email_footer: '',
    login_background_url: '',
    powered_by_visible: true,
    custom_domain: ''
  });

  useEffect(() => {
    loadBrandThemes();
  }, []);

  const loadBrandThemes = async () => {
    try {
      const companyRes = await base44.functions.invoke('getCurrentCompany', {});
      const company = companyRes.data?.company;
      if (!company) {
        toast.error('Company not found');
        return;
      }
      
      setCompanyId(company.id);
      
      const themes = await base44.entities.BrandTheme.filter({ 
        company_id: company.id 
      }, '-created_date');
      
      setBrandThemes(themes);
      const active = themes.find(t => t.is_active);
      setActiveTheme(active || null);
      
      if (active) {
        setForm({
          theme_name: active.theme_name,
          logo_url: active.logo_url || '',
          favicon_url: active.favicon_url || '',
          colors: active.colors || { ...DEFAULT_COLORS },
          typography: active.typography || { font_family: 'Inter', heading_scale: 'normal' },
          terminology: active.terminology || {
            platform_name: 'Codex OS',
            project_label: 'Project',
            client_label: 'Client'
          },
          email_footer: active.email_footer || '',
          login_background_url: active.login_background_url || '',
          powered_by_visible: active.powered_by_visible ?? true,
          custom_domain: active.custom_domain || ''
        });
      }
    } catch (error) {
      console.error('Error loading brand themes:', error);
      toast.error('Errore nel caricamento brand themes');
    } finally {
      setLoading(false);
    }
  };



  const updateColor = (key, value) => {
    setForm(f => ({
      ...f,
      colors: { ...f.colors, [key]: value }
    }));
  };

  const submitForApproval = async () => {
    if (!form.theme_name) {
      toast.error('Inserisci un nome per il tema');
      return;
    }

    setSaving(true);
    try {
      const themeData = {
        company_id: companyId,
        theme_name: form.theme_name,
        version: '1.0',
        status: 'Pending Approval',
        tier: currentPlan?.name?.toLowerCase() || 'professional',
        ...form,
        submitted_by: (await base44.auth.me())?.email || 'unknown',
        submitted_at: new Date().toISOString(),
        is_active: false
      };

      await base44.entities.BrandTheme.create(themeData);
      
      await base44.entities.BrandAuditLog.create({
        company_id: companyId,
        brand_theme_id: 'new',
        event_type: 'theme_submitted',
        description: `Brand theme "${form.theme_name}" submitted for approval`,
        performed_by: themeData.submitted_by,
        new_version: '1.0'
      });

      toast.success('Tema inviato per approvazione');
      loadBrandThemes();
    } catch (error) {
      toast.error('Errore invio approvazione');
    } finally {
      setSaving(false);
    }
  };

  const saveAsDraft = async () => {
    if (!form.theme_name) {
      toast.error('Inserisci un nome per il tema');
      return;
    }

    setSaving(true);
    try {
      await base44.entities.BrandTheme.create({
        company_id: companyId,
        theme_name: form.theme_name,
        version: '1.0',
        status: 'Draft',
        tier: currentPlan?.name?.toLowerCase() || 'professional',
        ...form,
        is_active: false
      });

      await base44.entities.BrandAuditLog.create({
        company_id: companyId,
        brand_theme_id: 'new',
        event_type: 'theme_created',
        description: `Brand theme "${form.theme_name}" created as draft`,
        performed_by: (await base44.auth.me())?.email || 'unknown',
        new_version: '1.0'
      });

      toast.success('Tema salvato come bozza');
      loadBrandThemes();
    } catch (error) {
      toast.error('Errore salvataggio bozza');
    } finally {
      setSaving(false);
    }
  };

  const activateTheme = async (theme) => {
    try {
      if (activeTheme) {
        await base44.entities.BrandTheme.update(activeTheme.id, { is_active: false });
      }
      
      await base44.entities.BrandTheme.update(theme.id, { 
        is_active: true,
        status: 'Active'
      });

      await base44.entities.BrandAuditLog.create({
        company_id: companyId,
        brand_theme_id: theme.id,
        event_type: 'theme_activated',
        description: `Brand theme "${theme.theme_name}" activated`,
        performed_by: (await base44.auth.me())?.email || 'unknown'
      });

      setActiveTheme(theme);
      toast.success('Tema attivato');
    } catch (error) {
      toast.error('Errore attivazione tema');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const planTier = currentPlan?.name?.toLowerCase() || 'starter';
  const allowedFeatures = planTier === 'elite' ? TIERS.elite.features :
                          planTier === 'enterprise' ? TIERS.enterprise.features :
                          TIERS.professional.features;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Palette className="w-6 h-6" style={{ color: currentPlan?.name === 'Enterprise' ? '#F59E0B' : '#1147FF' }} />
            <h1 className="text-2xl font-bold text-gray-900">White Label Center</h1>
          </div>
          <p className="text-sm text-gray-500">
            Piano {currentPlan?.name || 'Starter'} · {allowedFeatures.length} funzionalità disponibili
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <Eye className="w-4 h-4" />
            Anteprima
          </button>
          <button
            onClick={saveAsDraft}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
          >
            <Save className="w-4 h-4" />
            Salva Bozza
          </button>
          <button
            onClick={submitForApproval}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium disabled:opacity-40"
            style={{ backgroundColor: '#1147FF' }}
          >
            <CheckCircle className="w-4 h-4" />
            Invia per Approvazione
          </button>
        </div>
      </div>

      {/* Banner Piano Tier */}
      <div className="p-4 rounded-xl border" style={{ backgroundColor: `${TIERS[planTier]?.color}10`, borderColor: `${TIERS[planTier]?.color}30` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: TIERS[planTier]?.color }}>
              {planTier === 'elite' ? <Crown className="w-5 h-5 text-white" /> :
               planTier === 'enterprise' ? <Shield className="w-5 h-5 text-white" /> :
               <TrendingUp className="w-5 h-5 text-white" />}
            </div>
            <div>
              <p className="font-semibold text-gray-900">Funzionalità {TIERS[planTier]?.label}</p>
              <p className="text-sm text-gray-600">{allowedFeatures.join(' · ')}</p>
            </div>
          </div>
          {planTier !== 'elite' && (
            <button
              onClick={() => navigate('/subscription-plans')}
              className="text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: TIERS[planTier]?.color, color: 'white' }}
            >
              Upgrade Piano
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Branding Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Logo & Favicon */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Logo & Icona
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <LogoUploader
                field="logo_url"
                value={form.logo_url}
                onChange={(url) => setForm(f => ({ ...f, logo_url: url }))}
                label="Company Logo"
              />
              <LogoUploader
                field="favicon_url"
                value={form.favicon_url}
                onChange={(url) => setForm(f => ({ ...f, favicon_url: url }))}
                label="Favicon (32x32)"
              />
            </div>
          </div>

          {/* Color Tokens */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Token di Design
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(form.colors).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-500 mb-1 capitalize">{key}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => updateColor(key, e.target.value)}
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updateColor(key, e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded-lg font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Terminology */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Terminologia Personalizzata
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Platform Name</label>
                <input
                  value={form.terminology.platform_name}
                  onChange={(e) => setForm(f => ({ ...f, terminology: { ...f.terminology, platform_name: e.target.value } }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                  placeholder="Codex OS"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Project Label</label>
                  <input
                    value={form.terminology.project_label}
                    onChange={(e) => setForm(f => ({ ...f, terminology: { ...f.terminology, project_label: e.target.value } }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                    placeholder="Project"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Client Label</label>
                  <input
                    value={form.terminology.client_label}
                    onChange={(e) => setForm(f => ({ ...f, terminology: { ...f.terminology, client_label: e.target.value } }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                    placeholder="Client"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cronologia & Stato Tema */}
        <div className="space-y-6">
          {/* Tema Attivo */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Tema Attivo
            </h2>
            {activeTheme ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{activeTheme.theme_name}</span>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Active</span>
                </div>
                <p className="text-sm text-gray-500">v{activeTheme.version}</p>
                <p className="text-xs text-gray-400">Activated: {activeTheme.approved_at ? new Date(activeTheme.approved_at).toLocaleDateString() : 'N/A'}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No active theme</p>
            )}
          </div>

          {/* Cronologia Temi */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Cronologia Temi
            </h2>
            <div className="space-y-3">
              {brandThemes.slice(0, 5).map(theme => (
                <div key={theme.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{theme.theme_name}</p>
                    <p className="text-xs text-gray-500">v{theme.version} · {theme.status}</p>
                  </div>
                  {!theme.is_active && theme.status === 'Approved' && (
                    <button
                      onClick={() => activateTheme(theme)}
                      className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Activate
                    </button>
                  )}
                </div>
              ))}
              {brandThemes.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No themes yet</p>
              )}
            </div>
          </div>

          {/* Stato Approvazione */}
          {brandThemes.some(t => t.status === 'Pending Approval') && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-900">In Attesa di Approvazione</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Le modifiche al brand sono in revisione da parte del team platform.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <BrandPreviewModal form={form} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
}