import React, { useState } from 'react';
import { MessageSquare, BarChart3, BookOpen, Menu, X, User, LogOut, CheckCircle, ArrowRight, Star, Edit3, TrendingUp, Search, Rocket, Users, Target, DollarSign, CreditCard } from 'lucide-react';
import { Logo } from './components/Logo';
import { ChatInterface } from './components/ChatInterface';
import { AuthModal } from './components/AuthModal';
import { MetricsUpdateModal } from './components/MetricsUpdateModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { BillingDashboard } from './components/BillingDashboard';
import { UsageLimitModal } from './components/UsageLimitModal';
import { ProgressTracker } from './components/ProgressTracker';
import { IdeaValidator } from './components/IdeaValidator';
import { MVPPlanner } from './components/MVPPlanner';
import { PersonaGenerator } from './components/PersonaGenerator';
import { LaunchPlanAssistant } from './components/LaunchPlanAssistant';
import { PricingAssistant } from './components/PricingAssistant';
import { CompetitorAnalysis } from './components/CompetitorAnalysis';
import { LeanCanvasBuilder } from './components/LeanCanvasBuilder';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useUserMetrics } from './hooks/useUserMetrics';
import { useSubscription } from './hooks/useSubscription';
import { SubscriptionPlan } from './types/subscription';

function AppContent() {
  const [activeView, setActiveView] = useState<'landing' | 'dashboard'>('landing');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const { user, isAuthenticated, logout } = useAuth();

  const handleAuthClick = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    setActiveView('dashboard');
  };

  if (activeView === 'dashboard' && isAuthenticated) {
    return <DashboardView onBack={() => setActiveView('landing')} />;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navbar */}
      <nav className="bg-gray-800/95 backdrop-blur-sm shadow-lg border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Logo size="md" />

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-gray-300 hover:text-blue-400 font-medium transition-colors">Home</a>
              <a href="#features" className="text-gray-300 hover:text-blue-400 font-medium transition-colors">Features</a>
              <a href="#pricing" className="text-gray-300 hover:text-blue-400 font-medium transition-colors">Pricing</a>
              <a href="#how-it-works" className="text-gray-300 hover:text-blue-400 font-medium transition-colors">How It Works</a>
              
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setActiveView('dashboard')}
                    className="text-gray-300 hover:text-blue-400 font-medium transition-colors"
                  >
                    Dashboard
                  </button>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">{user?.name}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleAuthClick('login')}
                    className="text-gray-300 hover:text-blue-400 font-medium transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => handleAuthClick('signup')}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
                  >
                    Try It Free
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-700 bg-gray-800">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a href="#home" className="block px-3 py-2 text-gray-300 hover:text-blue-400 font-medium transition-colors">Home</a>
              <a href="#features" className="block px-3 py-2 text-gray-300 hover:text-blue-400 font-medium transition-colors">Features</a>
              <a href="#pricing" className="block px-3 py-2 text-gray-300 hover:text-blue-400 font-medium transition-colors">Pricing</a>
              <a href="#how-it-works" className="block px-3 py-2 text-gray-300 hover:text-blue-400 font-medium transition-colors">How It Works</a>
              {!isAuthenticated && (
                <>
                  <button
                    onClick={() => handleAuthClick('login')}
                    className="block w-full text-left px-3 py-2 text-gray-300 hover:text-blue-400 font-medium transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => handleAuthClick('signup')}
                    className="block w-full text-left px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
                  >
                    Try It Free
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-20 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-600/10"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)`
        }}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 relative z-10">
            AI Cofounder Platform for{' '}
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              SaaS Startups
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto relative z-10">
            From idea to $10K MRR — your AI cofounder handles validation, MVP planning, and growth strategy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
            <button
              onClick={() => handleAuthClick('signup')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
            >
              Try It Free
            </button>
            <button
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="border-2 border-gray-600 text-gray-300 px-8 py-4 rounded-lg font-semibold text-lg hover:border-blue-500 hover:text-blue-400 hover:bg-gray-800/50 transition-all duration-300"
            >
              How It Works
            </button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-xl text-gray-300">Three simple steps to launch your SaaS</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/25">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Describe your SaaS idea</h3>
              <p className="text-gray-300">Tell our AI about your SaaS concept, target market, and business model</p>
              <ArrowRight className="w-6 h-6 text-gray-500 mx-auto mt-4 hidden md:block" />
            </div>
            
            <div className="text-center">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/25">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Get AI-guided SaaS blueprint</h3>
              <p className="text-gray-300">Receive a detailed roadmap with features, pricing strategy, and go-to-market plan</p>
              <ArrowRight className="w-6 h-6 text-gray-500 mx-auto mt-4 hidden md:block" />
            </div>
            
            <div className="text-center">
              <div className="bg-gradient-to-r from-green-500 to-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/25">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Scale to $10K MRR</h3>
              <p className="text-gray-300">Execute your plan with AI-driven growth tactics and revenue optimization</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Features</h2>
            <p className="text-xl text-gray-300">Everything you need to build and scale your SaaS</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:border-blue-500/50">
              <CheckCircle className="w-8 h-8 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">SaaS Idea Validator</h3>
              <p className="text-gray-300">Validate your SaaS concept with market analysis, competitor research, and demand forecasting</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 hover:border-purple-500/50">
              <CheckCircle className="w-8 h-8 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">SaaS MVP Planner</h3>
              <p className="text-gray-300">Get a prioritized feature roadmap, tech stack recommendations, and development timeline</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 hover:border-indigo-500/50">
              <CheckCircle className="w-8 h-8 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Pricing Strategy AI</h3>
              <p className="text-gray-300">Generate optimal pricing tiers, freemium models, and revenue projections for your SaaS</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700 hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-300 hover:border-pink-500/50">
              <CheckCircle className="w-8 h-8 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Growth Engine</h3>
              <p className="text-gray-300">AI-powered customer acquisition, retention strategies, and path to $10K MRR</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Choose Your Plan</h2>
            <p className="text-xl text-gray-300">Start free and scale as you grow</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Free Plan */}
            <div className="bg-gray-700 rounded-lg p-6 border border-gray-600 hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300">
              <div className="text-center mb-6">
                <div className="text-2xl mb-2">🌱</div>
                <h3 className="text-xl font-bold text-white mb-2">Free Plan</h3>
                <p className="text-sm text-gray-300 mb-4">"Idea Stage"</p>
                <div className="text-3xl font-bold text-white">$0</div>
                <p className="text-gray-400">Forever free</p>
              </div>
              <ul className="space-y-2 mb-6 text-sm text-gray-300">
                <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />20 AI messages/day</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />1 Lean Canvas</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />1 Competitor Snapshot</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />Learning resources</li>
              </ul>
              <button
                onClick={() => handleAuthClick('signup')}
                className="w-full bg-gray-600 text-white py-2 rounded-lg font-medium hover:bg-gray-500 transition-colors"
              >
                Get Started Free
              </button>
            </div>

            {/* Starter Plan */}
            <div className="bg-gradient-to-b from-blue-600 to-blue-700 rounded-lg p-6 border-2 border-blue-500 relative hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                  <Star className="w-4 h-4 mr-1" />
                  Most Popular
                </span>
              </div>
              <div className="text-center mb-6">
                <div className="text-2xl mb-2">🚀</div>
                <h3 className="text-xl font-bold text-white mb-2">Starter Plan</h3>
                <p className="text-sm text-blue-100 mb-4">"MVP Builder"</p>
                <div className="text-3xl font-bold text-white">$19</div>
                <p className="text-blue-100">/month</p>
              </div>
              <ul className="space-y-2 mb-6 text-sm text-blue-100">
                <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-400 mr-2" />Unlimited AI chat</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-400 mr-2" />Unlimited Lean Canvases</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-400 mr-2" />MVP roadmap generator</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-400 mr-2" />3 competitor analysis</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-400 mr-2" />Export projects (PDF)</li>
              </ul>
              <button
                onClick={() => handleAuthClick('signup')}
                className="w-full bg-white text-blue-600 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Start Free Trial
              </button>
            </div>

            {/* Pro Plan */}
            <div className="bg-gray-700 rounded-lg p-6 border border-gray-600 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300">
              <div className="text-center mb-6">
                <div className="text-2xl mb-2">💼</div>
                <h3 className="text-xl font-bold text-white mb-2">Pro Plan</h3>
                <p className="text-sm text-gray-300 mb-4">"Launch & Growth"</p>
                <div className="text-3xl font-bold text-white">$49</div>
                <p className="text-gray-400">/month</p>
              </div>
              <ul className="space-y-2 mb-6 text-sm text-gray-300">
                <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />Everything in Starter</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />10 competitor tracking</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />Financial model generator</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />Marketing playbooks</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />Team collaboration (2)</li>
              </ul>
              <button
                onClick={() => handleAuthClick('signup')}
                className="w-full bg-purple-600 text-white py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                Start Free Trial
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-gray-700 rounded-lg p-6 border border-gray-600 hover:shadow-xl hover:shadow-yellow-500/10 transition-all duration-300">
              <div className="text-center mb-6">
                <div className="text-2xl mb-2">🏢</div>
                <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
                <p className="text-sm text-gray-300 mb-4">"Scale & Invest"</p>
                <div className="text-3xl font-bold text-white">$99</div>
                <p className="text-gray-400">/month</p>
              </div>
              <ul className="space-y-2 mb-6 text-sm text-gray-300">
                <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />Everything in Pro</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />White-label reports</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />Unlimited competitors</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />Pitch deck generator</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 text-green-500 mr-2" />API access</li>
              </ul>
              <button
                onClick={() => handleAuthClick('signup')}
                className="w-full bg-yellow-600 text-white py-2 rounded-lg font-medium hover:bg-yellow-700 transition-colors"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">What Founders Say</h2>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg p-8 text-center border border-gray-600 shadow-xl">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-xl text-white mb-4">
                "BizactlyAI helped me go from idea to $8K MRR in 4 months. The pricing strategy and growth tactics were game-changing!"
              </blockquote>
              <cite className="text-gray-300 font-medium">— Sarah Chen, Founder of TaskFlow SaaS</cite>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4 relative z-10">Ready to build your SaaS?</h2>
          <p className="text-xl text-blue-100 mb-8 relative z-10">Join 500+ SaaS founders who've reached $10K+ MRR with BizactlyAI</p>
          <button
            onClick={() => handleAuthClick('signup')}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-lg hover:shadow-white/25 transition-all duration-300 relative z-10"
          >
            Start Building Your SaaS
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <Logo size="md" />
            </div>
            <div className="flex space-x-8">
              <a href="#contact" className="text-gray-300 hover:text-white transition-colors">Contact</a>
              <a href="#terms" className="text-gray-300 hover:text-white transition-colors">Terms</a>
              <a href="#privacy" className="text-gray-300 hover:text-white transition-colors">Privacy</a>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
            <p>&copy; 2025 Bizactly.AI. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}

// Dashboard Component (existing functionality)
function DashboardView({ onBack }: { onBack: () => void }) {
  const [activeView, setActiveView] = useState<'overview' | 'chat' | 'analytics' | 'resources' | 'billing' | 'idea-validator' | 'mvp-planner' | 'persona-generator' | 'launch-plan' | 'pricing-assistant' | 'lean-canvas'>('overview');
  const [isMetricsModalOpen, setIsMetricsModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [usageLimitModal, setUsageLimitModal] = useState<{
    isOpen: boolean;
    feature: 'aiChats' | 'tools' | 'projects';
    featureName: string;
  }>({
    isOpen: false,
    feature: 'aiChats',
    featureName: ''
  });
  const { user, logout } = useAuth();
  const { metrics, progress, isLoading, updateMetrics } = useUserMetrics();
  const { 
    subscription, 
    currentPlan, 
    canUseFeature, 
    getRemainingUsage, 
    incrementUsage,
    updateSubscription,
    isTrialExpired,
    getDaysUntilExpiry
  } = useSubscription();

  const navigation = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'chat', label: 'AI Coach', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'resources', label: 'Resources', icon: BookOpen },
  ];

  const handleFeatureAccess = (feature: 'aiChats' | 'tools' | 'projects', featureName: string): boolean => {
    if (canUseFeature(feature)) {
      incrementUsage(feature);
      return true;
    } else {
      setUsageLimitModal({
        isOpen: true,
        feature,
        featureName
      });
      return false;
    }
  };

  const handleSubscribe = (plan: SubscriptionPlan) => {
    updateSubscription({
      planId: plan.id,
      status: plan.price === 0 ? 'trialing' : 'active',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + (plan.billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString()
    });
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Dashboard Header */}
      <header className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="text-gray-300 hover:text-white transition-colors"
              >
                ← Back to Home
              </button>
              <Logo size="md" />
            </div>

            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id as any)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeView === item.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center space-x-3">
              <>
              {/* Subscription Status */}
              {currentPlan && (
                <div className="hidden md:flex items-center space-x-2 bg-gray-700 px-3 py-1 rounded-lg">
                  <span className="text-sm text-gray-300">{currentPlan.name}</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-300">{user?.name}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Logout</span>
              </button>
              </>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'chat' && (
          <div className="h-[600px] bg-gray-800 rounded-lg shadow-lg border border-gray-700">
            <ChatInterface onClose={() => setActiveView('overview')} />
          </div>
        )}

        {activeView === 'idea-validator' && (
          <div className="h-[600px] bg-gray-800 rounded-lg shadow-lg border border-gray-700">
            <IdeaValidator onClose={() => setActiveView('overview')} />
          </div>
        )}

        {activeView === 'mvp-planner' && (
          <div className="h-[600px] bg-gray-800 rounded-lg shadow-lg border border-gray-700">
            <MVPPlanner onClose={() => setActiveView('overview')} />
          </div>
        )}

        {activeView === 'persona-generator' && (
          <div className="h-[600px] bg-gray-800 rounded-lg shadow-lg border border-gray-700">
            <PersonaGenerator 
              onClose={() => setActiveView('overview')} 
              onFeatureUse={() => handleFeatureUse('tools', 'Persona Generation Tools')}
            />
          </div>
        )}

        {activeView === 'launch-plan' && (
          <div className="h-[600px] bg-gray-800 rounded-lg shadow-lg border border-gray-700">
            <LaunchPlanAssistant 
              onClose={() => setActiveView('overview')} 
              onFeatureUse={() => handleFeatureUse('tools', 'Launch Planning Tools')}
            />
          </div>
        )}

        {activeView === 'pricing-assistant' && (
          <div className="h-[600px] bg-gray-800 rounded-lg shadow-lg border border-gray-700">
            <PricingAssistant 
              onClose={() => setActiveView('overview')} 
              onFeatureUse={() => handleFeatureUse('tools', 'Pricing Strategy Tools')}
            />
          </div>
        )}

        {activeView === 'lean-canvas' && (
          <div className="h-[600px] bg-gray-800 rounded-lg shadow-lg border border-gray-700">
            <LeanCanvasBuilder 
              onClose={() => setActiveView('overview')} 
              onFeatureUse={() => handleFeatureUse('tools', 'Lean Canvas Tools')}
            />
          </div>
        )}

        {activeView === 'billing' && <BillingDashboard />}

        {activeView === 'overview' && (
          <div className="space-y-8">
            {/* Current Subscription Status */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg p-6 border border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-3xl">
                    {currentPlan?.id === 'free' && '🌱'}
                    {currentPlan?.id === 'starter' && '🚀'}
                    {currentPlan?.id === 'pro' && '💼'}
                    {currentPlan?.id === 'enterprise' && '🏢'}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{currentPlan?.name}</h3>
                    <p className="text-gray-300">
                      {currentPlan?.price === 0 ? 'Free forever' : `$${currentPlan?.price}/month`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-6 mb-2">
                    <div className="text-center">
                      <div className="text-sm text-gray-400">AI Chats</div>
                      <div className="font-semibold text-blue-400">
                        {getRemainingUsage('aiChats') === -1 ? 'Unlimited' : `${getRemainingUsage('aiChats')} left`}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-400">Tools</div>
                      <div className="font-semibold text-green-400">
                        {getRemainingUsage('tools') === -1 ? 'Unlimited' : `${getRemainingUsage('tools')} left`}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-400">Projects</div>
                      <div className="font-semibold text-purple-400">
                        {getRemainingUsage('projects') === -1 ? 'Unlimited' : `${getRemainingUsage('projects')} left`}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsSubscriptionModalOpen(true)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
                  >
                    {currentPlan?.id === 'free' ? 'Upgrade Plan' : 'Manage Subscription'}
                  </button>
                </div>
              </div>
            </div>

            {/* Trial Expiry Warning */}
            {isTrialExpired() && (
              <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-200 font-medium">Your free trial has expired</span>
                  </div>
                  <button
                    onClick={() => setIsSubscriptionModalOpen(true)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    Upgrade Now
                  </button>
                </div>
              </div>
            )}

            {/* Trial Warning */}
            {subscription?.status === 'trialing' && getDaysUntilExpiry() <= 3 && (
              <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-yellow-400" />
                    <span className="text-yellow-200 font-medium">
                      Your free trial expires in {getDaysUntilExpiry()} days
                    </span>
                  </div>
                  <button
                    onClick={() => setIsSubscriptionModalOpen(true)}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-700 transition-colors"
                  >
                    Choose Plan
                  </button>
                </div>
              </div>
            )}

            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-4">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Join 500+ SaaS founders who've reached $10K+ MRR with Bizactly.AI
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300">
                <MessageSquare className="w-8 h-8 text-blue-500 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">AI SaaS Cofounder</h3>
                <p className="text-gray-300 mb-4">Get personalized advice on SaaS validation, pricing strategy, and scaling to $10K MRR.</p>
                <button
                  onClick={() => {
                    if (handleFeatureAccess('aiChats', 'AI Chat Sessions')) {
                      setActiveView('chat');
                    }
                  }}
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  Chat with AI Cofounder →
                </button>
              </div>

              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300">
                <BarChart3 className="w-8 h-8 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">SaaS Metrics Dashboard</h3>
                <p className="text-gray-300 mb-4">Track MRR, churn, CAC, LTV, and other critical SaaS metrics.</p>
                <button
                  onClick={() => setActiveView('analytics')}
                  className="text-green-400 hover:text-green-300 font-medium transition-colors"
                >
                  View SaaS Metrics →
                </button>
              </div>

              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300">
                <BookOpen className="w-8 h-8 text-purple-500 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">SaaS Playbooks</h3>
                <p className="text-gray-300 mb-4">Access proven SaaS templates, growth playbooks, and scaling strategies.</p>
                <button
                  onClick={() => setActiveView('resources')}
                  className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                >
                  Access Playbooks →
                </button>
              </div>
            </div>

            {/* Startup Tools Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">SaaS Startup Tools</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300">
                  <Target className="w-8 h-8 text-indigo-500 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Lean Canvas Builder</h3>
                  <p className="text-gray-300 mb-4">Create a complete business model canvas with guided step-by-step process and AI insights.</p>
                  <button
                    onClick={() => setActiveView('lean-canvas')}
                    className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                  >
                    Build Canvas →
                  </button>
                </div>

                <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300">
                  <Search className="w-8 h-8 text-blue-500 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Idea Validator</h3>
                  <p className="text-gray-300 mb-4">Analyze your SaaS idea with market research, competition analysis, and improvement suggestions.</p>
                  <button
                    onClick={() => {
                      if (handleFeatureAccess('tools', 'Idea Validation Tools')) {
                        setActiveView('idea-validator');
                      }
                    }}
                    className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                  >
                    Validate Idea →
                  </button>
                </div>

                <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300">
                  <Rocket className="w-8 h-8 text-purple-500 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">MVP Prioritizer</h3>
                  <p className="text-gray-300 mb-4">Get a prioritized feature roadmap and development timeline for your MVP.</p>
                  <button
                    onClick={() => {
                      if (handleFeatureAccess('tools', 'MVP Planning Tools')) {
                        setActiveView('mvp-planner');
                      }
                    }}
                    className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                  >
                    Plan MVP →
                  </button>
                </div>

                <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-300">
                  <Users className="w-8 h-8 text-pink-500 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Persona Generator</h3>
                  <p className="text-gray-300 mb-4">Create detailed user personas with demographics, pain points, and behavior patterns.</p>
                  <button
                    onClick={() => {
                      if (handleFeatureAccess('tools', 'Persona Generation Tools')) {
                        setActiveView('persona-generator');
                      }
                    }}
                    className="text-pink-400 hover:text-pink-300 font-medium transition-colors"
                  >
                    Generate Personas →
                  </button>
                </div>

                <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300">
                  <Target className="w-8 h-8 text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Launch Plan Assistant</h3>
                  <p className="text-gray-300 mb-4">Get a comprehensive go-to-market strategy with actionable tasks and timelines.</p>
                  <button
                    onClick={() => {
                      if (handleFeatureAccess('tools', 'Launch Planning Tools')) {
                        setActiveView('launch-plan');
                      }
                    }}
                    className="text-green-400 hover:text-green-300 font-medium transition-colors"
                  >
                    Create Launch Plan →
                  </button>
                </div>

                <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 hover:shadow-xl hover:shadow-yellow-500/10 transition-all duration-300">
                  <DollarSign className="w-8 h-8 text-yellow-500 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Pricing Assistant</h3>
                  <p className="text-gray-300 mb-4">Optimize your pricing strategy with psychological insights and competitive analysis.</p>
                  <button
                    onClick={() => {
                      if (handleFeatureAccess('tools', 'Pricing Strategy Tools')) {
                        setActiveView('pricing-assistant');
                      }
                    }}
                    className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors"
                  >
                    Optimize Pricing →
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-lg p-8 text-white shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-3xl font-bold mb-2">500+</div>
                  <div className="text-blue-100">SaaS Launched</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2">$2.5M+</div>
                  <div className="text-blue-100">Total MRR Generated</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2">4.2 months</div>
                  <div className="text-blue-100">Avg. Time to $10K MRR</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">SaaS Metrics Dashboard</h2>
            
            {/* Update Metrics Button */}
            <div className="flex justify-between items-center">
              <p className="text-gray-300">Track your SaaS growth and key metrics</p>
              <button
                onClick={() => setIsMetricsModalOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 flex items-center space-x-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>Update Metrics</span>
              </button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-gray-300">Loading your metrics...</span>
              </div>
            ) : (
              <>
                {/* Progress Tracker */}
                {progress && (
                  <ProgressTracker progress={progress} />
                )}

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Monthly Recurring Revenue</p>
                        <p className="text-2xl font-bold text-white">${metrics?.mrr.toLocaleString() || '0'}</p>
                      </div>
                      <div className="text-green-500">
                        <BarChart3 className="w-8 h-8" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {metrics?.monthlyGrowth ? `+${metrics.monthlyGrowth}% from last month` : 'Update to track growth'}
                    </p>
                  </div>

                  <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Active Customers</p>
                        <p className="text-2xl font-bold text-white">{metrics?.customers || '0'}</p>
                      </div>
                      <div className="text-blue-500">
                        <MessageSquare className="w-8 h-8" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {metrics?.customers ? 'Growing customer base' : 'Add your first customers'}
                    </p>
                  </div>

                  <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Churn Rate</p>
                        <p className="text-2xl font-bold text-white">{metrics?.churnRate.toFixed(1) || '0'}%</p>
                      </div>
                      <div className="text-purple-500">
                        <TrendingUp className="w-8 h-8" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {metrics?.churnRate && metrics.churnRate < 5 ? 'Healthy retention' : 'Focus on retention'}
                    </p>
                  </div>

                  <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Customer LTV</p>
                        <p className="text-2xl font-bold text-white">${metrics?.ltv.toLocaleString() || '0'}</p>
                      </div>
                      <div className="text-green-500">
                        <BarChart3 className="w-8 h-8" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {metrics?.cac && metrics?.ltv && metrics.ltv > metrics.cac * 3 ? 'Healthy LTV:CAC ratio' : 'Optimize unit economics'}
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Insights Section */}
            {metrics && (
              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">AI Insights & Recommendations</h3>
                <div className="space-y-4">
                  {metrics.mrr === 0 && (
                    <div className="flex items-start space-x-3 bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <span className="text-sm text-blue-200 font-medium">Getting Started</span>
                        <p className="text-sm text-blue-100 mt-1">Update your metrics to get personalized AI recommendations for growing your SaaS.</p>
                      </div>
                    </div>
                  )}
                  
                  {metrics.mrr > 0 && metrics.mrr < 1000 && (
                    <div className="flex items-start space-x-3 bg-green-900/30 border border-green-700/50 rounded-lg p-4">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <span className="text-sm text-green-200 font-medium">Early Stage Focus</span>
                        <p className="text-sm text-green-100 mt-1">Focus on product-market fit and customer feedback. Aim for $1K MRR milestone.</p>
                      </div>
                    </div>
                  )}
                  
                  {metrics.churnRate > 10 && (
                    <div className="flex items-start space-x-3 bg-red-900/30 border border-red-700/50 rounded-lg p-4">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                      <div>
                        <span className="text-sm text-red-200 font-medium">High Churn Alert</span>
                        <p className="text-sm text-red-100 mt-1">Your churn rate is high. Focus on customer success and product improvements.</p>
                      </div>
                    </div>
                  )}
                  
                  {metrics.cac > 0 && metrics.ltv > 0 && metrics.ltv < metrics.cac * 3 && (
                    <div className="flex items-start space-x-3 bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-4">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                      <div>
                        <span className="text-sm text-yellow-200 font-medium">Unit Economics Warning</span>
                        <p className="text-sm text-yellow-100 mt-1">Your LTV:CAC ratio needs improvement. Focus on increasing customer lifetime value or reducing acquisition costs.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeView === 'resources' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">SaaS Growth Playbooks</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-3">SaaS Validation Playbook</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• SaaS Market Sizing Framework</li>
                  <li>• B2B Customer Interview Scripts</li>
                  <li>• Competitor Analysis Templates</li>
                  <li>• Problem-Solution Fit Metrics</li>
                </ul>
                <button className="mt-4 text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors">
                  Access Playbook →
                </button>
              </div>

              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-3">SaaS MVP Blueprint</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• Feature Prioritization Matrix</li>
                  <li>• Tech Stack Recommendations</li>
                  <li>• User Onboarding Flows</li>
                  <li>• MVP Launch Checklist</li>
                </ul>
                <button className="mt-4 text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors">
                  Access Blueprint →
                </button>
              </div>

              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-3">SaaS Pricing Mastery</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• Pricing Psychology Framework</li>
                  <li>• Freemium vs. Trial Strategies</li>
                  <li>• Value-Based Pricing Models</li>
                  <li>• Price Testing Methodologies</li>
                </ul>
                <button className="mt-4 text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors">
                  Master Pricing →
                </button>
              </div>

              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-3">$10K MRR Roadmap</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• Customer Acquisition Channels</li>
                  <li>• Retention & Expansion Tactics</li>
                  <li>• Revenue Optimization Guide</li>
                  <li>• Scaling Team & Operations</li>
                </ul>
                <button className="mt-4 text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors">
                  Get Roadmap →
                </button>
              </div>

              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-3">SaaS Metrics & Analytics</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• Key SaaS Metrics Dashboard</li>
                  <li>• Cohort Analysis Templates</li>
                  <li>• Churn Prediction Models</li>
                  <li>• Growth Attribution Setup</li>
                </ul>
                <button className="mt-4 text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors">
                  Setup Analytics →
                </button>
              </div>

              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-3">SaaS Fundraising Kit</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• SaaS Pitch Deck Template</li>
                  <li>• Financial Model Builder</li>
                  <li>• Investor Outreach Scripts</li>
                  <li>• Due Diligence Checklist</li>
                </ul>
                <button className="mt-4 text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors">
                  Get Fundraising Kit →
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Metrics Update Modal */}
      {metrics && (
        <MetricsUpdateModal
          isOpen={isMetricsModalOpen}
          onClose={() => setIsMetricsModalOpen(false)}
          currentMetrics={metrics}
          onUpdate={updateMetrics}
        />
      )}

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        onSubscribe={handleSubscribe}
        currentPlanId={subscription?.planId}
      />

      {/* Usage Limit Modal */}
      <UsageLimitModal
        isOpen={usageLimitModal.isOpen}
        onClose={() => setUsageLimitModal(prev => ({ ...prev, isOpen: false }))}
        feature={usageLimitModal.feature}
        featureName={usageLimitModal.featureName}
      />
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