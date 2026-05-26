import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Star, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const CATEGORIES = ['', 'Materials', 'Electrical', 'Plumbing', 'Construction', 'Equipment Rental', 'Subcontractor', 'Other'];

export default function Suppliers() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Materials', phone: '', email: '', payment_terms: '30 days', rating: 4, notes: '' });

  useEffect(() => {
    base44.entities.Supplier.list().then(setSuppliers);
  }, []);

  const filtered = suppliers.filter(s => {
    const q = search.toLowerCase();
    const match = !q || s.name?.toLowerCase().includes(q);
    return match && (!categoryFilter || s.category === categoryFilter);
  });

  const createSupplier = async () => {
    const created = await base44.entities.Supplier.create(form);
    setSuppliers(prev => [...prev, created]);
    setShowModal(false);
    setForm({ name: '', category: 'Materials', phone: '', email: '', payment_terms: '30 days', rating: 4, notes: '' });
  };

  const categoryColors = {
    Materials: 'bg-blue-100 text-blue-700',
    Electrical: 'bg-yellow-100 text-yellow-700',
    Plumbing: 'bg-cyan-100 text-cyan-700',
    Construction: 'bg-gray-100 text-gray-700',
    'Equipment Rental': 'bg-purple-100 text-purple-700',
    Subcontractor: 'bg-orange-100 text-orange-700',
    Other: 'bg-gray-100 text-gray-500',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fornitori</h1>
          <p className="text-sm text-gray-500">{suppliers.length} fornitori registrati</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium" style={{ backgroundColor: '#1147FF' }}>
          <Plus className="w-4 h-4" /> Nuovo Fornitore
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca fornitore..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
          <option value="">Tutte le categorie</option>
          {CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s => (
          <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{s.name}</h3>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${categoryColors[s.category] || 'bg-gray-100 text-gray-700'}`}>
                  {s.category}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-medium text-gray-700">{s.rating || '—'}</span>
              </div>
            </div>
            <div className="space-y-1 text-sm text-gray-500">
              {s.phone && <p>{s.phone}</p>}
              {s.email && <p>{s.email}</p>}
              {s.payment_terms && <p>Pagamento: {s.payment_terms}</p>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 py-16 text-center text-gray-400 text-sm">Nessun fornitore trovato</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
            <h2 className="font-bold text-gray-900">Nuovo Fornitore</h2>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nome *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Categoria</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
                  {CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Pagamento</label>
                <select value={form.payment_terms} onChange={e => setForm(f => ({ ...f, payment_terms: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
                  {['Immediate', '7 days', '15 days', '30 days', '60 days', '90 days'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Telefono</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={createSupplier} disabled={!form.name} className="flex-1 py-2 text-sm text-white rounded-lg font-medium disabled:opacity-40" style={{ backgroundColor: '#1147FF' }}>
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