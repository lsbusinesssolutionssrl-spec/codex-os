import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, TrendingUp, FileDown, FolderPlus, Trash2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { base44 } from '@/api/base44Client';
import StatusBadge from '../components/StatusBadge';

const STATUSES = ['Draft', 'To Review', 'Sent', 'Accepted', 'Rejected', 'Expired', 'Converted to Project'];
const TYPES = ['Bathroom', 'Full Home', 'Electrical System', 'Networking', 'Security', 'Maintenance', 'Other'];
const QUALITY = ['Essential', 'Smart', 'Intelligence'];

export default function EstimateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({});
  const [clients, setClients] = useState([]);
  const [properties, setProperties] = useState([]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [ests, cls, props] = await Promise.all([
        base44.entities.Estimate.filter({ id }),
        base44.entities.Client.list(),
        base44.entities.Property.list(),
      ]);
      if (ests[0]) setForm(ests[0]);
      setClients(cls); setProperties(props);
    };
    load();
  }, [id]);

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
    await base44.entities.Estimate.update(id, form);
    setSaving(false);
  };

  const deleteRecord = async () => {
    await base44.entities.Estimate.delete(id);
    navigate('/estimates');
  };

  const convertToProject = async () => {
    await base44.entities.Estimate.update(id, { ...form, status: 'Converted to Project' });
    const project = await base44.entities.Project.create({
      title: form.title,
      client_id: form.client_id,
      property_id: form.property_id,
      status: 'Approved',
      budget: form.revenue,
      notes: `Creato da preventivo: ${form.title}`,
    });
    navigate(`/projects/${project.id}`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const client = clients.find(c => c.id === form.client_id);
    const property = properties.find(p => p.id === form.property_id);

    // Header band
    doc.setFillColor(11, 35, 65); // navy #0B2341
    doc.rect(0, 0, 210, 38, 'F');
    // Orange accent line
    doc.setFillColor(245, 130, 32); // orange #F58220
    doc.rect(0, 38, 210, 3, 'F');
    // Logo text in header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text('CODEX SOLUTION', 20, 18);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 210, 230);
    doc.text('www.codexsolution.it', 20, 26);
    // Doc type top right
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(245, 130, 32);
    doc.text('PREVENTIVO', 150, 18);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 210, 230);
    doc.text(new Date().toLocaleDateString('it-IT'), 150, 26);

    // Title
    let y = 52;
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(11, 35, 65);
    doc.text(form.title || 'Preventivo', 20, y); y += 8;

    // Client + property info box
    doc.setFillColor(248, 249, 252);
    doc.rect(20, y, 170, client ? 22 : 12, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 90, 110);
    if (client) {
      doc.text(`Cliente: ${client.name}${client.company_name ? ' ' + client.company_name : ''}`, 25, y + 7);
      if (client.email) doc.text(`Email: ${client.email}`, 25, y + 13);
      if (client.phone) doc.text(`Tel: ${client.phone}`, 110, y + 7);
      if (property) doc.text(`Proprietà: ${property.property_name}`, 110, y + 13);
      y += 26;
    } else { y += 14; }

    // Blue section: riepilogo economico
    y += 4;
    doc.setFillColor(17, 71, 255);
    doc.rect(20, y, 170, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('RIEPILOGO ECONOMICO', 25, y + 5.5);
    y += 12;
    doc.setTextColor(30, 30, 30);
    const rows = [
      ['Ricavi Stimati', `€ ${(form.revenue || 0).toLocaleString('it-IT')}`],
      ['Costo Materiali', `€ ${(form.material_cost || 0).toLocaleString('it-IT')}`],
      ['Costo Manodopera', `€ ${(form.labor_cost || 0).toLocaleString('it-IT')}`],
      ['Altri Costi', `€ ${(form.other_costs || 0).toLocaleString('it-IT')}`],
    ];
    rows.forEach(([label, val], idx) => {
      if (idx % 2 === 0) { doc.setFillColor(248, 249, 252); doc.rect(20, y - 4, 170, 8, 'F'); }
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(60, 70, 90);
      doc.text(label, 25, y);
      doc.text(val, 160, y, { align: 'right' });
      y += 8;
    });
    // Margin row highlighted
    doc.setFillColor(11, 35, 65);
    doc.rect(20, y - 4, 170, 9, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(255, 255, 255);
    doc.text('Margine Lordo', 25, y + 1);
    doc.setTextColor(245, 130, 32);
    doc.text(`€ ${(form.gross_margin || 0).toLocaleString('it-IT')} (${form.gross_margin_pct || 0}%)`, 160, y + 1, { align: 'right' });
    y += 13;

    // Details
    if (form.estimate_type || form.quality_level || form.estimated_duration) {
      doc.setFillColor(17, 71, 255);
      doc.rect(20, y, 170, 8, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(255, 255, 255);
      doc.text('DETTAGLI INTERVENTO', 25, y + 5.5);
      y += 12;
      doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 70, 90);
      if (form.estimate_type) { doc.text(`Tipo: ${form.estimate_type}`, 25, y); y += 7; }
      if (form.quality_level) { doc.text(`Livello qualità: ${form.quality_level}`, 25, y); y += 7; }
      if (form.estimated_duration) { doc.text(`Durata stimata: ${form.estimated_duration}`, 25, y); y += 7; }
      if (form.payment_terms) { doc.text(`Condizioni di pagamento: ${form.payment_terms}`, 25, y); y += 7; }
      y += 3;
    }

    if (form.included_works) {
      doc.setFillColor(17, 71, 255);
      doc.rect(20, y, 170, 8, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(255, 255, 255);
      doc.text('LAVORI INCLUSI', 25, y + 5.5); y += 12;
      doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 70, 90);
      const lines = doc.splitTextToSize(form.included_works, 160);
      doc.text(lines, 25, y); y += lines.length * 6 + 5;
    }
    if (form.excluded_works) {
      doc.setFillColor(17, 71, 255);
      doc.rect(20, y, 170, 8, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(255, 255, 255);
      doc.text('LAVORI ESCLUSI', 25, y + 5.5); y += 12;
      doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 70, 90);
      const lines = doc.splitTextToSize(form.excluded_works, 160);
      doc.text(lines, 25, y); y += lines.length * 6 + 5;
    }

    // Footer
    doc.setFillColor(11, 35, 65);
    doc.rect(0, 282, 210, 15, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(180, 190, 210);
    doc.text('Codex Solution · Documento generato automaticamente', 105, 290, { align: 'center' });

    doc.save(`preventivo-${(form.title || 'codex').replace(/\s+/g, '-').toLowerCase()}.pdf`);
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
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium" style={{ backgroundColor: '#1147FF' }}>
            <Save className="w-4 h-4" />{saving ? 'Salvataggio...' : 'Salva'}
          </button>
          <button onClick={() => setConfirmDelete(true)} className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600">
            <Trash2 className="w-4 h-4" />
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
            <option value="">— Seleziona —</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.company_name}</option>)}
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
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Livello Qualità</label>
          <select value={form.quality_level || ''} onChange={e => set('quality_level', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white">
            <option value="">— Seleziona —</option>
            {QUALITY.map(q => <option key={q}>{q}</option>)}
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
        {(form.status === 'Accepted' || form.status === 'Sent') && (
          <button onClick={convertToProject} className="flex items-center gap-2 px-5 py-2 text-sm text-white rounded-lg font-medium" style={{ backgroundColor: '#10B981' }}>
            <FolderPlus className="w-4 h-4" /> Converti in Progetto
          </button>
        )}
      </div>
    </div>
  );
}