import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function LiveKpiWidgets() {
  const [kpiData, setKpiData] = useState({
    totalRevenue: 0,
    avgMargin: 0,
    criticalProjects: 0,
    activeProjects: 0,
  });
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [previousMargin, setPreviousMargin] = useState(null);

  useEffect(() => {
    loadKpiData();
    
    // Polling ogni 15 secondi per i KPI critici
    const pollInterval = setInterval(() => {
      loadKpiData(true);
    }, 15000);

    return () => clearInterval(pollInterval);
  }, []);

  const loadKpiData = async (isRefresh = false) => {
    const projects = await base44.entities.Project.list();
    
    const totalRevenue = projects.reduce((sum, p) => sum + (p.contract_value || 0), 0);
    const activeProjects = projects.filter(p => ['In Progress', 'Approved'].includes(p.status)).length;
    const criticalProjects = projects.filter(p => 
      (p.gross_margin_pct || 0) < 25 && 
      ['In Progress', 'Approved'].includes(p.status)
    ).length;
    
    const avgMargin = projects.length > 0 
      ? projects.reduce((sum, p) => sum + (p.gross_margin_pct || 0), 0) / projects.length 
      : 0;

    // Notifica se il margine medio scende sotto 30%
    if (isRefresh && previousMargin !== null && previousMargin >= 30 && avgMargin < 30) {
      toast.error('⚠️ Attenzione: Margine Medio in Calo', {
        description: `Margine sceso al ${avgMargin.toFixed(1)}% - Sotto soglia 30%`,
        duration: 10000,
      });
    }

    setPreviousMargin(avgMargin);
    setKpiData({ totalRevenue, avgMargin, criticalProjects, activeProjects });
    setLastUpdated(new Date());
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <KpiCard 
        label="Ricavi Totali" 
        value={`€${(kpiData.totalRevenue / 1000).toFixed(1)}k`} 
        icon={DollarSign} 
        color="#1147FF"
        trend="up"
      />
      <KpiCard 
        label="Margine Medio" 
        value={`${kpiData.avgMargin.toFixed(1)}%`} 
        icon={TrendingUp} 
        color={kpiData.avgMargin >= 35 ? '#10B981' : kpiData.avgMargin >= 30 ? '#F59E0B' : '#EF4444'}
        trend={kpiData.avgMargin >= 35 ? 'up' : kpiData.avgMargin >= 30 ? 'stable' : 'down'}
      />
      <KpiCard 
        label="Progetti Critici" 
        value={kpiData.criticalProjects} 
        icon={AlertTriangle} 
        color={kpiData.criticalProjects > 0 ? '#EF4444' : '#10B981'}
        pulse={kpiData.criticalProjects > 0}
      />
      <KpiCard 
        label="Progetti Attivi" 
        value={kpiData.activeProjects} 
        icon={Activity} 
        color="#F58220"
      />
      <div className="col-span-full text-center">
        <p className="text-xs text-gray-400">
          Ultimo aggiornamento: {lastUpdated.toLocaleTimeString('it-IT')} · 
          <span className="text-green-600 flex items-center justify-center gap-1 mt-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Aggiornamento in tempo reale (15s)
          </span>
        </p>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, color, trend, pulse }) {
  return (
    <div className={`bg-white rounded-xl border-2 ${pulse ? 'border-red-300 animate-pulse' : 'border-gray-200'} p-4 transition-all hover:shadow-md`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
        <span className="text-xs text-gray-500 font-medium truncate">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-xl font-bold" style={{ color }}>
          {typeof value === 'number' ? value.toLocaleString('it-IT') : value}
        </p>
        {trend && (
          <div className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
            trend === 'up' ? 'bg-green-100 text-green-700' :
            trend === 'down' ? 'bg-red-100 text-red-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </div>
        )}
      </div>
    </div>
  );
}