import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  BarChart2, Clock, AlertTriangle, CheckCircle, 
  Image, FileText, Users, DollarSign, Calendar,
  TrendingUp, TrendingDown, Activity, Zap, Target,
  AlertCircle, ChevronRight, ArrowLeft
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ProjectCommandCenter() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [commandData, setCommandData] = useState({
    progress: 0,
    photosCount: 0,
    tasksTotal: 0,
    tasksCompleted: 0,
    ticketsOpen: 0,
    costsTotal: 0,
    costsBudget: 0,
    delays: 0,
    aiInsights: 0,
    technicianActivity: 0,
    missingActions: [],
  });

  useEffect(() => {
    if (id) loadProjectData();
  }, [id]);

  const loadProjectData = async () => {
    try {
      const [projects, tasks, tickets, documents, costs, insights, checklists] = await Promise.all([
        base44.entities.Project.list(),
        base44.entities.Task.list(),
        base44.entities.SupportTicket.list(),
        base44.entities.Document.list(),
        base44.entities.ProjectCost.list(),
        base44.entities.IntelligenceInsight.list(),
        base44.entities.ChecklistItem.list(),
      ]);

      const currentProject = projects.find(p => p.id === id);
      if (!currentProject) {
        navigate('/projects');
        return;
      }

      setProject(currentProject);

      const projectTasks = tasks.filter(t => t.project_id === id);
      const projectTickets = tickets.filter(t => t.property_id === id || t.project_id === id);
      const projectDocs = documents.filter(d => d.project_id === id);
      const projectCosts = costs.filter(c => c.project_id === id);
      const projectInsights = insights.filter(i => i.project_id === id);
      const projectChecklists = checklists.filter(c => c.project_id === id);

      // Calculate progress
      const completedTasks = projectTasks.filter(t => t.status === 'Completed').length;
      const progress = projectTasks.length > 0 
        ? Math.round((completedTasks / projectTasks.length) * 100) 
        : 0;

      // Calculate costs
      const totalCosts = projectCosts.reduce((sum, c) => sum + (c.total_cost || 0), 0);
      const budget = currentProject.contract_value || 0;

      // Detect delays
      const today = new Date();
      const endDate = currentProject.expected_end_date ? new Date(currentProject.expected_end_date) : null;
      const isDelayed = endDate && endDate < today && currentProject.status !== 'Delivered';

      // Missing actions
      const missingActions = [];
      if (!currentProject.project_manager) missingActions.push('Assegna Project Manager');
      if (projectTasks.length === 0) missingActions.push('Crea task operativi');
      if (projectDocs.length === 0) missingActions.push('Carica documenti');
      if ((!currentProject.photos_during || currentProject.photos_during.length === 0) && ['In Progress', 'Testing'].includes(currentProject.status)) {
        missingActions.push('Carica foto avanzamento');
      }
      if (projectChecklists.length === 0 && ['In Progress', 'Testing'].includes(currentProject.status)) {
        missingActions.push('Completa checklist');
      }

      setCommandData({
        progress,
        photosCount: (currentProject.photos_during || []).length + (currentProject.photos_after || []).length,
        tasksTotal: projectTasks.length,
        tasksCompleted: completedTasks,
        ticketsOpen: projectTickets.filter(t => t.status !== 'Resolved' && t.status !== 'Closed').length,
        costsTotal: totalCosts,
        costsBudget: budget,
        delays: isDelayed ? 1 : 0,
        aiInsights: projectInsights.length,
        technicianActivity: projectTasks.filter(t => t.assigned_to).length,
        missingActions,
      });

    } catch (error) {
      console.error('Error loading command center data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-400">Caricamento...</div>;
  if (!project) return null;

  const margin = project.contract_value && project.total_costs 
    ? Math.round(((project.contract_value - project.total_costs) / project.contract_value) * 100) 
    : null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/projects')}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-600" />
            Project Command Center
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{project.title}</p>
        </div>
        <button 
          onClick={loadProjectData}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <Zap className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Project Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Status</p>
            <p className="text-sm font-semibold text-gray-900">{project.status}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Progresso</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600" style={{ width: `${commandData.progress}%` }} />
              </div>
              <span className="text-sm font-bold text-gray-900">{commandData.progress}%</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Scadenza</p>
            <p className={`text-sm font-semibold ${commandData.delays > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {project.expected_end_date ? new Date(project.expected_end_date).toLocaleDateString('it-IT') : 'N/A'}
              {commandData.delays > 0 && ' (RITARDO)'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Margine</p>
            <p className={`text-sm font-bold ${margin < 20 ? 'text-red-600' : margin < 30 ? 'text-amber-600' : 'text-green-600'}`}>
              {margin ? `${margin}%` : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Operational Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-3">
        <MetricCard label="Task" value={`${commandData.tasksCompleted}/${commandData.tasksTotal}`} icon={CheckCircle} color="#10B981" />
        <MetricCard label="Ticket Aperti" value={commandData.ticketsOpen} icon={AlertTriangle} color="#EF4444" />
        <MetricCard label="Foto" value={commandData.photosCount} icon={Image} color="#8B5CF6" />
        <MetricCard label="Costi" value={`€${(commandData.costsTotal / 1000).toFixed(1)}k`} icon={DollarSign} color="#F59E0B" />
        <MetricCard label="Budget" value={`€${(commandData.costsBudget / 1000).toFixed(1)}k`} icon={BarChart2} color="#3B82F6" />
        <MetricCard label="Ritardi" value={commandData.delays} icon={Clock} color="#EF4444" />
        <MetricCard label="AI Insights" value={commandData.aiInsights} icon={Zap} color="#F59E0B" />
        <MetricCard label="Activity" value={commandData.technicianActivity} icon={Users} color="#1147FF" />
        <MetricCard label="Doc" value={project.documents?.length || 0} icon={FileText} color="#6B7280" />
        <MetricCard label="Checklist" value={project.checklists?.length || 0} icon={Target} color="#06B6D4" />
      </div>

      {/* Missing Actions */}
      {commandData.missingActions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-semibold text-amber-900">Azioni Mancanti ({commandData.missingActions.length})</h3>
          </div>
          <div className="space-y-2">
            {commandData.missingActions.map((action, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-100">
                <span className="text-sm text-amber-900">{action}</span>
                <button className="text-xs font-semibold text-amber-700 hover:underline flex items-center gap-1">
                  Esegui <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline Preview */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-500" />
          Timeline Operativa
        </h3>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600" />
            <span className="text-gray-600">Start: {project.start_date ? new Date(project.start_date).toLocaleDateString('it-IT') : 'N/A'}</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200" />
          <div className="flex items-center gap-2">
            <span className="text-gray-600">End: {project.expected_end_date ? new Date(project.expected_end_date).toLocaleDateString('it-IT') : 'N/A'}</span>
            <div className={`w-3 h-3 rounded-full ${commandData.delays > 0 ? 'bg-red-600' : 'bg-green-600'}`} />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickStat 
          label="Budget vs Consuntivo" 
          value={`€${(commandData.costsBudget / 1000).toFixed(1)}k / €${(commandData.costsTotal / 1000).toFixed(1)}k`}
          trend={commandData.costsTotal > commandData.costsBudget ? 'down' : 'up'}
        />
        <QuickStat 
          label="Task Completion" 
          value={`${commandData.tasksCompleted}/${commandData.tasksTotal}`}
          trend={commandData.progress >= 80 ? 'up' : commandData.progress >= 50 ? 'stable' : 'down'}
        />
        <QuickStat 
          label="Ticket Aperti" 
          value={commandData.ticketsOpen}
          trend={commandData.ticketsOpen > 5 ? 'down' : 'up'}
        />
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, color }) {
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

function QuickStat({ label, value, trend }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs text-gray-500 mb-2">{label}</p>
      <div className="flex items-center justify-between">
        <p className="text-lg font-bold text-gray-900">{value}</p>
        {trend === 'up' ? (
          <TrendingUp className="w-4 h-4 text-green-600" />
        ) : trend === 'down' ? (
          <TrendingDown className="w-4 h-4 text-red-600" />
        ) : (
          <Activity className="w-4 h-4 text-gray-400" />
        )}
      </div>
    </div>
  );
}