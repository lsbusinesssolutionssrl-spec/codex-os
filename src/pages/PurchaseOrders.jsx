import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Package, Truck, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StatusBadge from '../components/StatusBadge';

const STATUSES = ['Draft', 'Ordered', 'Received', 'Partially Received', 'Closed'];

export default function PurchaseOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ 
    project_id: '', 
    supplier_id: '', 
    order_number: '', 
    order_date: new Date().toISOString().split('T')[0], 
    total_amount: 0, 
    notes: '' 
  });

  useEffect(() => {
    const load = async () => {
      const [ords, projs, supps] = await Promise.all([
        base44.entities.PurchaseOrder.list('-order_date'),
        base44.entities.Project.list(),
        base44.entities.Supplier.list(),
      ]);
      setOrders(ords);
      setProjects(projs);
      setSuppliers(supps);
    };
    load();
  }, []);

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const match = !q || o.order_number?.toLowerCase().includes(q);
    return match && (!statusFilter || o.status === statusFilter);
  });

  const createOrder = async () => {
    const created = await base44.entities.PurchaseOrder.create({
      ...form,
      status: 'Draft',
    });
    setOrders(prev => [...prev, created]);
    setShowModal(false);
    setForm({ project_id: '', supplier_id: '', order_number: '', order_date: new Date().toISOString().split('T')[0], total_amount: 0, notes: '' });
  };

  const projectMap = Object.fromEntries(projects.map(p => [p.id, p.title]));
  const supplierMap = Object.fromEntries(suppliers.map(s => [s.id, s.name]));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ordini di Acquisto</h1>
          <p className="text-sm text-gray-500">{orders.length} ordini · €{orders.reduce((sum, o) => sum + (o.total_amount || 0), 0).toLocaleString('it-IT')}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium" style={{ backgroundColor: '#1147FF' }}>
          <Plus className="w-4 h-4" /> Nuovo Ordine
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca ordine..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
          <option value="">Tutti gli stati</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(o => (
          <div key={o.id} onClick={() => navigate(`/purchase-orders/${o.id}`)} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{o.order_number || 'Ordine senza numero'}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{projectMap[o.project_id] || '—'}</p>
              </div>
              <StatusBadge status={o.status} />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Package className="w-3.5 h-3.5" />
                <span>{supplierMap[o.supplier_id] || '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Truck className="w-3.5 h-3.5" />
                <span>{o.expected_delivery ? new Date(o.expected_delivery).toLocaleDateString('it-IT') : '—'}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500">Totale</span>
                <span className="font-bold text-blue-600">€{(o.total_amount || 0).toLocaleString('it-IT')}</span>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 py-16 text-center text-gray-400 text-sm">Nessun ordine trovato</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
            <h2 className="font-bold text-gray-900">Nuovo Ordine</h2>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Progetto *</label>
              <select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
                <option value="">— Seleziona —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Fornitore *</label>
              <select value={form.supplier_id} onChange={e => setForm(f => ({ ...f, supplier_id: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
                <option value="">— Seleziona —</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Numero Ordine</label>
                <input value={form.order_number} onChange={e => setForm(f => ({ ...f, order_number: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" placeholder="es. PO-2024-001" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Data</label>
                <input type="date" value={form.order_date} onChange={e => setForm(f => ({ ...f, order_date: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Importo Totale (€)</label>
              <input type="number" value={form.total_amount} onChange={e => setForm(f => ({ ...f, total_amount: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Note</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none resize-none" />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={createOrder} disabled={!form.project_id || !form.supplier_id} className="flex-1 py-2 text-sm text-white rounded-lg font-medium disabled:opacity-40" style={{ backgroundColor: '#1147FF' }}>
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