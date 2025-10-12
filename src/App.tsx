import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { Logo } from './components/Logo';
import { AuthModal } from './components/AuthModal';
import { ChatInterface } from './components/ChatInterface';
import { IdeaValidator } from './components/IdeaValidator';
import { MVPPlanner } from './components/MVPPlanner';
import { LeanCanvasBuilder } from './components/LeanCanvasBuilder';
import { PersonaGenerator } from './components/PersonaGenerator';
import { PricingAssistant } from './components/PricingAssistant';
import { CompetitorAnalysis } from './components/CompetitorAnalysis';
import { LaunchPlanAssistant } from './components/LaunchPlanAssistant';
import { ProgressTracker } from './components/ProgressTracker';
import { MetricsUpdateModal } from './components/MetricsUpdateModal';
import { BillingDashboard } from './components/BillingDashboard';
import { SubscriptionModal } from './components/SubscriptionModal';
import { UsageLimitModal } from './components/UsageLimitModal';
import { DataManager } from './components/DataManager';
import { useAuth } from './contexts/AuthContext';
import { useUserMetrics } from './hooks/useUserMetrics';
import { useSubscription } from './hooks/useSubscription';
import { 
  Bot, 
  Search, 
  Rocket, 
  Target, 
  Users, 
  DollarSign, 
  TrendingUp,
  BarChart3,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Lightbulb,
  CheckCircle,
  Star,
  ArrowRight,
  Play,
  Zap,
  Shield,
  Globe,
  Database
} from 'lucide-react';

type ActiveTool = 'chat' | 'validator' | 'mvp' | 'canvas' | 'personas' | 'pricing' | 'competitors' | 'launch' | 'analytics' | 'billing' | 'data-manager' | null;

function AppContent() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const { metrics, progress, updateMetrics, isLoading: metricsLoading } = useUserMetrics();
  const { subscription, currentPlan, canUseFeature, incrementUsage, getRemainingUsage } = useSubscription();
  
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isMetricsModalOpen, setIsMetricsModalOpen] = useState(false);
  const [usageLimitModal, setUsageLimitModal] = useState<{
    isOpen: boolean;
    feature: 'aiChats' | 'tools' | 'projects';
    featureName: string;
  }>({
    isOpen: false,
    feature: 'aiChats',
    featureName: ''
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleFeatureUse = (feature: 'aiChats' | 'tools' | 'projects', featureName: string): boolean => {
    // Temporarily allow all features for testing
    console.log(`Using feature: ${featureName}`);
    return true;
  };

  const handleToolSelect = (tool: ActiveTool) => {
    // Temporarily remove feature restrictions for testing
    console.log(`Selected tool: ${tool}`);
    
    setActiveTool(tool);
    setIsMobileMenuOpen(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage onGetStarted={() => setIsAuthModalOpen(true)} />;
  }

  const tools = [
    { id: 'chat', name: 'AI Coach', icon: Bot, description: 'Get personalized startup guidance', color: 'from-blue-500 to-purple-600' },
    { id: 'validator', name: 'Idea Validator', icon: Search, description: 'Validate your startup concept', color: 'from-green-500 to-teal-600' },
    { id: 'mvp', name: 'MVP Planner', icon: Rocket, description: 'Plan your minimum viable product', color: 'from-purple-500 to-pink-600' },
    { id: 'canvas', name: 'Lean Canvas', icon: Target, description: 'Build your business model', color: 'from-indigo-500 to-purple-600' },
    { id: 'personas', name: 'User Personas', icon: Users, description: 'Define your target customers', color: 'from-pink-500 to-rose-600' },
    { id: 'pricing', name: 'Pricing Strategy', icon: DollarSign, description: 'Optimize your pricing model', color: 'from-emerald-500 to-green-600' },
    { id: 'competitors', name: 'Competitor Analysis', icon: TrendingUp, description: 'Analyze your competition', color: 'from-red-500 to-pink-600' },
    { id: 'launch', name: 'Launch Planner', icon: Zap, description: 'Plan your go-to-market strategy', color: 'from-orange-500 to-red-600' },
  ];

  const renderActiveTool = () => {
    switch (activeTool) {
      case 'chat':
        return <ChatInterface onClose={() => setActiveTool(null)} onFeatureUse={() => handleFeatureUse('aiChats', 'AI Chat')} />;
      case 'validator':
        return <IdeaValidator onClose={() => setActiveTool(null)} />;
      case 'mvp':
        return <MVPPlanner onClose={() => setActiveTool(null)} />;
      case 'canvas':
        return <LeanCanvasBuilder onClose={() => setActiveTool(null)} />;
      case 'personas':
        return <PersonaGenerator onClose={() => setActiveTool(null)} />;
      case 'pricing':
        return <PricingAssistant onClose={() => setActiveTool(null)} />;
      case 'competitors':
        return <CompetitorAnalysis onClose={() => setActiveTool(null)} />;
      case 'launch':
        return <LaunchPlanAssistant onClose={() => setActiveTool(null)} />;
      case 'analytics':
        return (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
              <button
                onClick={() => setActiveTool(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {progress && <ProgressTracker progress={progress} />}
            <button
              onClick={() => setIsMetricsModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Update Metrics
            </button>
          </div>
        );
      case 'billing':
        return (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Billing & Subscription</h2>
              <button
                onClick={() => setActiveTool(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <BillingDashboard />
          </div>
        );
      case 'data-manager':
        return <DataManager onClose={() => setActiveTool(null)} />;
      default:
        return <Dashboard tools={tools} onToolSelect={handleToolSelect} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <div className={`${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-800 border-r border-gray-700 transition-transform duration-300 ease-in-out`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-700">
            <Logo size="md" />
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <button
              onClick={() => handleToolSelect(null)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                activeTool === null ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Dashboard</span>
            </button>

            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => handleToolSelect(tool.id as ActiveTool)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  activeTool === tool.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <tool.icon className="w-5 h-5" />
                <span>{tool.name}</span>
              </button>
            ))}

            <button
              onClick={() => handleToolSelect('analytics')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                activeTool === 'analytics' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              <span>Analytics</span>
            </button>

            <button
              onClick={() => handleToolSelect('billing')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                activeTool === 'billing' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span>Billing</span>
            </button>

            <button
              onClick={() => handleToolSelect('data-manager')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                activeTool === 'data-manager' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Database className="w-5 h-5" />
              <span>Data Manager</span>
            </button>
          </nav>

          {/* User Menu */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{user.name}</p>
                <p className="text-gray-400 text-sm truncate">{currentPlan?.name}</p>
              </div>
            </div>
            
            {/* Usage Stats */}
            {/* Temporarily hide usage stats for testing */}
            <div className="mb-3 p-2 bg-gray-700 rounded text-xs">
              <div className="flex justify-between text-gray-300">
                <span>Status:</span>
                <span className="text-green-400">Testing Mode - All Features Unlocked</span>
              </div>
            </div>

            <div className="space-y-1">
              {/* Temporarily hide upgrade button for testing */}
              <button
                onClick={logout}
                className="w-full flex items-center space-x-2 px-2 py-1 text-gray-300 hover:text-white transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Logo size="sm" />
          <div className="w-6" /> {/* Spacer */}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {renderActiveTool()}
        </div>
      </div>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        onSubscribe={(plan) => {
          // Handle subscription logic here
          setIsSubscriptionModalOpen(false);
        }}
        currentPlanId={subscription?.planId}
      />

      {metrics && (
        <MetricsUpdateModal
          isOpen={isMetricsModalOpen}
          onClose={() => setIsMetricsModalOpen(false)}
          currentMetrics={metrics}
          onUpdate={updateMetrics}
        />
      )}

      <UsageLimitModal
        isOpen={usageLimitModal.isOpen}
        onClose={() => setUsageLimitModal(prev => ({ ...prev, isOpen: false }))}
        feature={usageLimitModal.feature}
        featureName={usageLimitModal.featureName}
      />
    </div>
  );
}

// Landing Page Component
function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Logo size="lg" />
          <button
            onClick={onGetStarted}
            className="bg-white text-gray-900 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Your AI-Powered
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Startup Coach</span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            From idea validation to MVP launch, get personalized guidance from an AI trained on startup best practices. 
            Build your next SaaS with confidence.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={onGetStarted}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <Play className="w-5 h-5" />
              <span>Try It Free</span>
            </button>
            <button className="border border-gray-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-800 transition-colors">
              Watch Demo
            </button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Search className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Idea Validation</h3>
              <p className="text-gray-300">Validate your startup concept with AI-powered market analysis and competitor research.</p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">MVP Planning</h3>
              <p className="text-gray-300">Create detailed MVP roadmaps with feature prioritization and development timelines.</p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Growth Strategy</h3>
              <p className="text-gray-300">Get personalized growth tactics and launch strategies for your SaaS business.</p>
            </div>
          </div>

          {/* Social Proof */}
          <div className="mt-20 text-center">
            <p className="text-gray-400 mb-6">Trusted by founders building the next generation of SaaS</p>
            <div className="flex items-center justify-center space-x-8 opacity-60">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="text-white">4.9/5 Rating</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-500" />
                <span className="text-white">1000+ Founders</span>
              </div>
              <div className="flex items-center space-x-2">
                <Rocket className="w-5 h-5 text-purple-500" />
                <span className="text-white">500+ MVPs Launched</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>
    </div>
  );
}

// Dashboard Component
function Dashboard({ tools, onToolSelect }: { tools: any[], onToolSelect: (tool: ActiveTool) => void }) {
  return (
    <div className="p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome to Bizactly.AI</h1>
        <p className="text-gray-300">Your AI-powered startup coaching platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onToolSelect(tool.id)}
            className="group bg-gray-800 border border-gray-700 rounded-lg p-6 hover:shadow-lg transition-all duration-300 hover:border-gray-600 text-left"
          >
            <div className={`w-12 h-12 bg-gradient-to-r ${tool.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <tool.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{tool.name}</h3>
            <p className="text-gray-300 text-sm">{tool.description}</p>
            <div className="flex items-center mt-4 text-blue-400 group-hover:text-blue-300">
              <span className="text-sm font-medium">Get Started</span>
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-700/50 rounded-lg p-6">
          <div className="flex items-center">
            <Lightbulb className="w-8 h-8 text-blue-400 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-white">AI-Powered Insights</h3>
              <p className="text-blue-200 text-sm">Get personalized startup guidance</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-900/30 to-teal-900/30 border border-green-700/50 rounded-lg p-6">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-400 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-white">Proven Frameworks</h3>
              <p className="text-green-200 text-sm">Based on startup best practices</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-700/50 rounded-lg p-6">
          <div className="flex items-center">
            <Zap className="w-8 h-8 text-purple-400 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-white">Fast Results</h3>
              <p className="text-purple-200 text-sm">From idea to MVP in weeks</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;