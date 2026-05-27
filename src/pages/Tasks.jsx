import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, X, Calendar, User, Flag, Link2, CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

const COLUMNS = ['To Do', 'In Progress', 'Waiting', 'Completed'];
const PRIORITY_COLORS = { Low: 'text-gray-400', Medium: 'text-yellow-500', High: 'text-orange-500', Urgent: 'text-red-500' };
const PRIORITY_BG = { Low: 'bg-gray-100', Medium: 'bg-yellow-50', High: 'bg-orange-50', Urgent: 'bg-red-50' };

function TaskCard({ task, onMove, onDelete }) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'Completed';
  return (
    <div className={`bg-white rounded-xl border p-3.5 shadow-sm hover:shadow-md transition-shadow ${isOverdue ? 'border-red-200' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-gray-900 leading-tight">{task.title}</p>
        <button onClick={() => onDelete(task.id)} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {task.description && <p className="text-xs text-gray-500 mb-2 line-clamp-2">{task.description}</p>}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1.5">
          <Flag className={`w-3 h-3 ${PRIORITY_COLORS[task.priority] || 'text-gray-400'}`} />
          <span className="text-xs text-gray-500">{task.priority}</span>
        </div>
        {task.due_date && (
          <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
            <Calendar className="w-3 h-3" />
            {new Date(task.due_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
          </span>
        )}
      </div>
      {task.assigned_to && (
        <div className="flex items-center gap-1 mt-2">
          <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-xs font-bold text-blue-600">{task.assigned_to[0]?.toUpperCase()}</span>
          </div>
          <span className="text-xs text-gray-400 truncate">{task.assigned_to}</span>
        </div>
      )}
      {/* Move buttons */}
      <div className="flex gap-1 mt-2.5 pt-2 border-t border-gray-50">
        {COLUMNS.filter(c => c !== task.status).map(col => (
          <button key={col} onClick={() => onMove(task.id, col)}
            className="flex-1 text-xs py-1 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors truncate px-1">
            → {col}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Tasks() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ title: '', description: '', assigned_to: '', priority: 'Medium', due_date: '', status: 'To Do' });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 200),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects-minimal'],
    queryFn: () => base44.entities.Project.list('-created_date', 100),
  });

  const create = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); setShowForm(false); setForm({ title: '', description: '', assigned_to: '', priority: 'Medium', due_date: '', status: 'To Do' }); },
  });

  const update = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const remove = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const filtered = tasks.filter(t => {
    if (filter === 'mine') return t.assigned_to && t.assigned_to.toLowerCase().includes('me');
    if (filter === 'urgent') return t.priority === 'Urgent' || t.priority === 'High';
    if (filter === 'overdue') return t.due_date && new Date(t.due_date) < new Date() && t.status !== 'Completed';
    return true;
  });

  const byColumn = (col) => filtered.filter(t => t.status === col);
  const totalOpen = tasks.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled').length;
  const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'Completed').length;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Task Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">{totalOpen} attivi · {overdue > 0 ? <span className="text-red-500">{overdue} scaduti</span> : '0 scaduti'}</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium"
          style={{ backgroundColor: '#1147FF' }}>
          <Plus className="w-4 h-4" /> Nuovo Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[['all','Tutti'],['urgent','Urgenti'],['overdue','Scaduti']].map(([v,l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filter === v ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Kanban board */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map(col => (
            <div key={col} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {col === 'To Do' && <Clock className="w-3.5 h-3.5 text-gray-400" />}
                  {col === 'In Progress' && <Loader2 className="w-3.5 h-3.5 text-blue-500" />}
                  {col === 'Waiting' && <AlertCircle className="w-3.5 h-3.5 text-yellow-500" />}
                  {col === 'Completed' && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                  <span className="text-xs font-semibold text-gray-700">{col}</span>
                </div>
                <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{byColumn(col).length}</span>
              </div>
              <div className="space-y-2 min-h-16">
                {byColumn(col).map(task => (
                  <TaskCard key={task.id} task={task}
                    onMove={(id, status) => update.mutate({ id, data: { status } })}
                    onDelete={(id) => remove.mutate(id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Nuovo Task</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Titolo *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Descrizione</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-blue-400" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Priorità</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
                  {['Low','Medium','High','Urgent'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Scadenza</label>
                <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Assegnato a</label>
              <input value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
                placeholder="Nome o email" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Progetto (opzionale)</label>
              <select value={form.project_id || ''} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
                <option value="">— Nessuno —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => create.mutate(form)} disabled={!form.title.trim() || create.isPending}
                className="flex-1 py-2.5 text-sm text-white rounded-lg font-medium disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#1147FF' }}>
                {create.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crea Task'}
              </button>
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-600">Annulla</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}