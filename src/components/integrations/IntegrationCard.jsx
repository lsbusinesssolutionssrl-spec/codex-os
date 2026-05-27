import { Wifi, WifiOff, AlertCircle, Settings, Trash2, RefreshCw, ExternalLink } from 'lucide-react';

export default function IntegrationCard({ integration, onConnect, onDisconnect, onConfigure, onDelete }) {
  const statusConfig = {
    'Active': { icon: Wifi, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    'Error': { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    'Connecting': { icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    'Suspended': { icon: WifiOff, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
    'Not Connected': { icon: WifiOff, color: 'text-gray-400', bg: 'bg-gray-50', border: 'border-gray-200' },
  };

  const StatusIcon = statusConfig[integration.status]?.icon || WifiOff;
  const status = statusConfig[integration.status] || statusConfig['Not Connected'];

  const categoryColors = {
    'Calendar': 'bg-blue-100 text-blue-700',
    'Communication': 'bg-purple-100 text-purple-700',
    'Payment': 'bg-green-100 text-green-700',
    'Accounting': 'bg-orange-100 text-orange-700',
    'Storage': 'bg-cyan-100 text-cyan-700',
    'Automation': 'bg-pink-100 text-pink-700',
  };

  return (
    <div className={`bg-white rounded-xl border-2 p-5 transition-all hover:shadow-lg ${status.border}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold ${categoryColors[integration.category] || 'bg-gray-100 text-gray-700'}`}>
            {integration.provider.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{integration.name}</h3>
            <p className="text-xs text-gray-500">{integration.provider}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {integration.status}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {integration.description || `Connect with ${integration.provider} to sync data and automate workflows.`}
      </p>

      {/* Features */}
      {integration.enabled_features && integration.enabled_features.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1.5">
            {integration.enabled_features.slice(0, 3).map((feature, idx) => (
              <span key={idx} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                {feature}
              </span>
            ))}
            {integration.enabled_features.length > 3 && (
              <span className="text-xs px-2 py-0.5 text-gray-400">
                +{integration.enabled_features.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      {integration.status === 'Active' && (
        <div className="mb-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {integration.last_sync && (
              <span>
                Last sync: {new Date(integration.last_sync).toLocaleDateString('it-IT')}
              </span>
            )}
            {integration.usage_count > 0 && (
              <span>
                {integration.usage_count} API calls
              </span>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {integration.error_message && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-700">{integration.error_message}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {integration.status === 'Not Connected' && (
          <button
            onClick={() => onConnect(integration)}
            className="flex-1 py-2 text-sm text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#1147FF' }}
          >
            Connect
          </button>
        )}
        
        {integration.status === 'Active' && (
          <>
            <button
              onClick={() => onConfigure(integration)}
              className="flex-1 flex items-center justify-center gap-2 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              Configure
            </button>
            <button
              onClick={() => onDisconnect(integration)}
              className="flex-1 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              Disconnect
            </button>
          </>
        )}

        {integration.status === 'Error' && (
          <>
            <button
              onClick={() => onConnect(integration)}
              className="flex-1 py-2 text-sm text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#1147FF' }}
            >
              Reconnect
            </button>
            <button
              onClick={() => onDelete(integration)}
              className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}

        {integration.status === 'Connecting' && (
          <button disabled className="flex-1 py-2 text-sm text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed">
            Connecting...
          </button>
        )}

        {integration.status === 'Suspended' && (
          <button
            onClick={() => onConnect(integration)}
            className="flex-1 py-2 text-sm text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#1147FF' }}
          >
            Reactivate
          </button>
        )}
      </div>
    </div>
  );
}