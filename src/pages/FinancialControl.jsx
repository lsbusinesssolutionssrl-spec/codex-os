import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, AlertCircle, CheckCircle2, DollarSign, Calendar, Users, BarChart3, FileText, Download, Package, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StatusBadge from '../components/StatusBadge';
import { hasRole } from '../lib/roleUtils';
import AIMeetingReportGenerator from '../components/ai/AIMeetingReportGenerator';

export default function FinancialControl() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [costs, setCosts] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalCosts: 0,
    totalMargin: 0,
    avgMarginPct: 0,
    projectsInProfit: 0,
    projectsInLoss: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    // SECURITY: Only admins can access financial control
    hasRole(['admin']).then(auth => {
      if (!auth) {
        navigate('/');
        return;
      }
      setIsAuthorized(true);
    });
  }, []);

  useEffect(() => {
    if (!isAuthorized) return;
    
    const load = async () => {
      try {
        const user = await base44.auth.me();
        const companyRes = await base44.functions.invoke('getCurrentCompany', {}).catch(() => ({ data: { company: null } }));
        const companyId = companyRes.data?.company?.id;

        const [projs, projectCosts, financialAlerts] = await Promise.all([
          base44.entities.Project.list(),
          base44.entities.ProjectCost.list(),
          base44.entities.FinancialAlert.filter({ resolved: false }).catch(() => []),
        ]);

        // Filter by company_id if available
        const filteredProjects = companyId ? projs.filter(p => p.company_id === companyId) : projs;
        const filteredCosts = companyId ? projectCosts.filter(c => c.company_id === companyId) : projectCosts;
        const filteredAlerts = companyId ? financialAlerts.filter(a => a.company_id === companyId) : financialAlerts;

        setProjects(filteredProjects);
        setCosts(filteredCosts);
        setAlerts(filteredAlerts);

        // Calculate stats
        const totalRevenue = filteredProjects.reduce((sum, p) => sum + (p.contract_value || 0), 0);
        const totalCosts = filteredCosts.reduce((sum, c) => sum + (c.total_cost || 0), 0);
        const totalMargin = totalRevenue - totalCosts;
        const avgMarginPct = totalRevenue > 0 ? ((totalMargin / totalRevenue) * 100) : 0;
        const projectsInProfit = filteredProjects.filter(p => {
          const pCosts = filteredCosts.filter(c => c.project_id === p.id).reduce((sum, c) => sum + (c.total_cost || 0), 0);
          return (p.contract_value || 0) > pCosts;
        }).length;

        setStats({
          totalRevenue,
          totalCosts,
          totalMargin,
          avgMarginPct: avgMarginPct.toFixed(1),
          projectsInProfit,
          projectsInLoss: filteredProjects.length - projectsInProfit,
        });
      } catch (error) {
        console.error('Error loading financial data:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (!isAuthorized) return null;
  if (loading) return <div className="p-6 text-center text-gray-400">Caricamento...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Controllo Finanziario Progetti</h1>
          <p className="text-sm text-gray-500 mt-0.5">Profitabilità in tempo reale</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowReportModal(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            <Sparkles className="w-3.5 h-3.5" /> Report AI
          </button>
          <button onClick={() => navigate('/cash-flow')} className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            <DollarSign className="w-3.5 h-3.5" /> Cash Flow
          </button>
          <button onClick={() => navigate('/timesheets')} className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            <Calendar className="w-3.5 h-3.5" /> Timesheet
          </button>
          <button onClick={() => navigate('/purchase-orders')} className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            <Package className="w-3.5 h-3.5" /> Ordini
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <KpiCard label="Ricavi Totali" value={`€${stats.totalRevenue.toLocaleString('it-IT')}`} icon={DollarSign} color="#1147FF" />
        <KpiCard label="Costi Totali" value={`€${stats.totalCosts.toLocaleString('it-IT')}`} icon={BarChart3} color="#EF4444" />
        <KpiCard label="Margine Lordo" value={`€${stats.totalMargin.toLocaleString('it-IT')}`} icon={TrendingUp} color={stats.totalMargin >= 0 ? '#10B981' : '#EF4444'} />
        <KpiCard label="Margine %" value={`${stats.avgMarginPct}%`} icon={TrendingUp} color={parseFloat(stats.avgMarginPct) >= 35 ? '#10B981' : parseFloat(stats.avgMarginPct) >= 25 ? '#F59E0B' : '#EF4444'} />
        <KpiCard label="In Utile" value={stats.projectsInProfit} icon={CheckCircle2} color="#10B981" />
        <KpiCard label="In Perdita" value={stats.projectsInLoss} icon={AlertCircle} color="#EF4444" />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-red-900 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Alert Critici ({alerts.length})
          </h2>
          <div className="space-y-2">
            {alerts.slice(0, 5).map(alert => (
              <div key={alert.id} className="flex items-center justify-between text-sm">
                <span className="text-red-700">{alert.message}</span>
                <span className="text-red-600 font-semibold">{alert.severity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Progetti e Profitabilità</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Progetto</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Contratto</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Costi</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Margine €</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Margine %</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Stato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {projects.map(p => {
                const projectCosts = costs.filter(c => c.project_id === p.id).reduce((sum, c) => sum + (c.total_cost || 0), 0);
                const margin = (p.contract_value || 0) - projectCosts;
                const marginPct = (p.contract_value || 0) > 0 ? ((margin / p.contract_value) * 100) : 0;
                const marginColor = marginPct >= 35 ? 'text-green-600' : marginPct >= 25 ? 'text-orange-600' : 'text-red-600';

                return (
                  <tr key={p.id} onClick={() => navigate(`/projects/${p.id}`)} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-gray-900">{p.title}</div>
                      <div className="text-xs text-gray-400">{p.status}</div>
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-gray-900">
                      €{(p.contract_value || 0).toLocaleString('it-IT')}
                    </td>
                    <td className="px-5 py-3.5 text-right text-gray-600">
                      €{projectCosts.toLocaleString('it-IT')}
                    </td>
                    <td className={`px-5 py-3.5 text-right font-semibold ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      €{margin.toLocaleString('it-IT')}
                    </td>
                    <td className={`px-5 py-3.5 text-right font-bold ${marginColor}`}>
                      {marginPct.toFixed(1)}%
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Report Modal */}
      {showReportModal && <AIMeetingReportGenerator projectId={null} onClose={() => setShowReportModal(false)} />}
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
      <p className="text-xl font-bold" style={{ color }}>{value}</p>
    </div>
  );
}