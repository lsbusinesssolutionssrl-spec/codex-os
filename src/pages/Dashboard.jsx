import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, AlertCircle, CheckCircle2, XCircle, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StatusBadge from '../components/StatusBadge';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEstimates: 0,
    draft: 0,
    sent: 0,
    accepted: 0,
    rejected: 0,
    totalPipelineValue: 0,
    acceptedValue: 0,
    avgEstimateValue: 0,
    conversionRate: 0,
    avgMargin: 0,
  });
  const [recentEstimates, setRecentEstimates] = useState([]);
  const [rejectionReasons, setRejectionReasons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const estimates = await base44.entities.Estimate.list();
      
      const draft = estimates.filter(e => e.status === 'Draft').length;
      const sent = estimates.filter(e => e.status === 'Sent').length;
      const accepted = estimates.filter(e => e.status === 'Accepted').length;
      const rejected = estimates.filter(e => e.status === 'Rejected').length;
      
      const totalPipelineValue = estimates.reduce((sum, e) => sum + (e.revenue || 0), 0);
      const acceptedValue = estimates.filter(e => e.status === 'Accepted').reduce((sum, e) => sum + (e.revenue || 0), 0);
      
      const margins = estimates.filter(e => e.gross_margin_pct).map(e => e.gross_margin_pct);
      const avgMargin = margins.length > 0 ? margins.reduce((a, b) => a + b, 0) / margins.length : 0;
      
      const total = estimates.length;
      const conversionRate = total > 0 ? ((accepted / total) * 100).toFixed(1) : 0;
      
      // Rejection reasons
      const reasons = {};
      estimates.filter(e => e.status === 'Rejected' && e.rejection_reason).forEach(e => {
        reasons[e.rejection_reason] = (reasons[e.rejection_reason] || 0) + 1;
      });
      setRejectionReasons(Object.entries(reasons).map(([reason, count]) => ({ reason, count })));
      
      setStats({
        totalEstimates: total,
        draft,
        sent,
        accepted,
        rejected,
        totalPipelineValue,
        acceptedValue,
        avgEstimateValue: total > 0 ? totalPipelineValue / total : 0,
        conversionRate: parseFloat(conversionRate),
        avgMargin: avgMargin.toFixed(1),
      });
      
      setRecentEstimates(estimates.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 5));
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
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Commerciale</h1>
          <p className="text-sm text-gray-500 mt-0.5">Panoramica preventivi e performance</p>
        </div>
        <button onClick={() => navigate('/ai-estimator')} className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium" style={{ backgroundColor: '#F58220' }}>
          <Plus className="w-4 h-4" /> Nuovo Preventivo
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard label="Totale Preventivi" value={stats.totalEstimates} icon={BarChart3} color="#1147FF" />
        <KpiCard label="Inviati" value={stats.sent} icon={CheckCircle2} color="#10B981" />
        <KpiCard label="Accettati" value={stats.accepted} icon={CheckCircle2} color="#10B981" />
        <KpiCard label="Rifiutati" value={stats.rejected} icon={XCircle} color="#EF4444" />
        <KpiCard label="Tasso Conversione" value={`${stats.conversionRate}%`} icon={TrendingUp} color="#F58220" />
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 font-medium mb-1">Valore Pipeline</p>
          <p className="text-2xl font-bold" style={{ color: '#1147FF' }}>€{stats.totalPipelineValue.toLocaleString('it-IT')}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 font-medium mb-1">Valore Accettato</p>
          <p className="text-2xl font-bold" style={{ color: '#10B981' }}>€{stats.acceptedValue.toLocaleString('it-IT')}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 font-medium mb-1">Margine Medio</p>
          <p className={`text-2xl font-bold ${parseFloat(stats.avgMargin) >= 35 ? 'text-green-600' : parseFloat(stats.avgMargin) >= 25 ? 'text-orange-600' : 'text-red-600'}`}>
            {stats.avgMargin}%
          </p>
        </div>
      </div>

      {/* Rejection Reasons */}
      {rejectionReasons.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-500" />
            Motivi Rifiuto
          </h2>
          <div className="space-y-2">
            {rejectionReasons.map(({ reason, count }) => (
              <div key={reason} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{reason}</span>
                <span className="text-sm font-semibold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Estimates */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Preventivi Recenti</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {recentEstimates.map(e => (
            <div key={e.id} onClick={() => navigate(`/estimates/${e.id}`)} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{e.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{e.estimate_type} · {e.quality_level}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-gray-900">€{(e.revenue || 0).toLocaleString('it-IT')}</span>
                <StatusBadge status={e.status} />
              </div>
            </div>
          ))}
        </div>
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
      <p className="text-2xl font-bold" style={{ color }}>{typeof value === 'number' ? value.toLocaleString('it-IT') : value}</p>
    </div>
  );
}