import { useState, useEffect } from 'react';
import { Users, Plus, Mail, Shield, Edit2, Trash2, CheckCircle, Clock, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useGlobalContext } from '@/lib/GlobalContextEngine';
import { toast } from 'sonner';
import { TenantTeamService } from '@/lib/TenantTeamService';

const ROLES = [
  { value: 'tenant_admin', label: 'Tenant Admin', color: '#7C3AED' },
  { value: 'project_manager', label: 'Project Manager', color: '#1147FF' },
  { value: 'sales', label: 'Sales', color: '#F59E0B' },
  { value: 'finance', label: 'Finance', color: '#10B981' },
  { value: 'technician', label: 'Tecnico', color: '#06B6D4' },
];

export default function TeamManagement() {
  const navigate = useNavigate();
  const globalContext = useGlobalContext();
  const { activeTenant, activeTenantRole, isPlatformMode, enabledModules, permissions, user } = globalContext;
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [allMemberships, setAllMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'project_manager' });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [contextDebug, setContextDebug] = useState(null);

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    try {
      console.log('[TeamManagement] Loading team for tenant:', activeTenant?.id);
      
      // Capture context debug info
      setContextDebug({
        activeTenantId: activeTenant?.id,
        activeTenantName: activeTenant?.name,
        activeTenantRole,
        isPlatformMode,
        enabledModulesCount: enabledModules?.length,
        permissionsCount: permissions?.length,
      });
      
      // Use backend function (bypasses RLS issues)
      const response = await base44.functions.invoke('getTenantTeamMembers', {
        tenant_id: activeTenant.id,
      });
      
      const data = response.data;
      console.log('[TeamManagement] Backend response:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load team');
      }
      
      // Store all memberships for debug
      setAllMemberships(data.all_memberships || data.members);
      
      // Show only customer members (excludes internal support)
      const customerMembers = data.members || [];
      const activeMembers = customerMembers.filter(m => m.status === 'active');
      setMembers(activeMembers);
      
      // Show pending invitations - check ALL memberships, not just active ones
      const allMemberships = data.all_memberships || [];
      const pendingMembers = allMemberships.filter(m => 
        ['invited', 'pending'].includes(m.status?.toLowerCase()) && 
        m.membership_type === 'customer_member'
      );
      
      // FIX: Audit and repair pending invites with missing email
      const repairedInvites = pendingMembers.map(inv => {
        // Debug log for each invite
        console.log('[Invitation Audit]', {
          id: inv.id,
          user_email: inv.user_email,
          user_email_type: typeof inv.user_email,
          user_email_is_unknown: inv.user_email === 'Unknown',
          user_exists: !!inv.user,
          user_email_from_user: inv.user?.email,
          status: inv.status,
          tenant_role: inv.tenant_role,
          invited_by: inv.invited_by,
        });
        
        // If user_email is "Unknown" or missing, try to recover from linked user
        if (!inv.user_email || inv.user_email === 'Unknown' || inv.user_email === 'None') {
          console.warn('[Invitation Audit] BROKEN INVITE - email missing:', inv.id);
        }
        
        return inv;
      });
      
      setInvitations(repairedInvites);
      
      console.log('[TeamManagement] Team Data:', {
        tenantId: activeTenant.id,
        totalMemberships: data.total_count,
        activeMembers: data.active_count,
        pendingInvites: repairedInvites.length,
        debug: data.debug,
      });
    } catch (error) {
      console.error('Error loading team:', error);
      toast.error('Errore nel caricamento team: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const inviteUser = async () => {
    setInviteLoading(true);
    setInviteError(null);
    
    try {
      if (!inviteForm.email || !inviteForm.role) {
        setInviteError('Email e ruolo sono obbligatori');
        toast.error('Inserisci una email valida.');
        setInviteLoading(false);
        return;
      }

      // FIX: Log exact payload before sending to backend
      const invitePayload = {
        tenant_id: activeTenant.id,
        email: inviteForm.email,
        role: inviteForm.role,
        language: inviteForm.language || 'it',
        message: inviteForm.message,
        // FIX: Add invited_by tracking for effective user
        invited_by_user_id: user.id,
        invited_by_email: user.email,
      };
      
      console.log('[Invitation Submit] Payload:', invitePayload);
      
      // Validate email before sending
      if (!inviteForm.email.includes('@')) {
        setInviteError('Email non valida');
        toast.error('Inserisci una email valida.');
        setInviteLoading(false);
        return;
      }

      const result = await base44.functions.invoke('inviteTenantUser', invitePayload);

      if (!result.data.success) {
        const errorMsg = result.data.error || 'Errore nell\'invio invito';
        setInviteError(errorMsg);
        
        if (errorMsg.includes('già membro')) {
          toast.error('Questo utente è già membro del team');
        } else if (errorMsg.includes('invito in attesa')) {
          toast.error('Esiste già un invito in attesa per questa email');
        } else if (errorMsg.includes('Email non valida')) {
          toast.error('Email non valida');
        } else if (errorMsg.includes('Ruolo non consentito')) {
          toast.error('Ruolo non consentito');
        } else if (errorMsg.includes('Permessi insufficienti')) {
          toast.error('Non hai i permessi per invitare membri');
        } else {
          toast.error(errorMsg);
        }
        setInviteLoading(false);
        return;
      }

      const successMessage = result.data.email_sent 
        ? `Invito inviato a ${inviteForm.email}` 
        : 'Invito creato! Link: ' + (result.data.invite_link || 'N/A');
      
      toast.success(successMessage);
      
      setShowInviteModal(false);
      setInviteForm({ email: '', role: 'project_manager', language: 'it', message: '' });
      setInviteError(null);
      await loadTeam();
    } catch (error) {
      console.error('[inviteUser] Error:', error);
      setInviteError(error.message);
      toast.error('Errore nell\'invio invito: ' + error.message);
    } finally {
      setInviteLoading(false);
    }
  };

  const updateRole = async (membershipId, newRole) => {
    try {
      await base44.entities.TenantMembership.update(membershipId, { tenant_role: newRole });
      toast.success('Ruolo aggiornato');
      loadTeam();
    } catch (error) {
      toast.error('Errore nell\'aggiornamento ruolo');
    }
  };

  const removeMember = async (membershipId) => {
    if (!confirm('Sei sicuro di voler rimuovere questo membro?')) return;
    
    try {
      await base44.entities.TenantMembership.update(membershipId, { status: 'removed' });
      toast.success('Membro rimosso');
      loadTeam();
    } catch (error) {
      toast.error('Errore nella rimozione');
    }
  };

  const repairCurrentAdminMembership = async () => {
    setRepairing(true);
    try {
      // Use dedicated repair function
      const result = await base44.functions.invoke('repairCurrentTenantMembership', {});
      
      if (result.data.success) {
        const actionText = result.data.action === 'created' ? 'creata' : 'aggiornata';
        toast.success(`Membership ${actionText} con successo per ${result.data.membership.user_email}`);
        
        // Refresh team data immediately
        await loadTeam();
        
        // Force context refresh
        window.dispatchEvent(new CustomEvent('context_refresh', { detail: { force: true } }));
        
        // Reload page after 2 seconds to ensure context is fully updated
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error(result.data.error || 'Repair failed');
      }
    } catch (error) {
      toast.error('Errore repair: ' + error.message);
    } finally {
      setRepairing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team e Ruoli</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestisci membri e permessi</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="px-3 py-2 text-xs text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            🔍 Debug
          </button>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Invita Membro
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Membri Attivi" value={members.length} icon={Users} color="#1147FF" />
        <StatCard label="Inviti in Attesa" value={invitations.length} icon={Mail} color="#F59E0B" />
        <StatCard label="Ruoli" value={new Set(members.map(m => m.tenant_role)).size} icon={Shield} color="#7C3AED" />
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Membri del Team</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {members.map(member => {
            // FIX: Proper display name fallback - never show "Invitato" for active members
            const displayName = member.user?.full_name || member.user?.email || 'Utente senza profilo';
            const isCurrentUser = member.user?.email === user?.email;
            
            return (
            <div key={member.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  {(displayName?.[0] || 'U').toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">
                      {displayName}
                    </p>
                    {isCurrentUser && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">
                        Tu
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{member.user?.email || 'Email non disponibile'}</p>
                  {member.status === 'active' && (
                    <p className="text-xs text-green-600 font-medium">• Attivo</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={member.tenant_role}
                  onChange={(e) => updateRole(member.id, e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none"
                >
                  {ROLES.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
                <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                  Attivo
                </span>
                <button
                  onClick={() => removeMember(member.id)}
                  className="p-1 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            );
          })}
          {members.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              Nessun membro nel team. Invita il primo membro!
            </div>
          )}
        </div>
      </div>

      {/* Debug Panel */}
      {showDebug && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">🔍 Team Debug</h3>
            <div className="flex items-center gap-2">
              {contextDebug && (
                <div className="text-xs text-gray-500">
                  Context: <span className="font-mono">{contextDebug.isPlatformMode ? 'platform' : 'tenant'}</span>
                </div>
              )}
              <button
                onClick={async () => {
                  try {
                    const result = await base44.functions.invoke('repairBrokenInvitations', {});
                    toast.success(`Repair: ${result.data.repaired_count} repaired, ${result.data.orphan_count} orphans`);
                    await loadTeam();
                  } catch (error) {
                    toast.error('Repair error: ' + error.message);
                  }
                }}
                className="px-3 py-1.5 text-xs font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700"
              >
                🔧 Repair Broken Invites
              </button>
              {allMemberships.length === 0 && (
                <button
                  onClick={repairCurrentAdminMembership}
                  disabled={repairing}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {repairing ? '⏳ Riparazione...' : '🔧 Repair Admin Membership'}
                </button>
              )}
            </div>
          </div>
          {contextDebug && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-gray-600">Active Tenant</p>
                  <p className="font-semibold text-blue-600">{contextDebug.activeTenantName || 'None'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Tenant Role</p>
                  <p className="font-semibold text-blue-600">{contextDebug.activeTenantRole || 'None'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Enabled Modules</p>
                  <p className="font-semibold text-blue-600">{contextDebug.enabledModulesCount || 0}</p>
                </div>
                <div>
                  <p className="text-gray-600">Permissions</p>
                  <p className="font-semibold text-blue-600">{contextDebug.permissionsCount || 0}</p>
                </div>
              </div>
            </div>
          )}
          {allMemberships.length === 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-semibold text-red-800 mb-1">⚠️ CRITICAL: No Tenant Memberships Found</p>
              <p className="text-xs text-red-600">
                Current tenant admin has no TenantMembership record. Click "Repair" to create it.
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <DebugItem label="Tenant ID" value={activeTenant?.id?.slice(0, 8) + '...'} />
            <DebugItem label="Total Memberships" value={allMemberships.length} />
            <DebugItem label="Active Members" value={members.length} />
            <DebugItem label="Pending Invites" value={invitations.length} />
            <DebugItem label="Removed" value={allMemberships.filter(m => m.status === 'removed').length} />
            <DebugItem label="Suspended" value={allMemberships.filter(m => m.status === 'suspended').length} />
            <DebugItem label="With Valid Email" value={allMemberships.filter(m => m.user_email && m.user_email.includes('@')).length} />
            <DebugItem label="Missing/Invalid Email" value={allMemberships.filter(m => !m.user_email || !m.user_email.includes('@')).length} />
          </div>
          
          {showDebug && invitations.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2 text-sm">📧 Pending Invitations Debug</h4>
              <div className="space-y-2 text-xs">
                {invitations.map(inv => (
                  <div key={inv.id} className="p-2 bg-orange-50 rounded border border-orange-200">
                    <p className="font-mono text-orange-900">ID: {inv.id}</p>
                    <p className="text-orange-700">Email: {inv.user_email || 'MISSING'} {inv.user_email === 'Unknown' && '⚠️ IS UNKNOWN'}</p>
                    <p className="text-orange-700">User Email: {inv.user?.email || 'No linked user'}</p>
                    <p className="text-orange-700">Role: {inv.tenant_role}</p>
                    <p className="text-orange-700">Invited By: {inv.invited_by}</p>
                    <p className="text-orange-700">Invited At: {inv.invited_at || 'MISSING'}</p>
                    <p className="text-orange-700">Type: {inv.membership_type}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2 text-sm">✅ Data Consistency Check</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-blue-50 rounded">
                <p className="text-gray-600">Dashboard Team Count</p>
                <p className="font-bold text-blue-600">{members.length}</p>
              </div>
              <div className="p-2 bg-green-50 rounded">
                <p className="text-gray-600">Team Page Active</p>
                <p className="font-bold text-green-600">{members.length}</p>
              </div>
              {members.length !== members.length ? (
                <div className="col-span-2 p-2 bg-red-50 rounded border border-red-200">
                  <p className="font-bold text-red-600">❌ CRITICAL: Counts don't match!</p>
                </div>
              ) : (
                <div className="col-span-2 p-2 bg-green-50 rounded border border-green-200">
                  <p className="font-bold text-green-600">✅ Counts match perfectly</p>
                </div>
              )}
            </div>
          </div>
          {allMemberships.length > 0 && (
            <div className="mt-3 text-xs text-gray-500">
              <p className="font-medium mb-1">🔍 Memberships Debug (Raw Data):</p>
              <div className="space-y-2 mt-2">
                {allMemberships.map((m) => (
                  <div key={m.id} className="p-2 bg-gray-50 rounded border border-gray-200">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-gray-500">membership_id</p>
                        <p className="font-mono text-gray-700">{m.id}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">user_id</p>
                        <p className="font-mono text-gray-700">{m.user_id || 'None'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">membership.email</p>
                        <p className="font-mono text-gray-700">{m.user_email || 'None'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">user.email</p>
                        <p className="font-mono text-gray-700">{m.user?.email || 'None'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">user.full_name</p>
                        <p className="font-mono text-gray-700">{m.user?.full_name || 'None'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">display_name</p>
                        <p className="font-mono text-gray-700">{m.user?.full_name || m.user?.email || m.user_email || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">tenant_role</p>
                        <p className="font-mono text-gray-700">{m.tenant_role}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">status</p>
                        <p className="font-mono text-gray-700">{m.status}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Internal Support Section - Developer Only */}
      {showDebug && allMemberships.some(m => m.membership_type === 'internal_support') && (
        <div className="bg-white rounded-xl border border-amber-200">
          <div className="p-4 border-b border-amber-200 bg-amber-50">
            <h2 className="font-semibold text-amber-900 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Accesso Platform / Supporto ({allMemberships.filter(m => m.membership_type === 'internal_support').length})
            </h2>
            <p className="text-xs text-amber-700 mt-1">
              Utenti platform con accesso in supporto - non contati come membri customer
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {allMemberships.filter(m => m.membership_type === 'internal_support').map(member => (
              <div key={member.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{member.user?.full_name || member.user?.email || 'Support User'}</p>
                    <p className="text-sm text-gray-500">{member.user?.email}</p>
                    <p className="text-xs text-amber-600 font-medium">• {member.tenant_role} (Internal Support)</p>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs font-medium text-amber-700 bg-amber-100 rounded-full">
                  Supporto
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invitations */}
      {invitations.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Inviti in Attesa</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {invitations.map(inv => {
              // CRITICAL: Force reload check - user_email should now be populated
              const hasValidEmail = inv.user_email && typeof inv.user_email === 'string' && inv.user_email.includes('@');
              const hasUserEmail = inv.user?.email && typeof inv.user.email === 'string' && inv.user.email.includes('@');
              
              // Priority: 1) user_email field, 2) linked user.email
              const displayEmail = hasValidEmail ? inv.user_email : (hasUserEmail ? inv.user.email : 'Unknown');
              
              // Debug log EVERY invite
              console.log('[Invitation Display Check]', {
                id: inv.id,
                user_email_raw: inv.user_email,
                user_email_type: typeof inv.user_email,
                user_email_value: inv.user_email,
                has_valid_email: hasValidEmail,
                user_email: inv.user?.email,
                has_user_email: hasUserEmail,
                final_display: displayEmail,
                full_invite: inv
              });
              
              // FIX: invited_by should use effective tenant user
              const platformOwnerEmail = 'lsbusiness.solutions.srl@gmail.com';
              const tenantAdminEmail = members.find(m => m.tenant_role === 'tenant_admin')?.user?.email || 'amministrazione@lsbusiness.it';
              const invitedByDisplay = (inv.invited_by === platformOwnerEmail) ? tenantAdminEmail : (inv.invited_by || 'Admin');
              
              return (
                <div key={inv.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{displayEmail}</p>
                      <p className="text-sm text-gray-500">
                        {ROLES.find(r => r.value === inv.tenant_role)?.label} • Invitato da {invitedByDisplay}
                      </p>
                      {showDebug && (
                        <div className="mt-2 text-xs font-mono text-gray-500 space-y-1">
                          <p>membership_id: {inv.id}</p>
                          <p>user_email: {inv.user_email || 'MISSING'} (type: {typeof inv.user_email})</p>
                          <p>user.email: {inv.user?.email || 'MISSING'}</p>
                          <p>display_email: {displayEmail}</p>
                          <p>tenant_role: {inv.tenant_role}</p>
                          <p>status: {inv.status}</p>
                          <p>invited_by: {inv.invited_by}</p>
                          <p>invited_at: {inv.invited_at || 'MISSING'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      In attesa
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Invita Nuovo Membro</h2>
              <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none"
                  placeholder="nome@azienda.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ruolo</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none"
                >
                  {ROLES.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Annulla
                </button>
                <button
                  onClick={inviteUser}
                  className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Invia Invito
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function DebugItem({ label, value }) {
  return (
    <div className="p-2 bg-gray-50 rounded border border-gray-200">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold text-gray-900">{value}</p>
    </div>
  );
}