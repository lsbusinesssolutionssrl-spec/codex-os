import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Key, Zap, Globe, Database, Plus, Trash2, Copy, Check, RefreshCw, Eye, EyeOff, Activity } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { hasRole } from '@/lib/roleUtils';
import { toast } from 'sonner';

export default function DeveloperSettings() {
  const navigate = useNavigate();
  const [apiKeys, setApiKeys] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [integrations, setIntegrations] = useState([]);
  const [extensions, setExtensions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showingSecret, setShowingSecret] = useState(null);
  const [newApiKey, setNewApiKey] = useState({
    name: '',
    type: 'Read-Only',
    rate_limit: 100,
    description: '',
  });

  useEffect(() => {
    hasRole(['admin', 'company_admin']).then(auth => {
      if (!auth) {
        navigate('/');
        return;
      }
      setIsAuthorized(true);
    });
  }, []);

  useEffect(() => {
    if (!isAuthorized) return;
    
    const load = async () => {
      const [keys, hooks, integrations, extensions] = await Promise.all([
        base44.entities.APIKey.list(),
        base44.entities.WebhookSubscription.list(),
        base44.entities.PlatformIntegration.list(),
        base44.entities.Extension.list(),
      ]);
      
      setApiKeys(keys);
      setWebhooks(hooks);
      setIntegrations(integrations);
      setExtensions(extensions);
      setLoading(false);
    };
    load();
  }, [isAuthorized]);

  const handleCreateApiKey = async () => {
    const keyPrefix = `sk_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const keyHash = `hashed_${Math.random().toString(36).substring(2, 32)}`;
    
    await base44.entities.APIKey.create({
      ...newApiKey,
      key_prefix: keyPrefix,
      key_hash: keyHash,
      status: 'Active',
      usage_count: 0,
    });
    
    const keys = await base44.entities.APIKey.list();
    setApiKeys(keys);
    setShowApiKeyModal(false);
    setNewApiKey({ name: '', type: 'Read-Only', rate_limit: 100, description: '' });
    toast.success('API key creata');
  };

  const handleRevokeKey = async (key) => {
    await base44.entities.APIKey.update(key.id, { status: 'Revoked' });
    setApiKeys(prev => prev.map(k => k.id === key.id ? { ...k, status: 'Revoked' } : k));
    toast.success('API key revocata');
  };

  const handleDelete = async (key) => {
    await base44.entities.APIKey.delete(key.id);
    setApiKeys(prev => prev.filter(k => k.id !== key.id));
    toast.success('API key eliminata');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiato negli appunti');
  };

  if (!isAuthorized) return null;
  if (loading) return <div className="p-6 text-center text-gray-400">Caricamento...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Developer Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">API keys, webhooks, and integrations</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/integrations')} className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            <Globe className="w-3.5 h-3.5" /> Integrations
          </button>
          <button onClick={() => navigate('/system-status')} className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            <Activity className="w-3.5 h-3.5" /> System Status
          </button>
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Key className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">API Keys</h2>
              <p className="text-xs text-gray-500">{apiKeys.length} chiavi</p>
            </div>
          </div>
          <button
            onClick={() => setShowApiKeyModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-white rounded-lg bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-3.5 h-3.5" />
            Nuova API Key
          </button>
        </div>
        
        {apiKeys.length === 0 ? (
          <div className="py-12 text-center">
            <Key className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Nessuna API key configurata</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {apiKeys.map(key => (
              <div key={key.id} className="p-5 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-gray-900">{key.name}</h3>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      key.status === 'Active' ? 'bg-green-100 text-green-700' :
                      key.status === 'Revoked' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {key.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                        {showingSecret === key.id ? key.key_hash : `${key.key_prefix}••••••••`}
                      </code>
                      <button onClick={() => setShowingSecret(showingSecret === key.id ? null : key.id)} className="text-gray-400 hover:text-gray-600">
                        {showingSecret === key.id ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => copyToClipboard(key.key_prefix)} className="text-gray-400 hover:text-gray-600">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-xs text-gray-500">{key.type}</span>
                    <span className="text-xs text-gray-500">{key.rate_limit} req/min</span>
                  </div>
                  {key.description && <p className="text-xs text-gray-500 mt-2">{key.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {key.status === 'Active' && (
                    <button onClick={() => handleRevokeKey(key)} className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50">
                      Revoca
                    </button>
                  )}
                  <button onClick={() => handleDelete(key)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Webhooks */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <Zap className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Webhooks</h2>
              <p className="text-xs text-gray-500">{webhooks.length} sottoscrizioni</p>
            </div>
          </div>
          <button onClick={() => navigate('/notification-settings')} className="flex items-center gap-2 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50">
            <Plus className="w-3.5 h-3.5" />
            Configura
          </button>
        </div>
        
        {webhooks.length === 0 ? (
          <div className="py-12 text-center">
            <Zap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Nessun webhook configurato</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {webhooks.slice(0, 5).map(webhook => (
              <div key={webhook.id} className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{webhook.name}</h3>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-600 mt-1 block">
                      {webhook.endpoint_url}
                    </code>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    webhook.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {webhook.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <span>{webhook.events?.length || 0} eventi</span>
                  <span>·</span>
                  <span>{webhook.success_count || 0} successi</span>
                  <span>·</span>
                  <span>{webhook.failure_count || 0} errori</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Integrations & Extensions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                <Globe className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Integrations</h2>
                <p className="text-xs text-gray-500">{integrations.filter(i => i.status === 'Active').length} attive</p>
              </div>
            </div>
            <button onClick={() => navigate('/integrations')} className="text-xs text-blue-600 hover:underline">
              Vedi tutte
            </button>
          </div>
          <div className="p-5">
            {integrations.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Nessuna integrazione</p>
            ) : (
              <div className="space-y-3">
                {integrations.slice(0, 5).map(int => (
                  <div key={int.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                        <Globe className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{int.name}</p>
                        <p className="text-xs text-gray-500">{int.provider}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      int.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {int.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                <Database className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Extensions</h2>
                <p className="text-xs text-gray-500">{extensions.filter(e => e.status === 'Installed').length} installate</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            {extensions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Nessuna estensione</p>
            ) : (
              <div className="space-y-3">
                {extensions.slice(0, 5).map(ext => (
                  <div key={ext.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{ext.name}</p>
                      <p className="text-xs text-gray-500">{ext.category} · v{ext.version}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      ext.status === 'Installed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {ext.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Nuova API Key</h2>
              <button onClick={() => setShowApiKeyModal(false)}><Shield className="w-5 h-5 text-gray-400" /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Nome</label>
                <input
                  type="text"
                  value={newApiKey.name}
                  onChange={(e) => setNewApiKey(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="es. Production API"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Tipo</label>
                <select
                  value={newApiKey.type}
                  onChange={(e) => setNewApiKey(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none"
                >
                  <option>Read-Only</option>
                  <option>Read-Write</option>
                  <option>Admin</option>
                  <option>Webhook</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Rate Limit (req/min)</label>
                <input
                  type="number"
                  value={newApiKey.rate_limit}
                  onChange={(e) => setNewApiKey(prev => ({ ...prev, rate_limit: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Descrizione</label>
                <textarea
                  value={newApiKey.description}
                  onChange={(e) => setNewApiKey(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none resize-none"
                  placeholder="Opzionale..."
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button onClick={handleCreateApiKey} className="flex-1 py-2 text-sm text-white rounded-lg font-medium bg-blue-600 hover:bg-blue-700">
                Crea
              </button>
              <button onClick={() => setShowApiKeyModal(false)} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-600">
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}