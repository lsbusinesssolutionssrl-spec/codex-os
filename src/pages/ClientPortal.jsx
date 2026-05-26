import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, FileText, Ticket, Archive, AlertCircle, ChevronRight } from 'lucide-react';
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
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [client, setClient] = useState(null);
  const [properties, setProperties] = useState([]);
  const [estimates, setEstimates] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);

      // Find client by email
      const cls = await base44.entities.Client.list();
      const linked = cls.find(c => c.email?.toLowerCase() === me.email?.toLowerCase());
      if (!linked) { setLoading(false); return; }
      setClient(linked);

      const [props, ests, tkts, docs] = await Promise.all([
        base44.entities.Property.filter({ client_id: linked.id }),
        base44.entities.Estimate.filter({ client_id: linked.id }),
        base44.entities.SupportTicket.filter({ client_id: linked.id }),
        base44.entities.Document.filter({ client_id: linked.id }),
      ]);
      setProperties(props);
      setEstimates(ests.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      setTickets(tkts.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      setDocuments(docs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      setLoading(false);
    };
    load();
  }, []);

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