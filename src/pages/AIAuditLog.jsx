import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, Bot, Clock, User, Database, Zap, ChevronDown, ChevronRight, Search, Filter, AlertCircle, CheckCircle2, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const ROLE_COLORS = {
  admin: 'bg-purple-100 text-purple-700 border-purple-200',
  company_admin: 'bg-purple-100 text-purple-700 border-purple-200',
  project_manager: 'bg-blue-100 text-blue-700 border-blue-200',
  sales: 'bg-green-100 text-green-700 border-green-200',
  technician: 'bg-orange-100 text-orange-700 border-orange-200',
  client: 'bg-gray-100 text-gray-600 border-gray-200',
};

const SOURCE_LABELS = {
  projects: 'Progetti', tickets: 'Ticket', estimates: 'Preventivi',
  clients: 'Clienti', properties: 'Immobili', guardian: 'Guardian',
  knowledge_base: 'KB', ai_memory: 'Memoria', project_financials: 'Finanze',
  rag_documents: 'Documenti RAG', focused_project: 'Progetto Focus',
  focused_client: 'Cliente Focus', timesheets: 'Timesheet',
  financial_alerts: 'Alert', intelligence: 'Insights', ai_action_executor: 'Azione AI',
};

const ACTION_ICONS = { '✅': 'create_task', '🎫': 'create_ticket', '📋': 'create_estimate_draft' };

function LogRow({ log }) {
  const [expanded, setExpanded] = useState(false);
  const isAction = log.actions_executed?.length > 0;
  const isSensitive = log.prompt?.startsWith('ACTION_DENIED') || log.prompt?.startsWith('FINANCIAL_ACTION_BLOCKED');

  return (
    <div className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${isSensitive ? 'bg-red-50/50' : ''}`}>
      {/* Summary row */}
      <button onClick={() => setExpanded(v => !v)} className="w-full text-left px-5 py-3 flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
          {isSensitive
            ? <AlertCircle className="w-3.5 h-3.5 text-red-500" />
            : isAction
              ? <Zap className="w-3.5 h-3.5 text-blue-500" />
              : <Bot className="w-3.5 h-3.5 text-slate-500" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-800 truncate">{log.prompt?.slice(0, 90) || '—'}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <User className="w-2.5 h-2.5" />{log.user_email}
            </span>
            {log.user_role && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${ROLE_COLORS[log.user_role] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                {log.user_role}
              </span>
            )}
            {log.context_used?.length > 0 && (
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Database className="w-2.5 h-2.5" />{log.context_used.length} sorgenti
              </span>
            )}
            {log.latency_ms && (
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />{log.latency_ms}ms
              </span>
            )}
            {isAction && (
              <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded-full font-medium">
                {log.actions_executed.length} azione/i
              </span>
            )}
            {isSensitive && <span className="text-[10px] bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded-full font-medium">BLOCCATO</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[11px] text-slate-400">
            {log.created_date ? new Date(log.created_date).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
          </span>
          {expanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-5 pb-4 space-y-3 border-t border-slate-100 bg-white">
          {/* Prompt */}
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Prompt</p>
            <p className="text-xs text-slate-700 bg-slate-50 rounded-lg px-3 py-2 leading-relaxed">{log.prompt}</p>
          </div>

          {/* Response summary */}
          {log.response_summary && (
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Risposta (sintesi)</p>
              <p className="text-xs text-slate-700 bg-slate-50 rounded-lg px-3 py-2 leading-relaxed">{log.response_summary}</p>
            </div>
          )}

          {/* Context used */}
          {log.context_used?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Contesto recuperato</p>
              <div className="flex flex-wrap gap-1">
                {log.context_used.map(c => (
                  <span key={c} className="text-[11px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-md">
                    {SOURCE_LABELS[c] || c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {log.actions_suggested?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Azioni suggerite</p>
              <div className="flex flex-wrap gap-1">
                {log.actions_suggested.map((a, i) => (
                  <span key={i} className="text-[11px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-md">{a.label || a.type}</span>
                ))}
              </div>
            </div>
          )}
          {log.actions_executed?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Azioni eseguite</p>
              {log.actions_executed.map((a, i) => (
                <div key={i} className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-2 rounded-lg flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                  <span className="font-medium">{a.type}</span>
                  {a.result?.label && <span className="text-emerald-600">— {a.result.label}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Session */}
          <p className="text-[11px] text-slate-400 font-mono">Session: {log.session_id}</p>
        </div>
      )}
    </div>
  );
}

export default function AIAuditLog() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showSensitive, setShowSensitive] = useState(true);

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['ai_audit_logs'],
    queryFn: () => base44.entities.AIAuditLog.list('-created_date', 100),
  });

  const filtered = logs.filter(log => {
    if (!showSensitive && (log.prompt?.startsWith('ACTION_DENIED') || log.prompt?.startsWith('FINANCIAL_ACTION_BLOCKED'))) return false;
    if (roleFilter !== 'all' && log.user_role !== roleFilter) return false;
    if (typeFilter === 'actions' && !log.actions_executed?.length) return false;
    if (typeFilter === 'blocked' && !log.prompt?.startsWith('ACTION_DENIED') && !log.prompt?.startsWith('FINANCIAL_ACTION_BLOCKED')) return false;
    if (search && !log.prompt?.toLowerCase().includes(search.toLowerCase()) && !log.user_email?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalActions = logs.filter(l => l.actions_executed?.length > 0).reduce((s, l) => s + l.actions_executed.length, 0);
  const totalBlocked = logs.filter(l => l.prompt?.startsWith('ACTION_DENIED') || l.prompt?.startsWith('FINANCIAL_ACTION_BLOCKED')).length;
  const avgLatency = logs.filter(l => l.latency_ms).length
    ? Math.round(logs.filter(l => l.latency_ms).reduce((s, l) => s + l.latency_ms, 0) / logs.filter(l => l.latency_ms).length)
    : 0;

  const roles = [...new Set(logs.map(l => l.user_role).filter(Boolean))];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
            style={{ background: 'linear-gradient(135deg, #0B2341 0%, #1147FF 100%)' }}>
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">AI Audit Log</h1>
            <p className="text-sm text-slate-500">Traccia completa di tutte le interazioni AI — RBAC · Cross-tenant · Tamper-proof</p>
          </div>
        </div>
        <button onClick={() => refetch()} className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Interazioni totali', value: logs.length, icon: Bot, color: '#1147FF' },
          { label: 'Azioni eseguite', value: totalActions, icon: Zap, color: '#10B981' },
          { label: 'Tentativi bloccati', value: totalBlocked, icon: AlertCircle, color: '#EF4444' },
          { label: 'Latenza media', value: avgLatency ? `${avgLatency}ms` : '—', icon: Clock, color: '#F59E0B' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <kpi.icon className="w-3.5 h-3.5" style={{ color: kpi.color }} />
              <span className="text-xs text-slate-500">{kpi.label}</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 flex-1 min-w-48">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cerca prompt, utente…" className="text-xs bg-transparent outline-none text-slate-700 placeholder-slate-400 flex-1" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-600 outline-none">
          <option value="all">Tutti i ruoli</option>
          {roles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-600 outline-none">
          <option value="all">Tutte le interazioni</option>
          <option value="actions">Solo azioni eseguite</option>
          <option value="blocked">Solo tentavtivi bloccati</option>
        </select>
        <button onClick={() => setShowSensitive(v => !v)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border transition-all ${showSensitive ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
          {showSensitive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          Bloccati
        </button>
        {filtered.length !== logs.length && (
          <span className="text-xs text-slate-400 ml-auto">{filtered.length}/{logs.length}</span>
        )}
      </div>

      {/* Log table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-slate-400">Caricamento log…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Shield className="w-8 h-8 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-medium">Nessun log trovato</p>
            <p className="text-xs text-slate-400 mt-1">Usa Codex AI per generare interazioni</p>
          </div>
        ) : (
          <div className="divide-y-0">
            {filtered.map(log => <LogRow key={log.id} log={log} />)}
          </div>
        )}
      </div>
    </div>
  );
}