import React, { useState } from 'react';
import { Target, CheckCircle, ArrowRight, Copy, Download } from 'lucide-react';
import { useDataStorage } from '../hooks/useDataStorage';

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
  const { saveDocument, getDocumentsByType, updateDocument } = useDataStorage();
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);

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
      example: "Common SaaS costs: Hosting & infrastructure (AWS, GCP, etc.), Development (engineering, design, no-code tools), Sales & marketing spend, Customer support. Which 2–3 costs will be most significant early on?",
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
      prompt: "What numbers will tell you that your SaaS is working?",
      example: "SaaS examples: # of signups or waitlist entries, Monthly active users (MAU), Conversion rate from free → paid, Customer churn rate. Which 2–3 metrics will you track first?",
      tips: [
        "Start with 2-3 key metrics you can actually measure",
        "Focus on leading indicators that predict success",
        "Track both acquisition and retention metrics"
      ]
    },
    { 
      id: 'unfair-advantage', 
      title: 'Unfair Advantage', 
      content: '', 
      completed: false,
      prompt: "What do you have that competitors can't easily copy?",
      example: "Examples: Deep domain expertise, Exclusive partnerships, A unique community or distribution channel, Proprietary tech/AI model. What's your edge?",
      tips: [
        "Think beyond just being first to market",
        "Consider network effects, data advantages, team expertise",
        "Focus on sustainable competitive moats"
      ]
    }
  ]);

  const updateBlock = (id: string, content: string) => {
    setCanvasBlocks(prev => prev.map(block => 
      block.id === id 
        ? { ...block, content, completed: content.trim().length > 0 }
        : block
    ));
    
    // Auto-save canvas progress
    if (currentDocumentId) {
      const updatedBlocks = canvasBlocks.map(block => 
        block.id === id 
          ? { ...block, content, completed: content.trim().length > 0 }
          : block
      );
      
      updateDocument(currentDocumentId, {
        data: {
          canvasBlocks: updatedBlocks,
          lastUpdated: new Date().toISOString()
        }
      });
    } else {
      // Create new document on first edit
      const documentId = saveDocument(
        'lean-canvas',
        `Lean Canvas - ${new Date().toLocaleDateString()}`,
        {
          canvasBlocks,
          createdAt: new Date().toISOString()
        }
      );
      setCurrentDocumentId(documentId);
    }
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

  // Export and sharing functions
  const copyCanvasToClipboard = async () => {
    const canvasText = generateCanvasText();
    try {
      await navigator.clipboard.writeText(canvasText);
      // You could add a toast notification here
      console.log('Canvas copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const generateCanvasText = () => {
    const completedBlocks = canvasBlocks.filter(block => block.completed);
    let canvasText = `LEAN CANVAS\n${'='.repeat(50)}\n\n`;
    
    completedBlocks.forEach((block, index) => {
      canvasText += `${index + 1}. ${block.title.toUpperCase()}\n`;
      canvasText += `${'-'.repeat(block.title.length + 3)}\n`;
      canvasText += `${block.content}\n\n`;
    });
    
    canvasText += `\nGenerated by Bizactly.AI on ${new Date().toLocaleDateString()}`;
    return canvasText;
  };

  const exportToPDF = async () => {
    const { generateLeanCanvasPDF } = await import('../utils/pdfGenerator');
    const canvasData = {
      problem: canvasBlocks.find(b => b.id === 'problem')?.content || '',
      customerSegments: canvasBlocks.find(b => b.id === 'customer-segments')?.content || '',
      uniqueValueProposition: canvasBlocks.find(b => b.id === 'unique-value-proposition')?.content || '',
      solution: canvasBlocks.find(b => b.id === 'solution')?.content || '',
      channels: canvasBlocks.find(b => b.id === 'channels')?.content || '',
      revenueStreams: canvasBlocks.find(b => b.id === 'revenue-streams')?.content || '',
      costStructure: canvasBlocks.find(b => b.id === 'cost-structure')?.content || '',
      keyMetrics: canvasBlocks.find(b => b.id === 'key-metrics')?.content || '',
      unfairAdvantage: canvasBlocks.find(b => b.id === 'unfair-advantage')?.content || '',
      productName: 'My Startup Canvas',
      createdDate: new Date().toLocaleDateString()
    };
    
    await generateLeanCanvasPDF(canvasData);
    
    // Update document with PDF export timestamp
    if (currentDocumentId) {
      updateDocument(currentDocumentId, {
        data: {
          canvasBlocks,
          lastPDFExport: new Date().toISOString()
        }
      });
    }
  };

  const exportToJSON = () => {
    const canvasData = {
      canvas: canvasBlocks.reduce((acc, block) => {
        if (block.completed) {
          acc[block.id] = {
            title: block.title,
            content: block.content
          };
        }
        return acc;
      }, {} as Record<string, any>),
      metadata: {
        createdAt: new Date().toISOString(),
        completedBlocks: canvasBlocks.filter(b => b.completed).length,
        totalBlocks: canvasBlocks.length,
        tool: 'Bizactly.AI Lean Canvas Builder'
      }
    };
    
    const dataStr = JSON.stringify(canvasData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'lean_canvas.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const completedBlocks = canvasBlocks.filter(block => block.completed);
    let csvContent = 'Block,Title,Content\n';
    
    completedBlocks.forEach((block, index) => {
      const content = block.content.replace(/"/g, '""').replace(/\n/g, ' ');
      csvContent += `${index + 1},"${block.title}","${content}"\n`;
    });
    
    const dataBlob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'lean_canvas.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Third-party sharing functions
  const shareToSlack = () => {
    const canvasText = generateCanvasText();
    const slackUrl = `https://slack.com/intl/en-in/help/articles/201330736-Add-apps-to-your-Slack-workspace`;
    const message = encodeURIComponent(`Check out my Lean Canvas:\n\n${canvasText}`);
    
    // Copy to clipboard and provide instructions
    navigator.clipboard.writeText(canvasText);
    alert('Canvas copied to clipboard! You can now paste it in Slack.');
  };

  const shareToNotion = () => {
    const canvasText = generateCanvasText();
    navigator.clipboard.writeText(canvasText);
    window.open('https://notion.so', '_blank');
    alert('Canvas copied to clipboard! Create a new page in Notion and paste the content.');
  };

  const shareToTrello = () => {
    const canvasText = generateCanvasText();
    navigator.clipboard.writeText(canvasText);
    window.open('https://trello.com', '_blank');
    alert('Canvas copied to clipboard! Create a new card in Trello and paste the content.');
  };

  const shareToEmail = () => {
    const canvasText = generateCanvasText();
    const subject = encodeURIComponent('My Lean Canvas - Startup Business Model');
    const body = encodeURIComponent(canvasText);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareToGoogleDocs = () => {
    const canvasText = generateCanvasText();
    navigator.clipboard.writeText(canvasText);
    window.open('https://docs.google.com/document/create', '_blank');
    alert('Canvas copied to clipboard! Create a new Google Doc and paste the content.');
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
                <div className="mt-6 space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={copyCanvasToClipboard}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                    <Copy className="w-4 h-4" />
                      <span>Copy Canvas</span>
                    </button>
                    <button 
                      onClick={exportToPDF}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export PDF</span>
                    </button>
                    <button 
                      onClick={exportToJSON}
                      className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export JSON</span>
                    </button>
                    <button 
                      onClick={exportToCSV}
                      className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                  
                  {/* Third-party Integration Options */}
                  <div className="border-t border-gray-600 pt-4">
                    <h4 className="text-white font-medium mb-3">Share to Third-party Tools:</h4>
                    <div className="flex flex-wrap gap-3">
                      <button 
                        onClick={() => shareToSlack()}
                        className="flex items-center space-x-2 px-3 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
                      >
                        <span>📱</span>
                        <span>Slack</span>
                      </button>
                      <button 
                        onClick={() => shareToNotion()}
                        className="flex items-center space-x-2 px-3 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
                      >
                        <span>📝</span>
                        <span>Notion</span>
                      </button>
                      <button 
                        onClick={() => shareToTrello()}
                        className="flex items-center space-x-2 px-3 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
                      >
                        <span>📋</span>
                        <span>Trello</span>
                      </button>
                      <button 
                        onClick={() => shareToEmail()}
                        className="flex items-center space-x-2 px-3 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
                      >
                        <span>📧</span>
                        <span>Email</span>
                      </button>
                      <button 
                        onClick={() => shareToGoogleDocs()}
                        className="flex items-center space-x-2 px-3 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
                      >
                        <span>📄</span>
                        <span>Google Docs</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Saved Canvases */}
              <div className="mt-6 bg-gray-800 border border-gray-700 rounded-lg p-4">
                <h4 className="text-lg font-bold text-white mb-3">Previous Canvases</h4>
                {getDocumentsByType('lean-canvas').slice(-3).map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
                    <div>
                      <p className="text-white font-medium">{doc.title}</p>
                      <p className="text-gray-400 text-sm">{new Date(doc.createdAt).toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={() => {
                        setCanvasBlocks(doc.data.canvasBlocks);
                        setCurrentDocumentId(doc.id);
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
    </div>
  );
};