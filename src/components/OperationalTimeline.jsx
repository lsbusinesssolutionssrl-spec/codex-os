import { useState, useEffect } from 'react';
import { Upload, CheckSquare, AlertTriangle, Brain, Calendar, FileText, DollarSign, MessageSquare, Activity } from 'lucide-react';
import { format } from 'date-fns';

export default function OperationalTimeline({ entityId, entityType }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTimeline = async () => {
      try {
        // In production, this would fetch from a dedicated timeline endpoint
        // For now, we'll simulate with entity data
        const timelineEvents = [];
        
        // Simulate different event types
        timelineEvents.push({
          id: '1',
          type: 'upload',
          title: 'Documento caricato',
          description: 'Preventivo v1.pdf',
          timestamp: new Date().toISOString(),
          user: 'Mario Rossi',
        });
        timelineEvents.push({
          id: '2',
          type: 'task',
          title: 'Task completato',
          description: 'Ispezione elettrica',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          user: 'Luca Bianchi',
        });
        timelineEvents.push({
          id: '3',
          type: 'ai',
          title: 'AI Insight generato',
          description: 'Rilevato potenziale ritardo',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          user: 'AI Copilot',
        });
        timelineEvents.push({
          id: '4',
          type: 'ticket',
          title: 'Ticket creato',
          description: 'Problema impianto idraulico',
          timestamp: new Date(Date.now() - 259200000).toISOString(),
          user: 'Giulia Verdi',
        });
        timelineEvents.push({
          id: '5',
          type: 'cost',
          title: 'Costo aggiunto',
          description: 'Materiali: €1,250',
          timestamp: new Date(Date.now() - 345600000).toISOString(),
          user: 'Marco Neri',
        });

        setEvents(timelineEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
      } catch (error) {
        console.error('Error loading timeline:', error);
      } finally {
        setLoading(false);
      }
    };

    if (entityId) {
      loadTimeline();
    }
  }, [entityId]);

  if (loading) return <div className="text-center text-gray-400 text-sm py-4">Caricamento...</div>;

  return (
    <div className="space-y-4">
      {events.map((event, idx) => (
        <div key={event.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getEventColor(event.type)}`}>
              {getEventIcon(event.type)}
            </div>
            {idx < events.length - 1 && <div className="w-0.5 h-12 bg-gray-200" />}
          </div>
          <div className="flex-1 pb-4">
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{event.description}</p>
                </div>
                <span className="text-xs text-gray-400">
                  {format(new Date(event.timestamp), 'dd MMM HH:mm')}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-500">{event.user}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
      {events.length === 0 && (
        <div className="text-center text-gray-400 text-sm py-8">
          Nessun evento nella timeline
        </div>
      )}
    </div>
  );
}

function getEventIcon(type) {
  const icons = {
    upload: <Upload className="w-4 h-4" />,
    task: <CheckSquare className="w-4 h-4" />,
    ai: <Brain className="w-4 h-4" />,
    ticket: <AlertTriangle className="w-4 h-4" />,
    cost: <DollarSign className="w-4 h-4" />,
    calendar: <Calendar className="w-4 h-4" />,
    document: <FileText className="w-4 h-4" />,
    comment: <MessageSquare className="w-4 h-4" />,
  };
  return icons[type] || <Activity className="w-4 h-4" />;
}

function getEventColor(type) {
  const colors = {
    upload: 'bg-blue-100 text-blue-600',
    task: 'bg-green-100 text-green-600',
    ai: 'bg-purple-100 text-purple-600',
    ticket: 'bg-red-100 text-red-600',
    cost: 'bg-orange-100 text-orange-600',
    calendar: 'bg-teal-100 text-teal-600',
    document: 'bg-gray-100 text-gray-600',
    comment: 'bg-indigo-100 text-indigo-600',
  };
  return colors[type] || 'bg-gray-100 text-gray-600';
}