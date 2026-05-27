import { useState, useEffect } from 'react';
import { Clock, TrendingUp, AlertTriangle, CheckCircle2, FileText, Wrench, Users, DollarSign } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';

export default function OperationalTimeline({ entityType, entityId }) {
  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState(null);

  useEffect(() => {
    if (entityType && entityId) generateTimeline();
  }, [entityType, entityId]);

  const generateTimeline = async () => {
    setLoading(true);
    try {
      let context = {};

      if (entityType === 'project') {
        const [project, costs, tickets, checklists, interventions] = await Promise.all([
          base44.entities.Project.get(entityId),
          base44.entities.ProjectCost.filter({ project_id: entityId }),
          base44.entities.SupportTicket.filter({ project_id: entityId }),
          base44.entities.ChecklistItem.filter({ project_id: entityId }),
          [], // Could fetch from property
        ]);

        context = {
          entity: project,
          costs,
          tickets,
          checklists,
          type: 'project',
        };
      } else if (entityType === 'property') {
        const [property, tickets, projects, interventions] = await Promise.all([
          base44.entities.Property.get(entityId),
          base44.entities.SupportTicket.filter({ property_id: entityId }),
          base44.entities.Project.filter({ property_id: entityId }),
          property.interventions || [],
        ]);

        context = {
          entity: property,
          tickets,
          projects,
          interventions,
          type: 'property',
        };
      } else if (entityType === 'client') {
        const [client, projects, tickets, properties] = await Promise.all([
          base44.entities.Client.get(entityId),
          base44.entities.Project.filter({ client_id: entityId }),
          base44.entities.SupportTicket.filter({ client_id: entityId }),
          base44.entities.Property.filter({ client_id: entityId }),
        ]);

        context = {
          entity: client,
          projects,
          tickets,
          properties,
          type: 'client',
        };
      }

      // Generate narrative using LLM
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analizza questo contesto operativo e genera una timeline narrativa professionale in italiano.

CONTESTO:
${JSON.stringify(context, null, 2)}

Istruzioni:
1. Identifica gli eventi chiave in ordine cronologico
2. Evidenzia relazioni causa-effetto (es: "ritardo dovuto a fornitore")
3. Nota cambiamenti significativi (costi, scadenze, stato)
4. Usa un tono professionale ma chiaro
5. Struttura in paragrafi brevi con timestamp

Formato richiesto:
- Breve introduzione (2 righe)
- Timeline eventi (3-5 punti chiave con date)
- Insight operativi (2-3 osservazioni)
- Prossimi step raccomandati

Output in Markdown.`,
        response_json_schema: {
          type: 'object',
          properties: {
            introduction: { type: 'string' },
            timeline_events: { type: 'array', items: { type: 'object', properties: { date: { type: 'string' }, event: { type: 'string' }, impact: { type: 'string' } } } },
            operational_insights: { type: 'array', items: { type: 'string' } },
            recommended_next_steps: { type: 'array', items: { type: 'string' } },
          },
          required: ['introduction', 'timeline_events', 'operational_insights', 'recommended_next_steps'],
        },
      });

      setTimeline(response);
    } catch (error) {
      console.error('Failed to generate timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-gray-500">Generazione timeline operativa...</p>
        </div>
      </div>
    );
  }

  if (!timeline) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-blue-500" />
        <p className="text-sm font-semibold text-gray-900">Timeline Operativa</p>
      </div>

      {/* Introduction */}
      <div className="text-xs text-gray-600 leading-relaxed bg-blue-50 rounded-lg p-3 border border-blue-100">
        <ReactMarkdown>{timeline.introduction}</ReactMarkdown>
      </div>

      {/* Timeline Events */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
          <TrendingUp className="w-3 h-3" /> Eventi Chiave
        </p>
        <div className="space-y-2">
          {timeline.timeline_events.map((event, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs">
              <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <p className="text-gray-900 font-medium">{event.event}</p>
                {event.date && <p className="text-gray-400 text-[10px] mt-0.5">{event.date}</p>}
                {event.impact && <p className="text-gray-500 text-[10px] mt-1">{event.impact}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Operational Insights */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3 text-amber-500" /> Insight Operativi
        </p>
        {timeline.operational_insights.map((insight, idx) => (
          <div key={idx} className="flex items-start gap-2 text-xs bg-amber-50 rounded-lg p-2.5 border border-amber-100">
            <CheckCircle2 className="w-3 h-3 text-amber-600 flex-shrink-0 mt-0.5" />
            <span className="text-amber-900">{insight}</span>
          </div>
        ))}
      </div>

      {/* Next Steps */}
      <div className="space-y-2 pt-3 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
          <Wrench className="w-3 h-3 text-emerald-500" /> Prossimi Step
        </p>
        {timeline.recommended_next_steps.map((step, idx) => (
          <div key={idx} className="flex items-start gap-2 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 mt-1" />
            <span className="text-gray-700">{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}