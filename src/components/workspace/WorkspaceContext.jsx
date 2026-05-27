import { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const WorkspaceContext = createContext(null);

const WORKSPACE_CONFIG = {
  super_admin: {
    id: 'super_admin',
    name: 'Platform',
    icon: 'Shield',
    description: 'Enterprise system controls',
    color: '#7C3AED',
  },
  executive: {
    id: 'executive',
    name: 'Executive',
    icon: 'Crown',
    description: 'Strategic oversight',
    color: '#F59E0B',
  },
  operations: {
    id: 'operations',
    name: 'Operations',
    icon: 'Activity',
    description: 'Project coordination',
    color: '#1147FF',
  },
  technician: {
    id: 'technician',
    name: 'Field',
    icon: 'Wrench',
    description: 'Field operations',
    color: '#10B981',
  },
  sales: {
    id: 'sales',
    name: 'Sales',
    icon: 'TrendingUp',
    description: 'Commercial pipeline',
    color: '#F58020',
  },
  financial: {
    id: 'financial',
    name: 'Financial',
    icon: 'DollarSign',
    description: 'Financial operations',
    color: '#06B6D4',
  },
  guardian: {
    id: 'guardian',
    name: 'Guardian',
    icon: 'Shield',
    description: 'Lifecycle management',
    color: '#8B5CF6',
  },
};

export function WorkspaceProvider({ children }) {
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [availableWorkspaces, setAvailableWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await base44.auth.me();
        const role = user?.role || 'user';
        setUserRole(role);

        // Map roles to available workspaces
        const workspaces = [];
        
        if (role === 'admin') {
          workspaces.push('super_admin', 'executive', 'operations', 'financial', 'guardian');
        } else if (role === 'company_admin') {
          workspaces.push('executive', 'operations', 'financial', 'sales', 'guardian');
        } else if (role === 'project_manager') {
          workspaces.push('operations', 'financial');
        } else if (role === 'technician') {
          workspaces.push('technician');
        } else if (role === 'sales') {
          workspaces.push('sales');
        } else {
          workspaces.push('executive');
        }

        setAvailableWorkspaces(workspaces);
        
        // Set default workspace
        if (workspaces.length > 0) {
          const defaultWs = workspaces[0];
          const saved = localStorage.getItem(`workspace_${user?.email}`);
          const initialWs = saved && workspaces.includes(saved) ? saved : defaultWs;
          setCurrentWorkspace(initialWs);
        }
      } catch (error) {
        console.error('Workspace init error:', error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const switchWorkspace = (workspaceId) => {
    if (availableWorkspaces.includes(workspaceId)) {
      const user = base44.auth.me();
      localStorage.setItem(`workspace_${user?.email}`, workspaceId);
      setCurrentWorkspace(workspaceId);
    }
  };

  const config = WORKSPACE_CONFIG[currentWorkspace] || WORKSPACE_CONFIG.executive;

  return (
    <WorkspaceContext.Provider value={{
      currentWorkspace,
      userRole,
      availableWorkspaces,
      config,
      switchWorkspace,
      loading,
      getWorkspaceConfig: (id) => WORKSPACE_CONFIG[id],
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return context;
};