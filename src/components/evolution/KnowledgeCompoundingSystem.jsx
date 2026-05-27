import { useState, useEffect } from 'react';
import { TrendingUp, Brain, Zap, CheckCircle, BookOpen, Activity } from 'lucide-react';

export default function KnowledgeCompoundingSystem() {
  const [knowledgeGrowth, setKnowledgeGrowth] = useState({
    totalKnowledge: 0,
    growthRate: 0,
    categories: {},
    predictability: 0,
  });

  useEffect(() => {
    // Simulate knowledge growth tracking
    calculateKnowledgeGrowth();
  }, []);

  const calculateKnowledgeGrowth = () => {
    // In production, this would aggregate from AIMemory entity
    setKnowledgeGrowth({
      totalKnowledge: 156,
      growthRate: 12,
      categories: {
        operational: 45,
        estimates: 32,
        maintenance: 28,
        workflows: 25,
        quality: 26,
      },
      predictability: 78,
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-green-600" />
        <h2 className="text-sm font-semibold text-gray-900">Knowledge Compounding System</h2>
      </div>

      {/* Growth Indicator */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">Knowledge Growth (Monthly)</span>
          <span className="text-lg font-bold text-green-600">+{knowledgeGrowth.growthRate}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-green-600 rounded-full" style={{ width: `${knowledgeGrowth.growthRate}%` }} />
        </div>
      </div>

      {/* Total Knowledge */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
          <Brain className="w-4 h-4 text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-blue-900">{knowledgeGrowth.totalKnowledge}</p>
          <p className="text-xs text-blue-700">Total Learnings</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
          <Activity className="w-4 h-4 text-purple-600 mb-2" />
          <p className="text-2xl font-bold text-purple-900">{knowledgeGrowth.predictability}%</p>
          <p className="text-xs text-purple-700">Predictability Score</p>
        </div>
      </div>

      {/* Knowledge by Category */}
      <div>
        <h3 className="text-xs font-semibold text-gray-700 mb-2">Knowledge Distribution</h3>
        <div className="space-y-2">
          {Object.entries(knowledgeGrowth.categories).map(([category, count]) => (
            <div key={category} className="flex items-center justify-between">
              <span className="text-xs text-gray-600 capitalize">{category}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${(count / knowledgeGrowth.totalKnowledge) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-900 w-6 text-right">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Impact Statement */}
      <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-3 h-3 text-green-600" />
          <p className="text-xs text-green-800">
            Each project increases operational intelligence and future success probability
          </p>
        </div>
      </div>
    </div>
  );
}