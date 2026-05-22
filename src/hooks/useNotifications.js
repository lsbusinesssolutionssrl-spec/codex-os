import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

export function useNotifications() {
  const [notifications, setNotifications] = useState(() => {
    try { return JSON.parse(localStorage.getItem('codex_notifications') || '[]'); } catch { return []; }
  });
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    setUnread(notifications.filter(n => !n.read).length);
  }, [notifications]);

  const save = (list) => {
    localStorage.setItem('codex_notifications', JSON.stringify(list.slice(0, 30)));
    setNotifications(list.slice(0, 30));
  };

  const addNotification = useCallback((message, type = 'info') => {
    const notif = { id: Date.now(), message, type, time: new Date().toISOString(), read: false };
    setNotifications(prev => {
      const updated = [notif, ...prev.slice(0, 29)];
      localStorage.setItem('codex_notifications', JSON.stringify(updated));
      return updated;
    });
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Codex OS', { body: message, icon: '/favicon.ico' });
    }
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      localStorage.setItem('codex_notifications', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const requestPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    requestPermission();

    const unsubTicket = base44.entities.SupportTicket.subscribe((event) => {
      if (event.type === 'create') {
        addNotification(`🎫 Nuovo ticket: ${event.data?.title || 'N/A'}`, 'ticket');
      } else if (event.type === 'update' && event.data?.assigned_technician) {
        addNotification(`👷 Ticket assegnato: ${event.data?.title || 'N/A'}`, 'assignment');
      }
    });

    const unsubChecklist = base44.entities.ChecklistItem.subscribe((event) => {
      if (event.type === 'update') {
        if (event.data?.status === 'Done') {
          addNotification(`✅ Checklist completata: ${event.data?.title || 'N/A'}`, 'success');
        }
        if (event.data?.is_anomaly) {
          addNotification(`⚠️ Anomalia segnalata: ${event.data?.title || 'N/A'}`, 'warning');
        }
      }
    });

    return () => { unsubTicket(); unsubChecklist(); };
  }, [addNotification, requestPermission]);

  return { notifications, unread, markAllRead, addNotification };
}