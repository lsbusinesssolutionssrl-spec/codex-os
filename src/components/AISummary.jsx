import { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AISummary({ entityType, entityId }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (entityId) {
      generateSummary();
    }
  }, [entityType, entityId]);

  const generateSummary = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateProjectReport', {
        project_id: entityId,
        summary_only: true
      });
      setSummary(response.data?.summary || response.data);
    } catch (error) {
      console.error('Summary generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4">
        <div className="flex items-center gap-2 animate-pulse">
          <Brain className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-semibold text-purple-700">AI sta generando il riepilogo...</span>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-semibold text-purple-700">AI Summary</span>
        </div>
        <button 
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-purple-600 hover:text-purple-800 font-medium"
        >
          {expanded ? 'Mostra meno' : 'Mostra tutto'}
        </button>
      </div>

      <div className={`space-y-3 ${expanded ? '' : 'max-h-32 overflow-hidden'}`}>
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          {summary.health_score && (
            <div className="bg-white rounded-lg p-2 border border-purple-100">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-[10px] text-gray-500">Health</span>
              </div>
              <p className="text-sm font-bold text-gray-900">{summary.health_score}/100</p>
            </div>
          )}
          {summary.margin_pct && (
            <div className="bg-white rounded-lg p-2 border border-purple-100">
              <div className="flex items-center gap-1 mb-1">
                <DollarSign className="w-3 h-3 text-blue-600" />
                <span className="text-[10px] text-gray-500">Margine</span>
              </div>
              <p className="text-sm font-bold text-gray-900">{summary.margin_pct}%</p>
            </div>
          )}
          {summary.delay_days && (
            <div className="bg-white rounded-lg p-2 border border-purple-100">
              <div className="flex items-center gap-1 mb-1">
                <Clock className="w-3 h-3 text-orange-600" />
                <span className="text-[10px] text-gray-500">Ritardo</span>
              </div>
              <p className="text-sm font-bold text-gray-900">{summary.delay_days} giorni</p>
            </div>
          )}
          {summary.issues_count && (
            <div className="bg-white rounded-lg p-2 border border-purple-100">
              <div className="flex items-center gap-1 mb-1">
                <AlertTriangle className="w-3 h-3 text-red-600" />
                <span className="text-[10px] text-gray-500">Issue</span>
              </div>
              <p className="text-sm font-bold text-gray-900">{summary.issues_count}</p>
            </div>
          )}
        </div>

        {/* TL;DR Summary */}
        {summary.tldr && (
          <div className="bg-white rounded-lg p-3 border border-purple-100">
            <p className="text-xs font-semibold text-gray-700 mb-1">TL;DR</p>
            <p className="text-xs text-gray-600 leading-relaxed">{summary.tldr}</p>
          </div>
        )}

        {/* Key Points */}
        {summary.key_points && summary.key_points.length > 0 && (
          <div className="bg-white rounded-lg p-3 border border-purple-100">
            <p className="text-xs font-semibold text-gray-700 mb-2">Punti Chiave</p>
            <ul className="space-y-1">
              {summary.key_points.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                  <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Items */}
        {summary.action_items && summary.action_items.length > 0 && (
          <div className="bg-white rounded-lg p-3 border border-purple-100">
            <p className="text-xs font-semibold text-gray-700 mb-2">Azioni Richieste</p>
            <ul className="space-y-1">
              {summary.action_items.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                  <span className="text-orange-600 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}