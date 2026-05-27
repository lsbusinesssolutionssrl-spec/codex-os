import { useNavigate } from 'react-router-dom';
import { Shield, Building2, Users, Activity, Brain, Zap, BarChart2, Globe, Database, Key, Cpu, CreditCard, Palette } from 'lucide-react';
import { useGlobalContext } from '@/lib/GlobalContextEngine';

const quickActions = [
  { label: 'Gestione Tenant', icon: Building2, path: '/super-admin' },
  { label: 'Impostazioni Platform', icon: Shield, path: '/platform-settings' },
  { label: 'Analytics Platform', icon: BarChart2, path: '/product-analytics' },
  { label: 'Piani SaaS', icon: CreditCard, path: '/subscription-plans' },
  { label: 'Sistemi AI', icon: Brain, path: '/ai-foundation' },
  { label: 'Workflow Engine', icon: Zap, path: '/workflows' },
  { label: 'Integrazioni', icon: Globe, path: '/integrations' },
  { label: 'White Label', icon: Palette, path: '/brand-approval' },
  { label: 'Developer', icon: Database, path: '/developer' },
  { label: 'API Keys', icon: Key, path: '/api-keys' },
  { label: 'Stato Sistema', icon: Cpu, path: '/system-status' },
];

export default function SuperAdminWorkspace() {
  const navigate = useNavigate();
  const { activeTenant } = useGlobalContext();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Centro di Controllo Platform</h1>
              <p className="text-purple-200 text-sm">Supervisione enterprise e controllo infrastruttura</p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mt-8">
            <Stat label="Tenant Attivi" value="—" />
            <Stat label="MRR Platform" value="—" />
            <Stat label="Operazioni AI" value="—" />
            <Stat label="Salute Sistema" value="98%" />
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Controlli di Sistema</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-purple-200 transition-all"
            >
              <action.icon className="w-5 h-5 text-purple-600" />
              <span className="text-xs font-medium text-gray-700 text-center">{action.label}</span>
            </button>
          ))}
        </div>

        {/* System Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <ModuleCard
            title="Gestione Tenant"
            description="Architettura multi-tenant, onboarding aziende, gestione abbonamenti"
            icon={Building2}
            color="#7C3AED"
          />
          <ModuleCard
            title="Osservabilità AI"
            description="Monitoraggio operazioni AI, sistemi di memoria, qualità orchestrazione"
            icon={Brain}
            color="#F59E0B"
          />
          <ModuleCard
            title="Analytics Platform"
            description="Metriche utilizzo, adozione funzionalità, punteggi di salute"
            icon={BarChart2}
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
      <p className="text-purple-200 text-xs mb-1">{label}</p>
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