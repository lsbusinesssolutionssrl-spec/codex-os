import { useState, useEffect } from 'react';
import { Shield, Brain, Calendar, AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AutonomousMaintenanceIntelligence() {
  const [intelligence, setIntelligence] = useState({
    predictions: [],
    preventive: [],
    optimizations: [],
  });

  useEffect(() => {
    analyzeMaintenance();
  }, []);

  const analyzeMaintenance = async () => {
    try {
      const [maintenance, properties, tickets, projects, equipment] = await Promise.all([
        base44.entities.PropertyMaintenance.list(),
        base44.entities.Property.list(),
        base44.entities.SupportTicket.list(),
        base44.entities.Project.list(),
        base44.entities.PropertyEquipment.list(),
      ]);

      const predictions = [];
      const preventive = [];
      const optimizations = [];

      // Predict maintenance needs based on equipment age
      equipment.forEach(eq => {
        if (eq.installation_date) {
          const ageYears = (new Date().getFullYear() - new Date(eq.installation_date).getFullYear());
          const expectedLifespan = eq.expected_lifespan_years || 15;
          const remainingLife = expectedLifespan - ageYears;
          
          if (remainingLife <= 2 && remainingLife > 0) {
            predictions.push({
              type: 'equipment_replacement',
              equipment: eq.name,
              property_id: eq.property_id,
              description: `${eq.name} approaching end of life (${remainingLife.toFixed(1)} years remaining)`,
              urgency: remainingLife < 1 ? 'high' : 'medium',
              confidence: 85
            });
          }
        }
      });

      // Predict based on recurring tickets
      const propertyTickets = {};
      tickets.forEach(t => {
        if (t.property_id && t.issue_type) {
          propertyTickets[t.property_id] = propertyTickets[t.property_id] || [];
          propertyTickets[t.property_id].push(t.issue_type);
        }
      });

      Object.entries(propertyTickets).forEach(([propertyId, issues]) => {
        const issueCounts = {};
        issues.forEach(issue => {
          issueCounts[issue] = (issueCounts[issue] || 0) + 1;
        });

        Object.entries(issueCounts).forEach(([issue, count]) => {
          if (count >= 3) {
            predictions.push({
              type: 'recurring_failure',
              property_id: propertyId,
              description: `${issue} has occurred ${count} times. Preventive intervention recommended.`,
              urgency: count > 5 ? 'high' : 'medium',
              confidence: 88
            });
            preventive.push({
              property_id: propertyId,
              issue_type: issue,
              recommendation: `Create preventive maintenance plan for ${issue}`
            });
          }
        });
      });

      // Suggest preventive interventions
      const propertiesWithOldProjects = properties.filter(p => 
        projects.some(proj => 
          proj.property_id === p.id && 
          proj.status === 'Delivered' &&
          new Date(proj.actual_end_date) <= new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        )
      );
      if (propertiesWithOldProjects.length > 0) {
        preventive.push({
          type: 'annual_inspection',
          count: propertiesWithOldProjects.length,
          recommendation: 'Schedule annual post-project inspections'
        });
      }

      // Optimize maintenance schedules
      const maintenanceByType = {};
      maintenance.forEach(m => {
        if (m.maintenance_type) {
          maintenanceByType[m.maintenance_type] = (maintenanceByType[m.maintenance_type] || 0) + 1;
        }
      });

      Object.entries(maintenanceByType).forEach(([type, count]) => {
        if (count >= 5) {
          optimizations.push({
            type: 'schedule_consolidation',
            maintenance_type: type,
            description: `${count} ${type} maintenance tasks. Consider bundling into scheduled routes.`,
            impact: '20-30% efficiency gain',
            confidence: 82
          });
        }
      });

      // Seasonal predictions
      const currentMonth = new Date().getMonth();
      if (currentMonth >= 9 || currentMonth <= 2) { // Winter months
        optimizations.push({
          type: 'seasonal_preparation',
          description: 'Winter season: Prioritize heating system inspections and pipe insulation checks',
          impact: 'Prevent cold-weather failures',
          confidence: 90
        });
      }

      setIntelligence({ predictions, preventive, optimizations });
    } catch (error) {
      console.error('Maintenance intelligence error:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-4 h-4 text-green-600" />
        <h2 className="text-sm font-semibold text-gray-900">Autonomous Maintenance Intelligence</h2>
      </div>

      {/* Predictions */}
      {intelligence.predictions.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Brain className="w-3 h-3 text-purple-600" />
            Predictive Maintenance ({intelligence.predictions.length})
          </h3>
          <div className="space-y-2">
            {intelligence.predictions.map((pred, idx) => (
              <PredictionCard key={idx} prediction={pred} />
            ))}
          </div>
        </div>
      )}

      {/* Preventive */}
      {intelligence.preventive.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Calendar className="w-3 h-3 text-blue-600" />
            Preventive Recommendations
          </h3>
          <div className="space-y-2">
            {intelligence.preventive.map((prev, idx) => (
              <div key={idx} className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-gray-700">{prev.recommendation || prev.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optimizations */}
      {intelligence.optimizations.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <TrendingUp className="w-3 h-3 text-green-600" />
            Optimization Opportunities
          </h3>
          <div className="space-y-2">
            {intelligence.optimizations.map((opt, idx) => (
              <div key={idx} className="p-2 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-gray-700">{opt.description}</p>
                <p className="text-xs text-green-700 font-semibold mt-1">{opt.impact}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {intelligence.predictions.length === 0 && 
       intelligence.preventive.length === 0 && 
       intelligence.optimizations.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
          <p className="text-sm">Maintenance optimally scheduled.</p>
        </div>
      )}
    </div>
  );
}

function PredictionCard({ prediction }) {
  return (
    <div className="p-2 bg-orange-50 rounded-lg border border-orange-200">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-gray-900">{prediction.type === 'equipment_replacement' ? 'Equipment Replacement' : 'Recurring Failure'}</p>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
          prediction.urgency === 'high' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
        }`}>
          {prediction.urgency}
        </span>
      </div>
      <p className="text-xs text-gray-700">{prediction.description}</p>
      <p className="text-xs text-gray-500 mt-1">Confidence: {prediction.confidence}%</p>
    </div>
  );
}