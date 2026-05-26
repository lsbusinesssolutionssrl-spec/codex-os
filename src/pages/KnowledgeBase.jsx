import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, BookOpen, Tag, Filter, ExternalLink, Trash2, Edit } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const CATEGORIES = ['Bathroom', 'Full Home', 'Electrical', 'Networking', 'Security', 'Roofing', 'Waterproofing', 'HVAC', 'Customer Management', 'Financial'];

export default function KnowledgeBase() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'Bathroom',
    project_id: '',
    problem: '',
    cause: '',
    solution: '',
    recommendations: '',
    lessons_learned: '',
    tags: [],
  });
  const [projects, setProjects] = useState([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const [kb, projs] = await Promise.all([
      base44.entities.KnowledgeBase.list('-created_date'),
      base44.entities.Project.list(),
    ]);
    setEntries(kb);
    setProjects(projs.filter(p => p.status === 'Delivered'));
  };

  const filtered = entries.filter(e => {
    const q = search.toLowerCase();
    const match = !q || 
      e.title?.toLowerCase().includes(q) || 
      e.problem?.toLowerCase().includes(q) ||
      e.solution?.toLowerCase().includes(q) ||
      e.tags?.some(t => t.toLowerCase().includes(q));
    return match && (!categoryFilter || e.category === categoryFilter);
  });

  const create = async () => {
    await base44.entities.KnowledgeBase.create({
      ...form,
      tags: form.tags.length > 0 ? form.tags : [tagInput].filter(Boolean),
    });
    await load();
    setShowModal(false);
    setForm({ title: '', category: 'Bathroom', project_id: '', problem: '', cause: '', solution: '', recommendations: '', lessons_learned: '', tags: [] });
    setTagInput('');
  };

  const deleteEntry = async (id) => {
    if (confirm('Eliminare questa voce?')) {
      await base44.entities.KnowledgeBase.delete(id);
      await load();
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm(f => ({ ...f, tags: [...f.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
          <p className="text-sm text-gray-500">{entries.length} lezioni apprese documentate</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium" style={{ backgroundColor: '#1147FF' }}>
          <Plus className="w-4 h-4" /> Nuova Lezione
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Cerca per titolo, problema, soluzione o tag..." 
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" 
          />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
          <option value="">Tutte le categorie</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filtered.map(entry => (
          <div key={entry.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                    {entry.category}
                  </span>
                  {entry.project_id && (
                    <button onClick={() => navigate(`/projects/${entry.project_id}`)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600">
                      <ExternalLink className="w-3 h-3" /> Vedi Progetto
                    </button>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{entry.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Problema</p>
                    <p className="text-gray-700">{entry.problem}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Causa</p>
                    <p className="text-gray-700">{entry.cause || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Soluzione</p>
                    <p className="text-gray-700">{entry.solution}</p>
                  </div>
                </div>
                {entry.recommendations && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-100 rounded-lg">
                    <p className="text-xs font-medium text-green-800 mb-1">Raccomandazioni</p>
                    <p className="text-sm text-green-700">{entry.recommendations}</p>
                  </div>
                )}
                {entry.lessons_learned && (
                  <div className="mt-3 p-3 bg-orange-50 border border-orange-100 rounded-lg">
                    <p className="text-xs font-medium text-orange-800 mb-1">Lessons Learned</p>
                    <p className="text-sm text-orange-700">{entry.lessons_learned}</p>
                  </div>
                )}
                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <Tag className="w-3 h-3 text-gray-400" />
                    {entry.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => deleteEntry(entry.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-16 text-center text-gray-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Nessuna voce trovata</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold text-gray-900">Nuova Lezione Appresa</h2>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Titolo *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Categoria *</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Progetto (opzionale)</label>
              <select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
                <option value="">— Nessun progetto —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Problema *</label>
              <textarea value={form.problem} onChange={e => setForm(f => ({ ...f, problem: e.target.value }))} rows={2} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Causa</label>
                <textarea value={form.cause} onChange={e => setForm(f => ({ ...f, cause: e.target.value }))} rows={2} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Soluzione *</label>
                <textarea value={form.solution} onChange={e => setForm(f => ({ ...f, solution: e.target.value }))} rows={2} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none resize-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Raccomandazioni</label>
              <textarea value={form.recommendations} onChange={e => setForm(f => ({ ...f, recommendations: e.target.value }))} rows={2} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none resize-none" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Lessons Learned</label>
              <textarea value={form.lessons_learned} onChange={e => setForm(f => ({ ...f, lessons_learned: e.target.value }))} rows={2} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none resize-none" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tags</label>
              <div className="flex gap-2">
                <input 
                  value={tagInput} 
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Aggiungi tag..." 
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" 
                />
                <button type="button" onClick={addTag} className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                  Aggiungi
                </button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {form.tags.map((tag, idx) => (
                    <span key={idx} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full flex items-center gap-1">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-red-600">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={create} disabled={!form.title || !form.problem || !form.solution} className="flex-1 py-2 text-sm text-white rounded-lg font-medium disabled:opacity-40" style={{ backgroundColor: '#1147FF' }}>
                Salva
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-600">
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}