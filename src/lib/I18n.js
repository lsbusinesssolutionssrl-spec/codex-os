/**
 * I18n — centralized Italian localization for tenant UI.
 * All dropdowns, statuses, labels must use this service.
 */

const IT = {
  estimate_status: {
    'Draft': 'Bozza',
    'To Review': 'Da Revisionare',
    'Sent': 'Inviato',
    'Accepted': 'Accettato',
    'Rejected': 'Rifiutato',
    'Expired': 'Scaduto',
    'Converted to Project': 'Convertito in Progetto',
    'Archived': 'Archiviato',
  },
  project_status: {
    'Lead': 'Lead',
    'Survey': 'Sopralluogo',
    'Estimate': 'In Preventivo',
    'Approved': 'Approvato',
    'In Progress': 'In Corso',
    'Testing': 'Collaudo',
    'Delivered': 'Consegnato',
    'Guardian Active': 'Guardian Attivo',
    'Archived': 'Archiviato',
  },
  client_status: {
    'Lead': 'Lead',
    'Prospect': 'Prospect',
    'Cliente Attivo': 'Cliente Attivo',
    'Cliente Inattivo': 'Cliente Inattivo',
    'Ex Cliente': 'Ex Cliente',
    'Partner': 'Partner',
  },
  estimate_type: {
    'Bathroom': 'Bagno',
    'Full Home': 'Casa Completa',
    'Electrical System': 'Impianto Elettrico',
    'Networking': 'Rete / Networking',
    'Security': 'Sicurezza',
    'Roofing': 'Copertura / Tetto',
    'Maintenance': 'Manutenzione',
    'Other': 'Altro',
  },
  property_type: {
    'Apartment': 'Appartamento',
    'Villa': 'Villa',
    'Office': 'Ufficio',
    'Industrial Building': 'Capannone Industriale',
    'Commercial Space': 'Locale Commerciale',
  },
  quality_level: {
    'Essential': 'Essenziale',
    'Smart': 'Smart',
    'Intelligence': 'Intelligence',
    'Basic': 'Base',
    'Standard': 'Standard',
    'Premium': 'Premium',
    'Luxury': 'Lusso',
  },
  urgency: {
    'Standard': 'Standard',
    'Urgent': 'Urgente',
  },
  client_type: {
    'Privato': 'Privato',
    'Azienda': 'Azienda',
    'Condominio': 'Condominio',
    'Pubblica Amministrazione': 'Pubblica Amministrazione',
    'Professionista': 'Professionista',
    'Altro': 'Altro',
  },
  tenant_role: {
    'tenant_admin': 'Tenant Admin',
    'project_manager': 'Project Manager',
    'technician': 'Tecnico',
    'sales': 'Commerciale',
    'finance': 'Amministrazione',
    'viewer': 'Visualizzatore',
  },
  source: {
    'Passaparola': 'Passaparola',
    'Sito Web': 'Sito Web',
    'Social': 'Social',
    'Google': 'Google',
    'Campagna Pubblicitaria': 'Campagna Pubblicitaria',
    'Referral': 'Referral',
    'PA / Gara': 'PA / Gara',
    'Altro': 'Altro',
    'website': 'Sito Web',
    'referral': 'Passaparola',
    'social': 'Social',
    'google': 'Google',
    'advertising': 'Campagna Pubblicitaria',
    'walk_in': 'Contatto Diretto',
    'tender': 'Gara / PA',
    'other': 'Altro',
  },
  generic: {
    'Draft': 'Bozza',
    'Active': 'Attivo',
    'Inactive': 'Inattivo',
    'Pending': 'In Attesa',
    'Cancelled': 'Annullato',
    'Paid': 'Pagato',
    'At Risk': 'A Rischio',
    'Healthy': 'In Salute',
    'Needs Attention': 'Richiede Attenzione',
    'Completed': 'Completato',
    'New': 'Nuovo',
    'In Progress': 'In Corso',
    'Resolved': 'Risolto',
    'Closed': 'Chiuso',
  },
};

/**
 * Translate a value to Italian.
 * @param {string} key - dictionary key (e.g. 'estimate_status', 'estimate_type')
 * @param {string} value - the value to translate
 * @returns {string}
 */
export function t(key, value) {
  if (!value) return value || '';
  const dict = IT[key] || IT.generic || {};
  return dict[value] || value;
}

/**
 * Get all options for a dropdown as [{value, label}] pairs.
 * @param {string} key - dictionary key
 * @returns {Array<{value: string, label: string}>}
 */
export function getOptions(key) {
  const dict = IT[key] || {};
  return Object.entries(dict).map(([value, label]) => ({ value, label }));
}

export default IT;