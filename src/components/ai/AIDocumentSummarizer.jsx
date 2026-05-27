import { useState, useEffect } from 'react';
import { FileText, Loader2, Sparkles, X, AlertTriangle, CheckCircle2, Clock, Tag } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { createFileSignedUrl } from '@/api/base44Client';

export default function AIDocumentSummarizer({ documentUrl, documentType, onClose }) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (documentUrl) analyzeDocument();
  }, [documentUrl]);

  const analyzeDocument = async () => {
    setLoading(true);
    try {
      // First extract text using LLM vision/file capability
      const extractedText = await base44.integrations.Core.InvokeLLM({
        prompt: 'Estrai e analizza il contenuto completo di questo documento. Identifica: testo principale, date importanti, parti contraenti, obbligazioni, scadenze, clausole rilevanti, e qualsiasi informazione critica.',
        file_urls: [documentUrl],
        model: 'automatic',
      });

      // Then generate structured summary
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analizza questo documento e genera una sintesi strutturata in italiano:

${extractedText}

Struttura la risposta così:
1. TIPO DOCUMENTO: (contratto/preventivo/certificazione/manuale/altro)
2. PARTI COINVOLTE: (chi sono i soggetti)
3. OGGETTO PRINCIPALE: (di cosa si tratta)
4. DATE CRITICHE: (scadenze, termini,有效期)
5. OBBLIGAZIONI PRINCIPALI: (cosa devono fare le parti)
6. CLAUSOLE RILEVANTI: (punti importanti da notare)
7. RISCHI/ATTENZIONI: (cosa richiede attenzione)
8. AZIONI RICHIESTE: (cosa bisogna fare)

Usa linguaggio chiaro e professionale. Evidenzia le scadenze e le criticità.`,
        model: 'automatic',
      });

      // Extract key points using another LLM call
      const keyPoints = await base44.integrations.Core.InvokeLLM({
        prompt: `Da questo testo, estrai i 5-7 punti chiave più importanti in formato elenco puntato:

${extractedText}

Rispondi SOLO con l'elenco puntato, niente altro.`,
        model: 'automatic',
      });

      // Detect action items
      const actionItems = await base44.integrations.Core.InvokeLLM({
        prompt: `Identifica tutte le azioni richieste, scadenze, o task menzionati in questo documento:

${extractedText}

Elencali in formato:
- [SCADENZA se presente] Azione richiesta - Responsabile (se indicato)

Se non ci sono azioni, rispondi "Nessuna azione identificata".`,
        model: 'automatic',
      });

      setSummary({
        full_analysis: analysis,
        key_points: keyPoints,
        action_items: actionItems,
        document_type: documentType,
      });
    } catch (error) {
      toast.error('Errore analisi documento: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-3xl shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1147FF 0%, #0B2341 100%)' }}>
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">AI Document Analysis</h2>
              <p className="text-xs text-gray-500">Sintesi intelligente del documento</p>
            </div>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
              <p className="text-sm text-gray-600 font-medium">Analisi documento in corso...</p>
              <p className="text-xs text-gray-400 mt-1">L'AI sta estraendo e analizzando il contenuto</p>
            </div>
          </div>
        ) : summary ? (
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {/* Key Points */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-blue-900">Punti Chiave</h3>
              </div>
              <ul className="space-y-1.5">
                {summary.key_points.split('\n').filter(line => line.trim().startsWith('•') || line.trim().startsWith('-')).map((point, idx) => (
                  <li key={idx} className="text-sm text-blue-800 flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>{point.replace(/^[•-]\s*/, '')}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Items */}
            {summary.action_items && !summary.action_items.includes('Nessuna azione') && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-bold text-amber-900">Azioni Richieste</h3>
                </div>
                <ul className="space-y-1.5">
                  {summary.action_items.split('\n').filter(line => line.trim()).map((item, idx) => (
                    <li key={idx} className="text-sm text-amber-800 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Full Analysis */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm font-bold text-gray-900">Analisi Completa</h3>
              </div>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                  {summary.full_analysis}
                </pre>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}