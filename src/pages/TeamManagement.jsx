import { useState, useEffect } from 'react';
import { Users, Plus, Mail, Shield, Edit2, Trash2, CheckCircle, Clock, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useGlobalContext } from '@/lib/GlobalContextEngine';
import { toast } from 'sonner';

const ROLES = [
  { value: 'tenant_admin', label: 'Executive', color: '#7C3AED' },
  { value: 'project_manager', label: 'Project Manager', color: '#1147FF' },
  { value: 'sales', label: 'Sales', color: '#F59E0B' },
  { value: 'finance', label: 'Finance', color: '#10B981' },
  { value: 'technician', label: 'Technician', color: '#06B6D4' },
];

export default function TeamManagement() {
  const navigate = useNavigate();
  const { activeTenant } = useGlobalContext();
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [allMemberships, setAllMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'project_manager' });
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    try {
      const [memberships, users] = await Promise.all([
        base44.entities.TenantMembership.filter({ tenant_id: activeTenant.id }),
        base44.entities.User.list(),
      ]);

      const membersWithUsers = memberships.map(m => ({
        ...m,
        user: users.find(u => u.id === m.user_id),
      }));

      // Store all memberships for debug
      setAllMemberships(membersWithUsers);
      
      // Show active members
      setMembers(membersWithUsers.filter(m => m.status === 'active'));
      // Show pending invitations
      setInvitations(membersWithUsers.filter(m => ['invited', 'pending'].includes(m.status)));
      
      console.log('[TeamManagement] Debug:', {
        totalMemberships: memberships.length,
        activeMembers: membersWithUsers.filter(m => m.status === 'active').length,
        pendingInvites: membersWithUsers.filter(m => ['invited', 'pending'].includes(m.status)).length,
        removedMembers: membersWithUsers.filter(m => m.status === 'removed').length,
        suspendedMembers: membersWithUsers.filter(m => m.status === 'suspended').length,
        usersLoaded: users.length,
        membershipsMissingUser: membersWithUsers.filter(m => !m.user).length,
      });
    } catch (error) {
      console.error('Error loading team:', error);
      toast.error('Errore nel caricamento team');
    } finally {
      setLoading(false);
    }
  };

  const inviteUser = async () => {
    try {
      await base44.users.inviteUser(inviteForm.email, 'user');
      
      const currentUser = await base44.auth.me();
      await base44.entities.TenantMembership.create({
        user_id: currentUser.id,
        tenant_id: activeTenant.id,
        tenant_role: inviteForm.role,
        status: 'invited',
        invited_by: currentUser.email,
        invited_at: new Date().toISOString(),
      });

      toast.success(`Invito inviato a ${inviteForm.email}`);
      setShowInviteModal(false);
      setInviteForm({ email: '', role: 'project_manager' });
      loadTeam();
    } catch (error) {
      toast.error('Errore nell\'invio invito: ' + error.message);
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
          <h1 className="text-2xl font-bold text-gray-900">Team & Ruoli</h1>
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
          {members.map(member => (
            <div key={member.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  {member.user?.full_name?.[0]?.toUpperCase() || member.user?.email?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{member.user?.full_name || 'Invitato'}</p>
                  <p className="text-sm text-gray-500">{member.user?.email}</p>
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
          ))}
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
          <h3 className="font-semibold text-gray-900 mb-3">🔍 Team Debug</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <DebugItem label="Tenant ID" value={activeTenant?.id?.slice(0, 8) + '...'} />
            <DebugItem label="Total Memberships" value={allMemberships.length} />
            <DebugItem label="Active Members" value={members.length} />
            <DebugItem label="Pending Invites" value={invitations.length} />
            <DebugItem label="Removed" value={allMemberships.filter(m => m.status === 'removed').length} />
            <DebugItem label="Suspended" value={allMemberships.filter(m => m.status === 'suspended').length} />
            <DebugItem label="Missing User Profile" value={allMemberships.filter(m => !m.user).length} />
            <DebugItem label="Users Loaded" value={allMemberships.filter(m => m.user).length} />
          </div>
          {allMemberships.length > 0 && (
            <div className="mt-3 text-xs text-gray-500">
              <p className="font-medium mb-1">All Memberships:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {allMemberships.map(m => (
                  <li key={m.id}>
                    {m.user?.email || 'No user'} - {m.tenant_role} - {m.status}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Invitations */}
      {invitations.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Inviti in Attesa</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {invitations.map(inv => (
              <div key={inv.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{inv.user?.email || 'Email non disponibile'}</p>
                    <p className="text-sm text-gray-500">
                      {ROLES.find(r => r.value === inv.tenant_role)?.label} • Invitato da {inv.invited_by}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    In attesa
                  </span>
                </div>
              </div>
            ))}
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