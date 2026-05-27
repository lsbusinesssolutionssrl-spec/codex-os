/**
 * Module Registry - Central system for module definitions
 * Every module must be registered here with full metadata
 */

export const MODULE_REGISTRY = {
  // CORE MODULES (always available)
  projects: {
    module_id: 'projects',
    display_name: 'Progetti',
    display_name_en: 'Projects',
    route: '/projects',
    icon: 'FolderKanban',
    required_plan: 'starter',
    required_permissions: [],
    dependencies: [],
    enabled_by_default: true,
    onboarding_steps: [],
    data_requirements: [],
    description: 'Gestione progetti e cantieri',
  },
  
  clients: {
    module_id: 'clients',
    display_name: 'Clienti',
    display_name_en: 'Clients',
    route: '/clients',
    icon: 'Users',
    required_plan: 'starter',
    required_permissions: [],
    dependencies: [],
    enabled_by_default: true,
    onboarding_steps: [],
    data_requirements: [],
    description: 'CRM e gestione clienti',
  },
  
  estimates: {
    module_id: 'estimates',
    display_name: 'Preventivi',
    display_name_en: 'Estimates',
    route: '/estimates',
    icon: 'FileText',
    required_plan: 'starter',
    required_permissions: [],
    dependencies: ['clients', 'properties'],
    enabled_by_default: true,
    onboarding_steps: [],
    data_requirements: [],
    description: 'Preventivi e sopralluoghi',
  },
  
  documents: {
    module_id: 'documents',
    display_name: 'Documenti',
    display_name_en: 'Documents',
    route: '/documents',
    icon: 'Archive',
    required_plan: 'starter',
    required_permissions: [],
    dependencies: [],
    enabled_by_default: true,
    onboarding_steps: [],
    data_requirements: [],
    description: 'Archivio documentale',
  },
  
  properties: {
    module_id: 'properties',
    display_name: 'Home Passport',
    display_name_en: 'Properties',
    route: '/properties',
    icon: 'Home',
    required_plan: 'starter',
    required_permissions: [],
    dependencies: ['clients'],
    enabled_by_default: true,
    onboarding_steps: [],
    data_requirements: [],
    description: 'Portafoglio immobili',
  },
  
  // PREMIUM MODULES
  financial_control: {
    module_id: 'financial_control',
    display_name: 'Controllo Finanziario',
    display_name_en: 'Financial Control',
    route: '/financial-control',
    icon: 'TrendingUp',
    required_plan: 'professional',
    required_permissions: ['can_view_financials'],
    dependencies: ['projects', 'timesheets'],
    enabled_by_default: false,
    onboarding_steps: [
      'enable_timesheets',
      'create_first_project',
      'log_costs',
    ],
    data_requirements: ['projects', 'project_costs', 'timesheets'],
    description: 'Analisi margini e controllo costi',
  },
  
  intelligence: {
    module_id: 'intelligence',
    display_name: 'Business Intelligence',
    display_name_en: 'Business Intelligence',
    route: '/intelligence',
    icon: 'Brain',
    required_plan: 'enterprise',
    required_permissions: ['can_view_financials'],
    dependencies: ['projects', 'financial_control'],
    enabled_by_default: false,
    onboarding_steps: [
      'enable_financial_control',
      'min_5_projects',
      'enable_timesheets',
    ],
    data_requirements: ['projects', 'project_costs', 'timesheets', 'clients'],
    description: 'AI insights e analisi predittiva',
  },
  
  guardian: {
    module_id: 'guardian',
    display_name: 'Guardian',
    display_name_en: 'Guardian',
    route: '/guardian',
    icon: 'Shield',
    required_plan: 'professional',
    required_permissions: [],
    dependencies: ['properties', 'clients'],
    enabled_by_default: false,
    onboarding_steps: [
      'create_property',
      'configure_monitoring',
    ],
    data_requirements: ['properties', 'clients'],
    description: 'Monitoraggio predittivo immobili',
  },
  
  workflows: {
    module_id: 'workflows',
    display_name: 'Workflows',
    display_name_en: 'Workflows',
    route: '/workflows',
    icon: 'Zap',
    required_plan: 'enterprise',
    required_permissions: ['can_manage_team'],
    dependencies: ['projects'],
    enabled_by_default: false,
    onboarding_steps: [
      'create_first_workflow',
      'assign_team',
    ],
    data_requirements: ['projects', 'team'],
    description: 'Automazione processi aziendali',
  },
  
  ai_copilot: {
    module_id: 'ai_copilot',
    display_name: 'AI Copilot',
    display_name_en: 'AI Copilot',
    route: '/ai',
    icon: 'Bot',
    required_plan: 'professional',
    required_permissions: [],
    dependencies: [],
    enabled_by_default: false,
    onboarding_steps: [],
    data_requirements: [],
    description: 'Assistente AI per operazioni',
  },
  
  timesheets: {
    module_id: 'timesheets',
    display_name: 'Timesheet',
    display_name_en: 'Timesheets',
    route: '/timesheets',
    icon: 'Clock',
    required_plan: 'starter',
    required_permissions: [],
    dependencies: ['projects'],
    enabled_by_default: true,
    onboarding_steps: ['create_first_timesheet'],
    data_requirements: ['projects', 'team'],
    description: 'Tracciamento ore e risorse',
  },
  
  suppliers: {
    module_id: 'suppliers',
    display_name: 'Fornitori',
    display_name_en: 'Suppliers',
    route: '/suppliers',
    icon: 'Users2',
    required_plan: 'starter',
    required_permissions: [],
    dependencies: [],
    enabled_by_default: true,
    onboarding_steps: [],
    data_requirements: [],
    description: 'Gestione fornitori e acquisti',
  },
  
  purchase_orders: {
    module_id: 'purchase_orders',
    display_name: 'Ordini di Acquisto',
    display_name_en: 'Purchase Orders',
    route: '/purchase-orders',
    icon: 'Package',
    required_plan: 'professional',
    required_permissions: ['can_view_financials'],
    dependencies: ['suppliers', 'projects'],
    enabled_by_default: false,
    onboarding_steps: ['create_first_po'],
    data_requirements: ['suppliers', 'projects'],
    description: 'Gestione acquisti e ordini',
  },
  
  knowledge_base: {
    module_id: 'knowledge_base',
    display_name: 'Knowledge Base',
    display_name_en: 'Knowledge Base',
    route: '/knowledge-base',
    icon: 'BookOpen',
    required_plan: 'professional',
    required_permissions: [],
    dependencies: ['projects'],
    enabled_by_default: false,
    onboarding_steps: ['document_first_project'],
    data_requirements: ['projects'],
    description: 'Lessons learned e best practice',
  },
  
  // PLATFORM MODULES (admin only)
  platform_tenant_management: {
    module_id: 'platform_tenant_management',
    display_name: 'Gestione Tenant',
    display_name_en: 'Tenant Management',
    route: '/platform/tenants',
    icon: 'Building2',
    required_plan: 'platform',
    required_permissions: ['platform:super_admin'],
    dependencies: [],
    enabled_by_default: false,
    onboarding_steps: [],
    data_requirements: [],
    description: 'Gestione tenant platform',
    is_platform_module: true,
  },
  
  platform_saas_plans: {
    module_id: 'platform_saas_plans',
    display_name: 'Piani SaaS',
    display_name_en: 'SaaS Plans',
    route: '/saas-plans-admin',
    icon: 'CreditCard',
    required_plan: 'platform',
    required_permissions: ['platform:super_admin'],
    dependencies: [],
    enabled_by_default: false,
    onboarding_steps: [],
    data_requirements: [],
    description: 'Configurazione piani subscription',
    is_platform_module: true,
  },
  
  platform_system_health: {
    module_id: 'platform_system_health',
    display_name: 'System Health',
    display_name_en: 'System Health',
    route: '/system-status',
    icon: 'Activity',
    required_plan: 'platform',
    required_permissions: ['platform:super_admin'],
    dependencies: [],
    enabled_by_default: false,
    onboarding_steps: [],
    data_requirements: [],
    description: 'Monitoraggio salute platform',
    is_platform_module: true,
  },
};

export const MODULE_STATUS = {
  INACTIVE: 'inactive',
  ONBOARDING: 'onboarding',
  ACTIVE: 'active',
  DEGRADED: 'degraded',
  ERROR: 'error',
};

export const PLAN_TIERS = {
  STARTER: 'starter',
  PROFESSIONAL: 'professional',
  ENTERPRISE: 'enterprise',
  PLATFORM: 'platform',
};

/**
 * Check if user can access a module
 */
export const canAccessModule = (user, moduleConfig, enabledModules = []) => {
  if (!moduleConfig) return false;
  
  // Platform modules require platform role
  if (moduleConfig.is_platform_module) {
    return user?.platform_role === 'super_admin' || user?.platform_role === 'developer';
  }
  
  // Check if module is enabled
  if (!enabledModules.includes(moduleConfig.module_id)) {
    return false;
  }
  
  // Check plan tier
  const userPlanTier = user?.subscription?.plan_tier || 'starter';
  const planOrder = ['starter', 'professional', 'enterprise', 'platform'];
  const requiredIndex = planOrder.indexOf(moduleConfig.required_plan);
  const userIndex = planOrder.indexOf(userPlanTier);
  
  if (userIndex < requiredIndex) {
    return false;
  }
  
  // Check permissions
  if (moduleConfig.required_permissions?.length > 0) {
    const hasAllPermissions = moduleConfig.required_permissions.every(
      perm => user?.permissions?.includes(perm)
    );
    if (!hasAllPermissions) {
      return false;
    }
  }
  
  return true;
};

/**
 * Get module readiness status
 */
export const getModuleReadiness = (moduleConfig, dataStats = {}) => {
  if (!moduleConfig) return MODULE_STATUS.ERROR;
  
  const { data_requirements, onboarding_steps } = moduleConfig;
  
  // Check data requirements
  const missingData = data_requirements.filter(
    req => !dataStats[req] || dataStats[req] === 0
  );
  
  if (missingData.length > 0) {
    return MODULE_STATUS.ONBOARDING;
  }
  
  // Check onboarding steps
  const incompleteSteps = onboarding_steps.filter(
    step => !dataStats[`completed_${step}`]
  );
  
  if (incompleteSteps.length > 0) {
    return MODULE_STATUS.ONBOARDING;
  }
  
  return MODULE_STATUS.ACTIVE;
};

/**
 * Get onboarding guidance for a module
 */
export const getModuleOnboardingGuidance = (moduleConfig, dataStats = {}) => {
  if (!moduleConfig) return null;
  
  const guidance = {
    module_id: moduleConfig.module_id,
    missing_data: [],
    incomplete_steps: [],
    next_action: null,
  };
  
  // Check data requirements
  moduleConfig.data_requirements?.forEach(req => {
    if (!dataStats[req] || dataStats[req] === 0) {
      guidance.missing_data.push(req);
    }
  });
  
  // Check onboarding steps
  moduleConfig.onboarding_steps?.forEach(step => {
    if (!dataStats[`completed_${step}`]) {
      guidance.incomplete_steps.push(step);
    }
  });
  
  // Determine next action
  if (guidance.missing_data.length > 0) {
    guidance.next_action = `create_${guidance.missing_data[0]}`;
  } else if (guidance.incomplete_steps.length > 0) {
    guidance.next_action = guidance.incomplete_steps[0];
  }
  
  return guidance;
};

export default MODULE_REGISTRY;