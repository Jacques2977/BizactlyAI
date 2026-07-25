import React from 'react';
import { X, AlertTriangle, Zap } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { SubscriptionModal } from './SubscriptionModal';
import { SubscriptionPlan } from '../types/subscription';

interface UsageLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: 'aiChats' | 'tools' | 'projects';
  featureName: string;
}

export const UsageLimitModal: React.FC<UsageLimitModalProps> = ({
  isOpen,
  onClose,
  feature,
  featureName
}) => {
  const { currentPlan, getRemainingUsage, updateSubscription } = useSubscription();
  const [showUpgrade, setShowUpgrade] = React.useState(false);

  if (!isOpen || !currentPlan) return null;

  const remaining = getRemainingUsage(feature);
  const limit = currentPlan.limits[feature];

  const handleUpgrade = (plan: SubscriptionPlan) => {
    updateSubscription({
      planId: plan.id,
      status: 'active',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + (plan.billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString()
    });
    setShowUpgrade(false);
    onClose();
  };

  if (showUpgrade) {
    return (
      <SubscriptionModal
        isOpen={true}
        onClose={() => setShowUpgrade(false)}
        onSubscribe={handleUpgrade}
        currentPlanId={currentPlan.id}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-bold text-white">Usage Limit Reached</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-yellow-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              You've reached your {featureName} limit
            </h3>
            <p className="text-gray-300">
              You've used {limit === -1 ? 'unlimited' : limit} of your {featureName.toLowerCase()} 
              {limit !== -1 && ` (${remaining} remaining)`} on the {currentPlan.name} plan.
            </p>
          </div>

          {/* Current Plan Info */}
          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium text-white">{currentPlan.name} Plan</h4>
                <p className="text-sm text-gray-300">
                  {limit === -1 ? 'Unlimited' : limit} {featureName.toLowerCase()} per month
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-white">
                  {currentPlan.price === 0 ? 'Free' : `$${currentPlan.price}`}
                </p>
                <p className="text-xs text-gray-400">
                  /{currentPlan.billingCycle}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => setShowUpgrade(true)}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
            >
              Upgrade Plan
            </button>
            <button
              onClick={onClose}
              className="w-full bg-gray-700 text-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
            >
              Maybe Later
            </button>
          </div>

          {/* Benefits */}
          <div className="mt-6 p-4 bg-blue-900/30 border border-blue-700/50 rounded-lg">
            <h4 className="font-medium text-blue-200 mb-2">Upgrade Benefits:</h4>
            <ul className="text-sm text-blue-100 space-y-1">
              <li>• Unlimited AI coaching sessions</li>
              <li>• Access to all startup tools</li>
              <li>• Priority support</li>
              <li>• Advanced analytics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};