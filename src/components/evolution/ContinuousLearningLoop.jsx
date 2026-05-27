import { useState, useEffect } from 'react';
import { Brain, TrendingUp, CheckCircle, AlertTriangle, Clock, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ContinuousLearningLoop({ entityType, entityId, onComplete }) {
  const [learning, setLearning] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (entityId && onComplete) {
      captureLearning();
    }
  }, [entityType, entityId, onComplete]);

  const captureLearning = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateProjectLearning', {
        project_id: entityType === 'project' ? entityId : undefined,
        capture_type: 'completion'
      });
      setLearning(response.data);
      
      // Save to AIMemory
      await base44.functions.invoke('saveAIMemory', {
        memory_type: 'operational_learning',
        context: { entityType, entityId, learning: response.data }
      });
    } catch (error) {
      console.error('Learning capture error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 animate-pulse">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-semibold text-blue-700">Capturing lessons learned...</span>
        </div>
      </div>
    );
  }

  if (!learning) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-4 h-4 text-blue-600" />
        <span className="text-xs font-semibold text-blue-700">Continuous Learning</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {learning.what_went_well && (
          <div className="bg-white rounded-lg p-3 border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-3 h-3 text-green-600" />
              <span className="text-xs font-semibold text-gray-900">What Went Well</span>
            </div>
            <p className="text-xs text-gray-700">{learning.what_went_well}</p>
          </div>
        )}
        
        {learning.what_went_wrong && (
          <div className="bg-white rounded-lg p-3 border border-red-100">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-3 h-3 text-red-600" />
              <span className="text-xs font-semibold text-gray-900">What Went Wrong</span>
            </div>
            <p className="text-xs text-gray-700">{learning.what_went_wrong}</p>
          </div>
        )}

        {learning.delay_analysis && (
          <div className="bg-white rounded-lg p-3 border border-orange-100">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-3 h-3 text-orange-600" />
              <span className="text-xs font-semibold text-gray-900">Delay Analysis</span>
            </div>
            <p className="text-xs text-gray-700">{learning.delay_analysis}</p>
          </div>
        )}

        {learning.improvements && (
          <div className="bg-white rounded-lg p-3 border border-purple-100">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-3 h-3 text-purple-600" />
              <span className="text-xs font-semibold text-gray-900">Improvements</span>
            </div>
            <p className="text-xs text-gray-700">{learning.improvements}</p>
          </div>
        )}
      </div>

      {/* Save Confirmation */}
      <div className="flex items-center gap-2 text-xs text-blue-600">
        <CheckCircle className="w-3 h-3" />
        <span>Learning saved to organizational memory</span>
      </div>
    </div>
  );
}