import { useState, useEffect } from 'react';
import { Activity, TrendingUp, Clock, CheckCircle, AlertTriangle, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ProcessIntelligence() {
  const [metrics, setMetrics] = useState({
    workflows: [],
    efficiency: [],
    bottlenecks: [],
    qualityScores: [],
  });

  useEffect(() => {
    analyzeProcesses();
  }, []);

  const analyzeProcesses = async () => {
    try {
      const [projects, estimates, tickets, timesheets] = await Promise.all([
        base44.entities.Project.list(),
        base44.entities.Estimate.list(),
        base44.entities.SupportTicket.list(),
        base44.entities.Timesheet.list(),
      ]);

      // Calculate workflow efficiency
      const workflowMetrics = projects.map(p => {
        const duration = p.actual_duration || p.estimated_duration;
        const onTime = p.status === 'Delivered' && !p.is_delayed;
        return {
          project_id: p.id,
          duration,
          onTime,
          efficiency: onTime ? 100 : 70,
        };
      });

      // Detect bottlenecks
      const bottlenecks = [];
      const delayedProjects = projects.filter(p => p.is_delayed || p.status === 'delayed');
      if (delayedProjects.length > 0) {
        bottlenecks.push({
          type: 'Project Delays',
          count: delayedProjects.length,
          severity: delayedProjects.length > 5 ? 'high' : 'medium'
        });
      }

      // Calculate quality scores
      const avgEfficiency = workflowMetrics.reduce((sum, w) => sum + w.efficiency, 0) / workflowMetrics.length || 0;
      
      setMetrics({
        workflows: workflowMetrics,
        efficiency: [{ name: 'Overall Efficiency', value: Math.round(avgEfficiency) }],
        bottlenecks,
        qualityScores: [{ name: 'Process Quality', value: Math.round(avgEfficiency * 0.9) }],
      });
    } catch (error) {
      console.error('Analysis error:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-blue-600" />
        <h2 className="text-sm font-semibold text-gray-900">Process Intelligence</h2>
      </div>

      {/* Quality Score */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">Process Quality Score</span>
          <span className="text-lg font-bold text-blue-600">{metrics.qualityScores[0]?.value || 0}/100</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 rounded-full transition-all"
            style={{ width: `${metrics.qualityScores[0]?.value || 0}%` }}
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <MetricCard 
          label="Workflows" 
          value={metrics.workflows.length}
          icon={Activity}
          color="#1147FF"
        />
        <MetricCard 
          label="Efficiency" 
          value={`${metrics.efficiency[0]?.value || 0}%`}
          icon={TrendingUp}
          color="#10B981"
        />
        <MetricCard 
          label="Bottlenecks" 
          value={metrics.bottlenecks.reduce((sum, b) => sum + b.count, 0)}
          icon={AlertTriangle}
          color="#F97316"
        />
      </div>

      {/* Bottlenecks */}
      {metrics.bottlenecks.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-700 mb-2">Detected Bottlenecks</h3>
          <div className="space-y-2">
            {metrics.bottlenecks.map((bottleneck, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3 text-orange-600" />
                  <span className="text-xs text-gray-700">{bottleneck.type}</span>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  bottleneck.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {bottleneck.count} issues
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <Icon className="w-4 h-4 mx-auto mb-1" style={{ color }} />
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="text-[10px] text-gray-500">{label}</p>
    </div>
  );
}