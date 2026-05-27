/**
 * PlatformIntelligenceScore
 *
 * Displays how much accumulated data feeds the Codex AI context engine.
 * More data = more valuable AI responses.
 * Updates in real-time as the platform accumulates knowledge.
 */
import { useState, useEffect } from 'react';
import { Brain, TrendingUp, Database, BookOpen, Loader2, Users, FolderKanban, Home, DollarSign, FileText, Ticket, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const DATA_SOURCES = [
  { key: 'projects',   icon: FolderKanban, label: 'Progetti',       weight: 3, entity: 'Project' },
  { key: 'clients',    icon: Users,        label: 'Clienti',        weight: 2, entity: 'Client' },
  { key: 'properties', icon: Home,         label: 'Immobili',       weight: 2, entity: 'Property' },
  { key: 'tickets',    icon: Ticket,       label: 'Ticket',         weight: 2, entity: 'SupportTicket' },
  { key: 'costs',      icon: DollarSign,   label: 'Voci di costo',  weight: 2, entity: 'ProjectCost' },
  { key: 'estimates',  icon: FileText,     label: 'Preventivi',     weight: 2, entity: 'Estimate' },
  { key: 'knowledge',  icon: BookOpen,     label: 'KB Articles',    weight: 4, entity: 'KnowledgeBase' },
  { key: 'memories',   icon: Brain,        label: 'Memorie AI',     weight: 5, entity: 'AIMemory' },
  { key: 'learnings',  icon: TrendingUp,   label: 'Lessons Learned',weight: 5, entity: 'ProjectLearning' },
  { key: 'documents',  icon: Database,     label: 'Documenti RAG',  weight: 3, entity: 'RAGDocument' },
];

const SCORE_LEVELS = [
  { min: 0,  max: 20, label: 'Iniziale',    color: '#94a3b8', desc: 'L\'AI risponde su dati minimi. Aggiungi progetti e clienti.' },
  { min: 20, max: 40, label: 'In crescita', color: '#f59e0b', desc: 'L\'AI ha un contesto base. Ogni progetto completato la migliora.' },
  { min: 40, max: 65, label: 'Operativo',   color: '#3b82f6', desc: 'L\'AI riconosce pattern operativi e suggerisce soluzioni contestuali.' },
  { min: 65, max: 85, label: 'Avanzato',    color: '#8b5cf6', desc: 'L\'AI anticipa problemi, ottimizza stime e personalizza risposte.' },
  { min: 85, max: 101,label: 'Elite',       color: '#10b981', desc: 'L\'AI è pienamente operativa come intelligence layer aziendale.' },
];

export default function PlatformIntelligenceScore() {
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCounts = async () => {
      const results = await Promise.allSettled(
        DATA_SOURCES.map(async (src) => {
          const items = await base44.entities[src.entity]?.list('-created_date', 200).catch(() => []);
          return { key: src.key, count: (items || []).length };
        })
      );
      const c = {};
      results.forEach(r => { if (r.status === 'fulfilled') c[r.value.key] = r.value.count; });
      setCounts(c);
      setLoading(false);
    };
    loadCounts();
  }, []);

  // Weighted score: each source contributes up to its weight * saturation
  const maxPossible = DATA_SOURCES.reduce((s, src) => s + src.weight * 5, 0);
  const actual = DATA_SOURCES.reduce((s, src) => {
    const count = counts[src.key] || 0;
    const saturation = Math.min(count / 20, 1); // saturates at 20 records
    return s + src.weight * 5 * saturation;
  }, 0);
  const score = Math.round((actual / maxPossible) * 100);

  const level = SCORE_LEVELS.find(l => score >= l.min && score < l.max) || SCORE_LEVELS[0];
  const totalRecords = Object.values(counts).reduce((s, v) => s + v, 0);

  if (loading) return (
    <div className="flex items-center justify-center py-4">
      <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
    </div>
  );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Intelligence Score</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight" style={{ color: level.color }}>{score}</span>
            <span className="text-sm text-slate-400 font-medium">/100</span>
            <span className="text-sm font-semibold ml-1" style={{ color: level.color }}>{level.label}</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${level.color}15`, border: `1.5px solid ${level.color}40` }}>
          <Sparkles className="w-5 h-5" style={{ color: level.color }} />
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${score}%`, background: `linear-gradient(90deg, ${level.color}80, ${level.color})` }} />
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">{level.desc}</p>
      </div>

      {/* Data sources grid */}
      <div className="grid grid-cols-2 gap-1.5">
        {DATA_SOURCES.map(src => {
          const count = counts[src.key] || 0;
          const sat = Math.min(count / 20, 1);
          return (
            <div key={src.key} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all ${
              count > 0 ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-60'
            }`}>
              <src.icon className="w-3 h-3 flex-shrink-0" style={{ color: count > 0 ? level.color : '#94a3b8' }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-600 truncate">{src.label}</span>
                  <span className="text-[10px] font-semibold text-slate-500 ml-1">{count}</span>
                </div>
                <div className="h-1 bg-slate-100 rounded-full mt-0.5 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${sat * 100}%`, backgroundColor: count > 0 ? level.color : '#cbd5e1' }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
        <span className="text-[11px] text-slate-400">{totalRecords.toLocaleString('it-IT')} record totali</span>
        <span className="text-[11px] text-slate-400 flex items-center gap-1">
          <Database className="w-2.5 h-2.5" /> Live context engine
        </span>
      </div>
    </div>
  );
}