import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, TrendingUp, AlertTriangle, CheckCircle, 
  Clock, BarChart2, Activity, Zap,
  FileText, Users, Target, AlertCircle,
  ChevronRight, RefreshCw
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AIOperationsReview() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState({
    generatedDate: null,
    operationalRisks: [],
    delayedProjects: [],
    lowQualityData: [],
    workflowBottlenecks: [],
    recurringIssues: [],
    adoptionProblems: [],
    overallHealthScore: 0,
    summary: '',
  });

  useEffect(() => {
    generateAIReview();
  }, []);

  const generateAIReview = async () => {
    setLoading(true);
    try {
      const [projects, tasks, tickets, checklists, documents, insights] = await Promise.all([
        base44.entities.Project.list(),
        base44.entities.Task.list(),
        base44.entities.SupportTicket.list(),
        base44.entities.ChecklistItem.list(),
        base44.entities.Document.list(),
        base44.entities.IntelligenceInsight.list(),
      ]);

      // Operational Risks
      const operationalRisks = [];
      const delayedProjects = projects.filter(p => {
        const endDate = p.expected_end_date ? new Date(p.expected_end_date) : null;
        return endDate && endDate < new Date() && !['Delivered', 'Archived'].includes(p.status);
      });
      
      if (delayedProjects.length > 0) {
        operationalRisks.push({
          category: 'Project Delays',
          count: delayedProjects.length,
          severity: delayedProjects.length > 5 ? 'high' : 'medium',
          items: delayedProjects.slice(0, 5).map(p => ({
            id: p.id,
            title: p.title,
            metric: `${Math.floor((new Date() - new Date(p.expected_end_date)) / (1000 * 60 * 60 * 24))} giorni ritardo`,
          })),
        });
      }

      // Low Quality Data
      const lowQualityData = [];
      const projectsMissingData = projects.filter(p => 
        !p.project_manager || 
        !p.total_costs || 
        (p.total_costs && !p.contract_value)
      );
      
      if (projectsMissingData.length > 0) {
        lowQualityData.push({
          category: 'Missing Project Data',
          count: projectsMissingData.length,
          severity: projectsMissingData.length > 10 ? 'high' : 'medium',
          items: projectsMissingData.slice(0, 5).map(p => ({
            id: p.id,
            title: p.title,
            metric: 'Dati incompleti',
          })),
        });
      }

      // Workflow Bottlenecks
      const workflowBottlenecks = [];
      const tasksByStatus = tasks.reduce((acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      }, {});
      
      const pendingTasks = tasksByStatus['Pending'] || tasksByStatus['In Progress'] || 0;
      if (pendingTasks > tasks.length * 0.3) {
        workflowBottlenecks.push({
          category: 'Task Accumulation',
          count: pendingTasks,
          severity: pendingTasks > 50 ? 'high' : 'medium',
          items: [{ metric: `${Math.round((pendingTasks / tasks.length) * 100)}% task pending` }],
        });
      }

      // Recurring Issues
      const recurringIssues = [];
      const ticketTypes = tickets.reduce((acc, t) => {
        acc[t.issue_type] = (acc[t.issue_type] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(ticketTypes).forEach(([type, count]) => {
        if (count > 5) {
          recurringIssues.push({
            category: type || 'Generic Issue',
            count,
            severity: count > 10 ? 'high' : 'medium',
            items: [{ metric: `${count} ticket` }],
          });
        }
      });

      // Adoption Problems
      const adoptionProblems = [];
      const techniciansWithoutActivity = []; // Simplified
      if (techniciansWithoutActivity.length > 0) {
        adoptionProblems.push({
          category: 'Low Technician Adoption',
          count: techniciansWithoutActivity.length,
          severity: 'medium',
          items: techniciansWithoutActivity.slice(0, 5).map(t => ({
            title: t,
            metric: 'No activity 14 days',
          })),
        });
      }

      // Calculate Overall Health Score
      let healthScore = 100;
      healthScore -= delayedProjects.length * 5;
      healthScore -= projectsMissingData.length * 3;
      healthScore -= pendingTasks > tasks.length * 0.3 ? 10 : 0;
      healthScore -= recurringIssues.length * 5;
      healthScore = Math.max(0, Math.min(100, healthScore));

      // Generate Summary
      const summary = generateSummary({
        delayedProjects: delayedProjects.length,
        missingData: projectsMissingData.length,
        pendingTasks,
        recurringIssues: recurringIssues.length,
        healthScore,
      });

      setReview({
        generatedDate: new Date(),
        operationalRisks,
        delayedProjects: delayedProjects.map(p => ({ id: p.id, title: p.title, delay: Math.floor((new Date() - new Date(p.expected_end_date)) / (1000 * 60 * 60 * 24)) })),
        lowQualityData,
        workflowBottlenecks,
        recurringIssues,
        adoptionProblems,
        overallHealthScore: healthScore,
        summary,
      });

    } catch (error) {
      console.error('Error generating AI review:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = ({ delayedProjects, missingData, pendingTasks, recurringIssues, healthScore }) => {
    const parts = [];
    
    if (delayedProjects > 0) {
      parts.push(`${delayedProjects} progetti in ritardo`);
    }
    if (missingData > 0) {
      parts.push(`${missingData} progetti con dati incompleti`);
    }
    if (pendingTasks > 50) {
      parts.push(`${pendingTasks} task in attesa (collo di bottiglia)`);
    }
    if (recurringIssues > 0) {
      parts.push(`${recurringIssues} issue ricorrenti identificate`);
    }
    
    if (parts.length === 0) {
      return 'Operazioni nella norma. Nessuna criticità rilevata.';
    }
    
    return `Analisi operativa: ${parts.join(', ')}. Health score: ${healthScore}/100.`;
  };

  if (loading) return <div className="p-6 text-center text-gray-400">Generazione AI in corso...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            AI Operations Review
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Daily AI Operations Summary</p>
        </div>
        <button 
          onClick={generateAIReview}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Regenera
        </button>
      </div>

      {/* Overall Health Score */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Overall Operational Health</h2>
            <p className="text-xs text-gray-500 mt-0.5">{review.summary}</p>
          </div>
          <div className={`text-5xl font-bold ${
            review.overallHealthScore >= 80 ? 'text-green-600' :
            review.overallHealthScore >= 60 ? 'text-amber-600' :
            'text-red-600'
          }`}>
            {review.overallHealthScore}/100
          </div>
        </div>
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${
              review.overallHealthScore >= 80 ? 'bg-green-600' :
              review.overallHealthScore >= 60 ? 'bg-amber-600' :
              'bg-red-600'
            }`}
            style={{ width: `${review.overallHealthScore}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">Generato: {review.generatedDate?.toLocaleTimeString('it-IT')}</p>
      </div>

      {/* Critical Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {review.operationalRisks.map((risk, idx) => (
          <RiskCard key={idx} risk={risk} onClick={() => navigate('/daily-operations')} />
        ))}
        {review.lowQualityData.map((data, idx) => (
          <RiskCard key={idx} risk={data} onClick={() => navigate('/data-quality')} />
        ))}
        {review.workflowBottlenecks.map((bottleneck, idx) => (
          <RiskCard key={idx} risk={bottleneck} onClick={() => navigate('/workflow-enforcement')} />
        ))}
        {review.recurringIssues.map((issue, idx) => (
          <RiskCard key={idx} risk={issue} onClick={() => navigate('/tickets')} />
        ))}
      </div>

      {/* Delayed Projects List */}
      {review.delayedProjects.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-500" />
            Progetti in Ritardo ({review.delayedProjects.length})
          </h2>
          <div className="space-y-2">
            {review.delayedProjects.slice(0, 10).map(project => (
              <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">{project.title}</p>
                  <p className="text-xs text-red-600 mt-0.5">{project.delay} giorni di ritardo</p>
                </div>
                <button 
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="text-xs font-semibold text-blue-700 hover:underline flex items-center gap-1"
                >
                  Vedi <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RiskCard({ risk, onClick }) {
  const severityColor = {
    high: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
    medium: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
    low: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  };
  const colors = severityColor[risk.severity];

  return (
    <button 
      onClick={onClick}
      className={`${colors.bg} ${colors.border} border rounded-xl p-4 text-left hover:shadow-md transition-all`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm font-semibold text-gray-900">{risk.category}</p>
          <p className="text-xs text-gray-500 mt-0.5">{risk.count} issues</p>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${colors.bg} ${colors.text}`}>
          {risk.severity}
        </span>
      </div>
      <div className="space-y-1">
        {risk.items?.slice(0, 3).map((item, idx) => (
          <p key={idx} className="text-xs text-gray-600">• {item.title || item.metric}</p>
        ))}
      </div>
    </button>
  );
}