import { useState, useEffect } from 'react';
import { Users, Clock, AlertTriangle, CheckCircle2, TrendingUp, Calendar } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function TechnicianLoadAnalysis({ projectId, dateRange }) {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    loadAnalysis();
  }, [projectId, dateRange]);

  const loadAnalysis = async () => {
    setLoading(true);
    try {
      const [technicians, projects, tickets, timesheets] = await Promise.all([
        base44.entities.User.filter({ role: 'technician' }),
        base44.entities.Project.list(),
        base44.entities.SupportTicket.list(),
        base44.entities.Timesheet.list(),
      ]);

      // Calculate workload per technician
      const workload = {};
      
      technicians.forEach(tech => {
        const assignedProjects = projects.filter(p => 
          p.team_members?.includes(tech.email) || p.project_manager === tech.email
        ).filter(p => p.status === 'In Progress' || p.status === 'Active');

        const assignedTickets = tickets.filter(t => 
          t.assigned_technician === tech.email
        ).filter(t => t.status !== 'Resolved' && t.status !== 'Closed');

        // Timesheet hours this week
        const now = new Date();
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const hoursThisWeek = timesheets
          .filter(t => t.employee_id === tech.id || t.employee_id === tech.email)
          .filter(t => {
            const tDate = new Date(t.date);
            return tDate >= weekStart && tDate <= weekEnd;
          })
          .reduce((sum, t) => sum + (t.hours || 0), 0);

        workload[tech.email] = {
          technician: tech,
          activeProjects: assignedProjects.length,
          activeTickets: assignedTickets.length,
          hoursThisWeek: hoursThisWeek,
          overloaded: hoursThisWeek > 40 || assignedProjects.length > 3 || assignedTickets.length > 5,
          available: hoursThisWeek < 30 && assignedProjects.length < 2,
        };
      });

      // Find optimal technician for new assignment
      const availableTechs = Object.values(workload).filter(w => w.available);
      const overloadedTechs = Object.values(workload).filter(w => w.overloaded);

      // Generate recommendations
      const recommendations = [];
      
      if (overloadedTechs.length > 0) {
        overloadedTechs.forEach(tech => {
          recommendations.push({
            type: 'warning',
            message: `${tech.technician.full_name} è sovraccarico (${tech.activeProjects} progetti, ${tech.activeTickets} ticket, ${tech.hoursThisWeek}h questa settimana)`,
            technician: tech.technician.email,
          });
        });
      }

      if (availableTechs.length > 0) {
        const bestMatch = availableTechs.sort((a, b) => a.hoursThisWeek - b.hoursThisWeek)[0];
        recommendations.push({
          type: 'suggestion',
          message: `${bestMatch.technician.full_name} è disponibile (${bestMatch.hoursThisWeek}h questa settimana)`,
          technician: bestMatch.technician.email,
          recommended: true,
        });
      }

      // Calculate team metrics
      const avgHours = Object.values(workload).reduce((sum, w) => sum + w.hoursThisWeek, 0) / Object.keys(workload).length;
      const totalActiveProjects = Object.values(workload).reduce((sum, w) => sum + w.activeProjects, 0);
      const totalActiveTickets = Object.values(workload).reduce((sum, w) => sum + w.activeTickets, 0);

      setAnalysis({
        workload,
        recommendations,
        metrics: {
          totalTechnicians: Object.keys(workload).length,
          avgHours: avgHours.toFixed(1),
          totalActiveProjects,
          totalActiveTickets,
          overloadedCount: overloadedTechs.length,
          availableCount: availableTechs.length,
        },
      });
    } catch (error) {
      console.error('Failed to load technician analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-gray-500">Analisi carico tecnici...</p>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  const { workload, recommendations, metrics } = analysis;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-500" />
          <p className="text-sm font-semibold text-gray-900">Analisi Carico Tecnici</p>
        </div>
        <div className="flex gap-3 text-xs text-gray-500">
          <span>{metrics.totalTechnicians} tecnici</span>
          <span>{metrics.overloadedCount} sovraccarichi</span>
          <span>{metrics.availableCount} disponibili</span>
        </div>
      </div>

      {/* Team Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-[10px] text-blue-600 uppercase mb-1">Ore Medie/Settimana</p>
          <p className="text-xl font-bold text-blue-700">{metrics.avgHours}h</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <p className="text-[10px] text-purple-600 uppercase mb-1">Progetti Attivi</p>
          <p className="text-xl font-bold text-purple-700">{metrics.totalActiveProjects}</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-3 text-center">
          <p className="text-[10px] text-amber-600 uppercase mb-1">Ticket Aperti</p>
          <p className="text-xl font-bold text-amber-700">{metrics.totalActiveTickets}</p>
        </div>
        <div className="bg-emerald-50 rounded-lg p-3 text-center">
          <p className="text-[10px] text-emerald-600 uppercase mb-1">Capacità Disponibile</p>
          <p className="text-xl font-bold text-emerald-700">{metrics.availableCount}</p>
        </div>
      </div>

      {/* Technician Cards */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-700">Stato Team</p>
        <div className="grid gap-2">
          {Object.values(workload).map(({ technician, activeProjects, activeTickets, hoursThisWeek, overloaded, available }) => (
            <div 
              key={technician.email} 
              className={`flex items-center justify-between p-3 rounded-lg border text-xs ${
                overloaded ? 'bg-red-50 border-red-200' : available ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${overloaded ? 'bg-red-500' : available ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                <span className="font-medium text-gray-900">{technician.full_name}</span>
              </div>
              <div className="flex gap-3 text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {activeProjects} progetti
                </span>
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {activeTickets} ticket
                </span>
                <span className="font-semibold">{hoursThisWeek}h</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" /> Raccomandazioni
          </p>
          {recommendations.map((rec, idx) => (
            <div 
              key={idx} 
              className={`flex items-start gap-2 text-xs p-2.5 rounded-lg border ${
                rec.type === 'warning' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              {rec.type === 'warning' ? (
                <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-3 h-3 flex-shrink-0 mt-0.5" />
              )}
              <span>{rec.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}