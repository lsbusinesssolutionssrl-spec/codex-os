import { useNavigate } from 'react-router-dom';
import { TrendingUp, Users, FileText, Phone, Mail, Calendar, DollarSign, Target } from 'lucide-react';
import { useWorkspace } from './WorkspaceContext';

const quickActions = [
  { label: 'Lead', icon: Target, path: '/clients' },
  { label: 'Preventivi', icon: FileText, path: '/estimates' },
  { label: 'Clienti', icon: Users, path: '/clients' },
  { label: 'Follow-up', icon: Phone, path: '/clients' },
  { label: 'Email', icon: Mail, path: '/clients' },
  { label: 'Calendario', icon: Calendar, path: '/calendar' },
  { label: 'AI Estimator', icon: DollarSign, path: '/ai-estimator' },
  { label: 'Pipeline', icon: TrendingUp, path: '/estimates' },
];

export default function SalesWorkspace() {
  const navigate = useNavigate();
  const { config } = useWorkspace();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Centro Commerciale</h1>
              <p className="text-orange-100 text-sm">Pipeline commerciale e gestione preventivi</p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mt-8">
            <Stat label="Lead Attivi" value="—" />
            <Stat label="Preventivi in Attesa" value="—" />
            <Stat label="Tasso Conversione" value="—" />
            <Stat label="Ricavi Mensili" value="—" />
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Strumenti Commerciali</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-orange-200 transition-all"
            >
              <action.icon className="w-5 h-5 text-orange-600" />
              <span className="text-xs font-medium text-gray-700 text-center">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Sales Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <ModuleCard
            title="Gestione Pipeline"
            description="Tracciamento lead, pipeline preventivi, pianificazione follow-up, analytics conversione"
            icon={TrendingUp}
            color="#F58020"
          />
          <ModuleCard
            title="Assistente AI Preventivi"
            description="Genera preventivi, ottimizza prezzi, suggerisci upsell, prepara proposte commerciali"
            icon={FileText}
            color="#1147FF"
          />
          <ModuleCard
            title="Relazioni Clienti"
            description="Comunicazioni clienti, automazione follow-up, opportunità Guardian"
            icon={Users}
            color="#10B981"
          />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
      <p className="text-orange-100 text-xs mb-1">{label}</p>
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