import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, FolderKanban, Ticket, Archive, CheckSquare, Shield, TrendingUp, Clock, User, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

const ENTITY_CONFIG = {
  Estimate: { icon: FileText, color: '#1147FF', label: 'Preventivo' },
  Project: { icon: FolderKanban, color: '#F58020', label: 'Progetto' },
  SupportTicket: { icon: Ticket, color: '#EF4444', label: 'Ticket' },
  Document: { icon: Archive, color: '#10B981', label: 'Documento' },
  ChecklistItem: { icon: CheckSquare, color: '#8B5CF6', label: 'Checklist' },
  GuardianSubscription: { icon: Shield, color: '#0B2341', label: 'Guardian' },
  ProjectCost: { icon: TrendingUp, color: '#F59E0B', label: 'Costo' },
  Task: { icon: CheckSquare, color: '#6366F1', label: 'Task' },
};

function activityDescription(log) {
  const entity = log.entity_name || log.entity_type || 'Entità';
  const action = log.action || log.event_type || 'modificata';
  const title = log.entity_title || log.description || '';
  
  const actionMap = {
    create: 'creato/a',
    update: 'aggiornato/a',
    delete: 'eliminato/a',
    status_change: 'stato cambiato',
    login: 'accesso effettuato',
  };

  return `${entity} ${actionMap[action] || action}${title ? ': ' + title : ''}`;
}

export default function ActivityFeed() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: () => base44.entities.AuditLog.list('-created_date', 100),
    refetchInterval: 30000,
  });

  // Also pull recent estimates, projects, tickets for enriched feed
  const { data: recentEstimates = [] } = useQuery({
    queryKey: ['recent-estimates'],
    queryFn: () => base44.entities.Estimate.list('-created_date', 20),
  });
  const { data: recentProjects = [] } = useQuery({
    queryKey: ['recent-projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 20),
  });
  const { data: recentTickets = [] } = useQuery({
    queryKey: ['recent-tickets'],
    queryFn: () => base44.entities.SupportTicket.list('-created_date', 20),
  });
  const { data: recentTasks = [] } = useQuery({
    queryKey: ['recent-tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 20),
  });

  // Build synthetic activity from recent records + audit logs
  const activities = [
    ...recentEstimates.slice(0, 5).map(e => ({
      id: 'est-' + e.id, type: 'Estimate', title: e.title,
      description: `Preventivo ${e.status === 'Accepted' ? 'accettato' : e.status === 'Sent' ? 'inviato' : 'creato'}`,
      status: e.status, user: e.created_by, ts: e.updated_date || e.created_date,
    })),
    ...recentProjects.slice(0, 5).map(p => ({
      id: 'prj-' + p.id, type: 'Project', title: p.title,
      description: `Progetto ${p.status === 'Delivered' ? 'consegnato' : p.status === 'In Progress' ? 'in corso' : 'aggiornato'}`,
      status: p.status, user: p.created_by, ts: p.updated_date || p.created_date,
    })),
    ...recentTickets.slice(0, 5).map(t => ({
      id: 'tkt-' + t.id, type: 'SupportTicket', title: t.title,
      description: `Ticket ${t.status === 'Resolved' ? 'risolto' : t.status === 'Open' ? 'aperto' : 'aggiornato'}`,
      status: t.status, user: t.created_by, ts: t.updated_date || t.created_date,
    })),
    ...recentTasks.slice(0, 5).map(t => ({
      id: 'tsk-' + t.id, type: 'Task', title: t.title,
      description: `Task ${t.status === 'Completed' ? 'completato' : 'creato/aggiornato'}`,
      status: t.status, user: t.created_by || t.assigned_to, ts: t.updated_date || t.created_date,
    })),
  ].sort((a, b) => new Date(b.ts) - new Date(a.ts)).slice(0, 50);

  const getConfig = (type) => ENTITY_CONFIG[type] || { icon: Clock, color: '#6B7280', label: type };

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Activity Feed</h1>
          <p className="text-xs text-gray-500 mt-0.5">Attività recenti della piattaforma · aggiornamento ogni 30s</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Live
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Preventivi', count: recentEstimates.length, color: '#1147FF' },
          { label: 'Progetti', count: recentProjects.length, color: '#F58020' },
          { label: 'Ticket', count: recentTickets.length, color: '#EF4444' },
          { label: 'Task', count: recentTasks.length, color: '#6366F1' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.count}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Feed */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading && activities.length === 0 ? (
          <div className="py-12 text-center"><Loader2 className="w-6 h-6 animate-spin text-gray-300 mx-auto" /></div>
        ) : activities.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">Nessuna attività recente</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {activities.map(a => {
              const cfg = getConfig(a.type);
              const Icon = cfg.icon;
              return (
                <div key={a.id} className="px-5 py-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: cfg.color + '15' }}>
                    <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{a.title}</p>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {a.ts ? formatDistanceToNow(new Date(a.ts), { addSuffix: true, locale: it }) : ''}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{a.description}</p>
                    {a.user && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="w-2.5 h-2.5 text-gray-500" />
                        </div>
                        <span className="text-xs text-gray-400">{a.user}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cfg.color + '15', color: cfg.color }}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}