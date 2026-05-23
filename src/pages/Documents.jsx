import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, Upload } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StatusBadge from '../components/StatusBadge';

const TYPES = ['', 'Contract', 'Estimate', 'Invoice', 'Certification', 'Warranty', 'Floor Plan', 'Photo', 'Other'];

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [clients, setClients] = useState({});
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const [docs, cls] = await Promise.all([
        base44.entities.Document.list('-created_date'),
        base44.entities.Client.list(),
      ]);
      setDocuments(docs);
      const map = {};
      cls.forEach(c => { map[c.id] = c.name + (c.company_name ? ` ${c.company_name}` : ''); });
      setClients(map);
    };
    load();
  }, []);

  const filtered = documents.filter(d => {
    const q = search.toLowerCase();
    const match = !q || d.title?.toLowerCase().includes(q) || clients[d.client_id]?.toLowerCase().includes(q);
    return match && (!typeFilter || d.type === typeFilter);
  });

  const createNew = async () => {
    const created = await base44.entities.Document.create({ title: 'Nuovo Documento', type: 'Other' });
    navigate(`/documents/${created.id}`);
  };

  const typeIcon = {
    Contract: '📄', Estimate: '📋', Invoice: '💰', Certification: '🏆',
    Warranty: '🛡️', 'Floor Plan': '📐', Photo: '📷', Other: '📁'
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documenti</h1>
          <p className="text-sm text-gray-500">{documents.length} documenti archiviati</p>
        </div>
        <button onClick={createNew} className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium" style={{ backgroundColor: '#1147FF' }}>
          <Plus className="w-4 h-4" /> Nuovo Documento
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca documento..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none">
          <option value="">Tutti i tipi</option>
          {TYPES.slice(1).map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center text-gray-400 text-sm">Nessun documento trovato</div>
        ) : filtered.map(d => (
          <div key={d.id} onClick={() => navigate(`/documents/${d.id}`)} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" style={{ backgroundColor: '#0B234115' }}>
                {typeIcon[d.type] || '📁'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{d.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{d.type}</p>
                <p className="text-xs text-gray-400 mt-1">{clients[d.client_id] || '—'}</p>
              </div>
            </div>
            {d.expiration_date && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-gray-400">Scadenza:</span>
                <span className={`text-xs font-medium ${new Date(d.expiration_date) < new Date() ? 'text-red-500' : 'text-gray-600'}`}>
                  {new Date(d.expiration_date).toLocaleDateString('it-IT')}
                </span>
              </div>
            )}
            {d.notes && <div className="mt-2 text-xs text-gray-500 line-clamp-2">{d.notes}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}