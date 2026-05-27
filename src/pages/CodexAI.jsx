import { useState, useEffect, useRef } from 'react';
import { Send, Bot, Sparkles, ChevronRight, Loader2, Clock, User, Zap, BookOpen, FileText, FolderKanban, Ticket, AlertCircle, CheckCircle2, X, Copy, RotateCcw, Database } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';

const SESSION_ID = `session_${Date.now()}`;

const QUICK_PROMPTS = [
  { icon: FolderKanban, label: 'Stato progetti', prompt: 'Mostrami un riepilogo dello stato attuale di tutti i progetti attivi con eventuali ritardi o problemi.' },
  { icon: FileText, label: 'Genera preventivo', prompt: 'Aiutami a creare una bozza di preventivo. Chiedi le informazioni necessarie.' },
  { icon: Ticket, label: 'Ticket urgenti', prompt: 'Quali sono i ticket urgenti o critici aperti in questo momento? Come li gestiamo?' },
  { icon: Sparkles, label: 'Analisi margini', prompt: 'Analizza i margini dei progetti recenti e segnala eventuali anomalie o progetti sotto target.' },
  { icon: BookOpen, label: 'Checklist manutenzione', prompt: 'Crea una checklist di manutenzione preventiva completa per un sistema HVAC residenziale.' },
  { icon: Zap, label: 'Riepilogo operativo', prompt: 'Dammi un briefing operativo completo della giornata: progetti, scadenze, ticket e manutenzioni.' },
];

const ACTION_ICONS = {
  create_task: '✅',
  create_ticket: '🎫',
  create_estimate_draft: '📋',
  create_checklist: '☑️',
  assign_technician: '👷',
  generate_report: '📊',
  summarize_project: '📝',
  suggest_pricing: '💶',
  generate_handover: '🤝',
  update_homepassport: '🏠',
};

function Message({ msg, onActionConfirm }) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === 'user';

  const copy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-gray-200' : ''}`}
        style={!isUser ? { backgroundColor: '#1147FF' } : {}}>
        {isUser ? <User className="w-4 h-4 text-gray-600" /> : <Bot className="w-4 h-4 text-white" />}
      </div>

      <div className={`flex-1 min-w-0 ${isUser ? 'flex flex-col items-end' : ''}`}>
        {/* Bubble */}
        <div className={`rounded-2xl px-4 py-3 text-sm max-w-[85%] ${isUser
          ? 'bg-gray-900 text-white'
          : 'bg-white border border-gray-200 text-gray-800'
        }`}>
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

        {/* Action buttons */}
        {!isUser && msg.actions?.length > 0 && (
          <div className="mt-2 max-w-[85%]">
            <p className="text-xs text-gray-400 mb-1.5 ml-1">Azioni suggerite:</p>
            <div className="flex flex-wrap gap-2">
              {msg.actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => onActionConfirm(action)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors shadow-sm"
                >
                  <span>{ACTION_ICONS[action.type] || '⚡'}</span>
                  {action.label}
                  <ChevronRight className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Meta */}
        {!isUser && (
          <div className="flex items-center gap-2 mt-1.5 ml-1">
            {msg.context_used?.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Database className="w-3 h-3" />
                {msg.context_used.join(', ')}
              </span>
            )}
            {msg.latency_ms && (
              <span className="text-xs text-gray-300">{msg.latency_ms}ms</span>
            )}
            <button onClick={copy} className="text-xs text-gray-300 hover:text-gray-500 transition-colors ml-1">
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

        {/* Timestamp */}
        <p className="text-xs text-gray-300 mt-1 mx-1">{msg.time}</p>
      </div>
    </div>
  );
}

function ActionConfirmModal({ action, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl">
            {ACTION_ICONS[action.type] || '⚡'}
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{action.label}</h3>
            <p className="text-xs text-gray-500">Richiede conferma</p>
          </div>
        </div>
        {action.params && (
          <div className="bg-gray-50 rounded-xl p-3 space-y-1">
            {Object.entries(action.params).map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-gray-500 capitalize">{k.replace(/_/g, ' ')}</span>
                <span className="text-gray-900 font-medium truncate ml-2">{String(v)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          Questa azione sarà registrata nell'audit log AI
        </div>
        <div className="flex gap-2">
          <button onClick={onConfirm} className="flex-1 py-2.5 text-sm text-white rounded-xl font-medium" style={{ backgroundColor: '#1147FF' }}>
            Conferma
          </button>
          <button onClick={onCancel} className="flex-1 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-600">
            Annulla
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CodexAI() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);
  const [recentConversations] = useState([
    { id: 1, preview: 'Analisi margini Q1', time: 'Ieri' },
    { id: 2, preview: 'Checklist installazione rete', time: '2 giorni fa' },
    { id: 3, preview: 'Riepilogo progetto Villa Rossi', time: '3 giorni fa' },
  ]);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(u => setUser(u)).catch(() => {});
    // Welcome message
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `Ciao! Sono **Codex AI**, il tuo assistente operativo intelligente.\n\nHo accesso ai tuoi progetti, preventivi, ticket, clienti, manutenzioni e knowledge base. Sono pronto ad aiutarti con analisi, reportistica, creazione di contenuti operativi e molto altro.\n\nCosa posso fare per te oggi?`,
      time: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      context_used: [],
    }]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput('');

    const userEntry = {
      id: Date.now(),
      role: 'user',
      content: userMsg,
      time: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userEntry]);
    setLoading(true);

    const res = await base44.functions.invoke('codexAIChat', {
      message: userMsg,
      session_id: SESSION_ID,
    });

    const data = res.data;
    const aiEntry = {
      id: Date.now() + 1,
      role: 'assistant',
      content: data.response || 'Errore nella risposta AI.',
      time: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      actions: data.suggested_actions || [],
      context_used: data.context_used || [],
      latency_ms: data.latency_ms,
    };
    setMessages(prev => [...prev, aiEntry]);
    setLoading(false);
  };

  const handleActionConfirm = async (action) => {
    setPendingAction(null);
    // Execute action and report
    let feedback = '';
    try {
      if (action.type === 'create_task') {
        await base44.entities.Task.create({
          title: action.params?.title || 'Task da Codex AI',
          status: 'To Do',
          priority: 'Medium',
        });
        feedback = `✅ Task "${action.params?.title || 'Nuovo task'}" creato con successo!`;
      } else if (action.type === 'create_ticket') {
        await base44.entities.SupportTicket.create({
          title: action.params?.title || 'Ticket da Codex AI',
          priority: action.params?.priority || 'Medium',
          status: 'Open',
        });
        feedback = `✅ Ticket "${action.params?.title || 'Nuovo ticket'}" creato!`;
      } else {
        feedback = `✅ Azione "${action.label}" registrata. Verifica nella sezione dedicata.`;
      }
      // Log executed action
      await base44.entities.AIAuditLog?.create?.({
        user_email: user?.email,
        user_role: user?.role,
        session_id: SESSION_ID,
        prompt: `ACTION: ${action.type}`,
        actions_executed: [action],
      }).catch(() => {});
    } catch {
      feedback = `⚠️ Azione "${action.label}" non completata. Riprova manualmente.`;
    }
    setActionFeedback(feedback);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => {
    setMessages([{
      id: 'welcome2',
      role: 'assistant',
      content: 'Nuova conversazione avviata. Come posso aiutarti?',
      time: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      context_used: [],
    }]);
  };

  return (
    <div className="flex h-full bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col hidden lg:flex">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#1147FF' }}>
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Codex AI</h2>
              <p className="text-xs text-gray-400">Operational Intelligence</p>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-white rounded-xl transition-colors"
            style={{ backgroundColor: '#1147FF' }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Nuova conversazione
          </button>
        </div>

        {/* Quick prompts */}
        <div className="p-4 flex-1 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Prompt rapidi</p>
          <div className="space-y-1">
            {QUICK_PROMPTS.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(qp.prompt)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left hover:bg-gray-50 transition-colors group"
              >
                <qp.icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 group-hover:text-blue-500 transition-colors" />
                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{qp.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Recenti</p>
            <div className="space-y-1">
              {recentConversations.map(c => (
                <div key={c.id} className="px-3 py-2 rounded-xl hover:bg-gray-50 cursor-pointer">
                  <p className="text-sm text-gray-600 truncate">{c.preview}</p>
                  <p className="text-xs text-gray-300 mt-0.5">{c.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-gray-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{user?.full_name || 'Utente'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.role || ''}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm font-medium text-gray-700">Codex AI</span>
            </div>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Context-Aware</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={clearChat} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400" title="Nuova conversazione">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {messages.map(msg => (
            <Message key={msg.id} msg={msg} onActionConfirm={action => setPendingAction(action)} />
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#1147FF' }}>
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#1147FF' }} />
                <span className="text-sm text-gray-400">Codex AI sta elaborando...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Action feedback toast */}
        {actionFeedback && (
          <div className="mx-6 mb-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-center justify-between">
            <span>{actionFeedback}</span>
            <button onClick={() => setActionFeedback(null)}><X className="w-4 h-4 text-green-500" /></button>
          </div>
        )}

        {/* Mobile quick prompts */}
        <div className="lg:hidden flex gap-2 px-4 pb-2 overflow-x-auto flex-shrink-0">
          {QUICK_PROMPTS.slice(0, 4).map((qp, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(qp.prompt)}
              className="flex-shrink-0 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 bg-white hover:bg-gray-50 whitespace-nowrap"
            >
              {qp.label}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="px-6 pb-6 flex-shrink-0">
          <div className="flex gap-3 items-end bg-white border border-gray-200 rounded-2xl p-3 shadow-sm focus-within:border-blue-300 focus-within:shadow-md transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Chiedi qualcosa a Codex AI... (Invio per inviare)"
              rows={1}
              className="flex-1 resize-none text-sm text-gray-900 placeholder-gray-400 bg-transparent outline-none leading-relaxed max-h-32"
              style={{ minHeight: '24px' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: input.trim() && !loading ? '#1147FF' : '#E5E7EB' }}
            >
              <Send className={`w-4 h-4 ${input.trim() && !loading ? 'text-white' : 'text-gray-400'}`} />
            </button>
          </div>
          <p className="text-xs text-gray-300 text-center mt-2">
            Codex AI ha accesso ai dati della tua azienda · Tutte le interazioni sono registrate
          </p>
        </div>
      </div>

      {/* Confirmation modal */}
      {pendingAction && (
        <ActionConfirmModal
          action={pendingAction}
          onConfirm={() => handleActionConfirm(pendingAction)}
          onCancel={() => setPendingAction(null)}
        />
      )}
    </div>
  );
}