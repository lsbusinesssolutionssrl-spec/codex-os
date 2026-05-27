import { useState, useEffect } from 'react';
import { Wrench, Plus, Calendar, AlertTriangle, CheckCircle, Clock, ChevronRight, X, Save } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StatusBadge from '../components/StatusBadge';

const TYPES = ['HVAC','Electrical Inspection','Roof Inspection','Security Inspection','Network Maintenance','Plumbing','Fire Safety','Elevator','Pest Control','Other'];
const FREQUENCIES = ['Weekly','Monthly','Quarterly','Semi-Annual','Annual','Custom'];

const FREQ_DAYS = { Weekly: 7, Monthly: 30, Quarterly: 90, 'Semi-Annual': 180, Annual: 365 };

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

function DueBadge({ date }) {
  const days = daysUntil(date);
  if (days === null) return null;
  if (days < 0) return <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Scaduto {Math.abs(days)}g fa</span>;
  if (days === 0) return <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Scade oggi</span>;
  if (days <= 7) return <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">Tra {days}g</span>;
  if (days <= 30) return <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">Tra {days}g</span>;
  return <span className="text-xs text-gray-400">{new Date(date).toLocaleDateString('it-IT')}</span>;
}

const EMPTY_FORM = { title: '', maintenance_type: 'HVAC', frequency: 'Annual', assigned_technician: '', next_due_date: '', estimated_hours: '', notes: '', status: 'Active', auto_create_ticket: true };

export default function MaintenancePlanning() {
  const [schedules, setSchedules] = useState([]);
  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      const [s, p, c] = await Promise.all([
        base44.entities.MaintenanceSchedule.list('-next_due_date'),
        base44.entities.Property.list(),
        base44.entities.Client.list(),
      ]);
      setSchedules(s);
      setProperties(p);
      setClients(c);
      setLoading(false);
    };
    load();
  }, []);

  const save = async () => {
    const created = await base44.entities.MaintenanceSchedule.create(form);
    setSchedules(prev => [created, ...prev]);
    setShowForm(false);
    setForm(EMPTY_FORM);
  };

  const markCompleted = async (id, schedule) => {
    const freqDays = FREQ_DAYS[schedule.frequency] || schedule.frequency_days || 30;
    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + freqDays);
    const updated = await base44.entities.MaintenanceSchedule.update(id, {
      last_completed_date: new Date().toISOString().split('T')[0],
      next_due_date: nextDue.toISOString().split('T')[0],
      status: 'Active',
    });
    setSchedules(prev => prev.map(s => s.id === id ? updated : s));
  };

  const filtered = schedules.filter(s => {
    if (filter === 'overdue') return daysUntil(s.next_due_date) !== null && daysUntil(s.next_due_date) < 0;
    if (filter === 'soon') { const d = daysUntil(s.next_due_date); return d !== null && d >= 0 && d <= 30; }
    if (filter === 'active') return s.status === 'Active';
    return true;
  });

  const overdue = schedules.filter(s => daysUntil(s.next_due_date) !== null && daysUntil(s.next_due_date) < 0).length;
  const dueSoon = schedules.filter(s => { const d = daysUntil(s.next_due_date); return d !== null && d >= 0 && d <= 30; }).length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wrench className="w-6 h-6" /> Manutenzioni Programmate
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestione manutenzioni ricorrenti</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium" style={{ backgroundColor: '#1147FF' }}>
          <Plus className="w-4 h-4" /> Nuova Manutenzione
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{schedules.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Programmi attivi</p>
        </div>
        <div className={`rounded-xl border p-4 text-center ${overdue > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
          <p className={`text-2xl font-bold ${overdue > 0 ? 'text-red-600' : 'text-gray-900'}`}>{overdue}</p>
          <p className="text-xs text-gray-400 mt-0.5">Scadute</p>
        </div>
        <div className={`rounded-xl border p-4 text-center ${dueSoon > 0 ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'}`}>
          <p className={`text-2xl font-bold ${dueSoon > 0 ? 'text-orange-600' : 'text-gray-900'}`}>{dueSoon}</p>
          <p className="text-xs text-gray-400 mt-0.5">In scadenza (30gg)</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[['all','Tutti'],['overdue','Scadute'],['soon','Prossime 30gg'],['active','Attive']].map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id)} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${filter === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Caricamento...</div>
      ) : (
        <div className="space-y-2">
          {filtered.length === 0 && <p className="text-center text-gray-400 py-12">Nessuna manutenzione trovata</p>}
          {filtered.map(s => {
            const property = properties.find(p => p.id === s.property_id);
            const client = clients.find(c => c.id === s.client_id);
            const days = daysUntil(s.next_due_date);
            const isOverdue = days !== null && days < 0;
            return (
              <div key={s.id} className={`bg-white rounded-xl border p-4 flex items-center gap-4 ${isOverdue ? 'border-red-200' : 'border-gray-200'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isOverdue ? 'bg-red-100' : 'bg-gray-100'}`}>
                  <Wrench className={`w-5 h-5 ${isOverdue ? 'text-red-500' : 'text-gray-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 text-sm">{s.title}</p>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{s.maintenance_type}</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{s.frequency}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {property && <span className="text-xs text-gray-400">{property.property_name}</span>}
                    {client && <span className="text-xs text-gray-400">· {client.name}</span>}
                    {s.assigned_technician && <span className="text-xs text-gray-400">· Tecnico: {s.assigned_technician}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <DueBadge date={s.next_due_date} />
                  <button
                    onClick={() => markCompleted(s.id, s)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs text-white rounded-lg font-medium"
                    style={{ backgroundColor: '#10B981' }}
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Completata
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Nuova Manutenzione Programmata</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Titolo *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" placeholder="es. Controllo HVAC annuale" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
                <select value={form.maintenance_type} onChange={e => setForm(f => ({ ...f, maintenance_type: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Frequenza</label>
                <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
                  {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Prossima scadenza</label>
                <input type="date" value={form.next_due_date} onChange={e => setForm(f => ({ ...f, next_due_date: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Ore stimate</label>
                <input type="number" value={form.estimated_hours} onChange={e => setForm(f => ({ ...f, estimated_hours: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" placeholder="es. 2" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Proprietà</label>
                <select value={form.property_id || ''} onChange={e => setForm(f => ({ ...f, property_id: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
                  <option value="">— Seleziona —</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.property_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Tecnico</label>
                <input value={form.assigned_technician} onChange={e => setForm(f => ({ ...f, assigned_technician: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" placeholder="Nome tecnico" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Note</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none" />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" id="auto_ticket" checked={form.auto_create_ticket} onChange={e => setForm(f => ({ ...f, auto_create_ticket: e.target.checked }))} className="w-4 h-4 rounded" />
                <label htmlFor="auto_ticket" className="text-sm text-gray-700">Crea ticket automaticamente alla scadenza</label>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={save} disabled={!form.title} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-white rounded-lg font-medium disabled:opacity-40" style={{ backgroundColor: '#1147FF' }}>
                <Save className="w-4 h-4" /> Salva
              </button>
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-600">Annulla</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}