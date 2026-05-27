import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Plug, Zap, Calendar, Mail, MessageSquare, Video, DollarSign, FileText, Cloud, Smartphone, Shield, Activity, Search, Plus, Settings, Trash2, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { hasRole } from '@/lib/roleUtils';
import { toast } from 'sonner';

const INTEGRATION_CATEGORIES = [
  { id: 'all', label: 'Tutte', icon: Globe },
  { id: 'Calendar', label: 'Calendar', icon: Calendar },
  { id: 'Communication', label: 'Communication', icon: MessageSquare },
  { id: 'Accounting', label: 'Accounting', icon: DollarSign },
  { id: 'Storage', label: 'Storage', icon: Cloud },
  { id: 'Payment', label: 'Payment', icon: DollarSign },
  { id: 'CRM', label: 'CRM', icon: Smartphone },
  { id: 'Analytics', label: 'Analytics', icon: Activity },
  { id: 'IoT', label: 'IoT', icon: Zap },
  { id: 'Automation', label: 'Automation', icon: Zap },
];

const AVAILABLE_INTEGRATIONS = [
  { name: 'Google Calendar', provider: 'Google', category: 'Calendar', icon: Calendar, status: 'available', features: ['Sync events', 'Two-way sync', 'Real-time updates'] },
  { name: 'Outlook Calendar', provider: 'Microsoft', category: 'Calendar', icon: Calendar, status: 'available', features: ['Calendar sync', 'Meeting scheduling'] },
  { name: 'Gmail', provider: 'Google', category: 'Communication', icon: Mail, status: 'available', features: ['Email notifications', 'Two-way sync'] },
  { name: 'WhatsApp Business', provider: 'WhatsApp', category: 'Communication', icon: MessageSquare, status: 'available', features: ['Client messaging', 'Automated notifications'] },
  { name: 'Microsoft Teams', provider: 'Microsoft', category: 'Communication', icon: Video, status: 'available', features: ['Team notifications', 'Channel integration'] },
  { name: 'Slack', provider: 'Slack', category: 'Communication', icon: MessageSquare, status: 'available', features: ['Channel alerts', 'Bot integration'] },
  { name: 'Stripe', provider: 'Stripe', category: 'Payment', icon: DollarSign, status: 'available', features: ['Payment processing', 'Subscription management', 'Invoice automation'] },
  { name: 'QuickBooks', provider: 'QuickBooks', category: 'Accounting', icon: FileText, status: 'available', features: ['Invoice sync', 'Financial reporting', 'Expense tracking'] },
  { name: 'Xero', provider: 'Xero', category: 'Accounting', icon: FileText, status: 'available', features: ['Accounting sync', 'Bank reconciliation'] },
  { name: 'Google Drive', provider: 'Google', category: 'Storage', icon: Cloud, status: 'available', features: ['Document storage', 'File sync', 'Collaborative editing'] },
  { name: 'OneDrive', provider: 'Microsoft', category: 'Storage', icon: Cloud, status: 'available', features: ['Cloud storage', 'File sharing'] },
  { name: 'Dropbox', provider: 'Dropbox', category: 'Storage', icon: Cloud, status: 'available', features: ['File backup', 'Document management'] },
  { name: 'Zapier', provider: 'Zapier', category: 'Automation', icon: Zap, status: 'available', features: ['Workflow automation', '5000+ app connections'] },
];

export default function IntegrationHub() {
  const navigate = useNavigate();
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    hasRole(['admin', 'company_admin']).then(auth => {
      if (!auth) {
        navigate('/');
        return;
      }
      setIsAuthorized(true);
    });
  }, []);

  useEffect(() => {
    if (!isAuthorized) return;
    
    const load = async () => {
      const data = await base44.entities.PlatformIntegration.list();
      setIntegrations(data);
      setLoading(false);
    };
    load();
  }, [isAuthorized]);

  const handleConfigure = async (integration) => {
    toast.info(`Configurazione ${integration.name} - Feature in sviluppo`);
  };

  const handleDisable = async (integration) => {
    await base44.entities.PlatformIntegration.update(integration.id, { status: 'Inactive' });
    setIntegrations(prev => prev.map(i => i.id === integration.id ? { ...i, status: 'Inactive' } : i));
    toast.success(`${integration.name} disattivata`);
  };

  const handleDelete = async (integration) => {
    await base44.entities.PlatformIntegration.delete(integration.id);
    setIntegrations(prev => prev.filter(i => i.id !== integration.id));
    toast.success(`${integration.name} eliminata`);
  };

  const filteredIntegrations = AVAILABLE_INTEGRATIONS.filter(integration => {
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.provider.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (!isAuthorized) return null;
  if (loading) return <div className="p-6 text-center text-gray-400">Caricamento...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integration Hub</h1>
          <p className="text-sm text-gray-500 mt-0.5">Connetti il tuo ecosistema aziendale</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/developer')} className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            <Settings className="w-3.5 h-3.5" /> Developer
          </button>
          <button onClick={() => navigate('/workflows')} className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            <Zap className="w-3.5 h-3.5" /> Workflows
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Integrazioni Attive" value={integrations.filter(i => i.status === 'Active').length} icon={Plug} color="#10B981" />
        <StatCard label="Totale Integrazioni" value={integrations.length} icon={Globe} color="#1147FF" />
        <StatCard label="Disponibili" value={AVAILABLE_INTEGRATIONS.length} icon={Cloud} color="#F59E0B" />
        <StatCard label="Errori" value={integrations.filter(i => i.status === 'Error').length} icon={Activity} color="#EF4444" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca integrazioni..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {INTEGRATION_CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIntegrations.map((integration, idx) => {
          const Icon = integration.icon;
          const existing = integrations.find(i => i.name === integration.name);
          
          return (
            <div key={idx} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                    <p className="text-xs text-gray-500">{integration.provider}</p>
                  </div>
                </div>
                {existing && (
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    existing.status === 'Active' ? 'bg-green-100 text-green-700' :
                    existing.status === 'Error' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {existing.status}
                  </span>
                )}
              </div>
              
              <div className="space-y-1 mb-4">
                {integration.features.slice(0, 3).map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                    <div className="w-1 h-1 rounded-full bg-blue-500" />
                    {feature}
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                {existing ? (
                  <>
                    <button
                      onClick={() => handleConfigure(existing)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-white rounded-lg bg-blue-600 hover:bg-blue-700"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Configura
                    </button>
                    {existing.status === 'Active' && (
                      <button
                        onClick={() => handleDisable(existing)}
                        className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(existing)}
                      className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleConfigure(integration)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-white rounded-lg bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Connetti
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredIntegrations.length === 0 && (
        <div className="text-center py-12">
          <Cloud className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Nessuna integrazione trovata</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
    </div>
  );
}