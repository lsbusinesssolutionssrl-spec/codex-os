import { base44 } from '@/api/base44Client';

/**
 * ClientService — shared client data access layer.
 * Single source of truth for client queries across all pages.
 */

/**
 * Load all clients for a given tenant.
 * @param {string} tenantId - activeTenant.id
 * @returns {Promise<Array>}
 */
export async function getClients(tenantId) {
  if (!tenantId) throw new Error('tenantId is required');
  return base44.entities.Client.filter({ company_id: tenantId }, '-created_date');
}

/**
 * Compute display name for a client based on client_type and available fields.
 * @param {object} client
 * @returns {string}
 */
export function getClientDisplayName(client) {
  if (!client) return 'Cliente senza nome';

  const type = (client.client_type || '').toLowerCase();

  if (type === 'privato') {
    const full = [client.name, client.surname].filter(Boolean).join(' ');
    return full || client.email || 'Privato senza nome';
  }
  if (type === 'azienda') {
    return client.company_name || client.trade_name || client.email || 'Azienda senza nome';
  }
  if (type === 'condominio') {
    return client.condominium_name || client.email || 'Condominio senza nome';
  }
  if (type === 'pubblica amministrazione') {
    return client.entity_name || client.email || 'Ente senza nome';
  }
  if (type === 'professionista') {
    const full = [client.name, client.surname].filter(Boolean).join(' ');
    return client.studio_name || full || client.email || 'Professionista senza nome';
  }

  // Fallback
  const full = [client.name, client.surname].filter(Boolean).join(' ');
  return (
    client.company_name ||
    client.condominium_name ||
    client.entity_name ||
    client.studio_name ||
    full ||
    client.email ||
    client.phone ||
    'Cliente senza nome'
  );
}

/**
 * Compute secondary label (email / phone / fiscal code).
 * @param {object} client
 * @returns {string}
 */
export function getClientSecondaryLabel(client) {
  if (!client) return '';
  return client.email || client.pec || client.phone || client.fiscal_code || client.vat_number || '';
}