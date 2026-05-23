import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StatusBadge from '../components/StatusBadge';

export default function Guardian() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [clients, setClients] = useState({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const [subs, cls] = await Promise.all([
        base44.entities.GuardianSubscription.list('-created_date'),
        base44.entities.Client.list(),
      ]);
      setSubscriptions(subs);
      const map = {};
      cls.forEach(c => { map[c.id] = c.name + (c.company_name ? ` ${c.company_name}` : ''); });
      setClients(map);
    };
    load();
  }, []);

  const filtered = subscriptions.filter(s => {
    const q = search.toLowerCase();
    const match = !q || clients[s.client_id]?.toLowerCase().includes(q);
    return match && (!statusFilter || s.status === statusFilter);
  });

  const createNew = async () => {
    const created = await base44.entities.GuardianSubscription.create({ status: 'Active' });
    navigate(`/guardian/${created.id}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Codex Guardian</h1>
          <p className="text-sm text-gray-500">{subscriptions.length} abbonamenti attivi</p>
        </div>
        <button onClick={createNew} className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium" style={{ backgroundColor: '#1147FF' }}>
          <Plus className="w-4 h-4" /> Nuovo Abbonamento
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca cliente..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
          <option value="">Tutti gli stati</option>
          <option value="Active">Active</option>
          <option value="Paused">Paused</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center text-gray-400 text-sm">Nessun abbonamento trovato</div>
        ) : filtered.map(s => (
          <div key={s.id} onClick={() => navigate(`/guardian/${s.id}`)} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F5822015' }}>
                  <Shield className="w-5 h-5" style={{ color: '#F58220' }} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{clients[s.client_id] || 'Cliente'}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {s.start_date ? `Dal ${new Date(s.start_date).toLocaleDateString('it-IT')}` : 'Data non definita'}
                  </p>
                </div>
              </div>
              <StatusBadge status={s.status} />
            </div>
            {s.included_services && (
              <div className="mt-4 text-xs text-gray-600 bg-gray-50 rounded-lg p-3">
                {s.included_services}
              </div>
            )}
            {s.monthly_price && (
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-gray-400">Mensile</span>
                <span className="text-lg font-bold" style={{ color: '#F58220' }}>€{s.monthly_price}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}