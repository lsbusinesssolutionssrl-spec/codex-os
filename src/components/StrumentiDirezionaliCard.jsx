import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, Brain, Shield, Users, FolderKanban, 
  BarChart3, AlertTriangle, Zap, Lock, CheckCircle,
  ArrowRight
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useGlobalContext } from '@/lib/GlobalContextEngine';
import { MODULE_REGISTRY, canAccessModule, getModuleReadiness, MODULE_STATUS } from '@/lib/moduleRegistry';
import { toast } from 'sonner';

// Mapping carte "Strumenti Direzionali" ai moduli
const STRUMENTI_DIREZIONALI = [
  {
    id: 'dashboard-direzionale',
    label: 'Dashboard Direzionale',
    module_id: null, // Core, sempre disponibile
    route: '/dashboard',
    icon: BarChart3,
    color: '#1147FF',
    description: 'Panoramica operativa in tempo reale',
  },
  {
    id: 'portfolio-progetti',
    label: 'Portfolio Progetti',
    module_id: 'projects',
    route: '/projects',
    icon: FolderKanban,
    color: '#0B2341',
    description: 'Stato avanzamento e marginalità',
  },
  {
    id: 'controllo-finanziario',
    label: 'Controllo Finanziario',
    module_id: 'financial_control',
    route: '/financial-control',
    icon: TrendingUp,
    color: '#10B981',
    description: 'Analisi costi e ricavi',
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    module_id: 'intelligence',
    route: '/intelligence',
    icon: Brain,
    color: '#7C3AED',
    description: 'AI insights predittivi',
  },
  {
    id: 'business-intelligence',
    label: 'Business Intelligence',
    module_id: 'intelligence',
    route: '/intelligence',
    icon: BarChart3,
    color: '#8B5CF6',
    description: 'Reportistica avanzata',
  },
  {
    id: 'insight-strategici',
    label: 'Insight Strategici',
    module_id: 'intelligence',
    route: '/executive-insights',
    icon: Zap,
    color: '#F59E0B',
    description: 'Analisi direzionale',
  },
  {
    id: 'performance-team',
    label: 'Performance Team',
    module_id: 'financial_control',
    route: '/timesheets',
    icon: Users,
    color: '#06B6D4',
    description: 'Produttività e ore',
  },
  {
    id: 'monitoraggio-rischi',
    label: 'Monitoraggio Rischi',
    module_id: 'intelligence',
    route: '/intelligence',
    icon: AlertTriangle,
    color: '#EF4444',
    description: 'Alert e rischi operativi',
  },
  {
    id: 'guardian',
    label: 'Guardian',
    module_id: 'guardian',
    route: '/guardian',
    icon: Shield,
    color: '#10B981',
    description: 'Monitoraggio predittivo',
  },
];

export default function StrumentiDirezionali() {
  const navigate = useNavigate();
  const { activeTenant, activeTenantRole, enabledModules } = useGlobalContext();
  const [cards, setCards] = useState([]);
  const [dataStats, setDataStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeTenant) return;
    loadCards();
  }, [activeTenant, enabledModules]);

  const loadCards = async () => {
    setLoading(true);
    try {
      // Load data stats for readiness
      const [projects, costs, timesheets, clients, guardians] = await Promise.all([
        base44.entities.Project.filter({ company_id: activeTenant.id }),
        base44.entities.ProjectCost.filter({ company_id: activeTenant.id }),
        base44.entities.Timesheet.filter({ company_id: activeTenant.id }),
        base44.entities.Client.filter({ company_id: activeTenant.id }),
        base44.entities.GuardianSubscription.filter({ company_id: activeTenant.id }),
      ]);

      const stats = {
        projects: projects.length,
        project_costs: costs.length,
        timesheets: timesheets.length,
        clients: clients.length,
        guardians: guardians.length,
      };
      setDataStats(stats);

      // Build cards with status
      const user = await base44.auth.me();
      const enrichedCards = STRUMENTI_DIREZIONALI.map(card => {
        const moduleConfig = card.module_id ? MODULE_REGISTRY[card.module_id] : null;
        
        // Check accessibility
        let status = 'active';
        let disabled = false;
        let badge = null;
        let clickAction = 'navigate';

        if (card.module_id && !enabledModules.includes(card.module_id)) {
          // Module not enabled
          status = 'disabled';
          disabled = true;
          badge = { label: 'Non incluso', color: 'bg-gray-100 text-gray-600' };
          clickAction = 'show_disabled';
        } else if (card.module_id) {
          // Module enabled - check readiness
          const readiness = getModuleReadiness(moduleConfig, stats);
          if (readiness === MODULE_STATUS.ONBOARDING) {
            status = 'onboarding';
            badge = { label: 'Dati insufficienti', color: 'bg-orange-100 text-orange-600' };
            clickAction = 'show_onboarding';
          } else if (readiness === MODULE_STATUS.ACTIVE) {
            status = 'active';
            badge = { label: 'Attivo', color: 'bg-green-100 text-green-600' };
          }
        }

        return {
          ...card,
          status,
          disabled,
          badge,
          clickAction,
          moduleConfig,
        };
      });

      setCards(enrichedCards);
    } catch (error) {
      console.error('Error loading cards:', error);
      toast.error('Errore nel caricamento strumenti');
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = async (card) => {
    if (card.clickAction === 'navigate') {
      navigate(card.route);
    } else if (card.clickAction === 'show_disabled') {
      // Show module not enabled message
      const planRequired = card.moduleConfig?.required_plan || 'professional';
      toast.error(
        `${card.label} richiede il piano ${planRequired}`,
        {
          description: 'Contatta il supporto per upgrade',
          action: {
            label: 'Impostazioni',
            onClick: () => navigate('/company-settings'),
          },
        }
      );
    } else if (card.clickAction === 'show_onboarding') {
      // Show onboarding guidance
      const missingData = card.moduleConfig?.data_requirements?.filter(
        req => !dataStats[req] || dataStats[req] === 0
      ) || [];
      
      toast.info(
        `${card.label}: Dati insufficienti`,
        {
          description: `Completa: ${missingData.join(', ')}`,
          action: {
            label: 'Crea Dati',
            onClick: () => {
              if (missingData.includes('projects')) navigate('/projects');
              else if (missingData.includes('timesheets')) navigate('/timesheets');
              else if (missingData.includes('project_costs')) navigate('/financial-control');
            },
          },
        }
      );
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-400">Caricamento...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Strumenti Direzionali</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(card => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card)}
            disabled={card.disabled && card.clickAction !== 'show_disabled'}
            className={`relative p-4 rounded-xl border text-left transition-all ${
              card.status === 'active' 
                ? 'bg-white border-gray-200 hover:shadow-lg hover:border-gray-300 cursor-pointer' 
                : card.status === 'onboarding'
                ? 'bg-orange-50 border-orange-200 cursor-pointer'
                : 'bg-gray-50 border-gray-200 cursor-not-allowed'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${card.color}15` }}
                >
                  <card.icon className="w-5 h-5" style={{ color: card.color }} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{card.label}</h3>
                  <p className="text-xs text-gray-500">{card.description}</p>
                </div>
              </div>
              {card.badge && (
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${card.badge.color}`}>
                  {card.badge.label}
                </span>
              )}
            </div>

            {/* Status indicator */}
            {card.status === 'active' && (
              <div className="flex items-center gap-2 text-xs text-green-600">
                <CheckCircle className="w-3 h-3" />
                <span>Operativo</span>
                <ArrowRight className="w-3 h-3 ml-auto" />
              </div>
            )}
            
            {card.status === 'onboarding' && (
              <div className="flex items-center gap-2 text-xs text-orange-600">
                <AlertTriangle className="w-3 h-3" />
                <span>Configurazione richiesta</span>
              </div>
            )}
            
            {card.status === 'disabled' && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Lock className="w-3 h-3" />
                <span>Richiede upgrade</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}