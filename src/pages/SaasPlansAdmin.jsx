import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Building2, Check, Plus, Edit, Trash2, Zap, Users, HardDrive } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function SaasPlansAdmin() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price_monthly: 0,
    price_yearly: 0,
    is_active: true,
    is_popular: false,
    features: [],
    quotas: {
      max_users: 5,
      max_projects: 10,
      max_estimates_per_month: 20,
      max_storage_gb: 5,
      max_tickets_per_month: 50,
      max_clients: 50,
      max_properties: 100,
      ai_requests_per_month: 100,
      guardian_subscriptions: 10,
      custom_reports: false,
      api_access: false,
      priority_support: false,
      white_label: false,
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansData, companies, subs] = await Promise.all([
        base44.entities.SubscriptionPlan.list(),
        base44.entities.Company.list(),
        base44.entities.CompanySubscription.list(),
      ]);
      setPlans(plansData || []);
      setTenants(companies || []);
      setSubscriptions(subs || []);
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Errore nel caricamento dati');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setForm({
        name: plan.name || '',
        description: plan.description || '',
        price_monthly: plan.price_monthly || 0,
        price_yearly: plan.price_yearly || 0,
        is_active: plan.is_active ?? true,
        is_popular: plan.is_popular ?? false,
        features: plan.features || [],
        quotas: {
          max_users: plan.quotas?.max_users || 5,
          max_projects: plan.quotas?.max_projects || 10,
          max_estimates_per_month: plan.quotas?.max_estimates_per_month || 20,
          max_storage_gb: plan.quotas?.max_storage_gb || 5,
          max_tickets_per_month: plan.quotas?.max_tickets_per_month || 50,
          max_clients: plan.quotas?.max_clients || 50,
          max_properties: plan.quotas?.max_properties || 100,
          ai_requests_per_month: plan.quotas?.ai_requests_per_month || 100,
          guardian_subscriptions: plan.quotas?.guardian_subscriptions || 10,
          custom_reports: plan.quotas?.custom_reports || false,
          api_access: plan.quotas?.api_access || false,
          priority_support: plan.quotas?.priority_support || false,
          white_label: plan.quotas?.white_label || false,
        }
      });
    } else {
      setEditingPlan(null);
      setForm({
        name: '',
        description: '',
        price_monthly: 0,
        price_yearly: 0,
        is_active: true,
        is_popular: false,
        features: [],
        quotas: {
          max_users: 5,
          max_projects: 10,
          max_estimates_per_month: 20,
          max_storage_gb: 5,
          max_tickets_per_month: 50,
          max_clients: 50,
          max_properties: 100,
          ai_requests_per_month: 100,
          guardian_subscriptions: 10,
          custom_reports: false,
          api_access: false,
          priority_support: false,
          white_label: false,
        }
      });
    }
    setShowModal(true);
  };

  const savePlan = async () => {
    try {
      if (editingPlan) {
        await base44.entities.SubscriptionPlan.update(editingPlan.id, form);
        toast.success('Piano aggiornato');
      } else {
        await base44.entities.SubscriptionPlan.create(form);
        toast.success('Piano creato');
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Errore nel salvataggio');
    }
  };

  const deletePlan = async (planId) => {
    if (!confirm('Sei sicuro di voler eliminare questo piano?')) return;
    try {
      await base44.entities.SubscriptionPlan.delete(planId);
      toast.success('Piano eliminato');
      loadData();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Errore nell\'eliminazione');
    }
  };

  const assignPlanToTenant = async (tenantId, planId) => {
    try {
      const existingSub = subscriptions.find(s => s.company_id === tenantId);
      if (existingSub) {
        await base44.entities.CompanySubscription.update(existingSub.id, {
          plan_id: planId,
          status: 'active'
        });
      } else {
        await base44.entities.CompanySubscription.create({
          company_id: tenantId,
          plan_id: planId,
          status: 'active',
          billing_cycle: 'monthly',
          trial_start: new Date().toISOString().split('T')[0],
          trial_end: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        });
      }
      toast.success('Piano assegnato al tenant');
      loadData();
    } catch (error) {
      console.error('Assign error:', error);
      toast.error('Errore nell\'assegnazione');
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-400">Caricamento...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestione Piani SaaS</h1>
          <p className="text-sm text-gray-500">Crea, modifica e assegna piani ai tenant</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg font-medium"
          style={{ backgroundColor: '#1147FF' }}
        >
          <Plus className="w-4 h-4" />
          Nuovo Piano
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map(plan => {
          const assignedCount = subscriptions.filter(s => s.plan_id === plan.id).length;
          
          return (
            <div key={plan.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                  <p className="text-xs text-gray-500">{plan.description}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openModal(plan)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => deletePlan(plan.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-2xl font-bold text-gray-900">€{plan.price_monthly}<span className="text-sm font-normal text-gray-500">/mese</span></div>
                {plan.price_yearly && (
                  <p className="text-xs text-gray-500">€{plan.price_yearly}/anno</p>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>{assignedCount} tenant</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  <span>{plan.quotas?.max_users || 5} utenti max</span>
                </div>
                <div className="flex items-center gap-1">
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>{plan.quotas?.max_storage_gb || 5}GB storage</span>
                </div>
              </div>

              {/* Quick Assign */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Assegna a Tenant</label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      assignPlanToTenant(e.target.value, plan.id);
                      e.target.value = '';
                    }
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
                  defaultValue=""
                >
                  <option value="">Seleziona tenant...</option>
                  {tenants
                    .filter(t => !subscriptions.find(s => s.company_id === t.id && s.plan_id === plan.id))
                    .map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
              </div>
            </div>
          );
        })}
        
        {plans.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400">
            <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Nessun piano configurato</p>
            <p className="text-xs">Crea il primo piano per iniziare</p>
          </div>
        )}
      </div>

      {/* Subscriptions Overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Subscription Attive</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 font-medium text-gray-600">Tenant</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">Piano</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">Stato</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">Billing</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">MRR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {subscriptions.map(sub => {
                const tenant = tenants.find(t => t.id === sub.company_id);
                const plan = plans.find(p => p.id === sub.plan_id);
                return (
                  <tr key={sub.id}>
                    <td className="py-2 px-3">{tenant?.name || '—'}</td>
                    <td className="py-2 px-3">{plan?.name || '—'}</td>
                    <td className="py-2 px-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        sub.status === 'active' ? 'bg-green-100 text-green-700' :
                        sub.status === 'trial' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-2 px-3">{sub.billing_cycle}</td>
                    <td className="py-2 px-3 font-medium">€{sub.mrr || 0}</td>
                  </tr>
                );
              })}
              {subscriptions.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-400">Nessuna subscription attiva</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold">{editingPlan ? 'Modifica Piano' : 'Nuovo Piano'}</h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Nome Piano</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({...f, name: e.target.value}))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                    placeholder="Es: Starter, Professional, Enterprise"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Descrizione</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={e => setForm(f => ({...f, description: e.target.value}))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                    placeholder="Breve descrizione"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Prezzo Mensile (€)</label>
                  <input
                    type="number"
                    value={form.price_monthly}
                    onChange={e => setForm(f => ({...f, price_monthly: parseFloat(e.target.value) || 0}))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Prezzo Annuale (€)</label>
                  <input
                    type="number"
                    value={form.price_yearly}
                    onChange={e => setForm(f => ({...f, price_yearly: parseFloat(e.target.value) || 0}))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Quotas */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Quote & Limiti</h3>
                <div className="grid grid-cols-2 gap-3">
                  <QuotaField label="Utenti Max" value={form.quotas.max_users} onChange={v => setForm(f => ({...f, quotas: {...f.quotas, max_users: v}}))} />
                  <QuotaField label="Progetti Max" value={form.quotas.max_projects} onChange={v => setForm(f => ({...f, quotas: {...f.quotas, max_projects: v}}))} />
                  <QuotaField label="Storage (GB)" value={form.quotas.max_storage_gb} onChange={v => setForm(f => ({...f, quotas: {...f.quotas, max_storage_gb: v}}))} />
                  <QuotaField label="AI Request/Mese" value={form.quotas.ai_requests_per_month} onChange={v => setForm(f => ({...f, quotas: {...f.quotas, ai_requests_per_month: v}}))} />
                  <QuotaField label="Clienti Max" value={form.quotas.max_clients} onChange={v => setForm(f => ({...f, quotas: {...f.quotas, max_clients: v}}))} />
                  <QuotaField label="Proprietà Max" value={form.quotas.max_properties} onChange={v => setForm(f => ({...f, quotas: {...f.quotas, max_properties: v}}))} />
                </div>
              </div>

              {/* Features */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Features (una per riga)</h3>
                <textarea
                  value={form.features.join('\n')}
                  onChange={e => setForm(f => ({...f, features: e.target.value.split('\n').filter(l => l.trim())}))}
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                  placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-3">
                <ToggleField label="Custom Reports" value={form.quotas.custom_reports} onChange={v => setForm(f => ({...f, quotas: {...f.quotas, custom_reports: v}}))} />
                <ToggleField label="API Access" value={form.quotas.api_access} onChange={v => setForm(f => ({...f, quotas: {...f.quotas, api_access: v}}))} />
                <ToggleField label="Priority Support" value={form.quotas.priority_support} onChange={v => setForm(f => ({...f, quotas: {...f.quotas, priority_support: v}}))} />
                <ToggleField label="White Label" value={form.quotas.white_label} onChange={v => setForm(f => ({...f, quotas: {...f.quotas, white_label: v}}))} />
                <ToggleField label="Piano Attivo" value={form.is_active} onChange={v => setForm(f => ({...f, is_active: v}))} />
                <ToggleField label="Più Popolare" value={form.is_popular} onChange={v => setForm(f => ({...f, is_popular: v}))} />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                Annulla
              </button>
              <button onClick={savePlan} className="px-4 py-2 text-sm text-white rounded-lg" style={{ backgroundColor: '#1147FF' }}>
                Salva Piano
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuotaField({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(parseInt(e.target.value) || 0)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
      />
    </div>
  );
}

function ToggleField({ label, value, onChange }) {
  return (
    <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
      <span className="text-sm text-gray-700">{label}</span>
      <input
        type="checkbox"
        checked={value}
        onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 text-blue-600 rounded"
      />
    </label>
  );
}