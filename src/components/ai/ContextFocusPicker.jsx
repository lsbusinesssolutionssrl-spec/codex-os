/**
 * ContextFocusPicker
 *
 * Lets the user attach a specific entity (Project, Client, Property, Estimate)
 * to the current conversation. This triggers deep-graph context injection in
 * the codexAIChat backend — the AI gets full relationship data for the entity.
 */
import { useState, useEffect, useRef } from 'react';
import { FolderKanban, Users, Home, FileText, X, ChevronDown, Search, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const FOCUS_TYPES = [
  { key: 'project',  icon: FolderKanban, label: 'Progetto',  color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  { key: 'client',   icon: Users,        label: 'Cliente',   color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
  { key: 'property', icon: Home,         label: 'Immobile',  color: 'text-emerald-600',bg: 'bg-emerald-50',border: 'border-emerald-200' },
  { key: 'estimate', icon: FileText,     label: 'Preventivo',color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200' },
];

export default function ContextFocusPicker({ focus, onFocusChange }) {
  const [open, setOpen] = useState(false);
  const [focusType, setFocusType] = useState('project');
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState([]);
  const [loadingOpts, setLoadingOpts] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    loadOptions(focusType);
  }, [open, focusType]);

  const loadOptions = async (type) => {
    setLoadingOpts(true);
    try {
      const loaders = {
        project:  () => base44.entities.Project.list('-updated_date', 20),
        client:   () => base44.entities.Client.list('-updated_date', 20),
        property: () => base44.entities.Property.list('-updated_date', 20),
        estimate: () => base44.entities.Estimate.list('-updated_date', 20),
      };
      const items = await loaders[type]();
      const labelField = { project: 'title', client: 'name', property: 'property_name', estimate: 'title' }[type];
      const subField = { project: 'status', client: 'email', property: 'address', estimate: 'status' }[type];
      setOptions(items.map(it => ({ id: it.id, label: it[labelField] || it.id, sub: it[subField] || '' })));
    } catch {}
    setLoadingOpts(false);
  };

  const selectItem = (item) => {
    onFocusChange({ type: focusType, id: item.id, label: item.label });
    setOpen(false); setSearch('');
  };

  const filteredOpts = options.filter(o =>
    !search || o.label.toLowerCase().includes(search.toLowerCase()) || o.sub.toLowerCase().includes(search.toLowerCase())
  );

  const activeCfg = FOCUS_TYPES.find(t => t.key === focus?.type);

  return (
    <div ref={ref} className="relative">
      {focus ? (
        // Active focus badge
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${activeCfg?.bg} ${activeCfg?.border} ${activeCfg?.color}`}>
          {activeCfg && <activeCfg.icon className="w-3 h-3 flex-shrink-0" />}
          <span className="truncate max-w-32">{focus.label}</span>
          <span className="opacity-40 text-[10px] capitalize">{focus.type}</span>
          <button onClick={() => onFocusChange(null)} className="ml-0.5 opacity-60 hover:opacity-100">
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        // Trigger
        <button onClick={() => setOpen(v => !v)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 border border-dashed border-slate-300 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
          <Zap className="w-3 h-3" />
          <span>Focus contesto</span>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </button>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute bottom-full mb-2 left-0 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Type tabs */}
          <div className="flex border-b border-slate-100 p-1 gap-0.5">
            {FOCUS_TYPES.map(t => (
              <button key={t.key} onClick={() => { setFocusType(t.key); setSearch(''); }}
                className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                  focusType === t.key ? `${t.bg} ${t.color}` : 'text-slate-500 hover:bg-slate-50'
                }`}>
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="px-3 pt-2 pb-1">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <Search className="w-3 h-3 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} autoFocus
                placeholder={`Cerca ${FOCUS_TYPES.find(t => t.key === focusType)?.label.toLowerCase()}…`}
                className="flex-1 text-xs bg-transparent outline-none text-slate-700 placeholder-slate-400" />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-52 overflow-y-auto pb-1">
            {loadingOpts ? (
              <div className="py-4 text-center text-xs text-slate-400">Caricamento…</div>
            ) : filteredOpts.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">Nessun risultato</div>
            ) : filteredOpts.map(opt => (
              <button key={opt.id} onClick={() => selectItem(opt)}
                className="w-full px-3 py-2 text-left hover:bg-slate-50 transition-colors flex flex-col gap-0.5">
                <span className="text-xs font-medium text-slate-800 truncate">{opt.label}</span>
                {opt.sub && <span className="text-[11px] text-slate-400 truncate">{opt.sub}</span>}
              </button>
            ))}
          </div>

          {focus && (
            <div className="border-t border-slate-100 p-2">
              <button onClick={() => { onFocusChange(null); setOpen(false); }}
                className="w-full text-xs text-slate-500 hover:text-red-500 py-1 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5">
                <X className="w-3 h-3" /> Rimuovi focus
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}