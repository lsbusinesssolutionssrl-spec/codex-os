import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Crown, Zap, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function FeatureAccessGuard({ requiredPlan, featureName, children }) {
  const [hasAccess, setHasAccess] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAccess();
  }, [requiredPlan, featureName]);

  const checkAccess = async () => {
    try {
      const res = await base44.functions.invoke('getCurrentCompany', {});
      const company = res.data?.company;
      const subscription = res.data?.subscription;
      
      if (!subscription?.plan_id) {
        setHasAccess(false);
        setCurrentPlan(null);
        return;
      }

      const plans = await base44.entities.SubscriptionPlan.filter({ id: subscription.plan_id });
      const plan = plans[0];
      setCurrentPlan(plan);

      const planHierarchy = { starter: 1, professional: 2, enterprise: 3 };
      const requiredLevel = planHierarchy[requiredPlan] || 1;
      const currentLevel = planHierarchy[plan?.name] || 1;

      setHasAccess(currentLevel >= requiredLevel);
    } catch (error) {
      console.error('Error checking access:', error);
      setHasAccess(false);
    }
  };

  if (hasAccess === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="p-6 max-w-2xl mx-auto mt-20">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Feature Not Available</h2>
          <p className="text-gray-600">
            {featureName || 'This feature'} is available in the{' '}
            <span className="font-semibold capitalize">{requiredPlan}</span> plan and above.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Crown className="w-4 h-4 text-yellow-600" />
            <span>Current plan: {currentPlan?.name || 'None'}</span>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => navigate('/subscription-plans')}
              className="flex-1 px-4 py-2 text-sm text-white rounded-lg font-medium"
              style={{ backgroundColor: '#1147FF' }}
            >
              Upgrade Plan
            </button>
            <button
              onClick={() => navigate(-1)}
              className="flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}