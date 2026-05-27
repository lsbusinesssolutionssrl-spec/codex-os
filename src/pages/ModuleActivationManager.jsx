import { useState, useEffect } from 'react';
import { Zap, CheckCircle, XCircle, Clock, AlertTriangle, Settings, TrendingUp, Brain, Shield, Bot } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { MODULE_REGISTRY, MODULE_STATUS, canAccessModule, getModuleReadiness } from '@/lib/moduleRegistry';
import { useGlobalContext } from '@/lib/GlobalContextEngine';

const MODULE_ICONS = {
  FolderKanban: Zap,
  Users: Zap,
  FileText: Zap,
  Archive: Zap,
  Home: Zap,
  TrendingUp: TrendingUp,
  Brain: Brain,
  Shield: Shield,
  Zap: Zap,
  Bot: Bot,
  Clock: Zap,
  Users2: Zap,
  Package: Zap,
  BookOpen: Zap,
};

export default function ModuleActivationManager() {
  const { activeTenant, activeTenantRole, enabledModules } = useGlobalContext();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataStats, setDataStats] = useState({});

  useEffect(() => {
    if (!activeTenant) return;
    loadModules();
  }, [activeTenant]);

  const loadModules = async () => {
    setLoading(true);
    try {
      // Load data stats for readiness check
      const [projects, costs, timesheets, clients, properties] = await Promise.all([
        base44.entities.Project.filter({ company_id: activeTenant.id }),
        base44.entities.ProjectCost.filter({ company_id: activeTenant.id }),
        base44.entities.Timesheet.filter({ company_id: activeTenant.id }),
        base44.entities.Client.filter({ company_id: activeTenant.id }),
        base44.entities.Property.filter({ company_id: activeTenant.id }),
      ]);

      setDataStats({
        projects: projects.length,
        project_costs: costs.length,
        timesheets: timesheets.length,
        clients: clients.length,
        properties: properties.length,
      });

      // Build module list with status
      const tenantModules = Object.values(MODULE_REGISTRY)
        .filter(m => !m.is_platform_module)
        .map(moduleConfig => {
          const isEnabled = enabledModules.includes(moduleConfig.module_id);
          const status = isEnabled ? getModuleReadiness(moduleConfig, dataStats) : MODULE_STATUS.INACTIVE;
          
          return {
            ...moduleConfig,
            isEnabled,
            status,
          };
        });

      setModules(tenantModules);
    } catch (error) {
      console.error('Error loading modules:', error);
      toast.error('Errore nel caricamento moduli');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleModule = async (module) => {
    if (!['tenant_admin'].includes(activeTenantRole)) {
      toast.error('Solo i tenant admin possono gestire i moduli');
      return;
    }

    try {
      if (module.isEnabled) {
        // Disable module
        await base44.entities.TenantFeatureFlag.update(
          module.module_id,
          { enabled: false }
        );
        toast.success(`${module.display_name} disabilitato`);
      } else {
        // Enable module - check plan first
        const subscription = await base44.entities.CompanySubscription.filter({ company_id: activeTenant.id }).then(r => r[0]);
        const plan = subscription?.plan_id ? 
          await base44.entities.SubscriptionPlan.get(subscription.plan_id).catch(() => null) : null;
        
        const planTier = plan?.name?.toLowerCase().includes('enterprise') ? 'enterprise' :
                        plan?.name?.toLowerCase().includes('professional') ? 'professional' : 'starter';
        
        const planOrder = ['starter', 'professional', 'enterprise'];
        const requiredIndex = planOrder.indexOf(module.required_plan);
        const userIndex = planOrder.indexOf(planTier);
        
        if (userIndex < requiredIndex) {
          toast.error(`Modulo richiede piano ${module.required_plan}`);
          return;
        }

        // Enable feature flag
        await base44.entities.TenantFeatureFlag.create({
          company_id: activeTenant.id,
          feature_name: module.module_id === 'intelligence' ? 'advanced_analytics' : 
                       module.module_id === 'financial_control' ? 'financial_control' :
                       module.module_id === 'guardian' ? 'guardian' :
                       module.module_id === 'workflows' ? 'workflow_automation' : module.module_id,
          enabled: true,
          plan_required: module.required_plan,
        });
        
        toast.success(`${module.display_name} abilitato`);
      }
      
      loadModules();
    } catch (error) {
      toast.error('Errore: ' + error.message);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case MODULE_STATUS.ACTIVE:
        return { label: 'Attivo', color: 'text-green-600 bg-green-50', icon: CheckCircle };
      case MODULE_STATUS.ONBOARDING:
        return { label: 'Onboarding', color: 'text-orange-600 bg-orange-50', icon: Clock };
      case MODULE_STATUS.INACTIVE:
        return { label: 'Inattivo', color: 'text-gray-600 bg-gray-100', icon: XCircle };
      case MODULE_STATUS.DEGRADED:
        return { label: 'Degradato', color: 'text-red-600 bg-red-50', icon: AlertTriangle };
      default:
        return { label: 'Unknown', color: 'text-gray-600 bg-gray-100', icon: XCircle };
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center text-gray-400">Caricamento moduli...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestione Moduli</h1>
          <p className="text-sm text-gray-500">Attiva e configura i moduli per {activeTenant?.name}</p>
        </div>
        {activeTenantRole !== 'tenant_admin' && (
          <div className="px-3 py-1.5 text-xs font-medium text-orange-700 bg-orange-50 rounded-lg">
            Solo i tenant admin possono modificare i moduli
          </div>
        )}
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((module) => {
          const statusConfig = getStatusConfig(module.status);
          const Icon = MODULE_ICONS[module.icon] || Zap;
          
          return (
            <div key={module.module_id} className="bg-white rounded-xl border border-gray-200 p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${module.color || '#1147FF'}15` }}>
                    <Icon className="w-5 h-5" style={{ color: module.color || '#1147FF' }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{module.display_name}</h3>
                    <p className="text-xs text-gray-500">{module.description}</p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${statusConfig.color}`}>
                  <statusConfig.icon className="w-3 h-3" />
                  {statusConfig.label}
                </span>
              </div>

              {/* Requirements */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Piano richiesto:</span>
                  <span className={`font-medium ${
                    module.required_plan === 'enterprise' ? 'text-purple-600' :
                    module.required_plan === 'professional' ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    {module.required_plan}
                  </span>
                </div>
                
                {module.dependencies.length > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Dipendenze:</span>
                    <span className="text-gray-600">{module.dependencies.join(', ')}</span>
                  </div>
                )}

                {module.status === MODULE_STATUS.ONBOARDING && (
                  <div className="p-2 bg-orange-50 border border-orange-100 rounded-lg">
                    <p className="text-xs text-orange-800 font-medium">
                      Requisiti mancanti: {module.data_requirements.filter(r => !dataStats[r] || dataStats[r] === 0).join(', ')}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <button
                onClick={() => handleToggleModule(module)}
                disabled={activeTenantRole !== 'tenant_admin'}
                className={`w-full py-2 text-sm font-semibold rounded-lg transition-colors ${
                  module.isEnabled
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                } ${activeTenantRole !== 'tenant_admin' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {module.isEnabled ? 'Disabilita Modulo' : 'Abilita Modulo'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}