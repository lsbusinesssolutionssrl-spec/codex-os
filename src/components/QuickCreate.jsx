import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, FileText, FolderKanban, Ticket, CheckSquare, Upload, Home, Calendar, MessageSquare, Brain, ChevronRight, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function QuickCreate({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState(null);
  const [formData, setFormData] = useState({});
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);

  const createTypes = [
    { type: 'estimate', label: 'Preventivo', icon: FileText, color: '#1147FF' },
    { type: 'project', label: 'Progetto', icon: FolderKanban, color: '#10B981' },
    { type: 'ticket', label: 'Ticket', icon: Ticket, color: '#F59E0B' },
    { type: 'task', label: 'Task', icon: CheckSquare, color: '#8B5CF6' },
    { type: 'document', label: 'Documento', icon: Upload, color: '#EF4444' },
    { type: 'note', label: 'Nota', icon: MessageSquare, color: '#06B6D4' },
    { type: 'inspection', label: 'Ispezione', icon: Calendar, color: '#EC4899' },
    { type: 'maintenance', label: 'Manutenzione', icon: Home, color: '#F97316' },
  ];

  useEffect(() => {
    if (selectedType && formData) {
      const timer = setTimeout(() => {
        suggestWithAI();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedType]);

  const suggestWithAI = async () => {
    setAiSuggesting(true);
    try {
      const response = await base44.functions.invoke('generateContextualSuggestions', {
        context: { type: selectedType, ...formData }
      });
      setAiSuggestions(response.data?.suggestions || {});
    } catch (error) {
      console.error('AI suggestion error:', error);
    } finally {
      setAiSuggesting(false);
    }
  };

  const handleQuickCreate = async () => {
    try {
      let createdEntity;
      
      switch (selectedType) {
        case 'estimate':
          createdEntity = await base44.entities.Estimate.create({
            title: formData.title || 'Nuovo Preventivo',
            client_id: formData.client_id,
            status: 'Draft',
            ...aiSuggestions
          });
          navigate(`/estimates/${createdEntity.id}`);
          break;
        case 'project':
          createdEntity = await base44.entities.Project.create({
            title: formData.title || 'Nuovo Progetto',
            client_id: formData.client_id,
            property_id: formData.property_id,
            status: 'Lead',
          });
          navigate(`/projects/${createdEntity.id}`);
          break;
        case 'ticket':
          createdEntity = await base44.entities.SupportTicket.create({
            subject: formData.subject || 'Nuovo Ticket',
            description: formData.description,
            priority: formData.priority || 'Medium',
            status: 'Open',
          });
          navigate(`/tickets/${createdEntity.id}`);
          break;
        case 'task':
          createdEntity = await base44.entities.Task.create({
            title: formData.title || 'Nuovo Task',
            description: formData.description,
            status: 'todo',
            priority: formData.priority || 'medium',
          });
          navigate('/tasks');
          break;
        default:
          alert('Create functionality coming soon');
      }
      
      onClose();
      setSelectedType(null);
      setFormData({});
    } catch (error) {
      console.error('Create error:', error);
      alert('Errore nella creazione');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Crea Nuovo</h2>
            <p className="text-xs text-gray-500 mt-0.5">Seleziona tipo e compila velocemente</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Selection */}
        {!selectedType ? (
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {createTypes.map(item => (
                <button
                  key={item.type}
                  onClick={() => setSelectedType(item.type)}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                >
                  <item.icon className="w-6 h-6" style={{ color: item.color }} />
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Form */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <button 
                  onClick={() => setSelectedType(null)}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  ← Indietro
                </button>
                <h3 className="text-sm font-semibold text-gray-900">
                  {createTypes.find(t => t.type === selectedType)?.label}
                </h3>
              </div>

              {/* Dynamic Fields */}
              {selectedType === 'estimate' && (
                <>
                  <input
                    type="text"
                    placeholder="Titolo"
                    value={formData.title || ''}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-300"
                  />
                  <select
                    value={formData.client_id || ''}
                    onChange={e => setFormData({...formData, client_id: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-300"
                  >
                    <option value="">Seleziona Cliente</option>
                    {/* Would load clients dynamically */}
                  </select>
                </>
              )}

              {selectedType === 'project' && (
                <>
                  <input
                    type="text"
                    placeholder="Titolo"
                    value={formData.title || ''}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-300"
                  />
                  <input
                    type="text"
                    placeholder="Cliente ID"
                    value={formData.client_id || ''}
                    onChange={e => setFormData({...formData, client_id: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-300"
                  />
                </>
              )}

              {selectedType === 'ticket' && (
                <>
                  <input
                    type="text"
                    placeholder="Oggetto"
                    value={formData.subject || ''}
                    onChange={e => setFormData({...formData, subject: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-300"
                  />
                  <textarea
                    placeholder="Descrizione"
                    value={formData.description || ''}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-300"
                    rows={3}
                  />
                  <select
                    value={formData.priority || ''}
                    onChange={e => setFormData({...formData, priority: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-300"
                  >
                    <option value="">Priorità</option>
                    <option value="Low">Bassa</option>
                    <option value="Medium">Media</option>
                    <option value="High">Alta</option>
                    <option value="Critical">Critica</option>
                  </select>
                </>
              )}

              {selectedType === 'task' && (
                <>
                  <input
                    type="text"
                    placeholder="Titolo"
                    value={formData.title || ''}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-300"
                  />
                  <textarea
                    placeholder="Descrizione"
                    value={formData.description || ''}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-300"
                    rows={2}
                  />
                </>
              )}

              {/* AI Suggestions */}
              {aiSuggestions && Object.keys(aiSuggestions).length > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-semibold text-purple-700">Suggerimenti AI</span>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(aiSuggestions).map(([key, value]) => (
                      <div key={key} className="flex items-start gap-2">
                        <span className="text-xs text-purple-600 capitalize">{key.replace('_', ' ')}:</span>
                        <span className="text-xs text-gray-700">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Annulla
              </button>
              <button
                onClick={handleQuickCreate}
                className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#1147FF' }}
              >
                <Plus className="w-4 h-4" />
                Crea
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}