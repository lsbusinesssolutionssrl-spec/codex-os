import { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Calendar, DollarSign, Zap, Droplets, Thermometer, Wifi, Shield, Wrench } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const CATEGORY_CONFIG = {
  electrical: { label: 'Elettrico', icon: Zap, color: '#F59E0B', weight: 0.2 },
  plumbing: { label: 'Idraulico', icon: Droplets, color: '#3B82F6', weight: 0.2 },
  hvac: { label: 'HVAC', icon: Thermometer, color: '#EF4444', weight: 0.2 },
  roofing: { label: 'Tetto', icon: Wrench, color: '#8B5CF6', weight: 0.15 },
  security: { label: 'Sicurezza', icon: Shield, color: '#10B981', weight: 0.1 },
  networking: { label: 'Networking', icon: Wifi, color: '#06B6D4', weight: 0.15 },
};

const SEVERITY_CONFIG = {
  excellent: { label: 'Eccellente', color: '#059669', bg: '#05966915', minScore: 85 },
  good: { label: 'Buono', color: '#10B981', bg: '#10B98115', minScore: 70 },
  warning: { label: 'Attenzione', color: '#F59E0B', bg: '#F59E0B15', minScore: 50 },
  critical: { label: 'Critico', color: '#EF4444', bg: '#EF444415', minScore: 0 },
};

export default function PredictivePropertyHealth({ propertyId, clientId }) {
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState(null);
  const [predictions, setPredictions] = useState([]);

  useEffect(() => {
    if (propertyId) loadPredictiveHealth();
  }, [propertyId, clientId]);

  const loadPredictiveHealth = async () => {
    setLoading(true);
    try {
      const [property, tickets, projects, equipment, maintenance, risks, insights] = await Promise.all([
        base44.entities.Property.get(propertyId),
        base44.entities.SupportTicket.filter({ property_id: propertyId }),
        base44.entities.Project.filter({ property_id: propertyId }),
        base44.entities.PropertyEquipment.filter({ property_id: propertyId }).catch(() => []),
        base44.entities.PropertyMaintenance.filter({ property_id: propertyId }).catch(() => []),
        base44.entities.PropertyRisk.filter({ property_id: propertyId, status: { $ne: 'Resolved' } }).catch(() => []),
        base44.entities.PropertyInsight.filter({ property_id: propertyId, status: 'New' }).catch(() => []),
      ]);

      const interventions = property.interventions || [];
      const allHistory = [...interventions, ...projects];

      // Advanced category analysis
      const categoryScores = {};
      const issues = [];
      const preds = [];

      // Electrical analysis
      const electricalAge = new Date().getFullYear() - (property.year_built || new Date().getFullYear());
      const electricalTickets = tickets.filter(t => t.issue_type === 'Electrical').length;
      const electricalProjects = projects.filter(p => p.title.toLowerCase().includes('elettrico')).length;
      const electricalNotes = property.electrical_notes || '';
      
      let electricalScore = 100 - (electricalAge * 1.5) - (electricalTickets * 10) - (electricalProjects * 5);
      if (electricalNotes.includes('obsoleto') || electricalNotes.includes('problema')) electricalScore -= 15;
      electricalScore = Math.max(0, Math.min(100, electricalScore));
      categoryScores.electrical = electricalScore;

      if (electricalScore < 50) {
        issues.push({ category: 'electrical', severity: 'critical', message: 'Impianto elettrico obsoleto o problematico', confidence: 85 });
        preds.push({ category: 'electrical', action: 'Sostituzione quadro elettrico', timeframe: '6-12 mesi', estimatedCost: 3000 });
      } else if (electricalScore < 70) {
        issues.push({ category: 'electrical', severity: 'warning', message: 'Manutenzione elettrica raccomandata', confidence: 75 });
        preds.push({ category: 'electrical', action: 'Ispezione impianto elettrico', timeframe: '3-6 mesi', estimatedCost: 500 });
      }

      // Plumbing analysis
      const waterLeaks = tickets.filter(t => t.issue_type === 'Water Leak').length;
      const plumbingNotes = property.plumbing_notes || '';
      const lastPlumbingProject = projects.filter(p => p.title.toLowerCase().includes('idraulico')).sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
      const yearsSincePlumbing = lastPlumbingProject ? (new Date() - new Date(lastPlumbingProject.created_date)) / (1000 * 60 * 60 * 24 * 365) : 999;

      let plumbingScore = 100 - (waterLeaks * 12) - (yearsSincePlumbing > 10 ? (yearsSincePlumbing - 10) * 5 : 0);
      if (plumbingNotes.includes('perdita') || plumbingNotes.includes('problema')) plumbingScore -= 10;
      plumbingScore = Math.max(0, Math.min(100, plumbingScore));
      categoryScores.plumbing = plumbingScore;

      if (waterLeaks >= 3) {
        issues.push({ category: 'plumbing', severity: 'critical', message: `${waterLeaks} perdite registrate - rischio elevato`, confidence: 90 });
        preds.push({ category: 'plumbing', action: 'Ispezione completa impianti idraulici', timeframe: '1-3 mesi', estimatedCost: 800 });
      }

      // HVAC analysis
      const hvacEquipment = equipment.filter(e => e.category === 'HVAC');
      const hvacMaintenance = maintenance.filter(m => m.category === 'HVAC' && m.status === 'Completed');
      const lastHVAC = hvacMaintenance.length > 0 ? hvacMaintenance.sort((a, b) => new Date(b.completed_date) - new Date(a.completed_date))[0] : null;
      const monthsSinceHVAC = lastHVAC ? Math.floor((new Date() - new Date(lastHVAC.completed_date)) / (1000 * 60 * 60 * 24 * 30)) : 999;
      
      const hvacAge = hvacEquipment.length > 0 
        ? hvacEquipment.map(e => new Date().getFullYear() - new Date(e.installation_date).getFullYear()).reduce((a, b) => a + b, 0) / hvacEquipment.length
        : 999;

      let hvacScore = 100;
      if (monthsSinceHVAC > 12) hvacScore -= (monthsSinceHVAC - 12) * 3;
      if (hvacAge > 10) hvacScore -= (hvacAge - 10) * 5;
      hvacScore = Math.max(0, Math.min(100, hvacScore));
      categoryScores.hvac = hvacScore;

      if (monthsSinceHVAC > 12) {
        issues.push({ category: 'hvac', severity: 'warning', message: `Manutenzione HVAC scaduta da ${monthsSinceHVAC - 12} mesi`, confidence: 95 });
        preds.push({ category: 'hvac', action: 'Manutenzione ordinaria HVAC', timeframe: '1-2 mesi', estimatedCost: 300 });
      }
      if (hvacAge > 15) {
        preds.push({ category: 'hvac', action: 'Valutare sostituzione HVAC', timeframe: '1-2 anni', estimatedCost: 5000 });
      }

      // Roofing analysis
      const roofAge = new Date().getFullYear() - (property.year_built || new Date().getFullYear());
      const roofingProjects = projects.filter(p => p.title.toLowerCase().includes('tetto') || p.title.toLowerCase().includes('copertura'));
      const lastRoofing = roofingProjects.length > 0 ? roofingProjects.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0] : null;
      const actualRoofAge = lastRoofing ? (new Date() - new Date(lastRoofing.created_date)) / (1000 * 60 * 60 * 24 * 365) : roofAge;

      let roofingScore = 100 - (actualRoofAge * 2);
      if (actualRoofAge > 20) roofingScore -= (actualRoofAge - 20) * 3;
      roofingScore = Math.max(0, Math.min(100, roofingScore));
      categoryScores.roofing = roofingScore;

      if (actualRoofAge > 20) {
        issues.push({ category: 'roofing', severity: 'warning', message: `Tetto di ${Math.round(actualRoofAge)} anni, ispezione raccomandata`, confidence: 80 });
        preds.push({ category: 'roofing', action: 'Ispezione impermeabilizzazione', timeframe: '3-6 mesi', estimatedCost: 1500 });
      }

      // Security & Networking
      categoryScores.security = property.security_notes ? 80 : 50;
      categoryScores.networking = property.networking_notes ? 75 : 60;

      // Calculate overall score
      let overallScore = 0;
      Object.keys(CATEGORY_CONFIG).forEach(cat => {
        overallScore += (categoryScores[cat] || 50) * CATEGORY_CONFIG[cat].weight;
      });

      // Active tickets impact
      const activeTickets = tickets.filter(t => t.status !== 'Resolved' && t.status !== 'Closed').length;
      overallScore -= activeTickets * 2;
      
      // Risk impact
      const criticalRisks = risks.filter(r => r.severity === 'Critical').length;
      overallScore -= criticalRisks * 5;
      
      overallScore = Math.max(0, Math.min(100, overallScore));

      // Determine severity
      let severity = 'excellent';
      if (overallScore < 50) severity = 'critical';
      else if (overallScore < 70) severity = 'warning';
      else if (overallScore < 85) severity = 'good';

      // Generate AI-style recommendations
      const recommendations = [];
      if (categoryScores.hvac < 70) recommendations.push({ text: 'Manutenzione HVAC raccomandata entro 30 giorni', priority: 'high', ai_generated: true });
      if (categoryScores.electrical < 60) recommendations.push({ text: 'Ispezione impianto elettrico necessaria', priority: 'critical', ai_generated: true });
      if (categoryScores.plumbing < 70) recommendations.push({ text: 'Verifica impianti idraulici', priority: 'high', ai_generated: true });
      if (activeTickets > 0) recommendations.push({ text: `${activeTickets} ticket in sospeso da risolvere`, priority: 'medium', ai_generated: false });
      if (risks.length > 0) recommendations.push({ text: `${risks.length} rischi identificati da mitigare`, priority: 'high', ai_generated: true });

      setHealthData({
        overallScore: Math.round(overallScore),
        severity,
        categoryScores,
        issues,
        recommendations,
        activeTickets,
        totalTickets: tickets.length,
        totalProjects: projects.length,
        totalEquipment: equipment.length,
        activeRisks: risks.length,
        newInsights: insights.length,
      });
      setPredictions(preds);
    } catch (error) {
      console.error('Failed to load predictive health data:', error);
      toast.error('Errore nel caricamento Property Health Score');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-gray-500">Analisi predittiva in corso...</p>
        </div>
      </div>
    );
  }

  if (!healthData) return null;

  const { overallScore, severity, categoryScores, issues, recommendations } = healthData;
  const severityConfig = SEVERITY_CONFIG[severity];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="w-20 h-20 rounded-2xl flex items-center justify-center border-4"
            style={{ borderColor: severityConfig.color, background: severityConfig.bg }}
          >
            <div className="text-center">
              <span className="text-2xl font-bold" style={{ color: severityConfig.color }}>{overallScore}</span>
              <p className="text-[9px] text-gray-500 uppercase">/ 100</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-purple-500" />
              Predictive Property Health
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{severityConfig.label}</p>
            <p className="text-[10px] text-gray-400 mt-1">Basato su {healthData.totalProjects} progetti, {healthData.totalTickets} ticket, {healthData.totalEquipment} equipaggiamenti</p>
          </div>
        </div>
        <TrendingUp className="w-5 h-5" style={{ color: severityConfig.color }} />
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          const score = Math.round(categoryScores[key] || 50);
          return (
            <div key={key} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
              <Icon className="w-4 h-4 mx-auto mb-1.5" style={{ color: config.color }} />
              <p className="text-[9px] text-gray-500 uppercase mb-1">{config.label}</p>
              <p 
                className="text-lg font-bold"
                style={{ color: score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444' }}
              >
                {score}
              </p>
            </div>
          );
        })}
      </div>

      {/* Predictions */}
      {predictions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-blue-900 mb-3 flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5" />
            Manutenzioni Predette ({predictions.length})
          </p>
          <div className="space-y-2">
            {predictions.map((pred, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                <Calendar className="w-3 h-3 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-gray-900 font-medium">{pred.action}</p>
                  <p className="text-gray-500">{pred.timeframe} · <span className="font-medium">€{pred.estimatedCost}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Issues */}
      {issues.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-amber-900 mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Problemi Rilevati ({issues.length})
          </p>
          <div className="space-y-2">
            {issues.map((issue, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                <div 
                  className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                  style={{ backgroundColor: issue.severity === 'critical' ? '#EF4444' : '#F59E0B' }}
                />
                <div className="flex-1">
                  <p className="text-gray-900">{issue.message}</p>
                  <p className="text-gray-500">Confidenza: {issue.confidence}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-emerald-900 mb-3 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            Raccomandazioni AI ({recommendations.length})
          </p>
          <div className="space-y-2">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                <Wrench className="w-3 h-3 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-900">{rec.text}</span>
                {rec.ai_generated && <Brain className="w-3 h-3 text-purple-400 ml-auto" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}