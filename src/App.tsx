import React, { useState } from 'react';
import { sendMessageToAI, type ChatMessage } from './api/chat';
import { 
  Brain, 
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
  Zap
} from 'lucide-react';

type View = 'landing' | 'dashboard' | 'chat' | 'analytics' | 'resources';

interface ChatMessageState extends ChatMessage {
  isLoading?: boolean;
}

function App() {
  const [currentView, setCurrentView] = useState<View>('landing');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessageState[]>([
    { id: 1, type: 'ai', content: "Hello! I'm your AI startup coach. I'm here to help you validate your idea, plan your MVP, and launch with confidence. What's your startup idea?" },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    const userMessage: ChatMessageState = { id: Date.now(), type: 'user', content: newMessage };
    setChatMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);
    
    try {
      // Get AI response
      const aiResponseContent = await sendMessageToAI(newMessage, chatMessages);
      
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
        content: 'I apologize, but I encountered an error. Please try again.'
      };
      setChatMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const LandingPage = () => (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                BizactlyAI
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-gray-700 hover:text-cyan-600 transition-colors font-medium">Home</a>
              <a href="#features" className="text-gray-700 hover:text-cyan-600 transition-colors font-medium">Features</a>
              <a href="#how-it-works" className="text-gray-700 hover:text-cyan-600 transition-colors font-medium">How It Works</a>
              <button className="text-gray-700 hover:text-cyan-600 transition-colors font-medium">Login</button>
              <button 
                onClick={() => setCurrentView('dashboard')}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 font-medium"
              >
                Try It Free
              </button>
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
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-2 space-y-2">
              <a href="#home" className="block py-2 text-gray-700">Home</a>
              <a href="#features" className="block py-2 text-gray-700">Features</a>
              <a href="#how-it-works" className="block py-2 text-gray-700">How It Works</a>
              <button className="block py-2 text-gray-700 text-left w-full">Login</button>
              <button 
                onClick={() => setCurrentView('dashboard')}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-2 rounded-lg mt-2"
              >
                Try It Free
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-cyan-50">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            AI Startup Coach for{' '}
            <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
              First-Time Founders
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Validate your idea, plan your MVP, and launch fast — all with AI guidance tailored for first-time entrepreneurs.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={() => setCurrentView('dashboard')}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center space-x-2"
            >
              <span>Try It Free</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="text-cyan-600 border-2 border-cyan-200 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-cyan-50 transition-all duration-300 flex items-center space-x-2">
              <Play className="w-5 h-5" />
              <span>How It Works</span>
            </button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Three simple steps to turn your idea into reality</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lightbulb className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Describe your idea</h3>
              <p className="text-gray-600">Tell our AI about your startup concept, target market, and goals. No business plan required.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">2. Get AI-guided MVP plan</h3>
              <p className="text-gray-600">Receive a customized roadmap with features to build, validation steps, and launch strategy.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3. Launch with confidence</h3>
              <p className="text-gray-600">Execute your plan with ongoing AI support, tracking progress and adapting as you learn.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Features</h2>
            <p className="text-xl text-gray-600">Everything you need to validate and launch your startup</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center space-x-4 mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <h3 className="text-xl font-semibold text-gray-900">Idea Validator</h3>
              </div>
              <p className="text-gray-600">Get instant feedback on your startup idea with market analysis, competition research, and viability assessment.</p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center space-x-4 mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <h3 className="text-xl font-semibold text-gray-900">MVP Feature Builder</h3>
              </div>
              <p className="text-gray-600">AI-powered feature prioritization to help you build the right MVP with the minimum viable features.</p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center space-x-4 mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <h3 className="text-xl font-semibold text-gray-900">Lean Canvas Generator</h3>
              </div>
              <p className="text-gray-600">Automatically generate a comprehensive lean canvas based on your idea and market research.</p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center space-x-4 mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <h3 className="text-xl font-semibold text-gray-900">Launch Strategy Planner</h3>
              </div>
              <p className="text-gray-600">Get a step-by-step launch plan with marketing strategies, pricing recommendations, and growth tactics.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-16">What Founders Say</h2>
          
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-8 rounded-2xl">
            <blockquote className="text-2xl text-gray-800 mb-6 italic">
              "This tool helped me turn an idea into a product in just 6 weeks. The AI guidance was like having an experienced cofounder by my side."
            </blockquote>
            <div className="text-gray-600 font-medium">— Sarah Chen, Early User</div>
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-cyan-500 to-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to build your SaaS?</h2>
          <p className="text-xl text-cyan-100 mb-8">Join hundreds of founders who've validated and launched with AI guidance</p>
          <button 
            onClick={() => setCurrentView('dashboard')}
            className="bg-white text-cyan-600 px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            Start Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold">BizactlyAI</span>
            </div>
            <div className="flex space-x-8 text-gray-400">
              <a href="#contact" className="hover:text-white transition-colors">Contact</a>
              <a href="#terms" className="hover:text-white transition-colors">Terms</a>
              <a href="#privacy" className="hover:text-white transition-colors">Privacy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );

  const Dashboard = () => (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-sm">
        <div className="p-6 border-b">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold">BizactlyAI</span>
          </div>
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
                    ? 'bg-cyan-50 text-cyan-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        
        <div className="absolute bottom-4 left-4 right-4">
          <button 
            onClick={() => setCurrentView('landing')}
            className="w-full text-left text-sm text-gray-500 hover:text-gray-700 transition-colors"
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, Founder!</h1>
              <p className="text-gray-600">Let's continue building your startup with AI guidance</p>
            </div>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { label: 'Validate New Idea', icon: Lightbulb, color: 'from-green-500 to-emerald-600' },
                { label: 'Build MVP Plan', icon: FileText, color: 'from-blue-500 to-cyan-600' },
                { label: 'Generate Canvas', icon: Target, color: 'from-purple-500 to-indigo-600' },
                { label: 'Plan Launch', icon: Rocket, color: 'from-orange-500 to-red-600' },
              ].map((action, index) => {
                const Icon = action.icon;
                return (
                  <button key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 text-left group">
                    <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-lg font-semibold text-gray-900">{action.label}</div>
                  </button>
                );
              })}
            </div>
            
            {/* Progress Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Startup Journey</h2>
              <div className="space-y-4">
                {[
                  { step: "Idea Validation", status: "completed", progress: 100 },
                  { step: "MVP Planning", status: "in-progress", progress: 60 },
                  { step: "Feature Development", status: "pending", progress: 0 },
                  { step: "Launch Preparation", status: "pending", progress: 0 },
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      item.status === 'completed' ? 'bg-green-100 text-green-600' :
                      item.status === 'in-progress' ? 'bg-cyan-100 text-cyan-600' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {item.status === 'completed' ? <CheckCircle className="w-5 h-5" /> : index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-gray-900">{item.step}</span>
                        <span className="text-sm text-gray-500">{item.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentView === 'analytics' && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Startup Analytics</h1>
              <p className="text-gray-600">Track your progress and key metrics</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Validation Score</h3>
                <div className="h-64 bg-gradient-to-r from-cyan-100 to-blue-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-cyan-600 mb-2">85%</div>
                    <div className="text-gray-600">Market Validation</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">MVP Progress</h3>
                <div className="h-64 bg-gradient-to-r from-blue-100 to-green-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">60%</div>
                    <div className="text-gray-600">Features Complete</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'resources' && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Startup Resources</h1>
              <p className="text-gray-600">Curated resources for first-time founders</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: "Idea Validation Checklist", category: "Validation", duration: "10 min read" },
                { title: "MVP Development Guide", category: "Product", duration: "25 min read" },
                { title: "Lean Canvas Template", category: "Planning", duration: "Template" },
                { title: "Launch Strategy Playbook", category: "Launch", duration: "30 min read" },
                { title: "First Customer Acquisition", category: "Growth", duration: "20 min read" },
                { title: "Pricing Your SaaS", category: "Revenue", duration: "15 min read" },
              ].map((resource, index) => (
                <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-medium text-cyan-600 bg-cyan-100 px-2 py-1 rounded-full">
                      {resource.category}
                    </span>
                    <span className="text-xs text-gray-500">{resource.duration}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{resource.title}</h3>
                  <button className="text-cyan-600 hover:text-cyan-700 font-medium flex items-center space-x-1">
                    <span>View Resource</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const ChatInterface = () => (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-sm">
        <div className="p-6 border-b">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold">BizactlyAI</span>
          </div>
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
                    ? 'bg-cyan-50 text-cyan-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        
        <div className="absolute bottom-4 left-4 right-4">
          <button 
            onClick={() => setCurrentView('landing')}
            className="w-full text-left text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back to Landing
          </button>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="ml-64 flex flex-col h-screen">
        {/* Chat Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">AI Startup Coach</h1>
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
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white' 
                  : 'bg-white shadow-sm border border-gray-100'
              }`}>
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white shadow-sm border border-gray-100 px-4 py-3 rounded-2xl">
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
        <div className="bg-white border-t p-4">
          <div className="flex items-center space-x-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Describe your startup idea or ask for guidance..."
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
            <button
              onClick={handleSendMessage}
              disabled={isTyping}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-3 rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTyping ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
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

export default App;