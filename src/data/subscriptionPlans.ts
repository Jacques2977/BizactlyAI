import { SubscriptionPlan } from '../types/subscription';

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free Plan',
    price: 0,
    billingCycle: 'monthly',
    features: [
      '20 AI chat messages per day',
      '1 Lean Canvas generator',
      '1 Competitor Snapshot',
      'Access to learning resources',
      'Basic templates'
    ],
    limits: {
      aiChats: 20,
      tools: 2,
      projects: 1
    }
  },
  {
    id: 'starter',
    name: 'Starter Plan',
    price: 19,
    billingCycle: 'monthly',
    popular: true,
    features: [
      'Unlimited AI chat',
      'Unlimited Lean Canvases',
      'MVP roadmap generator',
      'Competitor analysis (up to 3)',
      'Save/export projects (PDF)',
      'Email support'
    ],
    limits: {
      aiChats: -1,
      tools: -1,
      projects: 5
    },
    stripePriceId: 'price_starter_monthly'
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    price: 49,
    billingCycle: 'monthly',
    features: [
      'Everything in Starter',
      'Advanced competitor tracking (10)',
      'Financial model generator',
      'Marketing playbooks & AI campaigns',
      'Team collaboration (2 teammates)',
      'Priority support'
    ],
    limits: {
      aiChats: -1,
      tools: -1,
      projects: -1
    },
    stripePriceId: 'price_pro_monthly'
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plan',
    price: 99,
    billingCycle: 'monthly',
    features: [
      'Everything in Pro',
      'White-label reports',
      'Unlimited competitors',
      'Investor pitch deck generator',
      'Dedicated AI workspace',
      'API access',
      'Custom branding'
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