/**
 * AI Architecture Dashboard — Admin Only
 * View and manage AI providers across all layers: LLM, Embeddings, Vector DB, OCR, Vision, Voice
 */
import { useState } from 'react';
import { Brain, Database, Image, Mic, Eye, Settings, Shield, CheckCircle2, XCircle, Zap, BookOpen, ChevronRight, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { registry } from '@/lib/ai';
const { PROVIDERS, getActiveProvider, listProviders } = registry;

const CAPABILITIES = [
  { key: 'llm', label: 'LLM / Generazione', icon: Brain, color: '#1147FF' },
  { key: 'embeddings', label: 'Embeddings', icon: Database, color: '#10B981' },
  { key: 'vectordb', label: 'Vector DB', icon: Database, color: '#8B5CF6' },
  { key: 'ocr', label: 'OCR / Estrazione Testo', icon: Eye, color: '#F59E0B' },
  { key: 'vision', label: 'Vision / Analisi Immagini', icon: Image, color: '#EF4444' },
  { key: 'voice', label: 'Voice / Audio', icon: Mic, color: '#06B6D4' },
];

const STATUS_STYLES = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ready: 'bg-blue-50 text-blue-700 border-blue-200',
  stub: 'bg-amber-50 text-amber-700 border-amber-200',
  planned: 'bg-slate-50 text-slate-500 border-slate-200',
};

const STATUS_LABELS = {
  active: 'Attivo',
  ready: 'Pronto',
  stub: 'Bozza',
  planned: 'Pianificato',
};

function ProviderCard({ capability }) {
  const [expanded, setExpanded] = useState(false);
  const capConfig = PROVIDERS[capability];
  const activeId = capConfig.active;
  const providers = listProviders(capability);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-slate-100">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${capability.color}15` }}>
          <capability.icon className="w-4 h-4" style={{ color: capability.color }} />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-slate-800">{capability.label}</p>
          {activeId ? (
            <p className="text-[11px] text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {capConfig.providers[activeId]?.name || activeId}
            </p>
          ) : (
            <p className="text-[11px] text-slate-400">Nessun provider attivo</p>
          )}
        </div>
        <button onClick={() => setExpanded(v => !v)}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
          <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {/* Providers list */}
      {expanded && (
        <div className="px-4 py-3 bg-slate-50 space-y-2">
          {providers.map(p => (
            <div key={p.id} className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${
              p.isActive ? 'bg-white border-emerald-200' : 'bg-white border-slate-200'
            }`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`font-medium ${p.isActive ? 'text-emerald-700' : 'text-slate-700'}`}>{p.name}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${STATUS_STYLES[p.status]}`}>
                    {STATUS_LABELS[p.status]}
                  </span>
                </div>
                {p.notes && <p className="text-[11px] text-slate-500 mt-0.5 truncate">{p.notes}</p>}
                {p.models && (
                  <p className="text-[10px] text-slate-400 mt-0.5">Modelli: {p.models.join(', ')}</p>
                )}
                {p.capabilities && (
                  <p className="text-[10px] text-slate-400 mt-0.5">Capability: {p.capabilities.join(', ')}</p>
                )}
              </div>
              {!p.isActive && p.status === 'ready' && (
                <button className="text-[10px] text-blue-600 hover:text-blue-800 font-medium">
                  Attiva
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ArchitectureStats() {
  const stats = {
    active: Object.values(PROVIDERS).filter(c => c.active).length,
    ready: Object.values(PROVIDERS).reduce((sum, c) => sum + Object.values(c.providers).filter(p => p.status === 'ready').length, 0),
    stub: Object.values(PROVIDERS).reduce((sum, c) => sum + Object.values(c.providers).filter(p => p.status === 'stub').length, 0),
    planned: Object.values(PROVIDERS).reduce((sum, c) => sum + Object.values(c.providers).filter(p => p.status === 'planned').length, 0),
  };

  return (
    <div className="grid grid-cols-4 gap-3">
      {[
        { label: 'Provider Attivi', value: stats.active, color: '#10B981' },
        { label: 'Pronti', value: stats.ready, color: '#3B82F6' },
        { label: 'Bozza', value: stats.stub, color: '#F59E0B' },
        { label: 'Pianificati', value: stats.planned, color: '#64748B' },
      ].map((s, i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

function SecurityNotice() {
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
      <Shield className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-xs font-semibold text-emerald-800 mb-0.5">AI Architecture — Sicurezza e Governance</p>
        <ul className="text-[11px] text-emerald-700 space-y-0.5 leading-relaxed">
          <li>• Tutti i provider sono configurabili via registry senza modificare il codice chiamante</li>
          <li>• I provider "stub" e "planned" richiedono implementazione prima dell'attivazione</li>
          <li>• I secret key sono gestiti tramite variabili d'ambiente (non hardcoded)</li>
          <li>• LLM e OCR processano dati tenant-aware con company_id filtering</li>
          <li>• Vision e Voice integrations rispettano i permessi RBAC utente</li>
        </ul>
      </div>
    </div>
  );
}

export default function AIArchitectureReview() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm"
            style={{ background: 'linear-gradient(135deg, #0B2341 0%, #7C3AED 100%)' }}>
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">AI Architecture</h1>
            <p className="text-sm text-slate-500">Provider management · Layer status · Security governance</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-medium">
          <Lock className="w-3.5 h-3.5" /> Admin Only
        </div>
      </div>

      {/* Stats */}
      <ArchitectureStats />

      {/* Security notice */}
      <SecurityNotice />

      {/* Provider cards */}
      <div>
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Settings className="w-3.5 h-3.5 text-slate-400" /> Provider per Layer
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CAPABILITIES.map(cap => (
            <ProviderCard key={cap.key} capability={cap} />
          ))}
        </div>
      </div>

      {/* Implementation guide */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-blue-500" /> Come aggiungere un nuovo provider
        </p>
        <ol className="text-[11px] text-slate-600 space-y-1.5 leading-relaxed list-decimal list-inside">
          <li>Aggiungi il provider in <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">lib/ai/registry.js</code> sotto il layer corrispondente</li>
          <li>Imposta lo status: <code className="text-emerald-600">active</code>, <code className="text-blue-600">ready</code>, <code className="text-amber-600">stub</code>, o <code className="text-slate-500">planned</code></li>
          <li>Se richiede API key, aggiungi il secret key in <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">secretKey</code></li>
          <li>Implementa il modulo in <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">lib/ai/{'{layer}'}.js</code> seguendo l'interfaccia esistente</li>
          <li>Testa il provider con il test console in <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">/ai-test</code></li>
        </ol>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: 'AI Test Console', path: '/ai-test', icon: Zap, desc: 'Testa permissions e sicurezza' },
          { label: 'AI Foundation', path: '/ai-foundation', icon: Database, desc: 'RAG health e action queue' },
          { label: 'AI Audit Log', path: '/ai-audit', icon: Shield, desc: 'Monitora tutte le query AI' },
        ].map((link, i) => (
          <a key={i} href={link.path}
            className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <link.icon className="w-4 h-4 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{link.label}</p>
              <p className="text-[11px] text-slate-500 truncate">{link.desc}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}