import { useState, useEffect } from 'react';
import { Clock, Calendar, Activity, Wrench, AlertTriangle, CheckCircle, FileText, Mail, Home, Zap, Droplets, Thermometer } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const EVENT_ICONS = {
  project: FileText,
  maintenance: Wrench,
  ticket: AlertTriangle,
  inspection: Activity,
  warranty: CheckCircle,
  equipment: Zap,
  risk: AlertTriangle,
  insight: Activity,
};

const EVENT_COLORS = {
  project: '#1147FF',
  maintenance: '#10B981',
  ticket: '#EF4444',
  inspection: '#8B5CF6',
  warranty: '#06B6D4',
  equipment: '#F59E0B',
  risk: '#EF4444',
  insight: '#7C3AED',
};

const CATEGORY_ICONS = {
  HVAC: Thermometer,
  Electrical: Zap,
  Plumbing: Droplets,
  Roofing: Home,
  Security: Activity,
  Networking: Activity,
  Structural: Home,
};

export default function LifecycleTimeline({ entityType, entityId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (entityId) loadTimeline();
  }, [entityId, filter]);

  const loadTimeline = async () => {
    setLoading(true);
    try {
      let propertyId = entityId;
      
      // If viewing property, use it directly. If viewing client, fetch their properties
      if (entityType === 'client') {
        const properties = await base44.entities.Property.filter({ client_id: entityId });
        propertyId = properties[0]?.id; // Use first property for now
        if (!propertyId) {
          setLoading(false);
          return;
        }
      }

      const [projects, tickets, maintenance, equipment, risks, insights, property] = await Promise.all([
        base44.entities.Project.filter({ property_id: propertyId }).catch(() => []),
        base44.entities.SupportTicket.filter({ property_id: propertyId }).catch(() => []),
        base44.entities.PropertyMaintenance.filter({ property_id: propertyId }).catch(() => []),
        base44.entities.PropertyEquipment.filter({ property_id: propertyId }).catch(() => []),
        base44.entities.PropertyRisk.filter({ property_id: propertyId }).catch(() => []),
        base44.entities.PropertyInsight.filter({ property_id: propertyId }).catch(() => []),
        base44.entities.Property.get(propertyId).catch(() => null),
      ]);

      const allEvents = [];

      // Projects
      projects.forEach(p => {
        allEvents.push({
          type: 'project',
          date: p.start_date || p.created_date,
          title: p.title,
          description: p.status,
          category: 'Project',
          value: p.contract_value,
          metadata: p,
        });
      });

      // Tickets
      tickets.forEach(t => {
        allEvents.push({
          type: 'ticket',
          date: t.created_date,
          title: t.title,
          description: `${t.issue_type} · ${t.priority}`,
          category: t.issue_type,
          metadata: t,
        });
      });

      // Maintenance
      maintenance.forEach(m => {
        allEvents.push({
          type: 'maintenance',
          date: m.scheduled_date || m.completed_date,
          title: m.title,
          description: `${m.maintenance_type} · ${m.status}`,
          category: m.category,
          value: m.cost,
          metadata: m,
        });
      });

      // Equipment installations
      equipment.forEach(e => {
        allEvents.push({
          type: 'equipment',
          date: e.installation_date,
          title: `Installato: ${e.name}`,
          description: `${e.manufacturer} ${e.model}`,
          category: e.category,
          value: e.replacement_cost_estimate,
          metadata: e,
        });
      });

      // Risks
      risks.forEach(r => {
        allEvents.push({
          type: 'risk',
          date: r.detected_date,
          title: r.title,
          description: `${r.risk_type} · ${r.severity}`,
          category: r.risk_type,
          metadata: r,
        });
      });

      // Insights
      insights.forEach(i => {
        allEvents.push({
          type: 'insight',
          date: i.generated_date,
          title: i.title,
          description: i.insight_type,
          category: i.insight_type,
          value: i.estimated_cost_savings,
          metadata: i,
        });
      });

      // Sort by date
      allEvents.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Filter
      const filtered = filter === 'all' ? allEvents : allEvents.filter(e => e.type === filter);
      
      setEvents(filtered);
    } catch (error) {
      console.error('Error loading timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-gray-500">Caricamento timeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-500" />
          Lifecycle Timeline
        </h3>
        <div className="flex gap-2">
          {['all', 'project', 'maintenance', 'ticket', 'equipment', 'risk', 'insight'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-2 py-1 rounded-lg capitalize ${
                filter === f 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100" />
        
        <div className="space-y-4 pl-10">
          {events.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">
              Nessun evento nella timeline
            </div>
          ) : (
            events.map((event, idx) => {
              const Icon = EVENT_ICONS[event.type] || Activity;
              const color = EVENT_COLORS[event.type] || '#6B7280';
              const CategoryIcon = CATEGORY_ICONS[event.category];
              const date = new Date(event.date).toLocaleDateString('it-IT', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
              });

              return (
                <div key={idx} className="relative">
                  {/* Dot */}
                  <div 
                    className="absolute -left-[26px] top-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center"
                    style={{ backgroundColor: color }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 hover:border-gray-300 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="w-3.5 h-3.5" style={{ color }} />
                          <span className="text-xs font-semibold text-gray-900">{event.title}</span>
                        </div>
                        <p className="text-xs text-gray-500">{event.description}</p>
                        {event.value && (
                          <p className="text-xs text-gray-600 mt-1 font-medium">
                            €{typeof event.value === 'number' ? event.value.toLocaleString() : event.value}
                          </p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-1.5">{date}</p>
                      </div>
                      {CategoryIcon && (
                        <CategoryIcon className="w-3.5 h-3.5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Summary */}
      {events.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{events.length} eventi</span>
            <span>
              {events[0].date ? new Date(events[0].date).toLocaleDateString('it-IT') : ''} → {events[events.length - 1].date ? new Date(events[events.length - 1].date).toLocaleDateString('it-IT') : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}