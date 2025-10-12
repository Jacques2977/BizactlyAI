import React, { useState } from 'react';
import { Search, TrendingUp, Users, DollarSign, AlertCircle, CheckCircle, Lightbulb } from 'lucide-react';
import { validateIdea, IdeaValidationResult } from '../api/ideaValidator';
import { useDataStorage } from '../hooks/useDataStorage';

interface IdeaValidatorProps {
  onClose: () => void;
}

export const IdeaValidator: React.FC<IdeaValidatorProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    ideaDescription: '',
    targetMarket: '',
    businessModel: '',
  });
  const [validationResult, setValidationResult] = useState<IdeaValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { saveDocument, getDocumentsByType } = useDataStorage();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleValidateIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await validateIdea(
        formData.ideaDescription,
        formData.targetMarket,
        formData.businessModel
      );
      setValidationResult(result);
      
      // Auto-save the validation result
      saveDocument(
        'idea-validation',
        `Idea Validation - ${new Date().toLocaleDateString()}`,
        {
          formData,
          result,
          createdAt: new Date().toISOString()
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate idea');
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gradient-to-r from-blue-500 to-indigo-600">
        <div className="flex items-center space-x-3">
          <Search className="w-8 h-8 text-white" />
          <div>
            <h3 className="text-xl font-bold text-white">Idea Validator</h3>
            <p className="text-blue-100 text-sm">Analyze and improve your startup idea</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-blue-200 transition-colors text-xl"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-gray-900">
        {!validationResult ? (
          /* Input Form */
          <form onSubmit={handleValidateIdea} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Startup Idea Description *
              </label>
              <textarea
                name="ideaDescription"
                value={formData.ideaDescription}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe your startup idea in detail. What problem does it solve? How does it work? What makes it unique?"
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
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Who is your target customer? (e.g., small business owners, freelancers, enterprise companies)"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Business Model (Optional)
              </label>
              <input
                type="text"
                name="businessModel"
                value={formData.businessModel}
                onChange={handleInputChange}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="How will you make money? (e.g., SaaS subscription, marketplace commission, freemium)"
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
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Validating Idea...</span>
                </div>
              ) : (
                'Validate My Idea'
              )}
            </button>
          </form>
        ) : (
          /* Validation Results */
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-700/50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-white">Validation Results</h3>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${getScoreColor(validationResult.overallScore)}`}>
                    {validationResult.overallScore}/100
                  </div>
                  <div className="text-sm text-gray-400">Overall Score</div>
                </div>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${getScoreBg(validationResult.overallScore)}`}
                  style={{ width: `${validationResult.overallScore}%` }}
                ></div>
              </div>
            </div>

            {/* Detailed Scores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Market Size */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-white">Market Size</h4>
                  </div>
                  <span className={`text-xl font-bold ${getScoreColor(validationResult.marketSize.score)}`}>
                    {validationResult.marketSize.score}/100
                  </span>
                </div>
                <p className="text-gray-300 text-sm mb-3">{validationResult.marketSize.analysis}</p>
                <div className="space-y-1">
                  {validationResult.marketSize.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-300">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Competition */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-white">Competition</h4>
                  </div>
                  <span className={`text-xl font-bold ${getScoreColor(validationResult.competition.score)}`}>
                    {validationResult.competition.score}/100
                  </span>
                </div>
                <p className="text-gray-300 text-sm mb-3">{validationResult.competition.analysis}</p>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-medium text-gray-400 uppercase">Competitors:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {validationResult.competition.competitors.map((comp, index) => (
                        <span key={index} className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">
                          {comp}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Feasibility */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    <h4 className="font-semibold text-white">Feasibility</h4>
                  </div>
                  <span className={`text-xl font-bold ${getScoreColor(validationResult.feasibility.score)}`}>
                    {validationResult.feasibility.score}/100
                  </span>
                </div>
                <p className="text-gray-300 text-sm mb-3">{validationResult.feasibility.analysis}</p>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-medium text-red-400 uppercase">Challenges:</span>
                    {validationResult.feasibility.challenges.map((challenge, index) => (
                      <div key={index} className="text-sm text-gray-300 ml-2">• {challenge}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Monetization */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-white">Monetization</h4>
                  </div>
                  <span className={`text-xl font-bold ${getScoreColor(validationResult.monetization.score)}`}>
                    {validationResult.monetization.score}/100
                  </span>
                </div>
                <p className="text-gray-300 text-sm mb-3">{validationResult.monetization.analysis}</p>
                <div className="space-y-1">
                  {validationResult.monetization.models.map((model, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <DollarSign className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-300">{model}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Improvements */}
            <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-6">
              <h4 className="text-xl font-bold text-white mb-4 flex items-center">
                <Lightbulb className="w-6 h-6 text-yellow-600 mr-2" />
                Suggested Improvements
              </h4>
              <div className="space-y-2">
                {validationResult.improvements.map((improvement, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{improvement}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-6">
              <h4 className="text-xl font-bold text-white mb-4 flex items-center">
                <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                Next Steps
              </h4>
              <div className="space-y-2">
                {validationResult.nextSteps.map((step, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5 flex-shrink-0">
                      {index + 1}
                    </div>
                    <span className="text-gray-300 text-sm">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={() => setValidationResult(null)}
                className="flex-1 bg-gray-700 text-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
              >
                Validate Another Idea
              </button>
              <button
                onClick={() => {
                  const resultText = JSON.stringify(validationResult, null, 2);
                  navigator.clipboard.writeText(resultText);
                }}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
              >
                Copy Results
              </button>
            </div>
            
            {/* Saved Validations */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h4 className="text-lg font-bold text-white mb-3">Previous Validations</h4>
              {getDocumentsByType('idea-validation').slice(-3).map((doc) => (
                <div key={doc.id} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
                  <div>
                    <p className="text-white font-medium">{doc.title}</p>
                    <p className="text-gray-400 text-sm">{new Date(doc.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => {
                      setFormData(doc.data.formData);
                      setValidationResult(doc.data.result);
                    }}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    Load
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};