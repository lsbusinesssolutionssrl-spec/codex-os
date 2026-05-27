import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Ticket, FolderKanban, Users, Wrench, CheckSquare, TrendingDown, ArrowRight, Calendar, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';

function RiskBadge({ level }) {
  const config = {
    Critical: 'bg-red-100 text-red-700 border border-red-200',
    High: 'bg-orange-100 text-orange-700 border border-orange-200',
    Medium: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    Low: 'bg-gray-100 text-gray-600',
  };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config[level] || config.Low}`}>{level}</span>;
}

function SectionCard({ title, icon: Icon, color, count, children, onViewAll, viewPath }) {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
          {count > 0 && <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: color }}>{count}</span>}
        </div>
        {viewPath && (
          <button onClick={() => navigate(viewPath)} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            Vedi tutti <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="divide-y divide-gray-50">
        {children}
      </div>
    </div>
  );
}

export default function OperationsDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    atRiskProjects: [],
    overdueTasks: [],
    urgentTickets: [],
    delayedProjects: [],
    maintenanceDue: [],
    technicianWorkload: {},
  });

  useEffect(() => {
    const load = async () => {
      const today = new Date().toISOString().split('T')[0];

      const [projects, tasks, tickets, maintenance, checklists] = await Promise.all([
        base44.entities.Project.filter({ status: 'In Progress' }),
        base44.entities.Task.list('-due_date', 100),
        base44.entities.SupportTicket.list('-created_date', 50),
        base44.entities.MaintenanceSchedule.list('-next_due_date', 50),
        base44.entities.ChecklistItem.list('-updated_date', 200),
      ]);

      // Projects at risk: delayed or near deadline
      const atRisk = projects.filter(p => {
        if (!p.expected_end_date) return false;
        const daysLeft = Math.ceil((new Date(p.expected_end_date) - new Date()) / 86400000);
        return daysLeft < 0 || daysLeft <= 7;
      }).map(p => {
        const daysLeft = Math.ceil((new Date(p.expected_end_date) - new Date()) / 86400000);
        return { ...p, daysLeft, riskLevel: daysLeft < 0 ? 'Critical' : 'High' };
      });

      // Overdue tasks
      const overdue = tasks.filter(t => t.due_date && t.due_date < today && t.status !== 'Completed' && t.status !== 'Cancelled');

      // Urgent tickets
      const urgent = tickets.filter(t => (t.priority === 'Urgent' || t.priority === 'High') && (t.status === 'Open' || t.status === 'In Progress'));

      // Delayed projects (past end date)
      const delayed = projects.filter(p => p.expected_end_date && p.expected_end_date < today);

      // Maintenance due in 7 days
      const maintenanceSoon = maintenance.filter(m => {
        if (!m.next_due_date) return false;
        const days = Math.ceil((new Date(m.next_due_date) - new Date()) / 86400000);
        return days <= 7;
      });

      // Technician workload
      const workload = {};
      checklists.filter(c => c.status !== 'Done' && c.assigned_person).forEach(c => {
        workload[c.assigned_person] = (workload[c.assigned_person] || 0) + 1;
      });
      tasks.filter(t => t.status !== 'Completed' && t.assigned_user).forEach(t => {
        workload[t.assigned_user] = (workload[t.assigned_user] || 0) + 1;
      });

      setData({
        atRiskProjects: atRisk,
        overdueTasks: overdue,
        urgentTickets: urgent,
        delayedProjects: delayed,
        maintenanceDue: maintenanceSoon,
        technicianWorkload: workload,
      });
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return (
    <div className="p-6 text-center">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto" />
    </div>
  );

  const totalAlerts = data.atRiskProjects.length + data.urgentTickets.length + data.overdueTasks.length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operations Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Panoramica operativa in tempo reale · {new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        {totalAlerts > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-semibold text-red-700">{totalAlerts} situazioni critiche</span>
          </div>
        )}
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Progetti a rischio', value: data.atRiskProjects.length, color: '#EF4444', icon: FolderKanban },
          { label: 'Task scaduti', value: data.overdueTasks.length, color: '#F59E0B', icon: CheckSquare },
          { label: 'Ticket urgenti', value: data.urgentTickets.length, color: '#EF4444', icon: Ticket },
          { label: 'Progetti ritardati', value: data.delayedProjects.length, color: '#F97316', icon: Clock },
          { label: 'Manutenzioni prossime', value: data.maintenanceDue.length, color: '#8B5CF6', icon: Wrench },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-400 font-medium">{label}</p>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: value > 0 ? color : '#6B7280' }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Projects at risk */}
        <SectionCard title="Progetti a Rischio" icon={AlertTriangle} color="#EF4444" count={data.atRiskProjects.length} viewPath="/projects">
          {data.atRiskProjects.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Nessun progetto a rischio 🎉</p>
          ) : data.atRiskProjects.slice(0, 5).map(p => (
            <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)} className="px-5 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{p.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {p.daysLeft < 0 ? `Scaduto ${Math.abs(p.daysLeft)} giorni fa` : `Scade tra ${p.daysLeft} giorni`}
                </p>
              </div>
              <RiskBadge level={p.riskLevel} />
            </div>
          ))}
        </SectionCard>

        {/* Urgent tickets */}
        <SectionCard title="Ticket Urgenti" icon={Ticket} color="#EF4444" count={data.urgentTickets.length} viewPath="/tickets">
          {data.urgentTickets.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Nessun ticket urgente 🎉</p>
          ) : data.urgentTickets.slice(0, 5).map(t => (
            <div key={t.id} onClick={() => navigate(`/tickets/${t.id}`)} className="px-5 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{t.title}</p>
                {t.assigned_technician && <p className="text-xs text-gray-400 mt-0.5">Tecnico: {t.assigned_technician}</p>}
              </div>
              <StatusBadge status={t.priority} />
            </div>
          ))}
        </SectionCard>

        {/* Overdue tasks */}
        <SectionCard title="Task Scaduti" icon={CheckSquare} color="#F59E0B" count={data.overdueTasks.length} viewPath="/tasks">
          {data.overdueTasks.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Nessun task scaduto 🎉</p>
          ) : data.overdueTasks.slice(0, 5).map(t => (
            <div key={t.id} onClick={() => navigate('/tasks')} className="px-5 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{t.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Scaduto: {new Date(t.due_date).toLocaleDateString('it-IT')}
                  {t.assigned_user ? ` · ${t.assigned_user}` : ''}
                </p>
              </div>
              <StatusBadge status={t.priority} />
            </div>
          ))}
        </SectionCard>

        {/* Technician workload */}
        <SectionCard title="Carico di Lavoro Tecnici" icon={Users} color="#6366F1" count={Object.keys(data.technicianWorkload).length}>
          {Object.keys(data.technicianWorkload).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Nessun dato disponibile</p>
          ) : Object.entries(data.technicianWorkload)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 6)
            .map(([name, count]) => (
              <div key={name} className="px-5 py-3 flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-indigo-600">{name[0]?.toUpperCase()}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{name}</p>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                    <div className="h-1.5 rounded-full" style={{ width: `${Math.min((count / 20) * 100, 100)}%`, backgroundColor: count > 15 ? '#EF4444' : count > 8 ? '#F59E0B' : '#10B981' }} />
                  </div>
                </div>
                <span className={`text-sm font-bold ${count > 15 ? 'text-red-500' : count > 8 ? 'text-orange-500' : 'text-green-600'}`}>{count}</span>
              </div>
            ))}
        </SectionCard>

        {/* Maintenance due */}
        {data.maintenanceDue.length > 0 && (
          <SectionCard title="Manutenzioni Imminenti (7gg)" icon={Wrench} color="#8B5CF6" count={data.maintenanceDue.length} viewPath="/maintenance">
            {data.maintenanceDue.slice(0, 5).map(m => (
              <div key={m.id} onClick={() => navigate('/maintenance')} className="px-5 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{m.title}</p>
                  <p className="text-xs text-gray-400">{m.maintenance_type} · {m.assigned_technician || '—'}</p>
                </div>
                <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                  {new Date(m.next_due_date).toLocaleDateString('it-IT')}
                </span>
              </div>
            ))}
          </SectionCard>
        )}
      </div>
    </div>
  );
}