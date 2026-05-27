import { useState, useEffect } from 'react';
import { Mail, Send, FileText, Users, Home, Calendar, AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const EMAIL_TYPES = [
  { value: 'estimate_followup', label: 'Follow-up Preventivo', icon: FileText, color: '#3B82F6' },
  { value: 'project_update', label: 'Aggiornamento Progetto', icon: Calendar, color: '#10B981' },
  { value: 'delay_notification', label: 'Comunicazione Ritardo', icon: AlertCircle, color: '#F59E0B' },
  { value: 'maintenance_reminder', label: 'Promemoria Manutenzione', icon: Home, color: '#8B5CF6' },
  { value: 'guardian_renewal', label: 'Rinnovo Guardian', icon: Calendar, color: '#059669' },
  { value: 'project_completion', label: 'Completamento Progetto', icon: CheckCircle2, color: '#06b6d4' },
];

export default function AICommunicationGenerator({ entityType, entityId, onClose }) {
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState(null);
  const [sending, setSending] = useState(false);
  const [entityData, setEntityData] = useState(null);

  useEffect(() => {
    loadEntityData();
  }, [entityType, entityId]);

  const loadEntityData = async () => {
    try {
      let data;
      if (entityType === 'estimate') {
        data = await base44.entities.Estimate.get(entityId);
      } else if (entityType === 'project') {
        data = await base44.entities.Project.get(entityId);
      } else if (entityType === 'client') {
        data = await base44.entities.Client.get(entityId);
      } else if (entityType === 'property') {
        data = await base44.entities.Property.get(entityId);
      } else if (entityType === 'guardian') {
        data = await base44.entities.GuardianSubscription.get(entityId);
      }
      setEntityData(data);
    } catch (error) {
      console.error('Failed to load entity data:', error);
    }
  };

  const generateEmail = async () => {
    if (!selectedType) return;
    setLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Genera una email professionale in italiano per: ${selectedType}

CONTESTO:
${JSON.stringify(entityData, null, 2)}

Istruzioni:
1. Usa un tono professionale ma cordiale
2. Personalizza con nome cliente e dettagli specifici
3. Includi riferimenti a progetto/proprietà se rilevanti
4. Mantieni conciso ma completo
5. Aggiungi call-to-action chiara

Output come JSON:
{
  "subject": "Oggetto email",
  "body": "Corpo email in HTML (usa <p>, <strong>, <ul>, <li>)",
  "cta": "Testo call-to-action"
}`,
        response_json_schema: {
          type: 'object',
          properties: {
            subject: { type: 'string' },
            body: { type: 'string' },
            cta: { type: 'string' },
          },
          required: ['subject', 'body', 'cta'],
        },
      });

      setGeneratedEmail(response);
    } catch (error) {
      console.error('Failed to generate email:', error);
      toast.error('Generazione email fallita');
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = async () => {
    if (!generatedEmail || !entityData) return;
    setSending(true);
    try {
      // Get client email
      let clientEmail;
      if (entityData.client_id) {
        const client = await base44.entities.Client.get(entityData.client_id);
        clientEmail = client?.email;
      } else if (entityData.email) {
        clientEmail = entityData.email;
      }

      if (!clientEmail) {
        toast.error('Email cliente non trovata');
        return;
      }

      // Add to AIActionQueue for approval (Safe Mode)
      await base44.entities.AIActionQueue.create({
        action_type: 'send_customer_email',
        action_label: `Invio email: ${generatedEmail.subject}`,
        proposed_params: {
          to: clientEmail,
          subject: generatedEmail.subject,
          body: generatedEmail.body,
          email_type: selectedType,
        },
        requested_by_user_email: (await base44.auth.me()).email,
        risk_level: 'High',
        required_role_to_approve: 'admin',
        status: 'Pending',
        company_id: entityData.company_id,
        ai_context_summary: `Email generata automaticamente per ${entityType} ${entityId}`,
      });

      toast.success('Email aggiunta alla coda approvazione (richiede conferma admin)');
      onClose();
    } catch (error) {
      toast.error(`Errore: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1147FF 0%, #0B2341 100%)' }}>
              <Mail className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Generatore Email AI</p>
              <p className="text-xs text-gray-500 capitalize">{entityType} · {selectedType ? EMAIL_TYPES.find(t => t.value === selectedType)?.label : 'Seleziona tipo'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Email Type Selection */}
        {!generatedEmail && (
          <div className="p-5">
            <p className="text-xs font-semibold text-gray-700 mb-3">Tipo Comunicazione</p>
            <div className="grid grid-cols-2 gap-2">
              {EMAIL_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    selectedType === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${type.color}20` }}>
                    <type.icon className="w-4 h-4" style={{ color: type.color }} />
                  </div>
                  <span className="text-xs font-medium text-gray-800">{type.label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={generateEmail}
              disabled={!selectedType || loading}
              className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 text-sm text-white rounded-lg font-medium disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #1147FF 0%, #0B2341 100%)' }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Generazione...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" /> Genera Email
                </>
              )}
            </button>
          </div>
        )}

        {/* Email Preview */}
        {generatedEmail && (
          <div className="p-5 space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Oggetto</p>
              <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3 border border-gray-200">
                {generatedEmail.subject}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Corpo Email</p>
              <div 
                className="text-sm text-gray-800 bg-gray-50 rounded-lg p-4 border border-gray-200 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: generatedEmail.body }}
              />
            </div>

            {generatedEmail.cta && (
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">Call-to-Action</p>
                <p className="text-sm text-gray-900 bg-blue-50 rounded-lg p-3 border border-blue-200 text-blue-800 font-medium">
                  {generatedEmail.cta}
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t border-gray-100">
              <button
                onClick={sendEmail}
                disabled={sending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-white rounded-lg font-medium disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #1147FF 0%, #0B2341 100%)' }}
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Invio...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Aggiungi a Coda Approvazione
                  </>
                )}
              </button>
              <button
                onClick={() => setGeneratedEmail(null)}
                className="flex-1 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Modifica
              </button>
            </div>

            <p className="text-[10px] text-gray-400 text-center">
              ⚠️ L'invio richiede approvazione admin (Safe Mode attivo)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}