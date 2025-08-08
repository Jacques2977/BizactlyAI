import React, { useState } from 'react';
import { X, TrendingUp, Users, DollarSign, Target } from 'lucide-react';
import { UserMetrics } from '../types/metrics';

interface MetricsUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMetrics: UserMetrics;
  onUpdate: (metrics: Partial<UserMetrics>) => void;
}

export const MetricsUpdateModal: React.FC<MetricsUpdateModalProps> = ({
  isOpen,
  onClose,
  currentMetrics,
  onUpdate
}) => {
  const [formData, setFormData] = useState({
    mrr: currentMetrics.mrr.toString(),
    customers: currentMetrics.customers.toString(),
    churnRate: currentMetrics.churnRate.toString(),
    cac: currentMetrics.cac.toString(),
    conversionRate: currentMetrics.conversionRate.toString(),
    revenueGoal: currentMetrics.revenueGoal.toString()
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedMetrics: Partial<UserMetrics> = {
      mrr: parseFloat(formData.mrr) || 0,
      customers: parseInt(formData.customers) || 0,
      churnRate: parseFloat(formData.churnRate) || 0,
      cac: parseFloat(formData.cac) || 0,
      conversionRate: parseFloat(formData.conversionRate) || 0,
      revenueGoal: parseFloat(formData.revenueGoal) || 10000
    };

    // Calculate LTV (simplified: MRR per customer / churn rate)
    if (updatedMetrics.customers && updatedMetrics.customers > 0 && updatedMetrics.churnRate && updatedMetrics.churnRate > 0) {
      const avgRevenuePerCustomer = updatedMetrics.mrr / updatedMetrics.customers;
      updatedMetrics.ltv = avgRevenuePerCustomer / (updatedMetrics.churnRate / 100);
    }

    onUpdate(updatedMetrics);
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-blue-500" />
            Update Your SaaS Metrics
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* MRR */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Monthly Recurring Revenue (MRR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  name="mrr"
                  value={formData.mrr}
                  onChange={handleInputChange}
                  className="w-full pl-8 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Customers */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                Active Customers
              </label>
              <input
                type="number"
                name="customers"
                value={formData.customers}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
                min="0"
              />
            </div>

            {/* Churn Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Churn Rate (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="churnRate"
                  value={formData.churnRate}
                  onChange={handleInputChange}
                  className="w-full px-4 pr-8 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  min="0"
                  max="100"
                  step="0.1"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">%</span>
              </div>
            </div>

            {/* CAC */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Customer Acquisition Cost (CAC)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  name="cac"
                  value={formData.cac}
                  onChange={handleInputChange}
                  className="w-full pl-8 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Conversion Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Conversion Rate (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="conversionRate"
                  value={formData.conversionRate}
                  onChange={handleInputChange}
                  className="w-full px-4 pr-8 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  min="0"
                  max="100"
                  step="0.1"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">%</span>
              </div>
            </div>

            {/* Revenue Goal */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Target className="w-4 h-4 inline mr-1" />
                Revenue Goal
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  name="revenueGoal"
                  value={formData.revenueGoal}
                  onChange={handleInputChange}
                  className="w-full pl-8 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="10000"
                  min="0"
                  step="100"
                />
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
            <p className="text-blue-200 text-sm">
              💡 <strong>Tip:</strong> Update your metrics regularly to track progress and get personalized AI recommendations for growth.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 text-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
            >
              Update Metrics
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};