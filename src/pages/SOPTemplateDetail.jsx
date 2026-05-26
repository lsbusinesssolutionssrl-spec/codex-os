import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, Edit2, X, Play } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const CATEGORIES = ['Bathroom', 'Full Home', 'Electrical', 'Networking', 'Security', 'Roofing', 'Handover'];

export default function SOPTemplateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [projects, setProjects] = useState([]);
  const [newItem, setNewItem] = useState({ title: '', description: '' });
  const [addingItem, setAddingItem] = useState(false);
  const [applyModal, setApplyModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');
  const [applying, setApplying] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.SOPTemplate.filter({ id }),
      base44.entities.Project.list(),
    ]).then(([ts, ps]) => {
      if (ts[0]) { setTemplate(ts[0]); setForm(ts[0]); }
      setProjects(ps);
    });
  }, [id]);

  const save = async () => {
    const updated = await base44.entities.SOPTemplate.update(id, form);
    setTemplate(updated); setForm(updated); setEditing(false);
  };

  const addItem = async () => {
    if (!newItem.title.trim()) return;
    const items = [...(template.items || []), { ...newItem, id: Date.now().toString() }];
    const updated = await base44.entities.SOPTemplate.update(id, { items });
    setTemplate(updated); setForm(updated);
    setNewItem({ title: '', description: '' }); setAddingItem(false);
  };

  const removeItem = async (itemId) => {
    const items = (template.items || []).filter(i => i.id !== itemId);
    const updated = await base44.entities.SOPTemplate.update(id, { items });
    setTemplate(updated); setForm(updated);
  };

  const applyToProject = async () => {
    if (!selectedProject) return;
    setApplying(true);
    await Promise.all((template.items || []).map(item =>
      base44.entities.ChecklistItem.create({
        title: item.title,
        description: item.description || '',
        category: template.category,
        project_id: selectedProject,
        status: 'To Do',
      })
    ));
    setApplying(false);
    setApplyModal(false);
    navigate(`/projects/${selectedProject}`);
  };

  const deleteTemplate = async () => {
    await base44.entities.SOPTemplate.delete(id);
    navigate('/sop');
  };

  if (!template) return <div className="p-6 text-center text-gray-400">Caricamento...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/sop')} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div className="flex-1">
          {editing ? (
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="text-xl font-bold text-gray-900 border-b border-blue-400 outline-none w-full bg-transparent" />
          ) : (
            <h1 className="text-xl font-bold text-gray-900">{template.title}</h1>
          )}
          <p className="text-xs text-gray-400 mt-0.5">{template.category}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setApplyModal(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm text-white rounded-lg font-medium" style={{ backgroundColor: '#10B981' }}>
            <Play className="w-3.5 h-3.5" /> Applica a Progetto
          </button>
          {!editing ? (
            <>
              <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                <Edit2 className="w-3.5 h-3.5" /> Modifica
              </button>
              <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button onClick={save} className="flex items-center gap-2 px-3 py-1.5 text-sm text-white rounded-lg" style={{ backgroundColor: '#1147FF' }}>
                <Save className="w-3.5 h-3.5" /> Salva
              </button>
              <button onClick={() => { setEditing(false); setForm(template); }} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </>
          )}
        </div>
      </div>

      {/* Meta */}
      {editing && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Categoria</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Descrizione</label>
            <textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none resize-none" />
          </div>
        </div>
      )}

      {template.description && !editing && (
        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">{template.description}</div>
      )}

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Voci Procedura <span className="text-gray-400 font-normal text-sm">({(template.items || []).length})</span></h2>
          <button onClick={() => setAddingItem(true)} className="flex items-center gap-1 px-2 py-1 text-xs text-white rounded-lg" style={{ backgroundColor: '#1147FF' }}>
            <Plus className="w-3 h-3" /> Aggiungi
          </button>
        </div>

        <div className="space-y-2">
          {(template.items || []).length === 0 && !addingItem && (
            <p className="text-sm text-gray-400 text-center py-8">Nessuna voce. Aggiungi i passi della procedura.</p>
          )}
          {(template.items || []).map((item, idx) => (
            <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 group">
              <div className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0 mt-0.5">{idx + 1}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{item.title}</p>
                {item.description && <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>}
              </div>
              <button onClick={() => removeItem(item.id)} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {addingItem && (
            <div className="border border-blue-200 rounded-lg p-3 bg-blue-50 space-y-2">
              <input
                autoFocus
                value={newItem.title}
                onChange={e => setNewItem(i => ({ ...i, title: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') addItem(); if (e.key === 'Escape') setAddingItem(false); }}
                placeholder="Titolo voce procedura..."
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white"
              />
              <input
                value={newItem.description}
                onChange={e => setNewItem(i => ({ ...i, description: e.target.value }))}
                placeholder="Descrizione (opzionale)..."
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white"
              />
              <div className="flex gap-2">
                <button onClick={addItem} className="px-3 py-1.5 text-xs text-white rounded-lg" style={{ backgroundColor: '#1147FF' }}>Aggiungi</button>
                <button onClick={() => { setAddingItem(false); setNewItem({ title: '', description: '' }); }} className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg bg-white">Annulla</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Apply modal */}
      {applyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h2 className="font-bold text-gray-900">Applica Template a Progetto</h2>
            <p className="text-sm text-gray-500">Verranno create {(template.items || []).length} voci checklist nel progetto selezionato.</p>
            <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none">
              <option value="">Seleziona progetto...</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={applyToProject} disabled={!selectedProject || applying} className="flex-1 py-2 text-sm text-white rounded-lg font-medium disabled:opacity-50" style={{ backgroundColor: '#10B981' }}>
                {applying ? 'Applicando...' : 'Applica'}
              </button>
              <button onClick={() => setApplyModal(false)} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-600">Annulla</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-xl">
            <Trash2 className="w-10 h-10 text-red-400 mx-auto" />
            <h2 className="font-bold text-gray-900">Elimina template?</h2>
            <div className="flex gap-2">
              <button onClick={deleteTemplate} className="flex-1 py-2 text-sm text-white bg-red-500 rounded-lg font-medium">Elimina</button>
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-600">Annulla</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}