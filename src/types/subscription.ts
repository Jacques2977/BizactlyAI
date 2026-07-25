export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  limits: {
    aiChats: number; // -1 for unlimited
    tools: number; // -1 for unlimited
    projects: number; // -1 for unlimited
  };
  popular?: boolean;
  stripePriceId?: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  usage: {
    aiChats: number;
    tools: number;
    projects: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BillingInfo {
  customerId: string;
  email: string;
  paymentMethod?: {
    type: string;
    last4: string;
    brand: string;
    expiryMonth: number;
    expiryYear: number;
  };
  billingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}