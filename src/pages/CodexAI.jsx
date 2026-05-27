import { useState, useEffect, useRef } from 'react';
import {
  Send, Bot, Sparkles, ChevronRight, Loader2, Clock, User, Zap, BookOpen,
  FileText, FolderKanban, Ticket, AlertCircle, CheckCircle2, X, Copy,
  RotateCcw, Database, Brain, Shield, Activity, Eye, Search, Filter,
  TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Settings, History,
  Plus, Trash2, Tag, ExternalLink, ChevronDown
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';
import { useQueryClient } from '@tanstack/react-query';

const SESSION_ID = `session_${Date.now()}`;

const QUICK_PROMPTS = [
  { icon: FolderKanban, label: 'Stato progetti', prompt: 'Dammi un riepilogo operativo di tutti i progetti attivi con ritardi e priorità.' },
  { icon: FileText, label: 'Genera preventivo', prompt: 'Aiutami a creare una bozza di preventivo. Cosa mi serve sapere?' },
  { icon: Ticket, label: 'Ticket urgenti', prompt: 'Quali ticket urgenti o critici sono aperti? Come li gestiamo?' },
  { icon: Sparkles, label: 'Analisi margini', prompt: 'Analizza i margini dei progetti recenti. Ci sono anomalie o progetti sotto target?' },
  { icon: BookOpen, label: 'Checklist HVAC', prompt: 'Crea una checklist completa di manutenzione preventiva per un sistema HVAC residenziale.' },
  { icon: Zap, label: 'Briefing giornaliero', prompt: 'Briefing operativo completo: progetti, scadenze, ticket urgenti e manutenzioni di oggi.' },
  { icon: TrendingUp, label: 'Redditività', prompt: 'Analizza la redditività per tipo di progetto. Quali tipologie sono più profittevoli?' },
  { icon: Brain, label: 'Estrai conoscenza', prompt: 'Ci sono progetti completati da cui estrarre lessons learned per la Knowledge Base?' },
];

const ACTION_ICONS = {
  create_task: '✅', create_ticket: '🎫', create_estimate_draft: '📋',
  create_checklist: '☑️', assign_technician: '👷', generate_report: '📊',
  summarize_project: '📝', suggest_pricing: '💶', generate_handover: '🤝',
  update_homepassport: '🏠', extract_knowledge: '🧠', generate_meeting_notes: '📋',
};

const MEMORY_TYPE_LABELS = {
  customer_preference: 'Preferenza Cliente', project_history: 'Storico Progetto',
  recurring_issue: 'Problema Ricorrente', supplier_history: 'Storico Fornitore',
  operational_lesson: 'Lezione Operativa', estimate_outcome: 'Esito Preventivo',
  project_delay: 'Ritardo Progetto', successful_solution: 'Soluzione Riuscita',
  recurring_failure: 'Failure Ricorrente', pricing_pattern: 'Pattern Prezzi',
};

const MEMORY_TYPE_COLORS = {
  customer_preference: 'bg-blue-100 text-blue-700',
  project_history: 'bg-purple-100 text-purple-700',
  recurring_issue: 'bg-red-100 text-red-700',
  supplier_history: 'bg-yellow-100 text-yellow-700',
  operational_lesson: 'bg-green-100 text-green-700',
  estimate_outcome: 'bg-indigo-100 text-indigo-700',
  project_delay: 'bg-orange-100 text-orange-700',
  successful_solution: 'bg-emerald-100 text-emerald-700',
  recurring_failure: 'bg-rose-100 text-rose-700',
  pricing_pattern: 'bg-teal-100 text-teal-700',
};

// ── Action Param Fields config ────────────────────────────────────────────────
const ACTION_FIELDS = {
  create_estimate_draft: [
    { key: 'title', label: 'Titolo preventivo', required: true },
    { key: 'estimate_type', label: 'Tipo', type: 'select', options: ['Bathroom','Full Home','Electrical System','Networking','Security','Roofing','Maintenance','Other'] },
    { key: 'quality_level', label: 'Livello qualità', type: 'select', options: ['Essential','Smart','Intelligence'] },
    { key: 'notes', label: 'Note', type: 'textarea' },
  ],
  create_task: [
    { key: 'title', label: 'Titolo task', required: true },
    { key: 'description', label: 'Descrizione', type: 'textarea' },
    { key: 'assigned_to', label: 'Assegnato a' },
    { key: 'priority', label: 'Priorità', type: 'select', options: ['Low','Medium','High','Urgent'] },
    { key: 'due_date', label: 'Scadenza', type: 'date' },
  ],
  create_checklist: [
    { key: 'title', label: 'Titolo', required: true },
    { key: 'description', label: 'Descrizione', type: 'textarea' },
    { key: 'category', label: 'Categoria', type: 'select', options: ['Bathroom','Full Home','Electrical','Networking','Security','Roofing','Handover'] },
    { key: 'assigned_person', label: 'Assegnato a' },
  ],
  create_ticket: [
    { key: 'title', label: 'Oggetto', required: true },
    { key: 'issue_type', label: 'Tipo', type: 'select', options: ['Water Leak','Electrical','Network','Security','Maintenance','Other'] },
    { key: 'priority', label: 'Priorità', type: 'select', options: ['Low','Medium','High','Urgent'] },
    { key: 'notes', label: 'Note', type: 'textarea' },
  ],
  assign_technician: [
    { key: 'technician', label: 'Nome tecnico', required: true },
    { key: 'project_id', label: 'ID Progetto (o lascia vuoto per ticket)' },
    { key: 'ticket_id', label: 'ID Ticket' },
  ],
  generate_report: [
    { key: 'project_id', label: 'ID Progetto', required: true },
    { key: 'report_type', label: 'Tipo report', type: 'select', options: ['full','progress','financial','checklist'] },
  ],
  summarize_project: [
    { key: 'project_id', label: 'ID Progetto', required: true },
  ],
  suggest_pricing: [
    { key: 'estimate_type', label: 'Tipo lavoro', type: 'select', options: ['Bathroom','Full Home','Electrical System','Networking','Security','Roofing','Maintenance','Other'] },
    { key: 'quality_level', label: 'Livello qualità', type: 'select', options: ['Essential','Smart','Intelligence'] },
    { key: 'square_meters', label: 'Metri quadrati', type: 'number' },
  ],
  generate_meeting_notes: [
    { key: 'subject', label: 'Oggetto riunione', required: true },
    { key: 'participants', label: 'Partecipanti' },
    { key: 'agenda', label: 'Agenda / punti principali', type: 'textarea' },
    { key: 'date', label: 'Data', type: 'date' },
  ],
  generate_handover: [
    { key: 'project_id', label: 'ID Progetto', required: true },
  ],
  update_homepassport: [
    { key: 'property_id', label: 'ID Proprietà', required: true },
    { key: 'electrical_notes', label: 'Note impianto elettrico', type: 'textarea' },
    { key: 'plumbing_notes', label: 'Note idraulico', type: 'textarea' },
    { key: 'networking_notes', label: 'Note networking', type: 'textarea' },
    { key: 'security_notes', label: 'Note sicurezza', type: 'textarea' },
  ],
};

// ── Message Component ────────────────────────────────────────────────────────
function Message({ msg, onActionConfirm }) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${isUser ? 'bg-gray-200' : ''}`}
        style={!isUser ? { backgroundColor: '#1147FF' } : {}}>
        {isUser ? <User className="w-4 h-4 text-gray-600" /> : <Bot className="w-4 h-4 text-white" />}
      </div>
      <div className={`flex-1 min-w-0 ${isUser ? 'flex flex-col items-end' : ''}`}>
        <div className={`rounded-2xl px-4 py-3 text-sm max-w-[85%] ${isUser ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
          {isUser ? (
            <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
          ) : (
            <ReactMarkdown
              className="prose prose-sm prose-gray max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
              components={{
                code: ({ inline, children }) => inline
                  ? <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">{children}</code>
                  : <pre className="bg-gray-900 text-green-400 p-3 rounded-xl text-xs overflow-x-auto my-2"><code>{children}</code></pre>,
                p: ({ children }) => <p className="my-1.5 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="my-2 ml-4 space-y-1 list-disc">{children}</ul>,
                ol: ({ children }) => <ol className="my-2 ml-4 space-y-1 list-decimal">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                h3: ({ children }) => <h3 className="font-semibold text-gray-900 mt-3 mb-1">{children}</h3>,
                blockquote: ({ children }) => <blockquote className="border-l-2 border-blue-300 pl-3 text-gray-600 italic my-2">{children}</blockquote>,
              }}
            >
              {msg.content}
            </ReactMarkdown>
          )}
        </div>
        {!isUser && msg.actions?.length > 0 && (
          <div className="mt-2 max-w-[85%]">
            <p className="text-xs text-gray-400 mb-1.5 ml-1">Azioni suggerite — richiedono conferma:</p>
            <div className="flex flex-wrap gap-2">
              {msg.actions.map((action, idx) => (
                <button key={idx} onClick={() => onActionConfirm(action)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors shadow-sm">
                  <span>{ACTION_ICONS[action.type] || '⚡'}</span>
                  {action.label}
                  <ChevronRight className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>
        )}
        {!isUser && (
          <div className="flex items-center gap-3 mt-1.5 ml-1">
            {msg.context_used?.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Database className="w-3 h-3" />{msg.context_used.join(', ')}
              </span>
            )}
            {msg.latency_ms && <span className="text-xs text-gray-300">{msg.latency_ms}ms</span>}
            <button onClick={() => { navigator.clipboard.writeText(msg.content); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="text-gray-300 hover:text-gray-500 transition-colors">
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
        <p className="text-xs text-gray-300 mt-1 mx-1">{msg.time}</p>
      </div>
    </div>
  );
}

// ── Action Confirm Modal ─────────────────────────────────────────────────────
function ActionConfirmModal({ action, onConfirm, onCancel }) {
  const [editedParams, setEditedParams] = useState({ ...(action.params || {}) });
  const fields = ACTION_FIELDS[action.type] || [];
  const setField = (key, val) => setEditedParams(p => ({ ...p, [key]: val }));
  const isReady = fields.filter(f => f.required).every(f => editedParams[f.key]?.toString().trim());

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl flex-shrink-0">
            {ACTION_ICONS[action.type] || '⚡'}
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{action.label}</h3>
            <p className="text-xs text-gray-500">Completa i parametri — verrà registrata nell'audit log</p>
          </div>
        </div>

        {fields.length > 0 && (
          <div className="space-y-3">
            {fields.map(field => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                {field.type === 'select' ? (
                  <select value={editedParams[field.key] || ''} onChange={e => setField(field.key, e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-blue-300">
                    <option value="">— Seleziona —</option>
                    {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea value={editedParams[field.key] || ''} onChange={e => setField(field.key, e.target.value)}
                    rows={2} placeholder={`${field.label}...`}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-blue-300" />
                ) : (
                  <input type={field.type || 'text'} value={editedParams[field.key] || ''} onChange={e => setField(field.key, e.target.value)}
                    placeholder={`${field.label}...`}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-300" />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
          <Shield className="w-3.5 h-3.5 flex-shrink-0" />
          Azione tracciata · Permessi verificati · AI Safety policy applicata
        </div>
        <div className="flex gap-2">
          <button onClick={() => onConfirm(editedParams)} disabled={!isReady}
            className="flex-1 py-2.5 text-sm text-white rounded-xl font-medium disabled:opacity-40 transition-opacity"
            style={{ backgroundColor: '#1147FF' }}>
            Conferma ed Esegui
          </button>
          <button onClick={onCancel} className="flex-1 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-600">Annulla</button>
        </div>
      </div>
    </div>
  );
}

// ── Chat Tab ──────────────────────────────────────────────────────────────────
const chatSendRef = { current: null };

function ChatTab({ user }) {
  const [messages, setMessages] = useState([{
    id: 'welcome', role: 'assistant',
    content: `Ciao **${user?.full_name || ''}**! Sono **Codex AI**, il tuo assistente operativo intelligente.\n\nHo accesso a tutti i tuoi dati operativi — progetti, preventivi, ticket, clienti, manutenzioni, knowledge base e memoria storica. Rispondo con piena consapevolezza contestuale.\n\nCosa posso fare per te oggi?`,
    time: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
    context_used: [],
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);
  const bottomRef = useRef(null);
  const qc = useQueryClient();

  chatSendRef.current = (text) => send(text);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: msg, time: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) }]);
    setLoading(true);
    const res = await base44.functions.invoke('codexAIChat', { message: msg, session_id: SESSION_ID });
    const d = res.data;
    setMessages(prev => [...prev, {
      id: Date.now() + 1, role: 'assistant',
      content: d.response || 'Errore nella risposta AI.',
      time: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      actions: d.suggested_actions || [], context_used: d.context_used || [], latency_ms: d.latency_ms,
    }]);
    setLoading(false);
  };

  const execAction = async (action, editedParams) => {
    setPendingAction(null);
    const finalAction = { ...action, params: { ...action.params, ...editedParams } };
    let feedbackText = '';
    let feedbackType = 'success';
    try {
      const res = await base44.functions.invoke('executeAIAction', {
        action_type: finalAction.type,
        params: finalAction.params,
        session_id: SESSION_ID,
        confirmed: true,
      });
      const data = res.data;
      if (data.error) throw new Error(data.error);
      feedbackText = `✅ ${finalAction.label} completata con successo!`;
      if (data.result?.summary) {
        setMessages(prev => [...prev, {
          id: Date.now() + 2, role: 'assistant',
          content: data.result.summary,
          time: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
          actions: [], context_used: ['ai_action'], latency_ms: data.latency_ms,
        }]);
      }
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['tickets'] });
    } catch (e) {
      feedbackText = `⚠️ "${finalAction.label}" non completata: ${e.message}`;
      feedbackType = 'error';
    }
    setActionFeedback({ text: feedbackText, type: feedbackType });
    setTimeout(() => setActionFeedback(null), 6000);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.map(msg => <Message key={msg.id} msg={msg} onActionConfirm={a => setPendingAction(a)} />)}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#1147FF' }}><Bot className="w-4 h-4 text-white" /></div>
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#1147FF' }} />
              <span className="text-sm text-gray-400">Analizzando contesto operativo...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {actionFeedback && (
        <div className={`mx-6 mb-2 px-4 py-3 border rounded-xl text-sm flex items-center justify-between ${
          actionFeedback.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'
        }`}>
          <span>{actionFeedback.text}</span>
          <button onClick={() => setActionFeedback(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="lg:hidden flex gap-2 px-4 pb-2 overflow-x-auto">
        {QUICK_PROMPTS.slice(0, 4).map((qp, idx) => (
          <button key={idx} onClick={() => send(qp.prompt)} className="flex-shrink-0 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 bg-white hover:bg-gray-50 whitespace-nowrap">{qp.label}</button>
        ))}
      </div>

      <div className="px-6 pb-6">
        <div className="flex gap-3 items-end bg-white border border-gray-200 rounded-2xl p-3 shadow-sm focus-within:border-blue-300 focus-within:shadow-md transition-all">
          <textarea value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Chiedi qualcosa a Codex AI... (Invio per inviare)"
            rows={1} className="flex-1 resize-none text-sm text-gray-900 placeholder-gray-400 bg-transparent outline-none leading-relaxed max-h-32" />
          <button onClick={() => send()} disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
            style={{ backgroundColor: input.trim() && !loading ? '#1147FF' : '#E5E7EB' }}>
            <Send className={`w-4 h-4 ${input.trim() && !loading ? 'text-white' : 'text-gray-400'}`} />
          </button>
        </div>
        <p className="text-xs text-gray-300 text-center mt-2">Codex AI ha accesso ai dati aziendali · Ogni interazione viene registrata nell'Audit Log</p>
      </div>

      {pendingAction && (
        <ActionConfirmModal
          action={pendingAction}
          onConfirm={(edited) => execAction(pendingAction, edited)}
          onCancel={() => setPendingAction(null)}
        />
      )}
    </div>
  );
}

// ── Insights Tab ─────────────────────────────────────────────────────────────
function InsightsTab() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    base44.entities.IntelligenceInsight.list('-created_date', 20).then(d => { setInsights(d); setLoading(false); });
  }, []);

  const generateInsights = async () => {
    setGenerating(true);
    await base44.functions.invoke('generateIntelligenceInsights', {});
    const fresh = await base44.entities.IntelligenceInsight.list('-created_date', 20);
    setInsights(fresh);
    setGenerating(false);
  };

  const markRead = async (id) => {
    await base44.entities.IntelligenceInsight.update(id, { is_read: true });
    setInsights(prev => prev.map(i => i.id === id ? { ...i, is_read: true } : i));
  };

  const SEVERITY_STYLE = { Low: 'bg-gray-100 text-gray-600', Medium: 'bg-yellow-100 text-yellow-700', High: 'bg-orange-100 text-orange-700', Critical: 'bg-red-100 text-red-700' };
  const TYPE_ICON = { Profitability: '💰', Pricing: '💶', 'Team Performance': '👥', 'Supplier Performance': '🏭', 'Project Health': '🏗️', Trend: '📈', Risk: '⚠️', Opportunity: '✨' };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-900">AI Insights Engine</h2>
          <p className="text-sm text-gray-500">{insights.filter(i => !i.is_read).length} nuovi insight · Analisi automatica dei dati operativi</p>
        </div>
        <button onClick={generateInsights} disabled={generating}
          className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-xl font-medium disabled:opacity-60"
          style={{ backgroundColor: '#1147FF' }}>
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {generating ? 'Generando...' : 'Genera Insights'}
        </button>
      </div>
      {insights.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Lightbulb className="w-10 h-10 mx-auto mb-3 text-gray-200" />
          <p className="font-medium text-gray-500">Nessun insight disponibile</p>
          <p className="text-sm mt-1">Clicca "Genera Insights" per analizzare i dati operativi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map(insight => (
            <div key={insight.id} className={`bg-white rounded-xl border p-4 ${insight.is_read ? 'border-gray-200 opacity-70' : 'border-blue-200 shadow-sm'}`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">{TYPE_ICON[insight.insight_type] || '💡'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-gray-900 text-sm">{insight.title}</h3>
                    {!insight.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_STYLE[insight.severity] || 'bg-gray-100 text-gray-600'}`}>{insight.severity}</span>
                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{insight.insight_type}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                  {insight.recommendation && (
                    <div className="flex items-start gap-2 bg-blue-50 rounded-lg px-3 py-2">
                      <ChevronRight className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-700 font-medium">{insight.recommendation}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-400">{insight.created_date ? new Date(insight.created_date).toLocaleDateString('it-IT') : ''}</span>
                    {!insight.is_read && (
                      <button onClick={() => markRead(insight.id)} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Segna come letto
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Memory Tab ───────────────────────────────────────────────────────────────
function MemoryTab() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newMem, setNewMem] = useState({ memory_type: 'operational_lesson', title: '', content: '' });

  useEffect(() => {
    base44.entities.AIMemory.filter({ is_active: true }, '-created_date', 50).then(d => { setMemories(d); setLoading(false); });
  }, []);

  const addMemory = async () => {
    if (!newMem.title || !newMem.content) return;
    const created = await base44.entities.AIMemory.create({ ...newMem, source: 'manual', is_active: true, relevance_score: 0.8 });
    setMemories(prev => [created, ...prev]);
    setNewMem({ memory_type: 'operational_lesson', title: '', content: '' });
    setShowAdd(false);
  };

  const deleteMemory = async (id) => {
    await base44.entities.AIMemory.update(id, { is_active: false });
    setMemories(prev => prev.filter(m => m.id !== id));
  };

  const filtered = memories.filter(m => {
    if (filter !== 'all' && m.memory_type !== filter) return false;
    if (search && !m.title?.toLowerCase().includes(search.toLowerCase()) && !m.content?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-900">AI Memory System</h2>
          <p className="text-sm text-gray-500">{memories.length} memorie operative · Usate per contestualizzare le risposte</p>
        </div>
        <button onClick={() => setShowAdd(v => !v)} className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-xl font-medium" style={{ backgroundColor: '#1147FF' }}>
          <Plus className="w-4 h-4" /> Aggiungi
        </button>
      </div>
      {showAdd && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-blue-900 text-sm">Nuova Memoria Operativa</h3>
          <select value={newMem.memory_type} onChange={e => setNewMem(p => ({ ...p, memory_type: e.target.value }))} className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg bg-white">
            {Object.entries(MEMORY_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input value={newMem.title} onChange={e => setNewMem(p => ({ ...p, title: e.target.value }))} placeholder="Titolo..." className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg" />
          <textarea value={newMem.content} onChange={e => setNewMem(p => ({ ...p, content: e.target.value }))} placeholder="Contenuto..." rows={3} className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg resize-none" />
          <div className="flex gap-2">
            <button onClick={addMemory} className="px-4 py-2 text-sm text-white rounded-lg" style={{ backgroundColor: '#1147FF' }}>Salva</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600">Annulla</button>
          </div>
        </div>
      )}
      <div className="flex gap-2 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 flex-1 min-w-40">
          <Search className="w-3.5 h-3.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca..." className="flex-1 text-sm outline-none" />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white">
          <option value="all">Tutti i tipi</option>
          {Object.entries(MEMORY_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Brain className="w-10 h-10 mx-auto mb-3 text-gray-200" />
          <p>Nessuna memoria trovata</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(mem => (
            <div key={mem.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-3 hover:border-gray-300 transition-colors">
              <Brain className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="font-medium text-gray-900 text-sm">{mem.title}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MEMORY_TYPE_COLORS[mem.memory_type] || 'bg-gray-100 text-gray-600'}`}>
                    {MEMORY_TYPE_LABELS[mem.memory_type] || mem.memory_type}
                  </span>
                  {mem.source === 'ai_extracted' && <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">AI Estratto</span>}
                </div>
                <p className="text-sm text-gray-500 line-clamp-2">{mem.content}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  {mem.linked_entity_type && <span className="text-xs text-gray-400 flex items-center gap-1"><Tag className="w-3 h-3" />{mem.linked_entity_type}</span>}
                  <span className="text-xs text-gray-300">{mem.created_date ? new Date(mem.created_date).toLocaleDateString('it-IT') : ''}</span>
                </div>
              </div>
              <button onClick={() => deleteMemory(mem.id)} className="p-1 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Audit Tab ─────────────────────────────────────────────────────────────────
function AuditTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    base44.entities.AIAuditLog.list('-created_date', 50).then(d => { setLogs(d); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;

  return (
    <div className="p-6 space-y-4">
      <div>
        <h2 className="font-bold text-gray-900">AI Audit Log</h2>
        <p className="text-sm text-gray-500">{logs.length} interazioni registrate · Ogni prompt, contesto e azione tracciati</p>
      </div>
      {logs.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <History className="w-10 h-10 mx-auto mb-3 text-gray-200" />
          <p>Nessuna interazione registrata ancora</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <div key={log.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <button onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{log.prompt}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">{log.user_email}</span>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400">{log.user_role}</span>
                    {log.actions_executed?.length > 0 && (
                      <span className="text-xs text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">{log.actions_executed.length} azioni</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {log.latency_ms && <span className="text-xs text-gray-300">{log.latency_ms}ms</span>}
                  <span className="text-xs text-gray-400">{log.created_date ? new Date(log.created_date).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expanded === log.id ? 'rotate-180' : ''}`} />
                </div>
              </button>
              {expanded === log.id && (
                <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-2">
                  {log.context_used?.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-gray-500">Contesto usato:</span>
                      {log.context_used.map(c => <span key={c} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{c}</span>)}
                    </div>
                  )}
                  {log.response_summary && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Risposta AI (sintesi):</p>
                      <p className="text-xs text-gray-700">{log.response_summary}</p>
                    </div>
                  )}
                  {log.actions_executed?.length > 0 && (
                    <div className="bg-orange-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-orange-700 mb-1">Azioni eseguite:</p>
                      {log.actions_executed.map((a, i) => (
                        <p key={i} className="text-xs text-orange-600">{ACTION_ICONS[a.type] || '⚡'} {a.type}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Architecture Tab ──────────────────────────────────────────────────────────
function ArchitectureTab() {
  const sections = [
    {
      title: 'LLM Providers', icon: Brain,
      items: [
        { name: 'Base44 AI (Default)', status: 'active', note: 'InvokeLLM — gpt-4o-mini, Claude Sonnet, Gemini' },
        { name: 'OpenAI Direct', status: 'placeholder', note: 'Richiede OPENAI_API_KEY' },
        { name: 'Anthropic Claude', status: 'placeholder', note: 'Richiede ANTHROPIC_API_KEY' },
        { name: 'Local Models (Ollama)', status: 'placeholder', note: 'Llama3, Mistral, Phi3 — self-hosted' },
      ],
    },
    {
      title: 'Vector DB / RAG', icon: Database,
      items: [
        { name: 'RAGDocument Entity (Keyword)', status: 'active', note: 'Chunking + keyword retrieval — attivo' },
        { name: 'Pinecone', status: 'placeholder', note: 'High-performance vector search' },
        { name: 'Weaviate', status: 'placeholder', note: 'Open-source vector DB' },
        { name: 'pgvector', status: 'placeholder', note: 'PostgreSQL extension' },
      ],
    },
    {
      title: 'Document Processing', icon: FileText,
      items: [
        { name: 'Text Extraction (Entità)', status: 'active', note: 'Chunking su campi testo — attivo' },
        { name: 'PDF OCR (Tesseract)', status: 'placeholder', note: 'Estrazione testo da PDF' },
        { name: 'Google Vision API', status: 'placeholder', note: 'OCR avanzato + analisi immagini' },
        { name: 'AWS Textract', status: 'placeholder', note: 'OCR enterprise per contratti' },
      ],
    },
    {
      title: 'Voice & Multimodal', icon: Activity,
      items: [
        { name: 'Whisper (Base44)', status: 'active', note: 'Trascrizione audio — disponibile' },
        { name: 'ElevenLabs TTS', status: 'placeholder', note: 'Text-to-speech premium' },
        { name: 'GPT-4 Vision', status: 'placeholder', note: 'Analisi immagini cantiere' },
        { name: 'Voice Assistant', status: 'placeholder', note: 'Input vocale per tecnici mobile' },
      ],
    },
  ];

  const STATUS_STYLE = { active: 'bg-green-100 text-green-700', placeholder: 'bg-gray-100 text-gray-500' };
  const STATUS_LABEL = { active: '✓ Attivo', placeholder: '◦ Futuro' };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="font-bold text-gray-900">AI Architecture Layer</h2>
        <p className="text-sm text-gray-500">Architettura modulare future-ready — attiva i provider quando necessario</p>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
        <strong>RAG Pipeline:</strong> Ingest → Chunk → Embed → Store → Retrieve → Augment → Generate
        <span className="text-xs text-blue-500 ml-2">Chunk: 500 token · Overlap: 50 · Top-K: 6</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sections.map(section => (
          <div key={section.title} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <section.icon className="w-4 h-4 text-gray-500" />
              <h3 className="font-semibold text-gray-900 text-sm">{section.title}</h3>
            </div>
            <div className="space-y-2">
              {section.items.map(item => (
                <div key={item.name} className="flex items-start gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium flex-shrink-0 mt-0.5 ${STATUS_STYLE[item.status]}`}>{STATUS_LABEL[item.status]}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <h3 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4" /> AI Safety
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-xs text-gray-600">
          <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-green-500" /> RBAC — filtro automatico per ruolo</div>
          <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-green-500" /> Conferma obbligatoria per ogni azione AI</div>
          <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-green-500" /> Audit log completo ogni interazione</div>
          <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-green-500" /> Blocco dati finanziari per client/technician</div>
          <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-green-500" /> Cross-tenant isolation via company_id</div>
          <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-green-500" /> Permission matrix per action type + role</div>
          <div className="flex items-center gap-1.5"><AlertCircle className="w-3 h-3 text-gray-400" /> Rate limiting (placeholder)</div>
          <div className="flex items-center gap-1.5"><AlertCircle className="w-3 h-3 text-gray-400" /> PII detection (placeholder)</div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CodexAI() {
  const [activeTab, setActiveTab] = useState('chat');
  const [user, setUser] = useState(null);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const TABS = [
    { id: 'chat', label: 'Chat', icon: Bot },
    { id: 'insights', label: 'Insights', icon: Lightbulb },
    { id: 'memory', label: 'Memoria', icon: Brain },
    { id: 'audit', label: 'Audit Log', icon: History },
    { id: 'architecture', label: 'Architettura', icon: Settings },
  ];

  return (
    <div className="flex h-full bg-gray-50 overflow-hidden">
      {activeTab === 'chat' && (
        <div className="w-56 flex-shrink-0 bg-white border-r border-gray-200 flex-col hidden lg:flex">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#1147FF' }}>
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-sm">Codex AI</h2>
                <p className="text-xs text-gray-400">Operational Intelligence</p>
              </div>
            </div>
          </div>
          <div className="p-3 flex-1 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">Prompt rapidi</p>
            {QUICK_PROMPTS.map((qp, idx) => (
              <button key={idx} onClick={() => chatSendRef.current?.(qp.prompt)}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left hover:bg-gray-50 transition-colors group">
                <qp.icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 group-hover:text-blue-500" />
                <span className="text-xs text-gray-600 group-hover:text-gray-900">{qp.label}</span>
              </button>
            ))}
          </div>
          <div className="p-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center">
                <User className="w-3 h-3 text-gray-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">{user?.full_name || 'Utente'}</p>
                <p className="text-xs text-gray-400">{user?.role || ''}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex items-center gap-1 px-4 py-2 bg-white border-b border-gray-200 flex-shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1.5 mr-4 flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-bold text-gray-700">Codex AI</span>
          </div>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? 'text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
              style={activeTab === tab.id ? { backgroundColor: '#1147FF' } : {}}>
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'chat' && <ChatTab user={user} />}
          {activeTab === 'insights' && <InsightsTab />}
          {activeTab === 'memory' && <MemoryTab />}
          {activeTab === 'audit' && <AuditTab />}
          {activeTab === 'architecture' && <ArchitectureTab />}
        </div>
      </div>
    </div>
  );
}