import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GitCompare, AlertTriangle, TrendingDown, Clock,
  Users, FileText, CheckSquare, Zap,
  BarChart2, ChevronRight
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function RealityGapAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [gaps, setGaps] = useState({
    overallGapScore: 0,
    designedVsActual: [],
    workflowBypasses: [],
    manualWorkarounds: [],
    complianceIssues: [],
  });

  useEffect(() => {
    analyzeRealityGaps();
  }, []);

  const analyzeRealityGaps = async () => {
    try {
      const [projects, tasks, checklists, documents, tickets, timesheets] = await Promise.all([
        base44.entities.Project.list(),
        base44.entities.Task.list(),
        base44.entities.ChecklistItem.list(),
        base44.entities.Document.list(),
        base44.entities.SupportTicket.list(),
        base44.entities.Timesheet.list(),
      ]);

      const designedVsActual = [];
      const workflowBypasses = [];
      const manualWorkarounds = [];
      const complianceIssues = [];

      // 1. Projects Updated Late (designed: real-time, actual: delayed)
      const lateUpdates = projects.filter(p => {
        const lastUpdate = new Date(p.updated_date || p.created_date);
        const daysSince = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince > 5 && !['Delivered', 'Archived'].includes(p.status);
      }).length;
      
      if (lateUpdates > 0) {
        designedVsActual.push({
          workflow: 'Project Updates',
          designed: 'Real-time',
          actual: `${Math.round((lateUpdates / projects.length) * 100)}% in ritardo`,
          gap: 'High',
        });
      }

      // 2. Technicians Skipping Checklists
      const projectsInProgress = projects.filter(p => ['In Progress', 'Testing'].includes(p.status));
      const projectsWithoutChecklists = projectsInProgress.filter(p => 
        !checklists.some(c => c.project_id === p.id)
      ).length;
      
      if (projectsWithoutChecklists > 0) {
        workflowBypasses.push({
          workflow: 'Checklist Completion',
          bypassRate: `${Math.round((projectsWithoutChecklists / projectsInProgress.length) * 100)}%`,
          impact: 'Quality risk',
          count: projectsWithoutChecklists,
        });
      }

      // 3. Manual Communication Outside Platform
      const projectsWithoutComments = projects.filter(p => {
        // Simplified - in production would check external communication
        return true; // Placeholder
      }).length;
      
      manualWorkarounds.push({
        type: 'Communication',
        description: 'Possibile uso WhatsApp/email invece di commenti',
        estimatedRate: '30%',
      });

      // 4. Repeated Workflow Bypasses
      const estimatesWithoutRequiredFields = []; // Placeholder
      const deliveriesWithoutPhotos = projects.filter(p => 
        p.status === 'Delivered' && 
        (!p.photos_after || p.photos_after.length === 0)
      ).length;
      
      if (deliveriesWithoutPhotos > 0) {
        workflowBypasses.push({
          workflow: 'Photo Documentation',
          bypassRate: `${Math.round((deliveriesWithoutPhotos / projects.filter(p => p.status === 'Delivered').length) * 100)}%`,
          impact: 'No as-built records',
          count: deliveriesWithoutPhotos,
        });
      }

      // 5. Compliance Issues
      const projectsWithoutPM = projects.filter(p => !p.project_manager).length;
      if (projectsWithoutPM > 0) {
        complianceIssues.push({
          issue: 'Missing Project Manager',
          count: projectsWithoutPM,
          severity: 'high',
        });
      }

      const projectsWithoutCosts = projects.filter(p => !p.total_costs).length;
      if (projectsWithoutCosts > 0) {
        complianceIssues.push({
          issue: 'Missing Cost Tracking',
          count: projectsWithoutCosts,
          severity: 'high',
        });
      }

      // Calculate Overall Gap Score
      let gapScore = 100;
      gapScore -= (lateUpdates / projects.length) * 30;
      gapScore -= (projectsWithoutChecklists / (projectsInProgress.length || 1)) * 25;
      gapScore -= (projectsWithoutPM / projects.length) * 20;
      gapScore -= (projectsWithoutCosts / projects.length) * 25;
      gapScore = Math.max(0, Math.min(100, gapScore));

      setGaps({
        overallGapScore: Math.round(gapScore),
        designedVsActual,
        workflowBypasses,
        manualWorkarounds,
        complianceIssues,
      });

    } catch (error) {
      console.error('Error analyzing reality gaps:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-400">Analisi in corso...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GitCompare className="w-6 h-6 text-purple-600" />
            Reality Gap Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Analisi gap tra workflow progettato e reale</p>
        </div>
        <button 
          onClick={analyzeRealityGaps}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <Zap className="w-3.5 h-3.5" />
          Analyze
        </button>
      </div>

      {/* Overall Gap Score */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Workflow Reality Score</h2>
            <p className="text-xs text-gray-500 mt-0.5">Quanto il reale segue il progettato</p>
          </div>
          <div className={`text-5xl font-bold ${
            gaps.overallGapScore >= 80 ? 'text-green-600' :
            gaps.overallGapScore >= 60 ? 'text-amber-600' :
            'text-red-600'
          }`}>
            {gaps.overallGapScore}/100
          </div>
        </div>
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${
              gaps.overallGapScore >= 80 ? 'bg-green-600' :
              gaps.overallGapScore >= 60 ? 'bg-amber-600' :
              'bg-red-600'
            }`}
            style={{ width: `${gaps.overallGapScore}%` }}
          />
        </div>
      </div>

      {/* Designed vs Actual */}
      {gaps.designedVsActual.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-blue-500" />
            Designed vs Actual
          </h2>
          <div className="space-y-3">
            {gaps.designedVsActual.map((gap, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-900">{gap.workflow}</p>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    gap.gap === 'High' ? 'bg-red-100 text-red-700' :
                    gap.gap === 'Medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {gap.gap} Gap
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-gray-500">Designed</p>
                    <p className="font-semibold text-green-600">{gap.designed}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Actual</p>
                    <p className="font-semibold text-red-600">{gap.actual}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workflow Bypasses */}
      {gaps.workflowBypasses.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-red-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            Workflow Bypasses ({gaps.workflowBypasses.length})
          </h2>
          <div className="space-y-3">
            {gaps.workflowBypasses.map((bypass, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-100">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{bypass.workflow}</p>
                  <p className="text-xs text-red-600 mt-0.5">{bypass.bypassRate} · {bypass.impact}</p>
                </div>
                <span className="text-sm font-bold text-red-600">{bypass.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compliance Issues */}
      {gaps.complianceIssues.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-amber-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            Compliance Issues ({gaps.complianceIssues.length})
          </h2>
          <div className="space-y-2">
            {gaps.complianceIssues.map((issue, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-100">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{issue.issue}</p>
                  <p className="text-xs text-amber-600 mt-0.5">{issue.count} projects</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  issue.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {issue.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}