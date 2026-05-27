import { useState, useEffect } from 'react';
import { Users, Activity, Clock, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function WorkloadIntelligence() {
  const [workloadData, setWorkloadData] = useState({
    technicians: [],
    projectManagers: [],
    imbalances: [],
    suggestions: [],
  });

  useEffect(() => {
    analyzeWorkload();
  }, []);

  const analyzeWorkload = async () => {
    try {
      const [projects, tickets, timesheets, users] = await Promise.all([
        base44.entities.Project.list(),
        base44.entities.SupportTicket.list(),
        base44.entities.Timesheet.list(),
        base44.entities.User.list(),
      ]);

      // Analyze technician workload
      const techWorkload = {};
      projects.forEach(p => {
        if (p.project_manager) {
          techWorkload[p.project_manager] = (techWorkload[p.project_manager] || 0) + 1;
        }
      });

      const technicians = Object.entries(techWorkload).map(([name, count]) => ({
        name,
        activeProjects: count,
        workload: count > 5 ? 'high' : count > 3 ? 'medium' : 'low',
        responseTime: 'N/A', // Would calculate from timesheets
      }));

      // Detect imbalances
      const avgWorkload = technicians.reduce((sum, t) => sum + t.activeProjects, 0) / technicians.length || 0;
      const imbalances = technicians.filter(t => 
        t.activeProjects > avgWorkload * 1.5 || t.activeProjects < avgWorkload * 0.5
      );

      // Generate suggestions
      const suggestions = [];
      if (imbalances.length > 0) {
        suggestions.push('Reassign projects to balance workload');
        suggestions.push('Consider hiring additional technician');
      }
      if (technicians.some(t => t.activeProjects > 7)) {
        suggestions.push('Critical overload detected - immediate action required');
      }

      setWorkloadData({
        technicians,
        projectManagers: [],
        imbalances,
        suggestions,
      });
    } catch (error) {
      console.error('Workload analysis error:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-blue-600" />
        <h2 className="text-sm font-semibold text-gray-900">Workload Intelligence</h2>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <StatCard 
          label="Team Members" 
          value={workloadData.technicians.length}
          icon={Users}
          color="#1147FF"
        />
        <StatCard 
          label="Overloaded" 
          value={workloadData.technicians.filter(t => t.workload === 'high').length}
          icon={AlertTriangle}
          color="#EF4444"
        />
        <StatCard 
          label="Imbalances" 
          value={workloadData.imbalances.length}
          icon={TrendingDown}
          color="#F97316"
        />
      </div>

      {/* Technician Workload */}
      {workloadData.technicians.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-700 mb-2">Team Workload Distribution</h3>
          {workloadData.technicians.map((tech, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  tech.workload === 'high' ? 'bg-red-500' :
                  tech.workload === 'medium' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`} />
                <span className="text-sm font-medium text-gray-900">{tech.name}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <span>{tech.activeProjects} projects</span>
                <span className={`px-2 py-1 rounded-full ${
                  tech.workload === 'high' ? 'bg-red-100 text-red-700' :
                  tech.workload === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {tech.workload}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Suggestions */}
      {workloadData.suggestions.length > 0 && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-gray-900">Optimization Suggestions</span>
          </div>
          <ul className="space-y-1">
            {workloadData.suggestions.map((suggestion, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                <span className="text-blue-600 font-bold">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <Icon className="w-4 h-4 mx-auto mb-1" style={{ color }} />
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="text-[10px] text-gray-500">{label}</p>
    </div>
  );
}