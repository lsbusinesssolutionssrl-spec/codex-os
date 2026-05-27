import { useState, useEffect } from 'react';
import { Brain, CheckCircle, XCircle, AlertTriangle, TrendingUp, Zap } from 'lucide-react';

export default function AIExecutionQualityEngine({ aiMemories = [] }) {
  const [qualityMetrics, setQualityMetrics] = useState({
    acceptanceRate: 0,
    ignoredSuggestions: 0,
    lowConfidence: 0,
    qualityScore: 0,
    recommendations: [],
  });

  useEffect(() => {
    evaluateQuality();
  }, [aiMemories]);

  const evaluateQuality = () => {
    if (aiMemories.length === 0) {
      // Simulate metrics for demo
      setQualityMetrics({
        acceptanceRate: 78,
        ignoredSuggestions: 12,
        lowConfidence: 5,
        qualityScore: 82,
        recommendations: [
          'Improve confidence in estimate suggestions',
          'Add more context to project recommendations',
          'Reduce generic responses'
        ]
      });
      return;
    }

    // Calculate from actual AI memories
    const accepted = aiMemories.filter(m => m.accepted).length;
    const ignored = aiMemories.filter(m => m.ignored).length;
    const lowConf = aiMemories.filter(m => m.confidence < 60).length;

    setQualityMetrics({
      acceptanceRate: Math.round((accepted / aiMemories.length) * 100),
      ignoredSuggestions: ignored,
      lowConfidence: lowConf,
      qualityScore: Math.round((accepted / aiMemories.length) * 100),
      recommendations: ['Continue monitoring AI performance']
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-4 h-4 text-purple-600" />
        <h2 className="text-sm font-semibold text-gray-900">AI Execution Quality Engine</h2>
      </div>

      {/* Quality Score */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">AI Quality Score</span>
          <span className={`text-lg font-bold ${
            qualityMetrics.qualityScore >= 80 ? 'text-green-600' :
            qualityMetrics.qualityScore >= 60 ? 'text-orange-600' :
            'text-red-600'
          }`}>
            {qualityMetrics.qualityScore}/100
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all"
            style={{ 
              width: `${qualityMetrics.qualityScore}%`,
              backgroundColor: qualityMetrics.qualityScore >= 80 ? '#10B981' :
                qualityMetrics.qualityScore >= 60 ? '#F97316' : '#EF4444'
            }}
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <MetricCard 
          label="Acceptance" 
          value={`${qualityMetrics.acceptanceRate}%`}
          icon={CheckCircle}
          color="#10B981"
          positive={true}
        />
        <MetricCard 
          label="Ignored" 
          value={qualityMetrics.ignoredSuggestions}
          icon={XCircle}
          color="#EF4444"
          positive={false}
        />
        <MetricCard 
          label="Low Confidence" 
          value={qualityMetrics.lowConfidence}
          icon={AlertTriangle}
          color="#F59E0B"
          positive={false}
        />
      </div>

      {/* Recommendations */}
      {qualityMetrics.recommendations.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-3 h-3 text-purple-600" />
            <span className="text-xs font-semibold text-gray-900">Retraining Suggestions</span>
          </div>
          <ul className="space-y-1">
            {qualityMetrics.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                <span className="text-purple-600 font-bold">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, color, positive }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <Icon className={`w-4 h-4 mx-auto mb-1 ${positive ? '' : 'opacity-60'}`} style={{ color }} />
      <p className={`text-lg font-bold ${positive ? 'text-gray-900' : 'text-gray-700'}`}>{value}</p>
      <p className="text-[10px] text-gray-500">{label}</p>
    </div>
  );
}