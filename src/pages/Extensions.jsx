import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Puzzle, Search, Zap, Shield, Package, TrendingUp, Cloud } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { hasRole } from '@/lib/roleUtils';
import { toast } from 'sonner';
import ExtensionCard from '../components/extensions/ExtensionCard';

const EXTENSION_CATEGORIES = [
  { id: 'all', label: 'Tutte', icon: Puzzle },
  { id: 'Accounting', label: 'Accounting', icon: TrendingUp },
  { id: 'IoT', label: 'IoT', icon: Zap },
  { id: 'CRM', label: 'CRM', icon: Cloud },
  { id: 'Insurance', label: 'Insurance', icon: Shield },
  { id: 'Analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'Operations', label: 'Operations', icon: Package },
];

const AVAILABLE_EXTENSIONS = [
  {
    name: 'Advanced Accounting',
    slug: 'advanced-accounting',
    version: '1.0.0',
    description: 'Multi-currency accounting with tax automation and financial reporting',
    category: 'Accounting',
    author: 'Codex OS',
    is_official: true,
    is_beta: false,
    features: [
      'Multi-currency support (EUR, USD, GBP, CHF)',
      'Automatic tax calculation and VAT reporting',
      'Financial consolidation and reporting',
      'Currency revaluation and exchange tracking'
    ],
    entities: ['TaxRate', 'FinancialReport', 'CurrencyExchange', 'TaxReturn'],
    permissions: ['entities:TaxRate:*', 'entities:FinancialReport:*', 'functions:calculateMultiCurrency:invoke'],
    price_monthly: 0,
    price_yearly: 0
  },
  {
    name: 'Smart Home',
    slug: 'smart-home',
    version: '1.0.0',
    description: 'Home automation with device integration, automation rules, and energy monitoring',
    category: 'IoT',
    author: 'Codex OS',
    is_official: true,
    is_beta: false,
    features: [
      'Device integration (thermostats, lights, locks)',
      'Automation rules engine (IFTTT)',
      'Energy monitoring and optimization',
      'Voice assistant integration (Alexa, Google Home)'
    ],
    entities: ['SmartDevice', 'AutomationRule', 'EnergyReading', 'Scene'],
    permissions: ['entities:SmartDevice:*', 'entities:AutomationRule:*', 'integrations:googlehome:use'],
    price_monthly: 9.99,
    price_yearly: 99.99
  },
  {
    name: 'IoT Monitoring',
    slug: 'iot-monitoring',
    version: '1.0.0',
    description: 'Industrial IoT monitoring with sensor data, predictive maintenance, and alerts',
    category: 'IoT',
    author: 'Codex OS',
    is_official: true,
    is_beta: false,
    features: [
      'Real-time sensor data collection',
      'Predictive maintenance with ML',
      'Threshold-based alerts and notifications',
      'Historical analytics and reporting'
    ],
    entities: ['IoTDevice', 'SensorReading', 'MaintenanceSchedule', 'AlertRule'],
    permissions: ['entities:IoTDevice:*', 'entities:SensorReading:*', 'functions:predictiveMaintenance:invoke'],
    price_monthly: 19.99,
    price_yearly: 199.99
  },
  {
    name: 'Real Estate CRM',
    slug: 'real-estate-crm',
    version: '1.0.0',
    description: 'Property listings, client matching, and deal pipeline management',
    category: 'CRM',
    author: 'Codex OS',
    is_official: true,
    is_beta: false,
    features: [
      'Property listings management',
      'AI-powered client matching',
      'Deal pipeline and commission tracking',
      'Document generation (contracts, offers)'
    ],
    entities: ['PropertyListing', 'Lead', 'Deal', 'Commission'],
    permissions: ['entities:PropertyListing:*', 'entities:Lead:*', 'entities:Deal:*'],
    price_monthly: 29.99,
    price_yearly: 299.99
  },
  {
    name: 'Insurance',
    slug: 'insurance',
    version: '1.0.0',
    description: 'Policy management, claims processing, and risk assessment',
    category: 'Insurance',
    author: 'Codex OS',
    is_official: true,
    is_beta: true,
    features: [
      'Policy lifecycle management',
      'Automated premium calculation',
      'Claims processing workflow',
      'Risk assessment and scoring'
    ],
    entities: ['InsurancePolicy', 'Claim', 'Premium', 'RiskAssessment'],
    permissions: ['entities:InsurancePolicy:*', 'entities:Claim:*', 'functions:calculatePremium:invoke'],
    price_monthly: 39.99,
    price_yearly: 399.99
  },
  {
    name: 'Construction Analytics',
    slug: 'construction-analytics',
    version: '1.0.0',
    description: 'Project costing analytics, margin analysis, and resource optimization',
    category: 'Analytics',
    author: 'Codex OS',
    is_official: true,
    is_beta: false,
    features: [
      'Real-time project costing',
      'Margin analysis by project type',
      'Resource utilization tracking',
      'Industry benchmarking'
    ],
    entities: ['CostCode', 'BudgetVariance', 'ResourceUtilization', 'ProjectBenchmark'],
    permissions: ['entities:ProjectCost:*', 'entities:BudgetVariance:*', 'functions:analyzeMargins:invoke'],
    price_monthly: 24.99,
    price_yearly: 249.99
  },
  {
    name: 'Fleet Management',
    slug: 'fleet-management',
    version: '1.0.0',
    description: 'Vehicle tracking, maintenance scheduling, and fuel management',
    category: 'Operations',
    author: 'Codex OS',
    is_official: true,
    is_beta: false,
    features: [
      'GPS vehicle tracking',
      'Maintenance scheduling and reminders',
      'Fuel consumption monitoring',
      'Route optimization and dispatch'
    ],
    entities: ['Vehicle', 'Driver', 'MaintenanceRecord', 'FuelLog', 'TripRecord'],
    permissions: ['entities:Vehicle:*', 'entities:Driver:*', 'integrations:googlemaps:use'],
    price_monthly: 34.99,
    price_yearly: 349.99
  }
];

export default function Extensions() {
  const navigate = useNavigate();
  const [extensions, setExtensions] = useState([]);
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
      const data = await base44.entities.Extension.list();
      setExtensions(data);
      setLoading(false);
    };
    load();
  }, [isAuthorized]);

  const handleInstall = async (extension) => {
    try {
      // Check if already installed
      const existing = extensions.find(e => e.slug === extension.slug);
      if (existing && existing.status === 'Installed') {
        toast.info('Extension already installed');
        return;
      }

      if (existing && existing.status === 'Disabled') {
        // Re-enable
        await base44.entities.Extension.update(existing.id, { status: 'Installed' });
        setExtensions(prev => prev.map(e => e.id === existing.id ? { ...e, status: 'Installed' } : e));
        toast.success(`${extension.name} enabled successfully`);
        return;
      }

      // Install new extension
      const newExtension = await base44.entities.Extension.create({
        company_id: (await base44.functions.invoke('getCurrentCompany')).id,
        name: extension.name,
        slug: extension.slug,
        version: extension.version,
        description: extension.description,
        category: extension.category,
        status: 'Installed',
        installed_at: new Date().toISOString(),
        config: {},
        permissions: extension.permissions,
        dependencies: extension.dependencies || [],
        author: extension.author,
        is_official: extension.is_official,
        is_beta: extension.is_beta
      });

      setExtensions(prev => [...prev, newExtension]);
      toast.success(`${extension.name} installed successfully`);

      // TODO: Run extension setup scripts
      // await base44.functions.invoke(`${extension.slug}Setup`, { company_id: company.id });

    } catch (error) {
      console.error('Install error:', error);
      toast.error(`Failed to install ${extension.name}: ${error.message}`);
    }
  };

  const handleUninstall = async (extension) => {
    if (!confirm(`Are you sure you want to uninstall ${extension.name}? This will remove all extension data.`)) {
      return;
    }

    try {
      await base44.entities.Extension.delete(extension.id);
      setExtensions(prev => prev.filter(e => e.id !== extension.id));
      toast.success(`${extension.name} uninstalled successfully`);
    } catch (error) {
      console.error('Uninstall error:', error);
      toast.error(`Failed to uninstall ${extension.name}: ${error.message}`);
    }
  };

  const handleConfigure = async (extension) => {
    toast.info(`Configuration for ${extension.name} - Coming soon`);
    // TODO: Navigate to extension-specific configuration page
    // navigate(`/extensions/${extension.slug}/settings`);
  };

  const handleDisable = async (extension) => {
    try {
      await base44.entities.Extension.update(extension.id, { status: 'Disabled' });
      setExtensions(prev => prev.map(e => e.id === extension.id ? { ...e, status: 'Disabled' } : e));
      toast.success(`${extension.name} disabled`);
    } catch (error) {
      console.error('Disable error:', error);
      toast.error(`Failed to disable ${extension.name}: ${error.message}`);
    }
  };

  const filteredExtensions = AVAILABLE_EXTENSIONS.filter(ext => {
    const matchesCategory = selectedCategory === 'all' || ext.category === selectedCategory;
    const matchesSearch = ext.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ext.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }).map(ext => {
    const existing = extensions.find(e => e.slug === ext.slug);
    return {
      ...ext,
      status: existing?.status || 'Not Installed',
      installed_at: existing?.installed_at,
      usage_count: existing?.usage_count || 0,
      id: existing?.id
    };
  });

  if (!isAuthorized) return null;
  if (loading) return <div className="p-6 text-center text-gray-400">Caricamento...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Extension System</h1>
          <p className="text-sm text-gray-500 mt-0.5">Modular functionality for your business</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/integrations')} className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            <Cloud className="w-3.5 h-3.5" /> Integrations
          </button>
          <button onClick={() => navigate('/workflows')} className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            <Zap className="w-3.5 h-3.5" /> Workflows
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Installed" value={extensions.filter(e => e.status === 'Installed').length} icon={Package} color="#10B981" />
        <StatCard label="Available" value={AVAILABLE_EXTENSIONS.length} icon={Cloud} color="#1147FF" />
        <StatCard label="Disabled" value={extensions.filter(e => e.status === 'Disabled').length} icon={Zap} color="#F59E0B" />
        <StatCard label="Official" value={AVAILABLE_EXTENSIONS.filter(e => e.is_official).length} icon={Shield} color="#8B5CF6" />
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
              placeholder="Cerca estensioni..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {EXTENSION_CATEGORIES.map(cat => {
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

      {/* Extension Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredExtensions.map((extension, idx) => (
          <ExtensionCard
            key={idx}
            extension={extension}
            onInstall={handleInstall}
            onUninstall={handleUninstall}
            onConfigure={handleConfigure}
            onDisable={handleDisable}
          />
        ))}
      </div>

      {filteredExtensions.length === 0 && (
        <div className="text-center py-12">
          <Cloud className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Nessuna estensione trovata</p>
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