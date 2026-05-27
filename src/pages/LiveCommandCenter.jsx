import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, CheckCircle, TrendingUp, AlertCircle, Activity, Users, FileText, Calendar, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';

export default function LiveCommandCenter() {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [ops, setOps] = useState({
    delayedProjects: [],
    urgentTickets: [],
    overdueTasks: [],
    marginWarnings: [],
    aiAlerts: [],
    technicianOverload: [],
    workflowFailures: [],
    unresolvedIssues: [],
    todayOperations: [],
  });

  useEffect(() => {
    const loadOperations = async () => {
      try {
        const [projects, tickets, tasks, estimates, insights] = await Promise.all([
          base44.entities.Project.list(),
          base44.entities.SupportTicket.list(),
          base44.entities.Task.list(),
          base44.entities.Estimate.list(),
          base44.entities.IntelligenceInsight.list().catch(() => []),
        ]);

        const now = new Date();
        
        // Delayed projects
        const delayed = projects.filter(p => {
          if (!p.expected_end_date) return false;
          return new Date(p.expected_end_date) < now && p.status !== 'Delivered';
        }).map(p => ({
          ...p,
          delayDays: Math.floor((now - new Date(p.expected_end_date)) / (1000 * 60 * 60 * 24)),
        }));

        // Urgent tickets
        const urgent = tickets.filter(t => 
          (t.priority === 'High' || t.priority === 'Critical') && t.status !== 'Resolved'
        ).slice(0, 10);

        // Overdue tasks
        const overdue = tasks.filter(t => {
          if (!t.due_date) return false;
          return new Date(t.due_date) < now && t.status !== 'done';
        }).slice(0, 10);

        // Margin warnings
        const lowMargin = estimates.filter(e => 
          e.status === 'Accepted' && e.gross_margin_pct && e.gross_margin_pct < 20
        ).slice(0, 5);

        // Today operations
        const today = projects.filter(p => {
          if (!p.start_date) return false;
          const start = new Date(p.start_date);
          return start.toDateString() === now.toDateString();
        });

        setOps({
          delayedProjects: delayed,
          urgentTickets: urgent,
          overdueTasks: overdue,
          marginWarnings: lowMargin,
          aiAlerts: insights.filter(i => i.severity === 'Critical' || i.severity === 'High').slice(0, 5),
          technicianOverload: [],
          workflowFailures: [],
          unresolvedIssues: tickets.filter(t => t.status !== 'Resolved' && t.status !== 'Closed').slice(0, 10),
          todayOperations: today,
        });
      } catch (error) {
        console.error('Error loading operations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOperations();
  }, []);

  if (loading) return <div className="p-6 text-center text-gray-400">Caricamento...</div>;

  const totalIssues = ops.delayedProjects.length + ops.urgentTickets.length + ops.overdueTasks.length + ops.marginWarnings.length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" />
            {currentWorkspace === 'technician' ? 'Field Operations' :
             currentWorkspace === 'sales' ? 'Sales Command' :
             currentWorkspace === 'financial' ? 'Financial Operations' :
             currentWorkspace === 'guardian' ? 'Guardian Intelligence' :
             currentWorkspace === 'super_admin' ? 'Platform Command' :
             'Live Command Center'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {currentWorkspace === 'technician' ? 'Your assigned tasks and projects' :
             currentWorkspace === 'sales' ? 'Pipeline and estimates overview' :
             currentWorkspace === 'financial' ? 'Profitability and cashflow' :
             currentWorkspace === 'guardian' ? 'Predictive maintenance intelligence' :
             currentWorkspace === 'super_admin' ? 'Enterprise system controls' :
             'Panoramica operativa in tempo reale'}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span className="text-sm font-semibold text-red-700">{totalIssues} issue attivi</span>
        </div>
      </div>

      {/* Critical Alerts */}
      {totalIssues > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ops.delayedProjects.length > 0 && (
            <AlertCard 
              title="Progetti in Ritardo" 
              count={ops.delayedProjects.length}
              icon={Clock}
              color="#F59E0B"
              onClick={() => navigate('/projects')}
            />
          )}
          {ops.urgentTickets.length > 0 && (
            <AlertCard 
              title="Ticket Urgenti" 
              count={ops.urgentTickets.length}
              icon={AlertTriangle}
              color="#EF4444"
              onClick={() => navigate('/tickets')}
            />
          )}
          {ops.overdueTasks.length > 0 && (
            <AlertCard 
              title="Task Scaduti" 
              count={ops.overdueTasks.length}
              icon={CheckCircle}
              color="#F97316"
              onClick={() => navigate('/tasks')}
            />
          )}
          {ops.marginWarnings.length > 0 && (
            <AlertCard 
              title="Margini Bassi" 
              count={ops.marginWarnings.length}
              icon={TrendingUp}
              color="#DC2626"
              onClick={() => navigate('/financial-control')}
            />
          )}
        </div>
      )}

      {/* Operational Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delayed Projects */}
        {ops.delayedProjects.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Progetti in Ritardo
            </h2>
            <div className="space-y-3">
              {ops.delayedProjects.slice(0, 5).map(project => (
                <div 
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100 cursor-pointer hover:bg-amber-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{project.title}</p>
                    <p className="text-xs text-amber-700 mt-0.5">{project.delayDays} giorni di ritardo</p>
                  </div>
                  <span className="text-xs font-semibold text-amber-700">Vedi →</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Urgent Tickets */}
        {ops.urgentTickets.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Ticket Urgenti
            </h2>
            <div className="space-y-3">
              {ops.urgentTickets.slice(0, 5).map(ticket => (
                <div 
                  key={ticket.id}
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100 cursor-pointer hover:bg-red-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{ticket.subject}</p>
                    <p className="text-xs text-red-700 mt-0.5">{ticket.priority} · {ticket.status}</p>
                  </div>
                  <span className="text-xs font-semibold text-red-700">Vedi →</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Today Operations */}
      {ops.todayOperations.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            Operazioni di Oggi
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ops.todayOperations.map(project => (
              <div 
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="p-3 bg-blue-50 rounded-lg border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors"
              >
                <p className="text-sm font-medium text-gray-900">{project.title}</p>
                <p className="text-xs text-blue-700 mt-0.5">{project.status}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Alerts */}
      {ops.aiAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-600" />
            AI Alerts
          </h2>
          <div className="space-y-2">
            {ops.aiAlerts.map((alert, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-purple-100">
                <AlertCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{alert.description}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  alert.severity === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {alert.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AlertCard({ title, count, icon: Icon, color, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all"
    >
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-5 h-5" style={{ color }} />
        <span className="text-xs text-gray-500 font-medium">{title}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900">{count}</p>
    </button>
  );
}