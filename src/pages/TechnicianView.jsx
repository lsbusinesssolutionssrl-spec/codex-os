import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapPin, Camera, Clock, CheckSquare, Ticket, FileText, Navigation, ChevronRight, CheckCircle2, Loader2, Upload, AlertCircle, Plus, X } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

export default function TechnicianView() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('jobs');
  const [clockedIn, setClockedIn] = useState(false);
  const [clockStart, setClockStart] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [selectedProject, setSelectedProject] = useState(null);
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  // Timer
  useEffect(() => {
    if (!clockedIn) { setElapsed(0); return; }
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - clockStart) / 1000)), 1000);
    return () => clearInterval(t);
  }, [clockedIn, clockStart]);

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['tech-projects', user?.email],
    queryFn: () => base44.entities.Project.filter({ status: 'In Progress' }),
    enabled: !!user,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tech-tasks', user?.email],
    queryFn: () => base44.entities.Task.filter({ assigned_to: user?.email, status: 'In Progress' }),
    enabled: !!user,
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ['tech-tickets', user?.email],
    queryFn: () => base44.entities.SupportTicket.filter({ assigned_technician: user?.email, status: 'In Progress' }),
    enabled: !!user,
  });

  const { data: checklists = [] } = useQuery({
    queryKey: ['tech-checklists'],
    queryFn: () => base44.entities.ChecklistItem.filter({ status: 'To Do' }),
    enabled: !!user,
  });

  const updateTask = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tech-tasks'] }),
  });

  const updateChecklist = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ChecklistItem.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tech-checklists'] }),
  });

  const fmtTime = (s) => `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const TABS = [
    { id: 'jobs', label: 'Cantieri', icon: MapPin, count: projects.length },
    { id: 'tasks', label: 'Task', icon: CheckSquare, count: tasks.length },
    { id: 'tickets', label: 'Ticket', icon: Ticket, count: tickets.length },
    { id: 'checklists', label: 'Checklist', icon: CheckCircle2, count: checklists.length },
  ];

  return (
    <div className="max-w-lg mx-auto px-3 py-4 space-y-4 pb-24">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-900">Ciao, {user?.full_name?.split(' ')[0] || 'Tecnico'} 👋</h1>
          <p className="text-xs text-gray-400">{new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className={`text-right ${clockedIn ? 'text-green-600' : 'text-gray-400'}`}>
          <p className="text-xs font-medium">{clockedIn ? '● In servizio' : '● Fuori servizio'}</p>
          {clockedIn && <p className="text-sm font-mono font-bold">{fmtTime(elapsed)}</p>}
        </div>
      </div>

      {/* Clock in/out */}
      <button
        onClick={() => { if (!clockedIn) { setClockedIn(true); setClockStart(Date.now()); } else { setClockedIn(false); setClockStart(null); } }}
        className={`w-full py-3.5 rounded-xl text-sm font-bold transition-colors ${clockedIn ? 'bg-red-50 text-red-600 border-2 border-red-200' : 'text-white'}`}
        style={!clockedIn ? { backgroundColor: '#10B981' } : {}}
      >
        {clockedIn ? `⏹ Termina servizio · ${fmtTime(elapsed)}` : '▶ Inizia servizio'}
      </button>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-2">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex flex-col items-center py-3 rounded-xl border transition-colors ${activeTab === t.id ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'}`}>
            <t.icon className={`w-5 h-5 mb-1 ${activeTab === t.id ? 'text-blue-600' : 'text-gray-400'}`} />
            <span className={`text-lg font-bold ${activeTab === t.id ? 'text-blue-700' : 'text-gray-700'}`}>{t.count}</span>
            <span className={`text-xs ${activeTab === t.id ? 'text-blue-500' : 'text-gray-400'}`}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'jobs' && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Cantieri Attivi</h2>
          {loadingProjects ? <div className="py-6 text-center"><Loader2 className="w-5 h-5 animate-spin text-gray-300 mx-auto" /></div> :
            projects.length === 0 ? <Empty text="Nessun cantiere attivo" /> :
            projects.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{p.title}</p>
                    <StatusBadge status={p.status} />
                  </div>
                  {p.expected_end_date && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(p.expected_end_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(p.title)}`} target="_blank" rel="noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg">
                    <Navigation className="w-3.5 h-3.5" /> Naviga
                  </a>
                  <button className="flex items-center justify-center gap-2 py-2.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg">
                    <Camera className="w-3.5 h-3.5" /> Foto
                  </button>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">I tuoi Task</h2>
          {tasks.length === 0 ? <Empty text="Nessun task assegnato" /> :
            tasks.map(t => (
              <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-medium text-gray-900">{t.title}</p>
                  <StatusBadge status={t.priority} />
                </div>
                {t.description && <p className="text-xs text-gray-500 mb-3">{t.description}</p>}
                <button
                  onClick={() => updateTask.mutate({ id: t.id, data: { status: 'Completed', completed_at: new Date().toISOString() } })}
                  className="w-full py-2 text-xs font-medium text-green-600 bg-green-50 rounded-lg flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Segna completato
                </button>
              </div>
            ))
          }
        </div>
      )}

      {activeTab === 'tickets' && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Ticket Assegnati</h2>
          {tickets.length === 0 ? <Empty text="Nessun ticket assegnato" /> :
            tickets.map(t => (
              <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900">{t.title}</p>
                  <StatusBadge status={t.priority} />
                </div>
                <p className="text-xs text-gray-500 mb-2">{t.issue_type}</p>
                <StatusBadge status={t.status} />
              </div>
            ))
          }
        </div>
      )}

      {activeTab === 'checklists' && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Checklist da completare</h2>
          {checklists.length === 0 ? <Empty text="Nessun item in checklist" /> :
            checklists.map(c => (
              <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{c.title}</p>
                  {c.category && <p className="text-xs text-gray-400">{c.category}</p>}
                </div>
                <button
                  onClick={() => updateChecklist.mutate({ id: c.id, data: { status: 'Done' } })}
                  className="p-2 rounded-lg bg-green-50 text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                </button>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}

function Empty({ text }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 py-10 text-center">
      <CheckCircle2 className="w-7 h-7 text-gray-200 mx-auto mb-2" />
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  );
}