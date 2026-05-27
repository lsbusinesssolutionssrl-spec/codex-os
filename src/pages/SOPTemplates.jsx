import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ClipboardList, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const CATEGORIES = ['Bathroom', 'Full Home', 'Electrical', 'Networking', 'Security', 'Roofing', 'Handover'];
const CAT_COLORS = {
  Bathroom: '#3B82F6', 'Full Home': '#8B5CF6', Electrical: '#F59E0B',
  Networking: '#06B6D4', Security: '#EF4444', Roofing: '#6B7280', Handover: '#10B981',
};
const CAT_EMOJI = {
  Bathroom: '🚿', 'Full Home': '🏠', Electrical: '⚡', Networking: '🌐',
  Security: '🔐', Roofing: '🏗️', Handover: '🤝',
};

export default function SOPTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.SOPTemplate.list()
      .then(t => { setTemplates(t); setLoading(false); })
      .catch(err => {
        console.error('Error loading SOP templates:', err);
        setLoading(false);
      });
  }, []);

  const createTemplate = async (category) => {
    const t = await base44.entities.SOPTemplate.create({ title: `Nuova procedura ${category}`, category, items: [] });
    navigate(`/sop/${t.id}`);
  };

  const filtered = filter ? templates.filter(t => t.category === filter) : templates;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SOP Templates</h1>
          <p className="text-sm text-gray-500 mt-0.5">Modelli di procedure operative standard riutilizzabili</p>
        </div>
        <div className="relative group">
          <button className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium" style={{ backgroundColor: '#1147FF' }}>
            <Plus className="w-4 h-4" /> Nuovo Template
          </button>
          <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-10 w-48 py-1 hidden group-hover:block">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => createTemplate(c)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                <span>{CAT_EMOJI[c]}</span>{c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter('')} className={`px-3 py-1 text-sm rounded-lg border transition-colors ${!filter ? 'text-white border-transparent' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}`} style={!filter ? { backgroundColor: '#1147FF' } : {}}>
          Tutti
        </button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1 text-sm rounded-lg border transition-colors ${filter === c ? 'text-white border-transparent' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}`} style={filter === c ? { backgroundColor: CAT_COLORS[c] } : {}}>
            {CAT_EMOJI[c]} {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nessun template</p>
          <p className="text-sm text-gray-400 mt-1">Crea il primo modello di procedura operativa</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => (
            <div key={t.id} onClick={() => navigate(`/sop/${t.id}`)} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: (CAT_COLORS[t.category] || '#6B7280') + '15' }}>
                  {CAT_EMOJI[t.category] || '📋'}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors mt-1" />
              </div>
              <h3 className="font-semibold text-gray-900">{t.title}</h3>
              <p className="text-xs mt-1 font-medium" style={{ color: CAT_COLORS[t.category] || '#6B7280' }}>{t.category}</p>
              {t.description && <p className="text-xs text-gray-400 mt-2 line-clamp-2">{t.description}</p>}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">{(t.items || []).length} voci</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}