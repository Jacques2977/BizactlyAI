import React, { useState } from 'react';
import { Users, MapPin, Briefcase, Heart, Target, MessageCircle } from 'lucide-react';
import { generatePersonas, PersonaGenerationResult, UserPersona } from '../api/personaGenerator';
import { useDataStorage } from '../hooks/useDataStorage';

interface PersonaGeneratorProps {
  onClose: () => void;
}

export const PersonaGenerator: React.FC<PersonaGeneratorProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    productDescription: '',
    targetMarket: '',
    businessModel: '',
  });
  const [personaResult, setPersonaResult] = useState<PersonaGenerationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { saveDocument, getDocumentsByType } = useDataStorage();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleGeneratePersonas = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await generatePersonas(
        formData.productDescription,
        formData.targetMarket,
        formData.businessModel
      );
      setPersonaResult(result);
      
      // Auto-save the personas
      saveDocument(
        'personas',
        `User Personas - ${new Date().toLocaleDateString()}`,
        {
          formData,
          result,
          createdAt: new Date().toISOString()
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate personas');
    } finally {
      setIsLoading(false);
    }
  };

  const PersonaCard: React.FC<{ persona: UserPersona; isPrimary: boolean }> = ({ persona, isPrimary }) => (
    <div className={`bg-gray-800 border-2 rounded-lg p-6 ${isPrimary ? 'border-blue-500' : 'border-gray-700'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-3xl">{persona.avatar}</div>
          <div>
            <h4 className="text-xl font-bold text-white">{persona.name}</h4>
            <p className="text-gray-300">{persona.jobTitle} at {persona.company}</p>
          </div>
        </div>
        {isPrimary && (
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            Primary
          </span>
        )}
      </div>

      {/* Demographics */}
      <div className="mb-4">
        <h5 className="font-semibold text-white mb-2 flex items-center">
          <MapPin className="w-4 h-4 mr-1" />
          Demographics
        </h5>
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
          <div><strong>Age:</strong> {persona.age}</div>
          <div><strong>Location:</strong> {persona.demographics.location}</div>
          <div><strong>Income:</strong> {persona.demographics.income}</div>
          <div><strong>Education:</strong> {persona.demographics.education}</div>
        </div>
      </div>

      {/* Goals & Frustrations */}
      <div className="mb-4">
        <h5 className="font-semibold text-white mb-2 flex items-center">
          <Target className="w-4 h-4 mr-1" />
          Goals & Frustrations
        </h5>
        <div className="space-y-2">
          <div>
            <span className="text-xs font-medium text-green-400 uppercase">Goals:</span>
            <ul className="text-sm text-gray-300 ml-2">
              {persona.psychographics.goals.map((goal, index) => (
                <li key={index}>• {goal}</li>
              ))}
            </ul>
          </div>
          <div>
            <span className="text-xs font-medium text-red-400 uppercase">Frustrations:</span>
            <ul className="text-sm text-gray-300 ml-2">
              {persona.psychographics.frustrations.map((frustration, index) => (
                <li key={index}>• {frustration}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Pain Points */}
      <div className="mb-4">
        <h5 className="font-semibold text-white mb-2 flex items-center">
          <Heart className="w-4 h-4 mr-1" />
          Pain Points
        </h5>
        <ul className="text-sm text-gray-300 space-y-1">
          {persona.painPoints.map((pain, index) => (
            <li key={index} className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>{pain}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Behavior */}
      <div className="mb-4">
        <h5 className="font-semibold text-white mb-2 flex items-center">
          <Briefcase className="w-4 h-4 mr-1" />
          Behavior
        </h5>
        <div className="text-sm text-gray-300 space-y-1">
          <div><strong>Tech Savviness:</strong> {persona.behavior.techSavviness}</div>
          <div><strong>Buying Process:</strong> {persona.behavior.buyingProcess}</div>
          <div>
            <strong>Preferred Channels:</strong>
            <div className="flex flex-wrap gap-1 mt-1">
              {persona.behavior.preferredChannels.map((channel, index) => (
                <span key={index} className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">
                  {channel}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quote */}
      <div className="bg-gray-700/50 border-l-4 border-blue-500 p-3 rounded">
        <MessageCircle className="w-4 h-4 text-blue-500 mb-1" />
        <p className="text-sm italic text-gray-300">"{persona.quote}"</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gradient-to-r from-purple-500 to-pink-600">
        <div className="flex items-center space-x-3">
          <Users className="w-8 h-8 text-white" />
          <div>
            <h3 className="text-xl font-bold text-white">Persona Generator</h3>
            <p className="text-purple-100 text-sm">Create detailed user personas</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-purple-200 transition-colors text-xl"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-gray-900">
        {!personaResult ? (
          /* Input Form */
          <form onSubmit={handleGeneratePersonas} className="space-y-6">
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
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Describe your product or service. What does it do? What problems does it solve?"
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
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Who is your target market? (e.g., small business owners, marketing professionals, students)"
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
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="How do you make money? (e.g., subscription, one-time purchase, freemium)"
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
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating Personas...</span>
                </div>
              ) : (
                'Generate User Personas'
              )}
            </button>
          </form>
        ) : (
          /* Persona Results */
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Your User Personas</h3>
              <p className="text-gray-300">Detailed profiles of your target customers</p>
            </div>

            {/* Personas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PersonaCard persona={personaResult.primaryPersona} isPrimary={true} />
              <PersonaCard persona={personaResult.secondaryPersona} isPrimary={false} />
            </div>

            {/* Insights */}
            <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-700/50 rounded-lg p-6">
              <h4 className="text-xl font-bold text-white mb-4">Strategic Insights</h4>
              
              <div className="space-y-4">
                <div>
                  <h5 className="font-semibold text-white mb-2">Market Segmentation</h5>
                  <p className="text-gray-300 text-sm">{personaResult.insights.marketSegmentation}</p>
                </div>

                <div>
                  <h5 className="font-semibold text-white mb-2">Targeting Strategy</h5>
                  <p className="text-gray-300 text-sm">{personaResult.insights.targetingStrategy}</p>
                </div>

                <div>
                  <h5 className="font-semibold text-white mb-2">Messaging Recommendations</h5>
                  <ul className="text-sm text-gray-300 space-y-1">
                    {personaResult.insights.messagingRecommendations.map((message, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span>{message}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h5 className="font-semibold text-white mb-2">Channel Recommendations</h5>
                  <div className="flex flex-wrap gap-2">
                    {personaResult.insights.channelRecommendations.map((channel, index) => (
                      <span key={index} className="bg-purple-900/50 text-purple-300 px-3 py-1 rounded-full text-sm">
                        {channel}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={() => setPersonaResult(null)}
                className="flex-1 bg-gray-700 text-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
              >
                Generate New Personas
              </button>
              <button
                onClick={() => {
                  const resultText = JSON.stringify(personaResult, null, 2);
                  navigator.clipboard.writeText(resultText);
                }}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
              >
                Copy Personas
              </button>
            </div>
            
            {/* Saved Personas */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h4 className="text-lg font-bold text-white mb-3">Previous Personas</h4>
              {getDocumentsByType('personas').slice(-3).map((doc) => (
                <div key={doc.id} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
                  <div>
                    <p className="text-white font-medium">{doc.title}</p>
                    <p className="text-gray-400 text-sm">{new Date(doc.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => {
                      setFormData(doc.data.formData);
                      setPersonaResult(doc.data.result);
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