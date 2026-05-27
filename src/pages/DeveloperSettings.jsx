import { useState, useEffect } from 'react';
import { Globe, Zap, Shield, Key, Bell, Settings, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function DeveloperSettings() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('api-keys');
  const [apiKeys, setApiKeys] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [integrations, setIntegrations] = useState([]);
  const [extensions, setExtensions] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [keys, hooks, integrationsList, extensionsList] = await Promise.all([
        base44.entities.APIKey.list(),
        base44.entities.WebhookSubscription.list(),
        base44.entities.PlatformIntegration.list(),
        base44.entities.Extension.list(),
      ]);
      setApiKeys(keys);
      setWebhooks(hooks);
      setIntegrations(integrationsList);
      setExtensions(extensionsList);
    } catch (error) {
      toast.error('Impossibile caricare i dati');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (entityType, id) => {
    if (!confirm('Sei sicuro di voler eliminare questo elemento?')) return;
    
    try {
      if (entityType === 'api-key') await base44.entities.APIKey.delete(id);
      if (entityType === 'webhook') await base44.entities.WebhookSubscription.delete(id);
      if (entityType === 'integration') await base44.entities.PlatformIntegration.delete(id);
      if (entityType === 'extension') await base44.entities.Extension.delete(id);
      
      toast.success('Eliminato con successo');
      loadData();
    } catch (error) {
      toast.error(`Errore: ${error.message}`);
    }
  };

  const tabs = [
    { id: 'api-keys', label: 'API Keys', icon: Key },
    { id: 'webhooks', label: 'Webhooks', icon: Bell },
    { id: 'integrations', label: 'Integrazioni', icon: Globe },
    { id: 'extensions', label: 'Estensioni', icon: Zap },
    { id: 'settings', label: 'Impostazioni', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-400">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Caricamento...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-500" />
            Developer Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">Gestione API, webhook e integrazioni</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* API Keys Tab */}
      {activeTab === 'api-keys' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">API Keys</h2>
            <button
              onClick={() => { setCreateType('api-key'); setShowCreateModal(true); }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-white rounded-lg"
              style={{ backgroundColor: '#1147FF' }}
            >
              <Plus className="w-3.5 h-3.5" /> Nuova Chiave
            </button>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Nome</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Prefisso</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Stato</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Utilizzi</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {apiKeys.map(key => (
                  <tr key={key.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{key.name}</td>
                    <td className="px-5 py-3.5 text-gray-600">{key.type}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{key.key_prefix}...</td>
                    <td className="px-5 py-3.5 text-center">
                      <StatusBadge status={key.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right text-gray-600">{key.usage_count}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => handleDelete('api-key', key.id)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {apiKeys.length === 0 && (
              <div className="py-12 text-center text-gray-400">
                <Key className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Nessuna API key configurata</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Webhooks Tab */}
      {activeTab === 'webhooks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Webhook Subscriptions</h2>
            <button
              onClick={() => { setCreateType('webhook'); setShowCreateModal(true); }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-white rounded-lg"
              style={{ backgroundColor: '#1147FF' }}
            >
              <Plus className="w-3.5 h-3.5" /> Nuovo Webhook
            </button>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Nome</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Endpoint</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Eventi</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Stato</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Successi/Fallimenti</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {webhooks.map(webhook => (
                  <tr key={webhook.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{webhook.name}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-500 truncate max-w-xs">{webhook.endpoint_url}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1 flex-wrap">
                        {webhook.events.slice(0, 3).map((event, idx) => (
                          <span key={idx} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{event}</span>
                        ))}
                        {webhook.events.length > 3 && (
                          <span className="text-[10px] text-gray-400">+{webhook.events.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <StatusBadge status={webhook.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-green-600">{webhook.success_count}</span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className="text-red-600">{webhook.failure_count}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => handleDelete('webhook', webhook.id)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {webhooks.length === 0 && (
              <div className="py-12 text-center text-gray-400">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Nessun webhook configurato</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Integrazioni Attive</h2>
            <button
              onClick={() => { setCreateType('integration'); setShowCreateModal(true); }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-white rounded-lg"
              style={{ backgroundColor: '#1147FF' }}
            >
              <Plus className="w-3.5 h-3.5" /> Nuova Integrazione
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map(integration => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                onDelete={() => handleDelete('integration', integration.id)}
              />
            ))}
          </div>
          {integrations.length === 0 && (
            <div className="py-12 text-center text-gray-400">
              <Globe className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Nessuna integrazione configurata</p>
            </div>
          )}
        </div>
      )}

      {/* Extensions Tab */}
      {activeTab === 'extensions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Estensioni Installate</h2>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
              <Plus className="w-3.5 h-3.5" /> Marketplace
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {extensions.map(ext => (
              <ExtensionCard
                key={ext.id}
                extension={ext}
                onDelete={() => handleDelete('extension', ext.id)}
              />
            ))}
          </div>
          {extensions.length === 0 && (
            <div className="py-12 text-center text-gray-400">
              <Zap className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Nessuna estensione installata</p>
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Impostazioni Piattaforma</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">API Rate Limiting</p>
                  <p className="text-xs text-gray-500">Limita richieste API per minuto</p>
                </div>
                <select className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
                  <option>100 req/min</option>
                  <option>500 req/min</option>
                  <option>1000 req/min</option>
                  <option>Unlimited</option>
                </select>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">Webhook Retry Policy</p>
                  <p className="text-xs text-gray-500">Tentativi di retry per webhook falliti</p>
                </div>
                <select className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
                  <option>3 tentativi</option>
                  <option>5 tentativi</option>
                  <option>10 tentativi</option>
                </select>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">Audit Log Retention</p>
                  <p className="text-xs text-gray-500">Quanto tempo conservare i log</p>
                </div>
                <select className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg">
                  <option>30 giorni</option>
                  <option>90 giorni</option>
                  <option>1 anno</option>
                  <option>Illimitato</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Active: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    Inactive: 'bg-gray-100 text-gray-600 border border-gray-200',
    Error: 'bg-red-50 text-red-700 border border-red-200',
    Suspended: 'bg-amber-50 text-amber-700 border border-amber-200',
    Revoked: 'bg-red-50 text-red-700 border border-red-200',
    Expired: 'bg-gray-50 text-gray-600 border border-gray-200',
    'Not Installed': 'bg-gray-100 text-gray-500 border border-gray-200',
    Installed: 'bg-blue-50 text-blue-700 border border-blue-200',
  };

  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${styles[status] || styles.Inactive}`}>
      {status}
    </span>
  );
}

function IntegrationCard({ integration, onDelete }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Globe className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{integration.name}</h3>
            <p className="text-xs text-gray-500">{integration.provider}</p>
          </div>
        </div>
        <StatusBadge status={integration.status} />
      </div>
      <p className="text-xs text-gray-600 mb-3">{integration.category}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Utilizzi: {integration.usage_count}</span>
        <button onClick={onDelete} className="text-red-400 hover:text-red-600">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function ExtensionCard({ extension, onDelete }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
            <Zap className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{extension.name}</h3>
            <p className="text-xs text-gray-500">v{extension.version}</p>
          </div>
        </div>
        <StatusBadge status={extension.status} />
      </div>
      <p className="text-xs text-gray-600 mb-3">{extension.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{extension.category}</span>
        <button onClick={onDelete} className="text-red-400 hover:text-red-600">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}