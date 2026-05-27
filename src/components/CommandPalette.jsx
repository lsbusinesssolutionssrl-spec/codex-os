import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, FileText, Home, FolderKanban, Users, Ticket, Archive, Calendar, CheckSquare, ChevronRight, Command, Clock, Star, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ clients: [], properties: [], projects: [], estimates: [], tickets: [], documents: [] });
  const [recentSearches, setRecentSearches] = useState([]);
  const [recentEntities, setRecentEntities] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const quickActions = [
    { label: 'Crea Preventivo', icon: Plus, action: () => navigate('/ai-estimator'), shortcut: 'N' },
    { label: 'Crea Progetto', icon: FolderKanban, action: () => navigate('/projects'), shortcut: 'P' },
    { label: 'Carica Documento', icon: Archive, action: () => navigate('/documents'), shortcut: 'D' },
    { label: 'Apri Ticket', icon: Ticket, action: () => navigate('/tickets'), shortcut: 'T' },
    { label: 'Aggiungi Costo', icon: TrendingUp, action: () => navigate('/financial-control'), shortcut: 'C' },
    { label: 'Genera Riassunto AI', icon: Command, action: () => navigate('/ai'), shortcut: 'A' },
    { label: 'Crea Task', icon: CheckSquare, action: () => navigate('/tasks'), shortcut: 'K' },
  ];

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults({ clients: [], properties: [], projects: [], estimates: [], tickets: [], documents: [] });
      return;
    }

    const loadRecent = async () => {
      try {
        const [estimates, projects, tickets] = await Promise.all([
          base44.entities.Estimate.list(undefined, 5),
          base44.entities.Project.list(undefined, 5),
          base44.entities.SupportTicket.list(undefined, 5),
        ]);
        
        setRecentEntities([
          ...estimates.slice(0, 2).map(e => ({ type: 'estimate', id: e.id, title: e.title, date: e.created_date })),
          ...projects.slice(0, 2).map(p => ({ type: 'project', id: p.id, title: p.title, date: p.created_date })),
          ...tickets.slice(0, 1).map(t => ({ type: 'ticket', id: t.id, title: t.subject, date: t.created_date })),
        ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5));
      } catch (error) {
        console.error('Error loading recent:', error);
      }
    };

    loadRecent();
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ clients: [], properties: [], projects: [], estimates: [], tickets: [], documents: [] });
      return;
    }

    const search = async () => {
      const q = query.toLowerCase();
      try {
        const [clients, properties, projects, estimates, tickets, documents] = await Promise.all([
          base44.entities.Client.list(),
          base44.entities.Property.list(),
          base44.entities.Project.list(),
          base44.entities.Estimate.list(),
          base44.entities.SupportTicket.list(),
          base44.entities.Document.list(),
        ]);

        setResults({
          clients: clients.filter(c => c.full_name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)).slice(0, 5),
          properties: properties.filter(p => p.property_name?.toLowerCase().includes(q) || p.address?.toLowerCase().includes(q)).slice(0, 5),
          projects: projects.filter(p => p.title?.toLowerCase().includes(q)).slice(0, 5),
          estimates: estimates.filter(e => e.title?.toLowerCase().includes(q)).slice(0, 5),
          tickets: tickets.filter(t => t.subject?.toLowerCase().includes(q)).slice(0, 5),
          documents: documents.filter(d => d.title?.toLowerCase().includes(q)).slice(0, 5),
        });
      } catch (error) {
        console.error('Search error:', error);
      }
    };

    const timer = setTimeout(search, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => prev + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(0, prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // Handle selection
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    const handleGlobalKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) {
          // Open is handled by parent
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKey);
    return () => document.removeEventListener('keydown', handleGlobalKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
  const showQuickActions = !query.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Cerca clienti, progetti, preventivi, ticket, documenti..."
            className="flex-1 text-sm outline-none placeholder:text-gray-400"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-xs text-gray-400 hover:text-gray-600">
              Clear
            </button>
          )}
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto">
          {showQuickActions ? (
            <>
              {/* Quick Actions */}
              <div className="p-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Azioni Rapide</h3>
                <div className="space-y-1">
                  {quickActions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => { action.action(); onClose(); }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <action.icon className="w-4 h-4 text-gray-400" />
                      <span className="flex-1 text-left">{action.label}</span>
                      <span className="text-xs text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded">{action.shortcut}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Entities */}
              {recentEntities.length > 0 && (
                <div className="px-4 pb-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Recenti</h3>
                  <div className="space-y-1">
                    {recentEntities.map((entity, idx) => (
                      <button
                        key={idx}
                        onClick={() => { navigate(`/${entity.type}s/${entity.id}`); onClose(); }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="flex-1 text-left">{entity.title}</span>
                        <span className="text-xs text-gray-400">{new Date(entity.date).toLocaleDateString('it-IT')}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : totalResults === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              Nessun risultato per "{query}"
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {Object.entries(results).map(([type, items]) => 
                items.length > 0 && (
                  <div key={type}>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">{type}</h3>
                    <div className="space-y-1">
                      {items.map((item, idx) => (
                        <button
                          key={item.id}
                          onClick={() => { navigate(`/${type.slice(0, -1)}/${item.id}`); onClose(); }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Search className="w-4 h-4 text-gray-400" />
                          <span className="flex-1 text-left">{item.title || item.full_name || item.property_name || item.subject}</span>
                          <ChevronRight className="w-3 h-3 text-gray-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}