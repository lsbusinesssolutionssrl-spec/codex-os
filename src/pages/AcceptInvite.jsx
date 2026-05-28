import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { CheckCircle, AlertCircle, Loader2, Shield, Mail } from 'lucide-react';

const INVITE_TOKEN_KEY = 'pending_invite_token';

export default function AcceptInvite() {
  const { membershipId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading | accepting | success | error | mismatch
  const [result, setResult] = useState(null);
  const [debug, setDebug] = useState(null);

  useEffect(() => {
    if (!membershipId) {
      setStatus('error');
      setResult({ error: 'Token invito mancante.' });
      return;
    }

    // Store token in localStorage so it survives login redirect
    localStorage.setItem(INVITE_TOKEN_KEY, membershipId);

    acceptInvite();
  }, [membershipId]);

  const acceptInvite = async () => {
    setStatus('accepting');

    // Check if user is authenticated
    const isAuthenticated = await base44.auth.isAuthenticated();
    if (!isAuthenticated) {
      // Store token and redirect to login
      localStorage.setItem(INVITE_TOKEN_KEY, membershipId);
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    // Call backend to accept invite
    const response = await base44.functions.invoke('acceptTenantInvite', {
      membership_id: membershipId,
    });

    const data = response.data;
    setDebug(data.debug || null);

    if (data.success) {
      localStorage.removeItem(INVITE_TOKEN_KEY);
      setStatus('success');
      setResult(data);
      // Redirect after 2 seconds
      setTimeout(() => {
        const redirectPath = data.redirect_path || '/app/admin/dashboard';
        // Force full reload to reinitialize context
        window.location.href = redirectPath;
      }, 2000);
    } else if (data.email_mismatch) {
      setStatus('mismatch');
      setResult(data);
    } else {
      setStatus('error');
      setResult(data);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#1147FF' }}>
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Accettazione Invito</h1>
            <p className="text-sm text-gray-500">Codex OS Platform</p>
          </div>
        </div>

        {/* Loading */}
        {(status === 'loading' || status === 'accepting') && (
          <div className="text-center py-8">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-700 font-medium">Attivazione account in corso...</p>
            <p className="text-sm text-gray-500 mt-1">Collegamento al workspace del team</p>
          </div>
        )}

        {/* Success */}
        {status === 'success' && (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-9 h-9 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Invito Accettato!</h2>
            <p className="text-gray-600 text-sm mb-4">Il tuo account è stato attivato con successo.</p>
            <p className="text-xs text-gray-400">Reindirizzamento al workspace...</p>
            <div className="mt-4 p-3 bg-green-50 rounded-lg text-left">
              <p className="text-xs text-green-700 font-medium">
                ✓ Account attivato
              </p>
              {result?.membership?.tenant_role && (
                <p className="text-xs text-green-600 mt-1">
                  Ruolo: {result.membership.tenant_role}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Email Mismatch */}
        {status === 'mismatch' && (
          <div className="py-4">
            <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-7 h-7 text-orange-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2 text-center">Email Non Corrispondente</h2>
            <p className="text-sm text-gray-600 text-center mb-4">
              Questa registrazione non corrisponde all'indirizzo email invitato.
            </p>
            <div className="space-y-2 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div>
                <p className="text-xs text-orange-700 font-medium">Email Invitata</p>
                <p className="text-sm font-mono text-orange-900">{result?.invited_email}</p>
              </div>
              <div>
                <p className="text-xs text-orange-700 font-medium">Email Registrata</p>
                <p className="text-sm font-mono text-orange-900">{result?.registered_email}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Contatta l'amministratore del team per la correzione.
            </p>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="text-center py-6">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Errore Accettazione</h2>
            <p className="text-sm text-gray-600 mb-4">{result?.error || 'Invito non trovato o scaduto.'}</p>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 text-sm text-white rounded-lg font-medium"
              style={{ backgroundColor: '#1147FF' }}
            >
              Vai alla Dashboard
            </button>
          </div>
        )}

        {/* Debug (collapsible) */}
        {debug && (
          <details className="mt-6 border-t border-gray-100 pt-4">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
              Debug Info
            </summary>
            <pre className="mt-2 text-xs text-gray-500 bg-gray-50 p-3 rounded overflow-auto max-h-48">
              {JSON.stringify(debug, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}