import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, DollarSign, Activity, Home, Calendar, Zap, Droplets, Thermometer } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { hasRole } from '@/lib/roleUtils';
import PredictivePropertyHealth from '../components/ai/PredictivePropertyHealth';

export default function PropertyIntelligence() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [portfolioStats, setPortfolioStats] = useState({
    totalProperties: 0,
    avgHealthScore: 0,
    criticalIssues: 0,
    upcomingMaintenance: 0,
    totalEquipment: 0,
    expiringWarranties: 0,
    totalRisks: 0,
    predictedSavings: 0,
  });
  const [healthDistribution, setHealthDistribution] = useState({ excellent: 0, good: 0, warning: 0, critical: 0 });
  const [topRisks, setTopRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    hasRole(['admin', 'company_admin', 'project_manager']).then(auth => {
      if (!auth) {
        navigate('/');
        return;
      }
      setIsAuthorized(true);
    });
  }, []);

  useEffect(() => {
    if (!isAuthorized) return;
    
    const loadPortfolioIntelligence = async () => {
      try {
        const user = await base44.auth.me();
        const companyRes = await base44.functions.invoke('getCurrentCompany', {}).catch(() => ({ data: { company: null } }));
        const companyId = companyRes.data?.company?.id;

        const [allProperties, allTickets, allProjects, allEquipment, allMaintenance, allRisks, allInsights] = await Promise.all([
          base44.entities.Property.list(),
          base44.entities.SupportTicket.list(),
          base44.entities.Project.list(),
          base44.entities.PropertyEquipment.list().catch(() => []),
          base44.entities.PropertyMaintenance.list().catch(() => []),
          base44.entities.PropertyRisk.list().catch(() => []),
          base44.entities.PropertyInsight.list().catch(() => []),
        ]);

        // Filter by company
        const properties = companyId ? allProperties.filter(p => p.company_id === companyId) : allProperties;
        const tickets = companyId ? allTickets.filter(t => t.company_id === companyId) : allTickets;
        const projects = companyId ? allProjects.filter(p => p.company_id === companyId) : allProjects;
        const equipment = companyId ? allEquipment.filter(e => e.company_id === companyId) : allEquipment;
        const maintenance = companyId ? allMaintenance.filter(m => m.company_id === companyId) : allMaintenance;
        const risks = companyId ? allRisks.filter(r => r.company_id === companyId) : allRisks;
        const insights = companyId ? allInsights.filter(i => i.company_id === companyId) : allInsights;

        // Calculate health scores for each property
        const propertiesWithHealth = await Promise.all(properties.map(async (property) => {
          const propTickets = tickets.filter(t => t.property_id === property.id);
          const propProjects = projects.filter(p => p.property_id === property.id);
          const propEquipment = equipment.filter(e => e.property_id === property.id);
          
          // Simplified health calculation
          const activeTickets = propTickets.filter(t => t.status !== 'Resolved' && t.status !== 'Closed').length;
          const waterLeaks = propTickets.filter(t => t.issue_type === 'Water Leak').length;
          const electricalAge = new Date().getFullYear() - (property.year_built || new Date().getFullYear());
          
          let score = 100;
          score -= activeTickets * 3;
          score -= waterLeaks * 10;
          score -= Math.max(0, electricalAge - 20) * 2;
          score = Math.max(0, Math.min(100, score));
          
          let severity = 'excellent';
          if (score < 50) severity = 'critical';
          else if (score < 70) severity = 'warning';
          else if (score < 85) severity = 'good';
          
          return { ...property, healthScore: Math.round(score), severity };
        }));

        setProperties(propertiesWithHealth);

        // Portfolio stats
        const avgHealthScore = propertiesWithHealth.reduce((sum, p) => sum + p.healthScore, 0) / propertiesWithHealth.length;
        const criticalIssues = propertiesWithHealth.filter(p => p.severity === 'critical').length;
        const upcomingMaintenance = maintenance.filter(m => m.status === 'Scheduled' && new Date(m.scheduled_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length;
        const expiringWarranties = equipment.filter(e => {
          if (!e.warranty_expiration) return false;
          const daysUntilExpiry = (new Date(e.warranty_expiration) - new Date()) / (1000 * 60 * 60 * 24);
          return daysUntilExpiry > 0 && daysUntilExpiry <= 90;
        }).length;
        const activeRisks = risks.filter(r => r.status !== 'Resolved').length;
        const predictedSavings = insights.reduce((sum, i) => sum + (i.estimated_cost_savings || 0), 0);

        setPortfolioStats({
          totalProperties: propertiesWithHealth.length,
          avgHealthScore: Math.round(avgHealthScore),
          criticalIssues,
          upcomingMaintenance,
          totalEquipment: equipment.length,
          expiringWarranties,
          totalRisks: activeRisks,
          predictedSavings,
        });

        // Health distribution
        setHealthDistribution({
          excellent: propertiesWithHealth.filter(p => p.severity === 'excellent').length,
          good: propertiesWithHealth.filter(p => p.severity === 'good').length,
          warning: propertiesWithHealth.filter(p => p.severity === 'warning').length,
          critical: propertiesWithHealth.filter(p => p.severity === 'critical').length,
        });

        // Top risks
        const sortedRisks = risks
          .filter(r => r.status !== 'Resolved')
          .sort((a, b) => {
            const severityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };
            return severityOrder[b.severity] - severityOrder[a.severity];
          })
          .slice(0, 5)
          .map(r => ({
            ...r,
            property: properties.find(p => p.id === r.property_id),
          }));
        
        setTopRisks(sortedRisks);
      } catch (error) {
        console.error('Error loading portfolio intelligence:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPortfolioIntelligence();
  }, [isAuthorized]);

  if (!isAuthorized) return null;
  if (loading) return <div className="p-6 text-center text-gray-400">Caricamento...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            Property Intelligence
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Portafoglio: {portfolioStats.totalProperties} proprietà · Salute media: {portfolioStats.avgHealthScore}/100</p>
        </div>
        <button 
          onClick={() => navigate('/properties')}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <Home className="w-3.5 h-3.5" />
          Tutte le Proprietà
        </button>
      </div>

      {/* Portfolio KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <KpiCard label="Proprietà" value={portfolioStats.totalProperties} icon={Home} color="#1147FF" />
        <KpiCard label="Salute Media" value={`${portfolioStats.avgHealthScore}/100`} icon={Activity} color={portfolioStats.avgHealthScore >= 70 ? '#10B981' : '#F59E0B'} />
        <KpiCard label="Critiche" value={portfolioStats.criticalIssues} icon={AlertTriangle} color="#EF4444" />
        <KpiCard label="Manutenzioni" value={portfolioStats.upcomingMaintenance} icon={Calendar} color="#F59E0B" />
        <KpiCard label="Equipaggiamenti" value={portfolioStats.totalEquipment} icon={Zap} color="#8B5CF6" />
        <KpiCard label="Garanzie" value={portfolioStats.expiringWarranties} icon={CheckCircle} color="#06B6D4" />
        <KpiCard label="Rischi" value={portfolioStats.totalRisks} icon={AlertTriangle} color="#EF4444" />
        <KpiCard label="Risparmio" value={`€${portfolioStats.predictedSavings.toLocaleString()}`} icon={DollarSign} color="#10B981" />
      </div>

      {/* Health Distribution */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-500" />
          Distribuzione Salute Portafoglio
        </h2>
        <div className="grid grid-cols-4 gap-4">
          <HealthBar label="Eccellente" count={healthDistribution.excellent} total={portfolioStats.totalProperties} color="#059669" />
          <HealthBar label="Buono" count={healthDistribution.good} total={portfolioStats.totalProperties} color="#10B981" />
          <HealthBar label="Attenzione" count={healthDistribution.warning} total={portfolioStats.totalProperties} color="#F59E0B" />
          <HealthBar label="Critico" count={healthDistribution.critical} total={portfolioStats.totalProperties} color="#EF4444" />
        </div>
      </div>

      {/* Top Risks */}
      {topRisks.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Rischi Prioritari ({topRisks.length})
          </h2>
          <div className="space-y-3">
            {topRisks.map(risk => (
              <div key={risk.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                  risk.severity === 'Critical' ? 'bg-red-500' :
                  risk.severity === 'High' ? 'bg-orange-500' :
                  risk.severity === 'Medium' ? 'bg-yellow-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{risk.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{risk.property?.property_name} · {risk.risk_type}</p>
                  <p className="text-xs text-gray-600 mt-1">{risk.description}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  risk.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                  risk.severity === 'High' ? 'bg-orange-100 text-orange-700' :
                  risk.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {risk.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {properties.slice(0, 9).map(property => (
          <div 
            key={property.id}
            onClick={() => navigate(`/properties/${property.id}`)}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg cursor-pointer transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900">{property.property_name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{property.address}</p>
              </div>
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center border-2"
                style={{ 
                  borderColor: property.healthScore >= 80 ? '#10B981' : property.healthScore >= 60 ? '#F59E0B' : '#EF4444',
                  background: property.healthScore >= 80 ? '#10B98115' : property.healthScore >= 60 ? '#F59E0B15' : '#EF444415'
                }}
              >
                <span className={`text-sm font-bold ${
                  property.healthScore >= 80 ? 'text-green-600' : 
                  property.healthScore >= 60 ? 'text-orange-600' : 
                  'text-red-600'
                }`}>
                  {property.healthScore}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Home className="w-3 h-3" /> {property.type}
              </span>
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" /> {property.year_built || 'N/A'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <p className="text-lg font-bold" style={{ color }}>{value}</p>
    </div>
  );
}

function HealthBar({ label, count, total, color }) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  
  return (
    <div className="text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
        <div 
          className="h-full rounded-full transition-all"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-sm font-bold" style={{ color }}>{count}</p>
      <p className="text-[10px] text-gray-400">{percentage}%</p>
    </div>
  );
}