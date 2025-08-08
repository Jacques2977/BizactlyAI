import React, { useState } from 'react';
import { DollarSign, TrendingUp, Users, Star, CheckCircle, AlertCircle } from 'lucide-react';
import { generatePricingRecommendation, PricingRecommendation, PricingTier } from '../api/pricingAssistant';

interface PricingAssistantProps {
  onClose: () => void;
}

export const PricingAssistant: React.FC<PricingAssistantProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    productDescription: '',
    targetMarket: '',
    competitorPricing: '',
    valueProposition: '',
  });
  const [pricingResult, setPricingResult] = useState<PricingRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleGeneratePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await generatePricingRecommendation(
        formData.productDescription,
        formData.targetMarket,
        formData.competitorPricing,
        formData.valueProposition
      );
      setPricingResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate pricing recommendation');
    } finally {
      setIsLoading(false);
    }
  };

  const PricingTierCard: React.FC<{ tier: PricingTier }> = ({ tier }) => (
    <div className={`relative bg-white border-2 rounded-lg p-6 ${
    <div className={`relative bg-gray-800 border-2 rounded-lg p-6 ${
      tier.popular ? 'border-blue-500 shadow-lg' : 'border-gray-700'
    }`}>
      {tier.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
            <Star className="w-4 h-4 mr-1" />
            Most Popular
          </span>
        </div>
      )}
      
      <div className="text-center mb-6">
        <h4 className="text-xl font-bold text-white mb-2">{tier.name}</h4>
        <div className="mb-2">
          <span className="text-4xl font-bold text-white">${tier.price}</span>
          <span className="text-gray-300">/{tier.billingCycle}</span>
        </div>
        {tier.savings && (
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
            {tier.savings}
          </span>
        )}
        <p className="text-sm text-gray-300 mt-2">{tier.targetCustomer}</p>
      </div>

      <div className="space-y-3 mb-6">
        <div>
          <h5 className="font-semibold text-white mb-2">Features:</h5>
          <ul className="space-y-1">
            {tier.features.map((feature, index) => (
              <li key={index} className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-300">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {tier.limitations.length > 0 && (
          <div>
            <h5 className="font-semibold text-white mb-2">Limitations:</h5>
            <ul className="space-y-1">
              {tier.limitations.map((limitation, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-300">{limitation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <button className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${
        tier.popular
          ? 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-lg'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}>
        Choose {tier.name}
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gradient-to-r from-green-500 to-emerald-600">
        <div className="flex items-center space-x-3">
          <DollarSign className="w-8 h-8 text-white" />
          <div>
            <h3 className="text-xl font-bold text-white">Pricing Assistant</h3>
            <p className="text-green-100 text-sm">Optimize your pricing strategy</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-green-200 transition-colors text-xl"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-gray-900">
        {!pricingResult ? (
          /* Input Form */
          <form onSubmit={handleGeneratePricing} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Product Description *
              </label>
              <textarea
                name="productDescription"
                value={formData.productDescription}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Describe your product or service. What value does it provide? What problems does it solve?"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Target Market *
              </label>
              <input
                type="text"
                name="targetMarket"
                value={formData.targetMarket}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Who are your target customers? (e.g., small businesses, enterprises, consumers)"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Competitor Pricing (Optional)
              </label>
              <textarea
                name="competitorPricing"
                value={formData.competitorPricing}
                onChange={handleInputChange}
                rows={3}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="What are your competitors charging? (e.g., Competitor A: $29/month, Competitor B: $49/month)"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Value Proposition (Optional)
              </label>
              <input
                type="text"
                name="valueProposition"
                value={formData.valueProposition}
                onChange={handleInputChange}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="What unique value do you provide? (e.g., saves 10 hours per week, increases revenue by 20%)"
              />
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700/50 text-red-200 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating Pricing Strategy...</span>
                </div>
              ) : (
                'Generate Pricing Strategy'
              )}
            </button>
          </form>
        ) : (
          /* Pricing Results */
          <div className="space-y-6">
            {/* Strategy Overview */}
            <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-700/50 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-white mb-4">{pricingResult.productName} Pricing Strategy</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-white mb-2">Recommended Model</h4>
                  <p className="text-lg font-medium text-green-400 mb-2">{pricingResult.recommendedStrategy.model}</p>
                  <p className="text-sm text-gray-300">{pricingResult.recommendedStrategy.rationale}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-white mb-2">Competitive Position</h4>
                  <p className="text-sm text-gray-300">{pricingResult.recommendedStrategy.competitivePosition}</p>
                </div>
              </div>
            </div>

            {/* Pricing Tiers */}
            <div>
              <h4 className="text-xl font-bold text-white mb-4">Recommended Pricing Tiers</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {pricingResult.tiers.map((tier) => (
                  <PricingTierCard key={tier.id} tier={tier} />
                ))}
              </div>
            </div>

            {/* Freemium Option */}
            {pricingResult.freemiumOption && (
              <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-6">
                <h4 className="text-lg font-bold text-white mb-3">Freemium Strategy</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-semibold text-white mb-2">Free Features:</h5>
                    <ul className="space-y-1">
                      {pricingResult.freemiumOption.features.map((feature, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-semibold text-white mb-2">Limitations:</h5>
                    <ul className="space-y-1">
                      {pricingResult.freemiumOption.limitations.map((limitation, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-300">{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-gray-800 rounded border border-gray-700">
                  <h5 className="font-semibold text-white mb-1">Conversion Strategy:</h5>
                  <p className="text-sm text-gray-300">{pricingResult.freemiumOption.conversionStrategy}</p>
                </div>
              </div>
            )}

            {/* Pricing Psychology */}
            <div className="bg-purple-900/30 border border-purple-700/50 rounded-lg p-6">
              <h4 className="text-lg font-bold text-white mb-3">Pricing Psychology</h4>
              <div className="space-y-3">
                <div>
                  <h5 className="font-semibold text-white">Anchoring Strategy:</h5>
                  <p className="text-sm text-gray-300">{pricingResult.pricingPsychology.anchoring}</p>
                </div>
                <div>
                  <h5 className="font-semibold text-white">Decoy Effect:</h5>
                  <p className="text-sm text-gray-300">{pricingResult.pricingPsychology.decoyEffect}</p>
                </div>
                <div>
                  <h5 className="font-semibold text-white">Value Perception:</h5>
                  <ul className="text-sm text-gray-300 ml-4">
                    {pricingResult.pricingPsychology.valuePerception.map((perception, index) => (
                      <li key={index}>• {perception}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Revenue Projections */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h4 className="text-lg font-bold text-white mb-3">Revenue Projections</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {pricingResult.revenueProjections.map((projection, index) => (
                  <div key={index} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                    <h5 className="font-semibold text-white">{projection.tier}</h5>
                    <div className="text-2xl font-bold text-green-600 my-2">
                      ${projection.monthlyRevenue.toLocaleString()}/mo
                    </div>
                    <p className="text-xs text-gray-300">{projection.assumptions}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Testing Recommendations */}
            <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-6">
              <h4 className="text-lg font-bold text-white mb-3">A/B Testing Recommendations</h4>
              <ul className="space-y-2">
                {pricingResult.testingRecommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <TrendingUp className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-300">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={() => setPricingResult(null)}
                className="flex-1 bg-gray-700 text-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
              >
                Generate New Strategy
              </button>
              <button
                onClick={() => {
                  const resultText = JSON.stringify(pricingResult, null, 2);
                  navigator.clipboard.writeText(resultText);
                }}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
              >
                Export Strategy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};