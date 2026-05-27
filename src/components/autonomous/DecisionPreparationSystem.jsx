import { useState, useEffect } from 'react';
import { Brain, TrendingUp, DollarSign, AlertTriangle, Users, Calendar, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function DecisionPreparationSystem() {
  const [decisionPackages, setDecisionPackages] = useState([]);

  useEffect(() => {
    prepareDecisions();
  }, []);

  const prepareDecisions = async () => {
    try {
      const [projects, estimates, clients, suppliers] = await Promise.all([
        base44.entities.Project.list(),
        base44.entities.Estimate.list(),
        base44.entities.Client.list(),
        base44.entities.Supplier.list(),
      ]);

      const packages = [];

      // Staffing decisions
      const activeProjects = projects.filter(p => p.status === 'In Progress');
      const upcomingProjects = projects.filter(p => p.status === 'Approved' && !p.start_date);
      if (upcomingProjects.length > 0 || activeProjects.length > 5) {
        packages.push({
          type: 'staffing',
          title: 'Team Staffing Strategy',
          context: `${activeProjects.length} active, ${upcomingProjects.length} upcoming projects`,
          options: [
            { label: 'Hire 2 additional technicians', cost: '€80k/year', impact: 'High capacity' },
            { label: 'Use subcontractors', cost: '€15k/project', impact: 'Flexible' },
            { label: 'Optimize current team', cost: '€0', impact: 'Moderate' }
          ],
          risks: ['Understaffing delays', 'Overstaffing costs'],
          recommendation: 'Option 2: Balance flexibility and cost',
          confidence: 78,
          urgency: 'medium'
        });
      }

      // Scheduling decisions
      const delayedProjects = projects.filter(p => p.is_delayed);
      if (delayedProjects.length > 0) {
        packages.push({
          type: 'scheduling',
          title: 'Project Recovery Scheduling',
          context: `${delayedProjects.length} projects behind schedule`,
          options: [
            { label: 'Fast-track critical path', cost: '15% overtime', impact: '2-3 weeks saved' },
            { label: 'Reallocate resources', cost: 'Disruption to other projects', impact: '1-2 weeks saved' },
            { label: 'Negotiate timeline extension', cost: 'Client satisfaction risk', impact: 'No cost' }
          ],
          risks: ['Quality compromise', 'Team burnout', 'Client trust'],
          recommendation: 'Option 1: Fast-track with overtime',
          confidence: 82,
          urgency: 'high'
        });
      }

      // Supplier selection
      const lowMarginProjects = projects.filter(p => {
        const margin = ((p.contract_value - (p.material_costs || 0) - (p.labor_costs || 0)) / p.contract_value) * 100;
        return margin < 20;
      });
      if (lowMarginProjects.length > 0) {
        packages.push({
          type: 'supplier_selection',
          title: 'Supplier Cost Optimization',
          context: `${lowMarginProjects.length} projects with margins <20%`,
          options: [
            { label: 'Renegotiate supplier contracts', cost: 'Time investment', impact: '10-15% cost reduction' },
            { label: 'Alternative suppliers', cost: 'Quality risk', impact: '15-20% cost reduction' },
            { label: 'Bulk purchasing', cost: 'Storage costs', impact: '5-10% cost reduction' }
          ],
          risks: ['Quality degradation', 'Supply chain disruption'],
          recommendation: 'Option 1: Renegotiate with current suppliers',
          confidence: 85,
          urgency: 'medium'
        });
      }

      // Estimate strategy
      const pendingEstimates = estimates.filter(e => e.status === 'Sent');
      if (pendingEstimates.length > 3) {
        packages.push({
          type: 'estimate_strategy',
          title: 'Estimate Follow-up Strategy',
          context: `${pendingEstimates.length} estimates pending client decision`,
          options: [
            { label: 'Aggressive follow-up', cost: 'Client pressure risk', impact: 'Faster decisions' },
            { label: 'Value-add approach', cost: 'Additional prep time', impact: 'Higher conversion' },
            { label: 'Wait for client', cost: 'Lost opportunities', impact: 'Lower pressure' }
          ],
          risks: ['Client annoyance', 'Lost deals', 'Margin erosion'],
          recommendation: 'Option 2: Value-add follow-up',
          confidence: 80,
          urgency: 'low'
        });
      }

      // Maintenance planning
      const upcomingMaintenance = await base44.entities.PropertyMaintenance.list();
      const criticalMaintenance = upcomingMaintenance.filter(m => m.priority === 'Critical');
      if (criticalMaintenance.length > 0) {
        packages.push({
          type: 'maintenance_planning',
          title: 'Critical Maintenance Prioritization',
          context: `${criticalMaintenance.length} critical maintenance tasks`,
          options: [
            { label: 'Immediate execution', cost: 'Resource reallocation', impact: 'Risk mitigation' },
            { label: 'Schedule within week', cost: 'Moderate risk', impact: 'Balanced approach' },
            { label: 'Defer to next month', cost: 'High risk', impact: 'Cost savings' }
          ],
          risks: ['Property damage', 'Safety issues', 'Client complaints'],
          recommendation: 'Option 1: Immediate execution for critical items',
          confidence: 92,
          urgency: 'high'
        });
      }

      // Project prioritization
      const competingProjects = projects.filter(p => p.status === 'Approved' && !p.start_date);
      if (competingProjects.length > 2) {
        packages.push({
          type: 'project_prioritization',
          title: 'Project Start Prioritization',
          context: `${competingProjects.length} projects awaiting start`,
          options: [
            { label: 'By margin (highest first)', cost: 'Potential client dissatisfaction', impact: 'Maximize profit' },
            { label: 'By urgency (deadlines)', cost: 'Lower margin projects first', impact: 'Client satisfaction' },
            { label: 'By resource availability', cost: 'Suboptimal sequencing', impact: 'Operational efficiency' }
          ],
          risks: ['Client conflicts', 'Resource bottlenecks', 'Margin erosion'],
          recommendation: 'Option 2: Urgency-based with margin consideration',
          confidence: 85,
          urgency: 'medium'
        });
      }

      setDecisionPackages(packages);
    } catch (error) {
      console.error('Decision prep error:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-4 h-4 text-blue-600" />
        <h2 className="text-sm font-semibold text-gray-900">Decision Preparation System</h2>
      </div>

      {decisionPackages.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">No decisions requiring preparation.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {decisionPackages.map((pkg, idx) => (
            <DecisionPackage key={idx} package={pkg} />
          ))}
        </div>
      )}
    </div>
  );
}

function DecisionPackage({ package: pkg }) {
  const typeConfig = {
    staffing: { icon: Users, color: '#1147FF', label: 'Staffing' },
    scheduling: { icon: Calendar, color: '#F59E0B', label: 'Scheduling' },
    supplier_selection: { icon: TrendingUp, color: '#10B981', label: 'Supplier' },
    estimate_strategy: { icon: DollarSign, color: '#8B5CF6', label: 'Estimate' },
    maintenance_planning: { icon: AlertTriangle, color: '#EF4444', label: 'Maintenance' },
    project_prioritization: { icon: Brain, color: '#06B6D4', label: 'Prioritization' },
  };

  const config = typeConfig[pkg.type] || typeConfig.staffing;
  const Icon = config.icon;

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0`} style={{ backgroundColor: `${config.color}15` }}>
          <Icon className="w-4 h-4" style={{ color: config.color }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-gray-900">{config.label}</span>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
              pkg.urgency === 'high' ? 'bg-red-100 text-red-700' :
              pkg.urgency === 'medium' ? 'bg-orange-100 text-orange-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {pkg.urgency}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">{pkg.title}</h3>
          <p className="text-xs text-gray-600 mb-3">{pkg.context}</p>

          {/* Options */}
          <div className="space-y-2 mb-3">
            {pkg.options.map((opt, i) => (
              <div key={i} className="text-xs bg-white p-2 rounded border border-gray-200">
                <p className="font-semibold text-gray-900">{opt.label}</p>
                <p className="text-gray-600">Cost: {opt.cost} · Impact: {opt.impact}</p>
              </div>
            ))}
          </div>

          {/* Risks */}
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-700 mb-1">Risks:</p>
            <div className="flex flex-wrap gap-1">
              {pkg.risks.map((risk, i) => (
                <span key={i} className="text-[10px] bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded border border-orange-200">
                  {risk}
                </span>
              ))}
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2">
            <p className="text-xs text-blue-900">
              <strong>AI Recommendation:</strong> {pkg.recommendation}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Confidence: {pkg.confidence}%</p>
            <button className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
              Review Details <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}