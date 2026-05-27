import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function useFeatureAccess(featureName) {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkFeature = async () => {
      try {
        const res = await base44.functions.invoke('getCurrentCompany', {});
        const company = res.data?.company;
        const subscription = res.data?.subscription;

        if (!company?.id) {
          setHasAccess(false);
          setLoading(false);
          return;
        }

        const featureFlags = await base44.entities.TenantFeatureFlag.filter({ 
          company_id: company.id,
          feature_name: featureName 
        });

        const flag = featureFlags[0];
        setHasAccess(!!flag?.enabled);
      } catch (error) {
        console.error('Error checking feature access:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkFeature();
  }, [featureName]);

  return { hasAccess, loading };
}

export function usePlanAccess(requiredPlan) {
  const [hasAccess, setHasAccess] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPlan = async () => {
      try {
        const res = await base44.functions.invoke('getCurrentCompany', {});
        const subscription = res.data?.subscription;

        if (!subscription?.plan_id) {
          setHasAccess(false);
          setLoading(false);
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
        console.error('Error checking plan access:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkPlan();
  }, [requiredPlan]);

  return { hasAccess, currentPlan, loading };
}