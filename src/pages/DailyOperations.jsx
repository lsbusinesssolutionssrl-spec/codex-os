import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, CheckCircle2, Clock, TrendingUp, TrendingDown, 
  Users, FileText, Package, AlertCircle, Calendar, BarChart2,
  Zap, Target, AlertOctagon, Activity, Briefcase, Star
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { hasRole } from '@/lib/roleUtils';

export default function DailyOperations() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [metrics, setMetrics] = useState({
    totalProjects: 0,
    delayedProjects: 0,
    overdueTasks: 0,
    unresolvedTickets: 0,
    activeTechnicians: 0,
    todayInspections: 0,
    pendingApprovals: 0,
    lowMarginProjects: 0,
    missingDocuments: 0,
    aiWarnings: 0,
  });
  const [projects, setProjects] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [teamActivity, setTeamActivity] = useState([]);

  useEffect(() => {
    hasRole(['admin', 'company_admin', 'project_manager']).then(auth => {
      if (!auth) {
        navigate('/');
        return;
      }
      setIsAuthorized(true);
    });
  }, []);

  useEffect(() => {
    if (!isAuthorized) return;
    loadOperationalData();
  }, [isAuthorized]);

  const loadOperationalData = async () => {
    try {
      const [allProjects, allTasks, allTickets, allUsers, allEstimates, allDocuments, allInsights] = await Promise.all([
        base44.entities.Project.list(),
        base44.entities.Task.list(),
        base44.entities.SupportTicket.list(),
        base44.entities.User.list(),
        base44.entities.Estimate.list(),
        base44.entities.Document.list(),
        base44.entities.IntelligenceInsight.list(),
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Calculate metrics
      const delayedProjects = allProjects.filter(p => {
        if (!p.expected_end_date) return false;
        const endDate = new Date(p.expected_end_date);
        return endDate < today && p.status !== 'Delivered' && p.status !== 'Archived';
      });

      const overdueTasks = allTasks.filter(t => {
        if (!t.due_date) return false;
        const dueDate = new Date(t.due_date);
        return dueDate < today && t.status !== 'Completed';
      });

      const unresolvedTickets = allTickets.filter(t => t.status !== 'Resolved' && t.status !== 'Closed');

      const activeTechnicians = allUsers.filter(u => 
        u.role === 'technician' || u.role === 'project_manager'
      );

      const todayInspections = allProjects.filter(p => {
        if (!p.start_date) return false;
        const startDate = new Date(p.start_date);
        return startDate.toDateString() === today.toDateString();
      });

      const pendingApprovals = allProjects.filter(p => p.status === 'Approved' || p.status === 'Estimate');

      const lowMarginProjects = allProjects.filter(p => {
        if (!p.contract_value || !p.material_costs) return false;
        const margin = ((p.contract_value - (p.material_costs + p.labor_costs + p.other_costs)) / p.contract_value) * 100;
        return margin < 20; // Below 20% margin target
      });

      const missingDocuments = allProjects.filter(p => !p.documents || p.documents.length === 0);

      const aiWarnings = allInsights.filter(i => i.severity === 'High' || i.severity === 'Critical');

      setMetrics({
        totalProjects: allProjects.length,
        delayedProjects: delayedProjects.length,
        overdueTasks: overdueTasks.length,
        unresolvedTickets: unresolvedTickets.length,
        activeTechnicians: activeTechnicians.length,
        todayInspections: todayInspections.length,
        pendingApprovals: pendingApprovals.length,
        lowMarginProjects: lowMarginProjects.length,
        missingDocuments: missingDocuments.length,
        aiWarnings: aiWarnings.length,
      });

      // Active projects for display
      const activeProjects = allProjects
        .filter(p => p.status === 'In Progress' || p.status === 'Approved')
        .sort((a, b) => {
          const aDate = a.expected_end_date ? new Date(a.expected_end_date) : new Date();
          const bDate = b.expected_end_date ? new Date(b.expected_end_date) : new Date();
          return aDate - bDate;
        })
        .slice(0, 10);

      setProjects(activeProjects);

      // Generate alerts
      const newAlerts = [];
      if (delayedProjects.length > 0) newAlerts.push({ type: 'critical', message: `${delayedProjects.length} progetti in ritardo`, count: delayedProjects.length });
      if (overdueTasks.length > 5) newAlerts.push({ type: 'warning', message: `${overdueTasks.length} task scaduti`, count: overdueTasks.length });
      if (unresolvedTickets.length > 10) newAlerts.push({ type: 'warning', message: `${unresolvedTickets.length} ticket aperti`, count: unresolvedTickets.length });
      if (lowMarginProjects.length > 0) newAlerts.push({ type: 'critical', message: `${lowMarginProjects.length} progetti sotto margine`, count: lowMarginProjects.length });
      if (aiWarnings.length > 0) newAlerts.push({ type: 'info', message: `${aiWarnings.length} warning AI`, count: aiWarnings.length });

      setAlerts(newAlerts);

      // Team activity
      const activity = allUsers.slice(0, 5).map(u => ({
        name: u.full_name,
        role: u.role,
        activeProjects: allProjects.filter(p => p.project_manager === u.email).length,
      }));
      setTeamActivity(activity);

    } catch (error) {
      console.error('Error loading operations data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthorized) return null;
  if (loading) return <div className="p-6 text-center text-gray-400">Caricamento...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" />
            Operations Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Centro di controllo operativo giornaliero</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={loadOperationalData}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <Zap className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Critical Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 p-4 rounded-xl border ${
                alert.type === 'critical' ? 'bg-red-50 border-red-200' :
                alert.type === 'warning' ? 'bg-amber-50 border-amber-200' :
                'bg-blue-50 border-blue-200'
              }`}
            >
              {alert.type === 'critical' ? <AlertOctagon className="w-5 h-5 text-red-600" /> :
               alert.type === 'warning' ? <AlertTriangle className="w-5 h-5 text-amber-600" /> :
               <AlertCircle className="w-5 h-5 text-blue-600" />}
              <span className={`text-sm font-medium ${
                alert.type === 'critical' ? 'text-red-700' :
                alert.type === 'warning' ? 'text-amber-700' :
                'text-blue-700'
              }`}>{alert.message}</span>
              <span className={`ml-auto text-xs font-bold px-2 py-1 rounded-full ${
                alert.type === 'critical' ? 'bg-red-200 text-red-700' :
                alert.type === 'warning' ? 'bg-amber-200 text-amber-700' :
                'bg-blue-200 text-blue-700'
              }`}>{alert.count}</span>
            </div>
          ))}
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-3">
        <KpiCard label="Progetti" value={metrics.totalProjects} icon={Package} color="#1147FF" />
        <KpiCard label="Ritardo" value={metrics.delayedProjects} icon={Clock} color="#EF4444" />
        <KpiCard label="Task Scaduti" value={metrics.overdueTasks} icon={AlertTriangle} color="#F59E0B" />
        <KpiCard label="Ticket Aperti" value={metrics.unresolvedTickets} icon={AlertCircle} color="#EF4444" />
        <KpiCard label="Tecnici" value={metrics.activeTechnicians} icon={Users} color="#10B981" />
        <KpiCard label="Ispezioni Oggi" value={metrics.todayInspections} icon={Calendar} color="#8B5CF6" />
        <KpiCard label="Approvazioni" value={metrics.pendingApprovals} icon={CheckCircle2} color="#3B82F6" />
        <KpiCard label="Margine <20%" value={metrics.lowMarginProjects} icon={TrendingDown} color="#EF4444" />
        <KpiCard label="Doc Mancanti" value={metrics.missingDocuments} icon={FileText} color="#F59E0B" />
        <KpiCard label="Warning AI" value={metrics.aiWarnings} icon={Zap} color="#F59E0B" />
      </div>

      {/* Active Projects */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-500" />
            Progetti Attivi
          </h2>
          <button 
            onClick={() => navigate('/projects')}
            className="text-xs text-blue-600 hover:underline"
          >
            Vedi tutti
          </button>
        </div>
        <div className="space-y-3">
          {projects.map(project => (
            <div 
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{project.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {project.project_manager || 'PM non assegnato'} · Scadenza: {project.expected_end_date ? new Date(project.expected_end_date).toLocaleDateString('it-IT') : 'N/A'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={project.status} />
                {project.contract_value && (
                  <span className="text-xs font-semibold text-gray-600">
                    €{(project.contract_value / 1000).toFixed(1)}k
                  </span>
                )}
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Nessun progetto attivo</p>
          )}
        </div>
      </div>

      {/* Team Activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-green-500" />
          Team Activity
        </h2>
        <div className="space-y-3">
          {teamActivity.map((member, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                {member.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{member.name || 'Utente'}</p>
                <p className="text-xs text-gray-500">{member.role || 'N/A'} · {member.activeProjects} progetti</p>
              </div>
              <Star className="w-4 h-4 text-gray-300" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, color }) {
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

function StatusBadge({ status }) {
  const colors = {
    'Lead': 'bg-gray-100 text-gray-700',
    'Survey': 'bg-blue-100 text-blue-700',
    'Estimate': 'bg-purple-100 text-purple-700',
    'Approved': 'bg-green-100 text-green-700',
    'In Progress': 'bg-blue-100 text-blue-700',
    'Testing': 'bg-yellow-100 text-yellow-700',
    'Delivered': 'bg-green-100 text-green-700',
    'Guardian Active': 'bg-indigo-100 text-indigo-700',
    'Archived': 'bg-gray-100 text-gray-500',
  };
  
  return (
    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}