import { useState, useEffect } from 'react';
import { Brain, AlertTriangle, TrendingDown, Shield, DollarSign, Clock, Users, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ProjectRiskAnalysis({ projectId, compact = false }) {
  const [riskAnalysis, setRiskAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (projectId) {
      analyzeRisk();
    }
  }, [projectId]);

  const analyzeRisk = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generatePredictiveInsights', {
        project_id: projectId,
        analysis_type: 'risk'
      });
      setRiskAnalysis(response.data);
    } catch (error) {
      console.error('Risk analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-pulse">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-red-600" />
          <span className="text-xs font-semibold text-red-700">Analisi rischio in corso...</span>
        </div>
      </div>
    );
  }

  if (!riskAnalysis) return null;

  const risks = riskAnalysis.risks || [];

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-red-600" />
          <span className="text-xs font-semibold text-red-700">Project Risk AI</span>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
          riskAnalysis.overall_risk === 'Critical' ? 'bg-red-200 text-red-800' :
          riskAnalysis.overall_risk === 'High' ? 'bg-orange-200 text-orange-800' :
          riskAnalysis.overall_risk === 'Medium' ? 'bg-yellow-200 text-yellow-800' :
          'bg-green-200 text-green-800'
        }`}>
          {riskAnalysis.overall_risk || 'Medium'} Risk
        </span>
      </div>

      {/* Risk Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {riskAnalysis.delay_risk && (
          <RiskMetric 
            label="Delay Risk" 
            value={riskAnalysis.delay_risk} 
            icon={Clock}
            color="#F97316"
          />
        )}
        {riskAnalysis.budget_risk && (
          <RiskMetric 
            label="Budget Risk" 
            value={riskAnalysis.budget_risk} 
            icon={DollarSign}
            color="#EF4444"
          />
        )}
        {riskAnalysis.margin_risk && (
          <RiskMetric 
            label="Margin Risk" 
            value={riskAnalysis.margin_risk} 
            icon={TrendingDown}
            color="#F59E0B"
          />
        )}
        {riskAnalysis.quality_risk && (
          <RiskMetric 
            label="Quality Risk" 
            value={riskAnalysis.quality_risk} 
            icon={Shield}
            color="#8B5CF6"
          />
        )}
      </div>

      {/* Detailed Risks */}
      {risks.length > 0 && (
        <div className="space-y-2">
          {risks.slice(0, compact ? 3 : risks.length).map((risk, idx) => (
            <div key={idx} className="bg-white rounded-lg p-3 border border-red-100">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-900">{risk.type}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{risk.description}</p>
                  {risk.confidence && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      Confidence: {risk.confidence}%
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recommendations */}
      {riskAnalysis.recommendations && riskAnalysis.recommendations.length > 0 && (
        <div className="mt-4 bg-white rounded-lg p-3 border border-green-100">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-xs font-semibold text-gray-900">Mitigation Actions</span>
          </div>
          <ul className="space-y-1">
            {riskAnalysis.recommendations.slice(0, 3).map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                <span className="text-green-600 font-bold">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function RiskMetric({ label, value, icon: Icon, color }) {
  return (
    <div className="text-center">
      <Icon className="w-3 h-3 mx-auto mb-1" style={{ color }} />
      <p className="text-[10px] text-gray-500 mb-1">{label}</p>
      <p className="text-xs font-bold" style={{ color }}>{value}</p>
    </div>
  );
}