import { useTenant } from './TenantContext';
import { Shield, Building2, CheckCircle } from 'lucide-react';

export default function ContextBanner() {
  const { activeTenant, isPlatformMode, loading } = useTenant();

  if (loading || !activeTenant) return null;

  return (
    <div className={`px-4 py-2 text-xs font-medium border-b ${
      isPlatformMode 
        ? 'bg-purple-50 border-purple-200 text-purple-800' 
        : 'bg-blue-50 border-blue-200 text-blue-800'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isPlatformMode ? (
            <>
              <Shield className="w-4 h-4" />
              <span>Platform Administration — Gestione multi-tenant</span>
            </>
          ) : (
            <>
              <Building2 className="w-4 h-4" />
              <span>Tenant Workspace: {activeTenant?.name || 'Unknown'}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isPlatformMode ? (
            <span className="text-purple-600">Super Admin Mode</span>
          ) : (
            <>
              <span className="text-blue-600">Isolato • Solo dati aziendali</span>
              <CheckCircle className="w-3.5 h-3.5 text-green-600" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}