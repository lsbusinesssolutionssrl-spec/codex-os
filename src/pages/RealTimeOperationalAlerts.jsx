import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, AlertTriangle, AlertCircle, Info, 
  Clock, TrendingUp, TrendingDown, DollarSign,
  CheckCircle, X, BarChart2, Zap, Activity,
  Users, FileText, Image, Target, ChevronRight
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function RealTimeOperationalAlerts() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadAlerts();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAlerts = async () => {
    try {
      const [projects, tasks, tickets, documents, checklists, insights] = await Promise.all([
        base44.entities.Project.list(),
        base44.entities.Task.list(),
        base44.entities.SupportTicket.list(),
        base44.entities.Document.list(),
        base44.entities.ChecklistItem.list(),
        base44.entities.IntelligenceInsight.list(),
      ]);

      const generatedAlerts = [];

      // Project inactive too long (no update in 7 days)
      projects.forEach(project => {
        const lastUpdate = project.updated_date ? new Date(project.updated_date) : new Date(0);
        const daysInactive = Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysInactive > 7 && !['Delivered', 'Archived'].includes(project.status)) {
          generatedAlerts.push({
            id: `project-inactive-${project.id}`,
            type: 'warning',
            category: 'project',
            title: `Progetto inattivo da ${daysInactive} giorni`,
            description: `${project.title} non ha aggiornamenti recenti`,
            projectId: project.id,
            timestamp: lastUpdate,
            metric: `${daysInactive} giorni`,
          });
        }
      });

      // No photos uploaded
      projects.forEach(project => {
        if (['In Progress', 'Testing'].includes(project.status)) {
          const photosCount = (project.photos_during?.length || 0) + (project.photos_after?.length || 0);
          if (photosCount === 0) {
            generatedAlerts.push({
              id: `no-photos-${project.id}`,
              type: 'critical',
              category: 'documentation',
              title: 'Nessuna foto caricata',
              description: `${project.title} è in avanzamento ma senza foto`,
              projectId: project.id,
              timestamp: new Date(project.updated_date || project.created_date),
              metric: '0 foto',
            });
          }
        }
      });

      // Checklist overdue
      projects.forEach(project => {
        if (['In Progress', 'Testing'].includes(project.status)) {
          const projectChecklists = checklists.filter(c => c.project_id === project.id);
          const incompleteChecklists = projectChecklists.filter(c => !c.completed).length;
          if (incompleteChecklists > 0 && projectChecklists.length > 0) {
            generatedAlerts.push({
              id: `checklist-overdue-${project.id}`,
              type: 'warning',
              category: 'workflow',
              title: 'Checklist incomplete',
              description: `${project.title} ha ${incompleteChecklists} checklist da completare`,
              projectId: project.id,
              timestamp: new Date(),
              metric: `${incompleteChecklists} pending`,
            });
          }
        }
      });

      // Delayed tasks
      const today = new Date();
      tasks.forEach(task => {
        if (task.due_date && new Date(task.due_date) < today && task.status !== 'Completed') {
          generatedAlerts.push({
            id: `task-delayed-${task.id}`,
            type: 'critical',
            category: 'task',
            title: 'Task in ritardo',
            description: task.title,
            projectId: task.project_id,
            timestamp: new Date(task.due_date),
            metric: 'Ritardato',
          });
        }
      });

      // Unresolved tickets (open > 3 days)
      tickets.forEach(ticket => {
        if (!['Resolved', 'Closed'].includes(ticket.status)) {
          const createdDate = new Date(ticket.created_date);
          const daysOpen = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysOpen > 3) {
            generatedAlerts.push({
              id: `ticket-unresolved-${ticket.id}`,
              type: 'warning',
              category: 'ticket',
              title: 'Ticket aperto da troppo tempo',
              description: ticket.title,
              timestamp: createdDate,
              metric: `${daysOpen} giorni`,
            });
          }
        }
      });

      // Budget drift (>10% over budget)
      projects.forEach(project => {
        if (project.contract_value && project.total_costs) {
          const budgetOverrun = ((project.total_costs - project.contract_value) / project.contract_value) * 100;
          if (budgetOverrun > 10) {
            generatedAlerts.push({
              id: `budget-drift-${project.id}`,
              type: 'critical',
              category: 'financial',
              title: 'Sforamento budget',
              description: `${project.title} ha superato il budget del ${Math.round(budgetOverrun)}%`,
              projectId: project.id,
              timestamp: new Date(project.updated_date || project.created_date),
              metric: `+${Math.round(budgetOverrun)}%`,
            });
          }
        }
      });

      // Margin erosion (<20% margin)
      projects.forEach(project => {
        if (project.contract_value && project.total_costs) {
          const margin = ((project.contract_value - project.total_costs) / project.contract_value) * 100;
          if (margin < 20 && margin > 0) {
            generatedAlerts.push({
              id: `margin-erosion-${project.id}`,
              type: 'warning',
              category: 'financial',
              title: 'Margine basso',
              description: `${project.title} ha margine del ${Math.round(margin)}%`,
              projectId: project.id,
              timestamp: new Date(project.updated_date || project.created_date),
              metric: `${Math.round(margin)}%`,
            });
          }
        }
      });

      // Technician overload (>10 active tasks)
      const technicians = {};
      tasks.forEach(task => {
        if (task.assigned_to && task.status !== 'Completed') {
          technicians[task.assigned_to] = (technicians[task.assigned_to] || 0) + 1;
        }
      });
      Object.entries(technicians).forEach(([tech, count]) => {
        if (count > 10) {
          generatedAlerts.push({
            id: `tech-overload-${tech}`,
            type: 'warning',
            category: 'resource',
            title: 'Tecnico sovraccarico',
            description: `${tech} ha ${count} task attivi`,
            timestamp: new Date(),
            metric: `${count} task`,
          });
        }
      });

      // Sort by severity and timestamp
      const sortedAlerts = generatedAlerts.sort((a, b) => {
        const severityOrder = { critical: 3, warning: 2, info: 1 };
        if (severityOrder[b.type] !== severityOrder[a.type]) {
          return severityOrder[b.type] - severityOrder[a.type];
        }
        return new Date(b.timestamp) - new Date(a.timestamp);
      });

      setAlerts(sortedAlerts);

    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(a => a.type === filter);

  const alertCounts = {
    all: alerts.length,
    critical: alerts.filter(a => a.type === 'critical').length,
    warning: alerts.filter(a => a.type === 'warning').length,
    info: alerts.filter(a => a.type === 'info').length,
  };

  if (loading) return <div className="p-6 text-center text-gray-400">Caricamento...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-600" />
            Real-time Operational Alerts
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Monitoraggio continuo anomalie operative</p>
        </div>
        <button 
          onClick={loadAlerts}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <Zap className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <AlertSummaryCard label="Total Alerts" count={alertCounts.all} color="#3B82F6" active={filter === 'all'} onClick={() => setFilter('all')} />
        <AlertSummaryCard label="Critical" count={alertCounts.critical} color="#EF4444" active={filter === 'critical'} onClick={() => setFilter('critical')} />
        <AlertSummaryCard label="Warnings" count={alertCounts.warning} color="#F59E0B" active={filter === 'warning'} onClick={() => setFilter('warning')} />
        <AlertSummaryCard label="Info" count={alertCounts.info} color="#10B981" active={filter === 'info'} onClick={() => setFilter('info')} />
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Last Update</p>
          <p className="text-sm font-semibold text-gray-900">{new Date().toLocaleTimeString('it-IT')}</p>
        </div>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
          <p className="text-lg font-semibold text-gray-900">Nessun Alert</p>
          <p className="text-sm text-gray-500 mt-1">Tutto operativo nella norma</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map(alert => (
            <AlertCard 
              key={alert.id} 
              alert={alert} 
              onClick={() => alert.projectId && navigate(`/projects/${alert.projectId}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AlertSummaryCard({ label, count, color, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-xl border p-4 text-left transition-all ${
        active ? 'ring-2 ring-offset-2' : 'hover:bg-gray-50'
      }`}
      style={{ 
        borderColor: active ? color : '#E5E7EB',
        ringColor: color 
      }}
    >
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{count}</p>
    </button>
  );
}

function AlertCard({ alert, onClick }) {
  const typeConfig = {
    critical: { icon: AlertTriangle, color: '#EF4444', bg: 'bg-red-50', border: 'border-red-200' },
    warning: { icon: AlertCircle, color: '#F59E0B', bg: 'bg-amber-50', border: 'border-amber-200' },
    info: { icon: Info, color: '#3B82F6', bg: 'bg-blue-50', border: 'border-blue-200' },
  };
  const config = typeConfig[alert.type];
  const Icon = config.icon;

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Adesso';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m fa`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h fa`;
    const days = Math.floor(hours / 24);
    return `${days}g fa`;
  };

  return (
    <button
      onClick={onClick}
      className={`w-full ${config.bg} ${config.border} border rounded-xl p-4 text-left hover:shadow-md transition-all`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0`} style={{ backgroundColor: config.color + '20' }}>
          <Icon className="w-5 h-5" style={{ color: config.color }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold text-gray-900">{alert.title}</p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize`} style={{ backgroundColor: config.color + '20', color: config.color }}>
              {alert.type}
            </span>
          </div>
          <p className="text-sm text-gray-600">{alert.description}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {timeAgo(alert.timestamp)}
            </span>
            <span className="flex items-center gap-1">
              <BarChart2 className="w-3 h-3" /> {alert.metric}
            </span>
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3" /> {alert.category}
            </span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </button>
  );
}