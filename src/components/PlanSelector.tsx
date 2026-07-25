import React, { useState } from 'react';
import { Check, Star, CreditCard } from 'lucide-react';
import { SubscriptionPlan } from '../types/subscription';
import { subscriptionPlans, yearlyPlans } from '../data/subscriptionPlans';

interface PlanSelectorProps {
  onSelectPlan: (plan: SubscriptionPlan) => void;
  currentPlanId?: string;
}

export const PlanSelector: React.FC<PlanSelectorProps> = ({ onSelectPlan, currentPlanId }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  
  const plans = billingCycle === 'monthly' ? subscriptionPlans : yearlyPlans;

  const formatPrice = (price: number, cycle: 'monthly' | 'yearly') => {
    if (price === 0) return 'Free';
    if (cycle === 'yearly') {
      const monthlyPrice = Math.floor(price / 12);
      return `$${monthlyPrice}/mo (billed yearly)`;
    }
    return `$${price}/mo`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Billing Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-800 rounded-lg p-1 border border-gray-700">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'yearly'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Yearly
            <span className="ml-1 text-xs bg-green-500 text-white px-1 rounded">20% off</span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-gray-800 rounded-lg border-2 p-6 ${
              plan.popular
                ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                : currentPlanId === plan.id
                ? 'border-green-500'
                : 'border-gray-700'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                  <Star className="w-4 h-4 mr-1" />
                  Most Popular
                </span>
              </div>
            )}

            {currentPlanId === plan.id && (
              <div className="absolute -top-3 right-4">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Current Plan
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="mb-2">
                <span className="text-3xl font-bold text-white">
                  {plan.price === 0 ? 'Free' : `$${billingCycle === 'yearly' ? Math.floor(plan.price / 12) : plan.price}`}
                </span>
                {plan.price > 0 && (
                  <span className="text-gray-400">
                    /{billingCycle === 'yearly' ? 'mo' : 'mo'}
                  </span>
                )}
              </div>
              {billingCycle === 'yearly' && plan.price > 0 && (
                <p className="text-sm text-green-400">
                  ${plan.price} billed annually
                </p>
              )}
            </div>

            <div className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-300">{feature}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 mb-6 text-xs text-gray-400">
              <div>AI Chats: {plan.limits.aiChats === -1 ? 'Unlimited' : plan.limits.aiChats}</div>
              <div>Tools: {plan.limits.tools === -1 ? 'Unlimited' : plan.limits.tools}</div>
              <div>Projects: {plan.limits.projects === -1 ? 'Unlimited' : plan.limits.projects}</div>
            </div>

            <button
              onClick={() => onSelectPlan(plan)}
              disabled={currentPlanId === plan.id}
              className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${
                currentPlanId === plan.id
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : plan.popular
                  ? 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-lg'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {currentPlanId === plan.id ? (
                <span>Current Plan</span>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>{plan.price === 0 ? 'Start Free Trial' : 'Choose Plan'}</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};