import { useState, useEffect } from 'react';
import { Users, Mail, Phone, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function Team() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const all = await base44.entities.User.list();
        setUsers(all);
      } catch (e) {
        console.error('Error loading users:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const roleColors = {
    admin: 'bg-purple-100 text-purple-700',
    user: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-sm text-gray-500">{users.length} membri del team</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium" style={{ backgroundColor: '#1147FF' }}>
          <Plus className="w-4 h-4" /> Invita Membro
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map(u => (
            <div key={u.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white" style={{ backgroundColor: '#0B2341' }}>
                  {(u.full_name || u.email || '').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">{u.full_name || 'Utente'}</h3>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{u.email}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-2 ${roleColors[u.role] || roleColors.user}`}>
                    {u.role || 'user'}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <a href={`mailto:${u.email}`} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700">
                  <Mail className="w-3.5 h-3.5" /> Email
                </a>
                {/* Phone would need to be stored on User entity */}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}