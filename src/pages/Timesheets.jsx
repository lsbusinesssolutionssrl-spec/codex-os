import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Clock, Calendar, User, Euro } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function Timesheets() {
  const navigate = useNavigate();
  const [timesheets, setTimesheets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ 
    employee_id: '', 
    project_id: '', 
    date: new Date().toISOString().split('T')[0], 
    hours: 8, 
    hourly_rate: 25, 
    notes: '' 
  });

  useEffect(() => {
    const load = async () => {
      const [times, projs, usrs] = await Promise.all([
        base44.entities.Timesheet.list('-date'),
        base44.entities.Project.filter({ status: 'In Progress' }),
        base44.entities.User.list(),
      ]);
      setTimesheets(times);
      setProjects(projs);
      setUsers(usrs);
    };
    load();
  }, []);

  const filtered = timesheets.filter(t => {
    const q = search.toLowerCase();
    const match = !q || t.notes?.toLowerCase().includes(q);
    return match && (!projectFilter || t.project_id === projectFilter);
  });

  const createTimesheet = async () => {
    const totalLaborCost = (form.hours || 0) * (form.hourly_rate || 0);
    const created = await base44.entities.Timesheet.create({
      ...form,
      total_labor_cost: totalLaborCost,
    });
    setTimesheets(prev => [...prev, created]);
    setShowModal(false);
    setForm({ employee_id: '', project_id: '', date: new Date().toISOString().split('T')[0], hours: 8, hourly_rate: 25, notes: '' });
  };

  const projectMap = Object.fromEntries(projects.map(p => [p.id, p.title]));
  const userMap = Object.fromEntries(users.map(u => [u.id, u.full_name || u.email]));

  const totalHours = filtered.reduce((sum, t) => sum + (t.hours || 0), 0);
  const totalCost = filtered.reduce((sum, t) => sum + (t.total_labor_cost || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timesheet</h1>
          <p className="text-sm text-gray-500">{timesheets.length} registrazioni · {totalHours.toFixed(1)} ore · €{totalCost.toLocaleString('it-IT')}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium" style={{ backgroundColor: '#1147FF' }}>
          <Plus className="w-4 h-4" /> Nuova Registrazione
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
        </div>
        <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
          <option value="">Tutti i progetti</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Dipendente</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Progetto</th>
              <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Data</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Ore</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Tariffa</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Costo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(t => (
              <tr key={t.id} onClick={() => navigate(`/timesheets/${t.id}`)} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{userMap[t.employee_id] || '—'}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-gray-700">{projectMap[t.project_id] || '—'}</span>
                </td>
                <td className="px-5 py-3.5 text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-600">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(t.date).toLocaleDateString('it-IT')}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1 text-gray-700">
                    <Clock className="w-3.5 h-3.5" />
                    {t.hours}h
                  </div>
                </td>
                <td className="px-5 py-3.5 text-right text-gray-600">
                  <div className="flex items-center justify-end gap-1">
                    <Euro className="w-3.5 h-3.5" />
                    €{t.hourly_rate}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-right font-semibold text-blue-600">
                  €{(t.total_labor_cost || 0).toLocaleString('it-IT')}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-gray-400">Nessuna registrazione trovata</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
            <h2 className="font-bold text-gray-900">Nuova Registrazione</h2>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Dipendente *</label>
              <select value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
                <option value="">— Seleziona —</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Progetto *</label>
              <select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
                <option value="">— Seleziona —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Data</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Ore</label>
                <input type="number" value={form.hours} onChange={e => setForm(f => ({ ...f, hours: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tariffa Oraria (€)</label>
              <input type="number" value={form.hourly_rate} onChange={e => setForm(f => ({ ...f, hourly_rate: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Note</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none resize-none" />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={createTimesheet} disabled={!form.employee_id || !form.project_id} className="flex-1 py-2 text-sm text-white rounded-lg font-medium disabled:opacity-40" style={{ backgroundColor: '#1147FF' }}>
                Salva
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-600">Annulla</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}