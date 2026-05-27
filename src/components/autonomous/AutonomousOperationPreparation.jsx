import { useState, useEffect } from 'react';
import { Brain, CheckCircle, Clock, AlertTriangle, Users, Calendar, Zap, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AutonomousOperationPreparation() {
  const [preparations, setPreparations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    prepareOperations();
  }, []);

  const prepareOperations = async () => {
    setLoading(true);
    try {
      const [projects, tickets, maintenance, timesheets] = await Promise.all([
        base44.entities.Project.list(),
        base44.entities.SupportTicket.list(),
        base44.entities.PropertyMaintenance.list(),
        base44.entities.Timesheet.list(),
      ]);

      const prep = [];

      // Task assignments
      const unassignedTasks = tickets.filter(t => !t.assigned_to && t.status !== 'Resolved');
      if (unassignedTasks.length > 0) {
        prep.push({
          type: 'task_assignments',
          title: 'Task Assignments Ready',
          count: unassignedTasks.length,
          items: unassignedTasks.map(t => ({ id: t.id, title: t.issue_type, property: t.property_id })),
          status: 'pending_approval',
          confidence: 85
        });
      }

      // Workflow sequences
      const activeProjects = projects.filter(p => p.status === 'In Progress');
      if (activeProjects.length > 0) {
        prep.push({
          type: 'workflow_sequence',
          title: 'Project Sequence Optimized',
          count: activeProjects.length,
          items: activeProjects.map(p => ({ id: p.id, title: p.title, priority: p.priority })),
          status: 'ready',
          confidence: 78
        });
      }

      // Maintenance schedules
      const upcomingMaintenance = maintenance.filter(m => 
        m.status === 'Scheduled' && 
        new Date(m.scheduled_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      );
      if (upcomingMaintenance.length > 0) {
        prep.push({
          type: 'maintenance_schedule',
          title: 'Weekly Maintenance Schedule',
          count: upcomingMaintenance.length,
          items: upcomingMaintenance.map(m => ({ id: m.id, type: m.maintenance_type, date: m.scheduled_date })),
          status: 'pending_approval',
          confidence: 92
        });
      }

      // Escalation plans
      const criticalTickets = tickets.filter(t => t.priority === 'Critical' && t.status !== 'Resolved');
      if (criticalTickets.length > 0) {
        prep.push({
          type: 'escalation_plan',
          title: 'Critical Escalations Needed',
          count: criticalTickets.length,
          items: criticalTickets.map(t => ({ id: t.id, title: t.issue_type, age: t.age })),
          status: 'urgent',
          confidence: 95
        });
      }

      setPreparations(prep);
    } catch (error) {
      console.error('Preparation error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-400">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm">Preparing operations...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-4 h-4 text-blue-600" />
        <h2 className="text-sm font-semibold text-gray-900">Autonomous Operation Preparation</h2>
      </div>

      {preparations.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
          <p className="text-sm">All operations prepared. No pending actions.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {preparations.map((prep, idx) => (
            <PreparationCard key={idx} preparation={prep} />
          ))}
        </div>
      )}
    </div>
  );
}

function PreparationCard({ preparation }) {
  const typeConfig = {
    task_assignments: { icon: Users, color: '#1147FF', label: 'Task Assignments' },
    workflow_sequence: { icon: Zap, color: '#8B5CF6', label: 'Workflow Sequence' },
    maintenance_schedule: { icon: Calendar, color: '#10B981', label: 'Maintenance Schedule' },
    escalation_plan: { icon: AlertTriangle, color: '#EF4444', label: 'Escalation Plan' },
    project_recovery: { icon: Clock, color: '#F59E0B', label: 'Recovery Plan' },
    operational_summary: { icon: CheckCircle, color: '#06B6D4', label: 'Operational Summary' },
  };

  const config = typeConfig[preparation.type] || typeConfig.task_assignments;
  const Icon = config.icon;

  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0`} style={{ backgroundColor: `${config.color}15` }}>
          <Icon className="w-4 h-4" style={{ color: config.color }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-gray-900">{config.label}</span>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
              preparation.status === 'urgent' ? 'bg-red-100 text-red-700' :
              preparation.status === 'pending_approval' ? 'bg-orange-100 text-orange-700' :
              'bg-green-100 text-green-700'
            }`}>
              {preparation.status === 'pending_approval' ? 'Requires Approval' : preparation.status}
            </span>
          </div>
          <p className="text-xs text-gray-700 mb-2">{preparation.title} ({preparation.count} items)</p>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Confidence: {preparation.confidence}%</p>
            <button className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
              Review <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}