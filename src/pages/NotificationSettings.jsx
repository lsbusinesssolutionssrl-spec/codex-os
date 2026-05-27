import { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, Smartphone, Calendar, Users, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

/**
 * Notification System - Multi-channel notification management
 * 
 * Supports:
 * - In-app notifications (current)
 * - Email (placeholder)
 * - SMS (placeholder)
 * - WhatsApp (placeholder)
 * - Push notifications (placeholder)
 */

const CHANNELS = [
  { id: 'in_app', name: 'In-App', icon: Bell, color: '#3B82F6', enabled: true },
  { id: 'email', name: 'Email', icon: Mail, color: '#0B2341', enabled: false, coming_soon: true },
  { id: 'sms', name: 'SMS', icon: Smartphone, color: '#10B981', enabled: false, coming_soon: true },
  { id: 'whatsapp', name: 'WhatsApp', icon: MessageSquare, color: '#25D366', enabled: false, coming_soon: true },
  { id: 'push', name: 'Push', icon: Bell, color: '#8B5CF6', enabled: false, coming_soon: true },
];

const NOTIFICATION_TYPES = [
  { id: 'project_status', name: 'Cambiamento stato progetto', channels: ['in_app', 'email'] },
  { id: 'ticket_created', name: 'Nuovo ticket', channels: ['in_app', 'email', 'sms'] },
  { id: 'ticket_urgent', name: 'Ticket urgente', channels: ['in_app', 'email', 'sms', 'whatsapp'] },
  { id: 'task_assigned', name: 'Task assegnato', channels: ['in_app'] },
  { id: 'approval_pending', name: 'Approvazione in attesa', channels: ['in_app', 'email'] },
  { id: 'deadline_approaching', name: 'Scadenza imminente', channels: ['in_app', 'email'] },
  { id: 'financial_alert', name: 'Alert finanziario', channels: ['in_app', 'email', 'sms'] },
  { id: 'guardian_renewal', name: 'Rinnovo Guardian', channels: ['in_app', 'email', 'whatsapp'] },
];

export default function NotificationSettings() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // Future: Load from user preferences
      const defaultSettings = {};
      NOTIFICATION_TYPES.forEach(type => {
        defaultSettings[type.id] = {
          enabled: true,
          channels: type.channels,
        };
      });
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const toggleNotification = (typeId) => {
    setSettings(prev => ({
      ...prev,
      [typeId]: {
        ...prev[typeId],
        enabled: !prev[typeId].enabled,
      },
    }));
  };

  const toggleChannel = (typeId, channelId) => {
    setSettings(prev => {
      const currentChannels = prev[typeId].channels;
      const newChannels = currentChannels.includes(channelId)
        ? currentChannels.filter(c => c !== channelId)
        : [...currentChannels, channelId];
      
      return {
        ...prev,
        [typeId]: {
          ...prev[typeId],
          channels: newChannels,
        },
      };
    });
  };

  const saveSettings = async () => {
    // Future: Save to backend
    toast.success('Impostazioni salvate');
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-400">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Caricamento...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-500" />
            Impostazioni Notifiche
          </h1>
          <p className="text-sm text-gray-500 mt-1">Gestisci canali e preferenze di notifica</p>
        </div>
        <button
          onClick={saveSettings}
          className="px-4 py-2 text-sm text-white rounded-lg font-medium"
          style={{ backgroundColor: '#1147FF' }}
        >
          Salva
        </button>
      </div>

      {/* Available Channels */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Canali Disponibili</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {CHANNELS.map(channel => {
            const Icon = channel.icon;
            return (
              <div
                key={channel.id}
                className={`p-3 rounded-lg border text-center ${
                  channel.enabled
                    ? 'border-blue-200 bg-blue-50'
                    : channel.coming_soon
                    ? 'border-gray-200 bg-gray-50 opacity-60'
                    : 'border-gray-200'
                }`}
              >
                <Icon className={`w-5 h-5 mx-auto mb-1 ${channel.enabled ? 'text-blue-600' : 'text-gray-400'}`} />
                <p className="text-xs font-medium text-gray-700">{channel.name}</p>
                {channel.coming_soon && (
                  <p className="text-[10px] text-gray-400 mt-0.5">Prossimamente</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Notification Types */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Tipologie di Notifica</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {NOTIFICATION_TYPES.map(type => {
            const setting = settings[type.id] || { enabled: true, channels: type.channels };
            return (
              <div key={type.id} className="px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleNotification(type.id)}
                      className={`w-10 h-6 rounded-full transition-colors ${
                        setting.enabled ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          setting.enabled ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                    <span className="text-sm font-medium text-gray-900">{type.name}</span>
                  </div>
                </div>
                
                {setting.enabled && (
                  <div className="pl-13 flex gap-2">
                    {type.channels.map(channelId => {
                      const channel = CHANNELS.find(c => c.id === channelId);
                      const Icon = channel?.icon || Bell;
                      const isEnabled = setting.channels.includes(channelId);
                      
                      return (
                        <button
                          key={channelId}
                          onClick={() => toggleChannel(type.id, channelId)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all ${
                            isEnabled
                              ? 'border-blue-200 bg-blue-50 text-blue-700'
                              : channel?.coming_soon
                              ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                          disabled={channel?.coming_soon}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {channel?.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Test Notification */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Test Notifica</h2>
        <p className="text-xs text-gray-500 mb-3">Invia una notifica di test per verificare la configurazione</p>
        <button
          onClick={() => {
            toast.success('Notifica di test inviata!');
            // Future: Actually send test notification
          }}
          className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          Invia Test
        </button>
      </div>
    </div>
  );
}