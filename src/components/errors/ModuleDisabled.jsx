import { AlertTriangle, Lock, Shield, ArrowLeft, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

/**
 * Module Disabled Error Page
 * Shows when user tries to access a module not enabled in their plan
 */
export default function ModuleDisabled({ moduleName, requiredPlan, onBack }) {
  const navigate = useNavigate();

  const moduleNames = {
    financial_control: 'Controllo Finanziario',
    guardian: 'Codex Guardian',
    ai_copilot: 'AI Copilot',
    intelligence: 'Codex Intelligence',
    workflows: 'Workflow Automation',
    property_intelligence: 'Property Intelligence',
  };

  const displayName = moduleNames[moduleName] || moduleName;

  return (
    <div className="flex items-center justify-center min-h-[600px]">
      <div className="max-w-lg w-full p-6">
        <div className="bg-white rounded-2xl border border-orange-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-orange-50 px-6 py-8 border-b border-orange-100">
            <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-orange-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 text-center">Modulo Non Disponibile</h1>
          </div>

          {/* Content */}
          <div className="px-6 py-8 space-y-4">
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900 mb-2">
                {displayName}
              </p>
              <p className="text-sm text-gray-600">
                Questa funzionalità non è inclusa nel tuo piano attuale.
              </p>
            </div>

            {requiredPlan && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900">Piano Richiesto</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Per accedere a {displayName}, è necessario il piano <strong>{requiredPlan}</strong> o superiore.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Cosa puoi fare:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Contattare l'amministratore per richiedere l'upgrade del piano</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Esplorare le funzionalità disponibili nel tuo piano attuale</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Richiedere una demo delle funzionalità premium</span>
                </li>
              </ul>
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
              onClick={() => navigate('/company-settings')}
              className="flex-1"
              style={{ backgroundColor: '#1147FF' }}
            >
              Impostazioni
            </Button>
          </div>
        </div>

        {/* Developer Info */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 font-mono">
            Module: {moduleName} | Required Plan: {requiredPlan || 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
}