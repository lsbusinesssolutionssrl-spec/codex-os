import { useState, useEffect } from 'react';
import { Brain, Activity, AlertTriangle, CheckCircle, Clock, Users, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AIOperationalCoordinator() {
  const [coordination, setCoordination] = useState({
    monitoring: [],
    suggestions: [],
    recoveries: [],
    escalations: [],
  });

  useEffect(() => {
    monitorOperations();
  }, []);

  const monitorOperations = async () => {
    try {
      const [projects, tickets, tasks, maintenance, users] = await Promise.all([
        base44.entities.Project.list(),
        base44.entities.SupportTicket.list(),
        base44.entities.Task.list(),
        base44.entities.PropertyMaintenance.list(),
        base44.entities.User.list(),
      ]);

      const monitoring = [];
      const suggestions = [];
      const recoveries = [];
      const escalations = [];

      // Monitor project progress
      const delayedProjects = projects.filter(p => p.is_delayed || p.status === 'delayed');
      delayedProjects.forEach(p => {
        monitoring.push({
          type: 'project_delay',
          entity: p.title,
          status: 'at_risk',
          metric: 'Timeline'
        });
        recoveries.push({
          type: 'project_recovery',
          project_id: p.id,
          title: p.title,
          actions: ['Reallocate resources', 'Adjust timeline', 'Fast-track critical path']
        });
      });

      // Monitor task completion
      const overdueTasks = tasks.filter(t => 
        t.due_date && 
        new Date(t.due_date) < new Date() && 
        t.status !== 'completed'
      );
      if (overdueTasks.length > 5) {
        suggestions.push({
          type: 'task_bottleneck',
          description: `${overdueTasks.length} tasks overdue. Workflow bottleneck detected.`,
          action: 'Review task assignments and priorities'
        });
      }

      // Monitor unresolved issues
      const criticalTickets = tickets.filter(t => 
        t.priority === 'Critical' && 
        t.status !== 'Resolved'
      );
      criticalTickets.forEach(t => {
        escalations.push({
          ticket_id: t.id,
          title: t.issue_type,
          age: Math.round((new Date() - new Date(t.created_date)) / (1000 * 60 * 60 * 24)),
          recommendation: 'Escalate to senior technician immediately'
        });
      });

      // Monitor technician responsiveness
      const techResponse = {};
      tickets.forEach(t => {
        if (t.assigned_to) {
          const responseTime = (new Date(t.updated_date) - new Date(t.created_date)) / (1000 * 60 * 60);
          techResponse[t.assigned_to] = techResponse[t.assigned_to] || { count: 0, avgTime: 0 };
          techResponse[t.assigned_to].count++;
          techResponse[t.assigned_to].avgTime += responseTime;
        }
      });

      Object.entries(techResponse).forEach(([techId, data]) => {
        const avgResponse = data.avgTime / data.count;
        if (avgResponse > 24) {
          suggestions.push({
            type: 'slow_response',
            technician: techId,
            description: `Technician avg response time: ${Math.round(avgResponse)} hours`,
            action: 'Review workload or provide support'
          });
        }
      });

      // Monitor operational risks
      const highRiskMaintenance = maintenance.filter(m => 
        m.priority === 'Critical' && 
        m.status === 'Scheduled'
      );
      if (highRiskMaintenance.length > 0) {
        suggestions.push({
          type: 'maintenance_risk',
          description: `${highRiskMaintenance.length} critical maintenance tasks pending`,
          action: 'Prioritize scheduling'
        });
      }

      setCoordination({ monitoring, suggestions, recoveries, escalations });
    } catch (error) {
      console.error('Coordination error:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-4 h-4 text-purple-600" />
        <h2 className="text-sm font-semibold text-gray-900">AI Operational Coordinator</h2>
      </div>

      {/* Monitoring Status */}
      {coordination.monitoring.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Activity className="w-3 h-3 text-blue-600" />
            Active Monitoring ({coordination.monitoring.length})
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {coordination.monitoring.slice(0, 4).map((item, idx) => (
              <div key={idx} className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs font-semibold text-gray-900">{item.entity}</p>
                <p className="text-xs text-gray-600">{item.metric}: <span className="text-orange-600">{item.status}</span></p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {coordination.suggestions.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Zap className="w-3 h-3 text-yellow-600" />
            Coordination Suggestions
          </h3>
          <div className="space-y-2">
            {coordination.suggestions.map((suggestion, idx) => (
              <div key={idx} className="p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-xs text-gray-700">{suggestion.description}</p>
                <p className="text-xs text-gray-600 mt-1"><strong>Action:</strong> {suggestion.action}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Escalations */}
      {coordination.escalations.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-3 h-3 text-red-600" />
            Escalations Needed
          </h3>
          <div className="space-y-2">
            {coordination.escalations.map((esc, idx) => (
              <div key={idx} className="p-2 bg-red-50 rounded-lg border border-red-200">
                <p className="text-xs font-semibold text-gray-900">{esc.title}</p>
                <p className="text-xs text-gray-600">Age: {esc.age} days · {esc.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recovery Plans */}
      {coordination.recoveries.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Clock className="w-3 h-3 text-orange-600" />
            Recovery Plans
          </h3>
          <div className="space-y-2">
            {coordination.recoveries.map((recovery, idx) => (
              <div key={idx} className="p-2 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-xs font-semibold text-gray-900">{recovery.title}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {recovery.actions.map((action, i) => (
                    <span key={i} className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-gray-200">
                      {action}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {coordination.monitoring.length === 0 && 
       coordination.suggestions.length === 0 && 
       coordination.escalations.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
          <p className="text-sm">Operations running smoothly.</p>
        </div>
      )}
    </div>
  );
}