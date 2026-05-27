import { useState, useEffect } from 'react';
import { Brain, Sparkles, X, Check, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function InlineAISuggestions({ context, entityType, field }) {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (context && entityType) {
      loadSuggestions();
    }
  }, [context, entityType]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateContextualSuggestions', {
        context: { ...context, entityType, field }
      });
      setSuggestions(response.data?.suggestions);
    } catch (error) {
      console.error('AI suggestions error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!suggestions || Object.keys(suggestions).length === 0) return null;

  return (
    <div className="mt-2 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-semibold text-purple-700">AI Suggestions</span>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-purple-600 hover:text-purple-800">
          <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>
      </div>
      
      {expanded && (
        <div className="space-y-2">
          {Object.entries(suggestions).map(([key, value]) => (
            <div key={key} className="flex items-start justify-between gap-3 p-2 bg-white rounded border border-purple-100">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-700 capitalize">{key.replace('_', ' ')}</p>
                <p className="text-xs text-gray-600 mt-0.5">{value}</p>
              </div>
              <button className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1">
                <Check className="w-3 h-3" />
                Usa
              </button>
            </div>
          ))}
        </div>
      )}
      
      {!expanded && (
        <p className="text-xs text-gray-600">
          {Object.keys(suggestions).length} suggerimenti disponibili
        </p>
      )}
    </div>
  );
}