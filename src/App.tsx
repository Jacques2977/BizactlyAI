import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthModal } from './components/AuthModal';
import { Logo } from './components/Logo';
import { sendMessageToAI, type ChatMessage } from './api/chat';
import { 
  Rocket, 
  BarChart3, 
  Users, 
  MessageSquare, 
  Target, 
  TrendingUp, 
  CheckCircle, 
  ArrowRight, 
  Menu, 
  X,
  Lightbulb,
  DollarSign,
  Calendar,
  BookOpen,
  Settings,
  Home,
  Send,
  Bot,
  Play,
  FileText,
  Zap,
  LogOut
} from 'lucide-react';

type View = 'landing' | 'dashboard' | 'chat' | 'analytics' | 'resources';

interface ChatMessageState extends ChatMessage {
  isLoading?: boolean;
}

function AppContent() {
  const [currentView, setCurrentView] = useState<View>('landing');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [chatMessages, setChatMessages] = useState<ChatMessageState[]>([
    { id: 1, type: 'ai', content: "Hello! I'm your AI startup coach. I'm here to help you validate your idea, plan your MVP, and launch with confidence. What's your startup idea?" },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleTryFree = () => {
    if (isAuthenticated) {
      setCurrentView('dashboard');
    } else {
      openAuthModal('signup');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isTyping) return;
    
    const userMessage: ChatMessageState = { id: Date.now(), type: 'user', content: newMessage };
    setChatMessages(prev => [...prev, userMessage]);
    const messageToSend = newMessage.trim();
    setNewMessage(''); // Clear input immediately
    setIsTyping(true);
    
    try {
      // Get AI response from OpenAI
      const aiResponseContent = await sendMessageToAI(messageToSend, chatMessages);
      
      const aiResponse: ChatMessageState = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponseContent
      };
      
      setChatMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorResponse: ChatMessageState = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'I apologize, but I encountered an error connecting to the AI service. Please check your API key configuration and try again.'
      };
      setChatMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const LandingPage = () => (
    <div className="min-h-screen bg-gray-950">
      {/* Navbar */}
      <nav className="bg-gray-900 shadow-sm sticky top-0 z-50 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Logo size="md" />
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-gray-300 hover:text-cyan-400 transition-colors font-medium">Home</a>
              <a href="#features" className="text-gray-300 hover:text-cyan-400 transition-colors font-medium">Features</a>
              <a href="#how-it-works" className="text-gray-300 hover:text-blue-400 transition-colors font-medium">How It Works</a>
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-300">Hi, {user?.name}</span>
                  <button 
                    onClick={() => setCurrentView('dashboard')}
                    className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                  >
                    Dashboard
                  </button>
                  <button 
                    onClick={logout}
                    className="text-gray-300 hover:text-red-400 transition-colors font-medium"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <button 
                    onClick={() => openAuthModal('login')}
                    className="text-gray-300 hover:text-blue-400 transition-colors font-medium"
                  >
                    Login
                  </button>
                  <button 
                    onClick={handleTryFree}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 font-medium"
                  >
                    Try It Free
                  </button>
                </>
              )}
            </div>
            
            <button 
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-gray-900 border-t border-gray-800">
            <div className="px-4 py-2 space-y-2">
              <a href="#home" className="block py-2 text-gray-300">Home</a>
              <a href="#features" className="block py-2 text-gray-300">Features</a>
              <a href="#how-it-works" className="block py-2 text-gray-300">How It Works</a>
              {isAuthenticated ? (
                <>
                  <button 
                    onClick={() => setCurrentView('dashboard')}
                    className="block py-2 text-gray-300 text-left w-full"
                  >
                    Dashboard
                  </button>
                  <button 
                    onClick={logout}
                    className="block py-2 text-red-400 text-left w-full"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => openAuthModal('login')}
                    className="block py-2 text-gray-300 text-left w-full"
                  >
                    Login
                  </button>
                  <button 
                    onClick={handleTryFree}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg mt-2"
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
      <section id="home" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 to-gray-950">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            The AI startup cofounder for{' '}
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              SaaS founders
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Build, validate, and scale your SaaS — without the overwhelm. Get AI-powered guidance from idea to $10k MRR.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={handleTryFree}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center space-x-2"
            >
              <span>Try It Free</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="text-blue-400 border-2 border-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-900 transition-all duration-300 flex items-center space-x-2">
              <Play className="w-5 h-5" />
              <span>How It Works</span>
            </button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-xl text-gray-300">Three simple steps to turn your SaaS idea into a profitable business</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lightbulb className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">1. Describe your idea</h3>
              <p className="text-gray-300">Tell our AI about your SaaS concept, target market, and revenue goals. No complex business plan required.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">2. Get AI-guided MVP plan</h3>
              <p className="text-gray-300">Receive a customized SaaS roadmap with core features, pricing strategy, and go-to-market plan.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">3. Launch with confidence</h3>
              <p className="text-gray-300">Launch your SaaS with ongoing AI support, tracking MRR growth and optimizing for scale.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Features</h2>
            <p className="text-xl text-gray-300">Everything you need to validate and launch your SaaS startup</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-800">
              <div className="flex items-center space-x-4 mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <h3 className="text-xl font-semibold text-white">Idea Validator</h3>
              </div>
              <p className="text-gray-300">Get instant feedback on your SaaS idea with market analysis, competitor research, and revenue potential assessment.</p>
            </div>
            
            <div className="bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-800">
              <div className="flex items-center space-x-4 mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <h3 className="text-xl font-semibold text-white">MVP Feature Builder</h3>
              </div>
              <p className="text-gray-300">AI-powered feature prioritization to help you build the right SaaS MVP with core features that drive subscriptions.</p>
            </div>
            
            <div className="bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-800">
              <div className="flex items-center space-x-4 mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <h3 className="text-xl font-semibold text-white">SaaS Business Model</h3>
              </div>
              <p className="text-gray-300">Generate pricing tiers, subscription models, and revenue projections tailored to your SaaS market.</p>
            </div>
            
            <div className="bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-800">
              <div className="flex items-center space-x-4 mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <h3 className="text-xl font-semibold text-white">Growth Strategy Planner</h3>
              </div>
              <p className="text-gray-300">Get a step-by-step growth plan with SaaS marketing strategies, customer acquisition, and retention tactics.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-16">What Founders Say</h2>
          
          <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-8 rounded-2xl">
            <blockquote className="text-2xl text-white mb-6 italic">
              "BizactlyAI helped me validate my SaaS idea and reach $5k MRR in 3 months. The AI guidance was like having an experienced SaaS founder as my cofounder."
            </blockquote>
            <div className="text-gray-300 font-medium">— Sarah Chen, SaaS Founder</div>
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to build your SaaS?</h2>
          <p className="text-xl text-purple-100 mb-8">Join hundreds of founders who've validated and launched with AI guidance</p>
          <button 
            onClick={handleTryFree}
            className="bg-white text-purple-600 px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            Start Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <Logo size="sm" className="mb-4 md:mb-0" />
            <div className="flex space-x-8 text-gray-400">
              <a href="#contact" className="hover:text-white transition-colors">Contact</a>
              <a href="#terms" className="hover:text-white transition-colors">Terms</a>
              <a href="#privacy" className="hover:text-white transition-colors">Privacy</a>
            </div>
          </div>
        </div>
      </footer>

      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </div>
  );

  const Dashboard = () => (
    <div className="min-h-screen bg-gray-950">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-gray-900 shadow-sm">
        <div className="p-6 border-b border-gray-800">
          <Logo size="sm" />
        </div>
        
        <nav className="p-4 space-y-2">
          {[
            { icon: Home, label: 'Overview', view: 'dashboard' },
            { icon: MessageSquare, label: 'AI Coach', view: 'chat' },
            { icon: BarChart3, label: 'Analytics', view: 'analytics' },
            { icon: BookOpen, label: 'Resources', view: 'resources' },
            { icon: Settings, label: 'Settings', view: 'dashboard' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.view}
                onClick={() => setCurrentView(item.view as View)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  currentView === item.view 
                    ? 'bg-blue-900 text-blue-400' 
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        
        <div className="absolute bottom-4 left-4 right-4">
          <div className="mb-4 p-3 bg-gray-700 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Logged in as:</div>
            <div className="font-medium text-white">{user?.name}</div>
            <div className="text-sm text-gray-300">{user?.email}</div>
          </div>
          <button 
            onClick={() => setCurrentView('landing')}
            className="w-full text-left text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            ← Back to Landing
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {currentView === 'dashboard' && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user?.name}!</h1>
              <p className="text-gray-300">Your personalized SaaS startup roadmap is ready</p>
            </div>
            
            {/* Current Focus Area */}
            <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl p-6 mb-8 border border-blue-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">Your Current Focus</h2>
                  <p className="text-blue-200">Based on your progress, here's what to work on next</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-300">Step 2</div>
                  <div className="text-sm text-blue-200">of 6</div>
                </div>
              </div>
              <div className="bg-blue-800 bg-opacity-50 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">🎯 MVP Feature Planning</h3>
                <p className="text-blue-100 text-sm mb-3">
                  Time to define your core SaaS features. Focus on the 3-5 features that will make users pay.
                </p>
                <button 
                  onClick={() => setCurrentView('chat')}
                  className="bg-white text-blue-900 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                >
                  Continue with AI Coach
                </button>
              </div>
            </div>

            {/* Personalized Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { label: 'Refine Your Idea', icon: Lightbulb, color: 'from-green-500 to-emerald-600', status: 'completed' },
                { label: 'Build MVP Plan', icon: FileText, color: 'from-blue-500 to-purple-600', status: 'current' },
                { label: 'Create Business Model', icon: Target, color: 'from-purple-500 to-indigo-600', status: 'next' },
                { label: 'Launch Strategy', icon: Rocket, color: 'from-indigo-500 to-blue-600', status: 'future' },
              ].map((action, index) => {
                const Icon = action.icon;
                return (
                  <button 
                    key={index} 
                    className={`bg-gray-900 p-6 rounded-xl shadow-sm border transition-all duration-300 text-left group relative ${
                      action.status === 'completed' ? 'border-green-800' :
                      action.status === 'current' ? 'border-blue-800 ring-2 ring-blue-900' :
                      action.status === 'next' ? 'border-purple-800' :
                      'border-gray-800 opacity-60'
                    } hover:shadow-md`}
                    disabled={action.status === 'future'}
                  >
                    {action.status === 'completed' && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                    )}
                    {action.status === 'current' && (
                      <div className="absolute top-2 right-2">
                        <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                      </div>
                    )}
                    <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${
                      action.status === 'future' ? 'opacity-50' : ''
                    }`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className={`text-lg font-semibold mb-1 ${
                      action.status === 'future' ? 'text-gray-500' : 'text-white'
                    }`}>
                      {action.label}
                    </div>
                    <div className={`text-xs ${
                      action.status === 'completed' ? 'text-green-400' :
                      action.status === 'current' ? 'text-blue-400' :
                      action.status === 'next' ? 'text-purple-400' :
                      'text-gray-500'
                    }`}>
                      {action.status === 'completed' ? '✓ Completed' :
                       action.status === 'current' ? '→ In Progress' :
                       action.status === 'next' ? '◦ Up Next' :
                       '◦ Coming Soon'}
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* Personal Progress Journey */}
            <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Your SaaS Journey</h2>
                <div className="text-sm text-gray-400">
                  Started {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { 
                    step: "💡 Idea Validation", 
                    status: "completed", 
                    progress: 100,
                    description: "Market research & problem validation",
                    timeSpent: "2 days"
                  },
                  { 
                    step: "🛠️ MVP Feature Planning", 
                    status: "in-progress", 
                    progress: 60,
                    description: "Defining core SaaS features & user flows",
                    timeSpent: "1 day"
                  },
                  { 
                    step: "📊 Business Model Design", 
                    status: "pending", 
                    progress: 0,
                    description: "Pricing strategy & revenue model",
                    timeSpent: "Not started"
                  },
                  { 
                    step: "🚀 Launch Strategy", 
                    status: "pending", 
                    progress: 0,
                    description: "Go-to-market plan & customer acquisition",
                    timeSpent: "Not started"
                  },
                ].map((item, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-800 transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      item.status === 'completed' ? 'bg-green-900 text-green-400' :
                      item.status === 'in-progress' ? 'bg-blue-900 text-blue-400' :
                      'bg-gray-800 text-gray-400'
                    }`}>
                      {item.status === 'completed' ? <CheckCircle className="w-5 h-5" /> : index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium text-white mb-1">{item.step}</div>
                          <div className="text-sm text-gray-400">{item.description}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-white">{item.progress}%</div>
                          <div className="text-xs text-gray-400">{item.timeSpent}</div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            item.status === 'completed' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                            item.status === 'in-progress' ? 'bg-gradient-to-r from-blue-500 to-purple-600' :
                            'bg-gray-700'
                          }`}
                          style={{ width: `${item.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Personal Insights */}
              <div className="mt-6 pt-6 border-t border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-4">Your Progress Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { 
                      label: "Days Active", 
                      value: "3", 
                      icon: Calendar,
                      color: "text-blue-400"
                    },
                    { 
                      label: "AI Sessions", 
                      value: "7", 
                      icon: MessageSquare,
                      color: "text-purple-400"
                    },
                    { 
                      label: "Next Milestone", 
                      value: "MVP Plan", 
                      icon: Target,
                      color: "text-green-400"
                    },
                  ].map((insight, index) => {
                    const Icon = insight.icon;
                    return (
                      <div key={index} className="bg-gray-800 rounded-lg p-4 text-center">
                        <Icon className={`w-6 h-6 mx-auto mb-2 ${insight.color}`} />
                        <div className="text-xl font-bold text-white">{insight.value}</div>
                        <div className="text-sm text-gray-400">{insight.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Motivational Message */}
              <div className="mt-6 bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Great momentum, {user?.name}! 🚀</div>
                    <div className="text-blue-200 text-sm">
                      You're 60% through MVP planning. Keep going to reach your first milestone!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'analytics' && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">{user?.name}'s Analytics</h1>
              <p className="text-gray-300">Track your personal startup progress and key metrics</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-4">Your Validation Score</h3>
                <div className="h-64 bg-gradient-to-r from-blue-950 to-purple-950 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-400 mb-2">85%</div>
                    <div className="text-gray-300">Market Validation</div>
                    <div className="text-sm text-gray-400 mt-2">Based on your research</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-4">Your MVP Progress</h3>
                <div className="h-64 bg-gradient-to-r from-purple-950 to-pink-950 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-400 mb-2">60%</div>
                    <div className="text-gray-300">Features Planned</div>
                    <div className="text-sm text-gray-400 mt-2">3 of 5 core features defined</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Personal Activity Timeline */}
            <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Your Recent Activity</h3>
              <div className="space-y-4">
                {[
                  { 
                    action: "Completed idea validation session", 
                    time: "2 hours ago",
                    type: "success"
                  },
                  { 
                    action: "Defined target customer persona", 
                    time: "1 day ago",
                    type: "info"
                  },
                  { 
                    action: "Started MVP feature planning", 
                    time: "2 days ago",
                    type: "progress"
                  },
                  { 
                    action: "Created account and began journey", 
                    time: "3 days ago",
                    type: "milestone"
                  },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-800 transition-colors">
                    <div className={`w-3 h-3 rounded-full ${
                      activity.type === 'success' ? 'bg-green-400' :
                      activity.type === 'info' ? 'bg-blue-400' :
                      activity.type === 'progress' ? 'bg-purple-400' :
                      'bg-yellow-400'
                    }`}></div>
                    <div className="flex-1">
                      <div className="font-medium text-white">{activity.action}</div>
                      </div>
                    <div className="text-sm text-gray-400">{activity.time}</div>
                      </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentView === 'resources' && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Startup Resources</h1>
              <p className="text-gray-300">Curated resources for first-time founders</p>
            </div>
            
            {/* Resource Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {[
                { 
                  title: "Validation", 
                  icon: Target, 
                  count: "4 resources",
                  color: "from-green-500 to-emerald-600"
                },
                { 
                  title: "Development", 
                  icon: FileText, 
                  count: "6 resources",
                  color: "from-blue-500 to-purple-600"
                },
                { 
                  title: "Growth", 
                  icon: TrendingUp, 
                  count: "5 resources",
                  color: "from-purple-500 to-pink-600"
                },
              ].map((category, index) => {
                const Icon = category.icon;
                return (
                  <div key={index} className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                    <div className={`w-12 h-12 bg-gradient-to-r ${category.color} rounded-xl flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{category.title}</h3>
                    <p className="text-gray-400 text-sm">{category.count}</p>
                  </div>
                );
              })}
            </div>

            {/* Detailed Resources */}
            <div className="space-y-8">
              {/* Validation Section */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
                  <Target className="w-6 h-6 text-green-400" />
                  <span>Idea Validation</span>
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-xs font-medium text-green-400 bg-green-900 px-2 py-1 rounded-full">
                        Essential
                      </span>
                      <span className="text-xs text-gray-400">10 min read</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-3">The Complete Idea Validation Checklist</h3>
                    <p className="text-gray-300 text-sm mb-4">
                      A step-by-step guide to validate your startup idea before investing time and money. Learn how to test market demand, identify your target audience, and validate your value proposition.
                    </p>
                    <div className="space-y-2 text-sm text-gray-400 mb-4">
                      <div>• Market research techniques</div>
                      <div>• Customer interview frameworks</div>
                      <div>• Problem-solution fit validation</div>
                      <div>• Competitive analysis methods</div>
                    </div>
                    <button className="text-green-400 hover:text-green-300 font-medium flex items-center space-x-1">
                      <span>Read Guide</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-xs font-medium text-green-400 bg-green-900 px-2 py-1 rounded-full">
                        Framework
                      </span>
                      <span className="text-xs text-gray-400">15 min read</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-3">Customer Discovery Framework</h3>
                    <p className="text-gray-300 text-sm mb-4">
                      Master the art of customer discovery with proven frameworks used by successful startups. Learn how to conduct effective interviews and extract actionable insights.
                    </p>
                    <div className="space-y-2 text-sm text-gray-400 mb-4">
                      <div>• Interview question templates</div>
                      <div>• Customer persona development</div>
                      <div>• Pain point identification</div>
                      <div>• Insight synthesis methods</div>
                    </div>
                    <button className="text-green-400 hover:text-green-300 font-medium flex items-center space-x-1">
                      <span>Read Guide</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Development Section */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
                  <FileText className="w-6 h-6 text-blue-400" />
                  <span>Product Development</span>
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-xs font-medium text-blue-400 bg-blue-900 px-2 py-1 rounded-full">
                        MVP Guide
                      </span>
                      <span className="text-xs text-gray-400">25 min read</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-3">Building Your First MVP</h3>
                    <p className="text-gray-300 text-sm mb-4">
                      Learn how to build a Minimum Viable Product that validates your core assumptions while minimizing development time and costs. Focus on what matters most.
                    </p>
                    <div className="space-y-2 text-sm text-gray-400 mb-4">
                      <div>• Feature prioritization frameworks</div>
                      <div>• MVP vs. prototype differences</div>
                      <div>• Technical architecture basics</div>
                      <div>• Launch readiness checklist</div>
                    </div>
                    <button className="text-blue-400 hover:text-blue-300 font-medium flex items-center space-x-1">
                      <span>Read Guide</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-xs font-medium text-blue-400 bg-blue-900 px-2 py-1 rounded-full">
                        Template
                      </span>
                      <span className="text-xs text-gray-400">Download</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-3">Lean Canvas Template</h3>
                    <p className="text-gray-300 text-sm mb-4">
                      A one-page business model template that helps you deconstruct your idea into its key assumptions. Perfect for planning and communicating your startup concept.
                    </p>
                    <div className="space-y-2 text-sm text-gray-400 mb-4">
                      <div>• Editable template file</div>
                      <div>• Step-by-step instructions</div>
                      <div>• Real startup examples</div>
                      <div>• Validation tracking sheet</div>
                    </div>
                    <button className="text-blue-400 hover:text-blue-300 font-medium flex items-center space-x-1">
                      <span>Download Template</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Growth Section */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                  <span>Growth & Launch</span>
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-xs font-medium text-purple-400 bg-purple-900 px-2 py-1 rounded-full">
                        Strategy
                      </span>
                      <span className="text-xs text-gray-400">30 min read</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-3">Launch Strategy Playbook</h3>
                    <p className="text-gray-300 text-sm mb-4">
                      A comprehensive guide to launching your startup successfully. From pre-launch preparation to post-launch optimization, cover all the essential steps.
                    </p>
                    <div className="space-y-2 text-sm text-gray-400 mb-4">
                      <div>• Pre-launch checklist</div>
                      <div>• Launch day execution plan</div>
                      <div>• Marketing channel strategies</div>
                      <div>• Metrics tracking setup</div>
                    </div>
                    <button className="text-purple-400 hover:text-purple-300 font-medium flex items-center space-x-1">
                      <span>Read Playbook</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-xs font-medium text-purple-400 bg-purple-900 px-2 py-1 rounded-full">
                        Acquisition
                      </span>
                      <span className="text-xs text-gray-400">20 min read</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-3">First 100 Customers Guide</h3>
                    <p className="text-gray-300 text-sm mb-4">
                      Proven strategies to acquire your first 100 customers without a big marketing budget. Learn from successful founders who've been there.
                    </p>
                    <div className="space-y-2 text-sm text-gray-400 mb-4">
                      <div>• Low-cost acquisition channels</div>
                      <div>• Community building tactics</div>
                      <div>• Referral program setup</div>
                      <div>• Customer retention strategies</div>
                    </div>
                    <button className="text-purple-400 hover:text-purple-300 font-medium flex items-center space-x-1">
                      <span>Read Guide</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Additional Resources */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Additional Resources</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      title: "SaaS Pricing Guide",
                      category: "Revenue",
                      duration: "15 min read",
                      description: "Master SaaS pricing strategies and models",
                      color: "text-yellow-400 bg-yellow-900"
                    },
                    {
                      title: "Fundraising Basics",
                      category: "Finance",
                      duration: "35 min read",
                      description: "Everything you need to know about raising capital",
                      color: "text-red-400 bg-red-900"
                    },
                    {
                      title: "Team Building",
                      category: "Leadership",
                      duration: "18 min read",
                      description: "How to build and manage your founding team",
                      color: "text-indigo-400 bg-indigo-900"
                    },
                  ].map((resource, index) => (
                    <div key={index} className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                      <div className="flex items-start justify-between mb-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${resource.color}`}>
                          {resource.category}
                        </span>
                        <span className="text-xs text-gray-400">{resource.duration}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">{resource.title}</h3>
                      <p className="text-gray-300 text-sm mb-4">{resource.description}</p>
                      <button className="text-blue-400 hover:text-blue-300 font-medium flex items-center space-x-1">
                      <button 
                        onClick={() => setShowValidationChecklist(!showValidationChecklist)}
                        className="text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Collapsible Validation Checklist */}
                    {showValidationChecklist && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-bold text-gray-900">Idea Validation Checklist</h4>
                            <button
                              onClick={() => setShowValidationChecklist(false)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                          <p className="text-gray-600 mb-6">
                            A 10-step guide to ensure your startup idea is worth pursuing.<br />
                            <strong>Time to complete: ~10 minutes</strong>
                          </p>
                          
                          <div className="space-y-6">
                            {/* Step 1 */}
                            <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                              <h5 className="font-bold text-gray-900 mb-2">1. Problem Clarity</h5>
                              <ul className="text-gray-600 space-y-1 mb-3">
                                <li>• Can you clearly explain the problem your startup solves in one sentence?</li>
                                <li>• Is this a real pain point people face regularly?</li>
                              </ul>
                              <div className="bg-green-50 border border-green-200 rounded p-2">
                                <p className="text-green-800 text-sm">✅ If not, talk to 5 people in your target audience today.</p>
                              </div>
                            </div>

                            {/* Step 2 */}
                            <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                              <h5 className="font-bold text-gray-900 mb-2">2. Target Audience</h5>
                              <ul className="text-gray-600 space-y-1 mb-3">
                                <li>• Who experiences this problem? Be specific (e.g. "freelance designers" not "everyone").</li>
                                <li>• Can you define their demographics, behaviors, and needs?</li>
                              </ul>
                              <div className="bg-green-50 border border-green-200 rounded p-2">
                                <p className="text-green-800 text-sm">✅ Use tools like UserPersona.dev or Google Forms for early research.</p>
                              </div>
                            </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const ChatInterface = () => (
    <div className="min-h-screen bg-gray-950">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-gray-900 shadow-sm">
        <div className="p-6 border-b border-gray-800">
          <Logo size="sm" />
        </div>
        
        <nav className="p-4 space-y-2">
          {[
            { icon: Home, label: 'Overview', view: 'dashboard' },
            { icon: MessageSquare, label: 'AI Coach', view: 'chat' },
            { icon: BarChart3, label: 'Analytics', view: 'analytics' },
            { icon: BookOpen, label: 'Resources', view: 'resources' },
            { icon: Settings, label: 'Settings', view: 'dashboard' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.view}
                onClick={() => setCurrentView(item.view as View)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  currentView === item.view 
                    ? 'bg-blue-900 text-blue-400' 
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        
        <div className="absolute bottom-4 left-4 right-4">
          <div className="mb-4 p-3 bg-gray-700 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Logged in as:</div>
            <div className="font-medium text-white">{user?.name}</div>
            <div className="text-sm text-gray-300">{user?.email}</div>
          </div>
          <button 
            onClick={() => setCurrentView('landing')}
            className="w-full text-left text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            ← Back to Landing
          </button>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="ml-64 flex flex-col h-screen">
        {/* Chat Header */}
        <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">AI Startup Coach</h1>
              <p className="text-sm text-green-600">● Ready to help</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {chatMessages.map((message) => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                message.type === 'user' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                  : 'bg-gray-900 shadow-sm border border-gray-800 text-white'
              }`}>
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-900 shadow-sm border border-gray-800 px-4 py-3 rounded-2xl">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="bg-gray-900 border-t border-gray-800 p-4">
          <div className="flex items-center space-x-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Describe your startup idea or ask for guidance..."
              className="flex-1 px-4 py-3 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800 text-white placeholder-gray-400"
              autoComplete="off"
              autoFocus
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            Press Enter to send • {newMessage.length}/500 characters
          </div>
        </div>
      </div>
    </div>
  );

  if (currentView === 'landing') {
    return <LandingPage />;
  }

  if (currentView === 'chat') {
    return <ChatInterface />;
  }

  return <Dashboard />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;