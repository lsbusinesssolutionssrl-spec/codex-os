import { useState, useEffect } from 'react';
import { Bell, Shield, TrendingUp, AlertTriangle, CheckCircle, Clock, Calendar, DollarSign, Activity, Zap, Droplets, Thermometer, Home, Wrench } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const ISSUE_CATEGORIES = {
  'Water Leak': { label: 'Perdite Idriche', icon: Droplets, color: '#3B82F6' },
  'Electrical': { label: 'Elettrico', icon: Zap, color: '#F59E0B' },
  'Network': { label: 'Networking', icon: Activity, color: '#10B981' },
  'Security': { label: 'Sicurezza', icon: Shield, color: '#8B5CF6' },
  'Maintenance': { label: 'Manutenzione', icon: Wrench, color: '#EF4444' },
};

export default function PropertyAnalytics({ companyId }) {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    if (companyId) loadAnalytics();
  }, [companyId]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [properties, tickets, projects, maintenance, equipment, risks] = await Promise.all([
        base44.entities.Property.filter({ company_id: companyId }),
        base44.entities.SupportTicket.filter({ company_id: companyId }),
        base44.entities.Project.filter({ company_id: companyId }),
        base44.entities.PropertyMaintenance.filter({ company_id: companyId }).catch(() => []),
        base44.entities.PropertyEquipment.filter({ company_id: companyId }).catch(() => []),
        base44.entities.PropertyRisk.filter({ company_id: companyId }).catch(() => []),
      ]);

      // Issue patterns
      const issuePatterns = {};
      tickets.forEach(t => {
        const category = t.issue_type || 'Other';
        if (!issuePatterns[category]) {
          issuePatterns[category] = { count: 0, properties: new Set(), cost: 0 };
        }
        issuePatterns[category].count++;
        issuePatterns[category].properties.add(t.property_id);
      });

      // Convert sets to counts
      Object.keys(issuePatterns).forEach(k => {
        issuePatterns[k] = {
          ...issuePatterns[k],
          properties: issuePatterns[k].properties.size,
        };
      });

      // System costs (from projects)
      const systemCosts = {};
      projects.forEach(p => {
        const category = p.title.toLowerCase().includes('elettrico') ? 'Electrical' :
                        p.title.toLowerCase().includes('idraulico') ? 'Plumbing' :
                        p.title.toLowerCase().includes('hvac') || p.title.toLowerCase().includes('clima') ? 'HVAC' :
                        'Other';
        
        if (!systemCosts[category]) systemCosts[category] = 0;
        systemCosts[category] += (p.contract_value || 0);
      });

      // Maintenance compliance
      const totalMaintenance = maintenance.length;
      const completedMaintenance = maintenance.filter(m => m.status === 'Completed').length;
      const overdueMaintenance = maintenance.filter(m => 
        m.status === 'Scheduled' && new Date(m.scheduled_date) < new Date()
      ).length;
      const complianceRate = totalMaintenance > 0 ? (completedMaintenance / totalMaintenance * 100) : 0;

      // Lifecycle costs (equipment + maintenance)
      const totalEquipmentValue = equipment.reduce((sum, e) => sum + (e.replacement_cost_estimate || 0), 0);
      const totalMaintenanceCost = maintenance.reduce((sum, m) => sum + (m.cost || 0), 0);
      const totalLifecycleCost = totalEquipmentValue + totalMaintenanceCost;

      // Risk distribution
      const riskByType = {};
      risks.forEach(r => {
        if (!riskByType[r.risk_type]) riskByType[r.risk_type] = 0;
        riskByType[r.risk_type]++;
      });

      // Property health distribution
      const healthScores = properties.map(p => {
        const propertyTickets = tickets.filter(t => t.property_id === p.id);
        const propertyProjects = projects.filter(proj => proj.property_id === p.id);
        const activeTickets = propertyTickets.filter(t => t.status !== 'Resolved' && t.status !== 'Closed').length;
        
        let score = 100 - (activeTickets * 5) - (propertyProjects.length * 2);
        return Math.max(0, Math.min(100, score));
      });

      const healthDistribution = {
        excellent: healthScores.filter(s => s >= 85).length,
        good: healthScores.filter(s => s >= 70 && s < 85).length,
        warning: healthScores.filter(s => s >= 50 && s < 70).length,
        critical: healthScores.filter(s => s < 50).length,
      };

      // Average health
      const avgHealth = healthScores.length > 0 
        ? Math.round(healthScores.reduce((a, b) => a + b, 0) / healthScores.length)
        : 0;

      setAnalytics({
        totalProperties: properties.length,
        totalTickets: tickets.length,
        totalProjects: projects.length,
        totalMaintenance: totalMaintenance,
        totalEquipment: equipment.length,
        totalRisks: risks.length,
        issuePatterns,
        systemCosts,
        maintenanceCompliance: {
          rate: Math.round(complianceRate),
          completed: completedMaintenance,
          overdue: overdueMaintenance,
          total: totalMaintenance,
        },
        lifecycleCosts: {
          equipment: totalEquipmentValue,
          maintenance: totalMaintenanceCost,
          total: totalLifecycleCost,
        },
        riskDistribution: riskByType,
        healthDistribution,
        avgHealth,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Errore nel caricamento analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-gray-500">Caricamento analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900">Property Analytics</h2>
        <p className="text-sm text-gray-500 mt-0.5">Pattern, costi e compliance del portafoglio</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AnalyticsKpiCard 
          label="Salute Media" 
          value={`${analytics.avgHealth}`} 
          suffix="/ 100"
          icon={Activity} 
          color={analytics.avgHealth >= 80 ? '#10B981' : analytics.avgHealth >= 60 ? '#F59E0B' : '#EF4444'} 
        />
        <AnalyticsKpiCard 
          label="Compliance Manutenzioni" 
          value={`${analytics.maintenanceCompliance.rate}%`} 
          icon={CheckCircle} 
          color="#1147FF" 
        />
        <AnalyticsKpiCard 
          label="Costi Lifecycle" 
          value={`€${(analytics.lifecycleCosts.total / 1000).toFixed(0)}K`} 
          icon={DollarSign} 
          color="#8B5CF6" 
        />
        <AnalyticsKpiCard 
          label="Rischi Attivi" 
          value={analytics.totalRisks} 
          icon={AlertTriangle} 
          color="#EF4444" 
        />
      </div>

      {/* Issue Patterns */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-500" />
          Pattern Issue Più Comuni
        </h3>
        <div className="space-y-3">
          {Object.entries(analytics.issuePatterns)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 5)
            .map(([category, data], idx) => {
              const Config = ISSUE_CATEGORIES[category] || { label: category, icon: Activity, color: '#6B7280' };
              const Icon = Config.icon;
              return (
                <div key={category} className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: Config.color + '20' }}
                  >
                    <Icon className="w-4 h-4" style={{ color: Config.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{Config.label}</span>
                      <span className="text-sm font-bold text-gray-900">{data.count}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      <span>{data.properties} proprietà</span>
                      <span>•</span>
                      <span>{((data.count / analytics.totalTickets) * 100).toFixed(0)}% del totale</span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* System Costs */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-500" />
          Costi per Sistema
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(analytics.systemCosts).map(([system, cost], idx) => (
            <div key={system} className="text-center">
              <p className="text-xs text-gray-500 uppercase mb-1">{system}</p>
              <p className="text-lg font-bold text-gray-900">€{(cost / 1000).toFixed(1)}K</p>
            </div>
          ))}
        </div>
      </div>

      {/* Maintenance Compliance */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          Compliance Manutenzioni
        </h3>
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="#E5E7EB"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="#10B981"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(analytics.maintenanceCompliance.rate / 100) * 251.2} 251.2`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-gray-900">{analytics.maintenanceCompliance.rate}%</span>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Completate</span>
              <span className="font-semibold text-emerald-600">{analytics.maintenanceCompliance.completed}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">In scadenza</span>
              <span className="font-semibold text-orange-600">{analytics.maintenanceCompliance.overdue}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Totale</span>
              <span className="font-semibold text-gray-900">{analytics.maintenanceCompliance.total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Health Distribution */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-500" />
          Distribuzione Salute Proprietà
        </h3>
        <div className="grid grid-cols-4 gap-3">
          <HealthBar label="Excellent" count={analytics.healthDistribution.excellent} total={analytics.totalProperties} color="#059669" />
          <HealthBar label="Good" count={analytics.healthDistribution.good} total={analytics.totalProperties} color="#10B981" />
          <HealthBar label="Warning" count={analytics.healthDistribution.warning} total={analytics.totalProperties} color="#F59E0B" />
          <HealthBar label="Critical" count={analytics.healthDistribution.critical} total={analytics.totalProperties} color="#EF4444" />
        </div>
      </div>
    </div>
  );
}

function AnalyticsKpiCard({ label, value, suffix, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold" style={{ color }}>{value}<span className="text-sm font-normal text-gray-400 ml-0.5">{suffix}</span></p>
    </div>
  );
}

function HealthBar({ label, count, total, color }) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  
  return (
    <div className="text-center">
      <div className="h-2 bg-gray-100 rounded-full mb-2 overflow-hidden">
        <div 
          className="h-full rounded-full transition-all"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-xs font-semibold text-gray-900">{label}</p>
      <p className="text-[10px] text-gray-500">{count} ({percentage}%)</p>
    </div>
  );
}