import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Home, FileText, FolderKanban,
  CheckSquare, Shield, Archive, Users2, Bot, Menu, X, LogOut, Wifi, WifiOff, Ticket, CalendarDays, BarChart2, BookOpen, TrendingUp, Crown, Clock, Package, DollarSign, Brain, Database, Building2, CreditCard, ListTodo, Wrench, Activity, Bell, Zap
} from 'lucide-react';

import { base44 } from '@/api/base44Client';
import NotificationBell from './NotificationBell';
import CodexLogo from './CodexLogo';
import GlobalSearch from './GlobalSearch';
import { useOfflineSync } from '../hooks/useOfflineSync';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/clients', icon: Users, label: 'Clienti' },
  { path: '/properties', icon: Home, label: 'Home Passport' },
  { path: '/estimates', icon: FileText, label: 'Preventivi' },
  { path: '/projects', icon: FolderKanban, label: 'Progetti' },
  { path: '/checklists', icon: CheckSquare, label: 'Checklist' },
  { path: '/guardian', icon: Shield, label: 'Guardian' },
  { path: '/tickets', icon: Ticket, label: 'Ticket' },
  { path: '/documents', icon: Archive, label: 'Documenti' },
  { path: '/team', icon: Users2, label: 'Team' },
  { path: '/ai', icon: Bot, label: 'Codex AI' },
  { path: '/calendar', icon: CalendarDays, label: 'Calendario' },
  { path: '/report', icon: BarChart2, label: 'Report' },
  { path: '/sop', icon: BookOpen, label: 'SOP Templates' },
  { path: '/financial-control', icon: TrendingUp, label: 'Controllo Finanziario', roles: ['admin'] },
  { path: '/ceo-dashboard', icon: Crown, label: 'CEO Dashboard', roles: ['admin'] },
  { path: '/suppliers', icon: Users2, label: 'Fornitori' },
  { path: '/timesheets', icon: Clock, label: 'Timesheet' },
  { path: '/purchase-orders', icon: Package, label: 'Ordini Acquisto' },
  { path: '/cash-flow', icon: DollarSign, label: 'Cash Flow', roles: ['admin'] },
  { path: '/intelligence', icon: Brain, label: 'Codex Intelligence', roles: ['admin'] },
  { path: '/knowledge-base', icon: BookOpen, label: 'Knowledge Base', roles: ['admin'] },
  { path: '/ai-advisor', icon: Bot, label: 'AI Advisor', roles: ['admin'] },
  { path: '/executive-insights', icon: Crown, label: 'Executive Insights', roles: ['admin'] },
  { path: '/architecture-review', icon: Database, label: 'Architecture Review', roles: ['admin'] },
  { path: '/company-settings', icon: Building2, label: 'Company Settings', roles: ['company_admin', 'admin'] },
  { path: '/subscription-plans', icon: CreditCard, label: 'Piani Subscription', roles: ['company_admin', 'admin'] },
  { path: '/permissions-test', icon: Shield, label: 'Permissions Test', roles: ['admin'] },
  { path: '/data-integrity', icon: Database, label: 'Data Integrity', roles: ['admin'] },
  { path: '/go-live-checklist', icon: CheckSquare, label: 'Go Live Checklist', roles: ['admin'] },
  { path: '/super-admin', icon: Shield, label: 'Super Admin', roles: ['admin'] },
  { path: '/api-keys', icon: Database, label: 'API Keys', roles: ['admin'] },
  { path: '/tasks', icon: ListTodo, label: 'Task' },
  { path: '/technician', icon: Wrench, label: 'Vista Tecnico' },
  { path: '/activity', icon: Activity, label: 'Activity Feed', roles: ['admin', 'company_admin', 'project_manager'] },
  { path: '/notifications', icon: Bell, label: 'Notifiche' },
  { path: '/maintenance', icon: Wrench, label: 'Manutenzioni Programmate' },
  { path: '/operations', icon: Zap, label: 'Operations Dashboard', roles: ['admin', 'company_admin', 'project_manager'] },
  { path: '/schedule', icon: CalendarDays, label: 'Scheduling' },
  { path: '/codex-ai', icon: Bot, label: 'Codex AI Core' },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isOnline, queueCount } = useOfflineSync();
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUserRole(u?.role);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!userRole) return;
    if (userRole === 'client') {
      if (!location.pathname.startsWith('/portal')) navigate('/portal', { replace: true });
      return;
    }
    const allowed = NAV_BY_ROLE[userRole];
    if (!allowed) return; // admin: tutto permesso
    const ok = allowed.some(p => p === '/' ? location.pathname === '/' : location.pathname.startsWith(p));
    if (!ok) navigate('/', { replace: true });
  }, [userRole, location.pathname]);

  const NAV_BY_ROLE = {
    admin: null, // all
    project_manager: ['/', '/projects', '/checklists', '/documents', '/calendar', '/report', '/team'],
    technician: ['/', '/projects', '/checklists', '/tickets'],
    sales: ['/', '/clients', '/properties', '/estimates', '/documents'],
    client: [],
  };
  const allowedPaths = userRole ? NAV_BY_ROLE[userRole] : null;
  const visibleNav = navItems.filter(i => {
    // If item has role restriction, only show for those roles
    if (i.roles && !i.roles.includes(userRole)) return false;
    // If user role has path restrictions, filter by allowed paths
    if (allowedPaths !== null && !allowedPaths.includes(i.path)) return false;
    return true;
  });

  const isActive = (path) => path === '/'
    ? location.pathname === '/'
    : location.pathname.startsWith(path);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
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
          <Link
            to="/company-settings"
            className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors"
          >
            <Building2 className="w-4 h-4" />
            Settings
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
          <div className="flex-1" />
          <GlobalSearch />
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}