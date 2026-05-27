import { useState, useEffect } from 'react';
import { Clock, TrendingUp, AlertTriangle, Brain, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function PredictiveOperations({ entityType, entityId }) {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (entityType && entityId) {
      loadPredictions();
    }
  }, [entityType, entityId]);

  const loadPredictions = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generatePredictiveInsights', {
        project_id: entityType === 'project' ? entityId : undefined,
        analysis_type: 'predictive'
      });
      setPredictions(response.data?.predictions || []);
    } catch (error) {
      console.error('Prediction error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 animate-pulse">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-semibold text-purple-700">Generating predictions...</span>
        </div>
      </div>
    );
  }

  if (predictions.length === 0) return null;

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-4 h-4 text-purple-600" />
        <span className="text-xs font-semibold text-purple-700">Predictive Operations</span>
      </div>

      <div className="space-y-2">
        {predictions.map((prediction, idx) => (
          <div key={idx} className="bg-white rounded-lg p-3 border border-purple-100">
            <div className="flex items-start gap-2">
              {prediction.type === 'delay' && <Clock className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />}
              {prediction.type === 'budget' && <TrendingUp className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />}
              {prediction.type === 'risk' && <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />}
              
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-900">{prediction.title}</p>
                <p className="text-xs text-gray-600 mt-0.5">{prediction.description}</p>
                
                {prediction.confidence && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-600 rounded-full"
                        style={{ width: `${prediction.confidence}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-500">{prediction.confidence}% confidence</span>
                  </div>
                )}

                {prediction.timeframe && (
                  <p className="text-[10px] text-gray-400 mt-1">
                    Expected: {prediction.timeframe}
                  </p>
                )}
              </div>
              
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}