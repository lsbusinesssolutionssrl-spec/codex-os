import { Shield, Clock, CheckCircle, Archive } from 'lucide-react';

export default function InvitationAudit({ allMemberships }) {
  if (!allMemberships || allMemberships.length === 0) {
    return null;
  }

  const acceptedInvites = allMemberships.filter(m => m.joined_at);
  const pendingInvites = allMemberships.filter(m => ['invited', 'pending'].includes(m.status));
  const historicalRemoved = allMemberships.filter(m => m.status === 'removed' || m.archived_reason);

  // Group by email for duplicate detection
  const byEmail = {};
  allMemberships.forEach(m => {
    const email = m.user?.email || m.user_email || 'unknown';
    if (!byEmail[email]) {
      byEmail[email] = [];
    }
    byEmail[email].push(m);
  });

  const hasDuplicates = Object.values(byEmail).some(g => g.length > 1);

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <h4 className="font-semibold text-gray-900 mb-3 text-sm flex items-center gap-2">
        <Shield className="w-4 h-4" />
        Invitation Audit - Historical Records
      </h4>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <AuditCard 
          label="Accepted Invites" 
          value={acceptedInvites.length} 
          icon={CheckCircle} 
          color="text-green-600" 
          bgColor="bg-green-50"
        />
        <AuditCard 
          label="Pending Invites" 
          value={pendingInvites.length} 
          icon={Clock} 
          color="text-orange-600" 
          bgColor="bg-orange-50"
        />
        <AuditCard 
          label="Historical Removed" 
          value={historicalRemoved.length} 
          icon={Archive} 
          color="text-gray-600" 
          bgColor="bg-gray-50"
        />
        <AuditCard 
          label="Duplicate Users" 
          value={hasDuplicates ? Object.values(byEmail).filter(g => g.length > 1).length : 0} 
          icon={Shield} 
          color="text-red-600" 
          bgColor="bg-red-50"
        />
      </div>

      {/* Historical Invitations Detail */}
      {historicalRemoved.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
            <Archive className="w-3 h-3" />
            Historical Invitations (Archived/Removed):
          </p>
          <div className="space-y-2">
            {historicalRemoved.map(m => (
              <div key={m.id} className="p-2.5 bg-gray-50 rounded border border-gray-200 text-xs">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <span className="text-gray-500 block text-[10px]">Email</span>
                    <span className="font-mono text-gray-700">{m.user?.email || m.user_email}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">Original Role</span>
                    <span className="font-mono text-gray-700">{m.tenant_role}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">Invited At</span>
                    <span className="font-mono text-gray-700">
                      {m.invited_at ? new Date(m.invited_at).toLocaleDateString('it-IT') : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">Status</span>
                    <span className={`font-mono ${m.archived_reason ? 'text-amber-600' : 'text-gray-600'}`}>
                      {m.status}{m.archived_reason && ` (${m.archived_reason})`}
                    </span>
                  </div>
                </div>
                {m.archived_reason && (
                  <div className="mt-1.5 pt-1.5 border-t border-gray-200">
                    <span className="text-gray-500 text-[10px]">Archived Reason:</span>{' '}
                    <span className="font-mono text-amber-600 text-[10px]">{m.archived_reason}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Duplicate Detection */}
      {hasDuplicates && (
        <div className="mb-4">
          <p className="text-xs font-medium text-red-600 mb-2 flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Duplicate Memberships Detected:
          </p>
          <div className="space-y-2">
            {Object.entries(byEmail)
              .filter(([_, memberships]) => memberships.length > 1)
              .map(([email, memberships]) => (
                <div key={email} className="p-2.5 bg-red-50 rounded border border-red-200 text-xs">
                  <p className="font-mono text-red-800 mb-1.5">{email}</p>
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    {memberships.map(m => (
                      <div key={m.id} className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${
                          m.status === 'active' ? 'bg-green-500' :
                          m.status === 'removed' ? 'bg-gray-400' :
                          'bg-orange-400'
                        }`} />
                        <span className="text-gray-600">{m.tenant_role}</span>
                        <span className="text-gray-400">({m.status})</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* All Memberships by Email */}
      <div>
        <p className="text-xs font-medium text-gray-600 mb-2">All Memberships Grouped by Email:</p>
        <div className="space-y-2">
          {Object.entries(byEmail).map(([email, memberships]) => (
            <div key={email} className="p-2.5 bg-white rounded border border-gray-200 text-xs">
              <p className="font-mono text-gray-700 mb-1.5">{email}</p>
              <div className="space-y-1">
                {memberships.map(m => (
                  <div key={m.id} className="flex items-center gap-3 text-[10px]">
                    <span className={`px-1.5 py-0.5 rounded font-mono ${
                      m.status === 'active' ? 'bg-green-100 text-green-700' :
                      m.status === 'removed' ? 'bg-gray-100 text-gray-600' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {m.status}
                    </span>
                    <span className="text-gray-600">{m.tenant_role}</span>
                    {m.membership_type && (
                      <span className="text-gray-400">({m.membership_type})</span>
                    )}
                    {m.is_primary && (
                      <span className="text-blue-600 font-medium">Primary</span>
                    )}
                    {m.joined_at && (
                      <span className="text-green-600">Joined {new Date(m.joined_at).toLocaleDateString('it-IT')}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AuditCard({ label, value, icon: Icon, color, bgColor }) {
  return (
    <div className={`${bgColor} rounded-lg border p-3`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="text-[10px] text-gray-600 font-medium">{label}</span>
      </div>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}