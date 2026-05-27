import { AlertTriangle, Building2, RefreshCw, LogOut, Bug } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

/**
 * Context Missing Error Page
 * Shows when tenant context fails to resolve
 */
export default function ContextMissing({ 
  errorDetails,
  onRetry,
  showDebug = false,
}) {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear any cached context
    localStorage.removeItem('active_tenant_id');
    localStorage.removeItem('impersonate_tenant_id');
    // Then logout
    window.location.href = '/';
  };

  return (
    <div className="flex items-center justify-center min-h-[600px]">
      <div className="max-w-lg w-full p-6">
        <div className="bg-white rounded-2xl border border-orange-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-orange-50 px-6 py-8 border-b border-orange-100">
            <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 text-center">Contesto Tenant Non Risolto</h1>
          </div>

          {/* Content */}
          <div className="px-6 py-8 space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Il sistema non è riuscito a caricare il contesto del tenant. Questo può succedere se:
              </p>
              <ul className="text-sm text-gray-600 space-y-2 text-left bg-gray-50 p-4 rounded-lg border border-gray-200">
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 mt-0.5">•</span>
                  <span>La tua membership al tenant è stata rimossa</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 mt-0.5">•</span>
                  <span>Il tenant è stato sospeso o cancellato</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 mt-0.5">•</span>
                  <span>C'è un errore di configurazione nel sistema</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 mt-0.5">•</span>
                  <span>La sessione è scaduta o non valida</span>
                </li>
              </ul>
            </div>

            {errorDetails && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Bug className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-red-900 mb-1">Errore Tecnico</p>
                    <p className="text-xs text-red-700 font-mono break-words">{errorDetails}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">Sei un Amministratore?</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Se sei un Super Admin, puoi usare il Tenant Switcher nell'header per selezionare un tenant specifico.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 space-y-3">
            {onRetry && (
              <Button
                onClick={onRetry}
                className="w-full"
                style={{ backgroundColor: '#F59E0B' }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Riprova
              </Button>
            )}
            
            <div className="flex gap-3">
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="flex-1"
              >
                Torna alla Home
              </Button>
              <Button
                onClick={handleLogout}
                className="flex-1"
                variant="destructive"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>

            {showDebug && (
              <Button
                onClick={() => navigate('/tenant-membership-debug')}
                variant="ghost"
                className="w-full text-xs text-gray-500"
              >
                <Bug className="w-3 h-3 mr-2" />
                Apri Debug Membership
              </Button>
            )}
          </div>
        </div>

        {/* Debug Info */}
        {showDebug && errorDetails && (
          <div className="mt-4 p-3 bg-gray-900 rounded-lg border border-gray-700">
            <p className="text-xs text-gray-400 font-mono break-all">{errorDetails}</p>
          </div>
        )}
      </div>
    </div>
  );
}