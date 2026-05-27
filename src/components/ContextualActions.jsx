import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Upload, FileText, TrendingUp, AlertTriangle, CheckSquare, Calendar, Brain, ChevronRight, X, Users } from 'lucide-react';

export default function ContextualActions({ context, entityType }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const actions = {
    project: [
      { label: 'Aggiungi Costo', icon: TrendingUp, action: () => navigate(`/projects/${context.id}/financial`) },
      { label: 'Carica Foto', icon: Upload, action: () => alert('Upload photos') },
      { label: 'Genera Riassunto AI', icon: Brain, action: () => navigate('/ai') },
      { label: 'Apri Issue', icon: AlertTriangle, action: () => navigate('/tickets') },
      { label: 'Crea Task', icon: CheckSquare, action: () => navigate('/tasks') },
      { label: 'Genera Report', icon: FileText, action: () => alert('Generate report') },
    ],
    property: [
      { label: 'Aggiungi Manutenzione', icon: Calendar, action: () => navigate('/maintenance') },
      { label: 'Carica Certificazione', icon: Upload, action: () => navigate('/documents') },
      { label: 'Genera Health Review', icon: Brain, action: () => navigate('/property-intelligence') },
      { label: 'Programma Ispezione', icon: Calendar, action: () => alert('Schedule inspection') },
    ],
    estimate: [
      { label: 'Converti in Progetto', icon: Plus, action: () => alert('Convert to project') },
      { label: 'Genera PDF', icon: FileText, action: () => alert('Generate PDF') },
      { label: 'Invia a Cliente', icon: Upload, action: () => alert('Send to client') },
      { label: 'Analisi AI', icon: Brain, action: () => navigate('/ai') },
    ],
    ticket: [
      { label: 'Assegna Tecnico', icon: Users, action: () => alert('Assign technician') },
      { label: 'Escalate', icon: AlertTriangle, action: () => alert('Escalate') },
      { label: 'Genera Risoluzione AI', icon: Brain, action: () => navigate('/ai') },
      { label: 'Crea Follow-Up', icon: Calendar, action: () => alert('Create follow-up') },
    ],
  };

  const currentActions = actions[entityType] || [];

  if (!context) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity"
        style={{ backgroundColor: '#1147FF' }}
      >
        <Plus className="w-4 h-4" />
        Azioni Rapide
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Azioni Rapide</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-2">
              {currentActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => { action.action(); setIsOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                >
                  <action.icon className="w-4 h-4 text-gray-400" />
                  <span className="flex-1 text-left">{action.label}</span>
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}