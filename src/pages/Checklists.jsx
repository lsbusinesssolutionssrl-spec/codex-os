import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, CheckSquare } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StatusBadge from '../components/StatusBadge';

const CATEGORIES = ['', 'Bathroom', 'Full Home', 'Electrical', 'Networking', 'Security', 'Roofing', 'Handover'];

export default function Checklists() {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState({});
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [anomalyOnly, setAnomalyOnly] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const [filtersRes, checks, projs] = await Promise.all([
        base44.functions.invoke('getUserFilters', {}),
        base44.entities.ChecklistItem.list('-due_date'),
        base44.entities.Project.list(),
      ]);
      // Apply RLS filters
      const filters = filtersRes.data.filters;
      const filteredItems = checks.filter(i => {
        if (!filters.ChecklistItem || Object.keys(filters.ChecklistItem).length === 0) return true;
        if (filters.ChecklistItem.assigned_person) {
          return i.assigned_person === filters.ChecklistItem.assigned_person;
        }
        if (filters.ChecklistItem.created_by) {
          return i.created_by === filters.ChecklistItem.created_by;
        }
        return true;
      });
      setItems(filteredItems);
      const map = {};
      projs.forEach(p => { map[p.id] = p.title; });
      setProjects(map);
    };
    load();
  }, []);

  const filtered = items.filter(i => {
    const q = search.toLowerCase();
    const match = !q || i.title?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q);
    const due = i.due_date ? new Date(i.due_date) : null;
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo + 'T23:59:59') : null;
    const inRange = (!from || (due && due >= from)) && (!to || (due && due <= to));
    return match && (!categoryFilter || i.category === categoryFilter) && (!statusFilter || i.status === statusFilter) && inRange && (!anomalyOnly || i.is_anomaly);
  });

  const createNew = async () => {
    const created = await base44.entities.ChecklistItem.create({ title: 'Nuova Checklist', status: 'To Do' });
    navigate(`/checklists/${created.id}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Checklist</h1>
          <p className="text-sm text-gray-500">{items.length} attività totali</p>
        </div>
        <button onClick={createNew} className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium" style={{ backgroundColor: '#1147FF' }}>
          <Plus className="w-4 h-4" /> Nuova Attività
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
          <option value="">Tutte le categorie</option>
          {CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
          <option value="">Tutti gli stati</option>
          <option value="To Do">To Do</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
          <option value="Blocked">Blocked</option>
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" title="Scadenza da" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" title="Scadenza a" />
        <button
          onClick={() => setAnomalyOnly(a => !a)}
          className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors font-medium ${
            anomalyOnly ? 'bg-red-500 text-white border-red-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >⚠️ Solo anomalie</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">Nessuna attività trovata</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(item => (
              <div key={item.id} onClick={() => navigate(`/checklists/${item.id}`)} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 cursor-pointer">
                <div className="flex-shrink-0">
                  <CheckSquare className={`w-5 h-5 ${item.status === 'Done' ? 'text-green-500' : 'text-gray-300'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${item.status === 'Done' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{item.title}</span>
                    {item.is_anomaly && <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">Anomalia</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-gray-400">{projects[item.project_id] || '—'}</span>
                    {item.category && <span className="text-xs text-gray-400">{item.category}</span>}
                    {item.assigned_person && <span className="text-xs text-gray-400">{item.assigned_person}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {item.due_date && (
                    <span className={`text-xs ${new Date(item.due_date) < new Date() && item.status !== 'Done' ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                      {new Date(item.due_date).toLocaleDateString('it-IT')}
                    </span>
                  )}
                  <StatusBadge status={item.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}