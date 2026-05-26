import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, DollarSign, Users, Award, AlertTriangle, BarChart3, PieChart, Activity, Target, Zap, Crown, Brain, BookOpen, CheckCircle, Bot } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ExecutiveInsights() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [execData, setExecData] = useState({
    revenueTrend: [],
    marginTrend: [],
    bestCustomers: [],
    worstCustomers: [],
    bestSuppliers: [],
    bestTeams: [],
    growthOpportunities: [],
    riskIndicators: [],
    knowledgeScore: 0,
  });

  useEffect(() => {
    loadExecutiveData();
  }, []);

  const loadExecutiveData = async () => {
    const [projects, costs, clients, suppliers, timesheets, guardians, knowledgeBase, projectLearning] = await Promise.all([
      base44.entities.Project.list(),
      base44.entities.ProjectCost.list(),
      base44.entities.Client.list(),
      base44.entities.Supplier.list(),
      base44.entities.Timesheet.list(),
      base44.entities.GuardianSubscription.list(),
      base44.entities.KnowledgeBase.list(),
      base44.entities.ProjectLearning.list(),
    ]);

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

    setExecData({
      revenueTrend: revenueByMonth,
      marginTrend: marginByMonth,
      bestCustomers: clientList.slice(0, 5),
      worstCustomers: clientList.slice(-3).reverse(),
      bestSuppliers: supplierRanking,
      bestTeams: teamRanking,
      growthOpportunities: opportunities,
      riskIndicators: risks,
      knowledgeScore,
    });

    setLoading(false);
  };

  if (loading) return <div className="p-6 text-center text-gray-400">Caricamento Executive Insights...</div>;

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
            <p className="text-sm text-gray-500">Panoramica strategica per Stefano Desiato</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 font-medium">Knowledge Score</p>
          <p className={`text-2xl font-bold ${execData.knowledgeScore >= 75 ? 'text-green-600' : execData.knowledgeScore >= 50 ? 'text-orange-600' : 'text-red-600'}`}>
            {execData.knowledgeScore}/100
          </p>
        </div>
      </div>

      {/* Revenue & Margin Trends */}
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

      {/* Rankings */}
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
            {execData.growthOpportunities.map((opp, idx) => (
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
            ))}
            {execData.growthOpportunities.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Nessuna opportunità identificata</p>
            )}
          </div>
        </div>
      </div>

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
    </div>
  );
}

function TrendCard({ title, icon: IconComponent, color, data, format }) {
  const maxValue = Math.max(...data, 1);
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <IconComponent className="w-4 h-4" style={{ color }} />
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

function RankingCard({ title, icon: IconComponent, color, data, valueKey, valueFormat }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <IconComponent className="w-4 h-4" style={{ color }} />
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