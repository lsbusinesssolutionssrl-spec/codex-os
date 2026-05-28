import { useNavigate } from 'react-router-dom';
import { useGlobalContext } from '@/lib/GlobalContextEngine';
import SuperAdminWorkspace from '@/components/workspace/SuperAdminWorkspace';
import ExecutiveWorkspace from '@/components/workspace/ExecutiveWorkspace';
import OperationsWorkspace from '@/components/workspace/OperationsWorkspace';
import TechnicianWorkspace from '@/components/workspace/TechnicianWorkspace';
import SalesWorkspace from '@/components/workspace/SalesWorkspace';
import FinancialWorkspace from '@/components/workspace/FinancialWorkspace';
import GuardianWorkspace from '@/components/workspace/GuardianWorkspace';
import { useEffect } from 'react';

export default function WorkspaceRouter() {
  const { workspaceType, loading, activeTenantRole, isPlatformMode } = useGlobalContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    
    // Redirect Platform users to platform dashboard
    if (isPlatformMode) {
      navigate('/super-admin', { replace: true });
      return;
    }
    
    // Redirect Tenant Admin to dedicated console
    if (activeTenantRole === 'tenant_admin') {
      navigate('/app/admin/dashboard', { replace: true });
      return;
    }
    
    // CRITICAL: If workspaceType is undefined but we're not in platform mode, force platform dashboard
    if (!workspaceType && !isPlatformMode) {
      console.log('[WorkspaceRouter] No workspaceType, not platform mode - redirecting to platform');
      navigate('/super-admin', { replace: true });
      return;
    }
  }, [activeTenantRole, loading, navigate, isPlatformMode, workspaceType]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  // Tenant Admin redirected, show workspaces for other roles
  switch (workspaceType) {
    case 'super_admin':
      return <SuperAdminWorkspace />;
    case 'executive':
      return <ExecutiveWorkspace />;
    case 'operations':
      return <OperationsWorkspace />;
    case 'technician':
      return <TechnicianWorkspace />;
    case 'sales':
      return <SalesWorkspace />;
    case 'financial':
      return <FinancialWorkspace />;
    case 'guardian':
      return <GuardianWorkspace />;
    default:
      return <ExecutiveWorkspace />;
  }
}