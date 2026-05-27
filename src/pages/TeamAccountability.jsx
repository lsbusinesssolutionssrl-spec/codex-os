import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, CheckCircle, Clock, TrendingUp, TrendingDown,
  BarChart2, Activity, Award, AlertTriangle, Zap, Target
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function TeamAccountability() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [teamMetrics, setTeamMetrics] = useState([]);
  const [overallStats, setOverallStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    avgTicketResolution: 0,
    checklistCompletionRate: 0,
    projectUpdateFrequency: 0,
  });

  useEffect(() => {
    loadTeamMetrics();
  }, []);

  const loadTeamMetrics = async () => {
    try {
      const [users, tasks, tickets, checklists, projects, documents] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.Task.list(),
        base44.entities.SupportTicket.list(),
        base44.entities.ChecklistItem.list(),
        base44.entities.Project.list(),
        base44.entities.Document.list(),
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Calculate per-user metrics
      const userMetrics = users.map(user => {
        const userTasks = tasks.filter(t => t.assigned_to === user.email);
        const userProjects = projects.filter(p => p.project_manager === user.email);
        const userTickets = tickets.filter(t => t.assigned_to === user.email);
        const userChecklists = checklists.filter(c => c.assigned_to === user.email);

        const completedTasks = userTasks.filter(t => t.status === 'Completed').length;
        const overdueTasks = userTasks.filter(t => {
          if (!t.due_date || t.status === 'Completed') return false;
          return new Date(t.due_date) < today;
        }).length;

        const resolvedTickets = userTickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;
        const avgResolutionTime = resolvedTickets > 0 
          ? Math.round(resolvedTickets / userTickets.length * 100) 
          : 0;

        const completedChecklists = userChecklists.filter(c => c.status === 'Completed').length;
        const checklistRate = userChecklists.length > 0 
          ? Math.round((completedChecklists / userChecklists.length) * 100) 
          : 0;

        const recentDocs = documents.filter(d => {
          if (!d.created_date) return false;
          const docDate = new Date(d.created_date);
          const daysDiff = (today - docDate) / (1000 * 60 * 60 * 24);
          return daysDiff <= 7 && d.created_by === user.email;
        }).length;

        // Calculate accountability score
        let score = 50;
        score += Math.min(20, completedTasks * 2);
        score -= Math.min(20, overdueTasks * 5);
        score += Math.min(15, checklistRate / 10);
        score += Math.min(15, recentDocs);

        score = Math.max(0, Math.min(100, score));

        return {
          user,
          metrics: {
            totalTasks: userTasks.length,
            completedTasks,
            overdueTasks,
            activeProjects: userProjects.length,
            resolvedTickets,
            avgResolutionTime,
            checklistRate,
            recentDocs,
            accountabilityScore: score,
          },
        };
      });

      setTeamMetrics(userMetrics);

      // Overall stats
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'Completed').length;
      const overdueTasks = tasks.filter(t => {
        if (!t.due_date || t.status === 'Completed') return false;
        return new Date(t.due_date) < today;
      }).length;

      const resolvedTickets = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed');
      const avgTicketResolution = resolvedTickets.length > 0 
        ? Math.round(resolvedTickets.length / tickets.length * 100) 
        : 0;

      const completedChecklists = checklists.filter(c => c.status === 'Completed');
      const checklistRate = checklists.length > 0 
        ? Math.round((completedChecklists.length / checklists.length) * 100) 
        : 0;

      setOverallStats({
        totalTasks,
        completedTasks,
        overdueTasks,
        avgTicketResolution,
        checklistCompletionRate: checklistRate,
        projectUpdateFrequency: Math.round(projects.filter(p => p.updated_date).length / projects.length * 100) || 0,
      });

    } catch (error) {
      console.error('Error loading team metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-400">Caricamento...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Team Accountability
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Metriche di responsabilità operativa del team</p>
        </div>
        <button 
          onClick={loadTeamMetrics}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <Zap className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <StatCard label="Task Totali" value={overallStats.totalTasks} icon={Target} color="#1147FF" />
        <StatCard label="Task Completati" value={overallStats.completedTasks} icon={CheckCircle} color="#10B981" />
        <StatCard label="Task Scaduti" value={overallStats.overdueTasks} icon={Clock} color="#EF4444" />
        <StatCard label="Ticket Risolti" value={`${overallStats.avgTicketResolution}%`} icon={Activity} color="#8B5CF6" />
        <StatCard label="Checklist Rate" value={`${overallStats.checklistCompletionRate}%`} icon={Award} color="#F59E0B" />
        <StatCard label="Update Progetti" value={`${overallStats.projectUpdateFrequency}%`} icon={TrendingUp} color="#3B82F6" />
      </div>

      {/* Team Members */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-blue-500" />
          Performance Team
        </h2>
        <div className="space-y-3">
          {teamMetrics.map(({ user, metrics }) => (
            <div 
              key={user.id}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-gray-900">{user.full_name || user.email}</p>
                  <AccountabilityBadge score={metrics.accountabilityScore} />
                </div>
                <div className="grid grid-cols-5 gap-3 text-xs text-gray-500">
                  <span>Task: {metrics.completedTasks}/{metrics.totalTasks}</span>
                  <span>Scaduti: {metrics.overdueTasks}</span>
                  <span>Progetti: {metrics.activeProjects}</span>
                  <span>Checklist: {metrics.checklistRate}%</span>
                  <span>Doc: {metrics.recentDocs}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-1">Accountability</p>
                <p className={`text-lg font-bold ${
                  metrics.accountabilityScore >= 80 ? 'text-green-600' :
                  metrics.accountabilityScore >= 60 ? 'text-amber-600' :
                  'text-red-600'
                }`}>{metrics.accountabilityScore}/100</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
        <span className="text-[10px] text-gray-500 font-medium leading-tight">{label}</span>
      </div>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}

function AccountabilityBadge({ score }) {
  const color = score >= 80 ? 'bg-green-100 text-green-700' :
                score >= 60 ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700';
  
  const label = score >= 80 ? 'Eccellente' :
                score >= 60 ? 'Buono' :
                'Migliorare';

  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${color}`}>
      {label}
    </span>
  );
}