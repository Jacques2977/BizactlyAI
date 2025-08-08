import React, { useState } from 'react';
import { MessageSquare, BarChart3, BookOpen, Menu, X, User, LogOut, CheckCircle, ArrowRight, Star } from 'lucide-react';
import { Logo } from './components/Logo';
import { ChatInterface } from './components/ChatInterface';
import { AuthModal } from './components/AuthModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';

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
            AI Startup Coach for{' '}
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              First-Time Founders
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto relative z-10">
            Validate your idea, plan your MVP, and launch fast — all with AI.
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
            <p className="text-xl text-gray-300">Three simple steps to launch your startup</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/25">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Describe your idea</h3>
              <p className="text-gray-300">Tell our AI about your startup concept and target market</p>
              <ArrowRight className="w-6 h-6 text-gray-500 mx-auto mt-4 hidden md:block" />
            </div>
            
            <div className="text-center">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/25">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Get AI-guided MVP plan</h3>
              <p className="text-gray-300">Receive a detailed roadmap with features, timeline, and strategy</p>
              <ArrowRight className="w-6 h-6 text-gray-500 mx-auto mt-4 hidden md:block" />
            </div>
            
            <div className="text-center">
              <div className="bg-gradient-to-r from-green-500 to-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/25">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Launch with confidence</h3>
              <p className="text-gray-300">Execute your plan with ongoing AI coaching and support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Features</h2>
            <p className="text-xl text-gray-300">Everything you need to validate and launch your startup</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:border-blue-500/50">
              <CheckCircle className="w-8 h-8 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Idea Validator</h3>
              <p className="text-gray-300">Validate your startup idea with AI-powered market analysis and feedback</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 hover:border-purple-500/50">
              <CheckCircle className="w-8 h-8 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">MVP Feature Builder</h3>
              <p className="text-gray-300">Get a prioritized list of features for your minimum viable product</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 hover:border-indigo-500/50">
              <CheckCircle className="w-8 h-8 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Lean Canvas Generator</h3>
              <p className="text-gray-300">Automatically generate business model canvases for your startup</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700 hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-300 hover:border-pink-500/50">
              <CheckCircle className="w-8 h-8 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Launch Strategy Planner</h3>
              <p className="text-gray-300">Get step-by-step launch plans and growth tactics</p>
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
                "This tool helped me turn an idea into a product! The AI guidance was incredibly valuable for a first-time founder like me."
              </blockquote>
              <cite className="text-gray-300 font-medium">— Early User</cite>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4 relative z-10">Ready to build your SaaS?</h2>
          <p className="text-xl text-blue-100 mb-8 relative z-10">Join thousands of founders who've launched with BizactlyAI</p>
          <button
            onClick={() => handleAuthClick('signup')}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-lg hover:shadow-white/25 transition-all duration-300 relative z-10"
          >
            Start Free
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
            <p>&copy; 2025 BizactlyAI. All rights reserved.</p>
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
  const [activeView, setActiveView] = useState<'overview' | 'chat' | 'analytics' | 'resources'>('overview');
  const { user, logout } = useAuth();

  const navigation = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'chat', label: 'AI Coach', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'resources', label: 'Resources', icon: BookOpen },
  ];

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

        {activeView === 'overview' && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-4">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Continue building your startup with AI-powered guidance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300">
                <MessageSquare className="w-8 h-8 text-blue-500 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">AI Startup Coach</h3>
                <p className="text-gray-300 mb-4">Get personalized advice on idea validation, market research, and growth strategies.</p>
                <button
                  onClick={() => setActiveView('chat')}
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  Start Coaching →
                </button>
              </div>

              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300">
                <BarChart3 className="w-8 h-8 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Analytics Dashboard</h3>
                <p className="text-gray-300 mb-4">Track your startup progress with key metrics and insights.</p>
                <button
                  onClick={() => setActiveView('analytics')}
                  className="text-green-400 hover:text-green-300 font-medium transition-colors"
                >
                  View Analytics →
                </button>
              </div>

              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300">
                <BookOpen className="w-8 h-8 text-purple-500 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Learning Resources</h3>
                <p className="text-gray-300 mb-4">Access curated content, templates, and guides for founders.</p>
                <button
                  onClick={() => setActiveView('resources')}
                  className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                >
                  Explore Resources →
                </button>
              </div>
            </div>

            {/* Stats Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-lg p-8 text-white shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-3xl font-bold mb-2">10,000+</div>
                  <div className="text-blue-100">Ideas Validated</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2">5,000+</div>
                  <div className="text-blue-100">MVPs Launched</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2">95%</div>
                  <div className="text-blue-100">Success Rate</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Total Sessions</p>
                    <p className="text-2xl font-bold text-white">1,234</p>
                  </div>
                  <div className="text-green-500">
                    <BarChart3 className="w-8 h-8" />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">+12% from last month</p>
              </div>

              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Ideas Validated</p>
                    <p className="text-2xl font-bold text-white">89</p>
                  </div>
                  <div className="text-blue-500">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">+8% from last month</p>
              </div>

              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">MVPs Created</p>
                    <p className="text-2xl font-bold text-white">23</p>
                  </div>
                  <div className="text-purple-500">
                    <BookOpen className="w-8 h-8" />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">+15% from last month</p>
              </div>

              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Success Rate</p>
                    <p className="text-2xl font-bold text-white">94%</p>
                  </div>
                  <div className="text-green-500">
                    <BarChart3 className="w-8 h-8" />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">+2% from last month</p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-300">Validated idea: "AI-powered fitness app"</span>
                  <span className="text-xs text-gray-400">2 hours ago</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-300">Created MVP plan for SaaS platform</span>
                  <span className="text-xs text-gray-400">1 day ago</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-gray-300">Completed market research session</span>
                  <span className="text-xs text-gray-400">3 days ago</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'resources' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Learning Resources</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Startup Fundamentals</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• Idea Validation Framework</li>
                  <li>• Market Research Guide</li>
                  <li>• Customer Interview Templates</li>
                  <li>• Competitive Analysis Tools</li>
                </ul>
                <button className="mt-4 text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors">
                  Access Resources →
                </button>
              </div>

              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-3">MVP Development</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• MVP Planning Templates</li>
                  <li>• Feature Prioritization</li>
                  <li>• User Story Mapping</li>
                  <li>• Prototype Tools</li>
                </ul>
                <button className="mt-4 text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors">
                  Access Resources →
                </button>
              </div>

              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Growth & Marketing</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• Growth Hacking Strategies</li>
                  <li>• Content Marketing Guide</li>
                  <li>• Social Media Templates</li>
                  <li>• Analytics Setup</li>
                </ul>
                <button className="mt-4 text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors">
                  Access Resources →
                </button>
              </div>

              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Funding & Investment</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• Pitch Deck Templates</li>
                  <li>• Financial Modeling</li>
                  <li>• Investor Outreach</li>
                  <li>• Term Sheet Guide</li>
                </ul>
                <button className="mt-4 text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors">
                  Access Resources →
                </button>
              </div>

              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Legal & Operations</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• Business Structure Guide</li>
                  <li>• Contract Templates</li>
                  <li>• IP Protection</li>
                  <li>• Compliance Checklist</li>
                </ul>
                <button className="mt-4 text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors">
                  Access Resources →
                </button>
              </div>

              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Tools & Templates</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• Business Model Canvas</li>
                  <li>• Lean Canvas Template</li>
                  <li>• OKR Framework</li>
                  <li>• Roadmap Planning</li>
                </ul>
                <button className="mt-4 text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors">
                  Access Resources →
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
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