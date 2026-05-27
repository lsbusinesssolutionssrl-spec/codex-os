import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send, Bot, Sparkles, Loader2, User, Copy, CheckCircle2, X,
  Plus, ChevronRight, Database, Shield, History, Brain, Lightbulb,
  Settings, FileText, FolderKanban, Ticket, TrendingUp, Wrench,
  MessageSquare, Clock, Paperclip, Search, ChevronDown, Tag,
  AlertCircle, BarChart2, Users, Home, ExternalLink, Trash2,
  BookOpen, DollarSign, Zap
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';
import { useQueryClient } from '@tanstack/react-query';
import ActionConfirmModal from '../components/ai/ActionConfirmModal';

// ── Constants ─────────────────────────────────────────────────────────────────
const SESSION_STORAGE_KEY = 'codex_ai_conversations';

const SUGGESTED_PROMPTS = [
  { icon: FileText, label: 'Genera preventivo', prompt: 'Aiutami a creare una bozza di preventivo. Cosa mi serve sapere?', color: 'text-blue-500', bg: 'bg-blue-50' },
  { icon: FolderKanban, label: 'Riassumi progetto', prompt: 'Dammi un riepilogo operativo di tutti i progetti attivi con ritardi e priorità.', color: 'text-purple-500', bg: 'bg-purple-50' },
  { icon: TrendingUp, label: 'Spiega calo margini', prompt: 'Analizza i margini dei progetti recenti. Ci sono anomalie o progetti sotto target? Spiega le cause.', color: 'text-red-500', bg: 'bg-red-50' },
  { icon: Wrench, label: 'Checklist manutenzione', prompt: 'Crea una checklist completa di manutenzione preventiva per un sistema HVAC residenziale.', color: 'text-orange-500', bg: 'bg-orange-50' },
  { icon: Users, label: 'Update cliente', prompt: 'Genera un aggiornamento professionale da inviare al cliente sullo stato del progetto.', color: 'text-green-500', bg: 'bg-green-50' },
  { icon: BarChart2, label: 'Analisi redditività', prompt: 'Analizza la redditività per tipo di progetto. Quali tipologie sono più profittevoli?', color: 'text-teal-500', bg: 'bg-teal-50' },
];

const QUICK_ACTIONS = [
  { icon: FileText, label: 'Nuovo preventivo', prompt: 'Crea una bozza di preventivo vuota. Che tipo di lavoro devo configurare?' },
  { icon: Ticket, label: 'Apri ticket', prompt: 'Voglio aprire un nuovo ticket di supporto. Guidami.' },
  { icon: Wrench, label: 'Checklist rapida', prompt: 'Crea una checklist operativa rapida per il progetto corrente.' },
  { icon: Sparkles, label: 'Briefing del giorno', prompt: 'Briefing operativo completo: progetti, scadenze, ticket urgenti e manutenzioni di oggi.' },
];

const ENTITY_ICONS = {
  projects: FolderKanban, tickets: Ticket, estimates: FileText, clients: Users,
  properties: Home, guardian: Shield, knowledge_base: BookOpen, ai_memory: Brain,
  project_financials: DollarSign, rag_documents: Database, focused_project: FolderKanban,
  focused_client: Users, focused_property_homepassport: Home, focused_estimate: FileText,
};

const ACTION_ICONS = {
  create_task: '✅', create_ticket: '🎫', create_estimate_draft: '📋',
  create_checklist: '☑️', assign_technician: '👷', generate_report: '📊',
  summarize_project: '📝', suggest_pricing: '💶', generate_handover: '🤝',
  update_homepassport: '🏠', generate_meeting_notes: '📋',
};

function generateId() { return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; }
function generateConvId() { return `conv_${Date.now()}`; }
function formatTime(ts) { return new Date(ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }); }
function formatDate(ts) {
  const d = new Date(ts);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Oggi';
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Ieri';
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

// ── Message Bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg, onActionConfirm }) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Parse citations from response content: [Fonte: type - title]
  const citations = [];
  const citationRegex = /\[Fonte:\s*([^\]]+)\]/g;
  let match;
  let content = msg.content || '';
  while ((match = citationRegex.exec(content)) !== null) {
    citations.push(match[1]);
  }

  return (
    <div className={`flex gap-3 group ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 ${
        isUser ? 'bg-gray-200' : ''
      }`} style={!isUser ? { background: 'linear-gradient(135deg, #1147FF 0%, #0B2341 100%)' } : {}}>
        {isUser
          ? <User className="w-4 h-4 text-gray-600" />
          : <Bot className="w-4 h-4 text-white" />
        }
      </div>

      <div className={`flex-1 min-w-0 ${isUser ? 'flex flex-col items-end' : ''}`}>
        {/* Bubble */}
        <div className={`rounded-2xl px-4 py-3 text-sm max-w-[85%] shadow-sm ${
          isUser
            ? 'bg-gray-900 text-white rounded-tr-sm'
            : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
        }`}>
          {isUser ? (
            <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
          ) : (
            <ReactMarkdown
              className="prose prose-sm prose-gray max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
              components={{
                code: ({ inline, children }) => inline
                  ? <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono text-pink-600">{children}</code>
                  : <pre className="bg-gray-900 text-green-400 p-3 rounded-xl text-xs overflow-x-auto my-2 border border-gray-800"><code>{children}</code></pre>,
                p: ({ children }) => <p className="my-1.5 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="my-2 ml-4 space-y-0.5 list-disc">{children}</ul>,
                ol: ({ children }) => <ol className="my-2 ml-4 space-y-0.5 list-decimal">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                h2: ({ children }) => <h2 className="font-bold text-gray-900 text-base mt-3 mb-1.5 border-b border-gray-100 pb-1">{children}</h2>,
                h3: ({ children }) => <h3 className="font-semibold text-gray-900 mt-2 mb-1">{children}</h3>,
                blockquote: ({ children }) => <blockquote className="border-l-3 border-blue-400 pl-3 text-gray-600 italic my-2 bg-blue-50 rounded-r py-1">{children}</blockquote>,
                table: ({ children }) => <div className="overflow-x-auto my-2"><table className="text-xs border-collapse w-full">{children}</table></div>,
                th: ({ children }) => <th className="bg-gray-100 border border-gray-200 px-2 py-1 text-left font-semibold">{children}</th>,
                td: ({ children }) => <td className="border border-gray-200 px-2 py-1">{children}</td>,
              }}
            >
              {msg.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Citations */}
        {!isUser && citations.length > 0 && (
          <div className="mt-1.5 max-w-[85%] flex flex-wrap gap-1">
            {citations.map((c, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                <Database className="w-2.5 h-2.5" />{c}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        {!isUser && msg.actions?.length > 0 && (
          <div className="mt-2 max-w-[85%]">
            <p className="text-xs text-gray-400 mb-1.5 ml-0.5 flex items-center gap-1">
              <Zap className="w-3 h-3" /> Azioni suggerite — richiede conferma:
            </p>
            <div className="flex flex-wrap gap-2">
              {msg.actions.map((action, idx) => (
                <button key={idx} onClick={() => onActionConfirm(action)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-blue-200 text-blue-700 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all shadow-sm">
                  <span>{ACTION_ICONS[action.type] || '⚡'}</span>
                  {action.label}
                  <ChevronRight className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        {!isUser && (
          <div className="flex items-center gap-3 mt-1.5 ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {msg.context_used?.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Database className="w-3 h-3" />
                {msg.context_used.slice(0, 3).join(', ')}{msg.context_used.length > 3 ? ` +${msg.context_used.length - 3}` : ''}
              </span>
            )}
            {msg.latency_ms && <span className="text-xs text-gray-300">{msg.latency_ms}ms</span>}
            <button onClick={handleCopy} className="text-gray-300 hover:text-gray-600 transition-colors">
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
        <span className="text-xs text-gray-300 mt-0.5 mx-0.5">{formatTime(msg.timestamp)}</span>
      </div>
    </div>
  );
}

// ── Context Panel ─────────────────────────────────────────────────────────────
function ContextPanel({ lastMessage }) {
  if (!lastMessage || lastMessage.role !== 'assistant') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
          <Database className="w-5 h-5 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-500">Contesto AI</p>
        <p className="text-xs text-gray-400 mt-1">Le fonti usate dalla risposta appariranno qui</p>
      </div>
    );
  }

  const ctx = lastMessage.context_used || [];
  const groups = {
    'Dati Operativi': ctx.filter(c => ['projects', 'tickets', 'estimates', 'clients', 'properties', 'guardian'].includes(c)),
    'Focus Entity': ctx.filter(c => c.startsWith('focused_')),
    'Conoscenza': ctx.filter(c => ['rag_documents', 'knowledge_base', 'ai_memory'].includes(c)),
    'Finanza': ctx.filter(c => ['project_financials', 'project_timesheets', 'financial_alerts', 'intelligence'].includes(c)),
  };

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      <div className="flex items-center gap-2 mb-2">
        <Database className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-700">Contesto recuperato</h3>
        <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{ctx.length} fonti</span>
      </div>

      {lastMessage.latency_ms && (
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
          <Clock className="w-3 h-3" /> Latenza: {lastMessage.latency_ms}ms
        </div>
      )}

      {Object.entries(groups).map(([group, items]) => items.length > 0 && (
        <div key={group}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{group}</p>
          <div className="space-y-1">
            {items.map(item => {
              const Icon = ENTITY_ICONS[item] || Database;
              return (
                <div key={item} className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-gray-100 rounded-lg text-xs text-gray-600">
                  <Icon className="w-3 h-3 text-blue-500 flex-shrink-0" />
                  {item.replace(/_/g, ' ')}
                  <CheckCircle2 className="w-3 h-3 text-green-500 ml-auto" />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {lastMessage.actions?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Azioni suggerite</p>
          {lastMessage.actions.map((a, i) => (
            <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700 mb-1">
              <span>{ACTION_ICONS[a.type] || '⚡'}</span> {a.label}
            </div>
          ))}
        </div>
      )}

      <div className="pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Shield className="w-3 h-3 text-green-500" />
          RBAC attivo · Audit log registrato
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CodexAI() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showContext, setShowContext] = useState(true);
  const [searchConv, setSearchConv] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const qc = useQueryClient();

  const activeConv = conversations.find(c => c.id === activeConvId);
  const messages = activeConv?.messages || [];
  const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');

  // Load user
  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  // Load conversations from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || '[]');
      if (stored.length > 0) {
        setConversations(stored);
        setActiveConvId(stored[0].id);
      } else {
        createNewConversation();
      }
    } catch {
      createNewConversation();
    }
  }, []);

  // Save conversations to localStorage
  useEffect(() => {
    if (conversations.length > 0) {
      // Keep only last 20 conversations, trim messages to last 50 each
      const trimmed = conversations.slice(0, 20).map(c => ({
        ...c,
        messages: c.messages.slice(-50),
      }));
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(trimmed));
    }
  }, [conversations]);

  // Scroll to bottom
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const createNewConversation = useCallback(() => {
    const id = generateConvId();
    const conv = {
      id,
      title: 'Nuova conversazione',
      createdAt: Date.now(),
      messages: [],
    };
    setConversations(prev => [conv, ...prev]);
    setActiveConvId(id);
    setInput('');
    setAttachments([]);
    return id;
  }, []);

  const deleteConversation = (convId, e) => {
    e.stopPropagation();
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (activeConvId === convId) {
      const remaining = conversations.filter(c => c.id !== convId);
      if (remaining.length > 0) setActiveConvId(remaining[0].id);
      else createNewConversation();
    }
  };

  const updateConvTitle = (convId, firstMessage) => {
    const title = firstMessage.slice(0, 45) + (firstMessage.length > 45 ? '…' : '');
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, title } : c));
  };

  const addMessage = (convId, msg) => {
    setConversations(prev => prev.map(c =>
      c.id === convId ? { ...c, messages: [...c.messages, msg], updatedAt: Date.now() } : c
    ));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAttachments(prev => [...prev, { name: file.name, url: file_url }]);
    } catch {}
    setUploadingFile(false);
    e.target.value = '';
  };

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');

    let convId = activeConvId;
    if (!convId || !conversations.find(c => c.id === convId)) {
      convId = createNewConversation();
    }

    const isFirstMsg = (conversations.find(c => c.id === convId)?.messages || []).length === 0;

    const userMsg = { id: generateId(), role: 'user', content: msg, timestamp: Date.now(), attachments: [...attachments] };
    addMessage(convId, userMsg);
    setAttachments([]);

    if (isFirstMsg) updateConvTitle(convId, msg);

    setLoading(true);
    try {
      const payload = { message: msg, session_id: convId };
      if (attachments.length > 0) payload.file_urls = attachments.map(a => a.url);

      const res = await base44.functions.invoke('codexAIChat', payload);
      const d = res.data;

      const aiMsg = {
        id: generateId(),
        role: 'assistant',
        content: d.response || 'Errore nella risposta AI.',
        timestamp: Date.now(),
        actions: d.suggested_actions || [],
        context_used: d.context_used || [],
        latency_ms: d.latency_ms,
      };
      addMessage(convId, aiMsg);
    } catch (e) {
      addMessage(convId, {
        id: generateId(), role: 'assistant',
        content: `⚠️ Errore: ${e.message}`,
        timestamp: Date.now(), actions: [], context_used: [],
      });
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
      setActionFeedback({ text: `✅ ${finalAction.label} completata!`, type: 'success' });
      if (data.result?.summary) {
        addMessage(activeConvId, {
          id: generateId(), role: 'assistant',
          content: data.result.summary,
          timestamp: Date.now(), actions: [], context_used: ['ai_action'],
        });
      }
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['tickets'] });
    } catch (e) {
      setActionFeedback({ text: `⚠️ ${finalAction.label}: ${e.message}`, type: 'error' });
    }
    setTimeout(() => setActionFeedback(null), 5000);
  };

  // Group conversations by date
  const groupedConvs = conversations
    .filter(c => !searchConv || c.title.toLowerCase().includes(searchConv.toLowerCase()))
    .reduce((acc, conv) => {
      const label = formatDate(conv.createdAt);
      if (!acc[label]) acc[label] = [];
      acc[label].push(conv);
      return acc;
    }, {});

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full bg-gray-50 overflow-hidden">

      {/* ── Left Sidebar: Conversations ─────────────────────────────────────── */}
      {showSidebar && (
        <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #1147FF 0%, #0B2341 100%)' }}>
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-sm">Codex AI</h1>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-gray-400">Operational Intelligence</span>
                </div>
              </div>
            </div>
            <button onClick={createNewConversation}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-white rounded-xl transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #1147FF 0%, #0B2341 100%)' }}>
              <Plus className="w-4 h-4" /> Nuova chat
            </button>
          </div>

          {/* Search */}
          <div className="px-3 pt-3">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
              <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <input value={searchConv} onChange={e => setSearchConv(e.target.value)}
                placeholder="Cerca conversazioni..."
                className="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400" />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
            {Object.entries(groupedConvs).map(([date, convs]) => (
              <div key={date}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 mb-1">{date}</p>
                {convs.map(conv => (
                  <button key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={`w-full group flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition-all ${
                      activeConvId === conv.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                    }`}>
                    <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${activeConvId === conv.id ? 'text-blue-500' : 'text-gray-400'}`} />
                    <span className={`flex-1 text-xs truncate ${activeConvId === conv.id ? 'text-blue-700 font-medium' : 'text-gray-600'}`}>
                      {conv.title}
                    </span>
                    <button onClick={(e) => deleteConversation(conv.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-300 hover:text-red-500 transition-all">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </button>
                ))}
              </div>
            ))}
            {Object.keys(groupedConvs).length === 0 && (
              <div className="text-center py-8 text-gray-400 text-xs">Nessuna conversazione trovata</div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="p-3 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">Azioni rapide</p>
            {QUICK_ACTIONS.map((qa, i) => (
              <button key={i} onClick={() => send(qa.prompt)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left hover:bg-gray-50 transition-colors group">
                <qa.icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 group-hover:text-blue-500 transition-colors" />
                <span className="text-xs text-gray-600 group-hover:text-gray-900">{qa.label}</span>
              </button>
            ))}
          </div>

          {/* User */}
          {user && (
            <div className="px-3 pb-3 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <User className="w-3.5 h-3.5 text-gray-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">{user.full_name}</p>
                <p className="text-xs text-gray-400 capitalize">{user.role || 'user'}</p>
              </div>
            </div>
          )}
        </aside>
      )}

      {/* ── Center: Chat ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Chat Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 flex-shrink-0">
          <button onClick={() => setShowSidebar(v => !v)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
            <MessageSquare className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 text-sm truncate">
              {activeConv?.title || 'Nuova conversazione'}
            </h2>
            {messages.length > 0 && (
              <p className="text-xs text-gray-400">{messages.length} messaggi</p>
            )}
          </div>
          <button onClick={() => setShowContext(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showContext ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-500 hover:bg-gray-100'
            }`}>
            <Database className="w-3.5 h-3.5" /> Contesto
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {isEmpty ? (
            /* Welcome State */
            <div className="flex flex-col items-center justify-center h-full min-h-64 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                style={{ background: 'linear-gradient(135deg, #1147FF 0%, #0B2341 100%)' }}>
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                Ciao{user ? `, ${user.full_name?.split(' ')[0]}` : ''}! 👋
              </h2>
              <p className="text-gray-500 text-sm mb-8 max-w-sm">
                Sono Codex AI. Ho accesso completo ai tuoi dati operativi. Come posso aiutarti?
              </p>

              {/* Suggested Prompts Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-2xl">
                {SUGGESTED_PROMPTS.map((sp, i) => (
                  <button key={i} onClick={() => send(sp.prompt)}
                    className="flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-2xl text-left hover:border-blue-300 hover:shadow-md transition-all group">
                    <div className={`w-8 h-8 rounded-xl ${sp.bg} flex items-center justify-center flex-shrink-0`}>
                      <sp.icon className={`w-4 h-4 ${sp.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{sp.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{sp.prompt.slice(0, 55)}…</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} onActionConfirm={a => setPendingAction(a)} />
            ))
          )}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #1147FF 0%, #0B2341 100%)' }}>
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-3 shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-gray-400">Analizzando contesto operativo...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Action Feedback */}
        {actionFeedback && (
          <div className={`mx-6 mb-2 px-4 py-3 border rounded-xl text-sm flex items-center justify-between ${
            actionFeedback.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-green-50 border-green-200 text-green-700'
          }`}>
            <span>{actionFeedback.text}</span>
            <button onClick={() => setActionFeedback(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="px-6 pb-1 flex gap-2 flex-wrap">
            {attachments.map((att, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1 text-xs text-blue-700">
                <Paperclip className="w-3 h-3" />
                <span className="truncate max-w-32">{att.name}</span>
                <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}
                  className="text-blue-400 hover:text-blue-700 ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="px-6 pb-5">
          <div className="flex gap-3 items-end bg-white border border-gray-200 rounded-2xl p-3 shadow-sm focus-within:border-blue-300 focus-within:shadow-md transition-all">
            {/* Attach */}
            <button onClick={() => fileInputRef.current?.click()} disabled={uploadingFile}
              className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors flex-shrink-0">
              {uploadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
            </button>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />

            <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Chiedi qualcosa a Codex AI... (Invio per inviare, Shift+Invio per a capo)"
              rows={1}
              className="flex-1 resize-none text-sm text-gray-900 placeholder-gray-400 bg-transparent outline-none leading-relaxed max-h-32" />

            <button onClick={() => send()} disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
              style={{ background: input.trim() && !loading ? 'linear-gradient(135deg, #1147FF 0%, #0B2341 100%)' : '#E5E7EB' }}>
              <Send className={`w-4 h-4 ${input.trim() && !loading ? 'text-white' : 'text-gray-400'}`} />
            </button>
          </div>
          <p className="text-xs text-gray-300 text-center mt-2">
            Codex AI accede ai dati aziendali · RBAC attivo · Ogni interazione è registrata nell'Audit Log
          </p>
        </div>
      </div>

      {/* ── Right Panel: Context ──────────────────────────────────────────────── */}
      {showContext && (
        <aside className="w-64 flex-shrink-0 bg-white border-l border-gray-200 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-500" /> Contesto
            </h3>
            <button onClick={() => setShowContext(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <ContextPanel lastMessage={lastAssistantMsg} />
        </aside>
      )}

      {/* Action Modal */}
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