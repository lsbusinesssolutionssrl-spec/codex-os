import { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, Smartphone, Zap, Save, Trash2, Plus, X, Globe, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { hasRole } from '@/lib/roleUtils';
import { toast } from 'sonner';

const NOTIFICATION_CHANNELS = [
  { id: 'email', label: 'Email', icon: Mail, color: '#3B82F6' },
  { id: 'sms', label: 'SMS', icon: Smartphone, color: '#10B981' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, color: '#25D366' },
  { id: 'push', label: 'Push Notification', icon: Bell, color: '#F59E0B' },
];

const EVENT_TYPES = [
  { id: 'estimate.accepted', label: 'Preventivo Accettato', icon: CheckCircle2, category: 'Sales' },
  { id: 'estimate.rejected', label: 'Preventivo Rifiutato', icon: X, category: 'Sales' },
  { id: 'project.created', label: 'Progetto Creato', icon: Plus, category: 'Project' },
  { id: 'project.delivered', label: 'Progetto Consegnato', icon: CheckCircle2, category: 'Project' },
  { id: 'project.delayed', label: 'Progetto in Ritardo', icon: AlertTriangle, category: 'Project' },
  { id: 'ticket.created', label: 'Ticket Creato', icon: Bell, category: 'Support' },
  { id: 'ticket.urgent', label: 'Ticket Urgente', icon: AlertTriangle, category: 'Support' },
  { id: 'ticket.closed', label: 'Ticket Chiuso', icon: CheckCircle2, category: 'Support' },
  { id: 'workflow.executed', label: 'Workflow Eseguito', icon: Zap, category: 'Automation' },
  { id: 'workflow.failed', label: 'Workflow Fallito', icon: AlertTriangle, category: 'Automation' },
  { id: 'maintenance.due', label: 'Manutenzione Programmata', icon: Calendar, category: 'Maintenance' },
  { id: 'guardian.renewed', label: 'Guardian Rinnovato', icon: CheckCircle2, category: 'Guardian' },
  { id: 'guardian.expiring', label: 'Guardian in Scadenza', icon: AlertTriangle, category: 'Guardian' },
  { id: 'payment.received', label: 'Pagamento Ricevuto', icon: CheckCircle2, category: 'Financial' },
  { id: 'payment.overdue', label: 'Pagamento in Ritardo', icon: AlertTriangle, category: 'Financial' },
  { id: 'iot.alert', label: 'Alert IoT', icon: Zap, category: 'IoT' },
];

export default function NotificationSettings() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newSubscription, setNewSubscription] = useState({
    event_type: '',
    channels: [],
    recipients: '',
  });

  useEffect(() => {
    hasRole(['admin', 'company_admin']).then(auth => {
      if (!auth) {
        return;
      }
      setIsAuthorized(true);
    });
  }, []);

  useEffect(() => {
    if (!isAuthorized) return;
    
    const load = async () => {
      const data = await base44.entities.WebhookSubscription.list();
      setSubscriptions(data);
      setLoading(false);
    };
    load();
  }, [isAuthorized]);

  const handleAddSubscription = async () => {
    if (!newSubscription.event_type || newSubscription.channels.length === 0) {
      toast.error('Seleziona almeno un evento e un canale');
      return;
    }

    await base44.entities.WebhookSubscription.create({
      name: `Notification: ${EVENT_TYPES.find(e => e.id === newSubscription.event_type)?.label}`,
      endpoint_url: 'internal://notifications',
      events: [newSubscription.event_type],
      config: {
        channels: newSubscription.channels,
        recipients: newSubscription.recipients,
      },
      status: 'Active',
    });

    const data = await base44.entities.WebhookSubscription.list();
    setSubscriptions(data);
    setShowModal(false);
    setNewSubscription({ event_type: '', channels: [], recipients: '' });
    toast.success('Notifica configurata');
  };

  const handleDelete = async (sub) => {
    await base44.entities.WebhookSubscription.delete(sub.id);
    setSubscriptions(prev => prev.filter(s => s.id !== sub.id));
    toast.success('Notifica eliminata');
  };

  const handleToggle = async (sub) => {
    const newStatus = sub.status === 'Active' ? 'Inactive' : 'Active';
    await base44.entities.WebhookSubscription.update(sub.id, { status: newStatus });
    setSubscriptions(prev => prev.map(s => s.id === sub.id ? { ...s, status: newStatus } : s));
    toast.success(`Notifica ${newStatus === 'Active' ? 'attivata' : 'disattivata'}`);
  };

  if (!isAuthorized) return null;
  if (loading) return <div className="p-6 text-center text-gray-400">Caricamento...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configura notifiche multi-canale</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Aggiungi Notifica
        </button>
      </div>

      {/* Channels Overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Canali Disponibili</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {NOTIFICATION_CHANNELS.map(channel => {
            const Icon = channel.icon;
            return (
              <div key={channel.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: channel.color + '20' }}>
                  <Icon className="w-4 h-4" style={{ color: channel.color }} />
                </div>
                <span className="text-sm font-medium text-gray-700">{channel.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subscriptions */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Notifiche Configurate</h2>
          <span className="text-xs text-gray-400">{subscriptions.length} attive</span>
        </div>
        
        {subscriptions.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Nessuna notifica configurata</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {subscriptions.map(sub => {
              const eventType = EVENT_TYPES.find(e => e.id === sub.events?.[0]);
              const Icon = eventType?.icon || Bell;
              const channels = sub.config?.channels || [];
              
              return (
                <div key={sub.id} className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{sub.name || eventType?.label}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{eventType?.category}</span>
                        <span className="text-xs text-gray-300">·</span>
                        <div className="flex items-center gap-1">
                          {channels.map(channelId => {
                            const channel = NOTIFICATION_CHANNELS.find(c => c.id === channelId);
                            if (!channel) return null;
                            const ChannelIcon = channel.icon;
                            return (
                              <div key={channelId} className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: channel.color + '20' }}>
                                <ChannelIcon className="w-3 h-3" style={{ color: channel.color }} />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      sub.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {sub.status}
                    </span>
                    <button
                      onClick={() => handleToggle(sub)}
                      className="p-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      {sub.status === 'Active' ? 'Disattiva' : 'Attiva'}
                    </button>
                    <button
                      onClick={() => handleDelete(sub)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Configura Notifica</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Evento</label>
                <select
                  value={newSubscription.event_type}
                  onChange={(e) => setNewSubscription(prev => ({ ...prev, event_type: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none"
                >
                  <option value="">Seleziona evento...</option>
                  {EVENT_TYPES.map(event => (
                    <option key={event.id} value={event.id}>{event.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Canali</label>
                <div className="grid grid-cols-2 gap-2">
                  {NOTIFICATION_CHANNELS.map(channel => {
                    const Icon = channel.icon;
                    return (
                      <button
                        key={channel.id}
                        onClick={() => {
                          const isSelected = newSubscription.channels.includes(channel.id);
                          setNewSubscription(prev => ({
                            ...prev,
                            channels: isSelected
                              ? prev.channels.filter(c => c !== channel.id)
                              : [...prev.channels, channel.id]
                          }));
                        }}
                        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-all ${
                          newSubscription.channels.includes(channel.id)
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {channel.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Destinatari (email, separati da virgola)</label>
                <input
                  type="text"
                  value={newSubscription.recipients}
                  onChange={(e) => setNewSubscription(prev => ({ ...prev, recipients: e.target.value }))}
                  placeholder="admin@company.com, manager@company.com"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none"
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleAddSubscription}
                className="flex-1 py-2 text-sm text-white rounded-lg font-medium bg-blue-600 hover:bg-blue-700"
              >
                Salva
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-600"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}