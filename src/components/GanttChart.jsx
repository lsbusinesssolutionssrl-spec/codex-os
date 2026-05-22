import { useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DAY_W = 32;
const ROW_H = 44;
const LABEL_W = 200;

const STATUS_COLORS = {
  'Lead': '#94a3b8', 'Survey': '#a78bfa', 'Estimate': '#60a5fa',
  'Approved': '#34d399', 'In Progress': '#1147FF', 'Testing': '#fb923c',
  'Delivered': '#10b981', 'Guardian Active': '#F58220',
};

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

export default function GanttChart({ projects = [], onUpdateDates }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [offset, setOffset] = useState(0); // days offset from today
  const dragging = useRef(null);

  const viewStart = addDays(today, offset - 7);
  const totalDays = 60;

  const days = Array.from({ length: totalDays }, (_, i) => addDays(viewStart, i));

  const handleMouseDown = (e, project, type) => {
    e.preventDefault();
    dragging.current = { project, type, startX: e.clientX, origStart: project.start_date, origEnd: project.expected_end_date };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = useCallback((e) => {
    if (!dragging.current) return;
    const { project, type, startX, origStart, origEnd } = dragging.current;
    const deltaX = e.clientX - startX;
    const deltaDays = Math.round(deltaX / DAY_W);
    if (deltaDays === 0) return;

    let newStart = origStart ? addDays(origStart, deltaDays).toISOString().split('T')[0] : null;
    let newEnd = origEnd ? addDays(origEnd, deltaDays).toISOString().split('T')[0] : null;

    if (type === 'start') newEnd = origEnd;
    if (type === 'end') newStart = origStart;

    if (onUpdateDates) onUpdateDates(project.id, newStart, newEnd);
  }, [onUpdateDates]);

  const handleMouseUp = useCallback(() => {
    dragging.current = null;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const getBarStyle = (project) => {
    if (!project.start_date || !project.expected_end_date) return null;
    const left = daysBetween(viewStart, project.start_date);
    const width = Math.max(1, daysBetween(project.start_date, project.expected_end_date));
    const color = STATUS_COLORS[project.status] || '#1147FF';
    return { left: left * DAY_W, width: width * DAY_W, color };
  };

  const todayLeft = daysBetween(viewStart, today) * DAY_W;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-900">Timeline Gantt</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setOffset(o => o - 14)} className="p-1.5 rounded hover:bg-gray-100">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setOffset(0)} className="px-3 py-1 text-xs rounded-lg border border-gray-200 hover:bg-gray-50">Oggi</button>
          <button onClick={() => setOffset(o => o + 14)} className="p-1.5 rounded hover:bg-gray-100">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: LABEL_W + totalDays * DAY_W }}>
          {/* Date header */}
          <div className="flex border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
            <div className="flex-shrink-0 border-r border-gray-200 px-3 flex items-center" style={{ width: LABEL_W }}>
              <span className="text-xs font-medium text-gray-500">Progetto</span>
            </div>
            <div className="flex relative" style={{ width: totalDays * DAY_W }}>
              {days.map((d, i) => {
                const isToday = d.toDateString() === today.toDateString();
                const isMon = d.getDay() === 1;
                return (
                  <div
                    key={i}
                    style={{ width: DAY_W }}
                    className={`flex-shrink-0 h-8 border-r flex items-center justify-center text-xs ${
                      isToday ? 'text-blue-600 font-bold' : isMon ? 'text-gray-600 font-medium' : 'text-gray-300'
                    } ${isMon || isToday ? 'border-gray-300' : 'border-gray-100'}`}
                  >
                    {(d.getDate() === 1 || i === 0 || isMon) ? d.getDate() : ''}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rows */}
          {projects.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400 px-4">Nessun progetto con date definite</div>
          ) : projects.map((project) => {
            const bar = getBarStyle(project);
            return (
              <div key={project.id} className="flex border-b border-gray-50 hover:bg-gray-50/50" style={{ height: ROW_H }}>
                <div className="flex-shrink-0 border-r border-gray-100 px-3 flex items-center gap-2 overflow-hidden" style={{ width: LABEL_W }}>
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: STATUS_COLORS[project.status] || '#94a3b8' }}
                  />
                  <span className="text-xs font-medium text-gray-800 truncate">{project.title}</span>
                </div>
                <div className="relative flex-shrink-0" style={{ width: totalDays * DAY_W, height: ROW_H }}>
                  {/* Today line */}
                  {todayLeft >= 0 && todayLeft <= totalDays * DAY_W && (
                    <div className="absolute top-0 bottom-0 w-px bg-blue-400/60 z-10" style={{ left: todayLeft }} />
                  )}
                  {/* Grid lines */}
                  {days.map((d, i) => d.getDay() === 1 && (
                    <div key={i} className="absolute top-0 bottom-0 w-px bg-gray-100" style={{ left: i * DAY_W }} />
                  ))}
                  {/* Bar */}
                  {bar && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 rounded-md cursor-grab active:cursor-grabbing flex items-center select-none shadow-sm"
                      style={{ left: bar.left, width: Math.max(bar.width, 8), height: 26, backgroundColor: bar.color + 'cc', border: `1.5px solid ${bar.color}` }}
                      onMouseDown={(e) => handleMouseDown(e, project, 'bar')}
                      title={`${project.title}: ${project.start_date} → ${project.expected_end_date}`}
                    >
                      <div
                        className="w-1.5 h-full rounded-l-md cursor-ew-resize opacity-0 hover:opacity-100 bg-white/40"
                        onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, project, 'start'); }}
                      />
                      {bar.width > 40 && (
                        <span className="text-white text-xs font-medium px-2 truncate flex-1" style={{ fontSize: 10 }}>
                          {project.title}
                        </span>
                      )}
                      <div
                        className="w-1.5 h-full rounded-r-md cursor-ew-resize opacity-0 hover:opacity-100 bg-white/40 ml-auto"
                        onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, project, 'end'); }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-t border-gray-100 flex flex-wrap gap-3">
        {Object.entries(STATUS_COLORS).map(([s, c]) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: c }} />
            <span className="text-xs text-gray-500">{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}