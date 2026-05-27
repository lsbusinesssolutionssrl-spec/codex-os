import { useNavigate } from 'react-router-dom';
import { Wrench, ClipboardCheck, MapPin, Camera, Mic, BookOpen, CheckCircle, Phone } from 'lucide-react';
import { useWorkspace } from './WorkspaceContext';

const quickActions = [
  { label: 'My Projects', icon: Wrench, path: '/technician' },
  { label: "Today's Tasks", icon: ClipboardCheck, path: '/tasks' },
  { label: 'Navigation', icon: MapPin, path: '/technician' },
  { label: 'Photo Upload', icon: Camera, path: '/technician' },
  { label: 'Voice Notes', icon: Mic, path: '/technician' },
  { label: 'SOPs', icon: BookOpen, path: '/sop' },
  { label: 'Checklists', icon: CheckCircle, path: '/checklists' },
  { label: 'Support', icon: Phone, path: '/tickets' },
];

export default function TechnicianWorkspace() {
  const navigate = useNavigate();
  const { config } = useWorkspace();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Field Operations</h1>
              <p className="text-emerald-100 text-sm">Mobile-first field workspace</p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <Stat label="Today's Tasks" value="—" />
            <Stat label="Active Projects" value="—" />
            <Stat label="Pending Uploads" value="—" />
          </div>
        </div>
      </div>

      {/* Quick Actions Grid - Large touch-friendly buttons */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Field Tools</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl border border-gray-200 hover:shadow-lg hover:border-emerald-200 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <action.icon className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="text-sm font-medium text-gray-700 text-center">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Mobile-First Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <ModuleCard
            title="Assigned Work"
            description="View your projects, complete checklists, upload photos, log hours"
            icon={ClipboardCheck}
            color="#10B981"
          />
          <ModuleCard
            title="Field Assistant"
            description="AI-powered SOP retrieval, troubleshooting guidance, quick documentation"
            icon={BookOpen}
            color="#F59E0B"
          />
        </div>

        {/* Mobile CTA */}
        <div className="mt-8 p-6 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl text-white text-center">
          <Wrench className="w-8 h-8 mx-auto mb-3" />
          <h3 className="text-lg font-bold mb-2">Optimized for Mobile</h3>
          <p className="text-emerald-100 text-sm mb-4">
            Access this workspace from your phone for the best field experience
          </p>
          <button 
            onClick={() => navigate('/technician')}
            className="px-6 py-3 bg-white text-emerald-600 rounded-lg font-semibold text-sm"
          >
            Open Mobile View
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
      <p className="text-emerald-100 text-xs mb-1">{label}</p>
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