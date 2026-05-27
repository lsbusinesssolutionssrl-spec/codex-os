import { useState, useEffect } from 'react';
import { Brain, Target, TrendingUp, AlertTriangle, DollarSign, Clock, Users, Activity } from 'lucide-react';

export default function PriorityScore({ entity }) {
  const [scores, setScores] = useState({
    priority: 0,
    urgency: 0,
    impact: 0,
    overall: 0,
  });

  useEffect(() => {
    calculateScores();
  }, [entity]);

  const calculateScores = () => {
    // Priority Score (0-100)
    let priority = 50;
    if (entity.priority === 'Critical') priority = 100;
    else if (entity.priority === 'High') priority = 75;
    else if (entity.priority === 'Medium') priority = 50;
    else priority = 25;

    // Urgency Score (0-100)
    let urgency = 50;
    if (entity.due_date) {
      const daysUntilDue = (new Date(entity.due_date) - new Date()) / (1000 * 60 * 60 * 24);
      if (daysUntilDue < 0) urgency = 100;
      else if (daysUntilDue < 3) urgency = 90;
      else if (daysUntilDue < 7) urgency = 70;
      else if (daysUntilDue < 14) urgency = 50;
      else urgency = 30;
    }

    // Business Impact Score (0-100)
    let impact = 50;
    if (entity.contract_value > 100000) impact = 90;
    else if (entity.contract_value > 50000) impact = 75;
    else if (entity.contract_value > 20000) impact = 60;
    else if (entity.contract_value > 10000) impact = 45;
    else impact = 30;

    // Adjust for delays
    if (entity.status === 'delayed' || entity.is_delayed) {
      urgency = Math.min(100, urgency + 20);
      impact = Math.min(100, impact + 10);
    }

    // Adjust for margin issues
    if (entity.gross_margin_pct && entity.gross_margin_pct < 20) {
      impact = Math.min(100, impact + 15);
    }

    const overall = Math.round((priority * 0.4 + urgency * 0.4 + impact * 0.2));

    setScores({ priority, urgency, impact, overall });
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#EF4444';
    if (score >= 60) return '#F97316';
    if (score >= 40) return '#F59E0B';
    return '#10B981';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-blue-600" />
        <span className="text-xs font-semibold text-gray-900">Priority Intelligence</span>
      </div>

      {/* Overall Score */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">Overall Priority Score</span>
          <span 
            className="text-lg font-bold"
            style={{ color: getScoreColor(scores.overall) }}
          >
            {scores.overall}/100
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all"
            style={{ width: `${scores.overall}%`, backgroundColor: getScoreColor(scores.overall) }}
          />
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-3 gap-3">
        <ScoreBreakdown 
          label="Priority" 
          score={scores.priority} 
          icon={Brain}
          color={getScoreColor(scores.priority)}
        />
        <ScoreBreakdown 
          label="Urgency" 
          score={scores.urgency} 
          icon={Clock}
          color={getScoreColor(scores.urgency)}
        />
        <ScoreBreakdown 
          label="Impact" 
          score={scores.impact} 
          icon={DollarSign}
          color={getScoreColor(scores.impact)}
        />
      </div>
    </div>
  );
}

function ScoreBreakdown({ label, score, icon: Icon, color }) {
  return (
    <div className="text-center">
      <Icon className="w-3 h-3 mx-auto mb-1" style={{ color }} />
      <p className="text-[10px] text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-bold" style={{ color }}>{score}</p>
    </div>
  );
}