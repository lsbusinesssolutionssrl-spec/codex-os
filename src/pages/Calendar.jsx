import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StatusBadge from '../components/StatusBadge';

const MONTHS_IT = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
const DAYS_IT = ['Lu','Ma','Me','Gi','Ve','Sa','Do'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Mon=0
}

export default function Calendar() {
  const navigate = useNavigate();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    const load = async () => {
      const [checklists, projects, estimates] = await Promise.all([
        base44.entities.ChecklistItem.list(),
        base44.entities.Project.list(),
        base44.entities.Estimate.list(),
      ]);

      const ev = [];
      checklists.forEach(c => {
        if (c.due_date) ev.push({ date: c.due_date, label: c.title, type: 'checklist', id: c.id, path: '/checklists', status: c.status, color: 'bg-blue-500' });
      });
      projects.forEach(p => {
        if (p.expected_end_date) ev.push({ date: p.expected_end_date, label: p.title, type: 'project', id: p.id, path: '/projects', status: p.status, color: 'bg-purple-500' });
        if (p.start_date) ev.push({ date: p.start_date, label: `▶ ${p.title}`, type: 'project', id: p.id, path: '/projects', status: p.status, color: 'bg-green-500' });
      });
      estimates.forEach(e => {
        if (e.expiration_date) ev.push({ date: e.expiration_date, label: e.title, type: 'estimate', id: e.id, path: '/estimates', status: e.status, color: 'bg-orange-500' });
      });
      setEvents(ev);
    };
    load();
  }, []);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const eventsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date?.startsWith(dateStr));
  };

  const selectedEvents = selectedDay ? eventsForDay(selectedDay) : [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendario Scadenze</h1>
          <p className="text-sm text-gray-500">{events.length} eventi totali</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 border border-gray-200">
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-base font-semibold text-gray-800 w-40 text-center">{MONTHS_IT[month]} {year}</span>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 border border-gray-200">
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />Checklist</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />Inizio Progetto</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />Fine Progetto</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />Preventivo</div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAYS_IT.map(d => (
            <div key={d} className="py-2.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-24 border-b border-r border-gray-50" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEvents = eventsForDay(day);
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const isSelected = selectedDay === day;
            return (
              <div
                key={day}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`h-24 border-b border-r border-gray-50 p-1.5 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
              >
                <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold mb-1 ${isToday ? 'text-white' : 'text-gray-700'}`}
                  style={isToday ? { backgroundColor: '#1147FF' } : {}}>
                  {day}
                </div>
                <div className="space-y-0.5 overflow-hidden">
                  {dayEvents.slice(0, 3).map((ev, idx) => (
                    <div key={idx} className={`flex items-center gap-1 px-1 rounded text-xs truncate ${ev.color.replace('bg-', 'bg-').replace('-500', '-100')} text-gray-700`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ev.color}`} />
                      <span className="truncate">{ev.label}</span>
                    </div>
                  ))}
                  {dayEvents.length > 3 && <div className="text-xs text-gray-400 pl-1">+{dayEvents.length - 3}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected day panel */}
      {selectedDay && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">{selectedDay} {MONTHS_IT[month]} {year}</h2>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-gray-400">Nessun evento in questo giorno</p>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map((ev, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate(`${ev.path}/${ev.id}`)}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${ev.color}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{ev.label}</p>
                      <p className="text-xs text-gray-400 capitalize">{ev.type}</p>
                    </div>
                  </div>
                  {ev.status && <StatusBadge status={ev.status} />}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}