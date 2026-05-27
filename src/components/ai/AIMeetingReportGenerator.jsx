import { useState } from 'react';
import { FileText, Download, Loader2, Sparkles, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AIMeetingReportGenerator({ projectId, onClose }) {
  const [notes, setNotes] = useState('');
  const [reportType, setReportType] = useState('site_inspection');
  const [generating, setGenerating] = useState(false);

  const reportTypes = [
    { value: 'site_inspection', label: 'Sopralluogo Tecnico', desc: 'Report dettagliato ispezione cantiere' },
    { value: 'meeting_summary', label: 'Verbale Riunione', desc: 'Sintesi incontri con cliente/team' },
    { value: 'handover', label: 'Consegna Lavori', desc: 'Report finale consegna progetto' },
    { value: 'daily_report', label: 'Report Giornaliero', desc: 'Attività e progresso giornaliero' },
  ];

  const generateReport = async () => {
    setGenerating(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Genera un report professionale in italiano per un progetto di ristrutturazione/edilizia.
        
Tipo Report: ${reportType}
Note fornite: ${notes}

Struttura il report con:
1. Dati generali (data, partecipanti, luogo)
2. Scopo del ${reportType === 'site_inspection' ? 'sopralluogo' : 'incontro'}
3. Osservazioni principali
4. Problemi identificati
5. Azioni raccomandate
6. Prossimi step e scadenze
7. Note tecniche rilevanti

Usa linguaggio professionale ma chiaro. Includi dettagli tecnici quando pertinenti.`,
        model: 'automatic',
      });

      // Download as text file
      const blob = new Blob([res], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Report_${reportType}_${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Report generato con successo');
      onClose?.();
    } catch (error) {
      toast.error('Errore generazione report: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1147FF 0%, #0B2341 100%)' }}>
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Genera Report AI</h2>
              <p className="text-xs text-gray-500">Trasforma le tue note in report professionale</p>
            </div>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">Tipo Report</label>
          <div className="grid grid-cols-2 gap-2">
            {reportTypes.map(type => (
              <div
                key={type.value}
                onClick={() => setReportType(type.value)}
                className={`p-3 border rounded-xl cursor-pointer transition-all ${
                  reportType === type.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className={`text-sm font-semibold ${reportType === type.value ? 'text-blue-700' : 'text-gray-800'}`}>
                  {type.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{type.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">
            Note e Appunti <span className="text-gray-400">(scrivi liberamente, l'AI strutturerà il report)</span>
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Es: Sopralluogo del 15/05 - presenti Mario Rossi e Luca Bianchi. Impianto elettrico completato al 80%. Mancano 3 punti luce in camera. Idraulico: installare nuovo miscelatore. Prossima visita: 22/05 per collaudo..."
            rows={6}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none resize-none"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={generateReport}
            disabled={generating || !notes.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-white rounded-lg font-medium disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #1147FF 0%, #0B2341 100%)' }}
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generating ? 'Generazione...' : 'Genera Report'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            Annulla
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
          <p className="text-xs text-blue-800 font-medium flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            L'AI utilizzerà il contesto del progetto per personalizzare il report
          </p>
        </div>
      </div>
    </div>
  );
}