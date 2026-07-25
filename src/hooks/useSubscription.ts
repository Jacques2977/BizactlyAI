import { useState, useEffect } from 'react';
import { UserSubscription, SubscriptionPlan } from '../types/subscription';
import { useAuth } from '../contexts/AuthContext';
import { subscriptionPlans, allPlans } from '../data/subscriptionPlans';

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserSubscription();
    }
  }, [user]);

  const loadUserSubscription = () => {
    setIsLoading(true);
    
    // Load subscription from localStorage (in production, this would be an API call)
    const savedSubscription = localStorage.getItem(`subscription_${user?.id}`);
    
    if (savedSubscription) {
      const userSubscription = JSON.parse(savedSubscription);
      setSubscription(userSubscription);
    } else {
      // Create default free trial subscription
      const defaultSubscription: UserSubscription = {
        id: Date.now().toString(),
        userId: user?.id || '',
        planId: 'free',
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        cancelAtPeriodEnd: false,
        usage: {
          aiChats: 0,
          tools: 0,
          projects: 0
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setSubscription(defaultSubscription);
      saveSubscription(defaultSubscription);
    }
    
    setIsLoading(false);
  };

  const saveSubscription = (subscriptionData: UserSubscription) => {
    if (user) {
      localStorage.setItem(`subscription_${user.id}`, JSON.stringify(subscriptionData));
    }
  };

  const getCurrentPlan = (): SubscriptionPlan | null => {
    if (!subscription) return null;
    return allPlans.find(plan => plan.id === subscription.planId) || null;
  };

  const canUseFeature = (feature: 'aiChats' | 'tools' | 'projects'): boolean => {
    // For testing: unlimited access
    return true;

    /* Original subscription logic (commented out for testing)
    if (!subscription) return false;

    const plan = getCurrentPlan();
    if (!plan) return false;

    const limit = plan.limits[feature];
    if (limit === -1) return true; // Unlimited

    return subscription.usage[feature] < limit;
    */
  };

  const getRemainingUsage = (feature: 'aiChats' | 'tools' | 'projects'): number => {
    // For testing: show unlimited
    return -1;

    /* Original subscription logic (commented out for testing)
    if (!subscription) return 0;

    const plan = getCurrentPlan();
    if (!plan) return 0;

    const limit = plan.limits[feature];
    if (limit === -1) return -1; // Unlimited

    return Math.max(0, limit - subscription.usage[feature]);
    */
  };

  const incrementUsage = (feature: 'aiChats' | 'tools' | 'projects') => {
    // For testing: don't increment usage (unlimited access)
    return;

    /* Original subscription logic (commented out for testing)
    if (!subscription) return;

    const updatedSubscription = {
      ...subscription,
      usage: {
        ...subscription.usage,
        [feature]: subscription.usage[feature] + 1
      },
      updatedAt: new Date().toISOString()
    };

    setSubscription(updatedSubscription);
    saveSubscription(updatedSubscription);
    */
  };

  const updateSubscription = (updates: Partial<UserSubscription>) => {
    if (!subscription) return;
    
    const updatedSubscription = {
      ...subscription,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    setSubscription(updatedSubscription);
    saveSubscription(updatedSubscription);
  };

  const isTrialExpired = (): boolean => {
    if (!subscription) return false;
    return subscription.status === 'trialing' && new Date() > new Date(subscription.currentPeriodEnd);
  };

  const getDaysUntilExpiry = (): number => {
    if (!subscription) return 0;
    const now = new Date();
    const expiry = new Date(subscription.currentPeriodEnd);
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return {
    subscription,
    currentPlan: getCurrentPlan(),
    isLoading,
    canUseFeature,
    getRemainingUsage,
    incrementUsage,
    updateSubscription,
    isTrialExpired,
    getDaysUntilExpiry,
    loadUserSubscription
  };
};