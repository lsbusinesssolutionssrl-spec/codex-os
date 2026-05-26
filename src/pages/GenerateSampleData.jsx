import { useState } from 'react';
import { Database, Check, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function GenerateSampleData() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('generateSampleData', {});
      setResult(res.data);
    } catch (e) {
      setError(e.message || 'Errore nella generazione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
          <Database className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Genera Dati Sample</h1>
        <p className="text-sm text-gray-500 mt-1">Crea dati dimostrativi per Codex OS</p>
        
        <div className="mt-6">
          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 text-sm text-white rounded-lg font-medium mx-auto"
            style={{ backgroundColor: '#1147FF' }}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generazione...</>
            ) : (
              <><Database className="w-4 h-4" /> Genera Dati</>
            )}
          </button>
        </div>

        {result && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-left">
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-800">Generazione completata!</span>
            </div>
            <div className="text-sm text-green-700 space-y-1">
              <p>• {result.counts.clients} Clienti</p>
              <p>• {result.counts.properties} Proprietà</p>
              <p>• {result.counts.estimates} Preventivi</p>
              <p>• {result.counts.projects} Progetti</p>
              <p>• {result.counts.checklists} Checklist</p>
              <p>• {result.counts.tickets} Ticket</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
            <p className="text-sm text-red-700 font-semibold">Errore</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 text-sm mb-3">Cosa verrà creato:</h2>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>• 5 clienti (privati e aziende)</li>
          <li>• 5 proprietà (appartamenti, ville, uffici, capannoni)</li>
          <li>• 6 preventivi (stati diversi)</li>
          <li>• 4 progetti (con dati finanziari)</li>
          <li>• 10 checklist items</li>
          <li>• 5 ticket di supporto</li>
        </ul>
        <p className="text-xs text-gray-400 mt-4">Nota: Richiede ruolo admin.</p>
      </div>
    </div>
  );
}