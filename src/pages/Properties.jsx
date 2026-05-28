import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Home, MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useGlobalContext } from '@/lib/GlobalContextEngine';
import { getClients, getClientDisplayName, getClientSecondaryLabel } from '@/lib/ClientService';

const TYPE_OPTS = ['Apartment', 'Villa', 'Office', 'Industrial Building', 'Commercial Space'];
const TYPE_LABELS = {
  'Apartment': 'Appartamento',
  'Villa': 'Villa',
  'Office': 'Ufficio',
  'Industrial Building': 'Capannone Industriale',
  'Commercial Space': 'Locale Commerciale',
};

export default function Properties() {
  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState({});
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ property_name: '', client_id: '', address: '', type: 'Apartment', square_meters: '', year_built: '' });
  const [clientList, setClientList] = useState([]);
  const navigate = useNavigate();
  const { activeTenant } = useGlobalContext();

  useEffect(() => {
    if (!activeTenant?.id) return;
    const load = async () => {
      try {
        const [filteredProps, cls] = await Promise.all([
          base44.entities.Property.filter({ company_id: activeTenant.id, is_sample: false }, '-created_date'),
          getClients(activeTenant.id),
        ]);
        setProperties(filteredProps);
        setClientList(cls);
        const map = {};
        cls.forEach(c => { map[c.id] = getClientDisplayName(c); });
        setClients(map);
      } catch (error) {
        console.error('Failed to load properties:', error);
        setProperties([]);
        toast.error('Errore nel caricamento proprietà');
      }
    };
    load();
  }, [activeTenant?.id]);

  const filtered = properties.filter(p => {
    const q = search.toLowerCase();
    const match = !q || p.property_name?.toLowerCase().includes(q) || p.address?.toLowerCase().includes(q);
    return match && (!typeFilter || p.type === typeFilter);
  });

  const save = async (e) => {
    e.preventDefault();
    if (!activeTenant?.id) {
      toast.error('Tenant non risolto: impossibile salvare la proprietà.');
      return;
    }
    const created = await base44.entities.Property.create({
      ...form,
      company_id: activeTenant.id,
      square_meters: Number(form.square_meters) || undefined,
      year_built: Number(form.year_built) || undefined,
    });
    setProperties(prev => [created, ...prev]);
    setShowForm(false);
    toast.success('Proprietà salvata con successo');
  };

  const typeIcon = { Apartment: '🏢', Villa: '🏡', Office: '🏬', 'Industrial Building': '🏭', 'Commercial Space': '🏪' };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Home Passport</h1>
          <p className="text-sm text-gray-500">{properties.length} proprietà registrate</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium" style={{ backgroundColor: '#1147FF' }}>
          <Plus className="w-4 h-4" /> Nuova Proprietà
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca proprietà..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
          <option value="">Tutti i tipi</option>
          {TYPE_OPTS.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
        </select>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Nuova Proprietà</h3>
          <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nome Proprietà *</label>
              <input value={form.property_name} onChange={e => setForm(f => ({ ...f, property_name: e.target.value }))} required className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cliente *</label>
              <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} required className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white">
                <option value="">— Seleziona cliente —</option>
                {clientList.length === 0 && (
                  <option disabled>Nessun cliente trovato. Crea prima un cliente.</option>
                )}
                {clientList.map(c => (
                  <option key={c.id} value={c.id}>
                    {getClientDisplayName(c)}{getClientSecondaryLabel(c) ? ` — ${getClientSecondaryLabel(c)}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Indirizzo</label>
              <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white">
                {TYPE_OPTS.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Mq</label>
              <input type="number" value={form.square_meters} onChange={e => setForm(f => ({ ...f, square_meters: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" className="px-5 py-2 text-sm text-white rounded-lg font-medium" style={{ backgroundColor: '#1147FF' }}>Salva</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Annulla</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center text-gray-400 text-sm">Nessuna proprietà trovata</div>
        ) : filtered.map(p => (
          <div key={p.id} onClick={() => navigate(`/properties/${p.id}`)} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: '#0B234115' }}>
                {typeIcon[p.type] || '🏠'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{p.property_name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{clients[p.client_id] || 'Cliente non trovato'}</p>
              </div>
            </div>
            {p.address && (
              <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-500">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{p.address}</span>
              </div>
            )}
            <div className="flex items-center gap-3 mt-3">
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{TYPE_LABELS[p.type] || p.type}</span>
              {p.square_meters && <span className="text-xs text-gray-400">{p.square_meters} mq</span>}
              {p.year_built && <span className="text-xs text-gray-400">Anno {p.year_built}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}