import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, CheckSquare, Bell, FileText,
  Calendar, AlertTriangle, Zap, Clock,
  Users, Target, ChevronRight
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ExecutionDisciplineEngine() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [discipline, setDiscipline] = useState({
    overallScore: 0,
    remindersNeeded: 0,
    missingDailyLogs: 0,
    checklistEnforcement: 0,
    closureNotesRequired: 0,
    issueClassificationMissing: 0,
    violations: [],
  });

  useEffect(() => {
    loadDisciplineData();
  }, []);

  const loadDisciplineData = async () => {
    try {
      const [projects, tasks, checklists, tickets, timesheets] = await Promise.all([
        base44.entities.Project.list(),
        base44.entities.Task.list(),
        base44.entities.ChecklistItem.list(),
        base44.entities.SupportTicket.list(),
        base44.entities.Timesheet.list(),
      ]);

      const today = new Date().toISOString().split('T')[0];
      const thisWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Reminders Needed (projects without updates in 3 days)
      const remindersNeeded = projects.filter(p => {
        const lastUpdate = new Date(p.updated_date || p.created_date);
        const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceUpdate > 3 && !['Delivered', 'Archived'].includes(p.status);
      }).length;

      // Missing Daily Logs (technicians without timesheets today)
      const technicians = [];
      tasks.forEach(t => {
        if (t.assigned_to && !technicians.includes(t.assigned_to)) {
          technicians.push(t.assigned_to);
        }
      });
      const techniciansWithLogs = timesheets.filter(ts => ts.date === today).map(ts => ts.created_by);
      const missingDailyLogs = technicians.filter(t => !techniciansWithLogs.includes(t)).length;

      // Checklist Enforcement (projects in progress without checklists)
      const projectsInProgress = projects.filter(p => ['In Progress', 'Testing'].includes(p.status));
      const projectsWithChecklists = projectsInProgress.filter(p => 
        checklists.some(c => c.project_id === p.id)
      ).length;
      const checklistEnforcement = projectsInProgress.length > 0
        ? Math.round((projectsWithChecklists / projectsInProgress.length) * 100)
        : 100;

      // Closure Notes Required (delivered projects without notes)
      const deliveredProjects = projects.filter(p => p.status === 'Delivered');
      const projectsWithClosureNotes = deliveredProjects.filter(p => p.notes && p.notes.length > 50).length;
      const closureNotesRequired = deliveredProjects.length - projectsWithClosureNotes;

      // Issue Classification Missing (tickets without category)
      const ticketsWithoutClassification = tickets.filter(t => !t.issue_type || t.issue_type === '').length;

      // Violations
      const violations = [];
      
      // Add violations
      if (remindersNeeded > 0) {
        violations.push({
          type: 'Missing Updates',
          count: remindersNeeded,
          severity: 'warning',
          action: 'Invia reminder',
        });
      }
      if (missingDailyLogs > 0) {
        violations.push({
          type: 'Daily Logs Missing',
          count: missingDailyLogs,
          severity: 'warning',
          action: 'Richiedi logs',
        });
      }
      if (checklistEnforcement < 80) {
        violations.push({
          type: 'Checklist Skipped',
          count: projectsInProgress.length - projectsWithChecklists,
          severity: 'critical',
          action: 'Enforce checklist',
        });
      }
      if (closureNotesRequired > 0) {
        violations.push({
          type: 'Closure Notes Missing',
          count: closureNotesRequired,
          severity: 'warning',
          action: 'Richiedi note',
        });
      }
      if (ticketsWithoutClassification > 0) {
        violations.push({
          type: 'Issue Unclassified',
          count: ticketsWithoutClassification,
          severity: 'info',
          action: 'Classifica',
        });
      }

      // Calculate Overall Discipline Score
      let score = 100;
      score -= remindersNeeded * 2;
      score -= missingDailyLogs * 3;
      score -= (100 - checklistEnforcement) * 0.5;
      score -= closureNotesRequired * 2;
      score -= ticketsWithoutClassification;
      score = Math.max(0, Math.min(100, score));

      setDiscipline({
        overallScore: Math.round(score),
        remindersNeeded,
        missingDailyLogs,
        checklistEnforcement,
        closureNotesRequired,
        issueClassificationMissing: ticketsWithoutClassification,
        violations,
      });

    } catch (error) {
      console.error('Error loading discipline data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-400">Caricamento...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            Execution Discipline Engine
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Promuovi disciplina operativa</p>
        </div>
        <button 
          onClick={loadDisciplineData}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <Zap className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Overall Score */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Discipline Score</h2>
            <p className="text-xs text-gray-500 mt-0.5">Livello disciplina operativa</p>
          </div>
          <div className={`text-5xl font-bold ${
            discipline.overallScore >= 80 ? 'text-green-600' :
            discipline.overallScore >= 60 ? 'text-amber-600' :
            'text-red-600'
          }`}>
            {discipline.overallScore}/100
          </div>
        </div>
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${
              discipline.overallScore >= 80 ? 'bg-green-600' :
              discipline.overallScore >= 60 ? 'bg-amber-600' :
              'bg-red-600'
            }`}
            style={{ width: `${discipline.overallScore}%` }}
          />
        </div>
      </div>

      {/* Discipline Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <DisciplineMetric 
          label="Reminders Needed" 
          value={discipline.remindersNeeded}
          icon={Bell}
          threshold={5}
        />
        <DisciplineMetric 
          label="Missing Logs" 
          value={discipline.missingDailyLogs}
          icon={FileText}
          threshold={3}
        />
        <DisciplineMetric 
          label="Checklist %" 
          value={`${discipline.checklistEnforcement}%`}
          icon={CheckSquare}
          threshold={80}
          isPercentage
        />
        <DisciplineMetric 
          label="Closure Notes" 
          value={discipline.closureNotesRequired}
          icon={Calendar}
          threshold={5}
        />
        <DisciplineMetric 
          label="Unclassified" 
          value={discipline.issueClassificationMissing}
          icon={Target}
          threshold={5}
        />
      </div>

      {/* Violations */}
      {discipline.violations.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Violazioni Disciplina ({discipline.violations.length})
          </h2>
          <div className="space-y-3">
            {discipline.violations.map((violation, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    violation.severity === 'critical' ? 'bg-red-100 text-red-600' :
                    violation.severity === 'warning' ? 'bg-amber-100 text-amber-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{violation.type}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{violation.count} occurrences</p>
                  </div>
                </div>
                <button className="text-xs font-semibold text-blue-700 hover:underline flex items-center gap-1">
                  {violation.action} <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DisciplineMetric({ label, value, icon: Icon, threshold, isPercentage = false }) {
  const numValue = typeof value === 'string' ? parseInt(value) : value;
  const isGood = isPercentage ? numValue >= threshold : numValue <= threshold;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${isGood ? 'text-green-600' : 'text-red-600'}`} />
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${isGood ? 'text-green-600' : 'text-red-600'}`}>
        {value}
      </p>
      <p className="text-[10px] text-gray-400 mt-1">
        Threshold: {isPercentage ? '>=' : '<='} {threshold}
      </p>
    </div>
  );
}