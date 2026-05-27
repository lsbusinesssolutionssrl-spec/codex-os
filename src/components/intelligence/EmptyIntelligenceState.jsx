import { Brain, AlertTriangle, CheckCircle, XCircle, Database, Zap, TrendingUp, Users, BookOpen } from 'lucide-react';

export default function EmptyIntelligenceState({ maturity, onGenerate }) {
  const level = maturity?.level || 0;

  const emptyStates = {
    0: {
      icon: Database,
      color: '#6B7280',
      title: 'No Operational Data Yet',
      description: 'Start by creating your first project to begin tracking operational metrics and unlock AI-powered insights.',
      actions: [
        { label: 'Create First Project', icon: CheckCircle, color: '#1147FF' },
        { label: 'Import Existing Data', icon: Zap, color: '#10B981' },
      ],
    },
    1: {
      icon: BarChart3,
      color: '#3B82F6',
      title: 'Basic Tracking Active',
      description: 'You have projects tracked. Start adding cost data to unlock margin analytics and profitability insights.',
      actions: [
        { label: 'Track Project Costs', icon: TrendingUp, color: '#10B981' },
        { label: 'Add Timesheets', icon: Users, color: '#F59E0B' },
      ],
    },
    2: {
      icon: TrendingUp,
      color: '#10B981',
      title: 'Financial Data Available',
      description: 'Cost tracking is active. Complete more project lifecycles to unlock predictive insights and trend analysis.',
      actions: [
        { label: 'Complete Projects', icon: CheckCircle, color: '#10B981' },
        { label: 'Capture Lessons Learned', icon: BookOpen, color: '#8B5CF6' },
      ],
    },
  };

  const state = emptyStates[Math.min(level, 2)] || emptyStates[2];
  const Icon = state.icon;

  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center">
      <div 
        className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
        style={{ backgroundColor: `${state.color}15` }}
      >
        <Icon className="w-8 h-8" style={{ color: state.color }} />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{state.title}</h3>
      <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">{state.description}</p>
      
      {/* Maturity Progress */}
      {maturity?.milestones && (
        <div className="max-w-md mx-auto mb-6 space-y-2 text-left">
          {maturity.milestones.map((milestone, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              {milestone.startsWith('✅') ? (
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
              <span className="text-gray-700">{milestone.replace(/^[✅❌] /, '')}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Actions */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {state.actions.map((action, idx) => {
          const ActionIcon = action.icon;
          return (
            <button
              key={idx}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: action.color }}
            >
              <ActionIcon className="w-4 h-4" />
              {action.label}
            </button>
          );
        })}
        
        {level >= 2 && (
          <button
            onClick={onGenerate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #1147FF 0%, #0B2341 100%)' }}
          >
            <Brain className="w-4 h-4" />
            Generate Insights
          </button>
        )}
      </div>
      
      {/* Help Text */}
      <p className="text-xs text-gray-400 mt-6">
        AI insights require minimum data maturity level 2 (financial tracking active)
      </p>
    </div>
  );
}

function BarChart3({ className, style }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}