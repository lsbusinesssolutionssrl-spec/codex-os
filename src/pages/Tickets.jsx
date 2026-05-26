import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StatusBadge from '../components/StatusBadge';

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [clients, setClients] = useState({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const [tkts, cls] = await Promise.all([
        base44.entities.SupportTicket.list('-created_date'),
        base44.entities.Client.list(),
      ]);
      setTickets(tkts);
      const map = {};
      cls.forEach(c => { map[c.id] = c.name; });
      setClients(map);
    };
    load();
  }, []);

  const filtered = tickets.filter(t => {
    const q = search.toLowerCase();
    const match = !q || t.title?.toLowerCase().includes(q) || clients[t.client_id]?.toLowerCase().includes(q);
    return match && (!statusFilter || t.status === statusFilter) && (!priorityFilter || t.priority === priorityFilter);
  });

  const createNew = async () => {
    const t = await base44.entities.SupportTicket.create({ title: 'Nuovo Ticket', priority: 'Medium', status: 'Open', client_id: '' });
    navigate(`/tickets/${t.id}`);
  };

  const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
  const STATUSES = ['Open', 'In Progress', 'Waiting Client', 'Resolved', 'Closed'];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ticket di Supporto</h1>
          <p className="text-sm text-gray-500">{tickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length} aperti · {tickets.length} totali</p>
        </div>
        <button onClick={createNew} className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium" style={{ backgroundColor: '#1147FF' }}>
          <Plus className="w-4 h-4" /> Nuovo Ticket
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca ticket..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
        </div>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
          <option value="">Tutte le priorità</option>
          {PRIORITIES.map(p => <option key={p}>{p}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
          <option value="">Tutti gli stati</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">Nessun ticket trovato</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(t => (
              <div key={t.id} onClick={() => navigate(`/tickets/${t.id}`)} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 cursor-pointer">
                <AlertCircle className={`w-5 h-5 flex-shrink-0 ${t.priority === 'Urgent' ? 'text-red-500' : t.priority === 'High' ? 'text-orange-500' : 'text-gray-300'}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{t.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">{clients[t.client_id] || '—'}</span>
                    {t.issue_type && <span className="text-xs text-gray-400">· {t.issue_type}</span>}
                    {t.assigned_technician && <span className="text-xs text-gray-400">· {t.assigned_technician}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={t.priority} />
                  <StatusBadge status={t.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}