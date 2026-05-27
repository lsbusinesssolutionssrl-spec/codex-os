import { useState, useEffect } from 'react';
import { Zap, CheckCircle, XCircle, Lock, ArrowRight, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useGlobalContext } from '@/lib/GlobalContextEngine';
import { toast } from 'sonner';

const ALL_MODULES = [
  { id: 'core', label: 'Core', description: 'Progetti, Clienti, Preventivi, Documenti', alwaysEnabled: true },
  { id: 'guardian', label: 'Guardian', description: 'Manutenzione programmata e monitoraggio', icon: '🛡️' },
  { id: 'financial_control', label: 'Controllo Finanziario', description: 'Analisi costi, margini e flussi di cassa', icon: '📊' },
  { id: 'intelligence', label: 'Intelligence', description: 'Insight AI e analisi predittiva', icon: '🧠' },
  { id: 'workflows', label: 'Workflows', description: 'Automazione processi aziendali', icon: '⚡' },
  { id: 'ai_copilot', label: 'AI Copilot', description: 'Assistente AI per operazioni', icon: '🤖' },
];

export default function ModuleManagement() {
  const navigate = useNavigate();
  const { activeTenant, enabledModules, subscription } = useGlobalContext();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlan();
  }, []);

  const loadPlan = async () => {
    try {
      if (subscription?.plan_id) {
        const plans = await base44.entities.SubscriptionPlan.filter({ id: subscription.plan_id });
        if (plans.length > 0) setPlan(plans[0]);
      }
    } catch (error) {
      console.error('Error loading plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const getModuleStatus = (moduleId) => {
    if (ALL_MODULES.find(m => m.alwaysEnabled)?.id === moduleId) {
      return { status: 'active', label: 'Attivo', color: 'green' };
    }
    
    if (enabledModules.includes(moduleId)) {
      return { status: 'active', label: 'Attivo', color: 'green' };
    }

    const quotas = plan?.quotas || {};
    
    if (moduleId === 'guardian' && quotas.guardian_subscriptions > 0) {
      return { status: 'available', label: 'Disponibile', color: 'blue' };
    }
    
    if (moduleId === 'financial_control' && (quotas.custom_reports || quotas.financial_control)) {
      return { status: 'available', label: 'Disponibile', color: 'blue' };
    }
    
    if (moduleId === 'intelligence' && quotas.advanced_analytics) {
      return { status: 'available', label: 'Disponibile', color: 'blue' };
    }
    
    if (moduleId === 'workflows' && quotas.workflow_automation) {
      return { status: 'available', label: 'Disponibile', color: 'blue' };
    }
    
    if (moduleId === 'ai_copilot' && quotas.ai_requests_per_month > 0) {
      return { status: 'available', label: 'Disponibile', color: 'blue' };
    }

    return { status: 'locked', label: 'Non incluso', color: 'gray' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Moduli Attivi</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestisci funzionalità abilitate</p>
        </div>
        {plan && (
          <div className="px-3 py-1.5 text-xs font-medium text-white rounded-lg bg-purple-600">
            Piano: {plan.name}
          </div>
        )}
      </div>

      {/* Current Plan Info */}
      {plan && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <CreditCard className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-purple-900">{plan.name}</h3>
              <p className="text-xs text-purple-700 mt-1">{plan.description}</p>
              <div className="flex gap-2 mt-3 flex-wrap">
                <span className="px-2 py-1 text-xs font-medium bg-white rounded border border-purple-200">
                  €{plan.price_monthly}/mese
                </span>
                {plan.quotas?.max_users && (
                  <span className="px-2 py-1 text-xs font-medium bg-white rounded border border-purple-200">
                    {plan.quotas.max_users} utenti
                  </span>
                )}
                {plan.quotas?.max_projects && (
                  <span className="px-2 py-1 text-xs font-medium bg-white rounded border border-purple-200">
                    {plan.quotas.max_projects} progetti
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALL_MODULES.map(module => {
          const status = getModuleStatus(module.id);
          const isEnabled = status.status === 'active' || status.status === 'available';
          
          return (
            <div
              key={module.id}
              className={`p-4 rounded-xl border-2 transition-all ${
                isEnabled 
                  ? 'bg-white border-gray-200 hover:border-blue-300' 
                  : 'bg-gray-50 border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{module.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{module.label}</h3>
                    <p className="text-xs text-gray-500">{module.description}</p>
                  </div>
                </div>
                <StatusBadge status={status} />
              </div>
              
              {isEnabled ? (
                <button
                  onClick={() => navigate(`/${module.id === 'core' ? 'projects' : module.id.replace('_', '-')}`)}
                  className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Apri modulo <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Lock className="w-4 h-4" />
                  Upgrade richiesto
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Upgrade Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-amber-900">Moduli Non Inclusi</h3>
            <p className="text-xs text-amber-700 mt-1">
              Alcuni moduli richiedono un piano superiore. Contatta il supporto per upgrade: <a href="mailto:support@codexos.io" className="underline">support@codexos.io</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  if (status.status === 'active') {
    return (
      <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
        <CheckCircle className="w-3 h-3" />
        {status.label}
      </span>
    );
  }
  
  if (status.status === 'available') {
    return (
      <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
        <CheckCircle className="w-3 h-3" />
        {status.label}
      </span>
    );
  }
  
  return (
    <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-200 rounded-full">
      <XCircle className="w-3 h-3" />
      {status.label}
    </span>
  );
}