import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Camera, X, Trash2, Brain } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StatusBadge from '../components/StatusBadge';
import ContextualAIPanel from '../components/ai/ContextualAIPanel';

const STATUSES = ['Open', 'In Progress', 'Waiting Client', 'Resolved', 'Closed'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const ISSUE_TYPES = ['Water Leak', 'Electrical', 'Network', 'Security', 'Maintenance', 'Other'];

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [clients, setClients] = useState([]);
  const [properties, setProperties] = useState([]);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [tkts, cls, props] = await Promise.all([
        base44.entities.SupportTicket.filter({ id }),
        base44.entities.Client.list(),
        base44.entities.Property.list(),
      ]);
      if (tkts[0]) { setTicket(tkts[0]); setForm(tkts[0]); }
      setClients(cls);
      setProperties(props);
    };
    load();
  }, [id]);

  const save = async () => {
    setSaving(true);
    const updated = await base44.entities.SupportTicket.update(id, form);
    setTicket(updated);
    setForm(updated);
    setSaving(false);
  };

  const deleteRecord = async () => {
    await base44.entities.SupportTicket.delete(id);
    navigate('/tickets');
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, photos: [...(f.photos || []), file_url] }));
    setUploading(false);
  };

  if (!ticket) return <div className="p-6 text-center text-gray-400">Caricamento...</div>;

  if (confirmDelete) return (
    <div className="p-6 max-w-sm mx-auto mt-20 bg-white rounded-2xl border border-gray-200 shadow-lg text-center space-y-4">
      <Trash2 className="w-10 h-10 text-red-400 mx-auto" />
      <h2 className="font-bold text-gray-900">Elimina ticket?</h2>
      <p className="text-sm text-gray-500">Questa azione è irreversibile.</p>
      <div className="flex gap-2">
        <button onClick={deleteRecord} className="flex-1 py-2 text-sm text-white bg-red-500 rounded-lg font-medium hover:bg-red-600">Elimina</button>
        <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-600">Annulla</button>
      </div>
    </div>
  );

  const filteredProps = properties.filter(p => p.client_id === form.client_id);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/tickets')} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{ticket.title}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <StatusBadge status={ticket.status} />
            <StatusBadge status={ticket.priority} />
          </div>
        </div>
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium" style={{ backgroundColor: '#1147FF' }}>
          <Save className="w-3.5 h-3.5" /> {saving ? 'Salvataggio...' : 'Salva'}
        </button>
        <button onClick={() => setConfirmDelete(true)} className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600">
          <Trash2 className="w-4 h-4" />
        </button>
        <button onClick={() => setShowAIPanel(!showAIPanel)} className={`flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg transition-all ${showAIPanel ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}>
          <Brain className="w-3.5 h-3.5" /> AI
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Titolo</label>
          <input value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Stato</label>
            <select value={form.status || ''} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Priorità</label>
            <select value={form.priority || ''} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tipo Problema</label>
            <select value={form.issue_type || ''} onChange={e => setForm(f => ({ ...f, issue_type: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
              <option value="">—</option>
              {ISSUE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tecnico Assegnato</label>
            <input value={form.assigned_technician || ''} onChange={e => setForm(f => ({ ...f, assigned_technician: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Cliente</label>
            <select value={form.client_id || ''} onChange={e => setForm(f => ({ ...f, client_id: e.target.value, property_id: '' }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
              <option value="">—</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Proprietà</label>
            <select value={form.property_id || ''} onChange={e => setForm(f => ({ ...f, property_id: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
              <option value="">—</option>
              {filteredProps.map(p => <option key={p.id} value={p.id}>{p.property_name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Note</label>
          <textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none resize-none" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Foto</h2>
          <label className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <Camera className="w-3.5 h-3.5" />
            {uploading ? 'Caricamento...' : 'Aggiungi Foto'}
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
          </label>
        </div>
        {(form.photos || []).length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Nessuna foto</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {(form.photos || []).map((url, i) => (
              <div key={i} className="relative group">
                <img src={url} alt="" className="w-full h-24 object-cover rounded-lg" />
                <button onClick={() => setForm(f => ({ ...f, photos: f.photos.filter((_, j) => j !== i) }))}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Copilot Panel */}
      {showAIPanel && <ContextualAIPanel entityType="ticket" entityId={id} onClose={() => setShowAIPanel(false)} />}
    </div>
  );
}