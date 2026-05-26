import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Home, FileText, FolderKanban,
  CheckSquare, Shield, Archive, Users2, Bot, Menu, X, LogOut, Wifi, WifiOff, Ticket, CalendarDays, BarChart2, BookOpen
} from 'lucide-react';

import { base44 } from '@/api/base44Client';
import NotificationBell from './NotificationBell';
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
      if (u?.role === 'client' && !location.pathname.startsWith('/portal')) {
        navigate('/portal', { replace: true });
      }
    }).catch(() => {});
  }, []);

  const NAV_BY_ROLE = {
    admin: null, // all
    project_manager: ['/', '/projects', '/checklists', '/documents', '/calendar', '/report', '/team'],
    technician: ['/', '/projects', '/checklists', '/tickets'],
    sales: ['/', '/clients', '/properties', '/estimates', '/documents'],
    client: [],
  };
  const allowedPaths = userRole ? NAV_BY_ROLE[userRole] : null;
  const visibleNav = allowedPaths === null ? navItems : navItems.filter(i => allowedPaths.includes(i.path));

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
          <div>
            <div className="text-white font-bold text-lg tracking-tight">Codex OS</div>
            <div className="text-white/40 text-xs font-medium">Codex Solution</div>
          </div>
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