import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, LayoutList, BarChart2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StatusBadge from '../components/StatusBadge';
import GanttChart from '../components/GanttChart';
import Breadcrumb from '../components/Breadcrumb';

const STATUSES = ['', 'Lead', 'Survey', 'Estimate', 'Approved', 'In Progress', 'Testing', 'Delivered', 'Guardian Active', 'Archived'];

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [view, setView] = useState('list');
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      // Get user-specific filters for RLS
      const filtersRes = await base44.functions.invoke('getUserFilters', {});
      const projectFilters = filtersRes.data.filters.Project || {};
      
      const [projs, cls] = await Promise.all([
        base44.entities.Project.filter(projectFilters, '-created_date'),
        base44.entities.Client.list(),
      ]);
      setProjects(projs);
      const map = {};
      cls.forEach(c => { map[c.id] = c.name + (c.company_name ? ` ${c.company_name}` : ''); });
      setClients(map);
    };
    load();
  }, []);

  const filtered = projects.filter(p => {
    const q = search.toLowerCase();
    const match = !q || p.title?.toLowerCase().includes(q) || clients[p.client_id]?.toLowerCase().includes(q);
    return match && (!statusFilter || p.status === statusFilter);
  });

  const createNew = async () => {
    const created = await base44.entities.Project.create({ title: 'Nuovo Progetto', status: 'Lead' });
    navigate(`/projects/${created.id}`);
  };

  const handleUpdateDates = async (projectId, start_date, expected_end_date) => {
    await base44.entities.Project.update(projectId, { start_date, expected_end_date });
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, start_date, expected_end_date } : p));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <Breadcrumb items={[{ label: 'Progetti' }]} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Progetti</h1>
          <p className="text-sm text-gray-500">{projects.length} progetti totali</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setView('list')} className={`px-3 py-1.5 rounded-md text-sm transition-colors ${view === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
              <LayoutList className="w-4 h-4" />
            </button>
            <button onClick={() => setView('gantt')} className={`px-3 py-1.5 rounded-md text-sm transition-colors ${view === 'gantt' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
              <BarChart2 className="w-4 h-4" />
            </button>
          </div>
          <button onClick={createNew} className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium" style={{ backgroundColor: '#1147FF' }}>
            <Plus className="w-4 h-4" /> Nuovo Progetto
          </button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca progetto..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
          <option value="">Tutti gli stati</option>
          {STATUSES.slice(1).map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {view === 'gantt' ? (
        <GanttChart projects={filtered} onUpdateDates={handleUpdateDates} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">Nessun progetto trovato</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map(p => (
                <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{p.title}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-400">{clients[p.client_id] || '—'}</span>
                      {p.project_manager && <span className="text-xs text-gray-400">PM: {p.project_manager}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {p.start_date && (
                      <span className="text-xs text-gray-400 hidden sm:block">
                        {new Date(p.start_date).toLocaleDateString('it-IT')}
                        {p.expected_end_date && ` → ${new Date(p.expected_end_date).toLocaleDateString('it-IT')}`}
                      </span>
                    )}
                    {p.budget && <span className="text-xs text-gray-500 hidden md:block font-medium">€{p.budget.toLocaleString()}</span>}
                    <StatusBadge status={p.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}