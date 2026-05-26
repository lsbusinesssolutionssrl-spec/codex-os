import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Save, X, Plus, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StatusBadge from '../components/StatusBadge';

const STATUSES = ['Lead', 'Survey', 'Estimate', 'Approved', 'In Progress', 'Testing', 'Delivered', 'Guardian Active'];

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [client, setClient] = useState(null);
  const [property, setProperty] = useState(null);
  const [clients, setClients] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    const load = async () => {
      const [projs, cls, checks] = await Promise.all([
        base44.entities.Project.filter({ id }),
        base44.entities.Client.list(),
        base44.entities.ChecklistItem.filter({ project_id: id }),
      ]);
      if (projs[0]) {
        setProject(projs[0]);
        setForm(projs[0]);
        const c = cls.find(c => c.id === projs[0].client_id);
        setClient(c);
        if (projs[0].property_id) {
          const props = await base44.entities.Property.filter({ id: projs[0].property_id });
          setProperty(props[0]);
        }
      }
      setClients(cls);
      setChecklists(checks);
    };
    load();
  }, [id]);

  const save = async () => {
    const updated = await base44.entities.Project.update(id, form);
    setProject(updated);
    setEditing(false);
  };

  const field = (k, label, type = 'text', options = null) => (
    <div key={k}>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {options ? (
        <select value={form[k] || ''} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none">
          <option value="">—</option>
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={form[k] || ''} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
      )}
    </div>
  );

  if (!project) return <div className="p-6 text-center text-gray-400">Caricamento...</div>;

  const doneCount = checklists.filter(c => c.status === 'Done').length;
  const progress = checklists.length > 0 ? Math.round((doneCount / checklists.length) * 100) : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/projects')} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{project.title}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <StatusBadge status={project.status} />
            {client && <span className="text-xs text-gray-400">{client.name}</span>}
            {property && <span className="text-xs text-gray-400">· {property.property_name}</span>}
          </div>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            <Edit2 className="w-3.5 h-3.5" /> Modifica
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={save} className="flex items-center gap-2 px-3 py-1.5 text-sm text-white rounded-lg" style={{ backgroundColor: '#1147FF' }}>
              <Save className="w-3.5 h-3.5" /> Salva
            </button>
            <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="bg-white rounded-xl border border-gray-200 p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('title', 'Titolo')}
          {field('status', 'Stato', 'text', STATUSES)}
          {field('project_manager', 'Project Manager')}
          {field('start_date', 'Data Inizio', 'date')}
          {field('expected_end_date', 'Data Fine Prevista', 'date')}
          {field('budget', 'Budget (€)', 'number')}
          {field('actual_costs', 'Costi Effettivi (€)', 'number')}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Note</label>
            <textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none resize-none" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Budget', value: project.budget ? `€${project.budget.toLocaleString('it-IT')}` : '—' },
            { label: 'Costi Effettivi', value: project.actual_costs ? `€${project.actual_costs.toLocaleString('it-IT')}` : '—' },
            { label: 'Inizio', value: project.start_date ? new Date(project.start_date).toLocaleDateString('it-IT') : '—' },
            { label: 'Fine Prevista', value: project.expected_end_date ? new Date(project.expected_end_date).toLocaleDateString('it-IT') : '—' },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">{kpi.label}</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{kpi.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Checklist Progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Avanzamento Checklist</h2>
          <span className="text-sm text-gray-500">{doneCount}/{checklists.length} completate</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
          <div className="h-2 rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: '#1147FF' }} />
        </div>
        <div className="space-y-2">
          {checklists.slice(0, 8).map(c => (
            <div key={c.id} onClick={() => navigate(`/checklists/${c.id}`)} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.status === 'Done' ? 'bg-green-500' : c.status === 'Blocked' ? 'bg-red-400' : c.status === 'In Progress' ? 'bg-blue-500' : 'bg-gray-300'}`} />
              <span className={`text-sm flex-1 ${c.status === 'Done' ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{c.title}</span>
              <StatusBadge status={c.status} />
            </div>
          ))}
          {checklists.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Nessuna attività associata</p>}
        </div>
      </div>

      {project.notes && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-2">Note</h2>
          <p className="text-sm text-gray-600">{project.notes}</p>
        </div>
      )}
    </div>
  );
}