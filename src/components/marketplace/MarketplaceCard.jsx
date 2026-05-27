import { useState } from 'react';
import { Star, Download, CheckCircle2, Zap, Shield, TrendingUp, Users, Euro } from 'lucide-react';

export default function MarketplaceCard({ solution, onInstall, onTrial, onViewDetails }) {
  const [showDetails, setShowDetails] = useState(false);

  const typeConfig = {
    'extension': { icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50' },
    'integration': { icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    'partner': { icon: Shield, color: 'text-purple-600', bg: 'bg-purple-50' },
    'vertical': { icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' },
  };

  const type = typeConfig[solution.type] || typeConfig['extension'];
  const TypeIcon = type.icon;

  const providerBadge = {
    'official': { text: 'Official', color: 'text-blue-700', bg: 'bg-blue-100' },
    'partner': { text: 'Partner', color: 'text-purple-700', bg: 'bg-purple-100' },
    'verified': { text: 'Verified', color: 'text-green-700', bg: 'bg-green-100' },
  };

  const badge = providerBadge[solution.provider?.type] || providerBadge['partner'];

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-xl transition-all">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {solution.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">{solution.name}</h3>
              {solution.is_featured && (
                <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded font-medium">Featured</span>
              )}
              {solution.is_new && (
                <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-medium">New</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className={`${badge.bg} ${badge.color} px-2 py-0.5 rounded font-medium`}>
                {badge.text}
              </span>
              <span className="text-gray-500">{solution.provider?.name}</span>
            </div>
          </div>
        </div>

        {/* Type & Category */}
        <div className="flex items-center gap-2 mb-3">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${type.bg} ${type.color}`}>
            <TypeIcon className="w-3 h-3" />
            {solution.type.charAt(0).toUpperCase() + solution.type.slice(1)}
          </div>
          <span className="text-xs text-gray-500">{solution.category}</span>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2 h-10">
          {solution.description}
        </p>

        {/* Features Preview */}
        {solution.features && (
          <div className="mb-3">
            <ul className="space-y-1">
              {solution.features.slice(0, 2).map((feature, idx) => (
                <li key={idx} className="flex items-start gap-1.5 text-xs text-gray-600">
                  <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Ratings */}
        {solution.ratings && (
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < Math.floor(solution.ratings.average)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-gray-900">{solution.ratings.average}</span>
            <span className="text-xs text-gray-500">({solution.ratings.count})</span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-500">{solution.stats?.total_installs || 0} installs</span>
          </div>
        )}

        {/* Pricing */}
        <div className="mb-4 pb-4 border-b border-gray-100">
          {solution.pricing?.monthly > 0 ? (
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-gray-900">€{solution.pricing.monthly}</span>
              <span className="text-sm text-gray-500">/month</span>
              {solution.pricing?.yearly && (
                <span className="text-xs text-green-600 font-medium ml-2">
                  Save {Math.round((1 - solution.pricing.yearly / (solution.pricing.monthly * 12)) * 100)}% yearly
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-green-600">Free</span>
              {solution.pricing?.trial_days && (
                <span className="text-xs text-blue-600 font-medium">{solution.pricing.trial_days}-day free trial</span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (solution.pricing?.monthly > 0 && !solution.pricing?.trial_days) {
                onInstall(solution);
              } else if (solution.pricing?.trial_days) {
                onTrial(solution);
              } else {
                onInstall(solution);
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#1147FF' }}
          >
            <Download className="w-4 h-4" />
            {solution.pricing?.trial_days ? 'Start Trial' : solution.pricing?.monthly > 0 ? 'Buy Now' : 'Install'}
          </button>
          <button
            onClick={() => setShowDetails(true)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Details
          </button>
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{solution.name}</h2>
                <p className="text-sm text-gray-500">{solution.description}</p>
              </div>
              <button onClick={() => setShowDetails(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <span className="sr-only">Close</span>
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Features</h3>
                <ul className="space-y-1">
                  {solution.features?.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {solution.entities && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Entities Added</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {solution.entities.map((entity, idx) => (
                      <span key={idx} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">
                        {entity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div>
                  <span className="text-gray-500">Version:</span> {solution.version}
                </div>
                {solution.provider?.name && (
                  <div>
                    <span className="text-gray-500">Provider:</span> {solution.provider.name}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowDetails(false)}
                className="flex-1 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowDetails(false);
                  if (solution.pricing?.trial_days) {
                    onTrial(solution);
                  } else {
                    onInstall(solution);
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#1147FF' }}
              >
                <Download className="w-4 h-4" />
                {solution.pricing?.trial_days ? 'Start Free Trial' : solution.pricing?.monthly > 0 ? 'Buy Now' : 'Install'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}