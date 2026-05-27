import { useState, useEffect } from 'react';
import { Brain, Zap, TrendingDown, Clock, AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function OperationalEvolutionEngine() {
  const [improvements, setImprovements] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    analyzeWorkflows();
  }, []);

  const analyzeWorkflows = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateIntelligenceInsights', {
        analysis_type: 'workflow_evolution'
      });
      setImprovements(response.data?.improvements || []);
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-400">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm">Analyzing workflows...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-4 h-4 text-purple-600" />
        <h2 className="text-sm font-semibold text-gray-900">Operational Evolution Engine</h2>
      </div>

      {improvements.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
          <p className="text-sm">No improvements detected. Workflows are optimized.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {improvements.map((improvement, idx) => (
            <ImprovementCard key={idx} improvement={improvement} />
          ))}
        </div>
      )}
    </div>
  );
}

function ImprovementCard({ improvement }) {
  const typeConfig = {
    redundant_approval: { icon: Clock, color: '#F59E0B', label: 'Redundant Approval' },
    skipped_step: { icon: AlertTriangle, color: '#F97316', label: 'Skipped Step' },
    delay_pattern: { icon: TrendingDown, color: '#EF4444', label: 'Delay Pattern' },
    unnecessary_entry: { icon: Zap, color: '#8B5CF6', label: 'Unnecessary Entry' },
    bottleneck: { icon: Clock, color: '#EF4444', label: 'Bottleneck' },
    automation: { icon: Zap, color: '#10B981', label: 'Automation Opportunity' },
  };

  const config = typeConfig[improvement.type] || typeConfig.bottleneck;
  const Icon = config.icon;

  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0`} style={{ backgroundColor: `${config.color}15` }}>
          <Icon className="w-4 h-4" style={{ color: config.color }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-gray-900">{config.label}</span>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
              improvement.impact === 'high' ? 'bg-red-100 text-red-700' :
              improvement.impact === 'medium' ? 'bg-orange-100 text-orange-700' :
              'bg-green-100 text-green-700'
            }`}>
              {improvement.impact} impact
            </span>
          </div>
          <p className="text-xs text-gray-700 mb-2">{improvement.description}</p>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Confidence: {improvement.confidence}%</p>
            <button className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1 font-medium">
              Review <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}