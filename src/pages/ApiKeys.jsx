import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Key, Plus, Copy, Trash2, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ApiKeys() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyForm, setNewKeyForm] = useState({ name: '', scopes: [], notes: '' });
  const [copiedId, setCopiedId] = useState(null);

  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => base44.entities.ApiKey.list(),
  });

  const createKey = useMutation({
    mutationFn: (data) => base44.entities.ApiKey.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setShowCreate(false);
      setNewKeyForm({ name: '', scopes: [], notes: '' });
    },
  });

  const revokeKey = useMutation({
    mutationFn: (id) => base44.entities.ApiKey.update(id, { status: 'revoked' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['api-keys'] }),
  });

  const AVAILABLE_SCOPES = [
    'read:projects', 'write:projects',
    'read:estimates', 'write:estimates',
    'read:clients', 'write:clients',
    'read:documents',
    'read:tickets', 'write:tickets',
  ];

  const toggleScope = (scope) => {
    setNewKeyForm(f => ({
      ...f,
      scopes: f.scopes.includes(scope) ? f.scopes.filter(s => s !== scope) : [...f.scopes, scope]
    }));
  };

  const handleCreate = () => {
    const prefix = Math.random().toString(36).substr(2, 8).toUpperCase();
    createKey.mutate({
      ...newKeyForm,
      key_prefix: prefix,
      status: 'active',
    });
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage API access for external integrations</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium"
          style={{ backgroundColor: '#1147FF' }}
        >
          <Plus className="w-4 h-4" />
          Create Key
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800">API is in preview</p>
          <p className="text-xs text-amber-600 mt-0.5">The REST API is not yet publicly available. API keys are pre-configured for when the API launches.</p>
        </div>
      </div>

      {/* Keys List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Key className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Your API Keys</h2>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : apiKeys.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <Key className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No API keys yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {apiKeys.map(key => (
              <div key={key.id} className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${key.status === 'active' ? 'bg-green-400' : 'bg-gray-300'}`} />
                  <div>
                    <p className="font-medium text-gray-900">{key.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono text-gray-600">
                        ck_{key.key_prefix}...
                      </code>
                      {key.last_used_at && (
                        <span className="text-xs text-gray-400">Last used: {new Date(key.last_used_at).toLocaleDateString('it-IT')}</span>
                      )}
                    </div>
                    {key.scopes?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {key.scopes.map(s => (
                          <span key={s} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(`ck_${key.key_prefix}`, key.id)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    title="Copy key prefix"
                  >
                    {copiedId === key.id ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                  {key.status === 'active' && (
                    <button
                      onClick={() => revokeKey.mutate(key.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Revoke key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
            <h2 className="font-bold text-gray-900">Create API Key</h2>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Key Name *</label>
              <input
                value={newKeyForm.name}
                onChange={e => setNewKeyForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Production Integration"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Scopes</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_SCOPES.map(scope => (
                  <button
                    key={scope}
                    onClick={() => toggleScope(scope)}
                    className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                      newKeyForm.scopes.includes(scope)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {scope}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
              <input
                value={newKeyForm.notes}
                onChange={e => setNewKeyForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="What is this key for?"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleCreate}
                disabled={!newKeyForm.name.trim() || createKey.isPending}
                className="flex-1 py-2 text-sm text-white rounded-lg font-medium disabled:opacity-40"
                style={{ backgroundColor: '#1147FF' }}
              >
                {createKey.isPending ? 'Creating...' : 'Create Key'}
              </button>
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-600">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}