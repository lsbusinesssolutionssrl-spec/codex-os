import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, User, Building2, Phone, Mail } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StatusBadge from '../components/StatusBadge';

const TYPE_OPTS = ['', 'Private', 'Business', 'Public Administration', 'Partner'];
const SOURCE_OPTS = ['', 'Referral', 'Google', 'Social', 'Partner', 'Existing Client'];

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', company_name: '', phone: '', email: '', address: '', type: 'Private', source: '', notes: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const filtersRes = await base44.functions.invoke('getUserFilters', {});
      const filters = filtersRes.data.filters;
      const data = await base44.entities.Client.filter(filters.Client || {}, '-created_date');
      setClients(data);
    };
    load();
  }, []);

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    const match = !q || c.name?.toLowerCase().includes(q) || c.company_name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
    const typeMatch = !typeFilter || c.type === typeFilter;
    return match && typeMatch;
  });

  const save = async (e) => {
    e.preventDefault();
    const created = await base44.entities.Client.create(form);
    setClients(prev => [created, ...prev]);
    setShowForm(false);
    setForm({ name: '', company_name: '', phone: '', email: '', address: '', type: 'Private', source: '', notes: '' });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clienti</h1>
          <p className="text-sm text-gray-500">{clients.length} clienti registrati</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium" style={{ backgroundColor: '#1147FF' }}>
          <Plus className="w-4 h-4" /> Nuovo Cliente
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca cliente..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white">
          <option value="">Tutti i tipi</option>
          {TYPE_OPTS.slice(1).map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Nuovo Cliente</h3>
          <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[['name', 'Nome *'], ['company_name', 'Cognome / Azienda'], ['phone', 'Telefono'], ['email', 'Email'], ['address', 'Indirizzo']].map(([k, label]) => (
              <div key={k} className={k === 'address' ? 'sm:col-span-2' : ''}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} required={k === 'name'} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white">
                {TYPE_OPTS.slice(1).map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fonte</label>
              <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white">
                {SOURCE_OPTS.map(s => <option key={s} value={s}>{s || '— Seleziona —'}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Note</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" className="px-5 py-2 text-sm text-white rounded-lg font-medium" style={{ backgroundColor: '#1147FF' }}>Salva</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Annulla</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">Nessun cliente trovato</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(c => (
              <div key={c.id} onClick={() => navigate(`/clients/${c.id}`)} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 cursor-pointer">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: '#0B2341' }}>
                  {c.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 text-sm">{c.name}</span>
                    {c.company_name && <span className="text-gray-400 text-sm">· {c.company_name}</span>}
                  </div>
                  <div className="flex items-center gap-4 mt-0.5">
                    {c.phone && <span className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>}
                    {c.email && <span className="text-xs text-gray-400 flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {c.type && <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{c.type}</span>}
                  {c.source && <span className="text-xs text-gray-400">{c.source}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}