import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StatusBadge from '../components/StatusBadge';

export default function ProjectFinancialDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [costs, setCosts] = useState([]);
  const [timesheets, setTimesheets] = useState([]);
  const [financials, setFinancials] = useState({
    revenue: 0,
    totalCosts: 0,
    grossMargin: 0,
    grossMarginPct: 0,
    completionPct: 0,
    collectedPct: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [projs, projectCosts, timesheetData] = await Promise.all([
        base44.entities.Project.filter({ id }),
        base44.entities.ProjectCost.filter({ project_id: id }),
        base44.entities.Timesheet.filter({ project_id: id }),
      ]);

      if (projs[0]) {
        setProject(projs[0]);
        
        const totalCosts = projectCosts.reduce((sum, c) => sum + (c.total_cost || 0), 0);
        const laborCosts = timesheetData.reduce((sum, t) => sum + (t.total_labor_cost || 0), 0);
        const revenue = projs[0].contract_value || 0;
        const grossMargin = revenue - totalCosts - laborCosts;
        const grossMarginPct = revenue > 0 ? ((grossMargin / revenue) * 100) : 0;
        
        setFinancials({
          revenue,
          totalCosts: totalCosts + laborCosts,
          grossMargin,
          grossMarginPct: grossMarginPct.toFixed(1),
          completionPct: 0,
          collectedPct: projs[0].payment_collected ? ((projs[0].payment_collected / revenue) * 100).toFixed(1) : 0,
        });
      }
      
      setCosts(projectCosts);
      setTimesheets(timesheetData);
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return <div className="p-6 text-center text-gray-400">Caricamento...</div>;
  if (!project) return <div className="p-6 text-center text-gray-400">Progetto non trovato</div>;

  const marginColor = parseFloat(financials.grossMarginPct) >= 35 ? 'text-green-600' : parseFloat(financials.grossMarginPct) >= 25 ? 'text-orange-600' : 'text-red-600';
  const marginBg = parseFloat(financials.grossMarginPct) >= 35 ? 'bg-green-50 border-green-200' : parseFloat(financials.grossMarginPct) >= 25 ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/financial-control')} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <StatusBadge status={project.status} />
            <span className="text-xs text-gray-400">Controllo Finanziario</span>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className={`rounded-xl border-2 p-6 ${marginBg}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Profitabilità Progetto
          </h2>
          <div className={`text-3xl font-bold ${marginColor}`}>
            {financials.grossMarginPct}%
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Ricavi</p>
            <p className="text-xl font-bold text-blue-600">€{financials.revenue.toLocaleString('it-IT')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Costi Totali</p>
            <p className="text-xl font-bold text-red-600">€{financials.totalCosts.toLocaleString('it-IT')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Margine Lordo</p>
            <p className={`text-xl font-bold ${marginColor}`}>€{financials.grossMargin.toLocaleString('it-IT')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Incassato</p>
            <p className="text-xl font-bold text-green-600">{financials.collectedPct}%</p>
          </div>
        </div>
      </div>

      {/* Costs Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cost Types */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Costi per Categoria</h2>
            <button className="flex items-center gap-1 px-3 py-1.5 text-xs text-white rounded-lg" style={{ backgroundColor: '#1147FF' }}>
              <Plus className="w-3 h-3" /> Aggiungi
            </button>
          </div>
          <div className="space-y-3">
            {['Material', 'Labor', 'Vehicle', 'Subcontractor', 'Other'].map(type => {
              const typeCosts = costs.filter(c => c.cost_type === type).reduce((sum, c) => sum + (c.total_cost || 0), 0);
              const pct = financials.totalCosts > 0 ? ((typeCosts / financials.totalCosts) * 100).toFixed(1) : 0;
              
              return (
                <div key={type}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">{type}</span>
                    <span className="font-semibold text-gray-900">€{typeCosts.toLocaleString('it-IT')} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-lg bg-blue-600 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Costs */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Ultimi Costi</h2>
            <span className="text-xs text-gray-400">{costs.length} totali</span>
          </div>
          <div className="space-y-2">
            {costs.slice(0, 8).map(cost => (
              <div key={cost.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{cost.description || cost.cost_type}</p>
                  <p className="text-xs text-gray-400">{cost.date ? new Date(cost.date).toLocaleDateString('it-IT') : ''}</p>
                </div>
                <span className="text-sm font-semibold text-red-600">-€{(cost.total_cost || 0).toLocaleString('it-IT')}</span>
              </div>
            ))}
            {costs.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Nessun costo registrato</p>}
          </div>
        </div>
      </div>

      {/* Timesheets */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Timesheet Ore
          </h2>
          <button className="flex items-center gap-1 px-3 py-1.5 text-xs text-white rounded-lg" style={{ backgroundColor: '#1147FF' }}>
            <Plus className="w-3 h-3" /> Registra Ore
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Data</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Ore</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Costo</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {timesheets.map(t => (
                <tr key={t.id}>
                  <td className="px-4 py-2 text-gray-900">{t.date ? new Date(t.date).toLocaleDateString('it-IT') : ''}</td>
                  <td className="px-4 py-2 text-gray-900">{t.hours}h</td>
                  <td className="px-4 py-2 text-red-600 font-semibold">-€{(t.total_labor_cost || 0).toLocaleString('it-IT')}</td>
                  <td className="px-4 py-2 text-gray-600">{t.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}