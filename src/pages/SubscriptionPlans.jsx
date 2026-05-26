import { useState, useEffect } from 'react';
import { Check, Crown, Zap, Building2, CreditCard } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);

  useEffect(() => {
    const load = async () => {
      const [plansData, companyRes] = await Promise.all([
        base44.entities.SubscriptionPlan.filter({ is_active: true }),
        base44.functions.invoke('getCurrentCompany', {})
      ]);
      setPlans(plansData);
      setCurrentSubscription(companyRes.data.subscription);
      setLoading(false);
    };
    load();
  }, []);

  const upgrade = async (planId, billingCycle) => {
    setUpgrading(planId);
    try {
      // In production, this would redirect to Stripe checkout
      // For now, simulate upgrade
      await base44.entities.CompanySubscription.update(currentSubscription.id, {
        plan_id: planId,
        billing_cycle: billingCycle,
        status: 'active'
      });
      toast.success('Piano attivato con successo!');
      setCurrentSubscription(prev => ({ ...prev, plan_id: planId, billing_cycle: billingCycle }));
    } catch (error) {
      toast.error('Errore nell\'upgrade');
    } finally {
      setUpgrading(null);
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-400">Caricamento...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900">Scegli il Piano Perfetto</h1>
        <p className="text-gray-500 mt-2">Piani flessibili per aziende di ogni dimensione. 14 giorni di trial gratuito.</p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan, idx) => {
          const isCurrent = currentSubscription?.plan_id === plan.id;
          const isPopular = plan.is_popular;
          
          return (
            <div 
              key={plan.id} 
              className={`relative rounded-2xl border-2 p-6 transition-all ${
                isCurrent 
                  ? 'border-green-500 bg-green-50' 
                  : isPopular 
                    ? 'border-blue-500 shadow-lg' 
                    : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {isPopular && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-semibold text-white rounded-full" style={{ backgroundColor: '#1147FF' }}>
                  PIÙ POPOLARE
                </div>
              )}
              
              {isCurrent && (
                <div className="absolute top-4 right-4 text-green-600">
                  <Check className="w-6 h-6" />
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-gray-900">€{plan.price_monthly}</span>
                  <span className="text-gray-500">/mese</span>
                </div>
                {plan.price_yearly && (
                  <p className="text-xs text-gray-500 mt-1">oppure €{plan.price_yearly}/anno (risparmia {Math.round((1 - plan.price_yearly / (plan.price_monthly * 12)) * 100)}%)</p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2 mb-6">
                {plan.features?.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Quotas Preview */}
              <div className="space-y-2 mb-6 pb-6 border-b border-gray-200">
                <QuotaPreview label="Utenti" value={plan.quotas?.max_users} />
                <QuotaPreview label="Progetti" value={plan.quotas?.max_projects} />
                <QuotaPreview label="Storage" value={plan.quotas?.max_storage_gb} suffix="GB" />
                <QuotaPreview label="AI requests/mese" value={plan.quotas?.ai_requests_per_month} />
              </div>

              {/* CTA */}
              {isCurrent ? (
                <button disabled className="w-full py-3 text-sm font-semibold text-green-600 bg-green-100 rounded-lg">
                  Piano Attivo
                </button>
              ) : (
                <div className="space-y-2">
                  <button 
                    onClick={() => upgrade(plan.id, 'monthly')}
                    disabled={upgrading === plan.id}
                    className="w-full py-3 text-sm font-semibold text-white rounded-lg disabled:opacity-40"
                    style={{ backgroundColor: '#1147FF' }}
                  >
                    {upgrading === plan.id ? 'Attivazione...' : 'Inizia Trial'}
                  </button>
                  {plan.price_yearly && (
                    <button 
                      onClick={() => upgrade(plan.id, 'yearly')}
                      disabled={upgrading === plan.id}
                      className="w-full py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                    >
                      Fatturazione annuale (€{plan.price_yearly})
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Enterprise CTA */}
      <div className="mt-8 p-6 bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl text-white text-center">
        <Crown className="w-8 h-8 mx-auto mb-3 text-yellow-400" />
        <h3 className="text-xl font-bold mb-2">Hai bisogno di qualcosa di più?</h3>
        <p className="text-gray-300 mb-4 max-w-xl mx-auto">
          Piani Enterprise personalizzati con quote illimitate, supporto prioritario, SSO, e white-label.
        </p>
        <button className="px-6 py-3 text-sm font-semibold text-gray-900 bg-white rounded-lg hover:bg-gray-100">
          Contatta Sales
        </button>
      </div>
    </div>
  );
}

function QuotaPreview({ label, value, suffix = '' }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900">{value || '∞'}{suffix}</span>
    </div>
  );
}