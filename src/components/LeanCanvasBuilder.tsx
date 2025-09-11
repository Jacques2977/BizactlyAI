import React, { useState } from 'react';
import { Target, CheckCircle, ArrowRight, Copy, Download } from 'lucide-react';

interface LeanCanvasBuilderProps {
  onClose: () => void;
}

interface CanvasBlock {
  id: string;
  title: string;
  content: string;
  completed: boolean;
  prompt: string;
  example: string;
  tips: string[];
}

export const LeanCanvasBuilder: React.FC<LeanCanvasBuilderProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [canvasBlocks, setCanvasBlocks] = useState<CanvasBlock[]>([
    { 
      id: 'problem', 
      title: 'Problem', 
      content: '', 
      completed: false,
      prompt: "What are the top 1–3 problems your target customers face?",
      example: "Slack's problem was 'Teams struggle with fragmented communication tools that slow productivity.'",
      tips: [
        "Focus on painful, urgent problems that customers actively seek solutions for",
        "Identify problems that happen frequently (daily/weekly)",
        "Look for problems where existing alternatives are inadequate"
      ]
    },
    { 
      id: 'customer-segments', 
      title: 'Customer Segments', 
      content: '', 
      completed: false,
      prompt: "Who are the main groups of people or businesses experiencing these problems?",
      example: "Small to mid-sized remote teams in tech startups.",
      tips: [
        "Define your early adopters vs mainstream market",
        "Be specific about company size, role, industry",
        "Focus on customers who feel the pain most acutely"
      ]
    },
    { 
      id: 'unique-value-proposition', 
      title: 'Unique Value Proposition', 
      content: '', 
      completed: false,
      prompt: "In one sentence, what makes your solution different and worth buying?",
      example: "Zoom: 'Video conferencing that just works - reliable, simple, and accessible from anywhere.'",
      tips: [
        "Focus on the unique benefit, not features",
        "Make it clear and memorable",
        "Address why customers should choose you over alternatives"
      ]
    },
    { 
      id: 'solution', 
      title: 'Solution', 
      content: '', 
      completed: false,
      prompt: "What's the simplest version of your product that solves the core problems?",
      example: "A Kanban board with task assignments and chat integration.",
      tips: [
        "Focus on the simplest solution that works",
        "Address the core problems, not every possible feature",
        "Keep it simple - resist feature creep"
      ]
    },
    { 
      id: 'channels', 
      title: 'Channels', 
      content: '', 
      completed: false,
      prompt: "How will you reach your target customers?",
      example: "Common SaaS channels: SEO & content marketing, Social media & community building, B2B sales outreach, Product Hunt & app marketplaces. Which 2–3 channels will you prioritize first?",
      tips: [
        "Start with 1-2 channels you can execute well",
        "Choose channels where your customers already spend time",
        "Consider both acquisition and retention channels"
      ]
    },
    { 
      id: 'revenue-streams', 
      title: 'Revenue Streams', 
      content: '', 
      completed: false,
      prompt: "How will you make money? What pricing model fits best?",
      example: "Options include: Monthly/annual subscriptions, Freemium with premium upgrades, Transaction fees or commissions, Enterprise licensing. Which revenue model fits best for your SaaS?",
      tips: [
        "Align pricing with customer value received",
        "Consider freemium, subscription, or usage-based models",
        "Test willingness to pay early"
      ]
    },
    { 
      id: 'cost-structure', 
      title: 'Cost Structure', 
      content: '', 
      completed: false,
      prompt: "What are your key costs to operate and acquire customers?",
      example: "Dropbox costs: 'Cloud storage infrastructure, customer acquisition, engineering team.'",
      tips: [
        "Separate fixed costs from variable costs",
        "Include customer acquisition costs (CAC)",
        "Plan for scaling costs as you grow"
      ]
    },
    { 
      id: 'key-metrics', 
      title: 'Key Metrics', 
      content: '', 
      completed: false,
      prompt: "What metrics will tell you if your business is successful?",
      example: "Intercom tracks: 'Monthly Active Users, Customer Acquisition Cost, Monthly Recurring Revenue.'",
      tips: [
        "Focus on leading indicators, not just revenue",
        "Include both growth and retention metrics",
        "Choose metrics you can actually measure"
      ]
    },
    { 
      id: 'unfair-advantage', 
      title: 'Unfair Advantage', 
      content: '', 
      completed: false,
      prompt: "What gives you an advantage that's hard to copy?",
      example: "Tesla's advantage: 'Vertical integration, supercharger network, and brand loyalty.'",
      tips: [
        "Think beyond just being first to market",
        "Consider network effects, data advantages, team expertise",
        "Focus on sustainable competitive moats"
      ]
    },
  ]);

  const updateBlock = (id: string, content: string) => {
    setCanvasBlocks(prev => prev.map(block => 
      block.id === id 
        ? { ...block, content, completed: content.trim().length > 0 }
        : block
    ));
  };

  const nextStep = () => {
    if (currentStep < canvasBlocks.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentBlock = canvasBlocks[currentStep];
  const completedBlocks = canvasBlocks.filter(block => block.completed).length;
  const progressPercentage = (completedBlocks / canvasBlocks.length) * 100;

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gradient-to-r from-indigo-500 to-purple-600">
        <div className="flex items-center space-x-3">
          <Target className="w-8 h-8 text-white" />
          <div>
            <h3 className="text-xl font-bold text-white">Lean Canvas Builder</h3>
            <p className="text-indigo-100 text-sm">Build your business model step by step</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-indigo-200 transition-colors text-xl"
        >
          ✕
        </button>
      </div>

      {/* Progress Bar */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-300">
            Step {currentStep + 1} of {canvasBlocks.length}
          </span>
          <span className="text-sm font-medium text-indigo-400">
            {completedBlocks}/{canvasBlocks.length} completed
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Current Step */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">{currentStep + 1}</span>
              </div>
              <h2 className="text-2xl font-bold text-white">{currentBlock.title}</h2>
              {currentBlock.completed && (
                <CheckCircle className="w-6 h-6 text-green-500" />
              )}
            </div>

            <div className="space-y-4">
              {/* AI Guidance Section */}
              <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-blue-200 mb-3">AI Guidance</h3>
                <p className="text-blue-100 mb-3">{currentBlock.prompt}</p>
                
                <div className="bg-blue-800/50 rounded-lg p-3 mb-3">
                  <p className="text-sm text-blue-200">
                    <span className="font-medium">👉 Example:</span> {currentBlock.example}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-200">💡 Tips:</p>
                  {currentBlock.tips.map((tip, index) => (
                    <p key={index} className="text-sm text-blue-100 ml-4">• {tip}</p>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {currentBlock.title}:
                </label>
                <textarea
                  value={currentBlock.content}
                  onChange={(e) => updateBlock(currentBlock.id, e.target.value)}
                  rows={6}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={`Describe your ${currentBlock.title.toLowerCase()}...`}
                />
              </div>

              <div className="flex justify-between">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg font-medium hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={nextStep}
                  disabled={currentStep === canvasBlocks.length - 1}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Canvas Preview */}
          {completedBlocks > 0 && (
            <div className="mt-8 bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Canvas Preview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {canvasBlocks.map((block) => (
                  <div
                    key={block.id}
                    className={`p-3 rounded border ${
                      block.completed
                        ? 'bg-gray-700 border-gray-600'
                        : 'bg-gray-800 border-gray-700 opacity-50'
                    }`}
                  >
                    <h4 className="font-semibold text-white text-sm mb-1">
                      {block.title}
                    </h4>
                    <p className="text-gray-300 text-xs">
                      {block.content || 'Not completed yet'}
                    </p>
                  </div>
                ))}
              </div>

              {completedBlocks === canvasBlocks.length && (
                <div className="mt-4 flex space-x-2">
                  <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">
                    <Copy className="w-4 h-4" />
                    <span>Copy Canvas</span>
                  </button>
                  <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};