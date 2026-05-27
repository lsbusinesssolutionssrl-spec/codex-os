import { useState } from 'react';
import { X, Key, Globe, Shield, Zap } from 'lucide-react';

export default function IntegrationModal({ integration, onClose, onSave }) {
  const [config, setConfig] = useState(integration?.config || {});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ ...integration, config });
      onClose();
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!integration) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Configure {integration.name}</h2>
            <p className="text-sm text-gray-500">{integration.provider}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Auth Type Info */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">
                Authentication: {integration.auth_type}
              </h3>
              <p className="text-xs text-blue-700">
                {integration.auth_type === 'OAuth 2.0' 
                  ? 'You will be redirected to authenticate securely with your account.'
                  : 'Enter your API credentials to enable integration.'}
              </p>
            </div>
          </div>
        </div>

        {/* Configuration Form */}
        <div className="space-y-4 mb-6">
          {/* API Key Input */}
          {integration.auth_type === 'API Key' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  API Key
                </label>
                <input
                  type="password"
                  value={config.api_key || ''}
                  onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                  placeholder="Enter your API key"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {config.webhook_url && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Webhook URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={config.webhook_url}
                      readOnly
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(config.webhook_url)}
                      className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Configure this URL in your {integration.provider} dashboard
                  </p>
                </div>
              )}
            </>
          )}

          {/* OAuth Info */}
          {integration.auth_type === 'OAuth 2.0' && (
            <>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Required Scopes:</h4>
                <div className="flex flex-wrap gap-1.5">
                  {integration.config?.scopes?.map((scope, idx) => (
                    <span key={idx} className="text-xs px-2 py-1 bg-white border border-gray-200 rounded text-gray-600">
                      {scope}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Globe className="w-4 h-4" />
                <span>Redirect URI: <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{integration.config?.redirect_uri}</code></span>
              </div>
            </>
          )}

          {/* Custom Settings */}
          {integration.config?.settings && (
            <>
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Additional Settings</h4>
                
                {Object.entries(integration.config.settings).map(([key, value]) => (
                  <div key={key} className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 capitalize">
                      {key.replace(/_/g, ' ')}
                    </label>
                    {typeof value === 'boolean' ? (
                      <input
                        type="checkbox"
                        checked={config.settings?.[key] || false}
                        onChange={(e) => setConfig({ 
                          ...config, 
                          settings: { ...config.settings, [key]: e.target.checked }
                        })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                    ) : typeof value === 'number' ? (
                      <input
                        type="number"
                        value={config.settings?.[key] || value}
                        onChange={(e) => setConfig({ 
                          ...config, 
                          settings: { ...config.settings, [key]: parseInt(e.target.value) }
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                      />
                    ) : (
                      <input
                        type="text"
                        value={config.settings?.[key] || value}
                        onChange={(e) => setConfig({ 
                          ...config, 
                          settings: { ...config.settings, [key]: e.target.value }
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                      />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Features Preview */}
        {integration.enabled_features && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-green-900 mb-2">Enabled Features:</h4>
                <ul className="text-xs text-green-700 space-y-1">
                  {integration.enabled_features.map((feature, idx) => (
                    <li key={idx}>✓ {feature}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 text-sm text-white rounded-lg font-medium disabled:opacity-40 transition-opacity"
            style={{ backgroundColor: '#1147FF' }}
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}