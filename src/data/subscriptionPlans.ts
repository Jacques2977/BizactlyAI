import { SubscriptionPlan } from '../types/subscription';

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'free-trial',
    name: 'Free Trial',
    price: 0,
    billingCycle: 'monthly',
    features: [
      '10 AI coaching sessions',
      '1 idea validation',
      '1 MVP plan',
      'Basic analytics',
      'Email support'
    ],
    limits: {
      aiChats: 10,
      tools: 3,
      projects: 1
    }
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    billingCycle: 'monthly',
    features: [
      '100 AI coaching sessions',
      '5 idea validations',
      '3 MVP plans',
      'All startup tools',
      'Progress tracking',
      'Priority email support'
    ],
    limits: {
      aiChats: 100,
      tools: 10,
      projects: 3
    },
    stripePriceId: 'price_starter_monthly'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 79,
    billingCycle: 'monthly',
    popular: true,
    features: [
      'Unlimited AI coaching',
      'Unlimited idea validations',
      'Unlimited MVP plans',
      'All startup tools',
      'Advanced analytics',
      'Custom personas',
      'Launch plan templates',
      'Priority support'
    ],
    limits: {
      aiChats: -1,
      tools: -1,
      projects: 10
    },
    stripePriceId: 'price_pro_monthly'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    billingCycle: 'monthly',
    features: [
      'Everything in Pro',
      'Unlimited projects',
      'Team collaboration',
      'Custom integrations',
      'Dedicated account manager',
      'Phone support',
      'Custom onboarding'
    ],
    limits: {
      aiChats: -1,
      tools: -1,
      projects: -1
    },
    stripePriceId: 'price_enterprise_monthly'
  }
];

export const yearlyPlans: SubscriptionPlan[] = subscriptionPlans.map(plan => ({
  ...plan,
  id: `${plan.id}-yearly`,
  billingCycle: 'yearly' as const,
  price: plan.price === 0 ? 0 : Math.floor(plan.price * 12 * 0.8), // 20% discount for yearly
  stripePriceId: plan.stripePriceId ? plan.stripePriceId.replace('monthly', 'yearly') : undefined
}));

export const allPlans = [...subscriptionPlans, ...yearlyPlans];