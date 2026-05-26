import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, DollarSign, Users, AlertCircle, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function CEODashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState({
    monthlyRevenue: 0,
    monthlyCollections: 0,
    monthlyGrossMargin: 0,
    monthlyNetMargin: 0,
    projectsInProgress: 0,
    projectsDelayed: 0,
    projectsBelowMargin: 0,
    bestProject: null,
    worstProject: null,
    averageMargin: 0,
    backlogValue: 0,
    pipelineValue: 0,
    guardianMRR: 0,
    guardianARR: 0,
  });
  const [cashFlow, setCashFlow] = useState({
    days30: { incoming: 0, outgoing: 0, net: 0 },
    days60: { incoming: 0, outgoing: 0, net: 0 },
    days90: { incoming: 0, outgoing: 0, net: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [projects, estimates, guardians, costs] = await Promise.all([
        base44.entities.Project.list(),
        base44.entities.Estimate.list(),
        base44.entities.GuardianSubscription.filter({ status: 'Active' }),
        base44.entities.ProjectCost.list(),
      ]);

      // Monthly calculations (current month)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const monthlyRevenue = projects
        .filter(p => p.start_date && new Date(p.start_date).getMonth() === currentMonth)
        .reduce((sum, p) => sum + (p.contract_value || 0), 0);
      
      const monthlyCollections = projects
        .filter(p => p.payment_collected)
        .reduce((sum, p) => sum + (p.payment_collected || 0), 0);

      // Project stats
      const projectsInProgress = projects.filter(p => p.status === 'In Progress').length;
      
      // Calculate margins for each project
      const projectsWithMargin = projects.map(p => {
        const projectCosts = costs.filter(c => c.project_id === p.id).reduce((sum, c) => sum + (c.total_cost || 0), 0);
        const margin = (p.contract_value || 0) - projectCosts;
        const marginPct = (p.contract_value || 0) > 0 ? ((margin / p.contract_value) * 100) : 0;
        return { ...p, margin, marginPct };
      });

      const projectsBelowMargin = projectsWithMargin.filter(p => p.marginPct < 25).length;
      const averageMargin = projectsWithMargin.length > 0 
        ? projectsWithMargin.reduce((sum, p) => sum + p.marginPct, 0) / projectsWithMargin.length 
        : 0;

      // Best and worst projects
      const sortedByMargin = [...projectsWithMargin].sort((a, b) => b.marginPct - a.marginPct);
      const bestProject = sortedByMargin[0];
      const worstProject = sortedByMargin[sortedByMargin.length - 1];

      // Guardian MRR/ARR
      const guardianMRR = guardians.reduce((sum, g) => sum + (g.monthly_price || 0), 0);
      const guardianARR = guardianMRR * 12;

      // Pipeline (estimates not converted)
      const pipelineValue = estimates
        .filter(e => e.status === 'Sent' || e.status === 'Draft')
        .reduce((sum, e) => sum + (e.revenue || 0), 0);

      // Backlog (approved but not delivered)
      const backlogValue = projects
        .filter(p => p.status === 'Approved' || p.status === 'In Progress')
        .reduce((sum, p) => sum + (p.contract_value || 0), 0);

      setData({
        monthlyRevenue,
        monthlyCollections,
        monthlyGrossMargin: monthlyRevenue * 0.35, // Simplified
        monthlyNetMargin: monthlyRevenue * 0.25,
        projectsInProgress,
        projectsDelayed: 0,
        projectsBelowMargin,
        bestProject,
        worstProject,
        averageMargin: averageMargin.toFixed(1),
        backlogValue,
        pipelineValue,
        guardianMRR,
        guardianARR,
      });

      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="p-6 text-center text-gray-400">Caricamento...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CEO Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Panoramica finanziaria - Stefano Desiato</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Data</p>
          <p className="text-sm font-semibold text-gray-900">{new Date().toLocaleDateString('it-IT')}</p>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Ricavi Mensili" value={`€${data.monthlyRevenue.toLocaleString('it-IT')}`} icon={DollarSign} color="#1147FF" trend="+12%" />
        <KpiCard label="Incassi Mensili" value={`€${data.monthlyCollections.toLocaleString('it-IT')}`} icon={TrendingUp} color="#10B981" trend="+8%" />
        <KpiCard label="Margine Lordo" value={`€${data.monthlyGrossMargin.toLocaleString('it-IT')}`} icon={BarChart3} color="#F58220" trend="+5%" />
        <KpiCard label="Margine Netto" value={`€${data.monthlyNetMargin.toLocaleString('it-IT')}`} icon={BarChart3} color="#0B2341" trend="+3%" />
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Progetti in Corso" value={data.projectsInProgress} icon={Calendar} color="#1147FF" />
        <KpiCard label="Progetti in Ritardo" value={data.projectsDelayed} icon={AlertCircle} color="#EF4444" />
        <KpiCard label="Sotto Margine Target" value={data.projectsBelowMargin} icon={AlertCircle} color="#F59E0B" />
        <KpiCard label="Margine Medio" value={`${data.averageMargin}%`} icon={TrendingUp} color={parseFloat(data.averageMargin) >= 35 ? '#10B981' : '#F59E0B'} />
      </div>

      {/* Best/Worst Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.bestProject && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight className="w-5 h-5 text-green-600" />
              <h2 className="text-sm font-semibold text-green-900">Miglior Progetto</h2>
            </div>
            <p className="text-lg font-bold text-green-900">{data.bestProject.title}</p>
            <p className="text-sm text-green-700 mt-1">Margine: {data.bestProject.marginPct.toFixed(1)}% (€{data.bestProject.margin.toLocaleString('it-IT')})</p>
          </div>
        )}
        {data.worstProject && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownRight className="w-5 h-5 text-red-600" />
              <h2 className="text-sm font-semibold text-red-900">Progetto Critico</h2>
            </div>
            <p className="text-lg font-bold text-red-900">{data.worstProject.title}</p>
            <p className="text-sm text-red-700 mt-1">Margine: {data.worstProject.marginPct.toFixed(1)}% (€{data.worstProject.margin.toLocaleString('it-IT')})</p>
          </div>
        )}
      </div>

      {/* Financial Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">Backlog</p>
          <p className="text-2xl font-bold text-blue-600">€{data.backlogValue.toLocaleString('it-IT')}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">Pipeline</p>
          <p className="text-2xl font-bold text-orange-600">€{data.pipelineValue.toLocaleString('it-IT')}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">Guardian MRR / ARR</p>
          <p className="text-xl font-bold text-green-600">€{data.guardianMRR.toLocaleString('it-IT')}<span className="text-sm text-gray-400">/mese</span></p>
          <p className="text-xs text-gray-400">€{data.guardianARR.toLocaleString('it-IT')}/anno</p>
        </div>
      </div>

      {/* Cash Flow Forecast */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Cash Flow Forecast</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-2">30 Giorni</p>
            <div className="space-y-1 text-sm">
              <p className="text-green-600">+€0</p>
              <p className="text-red-600">-€0</p>
              <p className="font-bold text-gray-900">Net: €0</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2">60 Giorni</p>
            <div className="space-y-1 text-sm">
              <p className="text-green-600">+€0</p>
              <p className="text-red-600">-€0</p>
              <p className="font-bold text-gray-900">Net: €0</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2">90 Giorni</p>
            <div className="space-y-1 text-sm">
              <p className="text-green-600">+€0</p>
              <p className="text-red-600">-€0</p>
              <p className="font-bold text-gray-900">Net: €0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, color, trend }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color }} />
          <span className="text-xs text-gray-500 font-medium">{label}</span>
        </div>
        {trend && (
          <span className={`text-xs font-semibold ${trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold" style={{ color }}>{typeof value === 'number' ? value.toLocaleString('it-IT') : value}</p>
    </div>
  );
}