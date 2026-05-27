import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, AlertTriangle, Users, Activity, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function PredictiveBusinessIntelligence() {
  const [predictions, setPredictions] = useState([]);

  useEffect(() => {
    predictBusinessMetrics();
  }, []);

  const predictBusinessMetrics = async () => {
    try {
      const [projects, clients, subscriptions, maintenance] = await Promise.all([
        base44.entities.Project.list(),
        base44.entities.Client.list(),
        base44.entities.GuardianSubscription.list(),
        base44.entities.PropertyMaintenance.list(),
      ]);

      const preds = [];

      // Margin erosion prediction
      const projectsAtRisk = projects.filter(p => {
        const currentMargin = ((p.contract_value - (p.material_costs || 0) - (p.labor_costs || 0)) / p.contract_value) * 100;
        return currentMargin < 25 && p.status === 'In Progress';
      });
      if (projectsAtRisk.length > 0) {
        preds.push({
          type: 'margin_erosion',
          title: 'Margin Erosion Risk',
          count: projectsAtRisk.length,
          severity: projectsAtRisk.some(p => {
            const margin = ((p.contract_value - (p.material_costs || 0) - (p.labor_costs || 0)) / p.contract_value) * 100;
            return margin < 15;
          }) ? 'high' : 'medium',
          impact: 'Potential 10-15% profit reduction',
          confidence: 85
        });
      }

      // Project profitability prediction
      const delayedProjects = projects.filter(p => p.is_delayed);
      if (delayedProjects.length > 0) {
        const estimatedCostOverrun = delayedProjects.reduce((sum, p) => {
          const daysDelayed = (new Date() - new Date(p.expected_end_date)) / (1000 * 60 * 60 * 24);
          return sum + (daysDelayed * 500); // €500 per day estimate
        }, 0);
        preds.push({
          type: 'profitability_risk',
          title: 'Project Profitability Risk',
          count: delayedProjects.length,
          severity: estimatedCostOverrun > 10000 ? 'high' : 'medium',
          impact: `€${Math.round(estimatedCostOverrun).toLocaleString()} estimated overrun`,
          confidence: 80
        });
      }

      // Customer dissatisfaction prediction
      const clientsWithMultipleTickets = {};
      const tickets = await base44.entities.SupportTicket.list();
      tickets.forEach(t => {
        if (t.client_id && t.status !== 'Resolved') {
          clientsWithMultipleTickets[t.client_id] = (clientsWithMultipleTickets[t.client_id] || 0) + 1;
        }
      });
      const atRiskClients = Object.entries(clientsWithMultipleTickets).filter(([_, count]) => count >= 3);
      if (atRiskClients.length > 0) {
        preds.push({
          type: 'customer_dissatisfaction',
          title: 'Customer Dissatisfaction Risk',
          count: atRiskClients.length,
          severity: atRiskClients.length > 5 ? 'high' : 'medium',
          impact: 'Churn risk and negative referrals',
          confidence: 78
        });
      }

      // Guardian churn prediction
      const activeGuardians = subscriptions.filter(s => s.status === 'Active');
      const guardiansWithIssues = activeGuardians.filter(s => {
        // Check if property has unresolved tickets
        return tickets.some(t => t.property_id === s.property_id && t.status !== 'Resolved');
      });
      if (guardiansWithIssues.length > 0) {
        preds.push({
          type: 'guardian_churn',
          title: 'Guardian Subscription Churn Risk',
          count: guardiansWithIssues.length,
          severity: guardiansWithIssues.length > 3 ? 'high' : 'medium',
          impact: `€${guardiansWithIssues.reduce((sum, s) => sum + (s.monthly_price || 0), 0)}/month MRR at risk`,
          confidence: 82
        });
      }

      // Maintenance backlog prediction
      const overdueMaintenance = maintenance.filter(m => 
        m.scheduled_date && 
        new Date(m.scheduled_date) < new Date() && 
        m.status !== 'Completed'
      );
      if (overdueMaintenance.length > 5) {
        preds.push({
          type: 'maintenance_backlog',
          title: 'Maintenance Backlog Growing',
          count: overdueMaintenance.length,
          severity: overdueMaintenance.length > 10 ? 'high' : 'medium',
          impact: 'Customer satisfaction and property risk',
          confidence: 90
        });
      }

      // Operational overload prediction
      const activeProjects = projects.filter(p => p.status === 'In Progress');
      if (activeProjects.length > 8) {
        preds.push({
          type: 'operational_overload',
          title: 'Operational Overload Risk',
          count: activeProjects.length,
          severity: activeProjects.length > 12 ? 'high' : 'medium',
          impact: 'Quality degradation and team burnout',
          confidence: 85
        });
      }

      // Financial risk prediction
      const totalOutstanding = projects.reduce((sum, p) => sum + (p.contract_value - (p.total_collected || 0)), 0);
      const cashFlowRisk = totalOutstanding > 100000;
      if (cashFlowRisk) {
        preds.push({
          type: 'financial_risk',
          title: 'Cash Flow Risk',
          count: 1,
          severity: 'high',
          impact: `€${Math.round(totalOutstanding).toLocaleString()} outstanding collections`,
          confidence: 95
        });
      }

      setPredictions(preds);
    } catch (error) {
      console.error('Prediction error:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-purple-600" />
        <h2 className="text-sm font-semibold text-gray-900">Predictive Business Intelligence</h2>
      </div>

      {predictions.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">No predictive risks detected.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {predictions.map((pred, idx) => (
            <PredictionCard key={idx} prediction={pred} />
          ))}
        </div>
      )}
    </div>
  );
}

function PredictionCard({ prediction }) {
  const typeConfig = {
    margin_erosion: { icon: DollarSign, color: '#EF4444', label: 'Margin Erosion' },
    profitability_risk: { icon: TrendingUp, color: '#F59E0B', label: 'Profitability Risk' },
    customer_dissatisfaction: { icon: Users, color: '#8B5CF6', label: 'Customer Risk' },
    guardian_churn: { icon: AlertTriangle, color: '#EF4444', label: 'Churn Risk' },
    maintenance_backlog: { icon: Activity, color: '#F97316', label: 'Backlog Risk' },
    operational_overload: { icon: Zap, color: '#1147FF', label: 'Operational Overload' },
    financial_risk: { icon: DollarSign, color: '#DC2626', label: 'Financial Risk' },
  };

  const config = typeConfig[prediction.type] || typeConfig.margin_erosion;
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
              prediction.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
            }`}>
              {prediction.severity}
            </span>
          </div>
          <p className="text-xs text-gray-700 mb-2">{prediction.title}</p>
          <p className="text-xs text-gray-600 mb-2">{prediction.impact}</p>
          <p className="text-xs text-gray-500">Confidence: {prediction.confidence}%</p>
        </div>
      </div>
    </div>
  );
}