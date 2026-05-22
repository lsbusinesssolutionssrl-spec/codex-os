import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const QUEUE_KEY = 'codex_offline_queue';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueCount, setQueueCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const getQueue = () => {
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; }
  };

  const addToQueue = useCallback((action) => {
    const queue = getQueue();
    const item = { ...action, queueId: Date.now() };
    queue.push(item);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    setQueueCount(queue.length);
  }, []);

  const syncQueue = useCallback(async () => {
    const queue = getQueue();
    if (!queue.length || syncing) return;
    setSyncing(true);
    const failed = [];
    for (const action of queue) {
      try {
        if (action.type === 'update') {
          await base44.entities[action.entity].update(action.id, action.data);
        } else if (action.type === 'create') {
          await base44.entities[action.entity].create(action.data);
        }
      } catch {
        failed.push(action);
      }
    }
    localStorage.setItem(QUEUE_KEY, JSON.stringify(failed));
    setQueueCount(failed.length);
    setSyncing(false);
  }, [syncing]);

  useEffect(() => {
    setQueueCount(getQueue().length);
    const handleOnline = () => { setIsOnline(true); syncQueue(); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, queueCount, syncing, addToQueue, syncQueue };
}