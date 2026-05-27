import { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const TenantContext = createContext(null);

export function TenantProvider({ children }) {
  const [activeTenant, setActiveTenant] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [user, setUser] = useState(null);
  const [enabledModules, setEnabledModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPlatformMode, setIsPlatformMode] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await base44.auth.me();
        if (!user) {
          setLoading(false);
          return;
        }

        setUser(user);
        setUserRole(user.role);

        // Platform mode: only for Super Admin / Developer
        const isPlatform = ['admin', 'developer'].includes(user.role);
        setIsPlatformMode(isPlatform);

        if (isPlatform) {
          // Platform users don't have a tenant context by default
          // They can switch to tenant view later
          setActiveTenant(null);
          setEnabledModules([]);
        } else {
          // Tenant users MUST have a company_id
          const companyId = user.company_id;
          
          if (!companyId) {
            console.error('User has no company_id - this is a data integrity issue');
            toast.error('Errore: utente non associato a nessun tenant');
            setLoading(false);
            return;
          }

          // Load tenant company
          const company = await base44.entities.Company.get(companyId);
          setActiveTenant(company);

          // Load subscription and enabled modules
          const subscription = await base44.entities.CompanySubscription.filter(
            { company_id: companyId, status: 'active' },
            '-created_date',
            1
          ).then(subs => subs[0] || null);

          if (subscription) {
            const plan = await base44.entities.SubscriptionPlan.get(subscription.plan_id);
            
            // Extract enabled modules from plan quotas/features
            const modules = extractModulesFromPlan(plan);
            setEnabledModules(modules);
          } else {
            // Default modules for tenants without subscription
            setEnabledModules(['projects', 'estimates', 'clients', 'documents']);
          }
        }
      } catch (error) {
        console.error('Tenant context init error:', error);
        toast.error('Errore nel caricamento contesto tenant');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  return (
    <TenantContext.Provider value={{
      activeTenant,
      userRole,
      user,
      enabledModules,
      loading,
      isPlatformMode,
      // Platform users can switch to tenant view
      switchToTenant: (companyId) => {
        // Only platform users can switch tenants
        if (!isPlatformMode) {
          toast.error('Solo gli amministratori possono cambiare tenant');
          return;
        }
        // This would be implemented with a tenant switcher UI
        localStorage.setItem('impersonate_tenant_id', companyId);
        window.location.reload();
      },
    }}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
};

// Extract enabled modules from plan features
function extractModulesFromPlan(plan) {
  if (!plan) return ['projects', 'estimates', 'clients', 'documents'];

  const modules = ['projects', 'estimates', 'clients', 'documents']; // Always available

  // Guardian module
  if (plan.quotas?.guardian_subscriptions > 0) {
    modules.push('guardian');
  }

  // Financial Control
  if (plan.quotas?.custom_reports || plan.features?.includes('financial_control')) {
    modules.push('financial_control');
  }

  // AI Copilot
  if (plan.quotas?.ai_requests_per_month > 0) {
    modules.push('ai_copilot');
  }

  // Intelligence
  if (plan.features?.includes('advanced_analytics')) {
    modules.push('intelligence');
  }

  // Workflow Engine
  if (plan.features?.includes('workflow_automation')) {
    modules.push('workflows');
  }

  // White Label
  if (plan.features?.includes('white_label')) {
    modules.push('white_label');
  }

  // API Access
  if (plan.features?.includes('api_access')) {
    modules.push('api_access');
  }

  return modules;
}