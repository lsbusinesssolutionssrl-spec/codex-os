import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StatusBadge from '../components/StatusBadge';

const STATUSES = ['', 'Draft', 'To Review', 'Sent', 'Accepted', 'Rejected', 'Expired', 'Converted to Project'];
const TYPES = ['', 'Bathroom', 'Full Home', 'Electrical System', 'Networking', 'Security', 'Maintenance', 'Other'];

export default function Estimates() {
  const [estimates, setEstimates] = useState([]);
  const [clients, setClients] = useState({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const [ests, cls] = await Promise.all([
        base44.entities.Estimate.list('-created_date'),
        base44.entities.Client.list(),
      ]);
      setEstimates(ests);
      const map = {};
      cls.forEach(c => { map[c.id] = c.name + (c.company_name ? ` ${c.company_name}` : ''); });
      setClients(map);
    };
    load();
  }, []);

  const filtered = estimates.filter(e => {
    const q = search.toLowerCase();
    const match = !q || e.title?.toLowerCase().includes(q) || clients[e.client_id]?.toLowerCase().includes(q);
    return match && (!statusFilter || e.status === statusFilter);
  });

  const createNew = async () => {
    const created = await base44.entities.Estimate.create({ title: 'Nuovo Preventivo', status: 'Draft' });
    navigate(`/estimates/${created.id}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Preventivi</h1>
          <p className="text-sm text-gray-500">{estimates.length} preventivi totali</p>
        </div>
        <button onClick={createNew} className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium" style={{ backgroundColor: '#1147FF' }}>
          <Plus className="w-4 h-4" /> Nuovo Preventivo
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca preventivo..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
          <option value="">Tutti gli stati</option>
          {STATUSES.slice(1).map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">Nessun preventivo trovato</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Titolo</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Cliente</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Tipo</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Ricavi</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Margine</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(e => {
                const margin = e.revenue && e.gross_margin ? ((e.gross_margin / e.revenue) * 100).toFixed(1) : null;
                return (
                  <tr key={e.id} onClick={() => navigate(`/estimates/${e.id}`)} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-gray-900">{e.title}</div>
                      {e.estimate_type && <div className="text-xs text-gray-400">{e.estimate_type}</div>}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 hidden md:table-cell">{clients[e.client_id] || '—'}</td>
                    <td className="px-5 py-3.5 text-gray-500 hidden lg:table-cell">{e.quality_level || '—'}</td>
                    <td className="px-5 py-3.5 text-right font-medium text-gray-900 hidden sm:table-cell">
                      {e.revenue ? `€${e.revenue.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right hidden lg:table-cell">
                      {margin ? (
                        <span className={`flex items-center justify-end gap-1 ${parseFloat(margin) >= 30 ? 'text-green-600' : 'text-orange-600'}`}>
                          <TrendingUp className="w-3.5 h-3.5" />{margin}%
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <StatusBadge status={e.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}