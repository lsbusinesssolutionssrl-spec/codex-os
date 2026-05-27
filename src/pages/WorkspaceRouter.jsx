import { useGlobalContext } from '@/lib/GlobalContextEngine';
import SuperAdminWorkspace from '@/components/workspace/SuperAdminWorkspace';
import ExecutiveWorkspace from '@/components/workspace/ExecutiveWorkspace';
import OperationsWorkspace from '@/components/workspace/OperationsWorkspace';
import TechnicianWorkspace from '@/components/workspace/TechnicianWorkspace';
import SalesWorkspace from '@/components/workspace/SalesWorkspace';
import FinancialWorkspace from '@/components/workspace/FinancialWorkspace';
import GuardianWorkspace from '@/components/workspace/GuardianWorkspace';

export default function WorkspaceRouter() {
  const { workspaceType, loading } = useGlobalContext();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

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