import { useState, useEffect } from 'react';
import { Activity, TrendingUp, AlertTriangle, CheckCircle2, Wrench, Home, Calendar, DollarSign } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const CATEGORY_WEIGHTS = {
  electrical: 0.2,
  plumbing: 0.2,
  hvac: 0.2,
  roofing: 0.15,
  security: 0.1,
  networking: 0.15,
};

const SEVERITY_COLORS = {
  critical: '#EF4444',
  warning: '#F59E0B',
  good: '#10B981',
  excellent: '#059669',
};

export default function PropertyHealthScore({ propertyId, clientId }) {
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState(null);

  useEffect(() => {
    if (propertyId) loadHealthData();
  }, [propertyId, clientId]);

  const loadHealthData = async () => {
    setLoading(true);
    try {
      const [property, tickets, projects, interventions] = await Promise.all([
        base44.entities.Property.get(propertyId),
        base44.entities.SupportTicket.filter({ property_id: propertyId }),
        base44.entities.Project.filter({ property_id: propertyId }),
        property.interventions || [],
      ]);

      // Calculate category scores
      const categoryScores = {};
      const issues = [];

      // Electrical analysis
      const electricalAge = new Date().getFullYear() - (property.year_built || new Date().getFullYear());
      const electricalScore = Math.max(0, 100 - (electricalAge * 2) - (property.electrical_notes?.includes('problema') ? 20 : 0));
      categoryScores.electrical = electricalScore;
      if (electricalScore < 50) issues.push({ category: 'electrical', severity: 'critical', message: 'Impianto elettrico obsoleto' });
      else if (electricalScore < 70) issues.push({ category: 'electrical', severity: 'warning', message: 'Manutenzione elettrica raccomandata' });

      // Plumbing analysis
      const plumbingIssues = tickets.filter(t => t.issue_type === 'Water Leak').length;
      const plumbingScore = Math.max(0, 100 - (plumbingIssues * 15) - (property.plumbing_notes?.includes('problema') ? 20 : 0));
      categoryScores.plumbing = plumbingScore;
      if (plumbingIssues > 2) issues.push({ category: 'plumbing', severity: 'critical', message: `${plumbingIssues} perdite registrate` });

      // HVAC analysis
      const hvacInterventions = interventions.filter(i => i.category === 'HVAC' || i.description?.includes('clima')).length;
      const lastHVAC = interventions.filter(i => i.category === 'HVAC').sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      const monthsSinceHVAC = lastHVAC ? Math.floor((new Date() - new Date(lastHVAC.date)) / (1000 * 60 * 60 * 24 * 30)) : 999;
      const hvacScore = Math.max(0, 100 - (monthsSinceHVAC > 12 ? (monthsSinceHVAC - 12) * 5 : 0));
      categoryScores.hvac = hvacScore;
      if (monthsSinceHVAC > 12) issues.push({ category: 'hvac', severity: 'warning', message: `Manutenzione HVAC scaduta da ${monthsSinceHVAC - 12} mesi` });

      // Roofing analysis
      const roofAge = new Date().getFullYear() - (property.year_built || new Date().getFullYear());
      const roofingScore = Math.max(0, 100 - (roofAge * 1.5) - (property.roofing_notes?.includes('problema') ? 20 : 0));
      categoryScores.roofing = roofingScore;
      if (roofAge > 20) issues.push({ category: 'roofing', severity: 'warning', message: `Tetto di ${roofAge} anni, ispezione raccomandata` });

      // Security analysis
      const securityScore = property.security_notes ? 80 : 50;
      categoryScores.security = securityScore;

      // Networking analysis
      const networkingScore = property.networking_notes ? 75 : 60;
      categoryScores.networking = networkingScore;

      // Calculate overall score
      let overallScore = 0;
      Object.keys(CATEGORY_WEIGHTS).forEach(cat => {
        overallScore += (categoryScores[cat] || 50) * CATEGORY_WEIGHTS[cat];
      });

      // Active tickets impact
      const activeTickets = tickets.filter(t => t.status !== 'Resolved' && t.status !== 'Closed').length;
      overallScore -= activeTickets * 3;
      overallScore = Math.max(0, Math.min(100, overallScore));

      // Determine severity
      let severity = 'excellent';
      if (overallScore < 50) severity = 'critical';
      else if (overallScore < 70) severity = 'warning';
      else if (overallScore < 85) severity = 'good';

      // Maintenance recommendations
      const recommendations = [];
      if (categoryScores.hvac < 70) recommendations.push('Manutenzione HVAC raccomandata entro 30 giorni');
      if (categoryScores.electrical < 60) recommendations.push('Ispezione impianto elettrico necessaria');
      if (categoryScores.plumbing < 70) recommendations.push('Verifica impianti idraulici');
      if (activeTickets > 0) recommendations.push(`${activeTickets} ticket in sospeso da risolvere`);

      setHealthData({
        overallScore: Math.round(overallScore),
        severity,
        categoryScores,
        issues,
        recommendations,
        activeTickets,
        totalTickets: tickets.length,
        totalProjects: projects.length,
      });
    } catch (error) {
      console.error('Failed to load health data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-gray-500">Calcolo Property Health Score...</p>
        </div>
      </div>
    );
  }

  if (!healthData) return null;

  const { overallScore, severity, categoryScores, issues, recommendations, activeTickets, totalTickets, totalProjects } = healthData;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      {/* Overall Score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center border-4"
            style={{ borderColor: SEVERITY_COLORS[severity], background: `${SEVERITY_COLORS[severity]}15` }}
          >
            <span className="text-xl font-bold" style={{ color: SEVERITY_COLORS[severity] }}>
              {overallScore}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Property Health Score</p>
            <p className="text-xs text-gray-500 capitalize">{severity === 'excellent' ? 'Eccellente' : severity === 'good' ? 'Buono' : severity === 'warning' ? 'Attenzione' : 'Critico'}</p>
          </div>
        </div>
        <Activity className="w-5 h-5" style={{ color: SEVERITY_COLORS[severity] }} />
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(categoryScores).map(([category, score]) => (
          <div key={category} className="bg-gray-50 rounded-lg p-2.5 text-center">
            <p className="text-[10px] text-gray-500 uppercase mb-1">{category}</p>
            <p 
              className="text-lg font-bold"
              style={{ color: score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444' }}
            >
              {Math.round(score)}
            </p>
          </div>
        ))}
      </div>

      {/* Issues */}
      {issues.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-amber-500" /> Problemi Rilevati
          </p>
          {issues.map((issue, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <div 
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: SEVERITY_COLORS[issue.severity] }}
              />
              <span className="text-gray-700">{issue.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Raccomandazioni
          </p>
          {recommendations.map((rec, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs">
              <Wrench className="w-3 h-3 text-blue-500 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">{rec}</span>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="flex gap-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Calendar className="w-3 h-3" /> {totalProjects} progetti
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <AlertTriangle className="w-3 h-3" /> {activeTickets}/{totalTickets} ticket attivi
        </div>
      </div>
    </div>
  );
}