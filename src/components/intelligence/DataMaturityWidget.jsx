import { BarChart3, TrendingUp, Users, BookOpen, CheckCircle, XCircle, Brain, AlertTriangle } from 'lucide-react';

const CONFIDENCE_COLORS = {
  none: 'bg-gray-100 text-gray-600',
  low: 'bg-orange-100 text-orange-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-green-100 text-green-700',
};

export default function DataMaturityWidget({ maturity, onGenerateInsights, generating }) {
  if (!maturity || maturity.level === undefined) return null;

  const levelConfig = {
    0: { label: 'No Data', color: '#6B7280', icon: XCircle },
    1: { label: 'Basic Tracking', color: '#3B82F6', icon: BarChart3 },
    2: { label: 'Financial Data', color: '#10B981', icon: TrendingUp },
    3: { label: 'Team Analytics', color: '#F59E0B', icon: Users },
    4: { label: 'Historical Insights', color: '#8B5CF6', icon: BookOpen },
    5: { label: 'Predictive AI', color: '#1147FF', icon: Brain },
  };

  const config = levelConfig[Math.min(maturity.level, 5)] || levelConfig[0];
  const Icon = config.icon;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${config.color}15` }}
          >
            <Icon className="w-6 h-6" style={{ color: config.color }} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Operational Intelligence Readiness</h3>
            <p className="text-xs text-gray-500">Data Maturity Level {maturity.level}/5</p>
          </div>
        </div>
        <span 
          className="px-3 py-1 text-xs font-semibold rounded-full"
          style={{ 
            backgroundColor: `${config.color}15`, 
            color: config.color 
          }}
        >
          {config.label}
        </span>
      </div>

      {/* Milestones */}
      <div className="space-y-2 mb-4">
        {maturity.milestones?.map((milestone, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            {milestone.startsWith('✅') ? (
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
            )}
            <span className="text-gray-700">{milestone.replace(/^[✅❌] /, '')}</span>
          </div>
        ))}
      </div>

      {/* Readiness Bars */}
      {maturity.readiness && (
        <div className="space-y-3 mb-4">
          <ProgressBar 
            label="Projects Tracked" 
            value={maturity.readiness.projects || 0} 
            color="#1147FF" 
          />
          <ProgressBar 
            label="Financial Data Quality" 
            value={maturity.readiness.financial_data || 0} 
            color="#10B981" 
          />
          <ProgressBar 
            label="Team Tracking Maturity" 
            value={maturity.readiness.team_tracking || 0} 
            color="#F59E0B" 
          />
          <ProgressBar 
            label="Historical Depth" 
            value={maturity.readiness.historical_depth || 0} 
            color="#8B5CF6" 
          />
        </div>
      )}

      {/* AI Confidence */}
      {maturity.readiness?.ai_confidence && (
        <div className="flex items-center justify-between items-center mb-4 p-3 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">AI Confidence</span>
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${CONFIDENCE_COLORS[maturity.readiness.ai_confidence]}`}>
            {maturity.readiness.ai_confidence.toUpperCase()}
          </span>
        </div>
      )}

      {/* Recommendation */}
      {maturity.recommendation && (
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800 font-medium">{maturity.recommendation}</p>
          </div>
        </div>
      )}

      {/* Action Button */}
      {maturity.level >= 2 && (
        <button
          onClick={onGenerateInsights}
          disabled={generating}
          className="w-full py-3 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #1147FF 0%, #0B2341 100%)' }}
        >
          {generating ? 'Generating...' : 'Generate AI Insights'}
        </button>
      )}

      {maturity.level < 2 && (
        <div className="text-center py-3 text-sm text-gray-500">
          Continue adding operational data to unlock AI insights
        </div>
      )}
    </div>
  );
}

function ProgressBar({ label, value, color }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600 font-medium">{label}</span>
        <span className="text-xs text-gray-500">{value.toFixed(0)}%</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all"
          style={{ 
            width: `${value}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}