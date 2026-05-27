import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Brain, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Lightbulb,
  Activity, Sparkles, Loader2, BarChart3, Award, Target, Users, Package,
  Eye, RefreshCw, Filter, ChevronRight, Clock, DollarSign, Zap,
  AlertTriangle, XCircle, ArrowUpRight, ArrowDownRight, Minus,
  BookOpen, PieChart
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const INSIGHT_TYPE_CONFIG = {
  Profitability:         { icon: DollarSign,     color: '#10B981', bg: 'bg-emerald-50',  border: 'border-emerald-200', label: 'Redditività' },
  Pricing:               { icon: Target,          color: '#1147FF', bg: 'bg-blue-50',     border: 'border-blue-200',    label: 'Pricing' },
  'Team Performance':    { icon: Users,           color: '#8B5CF6', bg: 'bg-purple-50',  border: 'border-purple-200',  label: 'Team' },
  'Supplier Performance':{ icon: Package,         color: '#F59E0B', bg: 'bg-amber-50',   border: 'border-amber-200',   label: 'Fornitori' },
  'Project Health':      { icon: Activity,        color: '#EF4444', bg: 'bg-red-50',     border: 'border-red-200',     label: 'Salute Progetto' },
  Trend:                 { icon: TrendingUp,      color: '#06B6D4', bg: 'bg-cyan-50',    border: 'border-cyan-200',    label: 'Trend' },
  Risk:                  { icon: AlertTriangle,   color: '#F97316', bg: 'bg-orange-50',  border: 'border-orange-200',  label: 'Rischio' },
  Opportunity:           { icon: Sparkles,        color: '#10B981', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Opportunità' },
};

const SEVERITY_STYLE = {
  Critical: 'bg-red-100 text-red-700 border-red-200',
  High:     'bg-orange-100 text-orange-700 border-orange-200',
  Medium:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  Low:      'bg-green-100 text-green-700 border-green-200',
};

const SEVERITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };

// ── Compute local insights from raw data ─────────────────────────────────────
function computeLocalInsights(projects, costs, suppliers, timesheets, learnings, tickets) {
  const insights = [];
  const now = Date.now();
  const ago90 = now - 90 * 86400000;

  // 1. Margin anomalies
  const completed = projects.filter(p => p.status === 'Delivered');
  const lowMargin = completed.filter(p => (p.gross_margin_pct || 0) < 20);
  if (lowMargin.length > 0) {
    insights.push({
      id: `local_margin_low`,
      insight_type: 'Profitability',
      severity: 'High',
      title: `${lowMargin.length} progetti con margine sotto il 20%`,
      description: `I progetti ${lowMargin.map(p => p.title).slice(0, 3).join(', ')} mostrano margini critici. Questo impatta la sostenibilità aziendale.`,
      recommendation: 'Rivedi la struttura dei costi e aggiorna il pricing per tipologie simili.',
      is_read: false,
      created_date: new Date().toISOString(),
      source: 'computed',
    });
  }

  // 2. Delayed projects
  const active = projects.filter(p => ['In Progress', 'Testing'].includes(p.status));
  const delayed = active.filter(p => p.expected_end_date && new Date(p.expected_end_date) < new Date());
  if (delayed.length > 0) {
    insights.push({
      id: `local_delayed`,
      insight_type: 'Project Health',
      severity: delayed.length >= 3 ? 'Critical' : 'High',
      title: `${delayed.length} progetti in ritardo sulla scadenza`,
      description: `${delayed.map(p => p.title).slice(0, 3).join(', ')} hanno superato la data di fine prevista.`,
      recommendation: 'Organizza una revisione urgente delle tempistiche e aggiorna i clienti.',
      is_read: false,
      created_date: new Date().toISOString(),
      source: 'computed',
    });
  }

  // 3. Profitable project types
  const byType = {};
  completed.forEach(p => {
    const t = p.estimate_type || 'Generico';
    if (!byType[t]) byType[t] = [];
    byType[t].push(p.gross_margin_pct || 0);
  });
  const typeRanking = Object.entries(byType)
    .map(([type, margins]) => ({ type, avg: margins.reduce((a, b) => a + b, 0) / margins.length, count: margins.length }))
    .sort((a, b) => b.avg - a.avg);
  if (typeRanking.length >= 2) {
    const best = typeRanking[0];
    const worst = typeRanking[typeRanking.length - 1];
    insights.push({
      id: `local_type_profitability`,
      insight_type: 'Pricing',
      severity: 'Low',
      title: `Tipo più redditizio: ${best.type} (${best.avg.toFixed(1)}%)`,
      description: `${best.type} genera il margine medio più alto (${best.avg.toFixed(1)}%) su ${best.count} progetti. ${worst.type} è il meno redditizio (${worst.avg.toFixed(1)}%).`,
      recommendation: `Prioritizza la pipeline ${best.type} e rivedi il pricing per ${worst.type}.`,
      is_read: false,
      created_date: new Date().toISOString(),
      source: 'computed',
    });
  }

  // 4. Supplier issues
  const lowRatedSuppliers = suppliers.filter(s => s.rating && s.rating < 3);
  if (lowRatedSuppliers.length > 0) {
    insights.push({
      id: `local_suppliers`,
      insight_type: 'Supplier Performance',
      severity: 'Medium',
      title: `${lowRatedSuppliers.length} fornitori con rating sotto 3 stelle`,
      description: `${lowRatedSuppliers.map(s => s.name).join(', ')} hanno performance insufficiente. Rischio ritardi e qualità.`,
      recommendation: 'Valuta sostituzione fornitori critici e aggiorna le valutazioni dopo ogni commessa.',
      is_read: false,
      created_date: new Date().toISOString(),
      source: 'computed',
    });
  }

  // 5. Productivity patterns (timesheets)
  if (timesheets.length > 0) {
    const recentSheets = timesheets.filter(t => new Date(t.date || 0) > new Date(ago90));
    const totalHours = recentSheets.reduce((s, t) => s + (t.hours || 0), 0);
    const avgHoursPerDay = totalHours / 90;
    insights.push({
      id: `local_productivity`,
      insight_type: 'Team Performance',
      severity: 'Low',
      title: `Media ${avgHoursPerDay.toFixed(1)} ore/giorno negli ultimi 90gg`,
      description: `Il team ha registrato ${totalHours.toFixed(0)} ore produttive in 90 giorni su ${recentSheets.length} timesheets.`,
      recommendation: avgHoursPerDay < 4 ? 'Aumenta la frequenza di registrazione ore per una visibilità accurata dei costi.' : 'Buona copertura timesheet. Continua a monitorare.',
      is_read: false,
      created_date: new Date().toISOString(),
      source: 'computed',
    });
  }

  // 6. Recurring failures (tickets)
  const ticketsByType = {};
  tickets.forEach(t => {
    const type = t.issue_type || 'Other';
    ticketsByType[type] = (ticketsByType[type] || 0) + 1;
  });
  const topIssue = Object.entries(ticketsByType).sort((a, b) => b[1] - a[1])[0];
  if (topIssue && topIssue[1] >= 3) {
    insights.push({
      id: `local_recurring_failures`,
      insight_type: 'Risk',
      severity: topIssue[1] >= 5 ? 'High' : 'Medium',
      title: `Failure ricorrente: ${topIssue[0]} (${topIssue[1]} ticket)`,
      description: `Il tipo di problema "${topIssue[0]}" è il più frequente con ${topIssue[1]} ticket aperti o risolti.`,
      recommendation: 'Crea una procedura preventiva e aggiorna la Knowledge Base con la soluzione standard.',
      is_read: false,
      created_date: new Date().toISOString(),
      source: 'computed',
    });
  }

  // 7. Over-budget cost alerts
  const projectCostMap = {};
  costs.forEach(c => {
    projectCostMap[c.project_id] = (projectCostMap[c.project_id] || 0) + (c.total_cost || 0);
  });
  const overBudget = projects.filter(p => {
    const actual = projectCostMap[p.id] || 0;
    const budget = (p.material_costs || 0) + (p.labor_costs || 0) + (p.other_costs || 0);
    return budget > 0 && actual > budget * 1.1;
  });
  if (overBudget.length > 0) {
    insights.push({
      id: `local_overbudget`,
      insight_type: 'Profitability',
      severity: 'High',
      title: `${overBudget.length} progetti oltre il budget >10%`,
      description: `${overBudget.map(p => p.title).slice(0, 3).join(', ')} hanno costi reali superiori al budget stimato.`,
      recommendation: 'Analizza le cause di sforamento e aggiorna le stime per progetti futuri simili.',
      is_read: false,
      created_date: new Date().toISOString(),
      source: 'computed',
    });
  }

  // 8. Opportunity: learnings not captured
  const completedWithoutLearning = completed.filter(p =>
    !learnings.some(l => l.project_id === p.id)
  );
  if (completedWithoutLearning.length > 0) {
    insights.push({
      id: `local_missing_learnings`,
      insight_type: 'Opportunity',
      severity: 'Low',
      title: `${completedWithoutLearning.length} progetti senza lessons learned`,
      description: `${completedWithoutLearning.length} progetti completati non hanno ancora un report di lessons learned associato.`,
      recommendation: 'Compila le lessons learned entro 7 giorni dalla chiusura per massimizzare il valore della Knowledge Base.',
      is_read: false,
      created_date: new Date().toISOString(),
      source: 'computed',
    });
  }

  return insights.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

// ── Insight Card ──────────────────────────────────────────────────────────────
function InsightCard({ insight, onMarkRead }) {
  const cfg = INSIGHT_TYPE_CONFIG[insight.insight_type] || INSIGHT_TYPE_CONFIG['Trend'];
  const Icon = cfg.icon;
  const TrendIcon = insight.metrics?.trend === 'up' ? ArrowUpRight
    : insight.metrics?.trend === 'down' ? ArrowDownRight : Minus;

  return (
    <div className={`bg-white rounded-2xl border p-5 transition-all hover:shadow-md ${
      insight.is_read ? 'opacity-70 border-gray-100' : `border-gray-200 shadow-sm`
    }`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg} border ${cfg.border}`}>
          <Icon className="w-5 h-5" style={{ color: cfg.color }} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-gray-900 text-sm leading-snug flex-1">{insight.title}</h3>
            {!insight.is_read && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />}
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${SEVERITY_STYLE[insight.severity]}`}>
              {insight.severity}
            </span>
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
              {cfg.label}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 mb-3 leading-relaxed">{insight.description}</p>

          {/* Metrics */}
          {insight.metrics?.value !== undefined && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg font-bold text-gray-900">{insight.metrics.value}</span>
              <div className={`flex items-center gap-0.5 text-xs font-medium ${
                insight.metrics.trend === 'up' ? 'text-green-600' :
                insight.metrics.trend === 'down' ? 'text-red-600' : 'text-gray-400'
              }`}>
                <TrendIcon className="w-3.5 h-3.5" />
                {insight.metrics.change_pct !== undefined && `${insight.metrics.change_pct > 0 ? '+' : ''}${insight.metrics.change_pct.toFixed(1)}%`}
              </div>
            </div>
          )}

          {/* Recommendation */}
          {insight.recommendation && (
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 mb-3">
              <Lightbulb className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 font-medium leading-relaxed">{insight.recommendation}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {insight.created_date ? new Date(insight.created_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) : ''}
            </span>
            {insight.source === 'computed' && (
              <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">Calcolato in tempo reale</span>
            )}
            {!insight.is_read && insight.id && !insight.id.startsWith('local_') && (
              <button onClick={() => onMarkRead(insight.id)}
                className="ml-auto text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
                <Eye className="w-3 h-3" /> Segna come letto
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CodexIntelligence() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [aiInsights, setAiInsights] = useState([]);
  const [localInsights, setLocalInsights] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeSeverity, setActiveSeverity] = useState('all');
  const [metrics, setMetrics] = useState({});
  const [lastGenerated, setLastGenerated] = useState(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    
    // Get user filters for tenant isolation
    const filtersRes = await base44.functions.invoke('getUserFilters', {});
    const company_id = filtersRes.data.filters?.Project?.company_id || filtersRes.data.filters?.company_id;
    
    if (!company_id) {
      toast.error('Nessun tenant attivo - impossibile caricare Intelligence');
      setLoading(false);
      return;
    }

    // Load ONLY tenant-filtered data
    const [projects, costs, suppliers, timesheets, learnings, tickets, storedInsights, knowledge] = await Promise.all([
      base44.entities.Project.filter({ company_id }, '-updated_date', 50),
      base44.entities.ProjectCost.filter({ company_id }, '-date', 100),
      base44.entities.Supplier.filter({ company_id }),
      base44.entities.Timesheet.filter({ company_id }, '-date', 100),
      base44.entities.ProjectLearning.filter({ company_id }, '-created_date', 50),
      base44.entities.SupportTicket.filter({ company_id }, '-created_date', 100),
      base44.entities.IntelligenceInsight.filter({ company_id }, '-created_date', 30),
      base44.entities.KnowledgeBase.filter({ company_id }),
    ]);

    // Compute local insights from REAL tenant data only
    const computed = computeLocalInsights(projects, costs, suppliers, timesheets, learnings, tickets);
    setLocalInsights(computed);

    // AI-generated insights from DB (tenant-filtered)
    setAiInsights(storedInsights);
    if (storedInsights.length > 0) setLastGenerated(storedInsights[0].created_date);

    // Compute KPI metrics
    const completed = projects.filter(p => p.status === 'Delivered');
    const avgMargin = completed.length
      ? completed.reduce((s, p) => s + (p.gross_margin_pct || 0), 0) / completed.length
      : 0;
    const delayed = projects.filter(p =>
      ['In Progress', 'Testing'].includes(p.status) &&
      p.expected_end_date && new Date(p.expected_end_date) < new Date()
    );
    const unreadAI = storedInsights.filter(i => !i.is_read).length;

    setMetrics({
      totalProjects: projects.length,
      completed: completed.length,
      avgMargin: avgMargin.toFixed(1),
      delayed: delayed.length,
      openTickets: tickets.filter(t => t.status === 'Open').length,
      kbArticles: knowledge.length,
      unreadInsights: unreadAI + computed.length,
      suppliersCount: suppliers.length,
    });
    setLoading(false);
  };

  const generateAIInsights = async () => {
    setGenerating(true);
    try {
      const result = await base44.functions.invoke('generateIntelligenceInsights', {});
      
      // Check if sufficient data exists
      if (result.data.data_maturity && result.data.data_maturity.level < 2) {
        toast.info(result.data.recommendation || 'Dati insufficienti per generare insights AI');
        setGenerating(false);
        return;
      }
      
      // Get fresh insights with tenant filter
      const filtersRes = await base44.functions.invoke('getUserFilters', {});
      const company_id = filtersRes.data.filters?.Project?.company_id;
      const fresh = await base44.entities.IntelligenceInsight.filter(
        { company_id },
        '-created_date',
        30
      );
      setAiInsights(fresh);
      if (fresh.length > 0) setLastGenerated(fresh[0].created_date);
      toast.success(`${fresh.length} insights generati con successo`);
    } catch (error) {
      toast.error('Errore nella generazione insights: ' + error.message);
    }
    setGenerating(false);
  };

  const markRead = async (id) => {
    await base44.entities.IntelligenceInsight.update(id, { is_read: true });
    setAiInsights(prev => prev.map(i => i.id === id ? { ...i, is_read: true } : i));
  };

  // Combine and filter
  const allInsights = [
    ...localInsights,
    ...aiInsights.map(i => ({ ...i, source: i.source || 'ai' })),
  ];

  const filtered = allInsights.filter(i => {
    if (activeFilter !== 'all' && i.insight_type !== activeFilter) return false;
    if (activeSeverity !== 'all' && i.severity !== activeSeverity) return false;
    return true;
  });

  const unreadCount = allInsights.filter(i => !i.is_read).length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  );

  const FILTER_TYPES = ['all', ...Object.keys(INSIGHT_TYPE_CONFIG)];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm"
            style={{ background: 'linear-gradient(135deg, #0B2341 0%, #1147FF 100%)' }}>
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Codex Intelligence</h1>
            <p className="text-sm text-gray-500">
              {unreadCount > 0
                ? <span className="text-blue-600 font-medium">{unreadCount} nuovi insight disponibili</span>
                : 'AI Insights Engine — analisi operativa automatica'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastGenerated && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Ultimo: {new Date(lastGenerated).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button onClick={loadAll} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={generateAIInsights} disabled={generating}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90 disabled:opacity-60 shadow-sm"
            style={{ background: 'linear-gradient(135deg, #1147FF 0%, #0B2341 100%)' }}>
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generating ? 'Generando...' : 'Genera AI Insights'}
          </button>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Progetti', value: metrics.totalProjects, icon: BarChart3, color: '#1147FF' },
          { label: 'Completati', value: metrics.completed, icon: CheckCircle2, color: '#10B981' },
          { label: 'Margine Medio', value: `${metrics.avgMargin}%`, icon: PieChart, color: parseFloat(metrics.avgMargin) >= 30 ? '#10B981' : parseFloat(metrics.avgMargin) >= 20 ? '#F59E0B' : '#EF4444' },
          { label: 'In Ritardo', value: metrics.delayed, icon: AlertTriangle, color: metrics.delayed > 0 ? '#EF4444' : '#10B981' },
          { label: 'Ticket Aperti', value: metrics.openTickets, icon: AlertCircle, color: metrics.openTickets > 5 ? '#F97316' : '#10B981' },
          { label: 'Fornitori', value: metrics.suppliersCount, icon: Package, color: '#8B5CF6' },
          { label: 'Knowledge Base', value: metrics.kbArticles, icon: BookOpen, color: '#06B6D4' },
          { label: 'Insights Nuovi', value: unreadCount, icon: Lightbulb, color: unreadCount > 0 ? '#1147FF' : '#10B981' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-3 flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <kpi.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: kpi.color }} />
              <span className="text-xs text-gray-500 truncate">{kpi.label}</span>
            </div>
            <p className="text-lg font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* ── Generate banner (when no AI insights yet) ──────────────────────── */}
      {aiInsights.length === 0 && (
        <div className="rounded-2xl p-6 border-2 border-dashed border-blue-200 bg-blue-50 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-blue-900">AI Insights non ancora generati</h3>
            <p className="text-sm text-blue-700 mt-0.5">Clicca "Genera AI Insights" per far analizzare all'AI i tuoi dati operativi: margini, ritardi, fornitori, produttività e opportunità.</p>
          </div>
          <button onClick={generateAIInsights} disabled={generating}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #1147FF 0%, #0B2341 100%)' }}>
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Genera ora
          </button>
        </div>
      )}

      {/* ── Filters ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 items-center">
        <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <div className="flex gap-1.5 flex-wrap">
          {['all', 'Critical', 'High', 'Medium', 'Low'].map(s => (
            <button key={s} onClick={() => setActiveSeverity(s)}
              className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all ${
                activeSeverity === s
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}>
              {s === 'all' ? 'Tutti' : s}
            </button>
          ))}
        </div>
        <div className="w-px h-4 bg-gray-200 mx-1" />
        <div className="flex gap-1.5 flex-wrap">
          {Object.entries(INSIGHT_TYPE_CONFIG).map(([type, cfg]) => (
            <button key={type} onClick={() => setActiveFilter(activeFilter === type ? 'all' : type)}
              className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all ${
                activeFilter === type
                  ? 'text-white border-transparent'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
              style={activeFilter === type ? { backgroundColor: cfg.color, borderColor: cfg.color } : {}}>
              {cfg.label}
            </button>
          ))}
        </div>
        {filtered.length !== allInsights.length && (
          <span className="text-xs text-gray-400 ml-auto">{filtered.length} di {allInsights.length} insights</span>
        )}
      </div>

      {/* ── Insights Grid ────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
          <p className="font-semibold text-gray-600">Nessun insight per i filtri selezionati</p>
          <p className="text-sm text-gray-400 mt-1">Prova a cambiare i filtri o genera nuovi insights</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((insight, idx) => (
            <InsightCard key={insight.id || idx} insight={insight} onMarkRead={markRead} />
          ))}
        </div>
      )}

      {/* ── CTA to AI Chat ────────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-6 text-white flex items-center justify-between gap-4"
        style={{ background: 'linear-gradient(135deg, #0B2341 0%, #1147FF 100%)' }}>
        <div>
          <h2 className="text-lg font-bold mb-1 flex items-center gap-2"><Zap className="w-5 h-5" /> Approfondisci con Codex AI</h2>
          <p className="text-sm text-white/80">Chiedi a Codex AI di analizzare in dettaglio questi insight, proporre soluzioni o generare report.</p>
        </div>
        <button onClick={() => navigate('/ai')}
          className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-white text-[#0B2341] hover:bg-white/90 transition-colors flex items-center gap-2 flex-shrink-0">
          Apri Codex AI <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}