import { useState, useEffect } from 'react';
import { Home, FileText, Ticket, Archive, AlertCircle, ChevronRight, Plus, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StatusBadge from '../components/StatusBadge';

function Section({ icon: Icon, title, children, color = '#1147FF' }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '15' }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <h2 className="font-semibold text-gray-900 text-sm">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function ClientPortal() {
  const [user, setUser] = useState(null);
  const [client, setClient] = useState(null);
  const [properties, setProperties] = useState([]);
  const [estimates, setEstimates] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketForm, setTicketForm] = useState({ title: '', issue_type: 'Other', priority: 'Medium', notes: '', property_id: '' });
  const [creatingTicket, setCreatingTicket] = useState(false);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);

      const res = await base44.functions.invoke('getClientPortalData', {});
      const data = res.data;

      if (!data.client) { setLoading(false); return; }
      setClient(data.client);
      setProperties(data.properties || []);
      setEstimates((data.estimates || []).sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      setTickets((data.tickets || []).sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      setDocuments((data.documents || []).sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      setLoading(false);
    };
    load();
  }, []);

  const submitTicket = async () => {
    if (!ticketForm.title.trim()) return;
    setCreatingTicket(true);
    const res = await base44.functions.invoke('createPortalTicket', ticketForm);
    const newTicket = res.data.ticket;
    setTickets(prev => [newTicket, ...prev]);
    setShowTicketModal(false);
    setTicketForm({ title: '', issue_type: 'Other', priority: 'Medium', notes: '', property_id: '' });
    setCreatingTicket(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
    </div>
  );

  if (!client) return (
    <div className="p-8 text-center max-w-md mx-auto mt-16">
      <AlertCircle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
      <h2 className="text-lg font-bold text-gray-900 mb-2">Profilo non collegato</h2>
      <p className="text-sm text-gray-500">Il tuo account ({user?.email}) non è ancora collegato a nessun profilo cliente. Contatta il team Codex Solution.</p>
    </div>
  );

  const typeIcon = { Contract: '📄', Estimate: '📋', Invoice: '💰', Certification: '🏆', Warranty: '🛡️', 'Floor Plan': '📐', Photo: '📷', Other: '📁' };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Welcome */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0" style={{ backgroundColor: '#1147FF' }}>
          {client.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Benvenuto, {client.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{client.company_name || client.email} · Area Cliente Codex Solution</p>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Proprietà', value: properties.length, color: '#0B2341' },
          { label: 'Preventivi', value: estimates.length, color: '#1147FF' },
          { label: 'Ticket', value: tickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length, suffix: ' aperti', color: '#EF4444' },
          { label: 'Documenti', value: documents.length, color: '#10B981' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold mt-1" style={{ color: k.color }}>{k.value}{k.suffix || ''}</p>
            <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Properties */}
      <Section icon={Home} title="Le Mie Proprietà" color="#0B2341">
        {properties.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Nessuna proprietà</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {properties.map(p => (
              <div key={p.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{p.property_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.address} {p.type ? `· ${p.type}` : ''}</p>
                </div>
                {p.square_meters && <span className="text-sm text-gray-500">{p.square_meters} m²</span>}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Estimates */}
      <Section icon={FileText} title="I Miei Preventivi" color="#1147FF">
        {estimates.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Nessun preventivo</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {estimates.map(e => (
              <div key={e.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{e.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{e.estimate_type || ''}{e.estimated_duration ? ` · ${e.estimated_duration}` : ''}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {e.revenue && <span className="text-sm font-semibold text-gray-700">€{e.revenue.toLocaleString('it-IT')}</span>}
                  <StatusBadge status={e.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Tickets */}
      <Section icon={Ticket} title="I Miei Ticket" color="#EF4444">
        <div className="px-5 py-3 border-b border-gray-50">
          <button
            onClick={() => setShowTicketModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-white rounded-lg font-medium"
            style={{ backgroundColor: '#EF4444' }}
          >
            <Plus className="w-3 h-3" /> Apri Nuovo Ticket
          </button>
        </div>
        {tickets.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Nessun ticket</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {tickets.map(t => (
              <div key={t.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{t.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.issue_type || ''}{t.assigned_technician ? ` · Tecnico: ${t.assigned_technician}` : ''}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={t.priority} />
                  <StatusBadge status={t.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* New Ticket Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Apri Nuovo Ticket</h2>
              <button onClick={() => setShowTicketModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Oggetto *</label>
              <input value={ticketForm.title} onChange={e => setTicketForm(f => ({ ...f, title: e.target.value }))} placeholder="Descrivi brevemente il problema..." className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Tipo Problema</label>
                <select value={ticketForm.issue_type} onChange={e => setTicketForm(f => ({ ...f, issue_type: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
                  {['Water Leak','Electrical','Network','Security','Maintenance','Other'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Priorità</label>
                <select value={ticketForm.priority} onChange={e => setTicketForm(f => ({ ...f, priority: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
                  {['Low','Medium','High','Urgent'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            {properties.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Proprietà (opzionale)</label>
                <select value={ticketForm.property_id} onChange={e => setTicketForm(f => ({ ...f, property_id: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
                  <option value="">— Seleziona proprietà —</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.property_name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Note aggiuntive</label>
              <textarea value={ticketForm.notes} onChange={e => setTicketForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Descrivi il problema in dettaglio..." className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none resize-none" />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={submitTicket} disabled={creatingTicket || !ticketForm.title.trim()} className="flex-1 py-2 text-sm text-white rounded-lg font-medium disabled:opacity-40" style={{ backgroundColor: '#EF4444' }}>
                {creatingTicket ? 'Invio...' : 'Invia Ticket'}
              </button>
              <button onClick={() => setShowTicketModal(false)} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-600">Annulla</button>
            </div>
          </div>
        </div>
      )}

      {/* Documents */}
      <Section icon={Archive} title="I Miei Documenti" color="#10B981">
        {documents.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Nessun documento</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {documents.map(d => (
              <div key={d.id} className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{typeIcon[d.type] || '📁'}</span>
                  <div>
                    <p className="font-medium text-gray-900">{d.title}</p>
                    <p className="text-xs text-gray-400">{d.type}</p>
                  </div>
                </div>
                {d.file_url && (
                  <a href={d.file_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    Apri <ChevronRight className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}