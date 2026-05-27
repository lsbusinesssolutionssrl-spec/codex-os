import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Home, FileText, FolderKanban,
  CheckSquare, Shield, Archive, Users2, Bot, Menu, X, LogOut, Wifi, WifiOff, Ticket, CalendarDays, BarChart2, BookOpen, TrendingUp, Crown, Clock, Package, DollarSign, Brain, Database, Building2, CreditCard, ListTodo, Wrench, Activity, Bell, Zap, Command, Plus, Globe, Palette
} from 'lucide-react';

import { base44 } from '@/api/base44Client';
import NotificationBell from './NotificationBell';
import CodexLogo from './CodexLogo';
import GlobalSearch from './GlobalSearch';
import CommandPalette from './CommandPalette';
import QuickCreate from './QuickCreate';
import TenantSwitcher from './tenant/TenantSwitcher';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { useGlobalContext } from '@/lib/GlobalContextEngine';
import SessionDebugPanel from './SessionDebugPanel';
import ContextBanner from './tenant/ContextBanner';

// Tenant navigation - modules enabled dynamically based on plan
const TENANT_NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, label: 'Command Center', module: 'core' },
  { path: '/clients', label: 'Clienti', icon: Users, module: 'core' },
  { path: '/projects', label: 'Progetti', icon: FolderKanban, module: 'core' },
  { path: '/properties', label: 'Home Passport', icon: Home, module: 'core' },
  { path: '/estimates', label: 'Preventivi', icon: FileText, module: 'core' },
  { path: '/documents', label: 'Documenti', icon: Archive, module: 'core' },
  { path: '/guardian', label: 'Guardian', icon: Shield, module: 'guardian' },
  { path: '/financial-control', label: 'Controllo Finanziario', icon: TrendingUp, module: 'financial_control' },
  { path: '/ai', label: 'AI Copilot', icon: Bot, module: 'ai_copilot' },
  { path: '/intelligence', label: 'Intelligence', icon: Brain, module: 'intelligence' },
  { path: '/workflows', label: 'Workflows', icon: Zap, module: 'workflows' },
  { path: '/company-settings', label: 'Impostazioni', icon: Building2, module: 'core' },
];

// Platform navigation - only for Super Admin / Developer
const PLATFORM_NAV_ITEMS = [
  { path: '/super-admin', icon: Shield, label: 'Dashboard' },
  { path: '/tenant-onboarding', icon: Building2, label: 'Nuovo Tenant' },
  { path: '/saas-plans-admin', icon: CreditCard, label: 'Piani SaaS' },
  { path: '/platform-settings', icon: Shield, label: 'Impostazioni' },
  { path: '/brand-approval', icon: Palette, label: 'White Label' },
  { path: '/developer', icon: Database, label: 'Developer' },
  { path: '/integrations', icon: Globe, label: 'Integrazioni' },
  { path: '/system-status', icon: Activity, label: 'Stato Sistema' },
  { path: '/product-analytics', icon: TrendingUp, label: 'Analytics' },
];

const NAV_BY_ROLE = {
  admin: null, // all
  project_manager: ['/', '/projects', '/checklists', '/documents', '/calendar', '/report', '/team'],
  technician: ['/', '/projects', '/checklists', '/tickets'],
  sales: ['/', '/clients', '/properties', '/estimates', '/documents'],
  client: [],
};

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const { isOnline, queueCount } = useOfflineSync();
  const globalContext = useGlobalContext();
  const { activeTenant, isPlatformMode, loading: contextLoading, enabledModules } = globalContext;
  const [userRole, setUserRole] = useState(null);

  // All hooks must be called unconditionally at the top
  useEffect(() => {
    base44.auth.me().then(u => {
      setUserRole(u?.role);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setQuickCreateOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!userRole) return;
    if (userRole === 'client') {
      if (!location.pathname.startsWith('/portal')) navigate('/portal', { replace: true });
      return;
    }
    const allowed = NAV_BY_ROLE[userRole];
    if (!allowed) return;
    const ok = allowed.some(p => p === '/' ? location.pathname === '/' : location.pathname.startsWith(p));
    if (!ok) navigate('/', { replace: true });
  }, [userRole, location.pathname]);

  // Show loading while context initializes
  if (contextLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  const allowedPaths = userRole ? NAV_BY_ROLE[userRole] : null;
  
  // Determine which navigation to use
  const visibleNav = isPlatformMode ? PLATFORM_NAV_ITEMS : TENANT_NAV_ITEMS.filter(item => {
    // Module-based items only appear if enabled
    if (item.module && item.module !== 'core' && !enabledModules.includes(item.module)) {
      return false;
    }
    
    // Role-based filtering
    if (allowedPaths && !allowedPaths.includes(item.path)) {
      return false;
    }
    
    return true;
  });

  const isActive = (path) => path === '/'
    ? location.pathname === '/'
    : location.pathname.startsWith(path);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <ContextBanner />
      
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ backgroundColor: '#0B2341' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <CodexLogo />
          <button className="lg:hidden text-white/60 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {visibleNav.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive(item.path)
                  ? 'text-white shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/8'
              }`}
              style={isActive(item.path) ? { backgroundColor: '#1147FF' } : {}}
            >
              <item.icon size={17} className="flex-shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            {isOnline ? (
              <><Wifi className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400">Online</span></>
            ) : (
              <><WifiOff className="w-3.5 h-3.5 text-orange-400" /><span className="text-orange-400">Offline{queueCount > 0 ? ` · ${queueCount} in coda` : ''}</span></>
            )}
          </div>
          
          <div className="text-xs text-white/40 border-t border-white/10 pt-2 mt-2">
            {isPlatformMode ? (
              <div className="flex items-center gap-1.5">
                <Shield className="w-3 h-3" />
                <span>Platform Mode</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3 h-3" />
                <span>Tenant Workspace</span>
              </div>
            )}
          </div>
          
          <Link
            to="/company-settings"
            className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors"
          >
            <Building2 className="w-4 h-4" />
            Impostazioni
          </Link>
          <button
            onClick={() => base44.auth.logout()}
            className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between px-4 lg:px-6 h-14 bg-white border-b border-gray-200 flex-shrink-0">
          <button className="lg:hidden p-2 rounded-md text-gray-600" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Command className="w-4 h-4" />
            <span>Cerca...</span>
            <span className="text-xs text-gray-400 border border-gray-300 px-1.5 py-0.5 rounded">⌘K</span>
          </button>
          <button 
            onClick={() => setQuickCreateOpen(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-white rounded-lg hover:opacity-90 transition-opacity ml-2"
            style={{ backgroundColor: '#1147FF' }}
          >
            <Plus className="w-4 h-4" />
            <span>Crea</span>
            <span className="text-xs text-white/80 border border-white/30 px-1.5 py-0.5 rounded">⌘N</span>
          </button>
          <div className="flex-1" />
          {isPlatformMode && <TenantSwitcher />}
          {!isPlatformMode && activeTenant && (
            <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-lg">
              {activeTenant.logo_url ? (
                <img src={activeTenant.logo_url} alt="" className="w-4 h-4 object-contain" />
              ) : (
                <div 
                  className="w-4 h-4 rounded flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: activeTenant.brand_color_primary || '#1147FF' }}
                >
                  {activeTenant.name?.[0]?.toUpperCase()}
                </div>
              )}
              <span className="font-medium">{activeTenant.name}</span>
            </div>
          )}
          <NotificationBell />
        </header>
        <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
        <QuickCreate isOpen={quickCreateOpen} onClose={() => setQuickCreateOpen(false)} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
        <SessionDebugPanel />
      </div>
    </div>
  );
}