import { useState, useEffect } from 'react';
import { 
  Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, 
  Loader2, BarChart2, DollarSign, Clock, Target, AlertCircle,
  Lightbulb, Activity, Zap, ChevronDown, ChevronUp
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const SEVERITY_COLORS = {
  Critical: '#EF4444',
  High: '#F97316',
  Medium: '#F59E0B45309',
  Low: '#10B981',
};

export default function AIProjectAnalysis({ projectId }) {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);

  useEffect(() => {
    if (projectId) loadAnalysis();
  }, [projectId]);

  const loadAnalysis = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('generateContextualSuggestions', {
        entity_type: 'project',
        entity_id: projectId,
      });
      setAnalysis(res.data);
    } catch (error) {
      console.error('Failed to load analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-sm text-gray-500">Analisi AI in corso...</span>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  const { suggestions, quickActions, confidence } = analysis;

  // Group suggestions by type
  const risks = suggestions.filter(s => s.type === 'risk');
  const opportunities = suggestions.filter(s => s.type === 'opportunity');
  const insights = suggestions.filter(s => s.type === 'insight');

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1147FF 0%, #0B2341 100%)' }}>
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">AI Project Analysis</h2>
            <p className="text-xs text-gray-500">Analisi intelligente del progetto</p>
          </div>
        </div>
        {confidence && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Confidence:</span>
            <span 
              className="text-xs font-semibold px-2 py-1 rounded-full"
              style={{ backgroundColor: confidence.color + '20', color: confidence.color }}
            >
              {confidence.level}
            </span>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-red-50 border border-red-100 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs text-red-700 font-medium">Rischi</span>
          </div>
          <p className="text-lg font-bold text-red-700">{risks.length}</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-green-500" />
            <span className="text-xs text-green-700 font-medium">Opportunità</span>
          </div>
          <p className="text-lg font-bold text-green-700">{opportunities.length}</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Lightbulb className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-xs text-blue-700 font-medium">Insight</span>
          </div>
          <p className="text-lg font-bold text-blue-700">{insights.length}</p>
        </div>
      </div>

      {/* Detailed Sections */}
      {risks.length > 0 && (
        <AnalysisSection 
          title="Rischi Identificati"
          icon={AlertTriangle}
          color="#EF4444"
          bgColor="bg-red-50"
          items={risks}
          expanded={expandedSection === 'risks'}
          onToggle={() => setExpandedSection(expandedSection === 'risks' ? null : 'risks')}
        />
      )}

      {opportunities.length > 0 && (
        <AnalysisSection 
          title="Opportunità"
          icon={TrendingUp}
          color="#10B981"
          bgColor="bg-green-50"
          items={opportunities}
          expanded={expandedSection === 'opportunities'}
          onToggle={() => setExpandedSection(expandedSection === 'opportunities' ? null : 'opportunities')}
        />
      )}

      {insights.length > 0 && (
        <AnalysisSection 
          title="Insight"
          icon={Lightbulb}
          color="#3B82F6"
          bgColor="bg-blue-50"
          items={insights}
          expanded={expandedSection === 'insights'}
          onToggle={() => setExpandedSection(expandedSection === 'insights' ? null : 'insights')}
        />
      )}

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-700">Azioni Rapide Suggerite</h3>
          </div>
          <div className="space-y-2">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-all text-left group"
              >
                <span className="text-lg">{action.icon || '⚡'}</span>
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 flex-1">{action.label}</span>
                <ChevronDown className="w-4 h-4 text-gray-300 group-hover:text-blue-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {suggestions.length === 0 && (
        <div className="text-center py-6">
          <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 font-medium">Nessun rischio identificato</p>
          <p className="text-xs text-gray-400 mt-1">Il progetto sembra essere in linea con gli obiettivi</p>
        </div>
      )}
    </div>
  );
}

function AnalysisSection({ title, icon: Icon, color, bgColor, items, expanded, onToggle }) {
  if (!Icon) Icon = Lightbulb;
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button 
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color }} />
          <span className="text-sm font-semibold text-gray-700">{title}</span>
          <span className="text-xs bg-white px-2 py-0.5 rounded-full border border-gray-200">{items.length}</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      
      {expanded && (
        <div className="divide-y divide-gray-100">
          {items.map((item, idx) => (
            <div key={idx} className="p-4 bg-white">
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5`} style={{ backgroundColor: SEVERITY_COLORS[item.severity] || '#9CA3AF' }} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 mb-1">{item.title}</p>
                  <p className="text-xs text-gray-600 leading-relaxed mb-2">{item.description}</p>
                  {item.recommendation && (
                    <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                      <Lightbulb className="w-3 h-3 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-800 font-medium">{item.recommendation}</p>
                    </div>
                  )}
                  {item.data_sources && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.data_sources.map((src, i) => (
                        <span key={i} className="text-[9px] bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200 text-gray-500">
                          {src.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}