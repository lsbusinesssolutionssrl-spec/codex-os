import { useState, useEffect } from 'react';
import { Bell, CheckCheck, Filter, AlertTriangle, DollarSign, Ticket, FolderKanban, FileText, Shield, Clock, CheckCircle, X, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';

const TYPE_CONFIG = {
  estimate_accepted: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', label: 'Preventivo accettato' },
  estimate_rejected: { icon: X, color: 'text-red-500', bg: 'bg-red-50', label: 'Preventivo rifiutato' },
  project_delayed: { icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Progetto in ritardo' },
  checklist_overdue: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'Checklist scaduta' },
  ticket_assigned: { icon: Ticket, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Ticket assegnato' },
  ticket_urgent: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', label: 'Ticket urgente' },
  project_delivered: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', label: 'Progetto consegnato' },
  payment_overdue: { icon: DollarSign, color: 'text-red-500', bg: 'bg-red-50', label: 'Pagamento scaduto' },
  margin_below_target: { icon: DollarSign, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Margine sotto target' },
  document_uploaded: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Documento caricato' },
  guardian_expiring: { icon: Shield, color: 'text-purple-500', bg: 'bg-purple-50', label: 'Guardian in scadenza' },
  task_assigned: { icon: CheckCheck, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Task assegnato' },
  maintenance_due: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'Manutenzione in scadenza' },
  comment_mention: { icon: Bell, color: 'text-indigo-500', bg: 'bg-indigo-50', label: 'Sei stato menzionato' },
};

const PRIORITY_COLOR = {
  Urgent: 'bg-red-100 text-red-700',
  High: 'bg-orange-100 text-orange-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  Low: 'bg-gray-100 text-gray-600',
};

const FILTERS = [
  { id: 'all', label: 'Tutte' },
  { id: 'unread', label: 'Non lette' },
  { id: 'urgent', label: 'Urgenti' },
  { id: 'projects', label: 'Progetti' },
  { id: 'financial', label: 'Finanziario' },
  { id: 'tickets', label: 'Ticket' },
];

const FILTER_TYPES = {
  urgent: n => n.priority === 'Urgent' || n.priority === 'High',
  projects: n => ['project_delayed','project_delivered','checklist_overdue'].includes(n.type),
  financial: n => ['payment_overdue','margin_below_target','estimate_accepted','estimate_rejected'].includes(n.type),
  tickets: n => ['ticket_assigned','ticket_urgent'].includes(n.type),
};

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return 'ora';
  if (diff < 3600) return `${Math.floor(diff/60)}m fa`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h fa`;
  return `${Math.floor(diff/86400)}g fa`;
}

export default function NotificationCenter() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      setUserEmail(user?.email || '');
      const all = await base44.entities.Notification.list('-created_date', 100);
      // Show notifications assigned to me or to everyone
      setNotifications(all.filter(n => !n.assigned_to || n.assigned_to === user?.email));
      setLoading(false);
    };
    load();
  }, []);

  const markRead = async (id) => {
    await base44.entities.Notification.update(id, { is_read: true });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleClick = (n) => {
    markRead(n.id);
    if (n.action_url) navigate(n.action_url);
  };

  const filtered = notifications.filter(n => {
    if (activeFilter === 'unread') return !n.is_read;
    if (FILTER_TYPES[activeFilter]) return FILTER_TYPES[activeFilter](n);
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6" />
            Notification Center
          </h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">{unreadCount} notifiche non lette</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
            <CheckCheck className="w-4 h-4" /> Segna tutte lette
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeFilter === f.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {f.label}
            {f.id === 'unread' && unreadCount > 0 && (
              <span className="ml-1 bg-blue-500 text-white text-xs rounded-full px-1.5">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Caricamento...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Nessuna notifica</p>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map(n => {
            const cfg = TYPE_CONFIG[n.type] || { icon: Bell, color: 'text-gray-500', bg: 'bg-gray-50' };
            const Icon = cfg.icon;
            return (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${
                  n.is_read ? 'bg-white border-gray-100' : 'bg-blue-50/30 border-blue-100'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-medium ${n.is_read ? 'text-gray-700' : 'text-gray-900'}`}>{n.title}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLOR[n.priority] || PRIORITY_COLOR.Low}`}>
                      {n.priority}
                    </span>
                    {!n.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                  </div>
                  {n.message && <p className="text-xs text-gray-500 mt-0.5 truncate">{n.message}</p>}
                  <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_date)}</p>
                </div>
                {n.action_url && <ExternalLink className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}