import { useState, useRef, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

const typeColors = {
  ticket: 'bg-blue-100 text-blue-700',
  assignment: 'bg-purple-100 text-purple-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-orange-100 text-orange-700',
  info: 'bg-gray-100 text-gray-700',
  deadline: 'bg-red-100 text-red-700',
  photo: 'bg-pink-100 text-pink-700',
};

const typeIcons = {
  ticket: '🎫',
  assignment: '👷',
  success: '✅',
  warning: '⚠️',
  info: 'ℹ️',
  deadline: '📅',
  photo: '📷',
};

export default function NotificationBell() {
  const { notifications, unread, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen(o => !o);
    if (!open) markAllRead();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center font-bold"
            style={{ backgroundColor: '#F58220', fontSize: '10px' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-sm text-gray-900">Notifiche</span>
            <button onClick={() => setOpen(false)}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">Nessuna notifica</div>
            ) : notifications.map(n => {
              const icon = typeIcons[n.type] || 'ℹ️';
              const color = typeColors[n.type] || typeColors.info;
              return (
                <div key={n.id} className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-start gap-2">
                    <span className="text-lg flex-shrink-0">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">{n.message}</p>
                      <div className="flex items-center gap-2 flex items-center mt-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${color}`}>
                          {n.type}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(n.time).toLocaleString('it-IT', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}