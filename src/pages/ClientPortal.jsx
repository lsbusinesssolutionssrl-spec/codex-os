import { useState, useEffect } from 'react';
import {
  Home, FileText, Ticket, Archive, AlertCircle, Plus, X,
  FolderKanban, LayoutDashboard, Download, CheckCircle2,
  XCircle, Clock, ChevronDown, ChevronUp, Calendar, MessageSquare,
  Shield, Loader2
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StatusBadge from '../components/StatusBadge';
import SecureDocumentLink from '../components/SecureDocumentLink';
import { hasRole } from '../lib/roleUtils';

// ─── Project Timeline ────────────────────────────────────────────────────────
const PROJECT_STATUSES = ['Lead','Survey','Estimate','Approved','In Progress','Testing','Delivered','Guardian Active'];

function ProjectTimeline({ project }) {
  const [expanded, setExpanded] = useState(false);
  const currentIdx = PROJECT_STATUSES.indexOf(project.status);
  const pct = Math.round(((currentIdx + 1) / PROJECT_STATUSES.length) * 100);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3 text-left">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F580201A' }}>
            <FolderKanban className="w-4 h-4" style={{ color: '#F58020' }} />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{project.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <StatusBadge status={project.status} />
              {project.expected_end_date && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Fine prevista: {new Date(project.expected_end_date).toLocaleDateString('it-IT')}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-400">Avanzamento</p>
            <p className="text-sm font-bold text-gray-700">{pct}%</p>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-50 pt-4 space-y-4">
          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-500">Progresso complessivo</span>
              <span className="text-xs font-bold text-gray-700">{pct}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: '#1147FF' }}
              />
            </div>
          </div>

          {/* Phase timeline */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Fasi del Progetto</p>
            <div className="relative">
              <div className="absolute left-3.5 top-4 bottom-4 w-0.5 bg-gray-100" />
              <div className="space-y-2">
                {PROJECT_STATUSES.map((phase, idx) => {
                  const done = idx < currentIdx;
                  const active = idx === currentIdx;
                  return (
                    <div key={phase} className="flex items-center gap-3 relative">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center z-10 flex-shrink-0 text-xs font-bold ${
                        done ? 'bg-green-500 text-white' :
                        active ? 'text-white shadow-md' :
                        'bg-gray-100 text-gray-400'
                      }`} style={active ? { backgroundColor: '#1147FF' } : {}}>
                        {done ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <span className={`text-sm ${active ? 'font-semibold text-gray-900' : done ? 'text-gray-500 line-through' : 'text-gray-400'}`}>
                        {phase}
                      </span>
                      {active && <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">In corso</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Milestones */}
          {project.milestones?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Milestone</p>
              <div className="space-y-1.5">
                {project.milestones.map((m, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    {m.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                    <span className={`text-xs ${m.completed ? 'text-gray-500 line-through' : 'text-gray-700'}`}>{m.title || m.name}</span>
                    {m.due_date && <span className="text-xs text-gray-400 ml-auto">{new Date(m.due_date).toLocaleDateString('it-IT')}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {project.notes && (
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs font-medium text-blue-700 mb-0.5">Note dal team</p>
              <p className="text-xs text-blue-600">{project.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Estimate Card ────────────────────────────────────────────────────────────
function EstimateCard({ estimate, onAction }) {
  const [expanded, setExpanded] = useState(false);
  const [approving, setApproving] = useState(false);
  const [comment, setComment] = useState('');
  const [showCommentFor, setShowCommentFor] = useState(null); // 'approve' | 'reject' | null
  const canAct = estimate.status === 'Sent';

  const handleAction = async (action) => {
    setApproving(true);
    const res = await base44.functions.invoke('approvePortalEstimate', {
      estimate_id: estimate.id,
      action,
      client_comments: comment,
    });
    setApproving(false);
    setShowCommentFor(null);
    setComment('');
    onAction(estimate.id, action === 'approve' ? 'Accepted' : 'Rejected');
  };

  return (
    <div className={`bg-white rounded-xl border overflow-hidden ${canAct ? 'border-blue-200 shadow-sm' : 'border-gray-200'}`}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3 text-left">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#1147FF1A' }}>
            <FileText className="w-4 h-4" style={{ color: '#1147FF' }} />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{estimate.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <StatusBadge status={estimate.status} />
              {estimate.estimate_type && <span className="text-xs text-gray-400">{estimate.estimate_type}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {estimate.revenue && <span className="text-sm font-bold text-gray-800">€{estimate.revenue.toLocaleString('it-IT')}</span>}
          {canAct && <span className="hidden sm:flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full"><Clock className="w-3 h-3" />Azione richiesta</span>}
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-50 pt-4 space-y-3">
          {estimate.included_works && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Lavori Inclusi</p>
              <p className="text-xs text-gray-600 whitespace-pre-line">{estimate.included_works}</p>
            </div>
          )}
          {estimate.excluded_works && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Lavori Esclusi</p>
              <p className="text-xs text-gray-600 whitespace-pre-line">{estimate.excluded_works}</p>
            </div>
          )}
          {estimate.payment_terms && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-500 mb-0.5">Condizioni di Pagamento</p>
              <p className="text-xs text-gray-700">{estimate.payment_terms}</p>
            </div>
          )}
          {estimate.estimated_duration && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              Durata stimata: <strong className="text-gray-700">{estimate.estimated_duration}</strong>
            </div>
          )}

          {/* Approval Actions */}
          {canAct && !showCommentFor && (
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setShowCommentFor('approve')}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-white rounded-lg font-medium transition-colors"
                style={{ backgroundColor: '#10B981' }}
              >
                <CheckCircle2 className="w-4 h-4" />
                Accetta Preventivo
              </button>
              <button
                onClick={() => setShowCommentFor('reject')}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-white rounded-lg font-medium bg-red-500 hover:bg-red-600 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Rifiuta
              </button>
            </div>
          )}

          {/* Comment + Confirm */}
          {showCommentFor && (
            <div className="pt-2 border-t border-gray-100 space-y-3">
              <div className={`text-xs font-medium px-3 py-2 rounded-lg ${showCommentFor === 'approve' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {showCommentFor === 'approve' ? '✓ Stai per accettare questo preventivo' : '✗ Stai per rifiutare questo preventivo'}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  Commento (opzionale)
                </label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={2}
                  placeholder="Aggiungi un commento..."
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg resize-none focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction(showCommentFor)}
                  disabled={approving}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm text-white rounded-lg font-medium disabled:opacity-50 ${showCommentFor === 'approve' ? 'bg-green-500' : 'bg-red-500'}`}
                >
                  {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : (showCommentFor === 'approve' ? 'Conferma Accettazione' : 'Conferma Rifiuto')}
                </button>
                <button onClick={() => setShowCommentFor(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600">
                  Annulla
                </button>
              </div>
            </div>
          )}

          {/* Already actioned */}
          {estimate.status === 'Accepted' && (
            <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg border-t border-gray-100 mt-2">
              <CheckCircle2 className="w-4 h-4" />
              Hai accettato questo preventivo
            </div>
          )}
          {estimate.status === 'Rejected' && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border-t border-gray-100 mt-2">
              <XCircle className="w-4 h-4" />
              Hai rifiutato questo preventivo
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Portal ─────────────────────────────────────────────────────────────
export default function ClientPortal() {
  const [user, setUser] = useState(null);
  const [client, setClient] = useState(null);
  const [properties, setProperties] = useState([]);
  const [estimates, setEstimates] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('projects');
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketForm, setTicketForm] = useState({ title: '', issue_type: 'Other', priority: 'Medium', notes: '', property_id: '' });
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);
      const adminCheck = await hasRole(['admin', 'company_admin']);
      setIsAdmin(adminCheck);
      const res = await base44.functions.invoke('getClientPortalData', {});
      const data = res.data;
      if (!data.client) { setLoading(false); return; }
      setClient(data.client);
      setProperties(data.properties || []);
      setEstimates((data.estimates || []).sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      setProjects((data.projects || []).sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      setTickets((data.tickets || []).sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      setDocuments((data.documents || []).sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      setLoading(false);
    };
    load();
  }, []);

  const handleEstimateAction = (id, newStatus) => {
    setEstimates(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e));
  };

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
      <p className="text-sm text-gray-500">Il tuo account ({user?.email}) non risulta associato a nessun profilo cliente. Contatta il team Codex Solution.</p>
    </div>
  );

  const pendingEstimates = estimates.filter(e => e.status === 'Sent');
  const openTickets = tickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length;

  const TABS = [
    { id: 'projects', label: 'Progetti', icon: FolderKanban, badge: projects.length },
    { id: 'estimates', label: 'Preventivi', icon: FileText, badge: pendingEstimates.length || null, badgeColor: 'bg-blue-500' },
    { id: 'documents', label: 'Documenti', icon: Archive, badge: documents.length },
    { id: 'tickets', label: 'Assistenza', icon: Ticket, badge: openTickets || null, badgeColor: 'bg-red-500' },
    { id: 'properties', label: 'Immobili', icon: Home, badge: properties.length },
  ];

  const typeIcon = { Contract: '📄', Estimate: '📋', Invoice: '💰', Certification: '🏆', Warranty: '🛡️', 'Floor Plan': '📐', Photo: '📷', Other: '📁' };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Welcome card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0" style={{ backgroundColor: '#1147FF' }}>
            {client.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Benvenuto, {client.name}</h1>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <Shield className="w-3 h-3 text-green-500" />
              Area Cliente sicura · {client.email}
            </p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => window.location.href = '/'}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Admin
          </button>
        )}
      </div>

      {/* Pending action banner */}
      {pendingEstimates.length > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium cursor-pointer"
          style={{ backgroundColor: '#1147FF0D', borderColor: '#1147FF33', color: '#1147FF' }}
          onClick={() => setActiveTab('estimates')}
        >
          <Clock className="w-4 h-4 flex-shrink-0" />
          {pendingEstimates.length === 1
            ? 'Hai 1 preventivo in attesa di approvazione'
            : `Hai ${pendingEstimates.length} preventivi in attesa di approvazione`}
          <span className="ml-auto text-xs underline">Visualizza</span>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Proprietà', value: properties.length, color: '#0B2341' },
          { label: 'Progetti', value: projects.length, color: '#F58020' },
          { label: 'Documenti', value: documents.length, color: '#10B981' },
          { label: 'Ticket aperti', value: openTickets, color: openTickets > 0 ? '#EF4444' : '#10B981' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <p className="text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
            <p className="text-xs text-gray-400 mt-0.5 leading-tight">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors relative ${
              activeTab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            {t.badge ? (
              <span className={`text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold ${t.badgeColor || 'bg-gray-500'}`}>
                {t.badge > 9 ? '9+' : t.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'projects' && (
        <div className="space-y-3">
          {projects.length === 0 ? (
            <EmptyState icon={FolderKanban} text="Nessun progetto attivo" />
          ) : projects.map(p => <ProjectTimeline key={p.id} project={p} />)}
        </div>
      )}

      {activeTab === 'estimates' && (
        <div className="space-y-3">
          {estimates.length === 0 ? (
            <EmptyState icon={FileText} text="Nessun preventivo" />
          ) : estimates.map(e => (
            <EstimateCard key={e.id} estimate={e} onAction={handleEstimateAction} />
          ))}
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {documents.length === 0 ? (
            <EmptyState icon={Archive} text="Nessun documento" />
          ) : (
            <div className="divide-y divide-gray-50">
              {documents.map(d => (
                <div key={d.id} className="px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{typeIcon[d.type] || '📁'}</span>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{d.title}</p>
                      <p className="text-xs text-gray-400">{d.type}</p>
                    </div>
                  </div>
                  <SecureDocumentLink document={d.signed_url ? { ...d, file_url: d.signed_url } : d} showLabel={false} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'tickets' && (
        <div className="space-y-3">
          <button
            onClick={() => setShowTicketModal(true)}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm text-white rounded-xl font-medium"
            style={{ backgroundColor: '#EF4444' }}
          >
            <Plus className="w-4 h-4" />
            Apri Nuovo Ticket di Assistenza
          </button>
          {tickets.length === 0 ? (
            <EmptyState icon={Ticket} text="Nessun ticket aperto" />
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="divide-y divide-gray-50">
                {tickets.map(t => (
                  <div key={t.id} className="px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{t.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {t.issue_type}
                        {t.assigned_technician ? ` · Tecnico: ${t.assigned_technician}` : ''}
                        {' · '}{new Date(t.created_date).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={t.priority} />
                      <StatusBadge status={t.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'properties' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {properties.length === 0 ? (
            <EmptyState icon={Home} text="Nessuna proprietà" />
          ) : (
            <div className="divide-y divide-gray-50">
              {properties.map(p => (
                <div key={p.id} className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{p.property_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{p.address}{p.type ? ` · ${p.type}` : ''}</p>
                  </div>
                  {p.square_meters && <span className="text-sm text-gray-500">{p.square_meters} m²</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ticket Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Nuovo Ticket di Assistenza</h2>
              <button onClick={() => setShowTicketModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Oggetto *</label>
              <input value={ticketForm.title} onChange={e => setTicketForm(f => ({ ...f, title: e.target.value }))} placeholder="Descrivi brevemente il problema..." className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
                <select value={ticketForm.issue_type} onChange={e => setTicketForm(f => ({ ...f, issue_type: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
                  {[
                  ['Water Leak', 'Perdita Acqua'],
                  ['Electrical', 'Elettrico'],
                  ['Network', 'Rete/Connettività'],
                  ['Security', 'Sicurezza'],
                  ['Maintenance', 'Manutenzione'],
                  ['Other', 'Altro']
                ].map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Priorità</label>
                <select value={ticketForm.priority} onChange={e => setTicketForm(f => ({ ...f, priority: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
                  {[
                  ['Low', 'Bassa'],
                  ['Medium', 'Media'],
                  ['High', 'Alta'],
                  ['Urgent', 'Urgente']
                ].map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                </select>
              </div>
            </div>
            {properties.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Proprietà (opzionale)</label>
                <select value={ticketForm.property_id} onChange={e => setTicketForm(f => ({ ...f, property_id: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
                  <option value="">— Seleziona —</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.property_name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Dettagli</label>
              <textarea value={ticketForm.notes} onChange={e => setTicketForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={submitTicket} disabled={creatingTicket || !ticketForm.title.trim()} className="flex-1 py-2 text-sm text-white rounded-lg font-medium disabled:opacity-40" style={{ backgroundColor: '#EF4444' }}>
                {creatingTicket ? 'Invio...' : 'Invia Ticket'}
              </button>
              <button onClick={() => setShowTicketModal(false)} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-600">Annulla</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 py-12 text-center">
      <Icon className="w-8 h-8 text-gray-200 mx-auto mb-2" />
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  );
}