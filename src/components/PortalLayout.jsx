import { Outlet } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { LogOut, Shield } from 'lucide-react';
import CodexLogo from './CodexLogo';

export default function PortalLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Portal header - no internal nav */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 flex-shrink-0">
        <div className="flex items-center gap-3">
          <CodexLogo />
          <div className="h-5 w-px bg-gray-200" />
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-xs font-medium text-gray-500">Area Cliente</span>
          </div>
        </div>
        <button
          onClick={() => base44.auth.logout()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      <footer className="py-4 text-center text-xs text-gray-400 border-t border-gray-100 bg-white">
        Codex Solution · Area Cliente riservata
      </footer>
    </div>
  );
}