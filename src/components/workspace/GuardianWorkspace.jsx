import { useNavigate } from 'react-router-dom';
import { Shield, Activity, Calendar, Home, AlertCircle, Clock, TrendingUp, CheckCircle } from 'lucide-react';
import { useWorkspace } from './WorkspaceContext';

const quickActions = [
  { label: 'Guardian Subscriptions', icon: Shield, path: '/guardian' },
  { label: 'Property Health', icon: Activity, path: '/property-intelligence' },
  { label: 'Maintenance Schedule', icon: Calendar, path: '/maintenance' },
  { label: 'Properties', icon: Home, path: '/properties' },
  { label: 'Warranties', icon: CheckCircle, path: '/property-intelligence' },
  { label: 'Inspections', icon: Clock, path: '/maintenance' },
  { label: 'Predictive Insights', icon: TrendingUp, path: '/property-intelligence' },
  { label: 'Alerts', icon: AlertCircle, path: '/tickets' },
];

export default function GuardianWorkspace() {
  const navigate = useNavigate();
  const { config } = useWorkspace();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Guardian Intelligence</h1>
              <p className="text-purple-100 text-sm">Predictive maintenance and lifecycle management</p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mt-8">
            <Stat label="Active Guardians" value="—" />
            <Stat label="Properties Monitored" value="—" />
            <Stat label="Upcoming Inspections" value="—" />
            <Stat label="Expiring Warranties" value="—" />
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Guardian Tools</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-purple-200 transition-all"
            >
              <action.icon className="w-5 h-5 text-purple-600" />
              <span className="text-xs font-medium text-gray-700 text-center">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Guardian Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <ModuleCard
            title="Predictive Maintenance"
            description="AI-powered health scoring, failure prediction, preventive interventions"
            icon={Activity}
            color="#8B5CF6"
          />
          <ModuleCard
            title="Lifecycle Management"
            description="Warranty tracking, equipment lifecycle, maintenance scheduling, renewal opportunities"
            icon={Calendar}
            color="#10B981"
          />
          <ModuleCard
            title="Property Intelligence"
            description="Portfolio health, risk detection, cost optimization, upgrade recommendations"
            icon={Home}
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
      <p className="text-purple-100 text-xs mb-1">{label}</p>
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