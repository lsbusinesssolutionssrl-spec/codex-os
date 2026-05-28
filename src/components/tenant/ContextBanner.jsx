import { useGlobalContext } from '@/lib/GlobalContextEngine';
import { Shield, Building2, CheckCircle, UserX, LogOut } from 'lucide-react';

export default function ContextBanner() {
  const {
    activeTenant,
    isPlatformMode,
    loading,
    isImpersonating,
    impersonatedUserEmail,
    clearImpersonation,
    user,
    platformRole,
    contextType
  } = useGlobalContext();

  if (loading) return null;

  // Show impersonation banner
  if (isImpersonating && impersonatedUserEmail) {
    return (
      <div className="bg-orange-500 text-white px-4 py-2 text-sm flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <UserX className="w-4 h-4" />
          <span className="font-medium">
            🎭 Stai impersonando <strong>{impersonatedUserEmail}</strong>
          </span>
        </div>
        <button
          onClick={clearImpersonation}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
          
          <LogOut className="w-4 h-4" />
          Esci da impersonation
        </button>
      </div>);

  }

  // Show Platform Mode banner for platform owners
  if (isPlatformMode && platformRole) {
    return null;












  }

  return null;
































}