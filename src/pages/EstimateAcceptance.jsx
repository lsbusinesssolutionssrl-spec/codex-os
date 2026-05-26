import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, CheckCircle2, XCircle, PenLine, FileText, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StatusBadge from '../components/StatusBadge';

const REJECTION_REASONS = ['Price too high', 'Timing', 'Chose another company', 'Project postponed', 'Other'];

export default function EstimateAcceptance() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [estimate, setEstimate] = useState(null);
  const [client, setClient] = useState(null);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSignature, setShowSignature] = useState(false);
  const [signatureText, setSignatureText] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [clientComments, setClientComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const ests = await base44.entities.Estimate.filter({ id });
        if (!ests[0]) {
          setLoading(false);
          return;
        }
        const est = ests[0];
        setEstimate(est);
        
        const cls = await base44.entities.Client.filter({ id: est.client_id });
        if (cls[0]) setClient(cls[0]);
        
        if (est.property_id) {
          const props = await base44.entities.Property.filter({ id: est.property_id });
          if (props[0]) setProperty(props[0]);
        }
      } catch (error) {
        console.error('Error loading estimate:', error);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleAccept = async () => {
    if (!signatureText.trim() || !privacyAccepted) return;
    setProcessing(true);
    
    // In real implementation, upload signature image
    await base44.entities.Estimate.update(id, {
      status: 'Accepted',
      signed_at: new Date().toISOString(),
      signature_url: `data:text/plain,${encodeURIComponent(signatureText)}`,
      client_comments: clientComments,
    });
    
    setProcessing(false);
    // Show success message
    alert('Preventivo accettato con successo! Il team Codex Solution ti contatterà per i prossimi passi.');
  };

  const handleReject = async () => {
    if (!rejectionReason) return;
    setProcessing(true);
    
    await base44.entities.Estimate.update(id, {
      status: 'Rejected',
      rejection_reason: rejectionReason,
      rejection_notes: rejectionNotes,
      client_comments: clientComments,
    });
    
    setProcessing(false);
    alert('Grazie per il feedback. Il preventivo è stato contrassegnato come rifiutato.');
  };

  const downloadPDF = async () => {
    // In real implementation, call generateEstimatePDF function
    alert('Download PDF - Funzionalità da implementare con backend function');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Caricamento preventivo...</p>
        </div>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md p-6">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Preventivo non trovato</h1>
          <p className="text-gray-600">Il preventivo richiesto non esiste o non è più disponibile.</p>
        </div>
      </div>
    );
  }

  const marginColor = (estimate.gross_margin_pct || 0) >= 35 ? 'text-green-600' : (estimate.gross_margin_pct || 0) >= 25 ? 'text-orange-500' : 'text-red-500';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#0B2341' }}>
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Codex Solution</h1>
                  <p className="text-sm text-gray-500">Preventivo #{estimate.id}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <StatusBadge status={estimate.status} className="text-sm" />
              <p className="text-xs text-gray-500 mt-2">
                {new Date(estimate.created_date).toLocaleDateString('it-IT', { 
                  day: '2-digit', month: 'long', year: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Client & Property Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Cliente</h2>
            {client && (
              <div className="space-y-1 text-sm">
                <p className="font-medium text-gray-900">{client.name} {client.company_name}</p>
                {client.email && <p className="text-gray-600">{client.email}</p>}
                {client.phone && <p className="text-gray-600">{client.phone}</p>}
              </div>
            )}
          </div>
          {property && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Proprietà</h2>
              <div className="space-y-1 text-sm">
                <p className="font-medium text-gray-900">{property.property_name}</p>
                <p className="text-gray-600">{property.address}</p>
                {property.type && <p className="text-gray-600">{property.type}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Estimate Details */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4">
            <h2 className="text-lg font-bold text-white">{estimate.title}</h2>
            {estimate.estimate_type && (
              <p className="text-sm text-blue-100 mt-1">
                {estimate.estimate_type} · Livello {estimate.quality_level}
              </p>
            )}
          </div>
          
          <div className="p-5 space-y-4">
            {estimate.project_summary && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Riepilogo Progetto</h3>
                <p className="text-sm text-gray-600">{estimate.project_summary}</p>
              </div>
            )}
            
            {estimate.included_works && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Lavori Inclusi
                </h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{estimate.included_works}</p>
              </div>
            )}
            
            {estimate.excluded_works && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  Lavori Esclusi
                </h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{estimate.excluded_works}</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Durata Stimata</p>
                <p className="text-sm font-semibold text-gray-900">{estimate.estimated_duration || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Condizioni di Pagamento</p>
                <p className="text-sm font-semibold text-gray-900">{estimate.payment_terms || 'N/A'}</p>
              </div>
            </div>

            {/* Pricing */}
            <div className="border-t border-gray-100 pt-4 mt-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Investimento Totale</p>
                  <p className="text-3xl font-bold" style={{ color: '#1147FF' }}>
                    €{(estimate.revenue || 0).toLocaleString('it-IT')}
                  </p>
                </div>
                {estimate.expiry_date && (
                  <p className="text-xs text-gray-500">
                    Valido fino al {new Date(estimate.expiry_date).toLocaleDateString('it-IT')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        {estimate.status === 'Sent' && (
          <>
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Accettazione Preventivo
              </h2>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Commenti (opzionale)</label>
                <textarea
                  value={clientComments}
                  onChange={e => setClientComments(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none resize-none"
                  placeholder="Eventuali commenti o richieste..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Firma Digitale</label>
                <input
                  type="text"
                  value={signatureText}
                  onChange={e => setSignatureText(e.target.value)}
                  placeholder="Digita il tuo nome completo per firmare"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">La firma digitale ha valore legale</p>
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={e => setPrivacyAccepted(e.target.checked)}
                  className="mt-1"
                />
                <label className="text-xs text-gray-600">
                  Accetto la privacy policy e autorizzo il trattamento dei dati personali per l'esecuzione del contratto
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Accept */}
              <button
                onClick={handleAccept}
                disabled={!signatureText.trim() || !privacyAccepted || processing}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl p-5 text-left transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                  <h3 className="font-bold text-lg">Accetta Preventivo</h3>
                </div>
                <p className="text-sm text-green-100">
                  Conferma l'accettazione del preventivo. Il team Codex Solution ti contatterà entro 24 ore.
                </p>
              </button>

              {/* Reject */}
              <button
                onClick={() => document.getElementById('reject-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl p-5 text-left transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <XCircle className="w-6 h-6" />
                  <h3 className="font-bold text-lg">Rifiuta Preventivo</h3>
                </div>
                <p className="text-sm text-red-100">
                  Comunica la tua decisione di non procedere. Il tuo feedback ci aiuta a migliorare.
                </p>
              </button>
            </div>

            {/* Rejection Section */}
            <div id="reject-section" className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h2 className="text-sm font-semibold text-gray-900">Motivazione Rifiuto</h2>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Motivo principale</label>
                <select
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none"
                >
                  <option value="">— Seleziona —</option>
                  {REJECTION_REASONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Note aggiuntive (opzionale)</label>
                <textarea
                  value={rejectionNotes}
                  onChange={e => setRejectionNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none resize-none"
                  placeholder="Ulteriori dettagli..."
                />
              </div>
              <button
                onClick={handleReject}
                disabled={!rejectionReason || processing}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-medium"
              >
                Conferma Rifiuto
              </button>
            </div>
          </>
        )}

        {estimate.status === 'Accepted' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-green-900 mb-1">Preventivo Accettato</h2>
            <p className="text-sm text-green-700">
              Grazie per la fiducia! Il team Codex Solution ti contatterà a breve per iniziare i lavori.
            </p>
          </div>
        )}

        {estimate.status === 'Rejected' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center">
            <XCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-red-900 mb-1">Preventivo Rifiutato</h2>
            {estimate.rejection_reason && (
              <p className="text-sm text-red-700">Motivo: {estimate.rejection_reason}</p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 pt-4">
          <p>Codex Solution · Documento generato automaticamente</p>
          <p className="mt-1">Per informazioni: info@codexsolution.it</p>
        </div>
      </div>
    </div>
  );
}