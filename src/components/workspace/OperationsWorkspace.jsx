import { useNavigate } from 'react-router-dom';
import { Activity, Calendar, ClipboardList, Wrench, AlertCircle, Users, FileText, Clock } from 'lucide-react';
import { useGlobalContext } from '@/lib/GlobalContextEngine';

const quickActions = [
  { label: 'Tutti i Progetti', icon: Activity, path: '/projects' },
  { label: 'Pianificazione', icon: Calendar, path: '/schedule' },
  { label: 'Attività', icon: ClipboardList, path: '/tasks' },
  { label: 'Segnalazioni', icon: AlertCircle, path: '/tickets' },
  { label: 'Team', icon: Users, path: '/team' },
  { label: 'Checklist', icon: FileText, path: '/checklists' },
  { label: 'Operazioni', icon: Clock, path: '/operations' },
  { label: 'Manutenzione', icon: Wrench, path: '/maintenance' },
];

export default function OperationsWorkspace() {
  const navigate = useNavigate();
  const { activeTenant } = useGlobalContext();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Centro Operativo</h1>
              <p className="text-blue-100 text-sm">Coordinamento progetti e operazioni sul campo</p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mt-8">
            <Stat label="Progetti Attivi" value="—" />
            <Stat label="Attività Oggi" value="—" />
            <Stat label="Segnalazioni Aperte" value="—" />
            <Stat label="Team Disponibile" value="—" />
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Strumenti Operativi</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-blue-200 transition-all"
            >
              <action.icon className="w-5 h-5 text-blue-600" />
              <span className="text-xs font-medium text-gray-700 text-center">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Operational Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <ModuleCard
            title="Coordinamento Progetti"
            description="Progetti attivi, monitoraggio tempi, gestione milestone, rilevamento ritardi"
            icon={Activity}
            color="#1147FF"
          />
          <ModuleCard
            title="Allocazione Risorse"
            description="Pianificazione tecnici, bilanciamento carichi, abbinamento competenze, ottimizzazione spostamenti"
            icon={Users}
            color="#10B981"
          />
          <ModuleCard
            title="Risoluzione Problemi"
            description="Gestione segnalazioni, workflow di escalation, rilevamento colli di bottiglia, piani di ripristino"
            icon={AlertCircle}
            color="#F59E0B"
          />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
      <p className="text-blue-100 text-xs mb-1">{label}</p>
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