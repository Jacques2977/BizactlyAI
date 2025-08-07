import React, { useState } from 'react';
import { Rocket, Target, Clock, TrendingUp, CheckCircle, AlertCircle, Lightbulb } from 'lucide-react';
import { generateMVPPlan, prioritizeFeatures, MVPPlan, MVPFeature } from '../api/mvpPlanner';

interface MVPPlannerProps {
  onClose: () => void;
}

export const MVPPlanner: React.FC<MVPPlannerProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    projectDescription: '',
    targetAudience: '',
    budget: '',
    timeline: '',
  });
  const [mvpPlan, setMvpPlan] = useState<MVPPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const plan = await generateMVPPlan(
        formData.projectDescription,
        formData.targetAudience,
        formData.budget,
        formData.timeline
      );
      setMvpPlan(plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate MVP plan');
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'high': return 'bg-red-50 text-red-700';
      case 'medium': return 'bg-yellow-50 text-yellow-700';
      case 'low': return 'bg-green-50 text-green-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-blue-50 text-blue-700';
      case 'medium': return 'bg-indigo-50 text-indigo-700';
      case 'low': return 'bg-purple-50 text-purple-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-500 to-pink-600">
        <div className="flex items-center space-x-3">
          <Rocket className="w-8 h-8 text-white" />
          <div>
            <h3 className="text-xl font-bold text-white">MVP Planner</h3>
            <p className="text-purple-100 text-sm">Plan your Minimum Viable Product</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-purple-200 transition-colors text-xl"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {!mvpPlan ? (
          /* Input Form */
          <form onSubmit={handleGeneratePlan} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Project Description *
              </label>
              <textarea
                name="projectDescription"
                value={formData.projectDescription}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Describe your startup idea, what problem it solves, and how it works..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Target Audience *
              </label>
              <input
                type="text"
                name="targetAudience"
                value={formData.targetAudience}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Who are your primary users? (e.g., small business owners, freelancers, students)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Budget (Optional)
                </label>
                <input
                  type="text"
                  name="budget"
                  value={formData.budget}
                  onChange={handleInputChange}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., $10,000, Limited budget, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Timeline (Optional)
                </label>
                <input
                  type="text"
                  name="timeline"
                  value={formData.timeline}
                  onChange={handleInputChange}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., 3 months, ASAP, 6 weeks, etc."
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating MVP Plan...</span>
                </div>
              ) : (
                'Generate MVP Plan'
              )}
            </button>
          </form>
        ) : (
          /* MVP Plan Results */
          <div className="space-y-6">
            {/* Plan Overview */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{mvpPlan.projectName}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">Target Audience:</span>
                  <span className="text-sm text-gray-600">{mvpPlan.targetAudience}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">Estimated Timeline:</span>
                  <span className="text-sm text-gray-600">{mvpPlan.totalEstimatedDays} days</span>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-purple-100">
                <h4 className="font-semibold text-gray-800 mb-2">Core Value Proposition:</h4>
                <p className="text-gray-700">{mvpPlan.coreValueProposition}</p>
              </div>
            </div>

            {/* Features List */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                Feature Breakdown ({mvpPlan.features.length} features)
              </h4>
              <div className="space-y-4">
                {mvpPlan.features.map((feature) => (
                  <div key={feature.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-semibold text-gray-900">{feature.name}</h5>
                      <div className="flex space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(feature.priority)}`}>
                          {feature.priority} priority
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEffortColor(feature.effort)}`}>
                          {feature.effort} effort
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(feature.impact)}`}>
                          {feature.impact} impact
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{feature.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="capitalize">{feature.category} feature</span>
                      <span>{feature.estimatedDays} days estimated</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Development Timeline */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-6 h-6 text-blue-600 mr-2" />
                Development Timeline
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(mvpPlan.timeline).map(([phase, featureIds]) => (
                  <div key={phase} className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-800 mb-3 capitalize">
                      {phase.replace(/(\d+)/, ' $1')}
                    </h5>
                    <div className="space-y-2">
                      {featureIds.map((featureId) => {
                        const feature = mvpPlan.features.find(f => f.id === featureId);
                        return feature ? (
                          <div key={featureId} className="text-sm">
                            <div className="font-medium text-gray-700">{feature.name}</div>
                            <div className="text-gray-500">{feature.estimatedDays} days</div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Lightbulb className="w-6 h-6 text-yellow-600 mr-2" />
                Strategic Recommendations
              </h4>
              <ul className="space-y-2">
                {mvpPlan.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={() => setMvpPlan(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Create New Plan
              </button>
              <button
                onClick={() => {
                  const planText = JSON.stringify(mvpPlan, null, 2);
                  navigator.clipboard.writeText(planText);
                }}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
              >
                Copy Plan to Clipboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};