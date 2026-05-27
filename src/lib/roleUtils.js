import { base44 } from '@/api/base44Client';

/**
 * Verifica se l'utente corrente ha il ruolo specificato o è admin
 */
export async function hasRole(requiredRoles) {
  try {
    const user = await base44.auth.me();
    if (!user) return false;
    
    // Admin ha accesso a tutto
    if (user.role === 'admin') return true;
    
    // Se requiredRoles è una stringa, la converto in array
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    return roles.includes(user.role);
  } catch {
    return false;
  }
}

/**
 * Verifica se l'utente può modificare campi finanziari
 */
export async function canEditFinancialFields() {
  return hasRole(['admin', 'project_manager']);
}

/**
 * Verifica se l'utente può vedere tutti i progetti o solo quelli assegnati
 */
export async function getProjectFilter() {
  const user = await base44.auth.me();
  if (!user) return { created_by: user?.email };
  
  // Admin e PM vedono tutti i progetti
  if (user.role === 'admin' || user.role === 'project_manager') {
    return {};
  }
  
  // Technician e Sales vedono solo progetti dove sono team member o creatori
  return {
    $or: [
      { created_by: user.email },
      { team_members: user.email }
    ]
  };
}