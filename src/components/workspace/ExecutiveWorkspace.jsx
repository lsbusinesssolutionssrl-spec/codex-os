import { useNavigate } from 'react-router-dom';
import { Crown, TrendingUp, DollarSign, AlertTriangle, Activity, Users, Shield, Briefcase } from 'lucide-react';
import { useGlobalContext } from '@/lib/GlobalContextEngine';

const quickActions = [
  { label: 'Insight Strategici', icon: TrendingUp, path: '/executive-insights' },
  { label: 'Controllo Finanziario', icon: DollarSign, path: '/financial-control' },
  { label: 'Dashboard Direzionale', icon: Crown, path: '/ceo-dashboard' },
  { label: 'Intelligence', icon: Activity, path: '/intelligence' },
  { label: 'Performance Team', icon: Users, path: '/team-accountability' },
  { label: 'Portfolio Progetti', icon: Briefcase, path: '/projects' },
];

export default function ExecutiveWorkspace() {
  const navigate = useNavigate();
  const { activeTenant } = useGlobalContext();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-blue-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Crown className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Cockpit Direzionale</h1>
              <p className="text-amber-100 text-sm">Supervisione strategica e intelligence decisionale</p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mt-8">
            <Stat label="Progetti Attivi" value="—" />
            <Stat label="Ricavi Mensili" value="—" />
            <Stat label="Dimensione Team" value="—" />
            <Stat label="Guardian MRR" value="—" />
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Strumenti Direzionali</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-amber-200 transition-all"
            >
              <action.icon className="w-5 h-5 text-amber-600" />
              <span className="text-xs font-medium text-gray-700 text-center">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Strategic Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <ModuleCard
            title="Business Intelligence"
            description="Andamento ricavi, analisi redditività, intelligence sui margini, previsioni finanziarie"
            icon={TrendingUp}
            color="#F59E0B"
          />
          <ModuleCard
            title="Monitoraggio Rischi"
            description="Rischi predittivi, alert salute progetti, soddisfazione clienti, previsione churn"
            icon={AlertTriangle}
            color="#EF4444"
          />
          <ModuleCard
            title="Performance Team"
            description="Analisi carichi di lavoro, metriche produttività, accountability operativa"
            icon={Users}
            color="#1147FF"
          />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
      <p className="text-amber-100 text-xs mb-1">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function ModuleCard({ title, description, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}