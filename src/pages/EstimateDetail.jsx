import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, FileDown, FolderPlus, Trash2, PenLine, CheckCircle2, Brain } from 'lucide-react';
import SignaturePad from '../components/SignaturePad';
import { base44 } from '@/api/base44Client';
import StatusBadge from '../components/StatusBadge';
import { toast } from 'sonner';
import ContextualAIPanel from '../components/ai/ContextualAIPanel';
import { useGlobalContext } from '@/lib/GlobalContextEngine';
import { getClients, getClientDisplayName } from '@/lib/ClientService';
import { getProperties } from '@/lib/PropertyService';
import { getOptions, t } from '@/lib/I18n';

const STATUSES = getOptions('estimate_status');
const TYPES = getOptions('estimate_type');
const QUALITY = getOptions('quality_level');

export default function EstimateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeTenant } = useGlobalContext();
  const [form, setForm] = useState({});
  const [clients, setClients] = useState([]);
  const [properties, setProperties] = useState([]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);

  useEffect(() => {
    if (!activeTenant?.id) return;
    const load = async () => {
      const [ests, cls, props] = await Promise.all([
        base44.entities.Estimate.filter({ id }),
        getClients(activeTenant.id),
        getProperties(activeTenant.id),
      ]);
      if (ests[0]) setForm(ests[0]);
      setClients(cls);
      setProperties(props);
    };
    load();
  }, [id, activeTenant?.id]);

  const set = (key, value) => {
    setForm(f => {
      const updated = { ...f, [key]: value };
      const rev = Number(updated.revenue) || 0;
      const mat = Number(updated.material_cost) || 0;
      const lab = Number(updated.labor_cost) || 0;
      const oth = Number(updated.other_costs) || 0;
      const gm = rev - mat - lab - oth;
      updated.gross_margin = gm;
      updated.gross_margin_pct = rev > 0 ? parseFloat(((gm / rev) * 100).toFixed(2)) : 0;
      return updated;
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        company_id: activeTenant?.id,
        revenue: Number(form.revenue) || 0,
        material_cost: Number(form.material_cost) || 0,
        labor_cost: Number(form.labor_cost) || 0,
        other_costs: Number(form.other_costs) || 0,
        total_costs: (Number(form.material_cost) || 0) + (Number(form.labor_cost) || 0) + (Number(form.other_costs) || 0),
        gross_margin: Number(form.gross_margin) || 0,
        gross_margin_pct: Number(form.gross_margin_pct) || 0,
      };
      const updated = await base44.entities.Estimate.update(id, payload);
      setForm(updated);
      toast.success('Preventivo salvato correttamente.');
    } catch (err) {
      console.error('[EstimateDetail] Save error:', err);
      toast.error('Errore salvataggio preventivo: ' + (err.message || 'Riprova'));
    } finally {
      setSaving(false);
    }
  };

  const deleteRecord = async () => {
    await base44.entities.Estimate.delete(id);
    navigate('/estimates');
  };

  const convertToProject = async () => {
    try {
      const response = await base44.functions.invoke('convertEstimateToProject', { estimate_id: id });
      navigate(`/projects/${response.data.project_id}`);
    } catch (error) {
      console.error('Error converting to project:', error);
      alert('Errore nella conversione: ' + (error.message || 'Riprova'));
    }
  };

  const exportPDF = async () => {
    try {
      const response = await base44.functions.invoke('generateEstimatePDF', { estimate_id: id });
      const { pdf, filename } = response.data;
      
      // Create download link
      const link = document.createElement('a');
      link.href = pdf;
      link.download = filename || 'preventivo.pdf';
      link.click();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Errore nella generazione del PDF');
    }
  };

  const handleSignatureSave = async (dataUrl) => {
    setUploadingSignature(true);
    // Convert dataUrl to File and upload
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], 'firma.png', { type: 'image/png' });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const updated = await base44.entities.Estimate.update(id, {
      ...form,
      signature_url: file_url,
      signed_at: new Date().toISOString(),
      status: 'Accepted',
    });
    setForm(updated);
    setShowSignature(false);
    setUploadingSignature(false);
  };

  const clientProperties = properties.filter(p => p.client_id === form.client_id);
  const marginColor = (form.gross_margin_pct || 0) >= 30 ? 'text-green-600' : (form.gross_margin_pct || 0) >= 15 ? 'text-orange-500' : 'text-red-500';

  if (confirmDelete) return (
    <div className="p-6 max-w-sm mx-auto mt-20 bg-white rounded-2xl border border-gray-200 shadow-lg text-center space-y-4">
      <Trash2 className="w-10 h-10 text-red-400 mx-auto" />
      <h2 className="font-bold text-gray-900">Elimina preventivo?</h2>
      <p className="text-sm text-gray-500">Questa azione è irreversibile.</p>
      <div className="flex gap-2">
        <button onClick={deleteRecord} className="flex-1 py-2 text-sm text-white bg-red-500 rounded-lg font-medium hover:bg-red-600">Elimina</button>
        <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-600">Annulla</button>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/estimates')} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div className="flex-1">
          <input
            value={form.title || ''}
            onChange={e => set('title', e.target.value)}
            className="text-xl font-bold text-gray-900 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <select value={form.status || 'Draft'} onChange={e => set('status', e.target.value)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
            {STATUSES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
          </select>
          <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium" style={{ backgroundColor: '#1147FF' }}>
            <Save className="w-4 h-4" />{saving ? 'Salvataggio...' : 'Salva'}
          </button>
          <button onClick={() => setConfirmDelete(true)} className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600">
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={() => setShowAIPanel(!showAIPanel)} className={`flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg transition-all ${showAIPanel ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}>
            <Brain className="w-3.5 h-3.5" /> AI
          </button>
        </div>
      </div>

      {/* Margin Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Ricavi', value: form.revenue, prefix: '€', color: '#1147FF' },
          { label: 'Costi Totali', value: (Number(form.material_cost) || 0) + (Number(form.labor_cost) || 0) + (Number(form.other_costs) || 0), prefix: '€', color: '#EF4444' },
          { label: 'Margine Lordo', value: form.gross_margin, prefix: '€', color: '#10B981' },
          { label: 'Margine %', value: form.gross_margin_pct, suffix: '%', color: (form.gross_margin_pct || 0) >= 30 ? '#10B981' : '#F59E0B' },
        ].map(({ label, value, prefix, suffix, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-xs text-gray-500 font-medium">{label}</div>
            <div className="text-xl font-bold mt-1" style={{ color }}>
              {prefix}{typeof value === 'number' ? value.toLocaleString() : '0'}{suffix}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Cliente</label>
          <select value={form.client_id || ''} onChange={e => set('client_id', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white">
            <option value="">— Seleziona cliente —</option>
            {clients.length === 0 && <option disabled>Nessun cliente disponibile. Crea prima un cliente.</option>}
            {clients.map(c => <option key={c.id} value={c.id}>{getClientDisplayName(c)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Proprietà</label>
          <select value={form.property_id || ''} onChange={e => set('property_id', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white">
            <option value="">— Seleziona —</option>
            {clientProperties.map(p => <option key={p.id} value={p.id}>{p.property_name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Tipo Lavoro</label>
          <select value={form.estimate_type || ''} onChange={e => set('estimate_type', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white">
            <option value="">— Seleziona —</option>
            {TYPES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Livello Qualità</label>
          <select value={form.quality_level || ''} onChange={e => set('quality_level', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white">
            <option value="">— Seleziona —</option>
            {QUALITY.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        {[['revenue', 'Ricavi Stimati (€)'], ['material_cost', 'Costo Materiali (€)'], ['labor_cost', 'Costo Manodopera (€)'], ['other_costs', 'Altri Costi (€)']].map(([k, label]) => (
          <div key={k}>
            <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
            <input type="number" value={form[k] || ''} onChange={e => set(k, parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        ))}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Durata Stimata</label>
          <input value={form.estimated_duration || ''} onChange={e => set('estimated_duration', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" placeholder="es. 2 settimane" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Condizioni di Pagamento</label>
          <input value={form.payment_terms || ''} onChange={e => set('payment_terms', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Lavori Inclusi</label>
          <textarea value={form.included_works || ''} onChange={e => set('included_works', e.target.value)} rows={3} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none resize-none" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Lavori Esclusi</label>
          <textarea value={form.excluded_works || ''} onChange={e => set('excluded_works', e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none resize-none" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Note</label>
          <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none resize-none" />
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2 text-sm text-white rounded-lg font-medium" style={{ backgroundColor: '#1147FF' }}>
          <Save className="w-4 h-4" /> Salva Preventivo
        </button>
        <button onClick={exportPDF} className="flex items-center gap-2 px-5 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
          <FileDown className="w-4 h-4" /> Esporta PDF
        </button>
        {form.status === 'Accepted' && (
          <button onClick={convertToProject} className="flex items-center gap-2 px-5 py-2 text-sm text-white rounded-lg font-medium" style={{ backgroundColor: '#10B981' }}>
            <FolderPlus className="w-4 h-4" /> Converti in Progetto
          </button>
        )}
        {form.status === 'Sent' && !form.signature_url && (
          <button onClick={() => setShowSignature(true)} className="flex items-center gap-2 px-5 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50">
            <PenLine className="w-4 h-4" /> Raccogliere Firma
          </button>
        )}
      </div>

      {/* Firma digitale */}
      {form.signature_url ? (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <h2 className="font-semibold text-gray-900">Preventivo Firmato</h2>
            {form.signed_at && <span className="text-xs text-gray-400 ml-auto">{new Date(form.signed_at).toLocaleDateString('it-IT')}</span>}
          </div>
          <img src={form.signature_url} alt="Firma cliente" className="max-h-24 border border-gray-100 rounded-lg p-2 bg-gray-50" />
        </div>
      ) : showSignature ? (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">Fai firmare il cliente sul dispositivo. La firma verrà salvata e il preventivo verrà impostato su <strong>Accepted</strong>.</p>
          {uploadingSignature ? (
            <div className="flex items-center justify-center h-32 bg-gray-50 rounded-xl border border-gray-200">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : (
            <SignaturePad onSave={handleSignatureSave} onCancel={() => setShowSignature(false)} />
          )}
        </div>
      ) : null}

      {/* AI Copilot Panel */}
      {showAIPanel && <ContextualAIPanel entityType="estimate" entityId={id} onClose={() => setShowAIPanel(false)} />}
    </div>
  );
}