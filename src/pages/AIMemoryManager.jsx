import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Brain, Search, Trash2, Star, Clock, Tag, Link, RefreshCw, Loader2, CheckCircle2, AlertCircle, Eye } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const MEMORY_TYPE_CONFIG = {
  customer_preference:  { label: 'Preferenza cliente',   color: '#8B5CF6', bg: 'bg-purple-50',  border: 'border-purple-200' },
  project_history:      { label: 'Storia progetto',       color: '#3B82F6', bg: 'bg-blue-50',    border: 'border-blue-200' },
  recurring_issue:      { label: 'Problema ricorrente',   color: '#EF4444', bg: 'bg-red-50',     border: 'border-red-200' },
  supplier_history:     { label: 'Fornitore',             color: '#F59E0B', bg: 'bg-amber-50',   border: 'border-amber-200' },
  operational_lesson:   { label: 'Lezione operativa',     color: '#10B981', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  estimate_outcome:     { label: 'Esito preventivo',      color: '#06B6D4', bg: 'bg-cyan-50',    border: 'border-cyan-200' },
  project_delay:        { label: 'Ritardo progetto',      color: '#F97316', bg: 'bg-orange-50',  border: 'border-orange-200' },
  successful_solution:  { label: 'Soluzione riuscita',    color: '#10B981', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  recurring_failure:    { label: 'Fallimento ricorrente', color: '#DC2626', bg: 'bg-red-50',     border: 'border-red-200' },
  pricing_pattern:      { label: 'Pattern pricing',       color: '#7C3AED', bg: 'bg-violet-50',  border: 'border-violet-200' },
};

const SOURCE_LABELS = {
  manual: 'Manuale', ai_extracted: 'AI Estratto', ai_chat: 'Chat AI',
  project_close: 'Chiusura progetto', ticket_resolved: 'Ticket risolto',
  estimate_accepted: 'Preventivo accettato', estimate_rejected: 'Preventivo rifiutato',
};

function MemoryCard({ memory, onToggle, onDelete }) {
  const cfg = MEMORY_TYPE_CONFIG[memory.memory_type] || { label: memory.memory_type, color: '#94a3b8', bg: 'bg-slate-50', border: 'border-slate-200' };
  const relevancePct = Math.round((memory.relevance_score || 0) * 100);

  return (
    <div className={`bg-white border rounded-xl p-4 space-y-2.5 transition-all hover:shadow-sm ${memory.is_active ? 'border-slate-200' : 'border-slate-100 opacity-50'}`}>
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg} border ${cfg.border}`}>
          <Brain className="w-4 h-4" style={{ color: cfg.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <h3 className="text-xs font-semibold text-slate-900 flex-1">{memory.title}</h3>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${cfg.bg} ${cfg.border}`} style={{ color: cfg.color }}>
              {cfg.label}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{memory.content}</p>
        </div>
      </div>

      {/* Tags */}
      {memory.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {memory.tags.map(t => (
            <span key={t} className="text-[10px] bg-slate-50 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded-md flex items-center gap-1">
              <Tag className="w-2 h-2" />{t}
            </span>
          ))}
        </div>
      )}

      {/* Meta row */}
      <div className="flex items-center gap-3 text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <Star className="w-2.5 h-2.5 text-amber-400" />
          Rilevanza: {relevancePct}%
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" />
          {memory.access_count || 0}× usata
        </span>
        {memory.source && (
          <span className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-md">{SOURCE_LABELS[memory.source] || memory.source}</span>
        )}
        <div className="flex items-center gap-1.5 ml-auto">
          <button onClick={() => onToggle(memory)}
            className={`p-1 rounded-md transition-colors ${memory.is_active ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-300 hover:bg-slate-50'}`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(memory.id)}
            className="p-1 rounded-md text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Links */}
      {(memory.client_id || memory.project_id || memory.property_id) && (
        <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-100">
          {memory.project_id && <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded-md flex items-center gap-1"><Link className="w-2 h-2" />Progetto</span>}
          {memory.client_id && <span className="text-[10px] bg-violet-50 text-violet-600 border border-violet-100 px-1.5 py-0.5 rounded-md flex items-center gap-1"><Link className="w-2 h-2" />Cliente</span>}
          {memory.property_id && <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded-md flex items-center gap-1"><Link className="w-2 h-2" />Immobile</span>}
        </div>
      )}
    </div>
  );
}

export default function AIMemoryManager() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showInactive, setShowInactive] = useState(false);
  const qc = useQueryClient();

  const { data: memories = [], isLoading } = useQuery({
    queryKey: ['ai_memories'],
    queryFn: () => base44.entities.AIMemory.list('-relevance_score', 200),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.AIMemory.update(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai_memories'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AIMemory.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai_memories'] }),
  });

  const filtered = memories.filter(m => {
    if (!showInactive && !m.is_active) return false;
    if (typeFilter !== 'all' && m.memory_type !== typeFilter) return false;
    if (search && !m.title?.toLowerCase().includes(search.toLowerCase()) && !m.content?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Group by type
  const grouped = filtered.reduce((acc, m) => {
    const key = m.memory_type || 'other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  const activeCount = memories.filter(m => m.is_active).length;
  const totalUsage = memories.reduce((s, m) => s + (m.access_count || 0), 0);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
            style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #1147FF 100%)' }}>
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">AI Memory</h1>
            <p className="text-sm text-slate-500">Base di conoscenza persistente — si arricchisce ad ogni interazione</p>
          </div>
        </div>
        <button onClick={() => qc.invalidateQueries({ queryKey: ['ai_memories'] })}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Memorie totali', value: memories.length, icon: Brain, color: '#7C3AED' },
          { label: 'Memorie attive', value: activeCount, icon: CheckCircle2, color: '#10B981' },
          { label: 'Utilizzi totali', value: totalUsage, icon: RefreshCw, color: '#3B82F6' },
          { label: 'Categorie attive', value: Object.keys(grouped).length, icon: Tag, color: '#F59E0B' },
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
            placeholder="Cerca memorie…" className="text-xs bg-transparent outline-none text-slate-700 placeholder-slate-400 flex-1" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-600 outline-none">
          <option value="all">Tutte le categorie</option>
          {Object.entries(MEMORY_TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button onClick={() => setShowInactive(v => !v)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border transition-all ${showInactive ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-white text-slate-500 border-slate-200'}`}>
          {showInactive ? <Eye className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
          Inattive
        </button>
        <span className="text-xs text-slate-400 ml-auto">{filtered.length} memorie</span>
      </div>

      {/* Memories grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl py-16 text-center">
          <Brain className="w-8 h-8 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400 font-medium">Nessuna memoria trovata</p>
          <p className="text-xs text-slate-400 mt-1">La memoria si costruisce automaticamente durante le conversazioni AI</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([type, items]) => {
            const cfg = MEMORY_TYPE_CONFIG[type] || { label: type, color: '#94a3b8' };
            return (
              <div key={type}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.color }} />
                  <p className="text-xs font-semibold text-slate-600">{cfg.label}</p>
                  <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{items.length}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map(m => (
                    <MemoryCard key={m.id} memory={m}
                      onToggle={(mem) => toggleMutation.mutate({ id: mem.id, is_active: !mem.is_active })}
                      onDelete={(id) => deleteMutation.mutate(id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}