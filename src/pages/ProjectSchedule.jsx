import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, FolderKanban, Wrench, CheckSquare, Clock, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const MONTHS = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];

const TYPE_COLORS = {
  project:     { bg: '#1147FF', light: '#EEF2FF', text: '#1147FF' },
  maintenance: { bg: '#8B5CF6', light: '#F5F3FF', text: '#8B5CF6' },
  ticket:      { bg: '#EF4444', light: '#FEF2F2', text: '#EF4444' },
  checklist:   { bg: '#10B981', light: '#ECFDF5', text: '#10B981' },
};

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isInRange(day, start, end) {
  const d = day.getTime();
  const s = start ? new Date(start).setHours(0,0,0,0) : null;
  const e = end ? new Date(end).setHours(23,59,59,999) : null;
  if (s && e) return d >= s && d <= e;
  if (s) return isSameDay(day, new Date(start));
  return false;
}

function EventPill({ event, onClick }) {
  const colors = TYPE_COLORS[event.type] || TYPE_COLORS.project;
  return (
    <div
      onClick={e => { e.stopPropagation(); onClick(event); }}
      className="text-xs px-1.5 py-0.5 rounded font-medium truncate cursor-pointer hover:opacity-80 transition-opacity"
      style={{ backgroundColor: colors.light, color: colors.text, borderLeft: `3px solid ${colors.bg}` }}
      title={event.title}
    >
      {event.title}
    </div>
  );
}

function DayCell({ date, events, isToday, isCurrentMonth, onClick, onEventClick }) {
  const dayEvents = events.filter(e => isInRange(date, e.start, e.end));
  return (
    <div
      onClick={() => onClick(date)}
      className={`min-h-[90px] p-1.5 border-b border-r border-gray-100 cursor-pointer hover:bg-gray-50/50 transition-colors ${!isCurrentMonth ? 'bg-gray-50/30' : 'bg-white'}`}
    >
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mb-1 ${
        isToday ? 'text-white' : isCurrentMonth ? 'text-gray-700' : 'text-gray-300'
      }`} style={isToday ? { backgroundColor: '#1147FF' } : {}}>
        {date.getDate()}
      </div>
      <div className="space-y-0.5">
        {dayEvents.slice(0, 3).map(e => <EventPill key={e.id} event={e} onClick={onEventClick} />)}
        {dayEvents.length > 3 && <p className="text-xs text-gray-400 pl-1">+{dayEvents.length - 3} altri</p>}
      </div>
    </div>
  );
}

export default function ProjectSchedule() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      const [projects, maintenance, tickets, checklists] = await Promise.all([
        base44.entities.Project.list(),
        base44.entities.MaintenanceSchedule.list(),
        base44.entities.SupportTicket.list('-created_date', 50),
        base44.entities.ChecklistItem.filter({ status: 'To Do' }),
      ]);

      const evts = [];

      projects.forEach(p => {
        if (p.start_date || p.expected_end_date) {
          evts.push({
            id: `proj-${p.id}`,
            entityId: p.id,
            type: 'project',
            title: p.title,
            start: p.start_date,
            end: p.expected_end_date || p.start_date,
            status: p.status,
            path: `/projects/${p.id}`,
            meta: p.status,
          });
        }
      });

      maintenance.forEach(m => {
        if (m.next_due_date) {
          evts.push({
            id: `maint-${m.id}`,
            entityId: m.id,
            type: 'maintenance',
            title: m.title,
            start: m.next_due_date,
            end: m.next_due_date,
            path: '/maintenance',
            meta: m.maintenance_type,
          });
        }
      });

      tickets.filter(t => t.status === 'Open' || t.status === 'In Progress').slice(0, 20).forEach(t => {
        evts.push({
          id: `ticket-${t.id}`,
          entityId: t.id,
          type: 'ticket',
          title: t.title,
          start: t.created_date,
          end: t.created_date,
          path: `/tickets/${t.id}`,
          meta: t.priority,
        });
      });

      checklists.filter(c => c.due_date).forEach(c => {
        evts.push({
          id: `check-${c.id}`,
          entityId: c.id,
          type: 'checklist',
          title: c.title,
          start: c.due_date,
          end: c.due_date,
          path: `/checklists/${c.id}`,
          meta: c.assigned_person,
        });
      });

      setEvents(evts);
      setLoading(false);
    };
    load();
  }, []);

  const filteredEvents = typeFilter === 'all' ? events : events.filter(e => e.type === typeFilter);

  // Month grid
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // Monday first
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calDays = [];
  for (let i = 0; i < startOffset; i++) {
    calDays.push(new Date(year, month, -startOffset + i + 1));
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calDays.push(new Date(year, month, i));
  }
  while (calDays.length % 7 !== 0) {
    calDays.push(new Date(year, month + 1, calDays.length - daysInMonth - startOffset + 1));
  }

  const today = new Date();

  const goBack = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goNext = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const totalEvents = filteredEvents.length;
  const thisMonth = filteredEvents.filter(e => {
    const s = new Date(e.start);
    return s.getMonth() === month && s.getFullYear() === year;
  }).length;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5" style={{ color: '#1147FF' }} />
            Scheduling
          </h1>
          <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg">
            {['month','week'].map(v => (
              <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${view === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                {v === 'month' ? 'Mese' : 'Settimana'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Type filters */}
          <div className="flex items-center gap-1">
            {[['all','Tutto'],['project','Progetti'],['maintenance','Manutenzioni'],['ticket','Ticket'],['checklist','Checklist']].map(([id, label]) => {
              const colors = TYPE_COLORS[id];
              return (
                <button
                  key={id}
                  onClick={() => setTypeFilter(id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all border ${typeFilter === id ? 'shadow-sm' : 'border-transparent'}`}
                  style={typeFilter === id && colors ? { backgroundColor: colors.light, color: colors.text, borderColor: colors.bg } : { color: '#6B7280', borderColor: 'transparent' }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Nav */}
          <div className="flex items-center gap-1 ml-2">
            <button onClick={goBack} className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronLeft className="w-4 h-4 text-gray-600" /></button>
            <button onClick={goToday} className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50">Oggi</button>
            <button onClick={goNext} className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronRight className="w-4 h-4 text-gray-600" /></button>
          </div>
          <span className="text-sm font-semibold text-gray-900 ml-1">{MONTHS[month]} {year}</span>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-6 px-6 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 flex-shrink-0">
        <span>{thisMonth} eventi questo mese</span>
        {Object.entries(TYPE_COLORS).map(([type, colors]) => {
          const count = filteredEvents.filter(e => e.type === type && new Date(e.start).getMonth() === month && new Date(e.start).getFullYear() === year).length;
          if (count === 0) return null;
          return (
            <span key={type} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.bg }} />
              {count} {type === 'project' ? 'progetti' : type === 'maintenance' ? 'manutenzioni' : type === 'ticket' ? 'ticket' : 'checklist'}
            </span>
          );
        })}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">Caricamento calendario...</div>
      ) : (
        <div className="flex-1 overflow-auto">
          {/* Month view */}
          {view === 'month' && (
            <div className="min-w-[700px]">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 border-b border-gray-200">
                {WEEKDAYS.map(d => (
                  <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 border-r border-gray-100 last:border-r-0">
                    {d}
                  </div>
                ))}
              </div>
              {/* Calendar grid */}
              <div className="grid grid-cols-7">
                {calDays.map((date, idx) => (
                  <DayCell
                    key={idx}
                    date={date}
                    events={filteredEvents}
                    isToday={isSameDay(date, today)}
                    isCurrentMonth={date.getMonth() === month}
                    onClick={() => {}}
                    onEventClick={setSelectedEvent}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Week view */}
          {view === 'week' && (
            <WeekView currentDate={currentDate} events={filteredEvents} onEventClick={setSelectedEvent} />
          )}
        </div>
      )}

      {/* Event detail panel */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: TYPE_COLORS[selectedEvent.type]?.bg }} />
                <span className="text-xs font-medium text-gray-500 capitalize">{selectedEvent.type}</span>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">{selectedEvent.title}</h3>
            {selectedEvent.meta && <p className="text-sm text-gray-500 mb-1">{selectedEvent.meta}</p>}
            {selectedEvent.start && (
              <p className="text-sm text-gray-400 mb-4">
                {new Date(selectedEvent.start).toLocaleDateString('it-IT')}
                {selectedEvent.end && selectedEvent.end !== selectedEvent.start && ` → ${new Date(selectedEvent.end).toLocaleDateString('it-IT')}`}
              </p>
            )}
            <button
              onClick={() => { navigate(selectedEvent.path); setSelectedEvent(null); }}
              className="w-full py-2.5 text-sm text-white rounded-lg font-medium"
              style={{ backgroundColor: '#1147FF' }}
            >
              Apri dettaglio →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function WeekView({ currentDate, events, onEventClick }) {
  const startOfWeek = new Date(currentDate);
  const day = (currentDate.getDay() + 6) % 7;
  startOfWeek.setDate(currentDate.getDate() - day);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const today = new Date();

  return (
    <div className="min-w-[700px]">
      <div className="grid grid-cols-7 border-b border-gray-200">
        {days.map((d, i) => {
          const isToday = isSameDay(d, today);
          return (
            <div key={i} className={`py-3 text-center border-r border-gray-100 last:border-r-0 ${isToday ? 'bg-blue-50' : ''}`}>
              <p className="text-xs text-gray-400">{WEEKDAYS[i]}</p>
              <p className={`text-lg font-bold mt-0.5 ${isToday ? 'text-blue-600' : 'text-gray-800'}`}>{d.getDate()}</p>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-7 min-h-[400px]">
        {days.map((d, i) => {
          const dayEvts = events.filter(e => isInRange(d, e.start, e.end));
          const isToday = isSameDay(d, today);
          return (
            <div key={i} className={`p-2 border-r border-gray-100 last:border-r-0 space-y-1 ${isToday ? 'bg-blue-50/30' : ''}`}>
              {dayEvts.map(e => <EventPill key={e.id} event={e} onClick={onEventClick} />)}
            </div>
          );
        })}
      </div>
    </div>
  );
}