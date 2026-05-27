import { useTenant } from './TenantContext';

/**
 * Module Gate Component
 * 
 * Only renders children if the module is enabled for current tenant.
 * 
 * Usage:
 * <ModuleGate module="guardian">
 *   <GuardianNavButton />
 * </ModuleGate>
 */
export default function ModuleGate({ module, children, fallback = null }) {
  const { enabledModules, isPlatformMode } = useTenant();

  // Platform users see everything
  if (isPlatformMode) {
    return children;
  }

  // Core modules are always enabled
  const coreModules = ['core', 'projects', 'clients', 'documents', 'estimates', 'properties'];
  if (coreModules.includes(module)) {
    return children;
  }

  // Check if module is enabled
  if (enabledModules.includes(module)) {
    return children;
  }

  return fallback;
}

/**
 * Hook version for programmatic checks
 * 
 * Usage:
 * const { isEnabled } = useModule('guardian');
 */
export function useModule(moduleName) {
  const { enabledModules, isPlatformMode } = useTenant();

  const isEnabled = isPlatformMode || 
    ['core', 'projects', 'clients', 'documents', 'estimates', 'properties'].includes(moduleName) ||
    enabledModules.includes(moduleName);

  return { isEnabled };
}

/**
 * Check if current tenant has access to feature
 * 
 * Usage:
 * if (hasModuleAccess('guardian')) { ... }
 */
export function hasModuleAccess(moduleName) {
  // This is a convenience function for non-React code
  const stored = localStorage.getItem('enabled_modules');
  if (!stored) return false;
  
  const modules = JSON.parse(stored);
  const coreModules = ['core', 'projects', 'clients', 'documents', 'estimates', 'properties'];
  
  return coreModules.includes(moduleName) || modules.includes(moduleName);
}