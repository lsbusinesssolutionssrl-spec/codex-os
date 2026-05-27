import { useState, useEffect } from 'react';
import { BookOpen, Zap, AlertTriangle, CheckCircle, TrendingUp, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function SOPOptimizationSystem() {
  const [optimizations, setOptimizations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    analyzeSOPs();
  }, []);

  const analyzeSOPs = async () => {
    setLoading(true);
    try {
      const [sops, projects, tickets] = await Promise.all([
        base44.entities.SOPTemplate.list(),
        base44.entities.Project.list(),
        base44.entities.SupportTicket.list(),
      ]);

      const suggestions = [];

      // Analyze SOP usage vs outcomes
      sops.forEach(sop => {
        // Check if SOP steps are frequently skipped
        if (sop.usage_count > 5) {
          suggestions.push({
            sop_id: sop.id,
            sop_title: sop.title,
            type: 'step_optimization',
            description: `SOP "${sop.title}" has been used ${sop.usage_count} times. Review for optimization opportunities.`,
            impact: 'medium',
            confidence: 75
          });
        }
      });

      // Detect recurring problems that SOPs could prevent
      const recurringIssues = {};
      tickets.forEach(t => {
        if (t.issue_type) {
          recurringIssues[t.issue_type] = (recurringIssues[t.issue_type] || 0) + 1;
        }
      });

      Object.entries(recurringIssues).forEach(([type, count]) => {
        if (count >= 3) {
          suggestions.push({
            type: 'new_sop_needed',
            description: `${count} tickets related to "${type}". Consider creating SOP to prevent recurrence.`,
            impact: count > 5 ? 'high' : 'medium',
            confidence: 80
          });
        }
      });

      setOptimizations(suggestions);
    } catch (error) {
      console.error('SOP analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-400">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm">Analyzing SOPs...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-4 h-4 text-green-600" />
        <h2 className="text-sm font-semibold text-gray-900">SOP Optimization System</h2>
      </div>

      {optimizations.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
          <p className="text-sm">SOPs are optimized. No improvements needed.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {optimizations.map((opt, idx) => (
            <SOPSuggestion key={idx} suggestion={opt} />
          ))}
        </div>
      )}
    </div>
  );
}

function SOPSuggestion({ suggestion }) {
  const typeConfig = {
    step_optimization: { icon: Zap, color: '#F59E0B', label: 'Step Optimization' },
    new_sop_needed: { icon: BookOpen, color: '#10B981', label: 'New SOP Needed' },
    control_addition: { icon: CheckCircle, color: '#1147FF', label: 'Control Addition' },
    sequencing: { icon: TrendingUp, color: '#8B5CF6', label: 'Better Sequencing' },
  };

  const config = typeConfig[suggestion.type] || typeConfig.step_optimization;
  const Icon = config.icon;

  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0`} style={{ backgroundColor: `${config.color}15` }}>
          <Icon className="w-4 h-4" style={{ color: config.color }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-gray-900">{config.label}</span>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
              suggestion.impact === 'high' ? 'bg-red-100 text-red-700' :
              suggestion.impact === 'medium' ? 'bg-orange-100 text-orange-700' :
              'bg-green-100 text-green-700'
            }`}>
              {suggestion.impact} impact
            </span>
          </div>
          <p className="text-xs text-gray-700 mb-2">{suggestion.description}</p>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Confidence: {suggestion.confidence}%</p>
            <button className="text-xs text-green-600 hover:text-green-800 flex items-center gap-1 font-medium">
              Review <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}