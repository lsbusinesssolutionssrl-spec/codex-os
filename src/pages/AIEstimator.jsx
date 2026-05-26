import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Save, Sparkles, Upload, X, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import StatusBadge from '../components/StatusBadge';

const ESTIMATE_TYPES = ['Bathroom', 'Full Home', 'Electrical System', 'Networking', 'Security', 'Roofing', 'Maintenance', 'Other'];
const QUALITY_LEVELS = ['Essential', 'Smart', 'Intelligence'];
const PROPERTY_TYPES = ['Apartment', 'Villa', 'Office', 'Industrial Building', 'Commercial Space'];
const URGENCY = ['Standard', 'Urgent'];

export default function AIEstimator() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [clients, setClients] = useState([]);
  const [properties, setProperties] = useState([]);
  const [presets, setPresets] = useState([]);
  const [form, setForm] = useState({
    client_id: '',
    property_id: '',
    estimate_type: '',
    quality_level: '',
    square_meters: '',
    number_of_bathrooms: 1,
    number_of_rooms: 3,
    property_type: '',
    location: '',
    urgency: 'Standard',
    notes: '',
    survey_photos: [],
  });
  const [calculatedPrice, setCalculatedPrice] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [cls, props, prs] = await Promise.all([
        base44.entities.Client.list(),
        base44.entities.Property.list(),
        base44.entities.EstimatePreset.filter({ is_active: true }),
      ]);
      setClients(cls);
      setProperties(props);
      setPresets(prs);
    };
    load();
  }, []);

  useEffect(() => {
    // Auto-calculate price based on preset
    if (form.estimate_type && form.quality_level) {
      const preset = presets.find(p => 
        p.estimate_type === form.estimate_type && 
        p.quality_level === form.quality_level
      );
      if (preset) {
        const basePrice = preset.base_price;
        const materialCost = basePrice * (preset.material_cost_pct / 100);
        const laborCost = basePrice * (preset.labor_cost_pct / 100);
        const equipmentCost = basePrice * (preset.equipment_cost_pct / 100);
        const subcontractorCost = basePrice * (preset.subcontractor_cost_pct / 100);
        const otherCost = basePrice * (preset.other_cost_pct / 100);
        const totalCosts = materialCost + laborCost + equipmentCost + subcontractorCost + otherCost;
        const grossMargin = basePrice - totalCosts;
        const grossMarginPct = basePrice > 0 ? (grossMargin / basePrice) * 100 : 0;

        setCalculatedPrice({
          revenue: basePrice,
          material_cost: materialCost,
          labor_cost: laborCost,
          equipment_cost: equipmentCost,
          subcontractor_cost: subcontractorCost,
          other_costs: otherCost,
          total_costs: totalCosts,
          gross_margin: grossMargin,
          gross_margin_pct: grossMarginPct,
          preset_name: preset.name,
        });
      }
    }
  }, [form.estimate_type, form.quality_level, presets]);

  const set = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
  };

  const handlePhotoUpload = async (file) => {
    setUploadingPhoto(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, survey_photos: [...(f.survey_photos || []), file_url] }));
    setUploadingPhoto(false);
  };

  const handlePhotoRemove = (url) => {
    setForm(f => ({ ...f, survey_photos: (f.survey_photos || []).filter(u => u !== url) }));
  };

  const generateScopeOfWork = async () => {
    // Placeholder for AI generation - in real implementation, call InvokeLLM
    const preset = presets.find(p => 
      p.estimate_type === form.estimate_type && 
      p.quality_level === form.quality_level
    );
    
    if (preset) {
      setForm(f => ({
        ...f,
        project_summary: `Ristrutturazione ${form.estimate_type} livello ${form.quality_level} per ${form.property_type || 'proprietà'} di ${form.square_meters || '?'} mq.`,
        included_works: preset.included_works,
        excluded_works: preset.excluded_works,
        payment_terms: preset.payment_terms,
        warranty_notes: preset.warranty_notes,
        estimated_duration: preset.estimated_duration,
      }));
    }
  };

  const saveEstimate = async () => {
    setSaving(true);
    const estimateData = {
      ...form,
      ...calculatedPrice,
      title: `${form.estimate_type} - ${form.quality_level} - ${clients.find(c => c.id === form.client_id)?.name || 'Nuovo Preventivo'}`,
      status: 'Draft',
    };
    const created = await base44.entities.Estimate.create(estimateData);
    setSaving(false);
    navigate(`/estimates/${created.id}`);
  };

  const clientProperties = properties.filter(p => p.client_id === form.client_id);
  const selectedPreset = presets.find(p => 
    p.estimate_type === form.estimate_type && 
    p.quality_level === form.quality_level
  );

  const steps = [
    { num: 1, label: 'Cliente' },
    { num: 2, label: 'Proprietà' },
    { num: 3, label: 'Tipo Lavoro' },
    { num: 4, label: 'Dettagli' },
    { num: 5, label: 'Foto' },
    { num: 6, label: 'Riepilogo' },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/estimates')} className="p-2 rounded-lg hover:bg-gray-100">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6" style={{ color: '#1147FF' }} />
            AI Estimator
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Crea preventivi professionali con wizard guidato</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4">
        {steps.map((s, idx) => (
          <div key={s.num} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= s.num ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {s.num}
              </div>
              <span className={`text-xs mt-1 ${step >= s.num ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`w-12 h-0.5 mx-2 ${step > s.num ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <Card className="p-6">
        {/* Step 1: Client */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Seleziona Cliente</h2>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Cliente *</label>
              <select value={form.client_id} onChange={e => set('client_id', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
                <option value="">— Seleziona —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.company_name}</option>)}
              </select>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!form.client_id} className="bg-blue-600 hover:bg-blue-700">
                Avanti <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Property */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Seleziona Proprietà</h2>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Proprietà</label>
              <select value={form.property_id} onChange={e => set('property_id', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
                <option value="">— Nessuna / Nuova —</option>
                {clientProperties.map(p => <option key={p.id} value={p.id}>{p.property_name}</option>)}
              </select>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Indietro
              </Button>
              <Button onClick={() => setStep(3)} className="bg-blue-600 hover:bg-blue-700">
                Avanti <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Estimate Type */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Tipo di Lavoro e Qualità</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Tipo Preventivo *</label>
                <select value={form.estimate_type} onChange={e => set('estimate_type', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
                  <option value="">— Seleziona —</option>
                  {ESTIMATE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Livello Qualità *</label>
                <select value={form.quality_level} onChange={e => set('quality_level', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
                  <option value="">— Seleziona —</option>
                  {QUALITY_LEVELS.map(q => <option key={q}>{q}</option>)}
                </select>
              </div>
            </div>
            {calculatedPrice && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-blue-900">Prezzo Stimato</span>
                  <span className="text-2xl font-bold text-blue-700">€{calculatedPrice.revenue.toLocaleString('it-IT')}</span>
                </div>
                <div className="text-xs text-blue-700">
                  <div className="flex justify-between"><span>Materiali:</span><span>€{calculatedPrice.material_cost.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Manodopera:</span><span>€{calculatedPrice.labor_cost.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Totale Costi:</span><span>€{calculatedPrice.total_costs.toLocaleString()}</span></div>
                  <div className="flex justify-between font-semibold mt-1 pt-1 border-t border-blue-200">
                    <span>Margine:</span>
                    <span className={calculatedPrice.gross_margin_pct >= 35 ? 'text-green-600' : calculatedPrice.gross_margin_pct >= 25 ? 'text-orange-600' : 'text-red-600'}>
                      {calculatedPrice.gross_margin_pct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Indietro
              </Button>
              <Button onClick={() => setStep(4)} disabled={!form.estimate_type || !form.quality_level} className="bg-blue-600 hover:bg-blue-700">
                Avanti <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Details */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Dettagli Proprietà</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Superficie (mq)</label>
                <input type="number" value={form.square_meters} onChange={e => set('square_meters', parseFloat(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Tipo Proprietà</label>
                <select value={form.property_type} onChange={e => set('property_type', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
                  <option value="">— Seleziona —</option>
                  {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Numero Bagni</label>
                <input type="number" value={form.number_of_bathrooms} onChange={e => set('number_of_bathrooms', parseInt(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Numero Stanze</label>
                <input type="number" value={form.number_of_rooms} onChange={e => set('number_of_rooms', parseInt(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Località</label>
                <input value={form.location} onChange={e => set('location', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Urgenza</label>
                <select value={form.urgency} onChange={e => set('urgency', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
                  {URGENCY.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Note</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none resize-none" />
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Indietro
              </Button>
              <Button onClick={() => setStep(5)} className="bg-blue-600 hover:bg-blue-700">
                Avanti <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Photos */}
        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Foto Sopralluogo</h2>
            <p className="text-sm text-gray-500">Carica foto della proprietà per supportare il preventivo</p>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={e => { if (e.target.files[0]) handlePhotoUpload(e.target.files[0]); }}
                className="hidden"
                id="photo-upload"
              />
              <label htmlFor="photo-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <span className="text-sm text-gray-600">Clicca per caricare foto</span>
              </label>
            </div>
            {form.survey_photos && form.survey_photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {form.survey_photos.map(url => (
                  <div key={url} className="relative group">
                    <img src={url} alt="Survey" className="w-full h-24 object-cover rounded-lg" />
                    <button onClick={() => handlePhotoRemove(url)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(4)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Indietro
              </Button>
              <Button onClick={() => setStep(6)} className="bg-blue-600 hover:bg-blue-700">
                Avanti <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 6: Summary */}
        {step === 6 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Riepilogo e Generazione</h2>
            
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between"><span className="text-sm text-gray-600">Cliente:</span><span className="text-sm font-medium">{clients.find(c => c.id === form.client_id)?.name}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-600">Tipo:</span><span className="text-sm font-medium">{form.estimate_type} - {form.quality_level}</span></div>
              {form.square_meters && <div className="flex justify-between"><span className="text-sm text-gray-600">Superficie:</span><span className="text-sm font-medium">{form.square_meters} mq</span></div>}
              {form.property_type && <div className="flex justify-between"><span className="text-sm text-gray-600">Tipo:</span><span className="text-sm font-medium">{form.property_type}</span></div>}
            </div>

            {calculatedPrice && (
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Preventivo Economico</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Ricavi:</span><span className="font-semibold">€{calculatedPrice.revenue.toLocaleString('it-IT')}</span></div>
                  <div className="flex justify-between text-gray-600"><span>Materiali:</span><span>€{calculatedPrice.material_cost.toLocaleString()}</span></div>
                  <div className="flex justify-between text-gray-600"><span>Manodopera:</span><span>€{calculatedPrice.labor_cost.toLocaleString()}</span></div>
                  <div className="flex justify-between text-gray-600"><span>Attrezzature:</span><span>€{calculatedPrice.equipment_cost.toLocaleString()}</span></div>
                  <div className="flex justify-between text-gray-600"><span>Subappalti:</span><span>€{calculatedPrice.subcontractor_cost.toLocaleString()}</span></div>
                  <div className="flex justify-between text-gray-600"><span>Altri:</span><span>€{calculatedPrice.other_costs.toLocaleString()}</span></div>
                  <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-semibold">
                    <span>Totale Costi:</span>
                    <span>€{calculatedPrice.total_costs.toLocaleString('it-IT')}</span>
                  </div>
                  <div className={`flex justify-between font-bold ${calculatedPrice.gross_margin_pct >= 35 ? 'text-green-600' : calculatedPrice.gross_margin_pct >= 25 ? 'text-orange-600' : 'text-red-600'}`}>
                    <span>Margine Lordo:</span>
                    <span>€{calculatedPrice.gross_margin.toLocaleString()} ({calculatedPrice.gross_margin_pct.toFixed(1)}%)</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              <Button onClick={generateScopeOfWork} variant="outline" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Genera Scope of Work
              </Button>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(5)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Indietro
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate('/estimates')}>
                  Annulla
                </Button>
                <Button onClick={saveEstimate} disabled={saving} className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
                  <Save className="w-4 h-4" /> {saving ? 'Salvataggio...' : 'Salva Preventivo'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}