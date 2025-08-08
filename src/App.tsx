import React, { useState } from 'react';
import { MessageSquare, BarChart3, BookOpen, Menu, X, User, LogOut } from 'lucide-react';
import { Logo } from './components/Logo';
import { ChatInterface } from './components/ChatInterface';
import { AuthModal } from './components/AuthModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const [activeView, setActiveView] = useState<'overview' | 'chat' | 'analytics' | 'resources'>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const navigation = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'chat', label: 'AI Coach', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'resources', label: 'Resources', icon: BookOpen },
  ];

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Logo size="md" />

            {/* Desktop Navigation */}
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

            {/* Auth Section */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
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
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                >
                  Try It Free
                </button>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveView(item.id as any);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center space-x-2 w-full px-3 py-2 rounded-md text-sm font-medium transition-colors ${
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
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'overview' && (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">BizactlyAI</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Your AI-powered startup coach that helps validate ideas, plan MVPs, and launch successful businesses.
              </p>
            </div>

            {/* Quick Actions */}
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

        {activeView === 'chat' && (
          <div className="h-[600px] bg-white rounded-lg shadow-sm border">
            <ChatInterface onClose={() => setActiveView('overview')} />
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

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode="login"
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