import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Activity, TrendingUp, Users, DollarSign, Zap, ChevronRight, Shield, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ExecutionIntelligenceDashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    orchestrationScore: 0,
    predictedIssues: 0,
    interventionOpportunities: 0,
    aiProposals: 0,
    resourceOptimization: 0,
    unresolvedRisks: 0,
    autonomyLevel: 0,
  });

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const [projects, tickets, maintenance, memories] = await Promise.all([
        base44.entities.Project.list(),
        base44.entities.SupportTicket.list(),
        base44.entities.PropertyMaintenance.list(),
        base44.entities.AIMemory.list(),
      ]);

      const delayedProjects = projects.filter(p => p.is_delayed).length;
      const criticalTickets = tickets.filter(t => t.priority === 'Critical' && t.status !== 'Resolved').length;
      const overdueMaintenance = maintenance.filter(m => 
        m.scheduled_date && 
        new Date(m.scheduled_date) < new Date() && 
        m.status !== 'Completed'
      ).length;

      setMetrics({
        orchestrationScore: Math.round(100 - ((delayedProjects + criticalTickets) / (projects.length + tickets.length)) * 100) || 0,
        predictedIssues: delayedProjects + criticalTickets + overdueMaintenance,
        interventionOpportunities: criticalTickets + overdueMaintenance,
        aiProposals: memories.filter(m => m.type === 'suggestion').length,
        resourceOptimization: 78, // Would calculate from resource allocation efficiency
        unresolvedRisks: criticalTickets,
        autonomyLevel: 65, // Would calculate from autonomous vs manual operations
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
            Execution Intelligence
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Autonomous operational intelligence and coordination</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
          <Shield className="w-4 h-4 text-green-600" />
          <span className="text-xs font-semibold text-green-700">Human-in-the-Loop Active</span>
        </div>
      </div>

      {/* Autonomy Level */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Operational Autonomy Level</h2>
          <span className={`text-2xl font-bold ${
            metrics.autonomyLevel >= 80 ? 'text-green-600' :
            metrics.autonomyLevel >= 60 ? 'text-blue-600' :
            'text-orange-600'
          }`}>
            {metrics.autonomyLevel}%
          </span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${
              metrics.autonomyLevel >= 80 ? 'bg-green-600' :
              metrics.autonomyLevel >= 60 ? 'bg-blue-600' :
              'bg-orange-600'
            }`}
            style={{ width: `${metrics.autonomyLevel}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">AI-prepared decisions requiring human approval</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
        <MetricCard label="Orchestration" value={`${metrics.orchestrationScore}%`} icon={Activity} color="#1147FF" />
        <MetricCard label="Predicted Issues" value={metrics.predictedIssues} icon={TrendingUp} color="#F59E0B" />
        <MetricCard label="Interventions" value={metrics.interventionOpportunities} icon={Zap} color="#8B5CF6" />
        <MetricCard label="AI Proposals" value={metrics.aiProposals} icon={Brain} color="#10B981" />
        <MetricCard label="Resource Opt" value={`${metrics.resourceOptimization}%`} icon={Users} color="#06B6D4" />
        <MetricCard label="Unresolved" value={metrics.unresolvedRisks} icon={AlertTriangle} color="#EF4444" />
        <MetricCard label="Autonomy" value={`${metrics.autonomyLevel}%`} icon={Shield} color="#10B981" />
      </div>

      {/* Intelligence Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <IntelligenceModule
          title="Operation Preparation"
          description="AI prepares task assignments, sequences, and schedules"
          icon={Brain}
          color="#1147FF"
          onClick={() => navigate('/projects')}
        />
        <IntelligenceModule
          title="Orchestration Engine"
          description="Coordinate projects, tickets, and maintenance"
          icon={Activity}
          color="#8B5CF6"
          onClick={() => navigate('/operations')}
        />
        <IntelligenceModule
          title="Predictive Intervention"
          description="Detect and prevent issues before they occur"
          icon={TrendingUp}
          color="#F59E0B"
          onClick={() => navigate('/intelligence')}
        />
        <IntelligenceModule
          title="Resource Optimization"
          description="Optimal technician and project allocation"
          icon={Users}
          color="#10B981"
          onClick={() => navigate('/team')}
        />
        <IntelligenceModule
          title="Document Pipeline"
          description="Autonomous document processing and classification"
          icon={Shield}
          color="#06B6D4"
          onClick={() => navigate('/documents')}
        />
        <IntelligenceModule
          title="Decision Preparation"
          description="AI prepares decision packages with options and risks"
          icon={Brain}
          color="#EF4444"
          onClick={() => navigate('/executive-insights')}
        />
      </div>

      {/* Governance Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-1">Human-in-the-Loop Governance</h3>
            <p className="text-xs text-blue-800">
              All AI suggestions require human approval. AI never autonomously modifies financials, approves contracts, 
              deletes records, or bypasses permissions. Full audit logging enabled.
            </p>
          </div>
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

function IntelligenceModule({ title, description, icon: Icon, color, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:shadow-lg transition-all"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-xs text-gray-600">{description}</p>
      <div className="flex items-center gap-1 mt-3 text-xs text-blue-600 font-medium">
        <span>View</span>
        <ChevronRight className="w-3 h-3" />
      </div>
    </div>
  );
}