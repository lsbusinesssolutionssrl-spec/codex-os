import { useState, useEffect } from 'react';
import { Network, Zap, Clock, Users, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AIOrchestrationEngine() {
  const [orchestration, setOrchestration] = useState({
    recommendations: [],
    coordination: [],
    optimizations: [],
  });

  useEffect(() => {
    orchestrateOperations();
  }, []);

  const orchestrateOperations = async () => {
    try {
      const [projects, tickets, timesheets, maintenance] = await Promise.all([
        base44.entities.Project.list(),
        base44.entities.SupportTicket.list(),
        base44.entities.Timesheet.list(),
        base44.entities.PropertyMaintenance.list(),
      ]);

      const recommendations = [];
      const coordination = [];
      const optimizations = [];

      // Sequencing recommendations
      const activeProjects = projects.filter(p => p.status === 'In Progress');
      if (activeProjects.length > 2) {
        recommendations.push({
          type: 'sequencing',
          title: 'Project Sequencing Optimization',
          description: `${activeProjects.length} active projects detected. Recommend prioritization based on deadlines and margins.`,
          priority: 'high',
          confidence: 82
        });
      }

      // Priority reallocation
      const criticalTickets = tickets.filter(t => t.priority === 'Critical');
      const assignedTechs = timesheets.filter(t => t.status === 'approved');
      if (criticalTickets.length > 0 && assignedTechs.length > 0) {
        recommendations.push({
          type: 'priority_reallocation',
          title: 'Critical Ticket Reallocation',
          description: `${criticalTickets.length} critical tickets need immediate technician assignment.`,
          priority: 'urgent',
          confidence: 90
        });
      }

      // Escalation timing
      const overdueTickets = tickets.filter(t => 
        t.status !== 'Resolved' && 
        new Date(t.created_date) <= new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      );
      if (overdueTickets.length > 0) {
        recommendations.push({
          type: 'escalation_timing',
          title: 'Escalation Recommended',
          description: `${overdueTickets.length} tickets overdue for resolution. Escalate to senior technicians.`,
          priority: 'high',
          confidence: 88
        });
      }

      // Coordination needs
      const projectsWithTickets = projects.filter(p => 
        tickets.some(t => t.project_id === p.id && t.status !== 'Resolved')
      );
      if (projectsWithTickets.length > 0) {
        coordination.push({
          type: 'project_ticket_sync',
          count: projectsWithTickets.length,
          description: 'Projects with open tickets require coordination'
        });
      }

      // Optimization opportunities
      const maintenanceByProperty = {};
      maintenance.forEach(m => {
        maintenanceByProperty[m.property_id] = (maintenanceByProperty[m.property_id] || 0) + 1;
      });
      Object.entries(maintenanceByProperty).forEach(([propertyId, count]) => {
        if (count >= 3) {
          optimizations.push({
            type: 'maintenance_routing',
            property_id: propertyId,
            description: `Property has ${count} maintenance tasks. Consider bundling.`,
            impact: 'medium'
          });
        }
      });

      setOrchestration({ recommendations, coordination, optimizations });
    } catch (error) {
      console.error('Orchestration error:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Network className="w-4 h-4 text-purple-600" />
        <h2 className="text-sm font-semibold text-gray-900">AI Orchestration Engine</h2>
      </div>

      {/* Recommendations */}
      {orchestration.recommendations.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Zap className="w-3 h-3 text-purple-600" />
            Orchestration Recommendations
          </h3>
          <div className="space-y-2">
            {orchestration.recommendations.map((rec, idx) => (
              <RecommendationCard key={idx} recommendation={rec} />
            ))}
          </div>
        </div>
      )}

      {/* Coordination */}
      {orchestration.coordination.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Users className="w-3 h-3 text-blue-600" />
            Coordination Needed
          </h3>
          <div className="space-y-2">
            {orchestration.coordination.map((coord, idx) => (
              <div key={idx} className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-gray-700">{coord.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optimizations */}
      {orchestration.optimizations.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <TrendingUp className="w-3 h-3 text-green-600" />
            Optimization Opportunities
          </h3>
          <div className="space-y-2">
            {orchestration.optimizations.map((opt, idx) => (
              <div key={idx} className="p-2 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-gray-700">{opt.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {orchestration.recommendations.length === 0 && 
       orchestration.coordination.length === 0 && 
       orchestration.optimizations.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
          <p className="text-sm">Operations optimally orchestrated.</p>
        </div>
      )}
    </div>
  );
}

function RecommendationCard({ recommendation }) {
  const priorityConfig = {
    urgent: { color: '#EF4444', bg: 'bg-red-50', border: 'border-red-200' },
    high: { color: '#F59E0B', bg: 'bg-orange-50', border: 'border-orange-200' },
    medium: { color: '#1147FF', bg: 'bg-blue-50', border: 'border-blue-200' },
    low: { color: '#10B981', bg: 'bg-green-50', border: 'border-green-200' },
  };

  const config = priorityConfig[recommendation.priority] || priorityConfig.medium;

  return (
    <div className={`p-3 rounded-lg border ${config.bg} ${config.border}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-gray-900">{recommendation.title}</span>
        <span className={`text-xs font-bold px-2 py-1 rounded-full capitalize`} style={{ color: config.color, backgroundColor: `${config.color}15` }}>
          {recommendation.priority}
        </span>
      </div>
      <p className="text-xs text-gray-700 mb-2">{recommendation.description}</p>
      <p className="text-xs text-gray-500">Confidence: {recommendation.confidence}%</p>
    </div>
  );
}