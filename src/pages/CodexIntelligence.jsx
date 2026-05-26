import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, TrendingUp, TrendingDown, DollarSign, Users, Package, BookOpen, AlertCircle, CheckCircle, Target, Zap, Award, Lightbulb, BarChart3, PieChart, Activity } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function CodexIntelligence() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState([]);
  const [knowledgeScore, setKnowledgeScore] = useState(0);
  const [metrics, setMetrics] = useState({
    totalProjects: 0,
    avgMargin: 0,
    bestProjectType: '',
    worstProjectType: '',
    topSupplier: '',
    topPerformer: '',
    knowledgeBaseCount: 0,
    lessonsLearnedCount: 0,
  });

  useEffect(() => {
    loadIntelligence();
  }, []);

  const loadIntelligence = async () => {
    const [projects, knowledgeBase, projectLearning, suppliers, timesheets, costs] = await Promise.all([
      base44.entities.Project.list(),
      base44.entities.KnowledgeBase.list(),
      base44.entities.ProjectLearning.list(),
      base44.entities.Supplier.list(),
      base44.entities.Timesheet.list(),
      base44.entities.ProjectCost.list(),
    ]);

    // Calculate metrics
    const completedProjects = projects.filter(p => p.status === 'Delivered');
    const totalProjects = projects.length;
    const avgMargin = completedProjects.length > 0 
      ? completedProjects.reduce((sum, p) => sum + (p.gross_margin_pct || 0), 0) / completedProjects.length 
      : 0;

    // Best/Worst project types
    const byType = {};
    completedProjects.forEach(p => {
      const type = p.estimate_type || 'Generic';
      if (!byType[type]) byType[type] = [];
      byType[type].push(p.gross_margin_pct || 0);
    });

    let bestType = '', worstType = '', bestAvg = -100, worstAvg = 100;
    Object.entries(byType).forEach(([type, margins]) => {
      const avg = margins.reduce((a, b) => a + b, 0) / margins.length;
      if (avg > bestAvg) { bestAvg = avg; bestType = type; }
      if (avg < worstAvg) { worstAvg = avg; worstType = type; }
    });

    // Knowledge Score calculation
    const documentedProjects = completedProjects.filter(p => p.notes || p.photos_after?.length > 0).length;
    const lessonsLearned = projectLearning.filter(pl => pl.what_went_well || pl.improvements).length;
    const homePassports = projects.filter(p => p.status === 'Delivered' && p.photos_after?.length > 0).length;
    
    const maxScore = Math.max(1, totalProjects * 4); // 4 components: docs, lessons, passports, SOP
    const score = Math.round(((documentedProjects + lessonsLearned + homePassports + knowledgeBase.length) / maxScore) * 100);
    setKnowledgeScore(Math.min(100, score));

    // Generate insights
    const generatedInsights = generateInsights(projects, completedProjects, costs, suppliers, timesheets, knowledgeBase, projectLearning);
    setInsights(generatedInsights.slice(0, 8));

    setMetrics({
      totalProjects,
      avgMargin: avgMargin.toFixed(1),
      bestProjectType: bestType || '—',
      worstProjectType: worstType || '—',
      topSupplier: suppliers.length > 0 ? suppliers.sort((a, b) => (b.rating || 0) - (a.rating || 0))[0].name : '—',
      topPerformer: '—', // Would need employee data
      knowledgeBaseCount: knowledgeBase.length,
      lessonsLearnedCount: lessonsLearned,
    });

    setLoading(false);
  };

  const generateInsights = (allProjects, completed, costs, suppliers, timesheets, knowledgeBase, projectLearning) => {
    const insights = [];

    // Profitability Insights
    if (completed.length > 0) {
      const highMargin = completed.filter(p => (p.gross_margin_pct || 0) >= 35).length;
      const lowMargin = completed.filter(p => (p.gross_margin_pct || 0) < 25).length;
      
      if (highMargin > lowMargin) {
        insights.push({
          type: 'Profitability',
          title: 'Performance Margin Eccellente',
          description: `${highMargin} progetti su ${completed.length} hanno superato il 35% di margine.`,
          recommendation: 'Continua a focalizzarti su progetti simili a quelli ad alto margine.',
          severity: 'Low',
          trend: 'up',
          icon: TrendingUp,
          color: '#10B981',
        });
      }

      if (lowMargin > 0) {
        insights.push({
          type: 'Risk',
          title: 'Attenzione: Progetti a Basso Margine',
          description: `${lowMargin} progetti hanno margine inferiore al 25%.`,
          recommendation: 'Rivedi la strategia di pricing per questa tipologia di progetti.',
          severity: 'Medium',
          trend: 'down',
          icon: AlertCircle,
          color: '#F59E0B',
        });
      }
    }

    // Pricing Intelligence
    const avgProjectValue = allProjects.length > 0 
      ? allProjects.reduce((sum, p) => sum + (p.contract_value || 0), 0) / allProjects.length 
      : 0;
    
    insights.push({
      type: 'Pricing',
      title: 'Valore Medio Progetto',
      description: `Il valore medio dei progetti è €${avgProjectValue.toLocaleString('it-IT')}.`,
      recommendation: 'Considera di aumentare il pricing per progetti sopra i 100mq.',
      severity: 'Low',
      trend: 'stable',
      icon: Target,
      color: '#1147FF',
    });

    // Supplier Intelligence
    if (suppliers.length > 0) {
      const topSuppliers = suppliers.filter(s => (s.rating || 0) >= 4.5);
      if (topSuppliers.length > 0) {
        insights.push({
          type: 'Supplier Performance',
          title: 'Fornitori Top Performer',
          description: `${topSuppliers.length} fornitori hanno rating ≥ 4.5 stelle.`,
          recommendation: `Prioritizza ${topSuppliers[0].name} per acquisti futuri.`,
          severity: 'Low',
          trend: 'up',
          icon: Award,
          color: '#10B981',
        });
      }
    }

    // Team Performance
    if (timesheets.length > 0) {
      const totalHours = timesheets.reduce((sum, t) => sum + (t.hours || 0), 0);
      insights.push({
        type: 'Team Performance',
        title: 'Ore Lavorate Totali',
        description: `Il team ha lavorato ${totalHours} ore su tutti i progetti.`,
        recommendation: 'Monitora la produttività per ottimizzare l\'allocazione risorse.',
        severity: 'Low',
        trend: 'stable',
        icon: Users,
        color: '#1147FF',
      });
    }

    // Knowledge Base
    if (knowledgeBase.length > 0) {
      insights.push({
        type: 'Opportunity',
        title: 'Knowledge Base Attiva',
        description: `${knowledgeBase.length} lezioni apprese documentate.`,
        recommendation: 'Incentiva il team a documentare ogni progetto completato.',
        severity: 'Low',
        trend: 'up',
        icon: BookOpen,
        color: '#10B981',
      });
    }

    // Project Health
    const activeProjects = allProjects.filter(p => ['In Progress', 'Testing'].includes(p.status));
    const atRisk = activeProjects.filter(p => (p.gross_margin_pct || 0) < 25);
    
    if (atRisk.length > 0) {
      insights.push({
        type: 'Project Health',
        title: 'Progetti a Rischio',
        description: `${atRisk.length} progetti attivi hanno margine critico (<25%).`,
        recommendation: 'Intervieni immediatamente per rivedere costi e tempistiche.',
        severity: 'High',
        trend: 'down',
        icon: AlertCircle,
        color: '#EF4444',
      });
    }

    // Trends
    const recentProjects = allProjects.filter(p => 
      p.created_date && new Date(p.created_date) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    );
    
    if (recentProjects.length > 0) {
      const recentAvgMargin = recentProjects.reduce((sum, p) => sum + (p.gross_margin_pct || 0), 0) / recentProjects.length;
      const previousAvgMargin = allProjects.filter(p => !recentProjects.includes(p)).reduce((sum, p) => sum + (p.gross_margin_pct || 0), 0) / (allProjects.length - recentProjects.length) || 0;
      
      const trend = recentAvgMargin > previousAvgMargin ? 'up' : recentAvgMargin < previousAvgMargin ? 'down' : 'stable';
      
      insights.push({
        type: 'Trend',
        title: 'Trend Margin Ultimi 90 Giorni',
        description: `Margine medio: ${recentAvgMargin.toFixed(1)}% (${trend === 'up' ? '+' : trend === 'down' ? '' : ''}${(recentAvgMargin - previousAvgMargin).toFixed(1)}% vs periodo precedente).`,
        recommendation: trend === 'up' 
          ? 'Mantieni la strategia corrente.' 
          : 'Analizza le cause del peggioramento e correggi il tiro.',
        severity: trend === 'down' ? 'Medium' : 'Low',
        trend,
        icon: Activity,
        color: trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#1147FF',
      });
    }

    return insights.sort((a, b) => {
      const severityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  };

  if (loading) return <div className="p-6 text-center text-gray-400">Caricamento Intelligence...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#0B2341' }}>
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Codex Intelligence</h1>
              <p className="text-sm text-gray-500 mt-0.5">Business Intelligence & AI Advisor</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-500 font-medium">Knowledge Score</p>
            <p className={`text-2xl font-bold ${knowledgeScore >= 75 ? 'text-green-600' : knowledgeScore >= 50 ? 'text-orange-600' : 'text-red-600'}`}>
              {knowledgeScore}/100
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <KpiCard label="Progetti Totali" value={metrics.totalProjects} icon={BarChart3} color="#1147FF" />
        <KpiCard label="Margine Medio" value={`${metrics.avgMargin}%`} icon={PieChart} color={parseFloat(metrics.avgMargin) >= 35 ? '#10B981' : parseFloat(metrics.avgMargin) >= 25 ? '#F59E0B' : '#EF4444'} />
        <KpiCard label="Tipo Migliore" value={metrics.bestProjectType} icon={Award} color="#10B981" small />
        <KpiCard label="Tipo Peggiore" value={metrics.worstProjectType} icon={AlertCircle} color="#EF4444" small />
        <KpiCard label="Knowledge Base" value={metrics.knowledgeBaseCount} icon={BookOpen} color="#1147FF" />
        <KpiCard label="Lessons Learned" value={metrics.lessonsLearnedCount} icon={Lightbulb} color="#F58220" />
      </div>

      {/* AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {insights.map((insight, idx) => (
          <InsightCard key={idx} insight={insight} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-[#0B2341] to-[#1147FF] rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold mb-1">AI Advisor</h2>
            <p className="text-sm text-white/80">Chiedi a Codex Intelligence insights su progetti, margini, fornitori e performance.</p>
          </div>
          <button onClick={() => navigate('/ai-advisor')} className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-white text-[#0B2341] hover:bg-white/90 transition-colors">
            Apri AI Advisor
          </button>
        </div>
      </div>

      {/* Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <NavCard 
          title="Knowledge Base" 
          description="Cerca lezioni apprese e best practices" 
          icon={BookOpen} 
          onClick={() => navigate('/knowledge-base')}
          color="#1147FF"
        />
        <NavCard 
          title="Project Learning" 
          description="Analisi progetti completati" 
          icon={Target} 
          onClick={() => navigate('/project-learning')}
          color="#10B981"
        />
        <NavCard 
          title="Executive Insights" 
          description="Report strategici per CEO" 
          icon={Zap} 
          onClick={() => navigate('/executive-insights')}
          color="#F58220"
        />
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, color, small = false }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <p className={`font-bold ${small ? 'text-base' : 'text-xl'}`} style={{ color }}>
        {typeof value === 'number' ? value.toLocaleString('it-IT') : value}
      </p>
    </div>
  );
}

function InsightCard({ insight }) {
  const Icon = insight.icon;
  const trendIcon = insight.trend === 'up' ? TrendingUp : insight.trend === 'down' ? TrendingDown : Activity;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${insight.color}15` }}>
            <Icon className="w-4 h-4" style={{ color: insight.color }} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{insight.title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{insight.type}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {trendIcon && <trendIcon className={`w-3.5 h-3.5 ${insight.trend === 'up' ? 'text-green-500' : insight.trend === 'down' ? 'text-red-500' : 'text-gray-400'}`} />}
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            insight.severity === 'Critical' ? 'bg-red-100 text-red-700' :
            insight.severity === 'High' ? 'bg-orange-100 text-orange-700' :
            insight.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
            'bg-green-100 text-green-700'
          }`}>
            {insight.severity}
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
      {insight.recommendation && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
          <Lightbulb className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800 font-medium">{insight.recommendation}</p>
        </div>
      )}
    </div>
  );
}

function NavCard({ title, description, icon: Icon, onClick, color }) {
  return (
    <div onClick={onClick} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all cursor-pointer group">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}