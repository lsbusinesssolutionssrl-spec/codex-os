import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Zap, Droplets, Thermometer, Wifi, Shield, DoorOpen, Edit2, Save, X, Trash2, ExternalLink, Brain, Activity, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ContextualAIPanel from '../components/ai/ContextualAIPanel';
import PropertyHealthScore from '../components/ai/PropertyHealthScore';
import OperationalTimeline from '../components/ai/OperationalTimeline';

const NOTES_SECTIONS = [
  { key: 'electrical_notes', label: 'Impianto Elettrico', icon: Zap, color: '#F59E0B' },
  { key: 'plumbing_notes', label: 'Impianto Idraulico', icon: Droplets, color: '#3B82F6' },
  { key: 'heating_cooling_notes', label: 'Riscaldamento / Raffrescamento', icon: Thermometer, color: '#EF4444' },
  { key: 'networking_notes', label: 'Networking', icon: Wifi, color: '#10B981' },
  { key: 'security_notes', label: 'Sicurezza', icon: Shield, color: '#8B5CF6' },
  { key: 'windows_doors_notes', label: 'Infissi / Porte', icon: DoorOpen, color: '#6B7280' },
];

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [client, setClient] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [interventions, setInterventions] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showHealthScore, setShowHealthScore] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);

  useEffect(() => {
    const load = async () => {
      const props = await base44.entities.Property.filter({ id });
      if (!props[0]) return;
      setProperty(props[0]); setForm(props[0]);
      if (props[0].client_id) {
        const cls = await base44.entities.Client.filter({ id: props[0].client_id });
        if (cls[0]) setClient(cls[0]);
      }
      const interventions = props[0].interventions || [];
      const projects = await base44.entities.Project.filter({ property_id: id });
      setInterventions([...interventions, ...projects]);
    };
    load();
  }, [id]);

  const save = async () => {
    const updated = await base44.entities.Property.update(id, form);
    setProperty(updated); setEditing(false);
  };

  const deleteRecord = async () => {
    await base44.entities.Property.delete(id);
    navigate('/properties');
  };

  if (!property) return <div className="p-6 text-center text-gray-400">Caricamento...</div>;

  if (confirmDelete) return (
    <div className="p-6 max-w-sm mx-auto mt-20 bg-white rounded-2xl border border-gray-200 shadow-lg text-center space-y-4">
      <Trash2 className="w-10 h-10 text-red-400 mx-auto" />
      <h2 className="font-bold text-gray-900">Elimina proprietà?</h2>
      <p className="text-sm text-gray-500">Questa azione è irreversibile.</p>
      <div className="flex gap-2">
        <button onClick={deleteRecord} className="flex-1 py-2 text-sm text-white bg-red-500 rounded-lg font-medium hover:bg-red-600">Elimina</button>
        <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-600">Annulla</button>
      </div>
    </div>
  );

  const typeEmoji = { Apartment: '🏢', Villa: '🏡', Office: '🏬', 'Industrial Building': '🏭', 'Commercial Space': '🏪' };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/properties')} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{property.property_name}</h1>
          <p className="text-sm text-gray-500">{client?.name} {client?.company_name}</p>
        </div>
        {!editing ? (
          <div className="flex gap-2">
            <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
              <Edit2 className="w-3.5 h-3.5" /> Modifica
            </button>
            <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button onClick={save} className="flex items-center gap-2 px-3 py-1.5 text-sm text-white rounded-lg" style={{ backgroundColor: '#1147FF' }}>
              <Save className="w-3.5 h-3.5" /> Salva
            </button>
            <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button>
          </div>
        )}
      </div>

      {/* AI Features Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowHealthScore(!showHealthScore)}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            showHealthScore ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Property Health
        </button>
        <button
          onClick={() => setShowTimeline(!showTimeline)}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            showTimeline ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Timeline AI
        </button>
        <button
          onClick={() => setShowAIPanel(!showAIPanel)}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            showAIPanel ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          AI Copilot
        </button>
      </div>

      {/* Property Health Score */}
      {showHealthScore && <PropertyHealthScore propertyId={id} clientId={property.client_id} />}

      {/* Operational Timeline */}
      {showTimeline && <OperationalTimeline entityType="property" entityId={id} />}

      {/* Identity Card */}
      <div className="bg-gradient-to-br from-gray-900 to-blue-950 rounded-2xl p-6 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 text-8xl opacity-10 pointer-events-none p-4">{typeEmoji[property.type] || '🏠'}</div>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center text-3xl flex-shrink-0">
            {typeEmoji[property.type] || '🏠'}
          </div>
          <div>
            <div className="text-xs text-white/50 font-medium uppercase tracking-wider mb-1">Home Passport</div>
            <h2 className="text-xl font-bold">{property.property_name}</h2>
            <p className="text-white/70 text-sm mt-0.5">{property.address}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div>
            <div className="text-white/40 text-xs">Tipo</div>
            <div className="text-white font-medium text-sm mt-0.5">{property.type || '—'}</div>
          </div>
          <div>
            <div className="text-white/40 text-xs">Superficie</div>
            <div className="text-white font-medium text-sm mt-0.5">{property.square_meters ? `${property.square_meters} mq` : '—'}</div>
          </div>
          <div>
            <div className="text-white/40 text-xs">Anno costruzione</div>
            <div className="text-white font-medium text-sm mt-0.5">{property.year_built || '—'}</div>
          </div>
        </div>
      </div>

      {/* Technical Notes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {NOTES_SECTIONS.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '20' }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <span className="text-sm font-semibold text-gray-700">{label}</span>
            </div>
            {editing ? (
              <textarea
                value={form[key] || ''}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none resize-none"
                placeholder={`Note ${label.toLowerCase()}...`}
              />
            ) : (
              <p className="text-sm text-gray-600">{property[key] || <span className="text-gray-300 italic">Nessuna nota</span>}</p>
            )}
          </div>
        ))}
      </div>

      {/* Interventions Timeline */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 text-sm">Timeline Interventi</h3>
        <span className="text-xs text-gray-400">{interventions.length} interventi</span>
        </div>
        {interventions.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">Nessun intervento registrato</div>
        ) : (
          <div className="px-5 py-6">
            <div className="relative">
              {/* vertical line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100" />
              <div className="space-y-6">
                {[...interventions]
                  .sort((a, b) => new Date(b.end_date || b.actual_end_date || b.expected_end_date || b.start_date || b.created_date) - new Date(a.end_date || a.actual_end_date || a.expected_end_date || a.start_date || a.created_date))
                  .map((item, idx) => {
                    const isProject = !!item.id && item.status;
                    const statusColors = {
                      'Lead': '#9CA3AF', 'Survey': '#8B5CF6', 'Estimate': '#3B82F6',
                      'Approved': '#0D9488', 'In Progress': '#1147FF', 'Testing': '#F59E0B',
                      'Delivered': '#10B981', 'Guardian Active': '#059669'
                    };
                    const color = isProject ? (statusColors[item.status] || '#9CA3AF') : '#1147FF';
                    const dateStr = item.start_date
                      ? new Date(item.start_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
                      : item.created_date
                      ? new Date(item.created_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
                      : null;
                    const endStr = item.end_date
                      ? new Date(item.end_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
                      : item.actual_end_date
                      ? new Date(item.actual_end_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
                      : item.expected_end_date
                      ? new Date(item.expected_end_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
                      : null;
                    const title = item.title || item.property_name || 'Intervento';
                    const onClick = isProject ? () => navigate(`/projects/${item.id}`) : undefined;
                    return (
                      <div key={idx} className="relative flex items-start gap-4 pl-10">
                        {/* dot */}
                        <div
                          className="absolute left-[11px] top-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: color }}
                        >
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                        <div
                          className={`flex-1 rounded-xl p-4 border transition-all ${onClick ? 'bg-gray-50 hover:border-gray-300 cursor-pointer' : 'bg-white border-gray-100'}`}
                          onClick={onClick}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{title}</p>
                              {dateStr && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {dateStr}{endStr ? ` → ${endStr}` : ''}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {isProject && (
                                <>
                                  <span
                                    className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
                                    style={{ backgroundColor: color }}
                                  >{item.status}</span>
                                  <ExternalLink className="w-3.5 h-3.5 text-gray-300" />
                                </>
                              )}
                              {!isProject && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">Completato</span>}
                            </div>
                          </div>
                          {item.contract_value && (
                            <p className="text-xs text-gray-500 mt-2">Valore: <span className="font-medium text-gray-700">€{item.contract_value.toLocaleString('it-IT')}</span></p>
                          )}
                          {item.notes && (
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.notes}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Copilot Panel */}
      {showAIPanel && <ContextualAIPanel entityType="property" entityId={id} onClose={() => setShowAIPanel(false)} />}
    </div>
  );
}