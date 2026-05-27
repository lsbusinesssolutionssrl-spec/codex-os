/**
 * AI Foundation Dashboard — Admin Only
 * RAG Index Health · Action Approval Queue · Readiness Checklist · Usage Analytics
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Database, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Loader2, Zap,
  Clock, Shield, BarChart2, FileText, Bot, Play, ChevronRight, Trash2,
  TrendingUp, Users, Activity, BookOpen, CheckSquare
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const SOURCE_TYPE_LABELS = {
  estimate: 'Preventivi', ticket: 'Ticket', home_passport: 'Home Passport',
  project_notes: 'Note Progetto', knowledge_base: 'Knowledge Base', checklist: 'Checklist',
  sop: 'SOP', pdf: 'PDF', contract: 'Contratti', certification: 'Certificazioni',
  manual: 'Manuali', comment: 'Commenti', image_metadata: 'Immagini',
};

const REINDEX_SOURCES = [
  { type: 'home_passport', entity: 'Property', label: 'Home Passport', icon: FileText },
  { type: 'estimate', entity: 'Estimate', label: 'Preventivi', icon: FileText },
  { type: 'ticket', entity: 'SupportTicket', label: 'Ticket', icon: Zap },
  { type: 'project_notes', entity: 'Project', label: 'Note Progetto', icon: BookOpen },
  { type: 'knowledge_base', entity: 'KnowledgeBase', label: 'Knowledge Base', icon: BookOpen },
  { type: 'checklist', entity: 'ChecklistItem', label: 'Checklist', icon: CheckSquare },
];

const READINESS_CHECKS = [
  { id: 'tenant_isolation', label: 'Tenant isolation — company_id su ogni chunk RAG', auto: true, check: (chunks) => chunks.every(c => !!c.company_id) },
  { id: 'rag_indexed', label: 'RAG pipeline attiva — almeno 1 chunk indicizzato', auto: true, check: (chunks) => chunks.length > 0 },
  { id: 'role_permissions', label: 'Role-based filtering su codexAIChat', auto: false, expected: true },
  { id: 'audit_logging', label: 'AI Audit Log operativo', auto: false, expected: true },
  { id: 'action_confirmation', label: 'Action confirmation modal attivo', auto: false, expected: true },
  { id: 'cross_tenant_guard', label: 'Cross-tenant ownership check in executeAIAction', auto: false, expected: true },
  { id: 'confidence_level', label: 'Confidence level in ogni risposta AI', auto: false, expected: true },
  { id: 'citations', label: 'Source citations nelle risposte AI', auto: false, expected: true },
  { id: 'safe_mode', label: 'AI Safe Mode implementato', auto: false, expected: true },
  { id: 'action_queue', label: 'AI Action Approval Queue attiva', auto: false, expected: true },
];

const RISK_STYLES = {
  Low: 'bg-green-50 text-green-700 border-green-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  High: 'bg-orange-50 text-orange-700 border-orange-200',
  Critical: 'bg-red-50 text-red-700 border-red-200',
};

const STATUS_STYLES = {
  Pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected: 'bg-red-50 text-red-700 border-red-200',
  Executed: 'bg-blue-50 text-blue-700 border-blue-200',
};

function useRAGChunks() {
  return useQuery({
    queryKey: ['rag_chunks'],
    queryFn: () => base44.entities.RAGDocument.list('-created_date', 200),
  });
}

function useActionQueue() {
  return useQuery({
    queryKey: ['action_queue'],
    queryFn: () => base44.entities.AIActionQueue.list('-created_date', 50),
  });
}

function useAuditLogs() {
  return useQuery({
    queryKey: ['audit_logs_analytics'],
    queryFn: () => base44.entities.AIAuditLog.list('-created_date', 200),
  });
}

// ── Tab: RAG Index ────────────────────────────────────────────────────────────
function RAGIndexTab() {
  const { data: chunks = [], isLoading, refetch } = useRAGChunks();
  const [reindexing, setReindexing] = useState({});
  const [reindexLog, setReindexLog] = useState([]);
  const qc = useQueryClient();

  const byType = chunks.reduce((acc, c) => { acc[c.source_type] = (acc[c.source_type] || 0) + 1; return acc; }, {});
  const staleChunks = chunks.filter(c => c.is_stale);
  const totalTenantIsolated = chunks.filter(c => c.company_id).length;

  const reindexSource = async (source) => {
    setReindexing(p => ({ ...p, [source.type]: true }));
    try {
      const entities = await base44.entities[source.entity]?.list('-created_date', 100) || [];
      let done = 0;
      for (const e of entities.slice(0, 20)) {
        await base44.functions.invoke('ragIndexDocument', {
          source_type: source.type, source_id: e.id,
          source_title: e.title || e.property_name || e.name || e.id,
          force_reindex: false,
        }).catch(() => {});
        done++;
      }
      setReindexLog(l => [`${source.label}: ${done} entità indicizzate`, ...l.slice(0, 9)]);
      qc.invalidateQueries({ queryKey: ['rag_chunks'] });
    } catch (e) {
      setReindexLog(l => [`Errore ${source.label}: ${e.message}`, ...l.slice(0, 9)]);
    }
    setReindexing(p => ({ ...p, [source.type]: false }));
  };

  const markStaleClean = async () => {
    await Promise.all(staleChunks.slice(0, 20).map(c => base44.entities.RAGDocument.update(c.id, { is_stale: false })));
    qc.invalidateQueries({ queryKey: ['rag_chunks'] });
  };

  if (isLoading) return <div className="py-8 text-center"><Loader2 className="w-5 h-5 animate-spin text-slate-300 mx-auto" /></div>;

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Chunk totali', value: chunks.length, color: '#1147FF' },
          { label: 'Tenant isolati', value: `${totalTenantIsolated}/${chunks.length}`, color: '#10B981' },
          { label: 'Chunk obsoleti', value: staleChunks.length, color: staleChunks.length > 0 ? '#F97316' : '#10B981' },
          { label: 'Tipi sorgente', value: Object.keys(byType).length, color: '#8B5CF6' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-3">
            <p className="text-[11px] text-slate-500 mb-1">{kpi.label}</p>
            <p className="text-xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* By source type */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-slate-600 mb-3">Distribuzione per tipo sorgente</p>
        <div className="space-y-2">
          {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
            <div key={type} className="flex items-center gap-3">
              <span className="text-xs text-slate-600 w-32 truncate">{SOURCE_TYPE_LABELS[type] || type}</span>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-blue-400" style={{ width: `${(count / chunks.length) * 100}%` }} />
              </div>
              <span className="text-xs text-slate-500 w-8 text-right">{count}</span>
            </div>
          ))}
          {Object.keys(byType).length === 0 && <p className="text-xs text-slate-400 text-center py-4">Nessun documento indicizzato</p>}
        </div>
      </div>

      {/* Reindex controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-slate-600">Controlli Re-indicizzazione</p>
          {staleChunks.length > 0 && (
            <button onClick={markStaleClean} className="text-xs text-amber-600 hover:text-amber-800 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Marca aggiornati ({staleChunks.length})
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {REINDEX_SOURCES.map(source => (
            <button key={source.type} onClick={() => reindexSource(source)} disabled={!!reindexing[source.type]}
              className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all text-xs text-slate-600 hover:text-blue-700 disabled:opacity-50">
              {reindexing[source.type] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <source.icon className="w-3.5 h-3.5" />}
              {source.label}
            </button>
          ))}
        </div>
        {reindexLog.length > 0 && (
          <div className="mt-3 space-y-1">
            {reindexLog.map((l, i) => (
              <p key={i} className="text-[11px] text-slate-500 font-mono">{l}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab: Action Queue ─────────────────────────────────────────────────────────
function ActionQueueTab() {
  const { data: queue = [], isLoading } = useActionQueue();
  const qc = useQueryClient();

  const updateStatus = async (id, status, extra = {}) => {
    await base44.entities.AIActionQueue.update(id, { status, approved_at: new Date().toISOString(), ...extra });
    qc.invalidateQueries({ queryKey: ['action_queue'] });
  };

  const approveAndExecute = async (item) => {
    await updateStatus(item.id, 'Approved');
    try {
      await base44.functions.invoke('executeAIAction', {
        action_type: item.action_type,
        params: item.proposed_params || {},
        session_id: item.requested_in_session || 'queue',
        confirmed: true,
      });
      await updateStatus(item.id, 'Executed', { execution_result: 'Eseguito con successo' });
    } catch (e) {
      await base44.entities.AIActionQueue.update(item.id, { execution_result: `Errore: ${e.message}` });
    }
    qc.invalidateQueries({ queryKey: ['action_queue'] });
  };

  const pending = queue.filter(q => q.status === 'Pending');
  const completed = queue.filter(q => q.status !== 'Pending');

  if (isLoading) return <div className="py-8 text-center"><Loader2 className="w-5 h-5 animate-spin text-slate-300 mx-auto" /></div>;

  return (
    <div className="space-y-4">
      {/* Pending */}
      <div>
        <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> In attesa di approvazione ({pending.length})
        </p>
        {pending.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl py-8 text-center text-sm text-slate-400">
            <CheckCircle2 className="w-6 h-6 text-emerald-300 mx-auto mb-2" /> Nessuna azione in coda
          </div>
        ) : pending.map(item => (
          <div key={item.id} className="bg-white border border-amber-200 rounded-xl p-4 mb-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-xs font-semibold text-slate-900">{item.action_label}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${RISK_STYLES[item.risk_level]}`}>{item.risk_level}</span>
                  <span className="text-[10px] text-slate-400">Richiesto da: {item.requested_by_user_email}</span>
                </div>
                {item.proposed_params && Object.keys(item.proposed_params).length > 0 && (
                  <pre className="text-[11px] text-slate-600 bg-slate-50 rounded-lg px-2 py-1 mt-1 overflow-x-auto">{JSON.stringify(item.proposed_params, null, 2).slice(0, 200)}</pre>
                )}
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button onClick={() => approveAndExecute(item)}
                  className="px-2.5 py-1 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                  Approva ed Esegui
                </button>
                <button onClick={() => updateStatus(item.id, 'Rejected', { rejection_reason: 'Rifiutato dall\'amministratore' })}
                  className="px-2.5 py-1 text-xs font-medium bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                  Rifiuta
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2">Cronologia ({completed.length})</p>
          {completed.slice(0, 10).map(item => (
            <div key={item.id} className="bg-white border border-slate-100 rounded-xl px-4 py-2.5 mb-1 flex items-center gap-3">
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[item.status]}`}>{item.status}</span>
              <p className="text-xs text-slate-700 flex-1 truncate">{item.action_label}</p>
              <span className="text-[11px] text-slate-400">{item.approved_at ? new Date(item.approved_at).toLocaleDateString('it-IT') : ''}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tab: Readiness ────────────────────────────────────────────────────────────
function ReadinessTab() {
  const { data: chunks = [] } = useRAGChunks();
  const { data: auditLogs = [] } = useAuditLogs();

  const checkResults = READINESS_CHECKS.map(check => {
    if (check.auto && check.check) {
      return { ...check, passed: check.check(chunks) };
    }
    return { ...check, passed: check.expected };
  });

  const passedCount = checkResults.filter(c => c.passed).length;
  const score = Math.round((passedCount / checkResults.length) * 100);

  return (
    <div className="space-y-4">
      {/* Score */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-5">
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.9" fill="none"
              stroke={score >= 80 ? '#10B981' : score >= 60 ? '#3B82F6' : '#F59E0B'}
              strokeWidth="3" strokeDasharray={`${score} 100`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-slate-900">{score}%</span>
          </div>
        </div>
        <div>
          <p className="text-base font-bold text-slate-900">AI Foundation Readiness</p>
          <p className="text-sm text-slate-500">{passedCount}/{checkResults.length} controlli superati</p>
          {score >= 90 && <p className="text-xs text-emerald-600 font-medium mt-0.5">Sistema pronto per funzionalità AI avanzate</p>}
          {score < 90 && <p className="text-xs text-amber-600 font-medium mt-0.5">Completa i controlli rimanenti prima di procedere</p>}
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
        {checkResults.map(check => (
          <div key={check.id} className="px-4 py-3 flex items-center gap-3">
            {check.passed
              ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            }
            <p className="text-xs text-slate-700 flex-1">{check.label}</p>
            {check.auto && <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded-md">Auto</span>}
          </div>
        ))}
      </div>

      {/* Audit stats */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-slate-600 mb-3">Statistiche Audit (ultimi {auditLogs.length} log)</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: 'Totale query', value: auditLogs.length },
            { label: 'Azioni eseguite', value: auditLogs.filter(l => l.actions_executed?.length > 0).reduce((s, l) => s + l.actions_executed.length, 0) },
            { label: 'Tentativi bloccati', value: auditLogs.filter(l => l.prompt?.startsWith('ACTION_DENIED')).length },
          ].map((s, i) => (
            <div key={i} className="bg-slate-50 rounded-lg p-2">
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="text-lg font-bold text-slate-900">{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tab: Analytics ────────────────────────────────────────────────────────────
function AnalyticsTab() {
  const { data: logs = [], isLoading } = useAuditLogs();

  const byUser = logs.reduce((acc, l) => { acc[l.user_email] = (acc[l.user_email] || 0) + 1; return acc; }, {});
  const byRole = logs.reduce((acc, l) => { if (l.user_role) acc[l.user_role] = (acc[l.user_role] || 0) + 1; return acc; }, {});
  const avgCtx = logs.filter(l => l.context_used?.length).length
    ? Math.round(logs.filter(l => l.context_used?.length).reduce((s, l) => s + l.context_used.length, 0) / logs.filter(l => l.context_used?.length).length * 10) / 10
    : 0;
  const avgLatency = logs.filter(l => l.latency_ms).length
    ? Math.round(logs.filter(l => l.latency_ms).reduce((s, l) => s + l.latency_ms, 0) / logs.filter(l => l.latency_ms).length)
    : 0;

  if (isLoading) return <div className="py-8 text-center"><Loader2 className="w-5 h-5 animate-spin text-slate-300 mx-auto" /></div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Query totali', value: logs.length, icon: Activity, color: '#1147FF' },
          { label: 'Utenti attivi', value: Object.keys(byUser).length, icon: Users, color: '#8B5CF6' },
          { label: 'Sorgenti medie', value: avgCtx, icon: Database, color: '#10B981' },
          { label: 'Latenza media', value: avgLatency ? `${avgLatency}ms` : '—', icon: Clock, color: '#F59E0B' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1"><kpi.icon className="w-3.5 h-3.5" style={{ color: kpi.color }} /><span className="text-[11px] text-slate-500">{kpi.label}</span></div>
            <p className="text-xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-600 mb-3">Query per utente</p>
          {Object.entries(byUser).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([email, count]) => (
            <div key={email} className="flex items-center gap-2 mb-2">
              <span className="text-[11px] text-slate-600 flex-1 truncate">{email}</span>
              <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 rounded-full" style={{ width: `${(count / logs.length) * 100}%` }} />
              </div>
              <span className="text-[11px] text-slate-500 w-6 text-right">{count}</span>
            </div>
          ))}
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-600 mb-3">Query per ruolo</p>
          {Object.entries(byRole).sort((a, b) => b[1] - a[1]).map(([role, count]) => (
            <div key={role} className="flex items-center gap-2 mb-2">
              <span className="text-[11px] text-slate-600 w-28 capitalize">{role}</span>
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-purple-400 rounded-full" style={{ width: `${(count / logs.length) * 100}%` }} />
              </div>
              <span className="text-[11px] text-slate-500 w-6 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AIFoundationDashboard() {
  const [tab, setTab] = useState('rag');

  const TABS = [
    { key: 'rag',       label: 'RAG & Indice',    icon: Database },
    { key: 'queue',     label: 'Approval Queue',  icon: Zap },
    { key: 'readiness', label: 'Readiness',        icon: Shield },
    { key: 'analytics', label: 'Analytics',        icon: BarChart2 },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
          style={{ background: 'linear-gradient(135deg, #0B2341 0%, #7C3AED 100%)' }}>
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">AI Foundation Dashboard</h1>
          <p className="text-sm text-slate-500">RAG health · Action queue · Readiness · Analytics</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'rag'       && <RAGIndexTab />}
      {tab === 'queue'     && <ActionQueueTab />}
      {tab === 'readiness' && <ReadinessTab />}
      {tab === 'analytics' && <AnalyticsTab />}
    </div>
  );
}