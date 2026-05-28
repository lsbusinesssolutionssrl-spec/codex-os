import { base44 } from '@/api/base44Client';

/**
 * PropertyService — shared property data access layer.
 */

/**
 * Load all properties for a given tenant.
 * @param {string} tenantId
 * @param {string|null} clientId - optional, filter by client
 */
export async function getProperties(tenantId, clientId = null) {
  if (!tenantId) throw new Error('tenantId is required');
  const filter = { company_id: tenantId };
  if (clientId) filter.client_id = clientId;
  return base44.entities.Property.filter(filter, '-created_date');
}