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
}

export const LeanCanvasBuilder: React.FC<LeanCanvasBuilderProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [canvasBlocks, setCanvasBlocks] = useState<CanvasBlock[]>([
    { id: 'problem', title: 'Problem', content: '', completed: false },
    { id: 'customer-segments', title: 'Customer Segments', content: '', completed: false },
    { id: 'unique-value-proposition', title: 'Unique Value Proposition', content: '', completed: false },
    { id: 'solution', title: 'Solution', content: '', completed: false },
    { id: 'channels', title: 'Channels', content: '', completed: false },
    { id: 'revenue-streams', title: 'Revenue Streams', content: '', completed: false },
    { id: 'cost-structure', title: 'Cost Structure', content: '', completed: false },
    { id: 'key-metrics', title: 'Key Metrics', content: '', completed: false },
    { id: 'unfair-advantage', title: 'Unfair Advantage', content: '', completed: false },
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
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Describe your {currentBlock.title.toLowerCase()}:
                </label>
                <textarea
                  value={currentBlock.content}
                  onChange={(e) => updateBlock(currentBlock.id, e.target.value)}
                  rows={6}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={`Enter your ${currentBlock.title.toLowerCase()} details...`}
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