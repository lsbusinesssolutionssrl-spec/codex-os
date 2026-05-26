import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const ENTITY_CONFIG = [
  { key: 'clients', entity: 'Client', label: 'Clienti', path: '/clients', nameField: 'name' },
  { key: 'projects', entity: 'Project', label: 'Progetti', path: '/projects', nameField: 'title' },
  { key: 'estimates', entity: 'Estimate', label: 'Preventivi', path: '/estimates', nameField: 'title' },
  { key: 'tickets', entity: 'SupportTicket', label: 'Ticket', path: '/tickets', nameField: 'title' },
  { key: 'properties', entity: 'Property', label: 'Proprietà', path: '/properties', nameField: 'property_name' },
];

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const search = async (q) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    setLoading(true);
    const q_lower = q.toLowerCase();
    const all = await Promise.all(
      ENTITY_CONFIG.map(async (cfg) => {
        const items = await base44.entities[cfg.entity].list();
        return items
          .filter(item => (item[cfg.nameField] || '').toLowerCase().includes(q_lower))
          .slice(0, 3)
          .map(item => ({ id: item.id, name: item[cfg.nameField], label: cfg.label, path: cfg.path }));
      })
    );
    setResults(all.flat());
    setOpen(true);
    setLoading(false);
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  };

  const handleSelect = (item) => {
    navigate(`${item.path}/${item.id}`);
    setQuery('');
    setOpen(false);
  };

  const clear = () => { setQuery(''); setResults([]); setOpen(false); };

  return (
    <div ref={containerRef} className="relative w-64">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
        <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Cerca..."
          className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none min-w-0"
        />
        {query && (
          <button onClick={clear}>
            <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
          {loading ? (
            <div className="px-4 py-3 text-sm text-gray-400">Ricerca...</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400">Nessun risultato</div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
              {results.map((item) => (
                <button
                  key={`${item.path}-${item.id}`}
                  onClick={() => handleSelect(item)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 text-left"
                >
                  <span className="text-sm text-gray-800 font-medium truncate">{item.name}</span>
                  <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}