import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Smartphone, CheckSquare, Image, Mic, 
  FileText, TrendingUp, TrendingDown, AlertTriangle,
  Users, Activity, Clock, Target, BarChart2,
  AlertCircle, Zap, Eye, X
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function FieldAdoptionTracking() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [adoptionData, setAdoptionData] = useState({
    overallScore: 0,
    technicianAppUsage: 0,
    checklistUsageRate: 0,
    photoUploadRate: 0,
    voiceNotesUsage: 0,
    workflowCompletionRate: 0,
    ticketHandlingRate: 0,
    projectUpdateFrequency: 0,
    bypassingUsers: [],
    lowAdoptionWorkflows: [],
    manualWorkarounds: [],
  });

  useEffect(() => {
    loadAdoptionData();
  }, []);

  const loadAdoptionData = async () => {
    try {
      const [users, projects, tasks, checklists, documents, tickets, timesheets] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.Project.list(),
        base44.entities.Task.list(),
        base44.entities.ChecklistItem.list(),
        base44.entities.Document.list(),
        base44.entities.SupportTicket.list(),
        base44.entities.Timesheet.list(),
      ]);

      const technicians = users.filter(u => u.role === 'technician');
      const activeTechnicians = technicians.filter(t => 
        timesheets.some(ts => ts.created_by === t.email && 
        new Date(ts.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      );

      // Technician app usage
      const technicianAppUsage = technicians.length > 0 
        ? Math.round((activeTechnicians.length / technicians.length) * 100) 
        : 0;

      // Checklist usage rate
      const projectsInProgress = projects.filter(p => ['In Progress', 'Testing'].includes(p.status));
      const projectsWithChecklists = projectsInProgress.filter(p => 
        checklists.some(c => c.project_id === p.id)
      ).length;
      const checklistUsageRate = projectsInProgress.length > 0
        ? Math.round((projectsWithChecklists / projectsInProgress.length) * 100)
        : 0;

      // Photo upload rate
      const projectsWithPhotos = projectsInProgress.filter(p => 
        (p.photos_during && p.photos_during.length > 0) ||
        (p.photos_after && p.photos_after.length > 0)
      ).length;
      const photoUploadRate = projectsInProgress.length > 0
        ? Math.round((projectsWithPhotos / projectsInProgress.length) * 100)
        : 0;

      // Workflow completion rate
      const completedProjects = projects.filter(p => p.status === 'Delivered').length;
      const workflowCompletionRate = projects.length > 0
        ? Math.round((completedProjects / projects.length) * 100)
        : 0;

      // Ticket handling rate
      const resolvedTickets = tickets.filter(t => ['Resolved', 'Closed'].includes(t.status)).length;
      const ticketHandlingRate = tickets.length > 0
        ? Math.round((resolvedTickets / tickets.length) * 100)
        : 0;

      // Detect bypassing users (no activity in last 14 days)
      const bypassingUsers = technicians.filter(t => {
        const recentActivity = timesheets.some(ts => 
          ts.created_by === t.email && 
          new Date(ts.date) >= new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
        );
        return !recentActivity;
      }).map(t => ({
        name: t.full_name || t.email,
        role: t.role,
        lastActivity: 'Oltre 14 giorni',
      }));

      // Low adoption workflows
      const lowAdoptionWorkflows = [];
      if (checklistUsageRate < 50) {
        lowAdoptionWorkflows.push({
          workflow: 'Checklist Completamento',
          adoption: checklistUsageRate,
          impact: 'Alto',
        });
      }
      if (photoUploadRate < 50) {
        lowAdoptionWorkflows.push({
          workflow: 'Upload Foto Avanzamento',
          adoption: photoUploadRate,
          impact: 'Alto',
        });
      }
      if (workflowCompletionRate < 30) {
        lowAdoptionWorkflows.push({
          workflow: 'Chiusura Progetti',
          adoption: workflowCompletionRate,
          impact: 'Medio',
        });
      }

      // Calculate overall score
      const scores = [
        technicianAppUsage,
        checklistUsageRate,
        photoUploadRate,
        workflowCompletionRate,
        ticketHandlingRate,
      ].filter(s => s > 0);
      const overallScore = scores.length > 0 
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) 
        : 0;

      setAdoptionData({
        overallScore,
        technicianAppUsage,
        checklistUsageRate,
        photoUploadRate,
        voiceNotesUsage: 0, // Placeholder for future feature
        workflowCompletionRate,
        ticketHandlingRate,
        projectUpdateFrequency: 0, // Placeholder
        bypassingUsers,
        lowAdoptionWorkflows,
        manualWorkarounds: [],
      });

    } catch (error) {
      console.error('Error loading adoption data:', error);
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
            <Smartphone className="w-6 h-6 text-blue-600" />
            Field Adoption Tracking
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Misura l'adozione reale del software sul campo</p>
        </div>
        <button 
          onClick={loadAdoptionData}
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
            <h2 className="text-sm font-semibold text-gray-900">Overall Adoption Score</h2>
            <p className="text-xs text-gray-500 mt-0.5">Media utilizzo piattaforma</p>
          </div>
          <div className={`text-4xl font-bold ${
            adoptionData.overallScore >= 70 ? 'text-green-600' :
            adoptionData.overallScore >= 50 ? 'text-amber-600' :
            'text-red-600'
          }`}>
            {adoptionData.overallScore}/100
          </div>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${
              adoptionData.overallScore >= 70 ? 'bg-green-600' :
              adoptionData.overallScore >= 50 ? 'bg-amber-600' :
              'bg-red-600'
            }`}
            style={{ width: `${adoptionData.overallScore}%` }}
          />
        </div>
      </div>

      {/* Adoption Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <AdoptionMetric 
          label="Technician App" 
          value={adoptionData.technicianAppUsage} 
          icon={Users}
          threshold={80}
        />
        <AdoptionMetric 
          label="Checklist Usage" 
          value={adoptionData.checklistUsageRate} 
          icon={CheckSquare}
          threshold={70}
        />
        <AdoptionMetric 
          label="Photo Upload" 
          value={adoptionData.photoUploadRate} 
          icon={Image}
          threshold={70}
        />
        <AdoptionMetric 
          label="Voice Notes" 
          value={adoptionData.voiceNotesUsage} 
          icon={Mic}
          threshold={50}
        />
        <AdoptionMetric 
          label="Workflow Complete" 
          value={adoptionData.workflowCompletionRate} 
          icon={Target}
          threshold={60}
        />
        <AdoptionMetric 
          label="Ticket Handling" 
          value={adoptionData.ticketHandlingRate} 
          icon={FileText}
          threshold={70}
        />
        <AdoptionMetric 
          label="Update Frequency" 
          value={adoptionData.projectUpdateFrequency} 
          icon={Activity}
          threshold={50}
        />
      </div>

      {/* Bypassing Users */}
      {adoptionData.bypassingUsers.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-sm font-semibold text-red-900">
              Utenti che Bypassano la Piattaforma ({adoptionData.bypassingUsers.length})
            </h3>
          </div>
          <div className="space-y-2">
            {adoptionData.bypassingUsers.map((user, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-100">
                <div>
                  <p className="text-sm font-medium text-red-900">{user.name}</p>
                  <p className="text-xs text-red-600">{user.lastActivity}</p>
                </div>
                <button className="text-xs font-semibold text-red-700 hover:underline">
                  Notifica
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Low Adoption Workflows */}
      {adoptionData.lowAdoptionWorkflows.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-semibold text-amber-900">
              Workflow a Bassa Adozione ({adoptionData.lowAdoptionWorkflows.length})
            </h3>
          </div>
          <div className="space-y-2">
            {adoptionData.lowAdoptionWorkflows.map((workflow, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-100">
                <div>
                  <p className="text-sm font-medium text-amber-900">{workflow.workflow}</p>
                  <p className="text-xs text-amber-600">Adozione: {workflow.adoption}% · Impatto: {workflow.impact}</p>
                </div>
                <button className="text-xs font-semibold text-amber-700 hover:underline">
                  Intervieni
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Raccomandazioni</h3>
        <div className="space-y-3">
          {adoptionData.checklistUsageRate < 70 && (
            <Recommendation 
              title="Migliora adozione checklist"
              description="Implementa reminder automatici e rendi le checklist più snelle"
              impact="Alto"
            />
          )}
          {adoptionData.photoUploadRate < 70 && (
            <Recommendation 
              title="Incentiva upload foto"
              description="Aggiungi upload rapido da mobile e photo validation"
              impact="Alto"
            />
          )}
          {adoptionData.technicianAppUsage < 80 && (
            <Recommendation 
              title="Aumenta utilizzo app"
              description="Training aggiuntivo e semplificazione UX per tecnici"
              impact="Critico"
            />
          )}
          {adoptionData.overallScore >= 70 && (
            <p className="text-sm text-green-600 flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              Ottima adozione! Continua così.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function AdoptionMetric({ label, value, icon: Icon, threshold }) {
  const isGood = value >= threshold;
  const isWarning = value >= threshold - 20 && value < threshold;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${isGood ? 'text-green-600' : isWarning ? 'text-amber-600' : 'text-red-600'}`} />
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <p className={`text-2xl font-bold ${isGood ? 'text-green-600' : isWarning ? 'text-amber-600' : 'text-red-600'}`}>
          {value}%
        </p>
        {value >= threshold ? (
          <TrendingUp className="w-4 h-4 text-green-600" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-600" />
        )}
      </div>
      <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full ${isGood ? 'bg-green-600' : isWarning ? 'bg-amber-600' : 'bg-red-600'}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function Recommendation({ title, description, impact }) {
  return (
    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-blue-900">{title}</p>
          <p className="text-xs text-blue-600 mt-0.5">{description}</p>
        </div>
        <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded-full ml-2">
          {impact}
        </span>
      </div>
    </div>
  );
}