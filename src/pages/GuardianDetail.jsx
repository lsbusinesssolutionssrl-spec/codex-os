import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Save, X, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StatusBadge from '../components/StatusBadge';

const STATUSES = ['Active', 'Paused', 'Cancelled'];

export default function GuardianDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sub, setSub] = useState(null);
  const [client, setClient] = useState(null);
  const [property, setProperty] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    const load = async () => {
      const subs = await base44.entities.GuardianSubscription.filter({ id });
      if (!subs[0]) return;
      setSub(subs[0]);
      setForm(subs[0]);
      const [cls, tkts] = await Promise.all([
        subs[0].client_id ? base44.entities.Client.filter({ id: subs[0].client_id }) : Promise.resolve([]),
        base44.entities.SupportTicket.filter({ guardian_id: id }),
      ]);
      setClient(cls[0]);
      setTickets(tkts);
      if (subs[0].property_id) {
        const props = await base44.entities.Property.filter({ id: subs[0].property_id });
        setProperty(props[0]);
      }
    };
    load();
  }, [id]);

  const save = async () => {
    const updated = await base44.entities.GuardianSubscription.update(id, form);
    setSub(updated);
    setEditing(false);
  };

  if (!sub) return <div className="p-6 text-center text-gray-400">Caricamento...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/guardian')} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Guardian · {client?.name || '—'}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <StatusBadge status={sub.status} />
            {property && <span className="text-xs text-gray-400">{property.property_name}</span>}
          </div>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            <Edit2 className="w-3.5 h-3.5" /> Modifica
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={save} className="flex items-center gap-2 px-3 py-1.5 text-sm text-white rounded-lg" style={{ backgroundColor: '#1147FF' }}>
              <Save className="w-3.5 h-3.5" /> Salva
            </button>
            <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Canone Mensile</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">€{sub.monthly_price || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Inizio Abbonamento</p>
          <p className="text-lg font-bold text-gray-900 mt-1">{sub.start_date ? new Date(sub.start_date).toLocaleDateString('it-IT') : '—'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Ticket Aperti</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{tickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length}</p>
        </div>
      </div>

      {editing && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Stato</label>
            <select value={form.status || ''} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Canone Mensile (€)</label>
            <input type="number" value={form.monthly_price || ''} onChange={e => setForm(f => ({ ...f, monthly_price: parseFloat(e.target.value) }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Data Inizio</label>
            <input type="date" value={form.start_date || ''} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Servizi Inclusi</label>
            <textarea value={form.included_services || ''} onChange={e => setForm(f => ({ ...f, included_services: e.target.value }))} rows={3} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none resize-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Note</label>
            <textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none resize-none" />
          </div>
        </div>
      )}

      {sub.included_services && !editing && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-2">Servizi Inclusi</h2>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{sub.included_services}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Ticket di Supporto</h2>
          <button onClick={() => navigate('/tickets')} className="text-xs text-blue-600 hover:underline">Vedi tutti →</button>
        </div>
        {tickets.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">Nessun ticket</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {tickets.map(t => (
              <div key={t.id} onClick={() => navigate(`/tickets/${t.id}`)} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-gray-800">{t.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.issue_type}</p>
                </div>
                <div className="flex items-center gap-2">
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