import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, DollarSign, Users, Award, AlertTriangle, BarChart3, PieChart, Activity, Target, Zap, Crown, Brain, BookOpen, CheckCircle, Bot, Bell, Settings, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useGlobalContext } from '@/lib/GlobalContextEngine';
import { ContextGate } from '@/components/ContextGate';
import LiveKpiWidgets from '../components/LiveKpiWidgets';
import AlertSettings from '../components/AlertSettings';

export default function ExecutiveInsights() {
  const navigate = useNavigate();
  const globalContext = useGlobalContext();
  const { activeTenant, isPlatformMode, enabledModules } = globalContext;
  const [loading, setLoading] = useState(true);
  const [execData, setExecData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  const [showAlertSettings, setShowAlertSettings] = useState(false);
  const previousDataRef = useRef(null);

  useEffect(() => {
    // Module gate check
    if (!enabledModules.includes('intelligence') && !isPlatformMode) {
      setLoading(false);
      return;
    }
    
    loadExecutiveData();
    
    const pollInterval = setInterval(() => {
      loadExecutiveData(true);
    }, 30000);

    return () => clearInterval(pollInterval);
  }, []);

  const loadExecutiveData = async (isRefresh = false) => {
    // Platform mode - no data
    if (isPlatformMode && !activeTenant) {
      setExecData({ isEmpty: true });
      setLoading(false);
      return;
    }
    
    // Get tenant filters for proper isolation
    const filtersRes = await base44.functions.invoke('getUserFilters', {});
    const company_id = filtersRes.data.filters?.Project?.company_id || filtersRes.data.filters?.company_id;
    
    if (!company_id) {
      setExecData({ isEmpty: true, reason: 'no_tenant' });
      setLoading(false);
      return;
    }

    // Load ONLY tenant-scoped data
    const [projects, costs, clients, suppliers, timesheets, guardians, knowledgeBase, projectLearning] = await Promise.all([
      base44.entities.Project.filter({ company_id }, '-updated_date', 50),
      base44.entities.ProjectCost.filter({ company_id }, '-date', 100),
      base44.entities.Client.filter({ company_id }),
      base44.entities.Supplier.filter({ company_id }),
      base44.entities.Timesheet.filter({ company_id }, '-date', 100),
      base44.entities.GuardianSubscription.filter({ company_id }),
      base44.entities.KnowledgeBase.filter({ company_id }),
      base44.entities.ProjectLearning.filter({ company_id }, '-created_date', 50),
    ]);

    // Rileva margini critici e invia notifiche
    checkCriticalMargins(projects, isRefresh);

    // Revenue & Margin Trend (last 6 months)
    const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu'];
    const revenueByMonth = Array(6).fill(0);
    const marginByMonth = Array(6).fill(0);
    
    projects.forEach(p => {
      if (p.created_date) {
        const month = new Date(p.created_date).getMonth();
        const currentMonth = new Date().getMonth();
        const monthsAgo = currentMonth - month;
        if (monthsAgo >= 0 && monthsAgo < 6) {
          revenueByMonth[5 - monthsAgo] += p.contract_value || 0;
          marginByMonth[5 - monthsAgo] += (p.contract_value || 0) - (p.material_costs + p.labor_costs + p.other_costs || 0);
        }
      }
    });

    // Best/Worst Customers by project count and margin
    const clientStats = {};
    projects.forEach(p => {
      if (!clientStats[p.client_id]) {
        clientStats[p.client_id] = { projects: 0, revenue: 0, margin: 0 };
      }
      clientStats[p.client_id].projects += 1;
      clientStats[p.client_id].revenue += p.contract_value || 0;
      clientStats[p.client_id].margin += (p.gross_margin_pct || 0);
    });

    const clientList = Object.entries(clientStats)
      .map(([clientId, stats]) => {
        const client = clients.find(c => c.id === clientId);
        return {
          name: client ? `${client.name} ${client.company_name || ''}` : 'Cliente',
          projects: stats.projects,
          revenue: stats.revenue,
          avgMargin: stats.projects > 0 ? (stats.margin / stats.projects).toFixed(1) : 0,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    // Best Suppliers
    const supplierRanking = suppliers
      .filter(s => s.rating)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5)
      .map(s => ({
        name: s.name,
        rating: s.rating,
        category: s.category,
        annualSpend: s.annual_spend || 0,
      }));

    // Team Performance (by hours worked)
    const teamStats = {};
    timesheets.forEach(t => {
      if (!teamStats[t.employee_id]) {
        teamStats[t.employee_id] = { hours: 0, projects: new Set() };
      }
      teamStats[t.employee_id].hours += t.hours || 0;
      teamStats[t.employee_id].projects.add(t.project_id);
    });

    const teamRanking = Object.entries(teamStats)
      .map(([userId, stats]) => ({
        name: `Tecnico ${userId}`,
        hours: stats.hours,
        projects: stats.projects.size,
        efficiency: (stats.hours / stats.projects).toFixed(1),
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5);

    // Growth Opportunities
    const opportunities = [];
    const mrr = guardians.reduce((sum, g) => sum + (g.monthly_price || 0), 0);
    const activeGuardians = guardians.filter(g => g.status === 'Active').length;
    
    if (mrr < 1000) {
      opportunities.push({
        title: 'Espandi Guardian',
        description: `MRR attuale €${mrr}. Obiettivo: raddoppiare in 6 mesi.`,
        impact: '+€500 MRR',
        priority: 'High',
      });
    }

    const avgMargin = projects.length > 0 
      ? projects.reduce((sum, p) => sum + (p.gross_margin_pct || 0), 0) / projects.length 
      : 0;
    
    if (avgMargin < 35) {
      opportunities.push({
        title: 'Migliora Pricing',
        description: `Margine medio ${avgMargin.toFixed(1)}%. Target: 35%+.`,
        impact: '+10% profittabilità',
        priority: 'Critical',
      });
    }

    const completedProjects = projects.filter(p => p.status === 'Delivered').length;
    if (completedProjects < projects.length * 0.5) {
      opportunities.push({
        title: 'Accelera Delivery',
        description: `Solo ${completedProjects}/${projects.length} progetti completati.`,
        impact: '+20% throughput',
        priority: 'Medium',
      });
    }

    // Risk Indicators
    const risks = [];
    const delayedProjects = projects.filter(p => 
      p.expected_end_date && new Date(p.expected_end_date) < new Date() && !['Delivered', 'Guardian Active'].includes(p.status)
    ).length;

    if (delayedProjects > 0) {
      risks.push({
        title: 'Progetti in Ritardo',
        description: `${delayedProjects} progetti oltre la scadenza.`,
        severity: 'High',
      });
    }

    const lowMarginProjects = projects.filter(p => (p.gross_margin_pct || 0) < 25).length;
    if (lowMarginProjects > 0) {
      risks.push({
        title: 'Margini Critici',
        description: `${lowMarginProjects} progetti sotto il 25% di margine.`,
        severity: 'Critical',
      });
    }

    const unpaidInvoices = projects.reduce((sum, p) => sum + ((p.contract_value || 0) - (p.payment_collected || 0)), 0);
    if (unpaidInvoices > 10000) {
      risks.push({
        title: 'Incassi Arretrati',
        description: `€${unpaidInvoices.toLocaleString('it-IT')} da incassare.`,
        severity: 'High',
      });
    }

    // Knowledge Score
    const documentedProjects = projects.filter(p => p.notes || p.photos_after?.length > 0).length;
    const lessonsLearned = projectLearning.filter(pl => pl.what_went_well || pl.improvements).length;
    const maxScore = Math.max(1, projects.length * 4);
    const knowledgeScore = Math.round(((documentedProjects + lessonsLearned + knowledgeBase.length) / maxScore) * 100);

    const newData = {
      revenueTrend: revenueByMonth,
      marginTrend: marginByMonth,
      bestCustomers: clientList.slice(0, 5),
      worstCustomers: clientList.slice(-3).reverse(),
      bestSuppliers: supplierRanking,
      bestTeams: teamRanking,
      growthOpportunities: opportunities,
      riskIndicators: risks,
      knowledgeScore,
      hasRealData: projects.length > 0 || clients.length > 0,
    };

    previousDataRef.current = execData;
    setExecData(newData);
    setLastUpdated(new Date());
    setLoading(false);
  };

  const checkCriticalMargins = (projects, isRefresh) => {
    const criticalProjects = projects.filter(p => 
      (p.gross_margin_pct || 0) < 25 && 
      ['In Progress', 'Approved'].includes(p.status)
    );

    const newAlerts = [];
    
    criticalProjects.forEach(project => {
      const prevProject = previousDataRef.current?.projects?.find(p => p.id === project.id);
      const marginNow = project.gross_margin_pct || 0;
      const marginBefore = prevProject?.gross_margin_pct || null;
      
      // Notifica solo se il margine è sceso sotto soglia o è nuovo alert
      if (marginNow < 25 && (marginBefore === null || marginBefore >= 25)) {
        newAlerts.push({
          project_id: project.id,
          title: project.title,
          margin: marginNow,
          timestamp: new Date(),
        });
      }
    });

    if (newAlerts.length > 0) {
      setCriticalAlerts(prev => [...prev, ...newAlerts]);
      
      // Invia notifica toast
      newAlerts.forEach(alert => {
        toast.error(
          `⚠️ Margine Critico: ${alert.title}`,
          {
            description: `Margine sceso al ${alert.margin.toFixed(1)}% - Sotto soglia 25%`,
            duration: 8000,
            action: {
              label: 'Vedi Progetto',
              onClick: () => navigate(`/projects/${alert.project_id}`),
            },
          }
        );
      });
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  );

  // Module gate - show proper error with onboarding
  if (!enabledModules.includes('intelligence') && !isPlatformMode) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border-2 border-dashed border-amber-200 p-12 text-center">
          <Brain className="w-16 h-16 text-amber-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Intelligence Non Abilitata</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Il modulo Intelligence non è incluso nel tuo piano attuale o non è stato ancora attivato.
          </p>
          <div className="space-y-3">
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-left">
              <p className="text-sm font-semibold text-amber-900 mb-2">Per attivare Intelligence:</p>
              <ol className="text-sm text-amber-800 space-y-1 list-decimal list-inside">
                <li>Vai su Impostazioni Company</li>
                <li>Sezione Subscription & Piani</li>
                <li>Upgrade a piano Enterprise</li>
                <li>Oppure contatta il supporto</li>
              </ol>
            </div>
            <button
              onClick={() => navigate('/company-settings')}
              className="px-6 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#1147FF' }}
            >
              Vai su Impostazioni
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state - no real data
  if (execData?.isEmpty) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Nessun Dato Disponibile</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {execData.reason === 'no_tenant' 
              ? 'Seleziona un tenant per visualizzare gli insight strategici.'
              : 'Completa lonboarding e aggiungi progetti, clienti e timesheet per attivare gli insight direzionali.'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-2xl mx-auto">
            <EmptyStateButton 
              icon={DollarSign}
              title="Aggiungi Progetti"
              description="Crea i primi progetti per tracciare ricavi e margini"
              onClick={() => navigate('/projects')}
            />
            <EmptyStateButton 
              icon={Users}
              title="Aggiungi Clienti"
              description="Registra i clienti per analisi dettagliate"
              onClick={() => navigate('/clients')}
            />
            <EmptyStateButton 
              icon={Activity}
              title="Attiva Timesheet"
              description="Traccia le ore per calcolare i costi reali"
              onClick={() => navigate('/timesheets')}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#0B2341' }}>
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Executive Insights</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm text-gray-500">
                {activeTenant?.name ? `Dashboard di ${activeTenant.name}` : 'Panoramica strategica'}
              </p>
              <span className="text-xs text-green-600 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowAlertSettings(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Configura Alert"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
          {criticalAlerts.length > 0 && (
            <div className="relative">
              <Bell className="w-5 h-5 text-red-500 animate-bounce" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center">
                {criticalAlerts.length}
              </span>
            </div>
          )}
          <div className="text-right">
            <p className="text-xs text-gray-500 font-medium">Knowledge Score</p>
            <p className={`text-2xl font-bold ${execData.knowledgeScore >= 75 ? 'text-green-600' : execData.knowledgeScore >= 50 ? 'text-orange-600' : 'text-red-600'}`}>
              {execData.knowledgeScore}/100
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Aggiornato: {lastUpdated.toLocaleTimeString('it-IT')}
            </p>
          </div>
        </div>
      </div>

      {/* Live KPI Widgets - only if has real data */}
      {execData?.hasRealData ? (
        <LiveKpiWidgets />
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-800 font-medium">
            Dati insufficienti per i KPI live. Aggiungi almeno 3 progetti completati.
          </p>
        </div>
      )}

      {/* Revenue & Margin Trends - only if has data */}
      {execData?.hasRealData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TrendCard 
            title="Andamento Ricavi (6 mesi)" 
            icon={DollarSign}
            color="#1147FF"
            data={execData.revenueTrend}
            format="currency"
          />
          <TrendCard 
            title="Andamento Margini (6 mesi)" 
            icon={TrendingUp}
            color="#10B981"
            data={execData.marginTrend}
            format="currency"
          />
        </div>
      )}

      {/* Rankings - only if has data */}
      {execData?.hasRealData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Best Customers */}
          <RankingCard 
            title="Migliori Clienti" 
            icon={Award}
            color="#1147FF"
            data={execData.bestCustomers}
            valueKey="revenue"
            valueFormat="currency"
          />

          {/* Best Suppliers */}
          <RankingCard 
            title="Top Fornitori" 
            icon={Users}
            color="#10B981"
            data={execData.bestSuppliers}
            valueKey="rating"
            valueFormat="rating"
          />

          {/* Best Teams */}
          <RankingCard 
            title="Team Performance" 
            icon={Activity}
            color="#F58220"
            data={execData.bestTeams}
            valueKey="hours"
            valueFormat="number"
          />

        {/* Growth Opportunities */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#10B98115' }}>
              <Zap className="w-4 h-4" style={{ color: '#10B981' }} />
            </div>
            <h3 className="font-semibold text-gray-900">Opportunità di Crescita</h3>
          </div>
          <div className="space-y-3">
            {execData.growthOpportunities?.length > 0 ? (
              execData.growthOpportunities.map((opp, idx) => (
                <div key={idx} className="p-3 bg-green-50 border border-green-100 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-green-900">{opp.title}</p>
                      <p className="text-xs text-green-700 mt-1">{opp.description}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      opp.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                      opp.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {opp.priority}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-green-800 mt-2">Impatto: {opp.impact}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                {execData.hasRealData ? 'Nessuna opportunità identificata' : 'Aggiungi dati per vedere le opportunità'}
              </p>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Critical Margin Alerts - Real-time */}
      {criticalAlerts.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5 animate-pulse">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-100">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <h3 className="font-semibold text-red-900">Alert Margini Critici (Real-time)</h3>
            <span className="ml-auto text-xs font-semibold bg-red-200 text-red-800 px-2 py-1 rounded-full">
              {criticalAlerts.length} alert{criticalAlerts.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-2">
            {criticalAlerts.slice(-5).map((alert, idx) => (
              <div 
                key={idx} 
                onClick={() => navigate(`/projects/${alert.project_id}`)}
                className="flex items-center justify-between p-3 bg-white border border-red-100 rounded-lg cursor-pointer hover:bg-red-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-red-900">{alert.title}</p>
                  <p className="text-xs text-red-700 mt-0.5">
                    Margine: <span className="font-bold">{alert.margin.toFixed(1)}%</span> · 
                    Rilevato: {alert.timestamp.toLocaleTimeString('it-IT')}
                  </p>
                </div>
                <button className="text-xs font-semibold text-white bg-red-600 px-3 py-1.5 rounded-lg hover:bg-red-700">
                  Vedi Progetto
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk Indicators */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#EF444415' }}>
            <AlertTriangle className="w-4 h-4" style={{ color: '#EF4444' }} />
          </div>
          <h3 className="font-semibold text-gray-900">Indicatori di Rischio</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {execData.riskIndicators.map((risk, idx) => (
            <div key={idx} className="p-4 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-sm font-semibold text-red-900 mb-1">{risk.title}</p>
              <p className="text-xs text-red-700">{risk.description}</p>
              <span className={`inline-block mt-2 text-xs font-semibold px-2 py-1 rounded-full ${
                risk.severity === 'Critical' ? 'bg-red-200 text-red-800' :
                risk.severity === 'High' ? 'bg-orange-200 text-orange-800' :
                'bg-yellow-200 text-yellow-800'
              }`}>
                {risk.severity}
              </span>
            </div>
          ))}
          {execData.riskIndicators.length === 0 && (
            <div className="col-span-3 py-8 text-center">
              <CheckCircle className="w-12 h-12 mx-auto text-green-400 mb-2" />
              <p className="text-sm text-green-600 font-medium">Nessun rischio critico identificato</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={() => navigate('/intelligence')} className="p-4 bg-gradient-to-r from-[#0B2341] to-[#1147FF] rounded-xl text-white text-left hover:shadow-lg transition-shadow">
          <Brain className="w-6 h-6 mb-2" />
          <p className="font-semibold mb-0.5">Codex Intelligence</p>
          <p className="text-xs text-white/80">Dashboard completa AI</p>
        </button>
        <button onClick={() => navigate('/knowledge-base')} className="p-4 bg-gradient-to-r from-[#1147FF] to-[#F58220] rounded-xl text-white text-left hover:shadow-lg transition-shadow">
          <BookOpen className="w-6 h-6 mb-2" />
          <p className="font-semibold mb-0.5">Knowledge Base</p>
          <p className="text-xs text-white/80">Lessons learned</p>
        </button>
        <button onClick={() => navigate('/ai-advisor')} className="p-4 bg-gradient-to-r from-[#F58220] to-[#10B981] rounded-xl text-white text-left hover:shadow-lg transition-shadow">
          <Bot className="w-6 h-6 mb-2" />
          <p className="font-semibold mb-0.5">AI Advisor</p>
          <p className="text-xs text-white/80">Chiedi insights</p>
        </button>
      </div>

      {/* Alert Settings Modal */}
      {showAlertSettings && (
        <AlertSettings onClose={() => setShowAlertSettings(false)} />
      )}
    </div>
  );
}

function TrendCard({ title, icon: Icon, color, data, format }) {
  const maxValue = Math.max(...data, 1);
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="flex items-end justify-between h-32 gap-2">
        {data.map((value, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center gap-1">
            <div 
              className="w-full rounded-t-lg transition-all hover:opacity-80"
              style={{ 
                height: `${(value / maxValue) * 100}%`,
                backgroundColor: color,
                minHeight: value > 0 ? '8px' : '0'
              }}
            />
            <span className="text-xs text-gray-500">{['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu'][idx]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankingCard({ title, icon: Icon, color, data, valueKey, valueFormat }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="space-y-3">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                idx === 1 ? 'bg-gray-100 text-gray-700' :
                idx === 2 ? 'bg-orange-100 text-orange-700' :
                'bg-gray-50 text-gray-500'
              }`}>
                {idx + 1}
              </div>
              <span className="text-sm font-medium text-gray-900">{item.name}</span>
            </div>
            <span className="text-sm font-bold" style={{ color }}>
              {valueFormat === 'currency' ? `€${item[valueKey]?.toLocaleString('it-IT')}` :
               valueFormat === 'rating' ? `${item[valueKey]} ⭐` :
               item[valueKey]}
            </span>
          </div>
        ))}
        {data.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">Nessun dato disponibile</p>
        )}
      </div>
    </div>
  );
}

function EmptyStateButton({ icon: Icon, title, description, onClick }) {
  return (
    <button
      onClick={onClick}
      className="p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors text-left"
    >
      <Icon className="w-6 h-6 text-gray-400 mb-2" />
      <p className="text-sm font-semibold text-gray-900 mb-1">{title}</p>
      <p className="text-xs text-gray-500">{description}</p>
    </button>
  );
}