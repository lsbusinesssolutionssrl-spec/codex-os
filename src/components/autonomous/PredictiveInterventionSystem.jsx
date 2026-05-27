import { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, Clock, DollarSign, Activity, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function PredictiveInterventionSystem() {
  const [risks, setRisks] = useState([]);

  useEffect(() => {
    predictRisks();
  }, []);

  const predictRisks = async () => {
    try {
      const [projects, tickets, timesheets] = await Promise.all([
        base44.entities.Project.list(),
        base44.entities.SupportTicket.list(),
        base44.entities.Timesheet.list(),
      ]);

      const predictions = [];

      // Predict project delays
      projects.forEach(p => {
        if (p.status === 'In Progress' && p.expected_end_date) {
          const daysUntilDue = (new Date(p.expected_end_date) - new Date()) / (1000 * 60 * 60 * 24);
          if (daysUntilDue < 7 && !p.is_delayed) {
            predictions.push({
              type: 'likely_delay',
              entity: p.title,
              entity_id: p.id,
              description: `Project due in ${Math.round(daysUntilDue)} days. Risk of delay detected.`,
              severity: daysUntilDue < 3 ? 'high' : 'medium',
              confidence: 75,
              mitigation: 'Consider resource reallocation or timeline adjustment'
            });
          }
        }
      });

      // Predict budget overruns
      projects.forEach(p => {
        if (p.contract_value && p.material_costs) {
          const totalCosts = p.material_costs + (p.labor_costs || 0) + (p.other_costs || 0);
          const margin = ((p.contract_value - totalCosts) / p.contract_value) * 100;
          if (margin < 15 && margin > 0) {
            predictions.push({
              type: 'budget_overrun',
              entity: p.title,
              entity_id: p.id,
              description: `Project margin at ${Math.round(margin)}%. Risk of budget overrun.`,
              severity: margin < 10 ? 'high' : 'medium',
              confidence: 82,
              mitigation: 'Review remaining costs and consider value engineering'
            });
          }
        }
      });

      // Predict technician overload
      const techWorkload = {};
      timesheets.forEach(t => {
        if (t.user_id && t.status === 'approved') {
          techWorkload[t.user_id] = (techWorkload[t.user_id] || 0) + (t.hours || 0);
        }
      });
      Object.entries(techWorkload).forEach(([techId, hours]) => {
        if (hours > 40) {
          predictions.push({
            type: 'technician_overload',
            entity: `Technician ${techId}`,
            entity_id: techId,
            description: `Technician scheduled for ${hours} hours this week. Overload risk.`,
            severity: hours > 50 ? 'high' : 'medium',
            confidence: 88,
            mitigation: 'Redistribute workload or approve overtime'
          });
        }
      });

      // Predict recurring issues
      const issueTypes = {};
      tickets.forEach(t => {
        if (t.issue_type) {
          issueTypes[t.issue_type] = (issueTypes[t.issue_type] || 0) + 1;
        }
      });
      Object.entries(issueTypes).forEach(([type, count]) => {
        if (count >= 5) {
          predictions.push({
            type: 'recurring_issue',
            entity: type,
            description: `${type} has occurred ${count} times. Systemic issue likely.`,
            severity: count > 10 ? 'high' : 'medium',
            confidence: 80,
            mitigation: 'Create SOP or preventive maintenance plan'
          });
        }
      });

      setRisks(predictions);
    } catch (error) {
      console.error('Prediction error:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-orange-600" />
        <h2 className="text-sm font-semibold text-gray-900">Predictive Intervention System</h2>
      </div>

      {risks.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-green-600" />
          <p className="text-sm">No predictive risks detected.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {risks.map((risk, idx) => (
            <RiskCard key={idx} risk={risk} />
          ))}
        </div>
      )}
    </div>
  );
}

function RiskCard({ risk }) {
  const typeConfig = {
    likely_delay: { icon: Clock, color: '#F59E0B', label: 'Likely Delay' },
    budget_overrun: { icon: DollarSign, color: '#EF4444', label: 'Budget Overrun' },
    technician_overload: { icon: Activity, color: '#8B5CF6', label: 'Technician Overload' },
    recurring_issue: { icon: AlertTriangle, color: '#F97316', label: 'Recurring Issue' },
  };

  const config = typeConfig[risk.type] || typeConfig.likely_delay;
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
              risk.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
            }`}>
              {risk.severity}
            </span>
          </div>
          <p className="text-xs text-gray-700 mb-2">{risk.description}</p>
          <div className="bg-white rounded p-2 border border-gray-200 mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3 text-blue-600" />
              <p className="text-xs text-gray-700">{risk.mitigation}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">Confidence: {risk.confidence}%</p>
        </div>
      </div>
    </div>
  );
}