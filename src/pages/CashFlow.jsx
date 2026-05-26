import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, AlertCircle, Calendar } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function CashFlow() {
  const [cashFlow, setCashFlow] = useState({
    days30: { incoming: 0, outgoing: 0, net: 0, late: 0 },
    days60: { incoming: 0, outgoing: 0, net: 0, late: 0 },
    days90: { incoming: 0, outgoing: 0, net: 0, late: 0 },
  });
  const [projects, setProjects] = useState([]);
  const [costs, setCosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [projs, projectCosts] = await Promise.all([
        base44.entities.Project.list(),
        base44.entities.ProjectCost.list(),
      ]);

      setProjects(projs);
      setCosts(projectCosts);

      const today = new Date();
      const days30 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      const days60 = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
      const days90 = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

      // Calculate incoming (from projects payment schedule - simplified)
      const calcIncoming = (endDate) => {
        return projs
          .filter(p => p.expected_end_date && new Date(p.expected_end_date) <= endDate)
          .reduce((sum, p) => sum + ((p.contract_value || 0) - (p.payment_collected || 0)), 0);
      };

      // Calculate outgoing (from costs not yet paid)
      const calcOutgoing = (endDate) => {
        return projectCosts
          .filter(c => c.date && new Date(c.date) <= endDate && !c.paid)
          .reduce((sum, c) => sum + (c.total_cost || 0), 0);
      };

      // Calculate late payments (overdue)
      const calcLate = () => {
        return projectCosts
          .filter(c => c.date && new Date(c.date) < today && !c.paid)
          .reduce((sum, c) => sum + (c.total_cost || 0), 0);
      };

      setCashFlow({
        days30: {
          incoming: calcIncoming(days30),
          outgoing: calcOutgoing(days30),
          net: calcIncoming(days30) - calcOutgoing(days30),
          late: calcLate(),
        },
        days60: {
          incoming: calcIncoming(days60),
          outgoing: calcOutgoing(days60),
          net: calcIncoming(days60) - calcOutgoing(days60),
          late: calcLate(),
        },
        days90: {
          incoming: calcIncoming(days90),
          outgoing: calcOutgoing(days90),
          net: calcIncoming(days90) - calcOutgoing(days90),
          late: calcLate(),
        },
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
          <h1 className="text-2xl font-bold text-gray-900">Cash Flow</h1>
          <p className="text-sm text-gray-500 mt-0.5">Proiezioni flussi di cassa</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleDateString('it-IT')}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <ArrowUpRight className="w-5 h-5 text-green-600" />
            <span className="text-xs font-semibold text-green-700">Incassi Previsti (30gg)</span>
          </div>
          <p className="text-3xl font-bold text-green-700">€{cashFlow.days30.incoming.toLocaleString('it-IT')}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-white rounded-xl border border-red-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <ArrowDownRight className="w-5 h-5 text-red-600" />
            <span className="text-xs font-semibold text-red-700">Pagamenti Previsti (30gg)</span>
          </div>
          <p className="text-3xl font-bold text-red-700">€{cashFlow.days30.outgoing.toLocaleString('it-IT')}</p>
        </div>
        <div className={`rounded-xl border p-5 ${cashFlow.days30.net >= 0 ? 'bg-gradient-to-br from-blue-50 to-white border-blue-200' : 'bg-gradient-to-br from-orange-50 to-white border-orange-200'}`}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className={`w-5 h-5 ${cashFlow.days30.net >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
            <span className="text-xs font-semibold text-gray-700">Net Cash Flow (30gg)</span>
          </div>
          <p className={`text-3xl font-bold ${cashFlow.days30.net >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
            €{cashFlow.days30.net.toLocaleString('it-IT')}
          </p>
        </div>
      </div>

      {/* Late Payments Alert */}
      {cashFlow.days30.late > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h2 className="text-sm font-semibold text-red-900">Pagamenti in Ritardo</h2>
          </div>
          <p className="text-2xl font-bold text-red-700">€{cashFlow.days30.late.toLocaleString('it-IT')}</p>
          <p className="text-xs text-red-600 mt-1">Fatture scadute non ancora saldate</p>
        </div>
      )}

      {/* Forecast Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Proiezioni Cash Flow</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Periodo</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Incassi</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Pagamenti</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Netto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {[
              { label: '30 Giorni', data: cashFlow.days30 },
              { label: '60 Giorni', data: cashFlow.days60 },
              { label: '90 Giorni', data: cashFlow.days90 },
            ].map(({ label, data }) => (
              <tr key={label}>
                <td className="px-5 py-4 font-medium text-gray-900">{label}</td>
                <td className="px-5 py-4 text-right text-green-600 font-semibold">
                  +€{data.incoming.toLocaleString('it-IT')}
                </td>
                <td className="px-5 py-4 text-right text-red-600 font-semibold">
                  -€{data.outgoing.toLocaleString('it-IT')}
                </td>
                <td className={`px-5 py-4 text-right font-bold ${data.net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  €{data.net.toLocaleString('it-IT')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Projects Payment Schedule */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Progetti - Incassi Previsti</h2>
        <div className="space-y-3">
          {projects.filter(p => p.status === 'In Progress' || p.status === 'Approved').slice(0, 5).map(p => {
            const remaining = (p.contract_value || 0) - (p.payment_collected || 0);
            return (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{p.title}</p>
                  <p className="text-xs text-gray-400">{p.expected_end_date ? new Date(p.expected_end_date).toLocaleDateString('it-IT') : '—'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-600">€{remaining.toLocaleString('it-IT')}</p>
                  <p className="text-xs text-gray-400">da incassare</p>
                </div>
              </div>
            );
          })}
          {projects.filter(p => p.status === 'In Progress' || p.status === 'Approved').length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Nessun progetto attivo</p>
          )}
        </div>
      </div>
    </div>
  );
}