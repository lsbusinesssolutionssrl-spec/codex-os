import { useState } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';

// ── Safety Classification ───────────────────────────────────────────
// CRITICAL: assigns people or modifies contracts → requires typing "CONFERMA"
const CRITICAL_DANGER_ACTIONS = new Set(['assign_technician']);
// HIGH: touches financials or property data → shows orange warning
const HIGH_DANGER_ACTIONS = new Set(['create_estimate_draft', 'suggest_pricing', 'update_homepassport']);

const ACTION_ICONS = {
  create_task: '✅', create_ticket: '🎫', create_estimate_draft: '📋',
  create_checklist: '☑️', assign_technician: '👷', generate_report: '📊',
  summarize_project: '📝', suggest_pricing: '💶', generate_handover: '🤝',
  update_homepassport: '🏠', generate_meeting_notes: '📋',
};

const ACTION_FIELDS = {
  create_estimate_draft: [
    { key: 'title', label: 'Titolo preventivo', required: true },
    { key: 'estimate_type', label: 'Tipo', type: 'select', options: ['Bathroom','Full Home','Electrical System','Networking','Security','Roofing','Maintenance','Other'] },
    { key: 'quality_level', label: 'Livello qualità', type: 'select', options: ['Essential','Smart','Intelligence'] },
    { key: 'notes', label: 'Note', type: 'textarea' },
  ],
  create_task: [
    { key: 'title', label: 'Titolo task', required: true },
    { key: 'description', label: 'Descrizione', type: 'textarea' },
    { key: 'assigned_to', label: 'Assegnato a' },
    { key: 'priority', label: 'Priorità', type: 'select', options: ['Low','Medium','High','Urgent'] },
    { key: 'due_date', label: 'Scadenza', type: 'date' },
  ],
  create_checklist: [
    { key: 'title', label: 'Titolo', required: true },
    { key: 'description', label: 'Descrizione', type: 'textarea' },
    { key: 'category', label: 'Categoria', type: 'select', options: ['Bathroom','Full Home','Electrical','Networking','Security','Roofing','Handover'] },
    { key: 'assigned_person', label: 'Assegnato a' },
  ],
  create_ticket: [
    { key: 'title', label: 'Oggetto', required: true },
    { key: 'issue_type', label: 'Tipo', type: 'select', options: ['Water Leak','Electrical','Network','Security','Maintenance','Other'] },
    { key: 'priority', label: 'Priorità', type: 'select', options: ['Low','Medium','High','Urgent'] },
    { key: 'notes', label: 'Note', type: 'textarea' },
  ],
  assign_technician: [
    { key: 'technician', label: 'Nome tecnico', required: true },
    { key: 'project_id', label: 'ID Progetto' },
    { key: 'ticket_id', label: 'ID Ticket' },
  ],
  generate_report: [
    { key: 'project_id', label: 'ID Progetto', required: true },
    { key: 'report_type', label: 'Tipo report', type: 'select', options: ['full','progress','financial','checklist'] },
  ],
  summarize_project: [{ key: 'project_id', label: 'ID Progetto', required: true }],
  suggest_pricing: [
    { key: 'estimate_type', label: 'Tipo lavoro', type: 'select', options: ['Bathroom','Full Home','Electrical System','Networking','Security','Roofing','Maintenance','Other'] },
    { key: 'quality_level', label: 'Livello qualità', type: 'select', options: ['Essential','Smart','Intelligence'] },
    { key: 'square_meters', label: 'Metri quadrati', type: 'number' },
  ],
  generate_meeting_notes: [
    { key: 'subject', label: 'Oggetto riunione', required: true },
    { key: 'participants', label: 'Partecipanti' },
    { key: 'agenda', label: 'Agenda / punti principali', type: 'textarea' },
    { key: 'date', label: 'Data', type: 'date' },
  ],
  generate_handover: [{ key: 'project_id', label: 'ID Progetto', required: true }],
  update_homepassport: [
    { key: 'property_id', label: 'ID Proprietà', required: true },
    { key: 'electrical_notes', label: 'Note impianto elettrico', type: 'textarea' },
    { key: 'plumbing_notes', label: 'Note idraulico', type: 'textarea' },
    { key: 'networking_notes', label: 'Note networking', type: 'textarea' },
    { key: 'security_notes', label: 'Note sicurezza', type: 'textarea' },
  ],
};

export default function ActionConfirmModal({ action, onConfirm, onCancel }) {
  const [params, setParams] = useState({ ...(action.params || {}) });
  const [confirmText, setConfirmText] = useState('');
  const fields = ACTION_FIELDS[action.type] || [];
  const setField = (key, val) => setParams(p => ({ ...p, [key]: val }));

  const isCritical = CRITICAL_DANGER_ACTIONS.has(action.type);
  const isHighDanger = HIGH_DANGER_ACTIONS.has(action.type);
  const isReady = fields.filter(f => f.required).every(f => params[f.key]?.toString().trim());
  const canSubmit = isReady && (!isCritical || confirmText.toUpperCase() === 'CONFERMA');

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-gray-100">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 border ${
            isCritical ? 'bg-red-50 border-red-200' : isHighDanger ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-100'
          }`}>
            {ACTION_ICONS[action.type] || '⚡'}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base">{action.label}</h3>
            <p className="text-xs text-gray-500">Completa i parametri e conferma per eseguire</p>
          </div>
        </div>

        {/* Fields */}
        {fields.length > 0 && (
          <div className="space-y-3">
            {fields.map(field => (
              <div key={field.key}>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                {field.type === 'select' ? (
                  <select value={params[field.key] || ''} onChange={e => setField(field.key, e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all">
                    <option value="">— Seleziona —</option>
                    {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea value={params[field.key] || ''} onChange={e => setField(field.key, e.target.value)}
                    rows={2} placeholder={`${field.label}...`}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
                ) : (
                  <input type={field.type || 'text'} value={params[field.key] || ''} onChange={e => setField(field.key, e.target.value)}
                    placeholder={`${field.label}...`}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Critical danger: must type CONFERMA */}
        {isCritical && (
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-0.5">Azione critica — modifica assegnazioni o contratti</p>
                <p>Scrivi <strong>CONFERMA</strong> per sbloccare il pulsante.</p>
              </div>
            </div>
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder='Scrivi "CONFERMA" per sbloccare'
              className="w-full px-3 py-2 text-sm border border-red-200 rounded-xl focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
            />
          </div>
        )}

        {/* High danger: orange warning only */}
        {isHighDanger && !isCritical && (
          <div className="flex items-start gap-2 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2.5">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>Azione con impatto finanziario — verifica i dati prima di confermare.</span>
          </div>
        )}

        {/* Standard safety notice */}
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
          <Shield className="w-3.5 h-3.5 flex-shrink-0" />
          Azione tracciata nell'Audit Log · Permessi verificati · RBAC applicato · Cross-tenant protetto
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-1">
          <button onClick={() => onConfirm(params)} disabled={!canSubmit}
            className="flex-1 py-2.5 text-sm text-white rounded-xl font-semibold disabled:opacity-40 transition-all shadow-sm"
            style={{ background: isCritical ? '#DC2626' : 'linear-gradient(135deg, #1147FF 0%, #0B2341 100%)' }}>
            Conferma ed Esegui
          </button>
          <button onClick={onCancel}
            className="flex-1 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
            Annulla
          </button>
        </div>
      </div>
    </div>
  );
}