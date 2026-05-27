import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send, Bot, Sparkles, Loader2, User, Copy, CheckCircle2, X, Lock,
  Plus, ChevronRight, Database, Shield, Brain, Lightbulb,
  FileText, FolderKanban, Ticket, TrendingUp, Wrench,
  MessageSquare, Clock, Paperclip, Search, Trash2,
  AlertCircle, BarChart2, Users, Home, Zap, BookOpen, DollarSign,
  ChevronDown, Eye, EyeOff, Circle
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';
import { useQueryClient } from '@tanstack/react-query';
import ActionConfirmModal from '../components/ai/ActionConfirmModal';
import ContextFocusPicker from '../components/ai/ContextFocusPicker';
import PlatformIntelligenceScore from '../components/ai/PlatformIntelligenceScore';
import AIReadinessState from '../components/ai/AIReadinessState';

// ── Constants ──────────────────────────────────────────────────────────────────
const SESSION_KEY = 'codex_ai_v2_conversations';

const SUGGESTED_PROMPTS = [
  { icon: FolderKanban, label: 'Stato progetti',      prompt: 'Dammi un briefing operativo completo: progetti attivi, ritardi, priorità urgenti.', tag: 'Operativo' },
  { icon: TrendingUp,   label: 'Analisi margini',     prompt: 'Analizza i margini dei progetti recenti. Ci sono anomalie o progetti sotto target?', tag: 'Finanza' },
  { icon: FileText,     label: 'Bozza preventivo',    prompt: 'Aiutami a strutturare un nuovo preventivo. Da dove cominciamo?', tag: 'Commerciale' },
  { icon: Wrench,       label: 'Checklist tecnica',   prompt: 'Crea una checklist di manutenzione preventiva per impianti HVAC residenziali.', tag: 'Tecnico' },
  { icon: Users,        label: 'Update cliente',      prompt: 'Genera un aggiornamento professionale per il cliente sullo stato del progetto.', tag: 'Clienti' },
  { icon: BarChart2,    label: 'Redditività tipo',    prompt: 'Quali tipologie di progetto generano i margini più alti? Analisi con dati storici.', tag: 'Insights' },
];

const QUICK_ACTIONS = [
  { icon: Sparkles,      label: 'Briefing del giorno', prompt: 'Briefing completo: progetti, scadenze, ticket urgenti e manutenzioni di oggi.' },
  { icon: FileText,      label: 'Nuovo preventivo',    prompt: 'Crea una bozza di preventivo. Che tipo di lavoro configuro?' },
  { icon: Ticket,        label: 'Apri ticket',         prompt: 'Voglio aprire un ticket di supporto. Guidami.' },
  { icon: Brain,         label: 'Cosa ho imparato?',   prompt: 'Quali lessons learned sono state estratte dai progetti recenti? Sintesi intelligente.' },
];

const SOURCE_LABELS = {
  projects: 'Progetti', tickets: 'Ticket', estimates: 'Preventivi',
  clients: 'Clienti', properties: 'Immobili', guardian: 'Guardian',
  knowledge_base: 'Knowledge Base', ai_memory: 'Memoria AI',
  project_financials: 'Finanze', rag_documents: 'Documenti',
  focused_project: 'Progetto', focused_client: 'Cliente',
  focused_property_homepassport: 'Fascicolo Immobile', focused_estimate: 'Preventivo',
  timesheets: 'Timesheet', financial_alerts: 'Alert', intelligence: 'Insights',
};

const ACTION_ICONS = {
  create_task: '✅', create_ticket: '🎫', create_estimate_draft: '📋',
  create_checklist: '☑️', assign_technician: '👷', generate_report: '📊',
  summarize_project: '📝', suggest_pricing: '💶', generate_handover: '🤝',
  update_homepassport: '🏠', generate_meeting_notes: '📋',
};

function genId() { return `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`; }
function genConvId() { return `c_${Date.now()}`; }
function fmtTime(ts) { return new Date(ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }); }
function fmtDate(ts) {
  const d = new Date(ts); const t = new Date();
  if (d.toDateString() === t.toDateString()) return 'Oggi';
  const y = new Date(t); y.setDate(t.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return 'Ieri';
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

// ── Message Bubble ─────────────────────────────────────────────────────────────
function MessageBubble({ msg, onActionConfirm }) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`group flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
        isUser ? 'bg-[#1a1a2e] text-white/80' : 'bg-[#0B2341]'
      }`}>
        {isUser
          ? <User className="w-3.5 h-3.5" />
          : <Bot className="w-3.5 h-3.5 text-white" />
        }
      </div>

      <div className={`flex-1 min-w-0 space-y-1 ${isUser ? 'items-end flex flex-col' : ''}`}>
        {/* Bubble */}
        <div className={`inline-block max-w-[88%] rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-[#0f172a] text-slate-100 px-4 py-2.5 rounded-tr-sm'
            : 'bg-white border border-slate-100 text-slate-800 px-4 py-3 rounded-tl-sm shadow-sm'
        }`}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{msg.content}</p>
          ) : (
            <ReactMarkdown
              className="prose prose-sm prose-slate max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
              components={{
                code: ({ inline, children }) => inline
                  ? <code className="font-mono text-xs bg-slate-100 text-violet-600 px-1.5 py-0.5 rounded">{children}</code>
                  : <pre className="bg-[#0f172a] text-emerald-400 p-3 rounded-xl text-xs overflow-x-auto my-2 border border-slate-800"><code>{children}</code></pre>,
                p: ({ children }) => <p className="my-1.5 leading-relaxed text-slate-700">{children}</p>,
                ul: ({ children }) => <ul className="my-2 ml-4 space-y-0.5 list-disc marker:text-slate-400">{children}</ul>,
                ol: ({ children }) => <ol className="my-2 ml-4 space-y-0.5 list-decimal marker:text-slate-400">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed text-slate-700">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
                h2: ({ children }) => <h2 className="font-semibold text-slate-900 text-sm mt-4 mb-1.5">{children}</h2>,
                h3: ({ children }) => <h3 className="font-medium text-slate-900 text-sm mt-3 mb-1">{children}</h3>,
                blockquote: ({ children }) => <blockquote className="border-l-2 border-blue-300 pl-3 text-slate-600 italic my-2">{children}</blockquote>,
                table: ({ children }) => <div className="overflow-x-auto my-2 rounded-lg border border-slate-200"><table className="text-xs border-collapse w-full">{children}</table></div>,
                th: ({ children }) => <th className="bg-slate-50 border-b border-slate-200 px-3 py-2 text-left font-medium text-slate-600">{children}</th>,
                td: ({ children }) => <td className="border-b border-slate-100 px-3 py-1.5 text-slate-700">{children}</td>,
              }}
            >
              {msg.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Suggested Actions */}
        {!isUser && msg.actions?.length > 0 && (
          <div className="max-w-[88%] space-y-1.5 pt-1">
            <p className="text-[11px] text-slate-400 font-medium tracking-wide uppercase flex items-center gap-1.5 px-0.5">
              <Zap className="w-2.5 h-2.5" /> Azioni disponibili
            </p>
            <div className="flex flex-wrap gap-1.5">
              {msg.actions.map((action, idx) => (
                <button key={idx} onClick={() => onActionConfirm(action)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all shadow-sm">
                  <span className="text-[13px]">{ACTION_ICONS[action.type] || '⚡'}</span>
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Citations */}
        {!isUser && msg.citations?.length > 0 && (
          <div className="max-w-[88%] space-y-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-0.5">Fonti</p>
            <div className="flex flex-wrap gap-1">
              {msg.citations.map((c, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-[11px] bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors cursor-default"
                  title={c.chunk_preview || c.title}>
                  <span className="opacity-60 capitalize">{c.type?.replace('_',' ')}</span>
                  <span className="text-slate-400">·</span>
                  <span className="truncate max-w-24">{c.title}</span>
                  {c.score !== undefined && <span className="opacity-40">{Math.round(c.score * 100)}%</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer meta */}
        <div className={`flex items-center gap-3 px-0.5 ${isUser ? 'flex-row-reverse' : ''}`}>
          {!isUser && msg.confidence_level && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium flex-shrink-0 ${
              msg.confidence_level === 'High' ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
              : msg.confidence_level === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-200'
              : 'bg-red-50 text-red-600 border-red-200'
            }`} title={msg.confidence_reason}>
              {msg.confidence_level}
            </span>
          )}
          <span className="text-[11px] text-slate-300">{fmtTime(msg.timestamp)}</span>
          {!isUser && msg.context_used?.length > 0 && (
            <span className="text-[11px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <Database className="w-2.5 h-2.5" />
              {msg.context_used.slice(0, 2).map(c => SOURCE_LABELS[c] || c).join(', ')}
              {msg.context_used.length > 2 && ` +${msg.context_used.length - 2}`}
            </span>
          )}
          {!isUser && (
            <button onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-slate-600">
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
          {!isUser && msg.latency_ms && (
            <span className="text-[11px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
              {msg.latency_ms}ms
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sources Panel ──────────────────────────────────────────────────────────────
function SourcesPanel({ lastMsg }) {
  if (!lastMsg || lastMsg.role !== 'assistant' || !lastMsg.context_used?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
          <Database className="w-4 h-4 text-slate-400" />
        </div>
        <p className="text-xs font-medium text-slate-500">Fonti di contesto</p>
        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
          Appariranno qui dopo la prima risposta
        </p>
      </div>
    );
  }

  const ctx = lastMsg.context_used;

  // Group sources
  const groups = [
    { label: 'Entità operativa', keys: ['projects', 'tickets', 'estimates', 'clients', 'properties', 'guardian', 'timesheets'] },
    { label: 'Entità focus', keys: ctx.filter(c => c.startsWith('focused_') || c.startsWith('client_') || c.startsWith('project_') || c.startsWith('property_')) },
    { label: 'Intelligence', keys: ['financial_alerts', 'intelligence', 'ai_memory', 'knowledge_base'] },
    { label: 'Documenti', keys: ['rag_documents'] },
  ];

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Contesto recuperato</p>
        <span className="text-[11px] text-slate-400 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-md">{ctx.length}</span>
      </div>

      {lastMsg.latency_ms && (
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <Clock className="w-3 h-3" /> {lastMsg.latency_ms}ms · <Shield className="w-3 h-3 text-emerald-500" /><span className="text-emerald-600">RBAC ✓</span>
        </div>
      )}

      {groups.map(group => {
        const items = Array.isArray(group.keys) ? group.keys.filter(k => ctx.includes(k)) : group.keys;
        if (!items.length) return null;
        return (
          <div key={group.label}>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{group.label}</p>
            <div className="space-y-1">
              {items.map(item => (
                <div key={item} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white border border-slate-100 text-[11px] text-slate-600 hover:border-slate-200 transition-colors">
                  <Circle className="w-1.5 h-1.5 text-blue-400 fill-blue-400 flex-shrink-0" />
                  <span className="flex-1 truncate">{SOURCE_LABELS[item] || item}</span>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {lastMsg.actions?.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Azioni suggerite</p>
          {lastMsg.actions.map((a, i) => (
            <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-100 text-[11px] text-blue-700 mb-1">
              <span>{ACTION_ICONS[a.type] || '⚡'}</span> {a.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function CodexAI() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showSources, setShowSources] = useState(true);
  const [searchConv, setSearchConv] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [contextFocus, setContextFocus] = useState(null);
  const [safeMode, setSafeMode] = useState(() => localStorage.getItem('codex_ai_safe_mode') === 'true');

  const toggleSafeMode = () => setSafeMode(v => {
    const next = !v;
    localStorage.setItem('codex_ai_safe_mode', next);
    return next;
  });

  const queueAction = async (action) => {
    await base44.entities.AIActionQueue.create({
      action_type: action.type,
      action_label: action.label,
      proposed_params: action.params || {},
      requested_by_user_email: user?.email,
      requested_in_session: activeConvId,
      risk_level: ['assign_technician','create_estimate_draft','suggest_pricing','update_homepassport'].includes(action.type) ? 'High' : 'Medium',
      required_role_to_approve: ['create_estimate_draft','suggest_pricing'].includes(action.type) ? 'admin' : 'project_manager',
      status: 'Pending',
      company_id: user?.company_id,
    });
    setFeedback({ text: `"${action.label}" aggiunta alla coda approvazione (Safe Mode attivo)`, type: 'success' });
  };
  const [uploadingFile, setUploadingFile] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const qc = useQueryClient();

  const activeConv = conversations.find(c => c.id === activeConvId);
  const messages = activeConv?.messages || [];
  const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
  const isEmpty = messages.length === 0;

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(SESSION_KEY) || '[]');
      if (stored.length > 0) { setConversations(stored); setActiveConvId(stored[0].id); }
      else createNewConversation();
    } catch { createNewConversation(); }
  }, []);

  useEffect(() => {
    if (conversations.length > 0) {
      const trimmed = conversations.slice(0, 20).map(c => ({ ...c, messages: c.messages.slice(-50) }));
      localStorage.setItem(SESSION_KEY, JSON.stringify(trimmed));
    }
  }, [conversations]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const createNewConversation = useCallback(() => {
    const id = genConvId();
    const conv = { id, title: 'Nuova conversazione', createdAt: Date.now(), messages: [] };
    setConversations(prev => [conv, ...prev]);
    setActiveConvId(id);
    setInput(''); setAttachments([]);
    return id;
  }, []);

  const deleteConversation = (convId, e) => {
    e.stopPropagation();
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (activeConvId === convId) {
      const rest = conversations.filter(c => c.id !== convId);
      if (rest.length > 0) setActiveConvId(rest[0].id);
      else createNewConversation();
    }
  };

  const addMessage = (convId, msg) => {
    setConversations(prev => prev.map(c =>
      c.id === convId ? { ...c, messages: [...c.messages, msg], updatedAt: Date.now() } : c
    ));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAttachments(prev => [...prev, { name: file.name, url: file_url }]);
    } catch {}
    setUploadingFile(false); e.target.value = '';
  };

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');

    let convId = activeConvId;
    if (!convId || !conversations.find(c => c.id === convId)) convId = createNewConversation();

    const isFirst = (conversations.find(c => c.id === convId)?.messages || []).length === 0;
    const userMsg = { id: genId(), role: 'user', content: msg, timestamp: Date.now(), attachments: [...attachments] };
    addMessage(convId, userMsg);
    setAttachments([]);
    if (isFirst) {
      const title = msg.slice(0, 48) + (msg.length > 48 ? '…' : '');
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, title } : c));
    }

    setLoading(true);
    try {
      const payload = { message: msg, session_id: convId };
      if (attachments.length > 0) payload.file_urls = attachments.map(a => a.url);
      if (contextFocus) {
        payload.context_hint = {
          project_id:  contextFocus.type === 'project'  ? contextFocus.id : null,
          client_id:   contextFocus.type === 'client'   ? contextFocus.id : null,
          property_id: contextFocus.type === 'property' ? contextFocus.id : null,
          estimate_id: contextFocus.type === 'estimate' ? contextFocus.id : null,
        };
      }
      const res = await base44.functions.invoke('codexAIChat', payload);
      const d = res.data;
      addMessage(convId, {
        id: genId(), role: 'assistant',
        content: d.response || 'Errore nella risposta AI.',
        timestamp: Date.now(),
        actions: d.suggested_actions || [],
        context_used: d.context_used || [],
        latency_ms: d.latency_ms,
        confidence_level: d.confidence_level,
        confidence_reason: d.confidence_reason,
        citations: d.citations || [],
      });
    } catch (e) {
      addMessage(convId, { id: genId(), role: 'assistant', content: `⚠️ ${e.message}`, timestamp: Date.now(), actions: [], context_used: [] });
    }
    setLoading(false);
  };

  const execAction = async (action, editedParams) => {
    setPendingAction(null);
    const finalAction = { ...action, params: { ...action.params, ...editedParams } };
    try {
      const res = await base44.functions.invoke('executeAIAction', {
        action_type: finalAction.type, params: finalAction.params,
        session_id: activeConvId, confirmed: true,
      });
      const data = res.data;
      if (data.error) throw new Error(data.error);
      setFeedback({ text: `${finalAction.label} completata`, type: 'success' });
      if (data.result?.summary) {
        addMessage(activeConvId, { id: genId(), role: 'assistant', content: data.result.summary, timestamp: Date.now(), actions: [], context_used: ['ai_action'] });
      }
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['tickets'] });
    } catch (e) {
      setFeedback({ text: `${finalAction.label}: ${e.message}`, type: 'error' });
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  // Group conversations
  const filtered = conversations.filter(c => !searchConv || c.title.toLowerCase().includes(searchConv.toLowerCase()));
  const grouped = filtered.reduce((acc, c) => {
    const d = fmtDate(c.createdAt);
    if (!acc[d]) acc[d] = [];
    acc[d].push(c);
    return acc;
  }, {});

  return (
    <div className="flex h-full bg-[#f8f9fb] overflow-hidden" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>

      {/* ── LEFT SIDEBAR ────────────────────────────────────────────────────── */}
      {showSidebar && (
        <aside className="w-[220px] flex-shrink-0 flex flex-col border-r border-slate-200 bg-white">
          {/* Wordmark */}
          <div className="px-4 pt-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #1147FF 0%, #0B2341 100%)' }}>
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-800 tracking-tight">Codex AI</span>
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
            </div>
            <button onClick={createNewConversation}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-white rounded-lg transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #1147FF 0%, #0B2341 100%)' }}>
              <Plus className="w-3.5 h-3.5" /> Nuova chat
            </button>
          </div>

          {/* Search */}
          <div className="px-3 pt-2.5">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <Search className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <input value={searchConv} onChange={e => setSearchConv(e.target.value)}
                placeholder="Cerca..." className="flex-1 text-xs bg-transparent outline-none text-slate-600 placeholder-slate-400" />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {Object.entries(grouped).map(([date, convs]) => (
              <div key={date} className="mb-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1">{date}</p>
                {convs.map(conv => (
                  <button key={conv.id} onClick={() => setActiveConvId(conv.id)}
                    className={`w-full group flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all ${
                      activeConvId === conv.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}>
                    <MessageSquare className="w-3 h-3 flex-shrink-0 opacity-50" />
                    <span className="flex-1 text-xs truncate">{conv.title}</span>
                    <button onClick={(e) => deleteConversation(conv.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-300 hover:text-red-400 transition-all flex-shrink-0">
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </button>
                ))}
              </div>
            ))}
            {Object.keys(grouped).length === 0 && (
              <p className="text-center py-6 text-xs text-slate-400">Nessuna conversazione</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="px-3 pb-2 border-t border-slate-100 pt-2">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Azioni rapide</p>
            {QUICK_ACTIONS.map((qa, i) => (
              <button key={i} onClick={() => send(qa.prompt)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left hover:bg-slate-50 transition-colors group">
                <qa.icon className="w-3 h-3 text-slate-400 group-hover:text-blue-500 flex-shrink-0 transition-colors" />
                <span className="text-xs text-slate-500 group-hover:text-slate-800 transition-colors truncate">{qa.label}</span>
              </button>
            ))}
          </div>

          {/* User */}
          {user && (
            <div className="px-3 pb-3 pt-1 border-t border-slate-100 flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0">
                <User className="w-3 h-3 text-slate-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-700 truncate">{user.full_name}</p>
                <p className="text-[10px] text-slate-400 capitalize">{user.role}</p>
              </div>
            </div>
          )}
        </aside>
      )}

      {/* ── CENTER CHAT ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-slate-200 flex-shrink-0 h-11">
          <button onClick={() => setShowSidebar(v => !v)}
            className="w-7 h-7 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors">
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{activeConv?.title || 'Nuova conversazione'}</p>
          </div>
          <button onClick={toggleSafeMode}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all border ${
              safeMode ? 'bg-amber-50 text-amber-700 border-amber-200' : 'text-slate-500 hover:bg-slate-100 border-transparent'
            }`}>
            <Lock className="w-3 h-3" />
            {safeMode ? 'Modalità Sicura ON' : 'Modalità Sicura'}
          </button>
          <button onClick={() => setShowSources(v => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              showSources ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-100'
            }`}>
            <Database className="w-3 h-3" /> Fonti
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {isEmpty ? (
            // ── Welcome / Empty State ──────────────────────────────────────────
            <div className="flex flex-col items-center justify-center h-full min-h-64 text-center max-w-2xl mx-auto">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 shadow-lg"
                style={{ background: 'linear-gradient(135deg, #1147FF 0%, #0B2341 100%)' }}>
                <Bot className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-1.5 tracking-tight">
                {user ? `Ciao, ${user.full_name?.split(' ')[0]}` : 'Codex AI'}
              </h2>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed max-w-sm">
                Il tuo assistente AI per operazioni, finanza e gestione progetti.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 w-full mb-6">
                {SUGGESTED_PROMPTS.map((sp, i) => (
                  <button key={i} onClick={() => send(sp.prompt)}
                    className="group flex items-start gap-3 p-3.5 bg-white border border-slate-200 rounded-xl text-left hover:border-blue-300 hover:shadow-sm transition-all">
                    <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors mt-0.5">
                      <sp.icon className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 mb-0.5 group-hover:text-blue-700 transition-colors">{sp.label}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{sp.prompt.slice(0, 60)}…</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="w-full max-w-2xl space-y-3">
                <AIReadinessState />
                <PlatformIntelligenceScore />
              </div>
            </div>
          ) : (
            messages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} onActionConfirm={a => safeMode ? queueAction(a) : setPendingAction(a)} />
            ))
          )}

          {/* Typing indicator */}
          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-[#0B2341]">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2.5">
                <div className="flex gap-1 items-center">
                  {[0, 150, 300].map(delay => (
                    <span key={delay} className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
                      style={{ animationDelay: `${delay}ms`, animationDuration: '900ms' }} />
                  ))}
                </div>
                <span className="text-xs text-slate-400">Recupero contesto e genero risposta…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Feedback toast */}
        {feedback && (
          <div className={`mx-5 mb-1.5 px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between border ${
            feedback.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}>
            <span className="flex items-center gap-2">
              {feedback.type === 'error' ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {feedback.text}
            </span>
            <button onClick={() => setFeedback(null)}><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="px-5 pb-1 flex gap-2 flex-wrap">
            {attachments.map((att, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1 text-xs text-blue-700">
                <Paperclip className="w-3 h-3" />
                <span className="truncate max-w-32">{att.name}</span>
                <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}>
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-5 pb-4">
          {/* Context Focus Bar */}
          <div className="flex items-center gap-2 mb-2">
            <ContextFocusPicker focus={contextFocus} onFocusChange={setContextFocus} />
            {contextFocus && (
              <span className="text-[11px] text-slate-400">Il contesto AI è focalizzato su questo record</span>
            )}
          </div>
          <div className="flex gap-2 items-end bg-white border border-slate-200 rounded-xl p-2.5 shadow-sm focus-within:border-blue-300 focus-within:shadow-md transition-all">
            <button onClick={() => fileInputRef.current?.click()} disabled={uploadingFile}
              className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors flex-shrink-0 rounded-lg hover:bg-slate-50">
              {uploadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
            </button>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
            <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Chiedi a Codex AI… (↵ per inviare, ⇧↵ per a capo)"
              rows={1}
              className="flex-1 resize-none text-sm text-slate-800 placeholder-slate-400 bg-transparent outline-none leading-relaxed max-h-32" />
            <button onClick={() => send()} disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30"
              style={{ background: input.trim() && !loading ? 'linear-gradient(135deg, #1147FF 0%, #0B2341 100%)' : '#e2e8f0' }}>
              <Send className={`w-3.5 h-3.5 ${input.trim() && !loading ? 'text-white' : 'text-slate-400'}`} />
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-300 mt-1.5">
            Codex AI · RBAC attivo · Audit log · Dati aziendali protetti
          </p>
        </div>
      </div>

      {/* ── RIGHT SOURCES PANEL ───────────────────────────────────────────────── */}
      {showSources && (
        <aside className="w-[200px] flex-shrink-0 border-l border-slate-200 bg-white flex flex-col">
          <div className="px-4 py-2.5 border-b border-slate-100 h-11 flex items-center justify-between">
            <p className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
              <Database className="w-3 h-3 text-blue-500" /> Fonti
            </p>
            <button onClick={() => setShowSources(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <SourcesPanel lastMsg={lastAssistantMsg} />
        </aside>
      )}

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