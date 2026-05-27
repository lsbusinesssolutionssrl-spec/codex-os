import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, CheckCircle, ArrowRight, Upload, Palette } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useGlobalContext } from '@/lib/GlobalContextEngine';

export default function CompanySetupWizard() {
  const navigate = useNavigate();
  const { activeTenant, refreshContext } = useGlobalContext();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    legal_name: '',
    tax_id: '',
    email: '',
    phone: '',
    address: '',
    country: 'IT',
    language: 'it',
    timezone: 'Europe/Rome',
    brand_color_primary: '#1147FF',
    brand_color_secondary: '#0B2341',
    logo_url: '',
  });
  const [logoFile, setLogoFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    // Load existing company data if available
    if (activeTenant) {
      setForm(prev => ({
        ...prev,
        name: activeTenant.name || '',
        email: activeTenant.email || '',
        phone: activeTenant.phone || '',
        address: activeTenant.address || '',
        tax_id: activeTenant.tax_id || '',
        brand_color_primary: activeTenant.brand_color_primary || '#1147FF',
        brand_color_secondary: activeTenant.brand_color_secondary || '#0B2341',
        logo_url: activeTenant.logo_url || '',
      }));
    }
  }, [activeTenant]);

  const uploadLogo = async () => {
    if (!logoFile) return;
    setUploadingLogo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: logoFile });
      setForm(prev => ({ ...prev, logo_url: file_url }));
      toast.success('Logo caricato');
    } catch (error) {
      toast.error('Errore upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const saveCompanySettings = async () => {
    setLoading(true);
    try {
      // Validate required fields
      const required = ['name', 'email', 'tax_id', 'country'];
      const missing = required.filter(field => !form[field]);
      
      if (missing.length > 0) {
        toast.error('Compila tutti i campi obbligatori');
        return;
      }

      // Upload logo if selected
      if (logoFile && !form.logo_url) {
        await uploadLogo();
      }

      // Create or update Company entity
      const companyData = {
        ...form,
        slug: form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        settings: {
          currency: 'EUR',
          language: form.language,
          timezone: form.timezone,
          date_format: 'DD/MM/YYYY',
          fiscal_year_start: '01/01',
        },
      };

      let companyId = activeTenant?.id;
      
      if (companyId) {
        // Update existing company
        await base44.entities.Company.update(companyId, companyData);
        toast.success('Azienda aggiornata');
      } else {
        // Create new company
        const result = await base44.entities.Company.create(companyData);
        companyId = result.id;
        toast.success('Azienda creata');
      }

      // Update tenant onboarding status
      await base44.functions.invoke('updateTenantStatus', {
        companyId,
        status: 'active',
        onboardingStep: 'company_completed',
      });

      // Refresh context to get updated data
      await refreshContext();

      toast.success('Configurazione azienda completata!');
      
      // Redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      console.error('Error saving company:', error);
      toast.error('Errore nel salvataggio: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Building2 className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Configurazione Azienda</h1>
        </div>
        <p className="text-sm text-gray-500">Completa i dati della tua azienda per attivare il tenant</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              s <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {s}
            </div>
            {s < 3 && <div className={`w-12 h-0.5 ${s < step ? 'bg-blue-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Company Info */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Dati Aziendali
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Azienda *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Es. Rossi Costruzioni SRL"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ragione Sociale *</label>
              <input
                type="text"
                value={form.legal_name}
                onChange={e => setForm(prev => ({ ...prev, legal_name: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Es. Rossi Mario SRL"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Partita IVA / Codice Fiscale *</label>
              <input
                type="text"
                value={form.tax_id}
                onChange={e => setForm(prev => ({ ...prev, tax_id: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="IT12345678901"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paese *</label>
              <select
                value={form.country}
                onChange={e => setForm(prev => ({ ...prev, country: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="IT">Italia</option>
                <option value="FR">Francia</option>
                <option value="DE">Germania</option>
                <option value="ES">Spagna</option>
                <option value="UK">Regno Unito</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="info@azienda.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="+39 02 1234567"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo</label>
              <input
                type="text"
                value={form.address}
                onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Via Roma 1, Milano"
              />
            </div>
          </div>
          <div className="flex justify-between pt-4">
            <button onClick={() => navigate('/dashboard')} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
              Annulla
            </button>
            <button onClick={nextStep} className="flex items-center gap-2 px-6 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">
              Avanti <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Branding */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Palette className="w-5 h-5 text-blue-600" />
            Branding & Personalizzazione
          </h2>
          
          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo Aziendale</label>
            <div className="flex items-center gap-4">
              {form.logo_url ? (
                <img src={form.logo_url} alt="Logo" className="w-20 h-20 object-contain border border-gray-200 rounded-lg p-2" />
              ) : (
                <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400">
                  <Building2 className="w-8 h-8" />
                </div>
              )}
              <div className="flex-1">
                <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files[0])} className="block w-full text-sm text-gray-500" />
                {logoFile && (
                  <button 
                    onClick={uploadLogo} 
                    disabled={uploadingLogo} 
                    className="mt-2 px-3 py-1.5 text-xs text-white rounded-lg font-medium disabled:opacity-40 bg-blue-600 hover:bg-blue-700"
                  >
                    {uploadingLogo ? 'Upload...' : 'Carica Logo'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Brand Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Colore Primario</label>
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  value={form.brand_color_primary} 
                  onChange={e => setForm(prev => ({ ...prev, brand_color_primary: e.target.value }))} 
                  className="w-10 h-10 border border-gray-200 rounded cursor-pointer" 
                />
                <input 
                  type="text" 
                  value={form.brand_color_primary} 
                  onChange={e => setForm(prev => ({ ...prev, brand_color_primary: e.target.value }))} 
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Colore Secondario</label>
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  value={form.brand_color_secondary} 
                  onChange={e => setForm(prev => ({ ...prev, brand_color_secondary: e.target.value }))} 
                  className="w-10 h-10 border border-gray-200 rounded cursor-pointer" 
                />
                <input 
                  type="text" 
                  value={form.brand_color_secondary} 
                  onChange={e => setForm(prev => ({ ...prev, brand_color_secondary: e.target.value }))} 
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg" 
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <p className="text-xs text-gray-500 mb-2">Anteprima Colori</p>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 text-sm text-white rounded" style={{ backgroundColor: form.brand_color_primary }}>
                Primary
              </div>
              <div className="px-4 py-2 text-sm text-white rounded" style={{ backgroundColor: form.brand_color_secondary }}>
                Secondary
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button onClick={prevStep} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
              Indietro
            </button>
            <button onClick={nextStep} className="flex items-center gap-2 px-6 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">
              Avanti <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Submit */}
      {step === 3 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Riepilogo e Conferma
          </h2>
          
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Nome Azienda</p>
              <p className="text-sm font-semibold text-gray-900">{form.name || '—'}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Partita IVA</p>
              <p className="text-sm font-semibold text-gray-900">{form.tax_id || '—'}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm font-semibold text-gray-900">{form.email || '—'}</p>
            </div>
            {form.logo_url && (
              <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-3">
                <p className="text-xs text-gray-500">Logo</p>
                <img src={form.logo_url} alt="Logo" className="w-8 h-8 object-contain" />
              </div>
            )}
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-medium">
              ✓ Configurazione quasi completata!
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Dopo il salvataggio verrai reindirizzato alla dashboard.
            </p>
          </div>

          <div className="flex justify-between pt-4">
            <button onClick={prevStep} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
              Indietro
            </button>
            <button 
              onClick={saveCompanySettings} 
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-40"
            >
              {loading ? 'Salvataggio...' : 'Completa Configurazione'} <CheckCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Debug Info */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-xs">
        <p className="font-semibold text-gray-700 mb-2">Debug Info:</p>
        <div className="grid grid-cols-2 gap-2 text-gray-600">
          <div>Active Tenant ID: <strong>{activeTenant?.id || 'N/A'}</strong></div>
          <div>Company Exists: <strong>{activeTenant ? 'Yes' : 'No'}</strong></div>
          <div>Step: <strong>{step}/3</strong></div>
          <div>Loading: <strong>{loading ? 'Yes' : 'No'}</strong></div>
        </div>
      </div>
    </div>
  );
}