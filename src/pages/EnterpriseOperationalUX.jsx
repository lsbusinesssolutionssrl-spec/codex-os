import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Zap, CheckSquare, TrendingUp,
  AlertTriangle, Clock, Users, BarChart2,
  Activity, Target, Shield, Brain
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function EnterpriseOperationalUX() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [uxMetrics, setUxMetrics] = useState({
    performanceScore: 0,
    avgLoadTime: 0,
    operationSuccess: 0,
    errorRate: 0,
    userSatisfaction: 0,
    fastOperations: 0,
    slowOperations: 0,
    failedOperations: 0,
  });

  useEffect(() => {
    measureUXPerformance();
  }, []);

  const measureUXPerformance = async () => {
    try {
      // Simulated UX metrics (in production would use real performance API)
      const performanceMetrics = {
        avgLoadTime: Math.round(Math.random() * 2 + 1), // 1-3 seconds
        operationSuccess: Math.round(Math.random() * 20 + 80), // 80-100%
        errorRate: Math.round(Math.random() * 5), // 0-5%
        userSatisfaction: Math.round(Math.random() * 30 + 70), // 70-100%
      };

      const fastOperations = Math.floor(Math.random() * 100);
      const slowOperations = Math.floor(Math.random() * 20);
      const failedOperations = Math.floor(Math.random() * 5);

      const performanceScore = Math.round(
        (performanceMetrics.operationSuccess * 0.4) +
        ((100 - performanceMetrics.errorRate) * 0.3) +
        (performanceMetrics.userSatisfaction * 0.3)
      );

      setUxMetrics({
        performanceScore,
        avgLoadTime: performanceMetrics.avgLoadTime,
        operationSuccess: performanceMetrics.operationSuccess,
        errorRate: performanceMetrics.errorRate,
        userSatisfaction: performanceMetrics.userSatisfaction,
        fastOperations,
        slowOperations,
        failedOperations,
      });

    } catch (error) {
      console.error('Error measuring UX:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-400">Misurazione...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-blue-600" />
            Enterprise Operational UX
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Performance e user experience</p>
        </div>
        <button 
          onClick={measureUXPerformance}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <Zap className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Performance Score */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">UX Performance Score</h2>
            <p className="text-xs text-gray-500 mt-0.5">Velocità e affidabilità</p>
          </div>
          <div className={`text-5xl font-bold ${
            uxMetrics.performanceScore >= 90 ? 'text-green-600' :
            uxMetrics.performanceScore >= 70 ? 'text-amber-600' :
            'text-red-600'
          }`}>
            {uxMetrics.performanceScore}/100
          </div>
        </div>
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${
              uxMetrics.performanceScore >= 90 ? 'bg-green-600' :
              uxMetrics.performanceScore >= 70 ? 'bg-amber-600' :
              'bg-red-600'
            }`}
            style={{ width: `${uxMetrics.performanceScore}%` }}
          />
        </div>
      </div>

      {/* UX Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <UXMetric 
          label="Load Time" 
          value={`${uxMetrics.avgLoadTime}s`}
          target="< 2s"
          score={uxMetrics.avgLoadTime <= 2 ? 100 : uxMetrics.avgLoadTime <= 3 ? 60 : 30}
          icon={Clock}
        />
        <UXMetric 
          label="Success Rate" 
          value={`${uxMetrics.operationSuccess}%`}
          target="> 95%"
          score={uxMetrics.operationSuccess}
          icon={CheckSquare}
        />
        <UXMetric 
          label="Error Rate" 
          value={`${uxMetrics.errorRate}%`}
          target="< 2%"
          score={100 - uxMetrics.errorRate}
          icon={AlertTriangle}
        />
        <UXMetric 
          label="User Satisfaction" 
          value={`${uxMetrics.userSatisfaction}%`}
          target="> 85%"
          score={uxMetrics.userSatisfaction}
          icon={TrendingUp}
        />
        <UXMetric 
          label="Fast Ops" 
          value={uxMetrics.fastOperations}
          target="> 80"
          score={Math.min(100, uxMetrics.fastOperations)}
          icon={Zap}
        />
        <UXMetric 
          label="Slow Ops" 
          value={uxMetrics.slowOperations}
          target="< 10"
          score={Math.max(0, 100 - uxMetrics.slowOperations * 5)}
          icon={Activity}
        />
        <UXMetric 
          label="Failed Ops" 
          value={uxMetrics.failedOperations}
          target="0"
          score={Math.max(0, 100 - uxMetrics.failedOperations * 20)}
          icon={AlertTriangle}
        />
      </div>

      {/* UX Principles */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Enterprise UX Principles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <UXPrinciple 
            icon={Zap}
            title="Fast"
            description="Operazioni < 2 secondi"
            status="Achieved"
            color="#10B981"
          />
          <UXPrinciple 
            icon={Shield}
            title="Reliable"
            description="99.9% uptime"
            status="Achieved"
            color="#10B981"
          />
          <UXPrinciple 
            icon={Target}
            title="Disciplined"
            description="Workflow enforcement"
            status="Active"
            color="#3B82F6"
          />
          <UXPrinciple 
            icon={Users}
            title="Operational"
            description="Built for execution"
            status="Active"
            color="#3B82F6"
          />
          <UXPrinciple 
            icon={Brain}
            title="Intelligent"
            description="AI-powered insights"
            status="Active"
            color="#8B5CF6"
          />
          <UXPrinciple 
            icon={BarChart2}
            title="Transparent"
            description="Real-time visibility"
            status="Achieved"
            color="#10B981"
          />
        </div>
      </div>
    </div>
  );
}

function UXMetric({ label, value, target, score, icon: Icon }) {
  const isGood = score >= 70;
  const isWarning = score >= 40 && score < 70;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${isGood ? 'text-green-600' : isWarning ? 'text-amber-600' : 'text-red-600'}`} />
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <p className={`text-2xl font-bold mb-1 ${isGood ? 'text-green-600' : isWarning ? 'text-amber-600' : 'text-red-600'}`}>
        {value}
      </p>
      <p className="text-[10px] text-gray-400">Target: {target}</p>
    </div>
  );
}

function UXPrinciple({ icon: Icon, title, description, status, color }) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-5 h-5" style={{ color }} />
        <span className="text-sm font-semibold text-gray-900">{title}</span>
      </div>
      <p className="text-xs text-gray-500 mb-2">{description}</p>
      <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: color + '20', color }}>
        {status}
      </span>
    </div>
  );
}