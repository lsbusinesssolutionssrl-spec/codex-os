import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X, Camera, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StatusBadge from '../components/StatusBadge';

const STATUSES = ['To Do', 'In Progress', 'Done', 'Blocked'];
const CATEGORIES = ['Bathroom', 'Full Home', 'Electrical', 'Networking', 'Security', 'Roofing', 'Handover'];

export default function ChecklistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [items, projs] = await Promise.all([
        base44.entities.ChecklistItem.filter({ id }),
        base44.entities.Project.list(),
      ]);
      if (items[0]) { setItem(items[0]); setForm(items[0]); }
      setProjects(projs);
    };
    load();
  }, [id]);

  const save = async () => {
    setSaving(true);
    const updated = await base44.entities.ChecklistItem.update(id, form);
    setItem(updated);
    setForm(updated);
    setSaving(false);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const photos = [...(form.photos || []), file_url];
    setForm(f => ({ ...f, photos }));
    setUploading(false);
  };

  if (!item) return <div className="p-6 text-center text-gray-400">Caricamento...</div>;

  const projectName = projects.find(p => p.id === form.project_id)?.title;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/checklists')} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{item.title}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <StatusBadge status={item.status} />
            {projectName && <span className="text-xs text-gray-400">{projectName}</span>}
          </div>
        </div>
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium" style={{ backgroundColor: '#1147FF' }}>
          <Save className="w-3.5 h-3.5" /> {saving ? 'Salvataggio...' : 'Salva'}
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
            <label className="block text-xs font-medium text-gray-500 mb-1">Categoria</label>
            <select value={form.category || ''} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
              <option value="">—</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Progetto</label>
            <select value={form.project_id || ''} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
              <option value="">—</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Assegnato a</label>
            <input value={form.assigned_person || ''} onChange={e => setForm(f => ({ ...f, assigned_person: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Scadenza</label>
            <input type="date" value={form.due_date || ''} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Descrizione</label>
          <textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none resize-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Note</label>
          <textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none resize-none" />
        </div>

        {/* Anomaly flag */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={!!form.is_anomaly} onChange={e => setForm(f => ({ ...f, is_anomaly: e.target.checked }))} className="w-4 h-4 rounded border-gray-300" />
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span className="text-sm text-gray-700 font-medium">Segnala come anomalia</span>
          </div>
        </label>
      </div>

      {/* Photos */}
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
          <p className="text-sm text-gray-400 text-center py-4">Nessuna foto aggiunta</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {(form.photos || []).map((url, i) => (
              <div key={i} className="relative group">
                <img src={url} alt="" className="w-full h-24 object-cover rounded-lg" />
                <button onClick={() => setForm(f => ({ ...f, photos: f.photos.filter((_, j) => j !== i) }))}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 text-xs">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}