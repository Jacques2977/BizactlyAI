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
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Logo size="md" />

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-gray-700 hover:text-blue-600 font-medium">Home</a>
              <a href="#features" className="text-gray-700 hover:text-blue-600 font-medium">Features</a>
              <a href="#how-it-works" className="text-gray-700 hover:text-blue-600 font-medium">How It Works</a>
              
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setActiveView('dashboard')}
                    className="text-gray-700 hover:text-blue-600 font-medium"
                  >
                    Dashboard
                  </button>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700">{user?.name}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleAuthClick('login')}
                    className="text-gray-700 hover:text-blue-600 font-medium"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => handleAuthClick('signup')}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                  >
                    Try It Free
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a href="#home" className="block px-3 py-2 text-gray-700 hover:text-blue-600 font-medium">Home</a>
              <a href="#features" className="block px-3 py-2 text-gray-700 hover:text-blue-600 font-medium">Features</a>
              <a href="#how-it-works" className="block px-3 py-2 text-gray-700 hover:text-blue-600 font-medium">How It Works</a>
              {!isAuthenticated && (
                <>
                  <button
                    onClick={() => handleAuthClick('login')}
                    className="block w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600 font-medium"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => handleAuthClick('signup')}
                    className="block w-full text-left px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold"
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
      <section id="home" className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            AI Startup Coach for{' '}
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              First-Time Founders
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto">
            Validate your idea, plan your MVP, and launch fast — all with AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => handleAuthClick('signup')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all duration-300"
            >
              Try It Free
            </button>
            <button
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg font-semibold text-lg hover:border-blue-500 hover:text-blue-600 transition-all duration-300"
            >
              How It Works
            </button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Three simple steps to launch your startup</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Describe your idea</h3>
              <p className="text-gray-600">Tell our AI about your startup concept and target market</p>
              <ArrowRight className="w-6 h-6 text-gray-400 mx-auto mt-4 hidden md:block" />
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-purple-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Get AI-guided MVP plan</h3>
              <p className="text-gray-600">Receive a detailed roadmap with features, timeline, and strategy</p>
              <ArrowRight className="w-6 h-6 text-gray-400 mx-auto mt-4 hidden md:block" />
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Launch with confidence</h3>
              <p className="text-gray-600">Execute your plan with ongoing AI coaching and support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Features</h2>
            <p className="text-xl text-gray-600">Everything you need to validate and launch your startup</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow">
              <CheckCircle className="w-8 h-8 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Idea Validator</h3>
              <p className="text-gray-600">Validate your startup idea with AI-powered market analysis and feedback</p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow">
              <CheckCircle className="w-8 h-8 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">MVP Feature Builder</h3>
              <p className="text-gray-600">Get a prioritized list of features for your minimum viable product</p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow">
              <CheckCircle className="w-8 h-8 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Lean Canvas Generator</h3>
              <p className="text-gray-600">Automatically generate business model canvases for your startup</p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow">
              <CheckCircle className="w-8 h-8 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Launch Strategy Planner</h3>
              <p className="text-gray-600">Get step-by-step launch plans and growth tactics</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Founders Say</h2>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8 text-center">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-xl text-gray-800 mb-4">
                "This tool helped me turn an idea into a product! The AI guidance was incredibly valuable for a first-time founder like me."
              </blockquote>
              <cite className="text-gray-600 font-medium">— Early User</cite>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="py-20 bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to build your SaaS?</h2>
          <p className="text-xl text-blue-100 mb-8">Join thousands of founders who've launched with BizactlyAI</p>
          <button
            onClick={() => handleAuthClick('signup')}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all duration-300"
          >
            Start Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <Logo size="md" className="text-white" />
            </div>
            <div className="flex space-x-8">
              <a href="#contact" className="text-gray-300 hover:text-white transition-colors">Contact</a>
              <a href="#terms" className="text-gray-300 hover:text-white transition-colors">Terms</a>
              <a href="#privacy" className="text-gray-300 hover:text-white transition-colors">Privacy</a>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
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
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="text-gray-600 hover:text-gray-900 transition-colors"
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
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
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
                <User className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{user?.name}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
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
          <div className="h-[600px] bg-white rounded-lg shadow-sm border">
            <ChatInterface onClose={() => setActiveView('overview')} />
          </div>
        )}

        {activeView === 'overview' && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Continue building your startup with AI-powered guidance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                <MessageSquare className="w-8 h-8 text-blue-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Startup Coach</h3>
                <p className="text-gray-600 mb-4">Get personalized advice on idea validation, market research, and growth strategies.</p>
                <button
                  onClick={() => setActiveView('chat')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Start Coaching →
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                <BarChart3 className="w-8 h-8 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Dashboard</h3>
                <p className="text-gray-600 mb-4">Track your startup progress with key metrics and insights.</p>
                <button
                  onClick={() => setActiveView('analytics')}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  View Analytics →
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                <BookOpen className="w-8 h-8 text-purple-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Learning Resources</h3>
                <p className="text-gray-600 mb-4">Access curated content, templates, and guides for founders.</p>
                <button
                  onClick={() => setActiveView('resources')}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Explore Resources →
                </button>
              </div>
            </div>

            {/* Stats Section */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-white">
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
            <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                    <p className="text-2xl font-bold text-gray-900">1,234</p>
                  </div>
                  <div className="text-green-500">
                    <BarChart3 className="w-8 h-8" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">+12% from last month</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ideas Validated</p>
                    <p className="text-2xl font-bold text-gray-900">89</p>
                  </div>
                  <div className="text-blue-500">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">+8% from last month</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">MVPs Created</p>
                    <p className="text-2xl font-bold text-gray-900">23</p>
                  </div>
                  <div className="text-purple-500">
                    <BookOpen className="w-8 h-8" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">+15% from last month</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Success Rate</p>
                    <p className="text-2xl font-bold text-gray-900">94%</p>
                  </div>
                  <div className="text-green-500">
                    <BarChart3 className="w-8 h-8" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">+2% from last month</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Validated idea: "AI-powered fitness app"</span>
                  <span className="text-xs text-gray-400">2 hours ago</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Created MVP plan for SaaS platform</span>
                  <span className="text-xs text-gray-400">1 day ago</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Completed market research session</span>
                  <span className="text-xs text-gray-400">3 days ago</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'resources' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Learning Resources</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Startup Fundamentals</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Idea Validation Framework</li>
                  <li>• Market Research Guide</li>
                  <li>• Customer Interview Templates</li>
                  <li>• Competitive Analysis Tools</li>
                </ul>
                <button className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm">
                  Access Resources →
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">MVP Development</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• MVP Planning Templates</li>
                  <li>• Feature Prioritization</li>
                  <li>• User Story Mapping</li>
                  <li>• Prototype Tools</li>
                </ul>
                <button className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm">
                  Access Resources →
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Growth & Marketing</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Growth Hacking Strategies</li>
                  <li>• Content Marketing Guide</li>
                  <li>• Social Media Templates</li>
                  <li>• Analytics Setup</li>
                </ul>
                <button className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm">
                  Access Resources →
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Funding & Investment</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Pitch Deck Templates</li>
                  <li>• Financial Modeling</li>
                  <li>• Investor Outreach</li>
                  <li>• Term Sheet Guide</li>
                </ul>
                <button className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm">
                  Access Resources →
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Legal & Operations</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Business Structure Guide</li>
                  <li>• Contract Templates</li>
                  <li>• IP Protection</li>
                  <li>• Compliance Checklist</li>
                </ul>
                <button className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm">
                  Access Resources →
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Tools & Templates</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Business Model Canvas</li>
                  <li>• Lean Canvas Template</li>
                  <li>• OKR Framework</li>
                  <li>• Roadmap Planning</li>
                </ul>
                <button className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm">
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