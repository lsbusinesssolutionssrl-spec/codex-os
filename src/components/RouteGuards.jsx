import { Navigate } from 'react-router-dom';
import { useGlobalContext } from '@/lib/GlobalContextEngine';

/**
 * PLATFORM ROUTE GUARD
 * Blocks access to platform routes for non-platform users
 */
export function PlatformRouteGuard({ children }) {
  const { platformRole, contextType } = useGlobalContext();
  
  const PLATFORM_ROLES = ['admin', 'developer'];
  const isPlatformUser = PLATFORM_ROLES.includes(platformRole);
  
  if (!isPlatformUser || contextType === 'tenant') {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

/**
 * TENANT ROUTE GUARD
 * Blocks access to tenant routes for platform-only users
 */
export function TenantRouteGuard({ children }) {
  const { contextType, activeTenant } = useGlobalContext();
  
  if (contextType === 'platform' && !activeTenant) {
    return <Navigate to="/platform-settings" replace />;
  }
  
  return children;
}