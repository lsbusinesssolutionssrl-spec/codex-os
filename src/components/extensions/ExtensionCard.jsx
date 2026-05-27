import { useState } from 'react';
import { Download, Trash2, Settings, Zap, Shield, AlertCircle, CheckCircle2, Package } from 'lucide-react';

export default function ExtensionCard({ extension, onInstall, onUninstall, onConfigure, onDisable }) {
  const [showDetails, setShowDetails] = useState(false);

  const statusConfig = {
    'Installed': { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle2 },
    'Not Installed': { color: 'text-gray-400', bg: 'bg-gray-50', border: 'border-gray-200', icon: Package },
    'Updating': { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: Zap },
    'Disabled': { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', icon: AlertCircle },
    'Error': { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: AlertCircle },
  };

  const status = statusConfig[extension.status] || statusConfig['Not Installed'];
  const StatusIcon = status.icon;

  const categoryColors = {
    'Accounting': 'bg-blue-100 text-blue-700',
    'IoT': 'bg-purple-100 text-purple-700',
    'CRM': 'bg-green-100 text-green-700',
    'Insurance': 'bg-cyan-100 text-cyan-700',
    'Analytics': 'bg-orange-100 text-orange-700',
    'Operations': 'bg-pink-100 text-pink-700',
    'Smart Home': 'bg-indigo-100 text-indigo-700',
    'Custom': 'bg-gray-100 text-gray-700',
  };

  return (
    <>
      <div className={`bg-white rounded-xl border-2 p-5 transition-all hover:shadow-lg ${status.border}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold ${categoryColors[extension.category] || 'bg-gray-100 text-gray-700'}`}>
              {extension.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{extension.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-500">{extension.category}</span>
                {extension.is_official && (
                  <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">Official</span>
                )}
                {extension.is_beta && (
                  <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded font-medium">Beta</span>
                )}
              </div>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {extension.status}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {extension.description}
        </p>

        {/* Version & Author */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          <span>Version: {extension.version}</span>
          {extension.author && <span>By: {extension.author}</span>}
        </div>

        {/* Features */}
        {extension.features && extension.features.length > 0 && (
          <div className="mb-4 pb-4 border-b border-gray-100">
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Key Features:</h4>
            <ul className="space-y-1">
              {extension.features.slice(0, 3).map((feature, idx) => (
                <li key={idx} className="flex items-start gap-1.5 text-xs text-gray-600">
                  <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Stats */}
        {extension.status === 'Installed' && (
          <div className="mb-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {extension.installed_at && (
                <span>
                  Installed: {new Date(extension.installed_at).toLocaleDateString('it-IT')}
                </span>
              )}
              {extension.usage_count > 0 && (
                <span>
                  {extension.usage_count} uses
                </span>
              )}
            </div>
          </div>
        )}

        {/* Pricing */}
        {(extension.price_monthly > 0 || extension.price_yearly > 0) && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Pricing:</span>
              <div className="text-xs font-semibold text-gray-900">
                {extension.price_monthly > 0 ? (
                  <>
                    €{extension.price_monthly}/mo
                    {extension.price_yearly > 0 && (
                      <span className="text-gray-500 ml-2">or €{extension.price_yearly}/yr</span>
                    )}
                  </>
                ) : (
                  <span className="text-green-600">Free</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {extension.status === 'Not Installed' && (
            <button
              onClick={() => onInstall(extension)}
              className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#1147FF' }}
            >
              <Download className="w-4 h-4" />
              Install
            </button>
          )}

          {extension.status === 'Installed' && (
            <>
              <button
                onClick={() => onConfigure(extension)}
                className="flex-1 flex items-center justify-center gap-2 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                Configure
              </button>
              <button
                onClick={() => onDisable(extension)}
                className="px-3 py-2 text-sm text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
              >
                Disable
              </button>
              <button
                onClick={() => onUninstall(extension)}
                className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {extension.status === 'Disabled' && (
            <>
              <button
                onClick={() => onInstall(extension)}
                className="flex-1 py-2 text-sm text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#1147FF' }}
              >
                Enable
              </button>
              <button
                onClick={() => onUninstall(extension)}
                className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {extension.status === 'Error' && (
            <>
              <button
                onClick={() => onInstall(extension)}
                className="flex-1 py-2 text-sm text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#1147FF' }}
              >
                Retry
              </button>
              <button
                onClick={() => onUninstall(extension)}
                className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {extension.status === 'Updating' && (
            <button disabled className="flex-1 py-2 text-sm text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed">
              Updating...
            </button>
          )}
        </div>

        {/* View Details Link */}
        <button
          onClick={() => setShowDetails(true)}
          className="w-full mt-3 py-2 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          View Details →
        </button>
      </div>

      {/* Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{extension.name}</h2>
                <p className="text-sm text-gray-500">{extension.description}</p>
              </div>
              <button onClick={() => setShowDetails(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <Settings className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Details Content */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Features</h3>
                <ul className="space-y-1">
                  {extension.features?.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {extension.entities && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Entities Added</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {extension.entities.map((entity, idx) => (
                      <span key={idx} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">
                        {entity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {extension.permissions && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Permissions Required</h3>
                  <div className="flex items-start gap-2 text-xs text-gray-600">
                    <Shield className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex flex-wrap gap-1.5 flex flex-wrap gap-1">
                      {extension.permissions.slice(0, 5).map((perm, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                          {perm}
                        </span>
                      ))}
                      {extension.permissions.length > 5 && (
                        <span className="text-gray-400">+{extension.permissions.length - 5} more</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div>
                  <span className="text-gray-500">Version:</span> {extension.version}
                </div>
                {extension.author && (
                  <div>
                    <span className="text-gray-500">Author:</span> {extension.author}
                  </div>
                )}
                {extension.website && (
                  <a href={extension.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Website →
                  </a>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowDetails(false)}
                className="flex-1 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              {extension.status === 'Not Installed' && (
                <button
                  onClick={() => {
                    setShowDetails(false);
                    onInstall(extension);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#1147FF' }}
                >
                  <Download className="w-4 h-4" />
                  Install Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}