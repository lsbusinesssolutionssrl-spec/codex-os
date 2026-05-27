import { useState, useEffect } from 'react';
import { Zap, Mail, MessageSquare, Phone, Calendar, Globe, Webhook, Building } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

/**
 * Integration Hub - Future-ready integration management
 * 
 * This component prepares the architecture for external integrations:
 * - WhatsApp / SMS
 * - Email providers
 * - Google Calendar / Outlook
 * - Slack / Teams
 * - Zapier / Webhooks
 */

export default function IntegrationHub() {
  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState([]);
  const [selectedIntegration, setSelectedIntegration] = useState(null);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    setLoading(true);
    // Future: Load actual integration configs from backend
    setIntegrations(getMockIntegrations());
    setLoading(false);
  };

  const getMockIntegrations = () => [
    {
      id: 'whatsapp',
      name: 'WhatsApp Business',
      category: 'Communication',
      description: 'Send automated WhatsApp messages to clients',
      icon: MessageSquare,
      color: '#25D366',
      status: 'coming_soon',
      features: ['Client notifications', 'Appointment reminders', 'Status updates'],
      config_fields: ['phone_number', 'api_key'],
    },
    {
      id: 'email',
      name: 'Email Provider',
      category: 'Communication',
      description: 'Advanced email automation with templates',
      icon: Mail,
      color: '#0B2341',
      status: 'coming_soon',
      features: ['Custom templates', 'Scheduled sending', 'Delivery tracking'],
      config_fields: ['smtp_host', 'smtp_port', 'username', 'password'],
    },
    {
      id: 'google_calendar',
      name: 'Google Calendar',
      category: 'Calendar',
      description: 'Sync project milestones and appointments',
      icon: Calendar,
      color: '#4285F4',
      status: 'coming_soon',
      features: ['Auto-schedule events', 'Sync deadlines', 'Team availability'],
      config_fields: ['oauth_credentials'],
    },
    {
      id: 'slack',
      name: 'Slack',
      category: 'Team Communication',
      description: 'Team notifications and alerts',
      icon: Zap,
      color: '#4A154B',
      status: 'coming_soon',
      features: ['Channel notifications', 'Alert escalations', 'Daily digests'],
      config_fields: ['workspace_url', 'bot_token', 'channels'],
    },
    {
      id: 'zapier',
      name: 'Zapier',
      category: 'Automation',
      description: 'Connect to 5000+ apps via Zapier',
      icon: Globe,
      color: '#FF4F00',
      status: 'coming_soon',
      features: ['Multi-step zaps', 'Trigger actions', 'Data sync'],
      config_fields: ['api_key', 'webhook_url'],
    },
    {
      id: 'webhooks',
      name: 'Webhooks',
      category: 'Developer',
      description: 'Custom webhook endpoints for external systems',
      icon: Webhook,
      color: '#10B981',
      status: 'coming_soon',
      features: ['Outgoing webhooks', 'Incoming webhooks', 'Custom payloads'],
      config_fields: ['endpoint_url', 'secret_key', 'events'],
    },
  ];

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-400">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Caricamento integrazioni...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-500" />
            Integration Hub
          </h1>
          <p className="text-sm text-gray-500 mt-1">Connetti Codex con strumenti esterni</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Building className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900">Enterprise Integration Architecture</p>
            <p className="text-xs text-blue-700 mt-1">
              Questa sezione prepara l'infrastruttura per integrazioni future. 
              Le integrazioni saranno disponibili nei prossimi aggiornamenti.
            </p>
          </div>
        </div>
      </div>

      {/* Integration Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map(integration => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            onClick={() => setSelectedIntegration(integration)}
          />
        ))}
      </div>

      {/* Integration Detail Modal */}
      {selectedIntegration && (
        <IntegrationDetailModal
          integration={selectedIntegration}
          onClose={() => setSelectedIntegration(null)}
        />
      )}
    </div>
  );
}

function IntegrationCard({ integration, onClick }) {
  const Icon = integration.icon;
  
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: integration.color + '20' }}
        >
          <Icon className="w-6 h-6" style={{ color: integration.color }} />
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
          {integration.category}
        </span>
      </div>
      
      <h3 className="text-sm font-semibold text-gray-900 mb-1">{integration.name}</h3>
      <p className="text-xs text-gray-500 mb-3">{integration.description}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {integration.features.slice(0, 2).map((feature, idx) => (
            <span key={idx} className="text-[10px] bg-gray-50 text-gray-600 px-2 py-0.5 rounded">
              {feature}
            </span>
          ))}
        </div>
        <span className="text-xs text-blue-600 font-medium">Configura →</span>
      </div>
    </div>
  );
}

function IntegrationDetailModal({ integration, onClose }) {
  const Icon = integration.icon;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: integration.color + '20' }}
            >
              <Icon className="w-6 h-6" style={{ color: integration.color }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{integration.name}</h2>
              <p className="text-xs text-gray-500">{integration.category}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <Zap className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600">{integration.description}</p>

        <div>
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Funzionalità</h3>
          <ul className="space-y-1">
            {integration.features.map((feature, idx) => (
              <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-amber-800 font-medium">
              🚧 In Sviluppo - Questa integrazione sarà disponibile a breve
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="w-full py-2 text-sm text-white rounded-lg font-medium"
            style={{ backgroundColor: integration.color }}
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}