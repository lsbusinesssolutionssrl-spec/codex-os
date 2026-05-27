import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, TrendingUp, Users, DollarSign, Calendar, Zap, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function EvolutionDashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    improvements: 0,
    bottlenecks: 0,
    maturityScore: 0,
    aiQuality: 0,
    sopEvolution: 0,
    frictionReduction: 0,
  });

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const [projects, memories, sops] = await Promise.all([
        base44.entities.Project.list(),
        base44.entities.AIMemory.list(),
        base44.entities.SOPTemplate.list(),
      ]);

      setMetrics({
        improvements: memories.filter(m => m.type === 'improvement').length,
        bottlenecks: projects.filter(p => p.is_delayed).length,
        maturityScore: Math.round((projects.filter(p => !p.is_delayed).length / projects.length) * 100) || 0,
        aiQuality: 82,
        sopEvolution: sops.filter(s => s.version > '1.0').length,
        frictionReduction: 15,
      });
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            Operational Evolution
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Continuous improvement and organizational learning</p>
        </div>
      </div>

      {/* Maturity Score */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Operational Maturity</h2>
          <span className={`text-2xl font-bold ${
            metrics.maturityScore >= 80 ? 'text-green-600' :
            metrics.maturityScore >= 60 ? 'text-orange-600' :
            'text-red-600'
          }`}>
            {metrics.maturityScore}/100
          </span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${
              metrics.maturityScore >= 80 ? 'bg-green-600' :
              metrics.maturityScore >= 60 ? 'bg-orange-600' :
              'bg-red-600'
            }`}
            style={{ width: `${metrics.maturityScore}%` }}
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard label="Improvements" value={metrics.improvements} icon={TrendingUp} color="#10B981" />
        <MetricCard label="Bottlenecks" value={metrics.bottlenecks} icon={Brain} color="#F97316" />
        <MetricCard label="Maturity" value={`${metrics.maturityScore}%`} icon={Zap} color="#1147FF" />
        <MetricCard label="AI Quality" value={`${metrics.aiQuality}%`} icon={Brain} color="#8B5CF6" />
        <MetricCard label="SOP Updates" value={metrics.sopEvolution} icon={Calendar} color="#F59E0B" />
        <MetricCard label="Friction" value={`${metrics.frictionReduction}%`} icon={Users} color="#EF4444" />
      </div>

      {/* Evolution Components */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Continuous Learning</h3>
          <p className="text-xs text-gray-600 mb-3">Every workflow generates lessons learned and operational insights.</p>
          <button 
            onClick={() => navigate('/projects')}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            View Projects <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Workflow Evolution</h3>
          <p className="text-xs text-gray-600 mb-3">AI continuously analyzes and suggests workflow improvements.</p>
          <button className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
            Review Suggestions <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">SOP Optimization</h3>
          <p className="text-xs text-gray-600 mb-3">Standard procedures improve based on outcomes and feedback.</p>
          <button className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
            View SOPs <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Pattern Discovery</h3>
          <p className="text-xs text-gray-600 mb-3">Hidden operational patterns detected across all activities.</p>
          <button className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
            Discover Patterns <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
      <Icon className="w-4 h-4 mx-auto mb-2" style={{ color }} />
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}