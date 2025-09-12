import React, { useState } from 'react';
import { CreditCard, Calendar, AlertCircle, CheckCircle, Download, Settings } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { SubscriptionModal } from './SubscriptionModal';
import { SubscriptionPlan } from '../types/subscription';

export const BillingDashboard: React.FC = () => {
  const { subscription, currentPlan, getDaysUntilExpiry, updateSubscription } = useSubscription();
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  if (!subscription || !currentPlan) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-300">No subscription found</p>
        </div>
      </div>
    );
  }

  const handlePlanChange = (plan: SubscriptionPlan) => {
    updateSubscription({
      planId: plan.id,
      status: plan.price === 0 ? 'trialing' : 'active',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + (plan.billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString()
    });
  };

  const handleCancelSubscription = () => {
    updateSubscription({
      cancelAtPeriodEnd: true,
      status: 'canceled'
    });
  };

  const handleReactivateSubscription = () => {
    updateSubscription({
      cancelAtPeriodEnd: false,
      status: 'active'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'trialing': return 'text-blue-400';
      case 'canceled': return 'text-red-400';
      case 'past_due': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'trialing': return <Calendar className="w-5 h-5 text-blue-400" />;
      case 'canceled': return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'past_due': return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Billing & Subscription</h2>

      {/* Current Plan */}
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Current Plan</h3>
          <div className="flex items-center space-x-2">
            {getStatusIcon(subscription.status)}
            <span className={`font-medium capitalize ${getStatusColor(subscription.status)}`}>
              {subscription.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-white mb-2">{currentPlan.name}</h4>
            <p className="text-2xl font-bold text-white">
              {currentPlan.price === 0 ? 'Free' : `$${currentPlan.price}`}
              <span className="text-sm text-gray-400 font-normal">
                /{currentPlan.billingCycle === 'yearly' ? 'year' : 'month'}
              </span>
            </p>
          </div>

          <div>
            <h4 className="font-medium text-white mb-2">Next Billing Date</h4>
            <p className="text-gray-300">
              {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-400">
              {getDaysUntilExpiry()} days remaining
            </p>
          </div>

          <div>
            <h4 className="font-medium text-white mb-2">Usage This Period</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">AI Chats:</span>
                <span className="text-gray-300">
                  {subscription.usage.aiChats}
                  {currentPlan.limits.aiChats !== -1 && ` / ${currentPlan.limits.aiChats}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Tools Used:</span>
                <span className="text-gray-300">
                  {subscription.usage.tools}
                  {currentPlan.limits.tools !== -1 && ` / ${currentPlan.limits.tools}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Projects:</span>
                <span className="text-gray-300">
                  {subscription.usage.projects}
                  {currentPlan.limits.projects !== -1 && ` / ${currentPlan.limits.projects}`}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-4 mt-6">
          <button
            onClick={() => setIsSubscriptionModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>Change Plan</span>
          </button>

          {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
            <button
              onClick={handleCancelSubscription}
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Cancel Subscription
            </button>
          )}

          {subscription.cancelAtPeriodEnd && (
            <button
              onClick={handleReactivateSubscription}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Reactivate Subscription
            </button>
          )}
        </div>

        {subscription.cancelAtPeriodEnd && (
          <div className="mt-4 p-3 bg-red-900/30 border border-red-700/50 rounded-lg">
            <p className="text-red-200 text-sm">
              Your subscription will be canceled at the end of the current billing period on{' '}
              {new Date(subscription.currentPeriodEnd).toLocaleDateString()}.
            </p>
          </div>
        )}
      </div>

      {/* Payment Method */}
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Payment Method</h3>
          <button className="text-blue-400 hover:text-blue-300 font-medium text-sm">
            Update
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <CreditCard className="w-8 h-8 text-gray-400" />
          <div>
            <p className="text-white font-medium">•••• •••• •••• 4242</p>
            <p className="text-gray-400 text-sm">Expires 12/25</p>
          </div>
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Billing History</h3>
          <button className="text-blue-400 hover:text-blue-300 font-medium text-sm flex items-center space-x-1">
            <Download className="w-4 h-4" />
            <span>Download All</span>
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-gray-700">
            <div>
              <p className="text-white font-medium">Pro Plan - Monthly</p>
              <p className="text-gray-400 text-sm">Jan 15, 2025</p>
            </div>
            <div className="text-right">
              <p className="text-white font-medium">$79.00</p>
              <button className="text-blue-400 hover:text-blue-300 text-sm">
                Download
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-700">
            <div>
              <p className="text-white font-medium">Pro Plan - Monthly</p>
              <p className="text-gray-400 text-sm">Dec 15, 2024</p>
            </div>
            <div className="text-right">
              <p className="text-white font-medium">$79.00</p>
              <button className="text-blue-400 hover:text-blue-300 text-sm">
                Download
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-white font-medium">Starter Plan - Monthly</p>
              <p className="text-gray-400 text-sm">Nov 15, 2024</p>
            </div>
            <div className="text-right">
              <p className="text-white font-medium">$29.00</p>
              <button className="text-blue-400 hover:text-blue-300 text-sm">
                Download
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        onSubscribe={handlePlanChange}
        currentPlanId={subscription.planId}
      />
    </div>
  );
};