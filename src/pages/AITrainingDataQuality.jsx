import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, Database, AlertTriangle, CheckCircle,
  Image, FileText, MessageSquare, Zap,
  TrendingUp, BarChart2
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AITrainingDataQuality() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [quality, setQuality] = useState({
    readinessScore: 0,
    missingContext: 0,
    poorNotes: 0,
    inconsistentUploads: 0,
    incompleteTickets: 0,
    lowQualityPhotos: 0,
    invalidProjectData: 0,
    byCategory: {},
  });

  useEffect(() => {
    evaluateDataQuality();
  }, []);

  const evaluateDataQuality = async () => {
    try {
      const [projects, tickets, documents, checklists, comments, memories] = await Promise.all([
        base44.entities.Project.list(),
        base44.entities.SupportTicket.list(),
        base44.entities.Document.list(),
        base44.entities.ChecklistItem.list(),
        base44.entities.Comment.list(),
        base44.entities.AIMemory.list(),
      ]);

      // Missing Context (projects without notes/description)
      const missingContext = projects.filter(p => 
        !p.project_summary || p.project_summary.length < 50
      ).length;

      // Poor Notes (comments too short)
      const poorNotes = comments.filter(c => 
        !c.content || c.content.length < 20
      ).length;

      // Inconsistent Uploads (documents without proper metadata)
      const inconsistentUploads = documents.filter(d => 
        !d.category || !d.description
      ).length;

      // Incomplete Tickets (tickets without resolution notes)
      const incompleteTickets = tickets.filter(t => 
        ['Resolved', 'Closed'].includes(t.status) && 
        (!t.resolution_notes || t.resolution_notes.length < 30)
      ).length;

      // Low Quality Photos (projects with very few photos)
      const lowQualityPhotos = projects.filter(p => 
        ['In Progress', 'Delivered'].includes(p.status) &&
        ((p.photos_during?.length || 0) + (p.photos_after?.length || 0)) < 3
      ).length;

      // Invalid Project Data (missing critical fields)
      const invalidProjectData = projects.filter(p => 
        !p.contract_value || 
        !p.total_costs ||
        !p.expected_end_date
      ).length;

      // Calculate Readiness Score
      const totalItems = projects.length + tickets.length + documents.length + comments.length;
      const issues = missingContext + poorNotes + inconsistentUploads + incompleteTickets + lowQualityPhotos + invalidProjectData;
      const readinessScore = totalItems > 0
        ? Math.round(((totalItems - issues) / totalItems) * 100)
        : 0;

      // By Category breakdown
      const byCategory = {
        Projects: {
          score: projects.length > 0 
            ? Math.round(((projects.length - missingContext - lowQualityPhotos - invalidProjectData) / projects.length) * 100)
            : 100,
          issues: missingContext + lowQualityPhotos + invalidProjectData,
        },
        Tickets: {
          score: tickets.length > 0
            ? Math.round(((tickets.length - incompleteTickets) / tickets.length) * 100)
            : 100,
          issues: incompleteTickets,
        },
        Documents: {
          score: documents.length > 0
            ? Math.round(((documents.length - inconsistentUploads) / documents.length) * 100)
            : 100,
          issues: inconsistentUploads,
        },
        Comments: {
          score: comments.length > 0
            ? Math.round(((comments.length - poorNotes) / comments.length) * 100)
            : 100,
          issues: poorNotes,
        },
      };

      setQuality({
        readinessScore,
        missingContext,
        poorNotes,
        inconsistentUploads,
        incompleteTickets,
        lowQualityPhotos,
        invalidProjectData,
        byCategory,
      });

    } catch (error) {
      console.error('Error evaluating data quality:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-400">Valutazione in corso...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            AI Training Data Quality
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Valutazione qualità dati per AI</p>
        </div>
        <button 
          onClick={evaluateDataQuality}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <Zap className="w-3.5 h-3.5" />
          Re-evaluate
        </button>
      </div>

      {/* Readiness Score */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">AI Data Readiness Score</h2>
            <p className="text-xs text-gray-500 mt-0.5">Qualità dati per training AI</p>
          </div>
          <div className={`text-5xl font-bold ${
            quality.readinessScore >= 80 ? 'text-green-600' :
            quality.readinessScore >= 60 ? 'text-amber-600' :
            'text-red-600'
          }`}>
            {quality.readinessScore}/100
          </div>
        </div>
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${
              quality.readinessScore >= 80 ? 'bg-green-600' :
              quality.readinessScore >= 60 ? 'bg-amber-600' :
              'bg-red-600'
            }`}
            style={{ width: `${quality.readinessScore}%` }}
          />
        </div>
      </div>

      {/* Quality Issues */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <QualityIssueCard 
          label="Missing Context" 
          count={quality.missingContext}
          icon={Database}
          color="#EF4444"
        />
        <QualityIssueCard 
          label="Poor Notes" 
          count={quality.poorNotes}
          icon={MessageSquare}
          color="#F59E0B"
        />
        <QualityIssueCard 
          label="Inconsistent Uploads" 
          count={quality.inconsistentUploads}
          icon={FileText}
          color="#F59E0B"
        />
        <QualityIssueCard 
          label="Incomplete Tickets" 
          count={quality.incompleteTickets}
          icon={AlertTriangle}
          color="#EF4444"
        />
        <QualityIssueCard 
          label="Low Quality Photos" 
          count={quality.lowQualityPhotos}
          icon={Image}
          color="#F59E0B"
        />
        <QualityIssueCard 
          label="Invalid Data" 
          count={quality.invalidProjectData}
          icon={AlertTriangle}
          color="#EF4444"
        />
      </div>

      {/* By Category */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-blue-500" />
          Quality by Category
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(quality.byCategory).map(([category, data]) => (
            <div key={category} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-sm font-semibold text-gray-900 mb-2">{category}</p>
              <div className="flex items-end justify-between">
                <p className={`text-2xl font-bold ${
                  data.score >= 80 ? 'text-green-600' :
                  data.score >= 60 ? 'text-amber-600' :
                  'text-red-600'
                }`}>
                  {data.score}/100
                </p>
                <p className="text-xs text-gray-500">{data.issues} issues</p>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
                <div 
                  className={`h-full rounded-full ${
                    data.score >= 80 ? 'bg-green-600' :
                    data.score >= 60 ? 'bg-amber-600' :
                    'bg-red-600'
                  }`}
                  style={{ width: `${data.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function QualityIssueCard({ label, count, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{count}</p>
    </div>
  );
}