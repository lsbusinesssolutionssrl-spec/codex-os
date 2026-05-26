import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
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
    // In-app toast
    if (type === 'success') toast.success(message);
    else if (type === 'warning') toast.warning(message);
    else if (type === 'ticket') toast.info(message);
    else toast.message(message);
    // Browser push
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

    // Ticket notifications
    const unsubTicket = base44.entities.SupportTicket.subscribe(async (event) => {
      const user = await base44.auth.me();
      if (event.type === 'create') {
        addNotification(`🎫 Nuovo ticket: ${event.data?.title || 'N/A'}`, 'ticket');
      } else if (event.type === 'update') {
        // Assignment notification (only for assigned technician)
        if (event.data?.assigned_technician && user?.full_name === event.data.assigned_technician) {
          addNotification(`👷 Ticket assegnato a te: ${event.data?.title || 'N/A'}`, 'assignment');
        }
        // Status change notification
        if (['Resolved','Closed'].includes(event.data?.status)) {
          addNotification(`✅ Ticket risolto: ${event.data?.title || 'N/A'}`, 'success');
        }
      }
    });

    // Checklist notifications with photo upload detection
    const unsubChecklist = base44.entities.ChecklistItem.subscribe(async (event) => {
      const user = await base44.auth.me();
      if (event.type === 'update') {
        if (event.data?.status === 'Done') {
          addNotification(`✅ Checklist completata: ${event.data?.title || 'N/A'}`, 'success');
        }
        if (event.data?.is_anomaly) {
          addNotification(`⚠️ Anomalia segnalata: ${event.data?.title || 'N/A'}`, 'warning');
        }
        // Photo upload notification
        if (event.old_data?.photos && event.data?.photos && 
            event.data.photos.length > event.old_data.photos.length) {
          addNotification(`📷 Nuove foto caricate: ${event.data?.title || 'N/A'}`, 'info');
        }
      }
    });

    // Project notifications
    const unsubProject = base44.entities.Project.subscribe(async (event) => {
      const user = await base44.auth.me();
      if (event.type === 'update') {
        if (event.data?.status) {
          addNotification(`📁 Progetto "${event.data?.title || 'N/A'}" → ${event.data.status}`, 'info');
        }
        // Photo upload in project galleries
        const photoKeys = ['photos_before', 'photos_during', 'photos_after'];
        for (const key of photoKeys) {
          if (event.old_data?.[key] && event.data?.[key] && 
              event.data[key].length > event.old_data[key].length) {
            addNotification(`📷 Nuove foto nel progetto: ${event.data?.title || 'N/A'}`, 'info');
            break;
          }
        }
      }
    });

    const unsubEstimate = base44.entities.Estimate.subscribe((event) => {
      if (event.type === 'update' && ['Accepted','Rejected'].includes(event.data?.status)) {
        const icon = event.data.status === 'Accepted' ? '🎉' : '❌';
        addNotification(`${icon} Preventivo ${event.data.status}: ${event.data?.title || 'N/A'}`, event.data.status === 'Accepted' ? 'success' : 'warning');
      }
    });

    // Deadline reminders - check every 5 minutes
    const checkDeadlines = async () => {
      try {
        const user = await base44.auth.me();
        if (!user) return;
        
        const projects = await base44.entities.Project.list();
        const now = new Date();
        const fourteenDaysFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        
        projects.forEach(p => {
          if (p.expected_end_date) {
            const endDate = new Date(p.expected_end_date);
            const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
            
            // Notify if deadline is within 14 days and not already delivered
            if (daysLeft > 0 && daysLeft <= 14 && p.status !== 'Delivered') {
              const urgency = daysLeft <= 3 ? '⚠️ URGENTE:' : '📅 Scadenza:';
              addNotification(`${urgency} ${p.title} scade tra ${daysLeft} giorni`, 'warning');
            }
          }
        });
      } catch (error) {
        console.error('Error checking deadlines:', error);
      }
    };

    // Check deadlines on mount and every 5 minutes
    checkDeadlines();
    const deadlineInterval = setInterval(checkDeadlines, 5 * 60 * 1000);

    return () => { 
      unsubTicket(); 
      unsubChecklist(); 
      unsubProject(); 
      unsubEstimate();
      clearInterval(deadlineInterval);
    };
  }, [addNotification, requestPermission]);

  return { notifications, unread, markAllRead, addNotification };
}