import { Lock, Shield, ArrowLeft, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

/**
 * Permission Denied Error Page
 * Shows when user doesn't have required role or permissions
 */
export default function PermissionDenied({ 
  title = 'Permesso Negato',
  message = 'Non hai i permessi necessari per accedere a questa sezione.',
  requiredRole,
  requiredPermission,
  userRole,
  onBack,
}) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[600px]">
      <div className="max-w-lg w-full p-6">
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-red-50 px-6 py-8 border-b border-red-100">
            <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 text-center">{title}</h1>
          </div>

          {/* Content */}
          <div className="px-6 py-8 space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">{message}</p>
              
              {(requiredRole || requiredPermission) && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="space-y-3">
                    {requiredRole && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Ruolo Richiesto:</span>
                        <span className="font-semibold text-gray-900">{requiredRole}</span>
                      </div>
                    )}
                    {requiredPermission && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Permesso Richiesto:</span>
                        <span className="font-semibold text-gray-900">{requiredPermission}</span>
                      </div>
                    )}
                    {userRole && (
                      <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-200">
                        <span className="text-gray-500">Il Tuo Ruolo:</span>
                        <span className="font-medium text-orange-600">{userRole}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">Come Richiedere Accesso</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Contatta un amministratore del tenant per richiedere l'accesso a questa funzionalità.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
            <Button
              onClick={onBack || (() => navigate('/'))}
              variant="outline"
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna alla Dashboard
            </Button>
            <Button
              onClick={() => navigate('/team')}
              className="flex-1"
              style={{ backgroundColor: '#1147FF' }}
            >
              <Mail className="w-4 h-4 mr-2" />
              Contatta Admin
            </Button>
          </div>
        </div>

        {/* Developer Info */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 font-mono">
            Required Role: {requiredRole || 'N/A'} | Required Permission: {requiredPermission || 'N/A'} | Your Role: {userRole || 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
}