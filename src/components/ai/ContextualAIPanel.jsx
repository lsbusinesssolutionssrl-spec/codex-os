import { useState, useEffect } from 'react';
import { 
  Brain, Lightbulb, AlertTriangle, TrendingUp, TrendingDown, 
  Zap, ChevronRight, Loader2, X, CheckCircle2, AlertCircle,
  MessageSquare, FileText, Send, Sparkles, Target, Clock,
  BarChart2, DollarSign, Users, Wrench, Home, Calendar
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const SEVERITY_STYLES = {
  High: 'bg-red-50 border-red-200 text-red-700',
  Medium: 'bg-amber-50 border-amber-200 text-amber-700',
  Low: 'bg-green-50 border-green-200 text-green-700',
};

const TYPE_ICONS = {
  risk: AlertTriangle,
  opportunity: TrendingUp,
  insight: Lightbulb,
  action_required: AlertCircle,
  optimization: Target,
  communication: MessageSquare,
};

const ACTION_ICONS = {
  generate_scope_of_work: '📄',
  optimize_pricing: '💶',
  generate_customer_email: '📧',
  generate_progress_report: '📊',
  generate_client_update: '📧',
  generate_delay_explanation: '📧',
  generate_resolution_steps: '🔧',
  assign_technician: '👷',
  generate_maintenance_plan: '📋',
  create_recovery_plan: '📈',
  generate_handover_report: '🤝',
};

export default function ContextualAIPanel({ entityType, entityId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [executingAction, setExecutingAction] = useState(null);
  const [expandedSuggestion, setExpandedSuggestion] = useState(null);

  useEffect(() => {
    if (entityType && entityId) loadSuggestions();
  }, [entityType, entityId]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('generateContextualSuggestions', {
        entity_type: entityType,
        entity_id: entityId,
      });
      setData(res.data);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
      toast.error('Impossibile caricare i suggerimenti AI');
    } finally {
      setLoading(false);
    }
  };

  const executeAction = async (action) => {
    setExecutingAction(action.type);
    try {
      const res = await base44.functions.invoke('executeAIAction', {
        action_type: action.type,
        params: action.params,
        confirmed: true,
        session_id: `contextual_${entityType}_${entityId}`,
      });
      if (res.data.error) throw new Error(res.data.error);
      toast.success(`${action.label} completata`);
      loadSuggestions(); // Refresh
    } catch (error) {
      toast.error(`${action.label}: ${error.message}`);
    } finally {
      setExecutingAction(null);
    }
  };

  if (loading) {
    return (
      <div className="w-80 h-full bg-white border-l border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-xs text-gray-500">Analisi contesto in corso...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-80 h-full bg-white border-l border-gray-200 flex items-center justify-center">
        <div className="text-center px-4">
          <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-xs text-gray-500">Nessun suggerimento disponibile</p>
        </div>
      </div>
    );
  }

  const { suggestions, quickActions, confidence, entity_summary } = data;

  return (
    <div className="w-80 h-full bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1147FF 0%, #0B2341 100%)' }}>
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900">AI Copilot</p>
            <p className="text-[10px] text-gray-500 capitalize">{entity_summary?.type || entityType}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Confidence Badge */}
      {confidence && (
        <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Confidence</span>
            <span 
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: confidence.color + '20', color: confidence.color }}
            >
              {confidence.level}
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Suggestions */}
        {suggestions.length > 0 ? (
          <>
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Suggerimenti</span>
              <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{suggestions.length}</span>
            </div>
            {suggestions.map((suggestion, idx) => {
              const Icon = TYPE_ICONS[suggestion.type] || Lightbulb;
              const isExpanded = expandedSuggestion === idx;
              return (
                <div 
                  key={idx} 
                  className={`rounded-xl border p-3 transition-all cursor-pointer ${
                    SEVERITY_STYLES[suggestion.severity] || SEVERITY_STYLES.Medium
                  } ${isExpanded ? 'shadow-md' : 'hover:shadow-sm'}`}
                  onClick={() => setExpandedSuggestion(isExpanded ? null : idx)}
                >
                  <div className="flex items-start gap-2">
                    <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold mb-1">{suggestion.title}</p>
                      <p className="text-[11px] leading-relaxed opacity-90">{suggestion.description}</p>
                      {isExpanded && suggestion.recommendation && (
                        <div className="mt-2 pt-2 border-t border-gray-200/50">
                          <p className="text-[11px] font-medium mb-1 flex items-center gap-1">
                            <Zap className="w-3 h-3" /> Raccomandazione:
                          </p>
                          <p className="text-[11px] text-gray-700">{suggestion.recommendation}</p>
                          {suggestion.data_sources && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {suggestion.data_sources.map((src, i) => (
                                <span key={i} className="text-[9px] bg-white/50 px-1.5 py-0.5 rounded border border-gray-200/50">
                                  {src.replace('_', ' ')}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <ChevronRight className={`w-3 h-3 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <div className="text-center py-8">
            <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-xs text-gray-500">Nessun suggerimento critico</p>
            <p className="text-[10px] text-gray-400 mt-1">Tutto sembra essere in ordine</p>
          </div>
        )}

        {/* Quick Actions */}
        {quickActions.length > 0 && (
          <>
            <div className="flex items-center gap-2 mb-2 pt-3 border-t border-gray-100">
              <Zap className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Azioni Rapide</span>
            </div>
            <div className="space-y-1.5">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => executeAction(action)}
                  disabled={executingAction === action.type}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left group"
                >
                  <span className="text-lg">{ACTION_ICONS[action.type] || '⚡'}</span>
                  <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700 flex-1">
                    {action.label}
                  </span>
                  {executingAction === action.type ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-400" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
        <p className="text-[9px] text-gray-400 text-center">
          AI suggestions based on {data.data_sources_used?.length || 0} data sources · {entity_summary?.title || 'Current entity'}
        </p>
      </div>
    </div>
  );
}