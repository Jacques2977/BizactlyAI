import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BarChart3, Menu, X, User, LogOut, CheckCircle, ArrowRight, Star, CreditCard as Edit3, TrendingUp, Target, CreditCard, Sparkles, FolderOpen, ChevronLeft, ChevronRight, Trash2, Calendar, AlertCircle, Plus, MessageSquare, BookOpen, Settings, ChevronDown, Clock } from 'lucide-react';
import { Logo } from './components/Logo';
import { AuthModal } from './components/AuthModal';
import { MetricsUpdateModal } from './components/MetricsUpdateModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { BillingDashboard } from './components/BillingDashboard';
import { UsageLimitModal } from './components/UsageLimitModal';
import { ProgressTracker } from './components/ProgressTracker';
import { LeanCanvasBuilder } from './components/LeanCanvasBuilder';
import { ProjectCreationChat } from './components/ProjectCreationChat';
import { ProjectsDashboard } from './components/ProjectsDashboard';
import { ProjectDetails } from './components/ProjectDetails';
import { ConversationalProjectFlow } from './components/ConversationalProjectFlow';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useUserMetrics } from './hooks/useUserMetrics';
import { useSubscription } from './hooks/useSubscription';
import { SubscriptionPlan } from './types/subscription';
import { Project } from './types/project';
import { databaseService } from './services/databaseService';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const NEXT_MILESTONE_MAP: Record<string, string> = {
  idea_validation: 'Idea Validation',
  lean_canvas: 'Lean Canvas',
  mvp_plan: 'MVP Plan',
  launch: 'Launch Strategy',
};

function getNextMilestone(project: Project): string {
  for (const m of ['idea_validation', 'lean_canvas', 'mvp_plan', 'launch']) {
    if (!project.milestones_completed?.[m]?.completed) return NEXT_MILESTONE_MAP[m];
  }
  return 'Complete';
}

function AppContent() {
  const [activeView, setActiveView] = useState<'landing' | 'dashboard'>('landing');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [autoStartProject, setAutoStartProject] = useState(false);
  const [homepageResumeProject, setHomepageResumeProject] = useState<Project | null>(null);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      databaseService.getUserProjects().then(setUserProjects).catch(() => {});
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAuthClick = (mode: 'login' | 'signup', shouldAutoStart = false) => {
    setAuthMode(mode);
    setAutoStartProject(shouldAutoStart);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
  };

  const goToDashboard = (opts?: { createNew?: boolean; resume?: Project }) => {
    setAutoStartProject(opts?.createNew ?? false);
    setHomepageResumeProject(opts?.resume ?? null);
    setActiveView('dashboard');
  };

  if (activeView === 'dashboard' && isAuthenticated) {
    return (
      <DashboardView
        onBack={() => setActiveView('landing')}
        autoStartProject={autoStartProject}
        initialResumeProject={homepageResumeProject}
      />
    );
  }

  const inProgress = userProjects.filter(p => (p.progress_percentage ?? 0) > 0 && (p.progress_percentage ?? 0) < 100);
  const mostRecent = [...userProjects].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 3);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || '';

  return (
    <div className="min-h-screen bg-gray-900">
      {/* ── Navbar ── */}
      <nav className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo size="md" />

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              <a href="#features" className="px-3 py-2 text-sm text-gray-400 hover:text-white rounded-md transition-colors">Features</a>
              <a href="#how-it-works" className="px-3 py-2 text-sm text-gray-400 hover:text-white rounded-md transition-colors">Docs</a>

              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => goToDashboard()}
                    className="px-3 py-2 text-sm text-gray-400 hover:text-white rounded-md transition-colors"
                  >
                    Workspace
                  </button>
                  <button
                    onClick={() => goToDashboard()}
                    className="px-3 py-2 text-sm text-gray-400 hover:text-white rounded-md transition-colors"
                  >
                    Projects
                  </button>
                  {/* Account dropdown */}
                  <div className="relative ml-2" ref={accountMenuRef}>
                    <button
                      onClick={() => setIsAccountMenuOpen(o => !o)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 hover:border-gray-500 transition-colors text-sm"
                    >
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-semibold text-white">
                        {user?.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <span className="text-gray-300 max-w-[100px] truncate">{user?.name}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isAccountMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isAccountMenuOpen && (
                      <div className="absolute right-0 mt-2 w-52 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl shadow-black/40 py-1 z-50">
                        <div className="px-4 py-2.5 border-b border-gray-700">
                          <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                        <button
                          onClick={() => { goToDashboard(); setIsAccountMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700/60 transition-colors"
                        >
                          <Settings className="w-4 h-4" /> Account Settings
                        </button>
                        <button
                          onClick={() => { logout(); setIsAccountMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors"
                        >
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <a href="#pricing" className="px-3 py-2 text-sm text-gray-400 hover:text-white rounded-md transition-colors">Pricing</a>
                  <div className="flex items-center gap-3 ml-2">
                    <button
                      onClick={() => handleAuthClick('login')}
                      className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
                    >
                      Log in
                    </button>
                    <button
                      onClick={() => handleAuthClick('signup')}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                      Get Started Free
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-800 bg-gray-900 px-4 py-3 space-y-1">
            <a href="#features" className="block px-3 py-2 text-sm text-gray-400 hover:text-white rounded-md transition-colors">Features</a>
            <a href="#how-it-works" className="block px-3 py-2 text-sm text-gray-400 hover:text-white rounded-md transition-colors">Docs</a>
            {isAuthenticated ? (
              <>
                <button onClick={() => { goToDashboard(); setIsMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white rounded-md transition-colors">Workspace</button>
                <button onClick={() => { goToDashboard(); setIsMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white rounded-md transition-colors">Projects</button>
                <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 rounded-md transition-colors">Sign Out</button>
              </>
            ) : (
              <>
                <a href="#pricing" className="block px-3 py-2 text-sm text-gray-400 hover:text-white rounded-md transition-colors">Pricing</a>
                <button onClick={() => { handleAuthClick('login'); setIsMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white rounded-md transition-colors">Log in</button>
                <button onClick={() => { handleAuthClick('signup'); setIsMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors">Get Started Free</button>
              </>
            )}
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section id="home" className="relative overflow-hidden bg-gray-900 pt-20 pb-24">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-600/8 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {isAuthenticated ? (
            /* ── Authenticated hero ── */
            <div>
              <p className="text-sm text-blue-400 font-medium mb-2">{greeting}, {firstName}</p>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                {inProgress.length > 0
                  ? <>You have <span className="text-blue-400">{inProgress.length} project{inProgress.length > 1 ? 's' : ''}</span> in progress.</>
                  : userProjects.length > 0
                  ? <>Ready to start your next<br /><span className="text-blue-400">big idea?</span></>
                  : <>Let's build your first<br /><span className="text-blue-400">startup plan.</span></>
                }
              </h1>
              <p className="text-gray-400 mb-8 max-w-lg">
                {userProjects.length === 0
                  ? "Your AI advisor will guide you from idea to launch — one conversation at a time."
                  : "Pick up where you left off or kick off something new."}
              </p>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 mb-12">
                <button
                  onClick={() => goToDashboard({ createNew: true })}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" /> New Project
                </button>
                {inProgress.length > 0 && (
                  <button
                    onClick={() => goToDashboard({ resume: inProgress[0] })}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 text-white font-semibold rounded-lg transition-colors text-sm"
                  >
                    <MessageSquare className="w-4 h-4 text-blue-400" /> Continue "{inProgress[0].title}"
                  </button>
                )}
                <button
                  onClick={() => goToDashboard()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-medium rounded-lg transition-colors text-sm"
                >
                  <FolderOpen className="w-4 h-4" /> All Projects
                </button>
              </div>

              {/* In-progress cards */}
              {inProgress.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">In Progress</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {inProgress.slice(0, 3).map(project => (
                      <button
                        key={project.id}
                        onClick={() => goToDashboard({ resume: project })}
                        className="group bg-gray-800/80 border border-gray-700 hover:border-blue-500/50 rounded-xl p-4 text-left transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/5"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="text-sm font-semibold text-white truncate pr-2 group-hover:text-blue-300 transition-colors">{project.title}</h4>
                          <ArrowRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-blue-400 flex-shrink-0 transition-colors mt-0.5" />
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                            <div className="bg-gradient-to-r from-blue-500 to-teal-500 h-1.5 rounded-full" style={{ width: `${project.progress_percentage ?? 0}%` }} />
                          </div>
                          <span className="text-xs text-blue-400 font-medium">{project.progress_percentage ?? 0}%</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>Next: {getNextMilestone(project)}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(project.updated_at)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent activity (only when no in-progress) */}
              {inProgress.length === 0 && mostRecent.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Recent Projects</p>
                  <div className="bg-gray-800/60 border border-gray-700 rounded-xl divide-y divide-gray-800 max-w-xl">
                    {mostRecent.map(project => (
                      <button
                        key={project.id}
                        onClick={() => goToDashboard({ resume: project })}
                        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-700/50 transition-colors text-left group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
                          {project.progress_percentage === 100
                            ? <CheckCircle className="w-4 h-4 text-green-400" />
                            : <TrendingUp className="w-4 h-4 text-blue-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate group-hover:text-blue-300 transition-colors">{project.title}</p>
                          <p className="text-xs text-gray-500">{project.progress_percentage ?? 0}% complete</p>
                        </div>
                        <span className="text-xs text-gray-600 flex-shrink-0">{timeAgo(project.updated_at)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── Logged-out hero ── */
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-sm text-blue-400 mb-8">
                <Sparkles className="w-4 h-4" />
                AI-guided startup planning
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                Stop Guessing If Your{' '}
                <span className="bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
                  SaaS Idea Will Work
                </span>
              </h1>
              <p className="text-xl text-gray-400 mb-4 max-w-3xl mx-auto">
                Validate, build, and launch with confidence — guided by AI every step of the way
              </p>
              <p className="text-base text-gray-500 mb-10 max-w-2xl mx-auto">
                From idea validation to your first paying customers
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => handleAuthClick('signup', true)}
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20"
                >
                  <Sparkles className="w-5 h-5" />
                  Validate My Idea for Free
                </button>
                <button
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-4 rounded-xl font-semibold text-lg border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white transition-all duration-200"
                >
                  How It Works
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-20 bg-gray-800/50 border-y border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">How It Works</h2>
            <p className="text-gray-400">Three steps to validate and launch your SaaS</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: '1', color: 'blue', title: 'Validate Your Idea', body: 'AI analyzes your market, competitors, and demand to tell you if your idea has real potential.' },
              { num: '2', color: 'teal', title: 'Build Your Business Plan', body: 'Create a lean canvas and MVP roadmap with AI guidance — no MBA required.' },
              { num: '3', color: 'green', title: 'Launch and Get Customers', body: 'Execute your go-to-market strategy and acquire your first paying customers.' },
            ].map((step, i) => (
              <div key={i} className="text-center relative">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-${step.color}-600/20 border border-${step.color}-500/30`}>
                  <span className={`text-xl font-bold text-${step.color}-400`}>{step.num}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{step.body}</p>
                {i < 2 && <ArrowRight className="w-5 h-5 text-gray-700 absolute top-7 -right-3 hidden md:block" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">AI-Guided Milestone System</h2>
            <p className="text-gray-400">A dedicated workspace section for every stage of your startup</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Sparkles, color: 'blue', label: 'Idea Validation', body: 'AI-powered market analysis, competitor research, and demand forecasting.' },
              { icon: Target, color: 'teal', label: 'Lean Canvas', body: 'Build your complete business model canvas with AI guidance.' },
              { icon: FolderOpen, color: 'green', label: 'MVP Planning', body: 'Prioritize features, select tech stack, and create a development timeline.' },
              { icon: ArrowRight, color: 'orange', label: 'Launch Strategy', body: 'Go-to-market tactics to successfully introduce your MVP.' },
            ].map(({ icon: Icon, color, label, body }, i) => (
              <div key={i} className={`bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-${color}-500/40 hover:shadow-lg hover:shadow-${color}-500/5 transition-all duration-200`}>
                <div className={`w-10 h-10 rounded-lg bg-${color}-500/15 flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 text-${color}-400`} />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{label}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing (logged-out only) ── */}
      {!isAuthenticated && (
        <section id="pricing" className="py-20 bg-gray-800/50 border-y border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-white mb-3">Choose Your Plan</h2>
              <p className="text-gray-400">Start free and scale as you grow</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-500 transition-all">
                <div className="text-center mb-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Free Plan</p>
                  <div className="text-4xl font-bold text-white mb-1">$0</div>
                  <p className="text-gray-500 text-sm">Forever free</p>
                </div>
                <ul className="space-y-2 mb-6 text-sm text-gray-400">
                  {['20 AI messages/day', '1 Lean Canvas', '1 Competitor Snapshot', 'Learning resources'].map(f => (
                    <li key={f} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />{f}</li>
                  ))}
                </ul>
                <button onClick={() => handleAuthClick('signup')} className="w-full py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors">Get Started Free</button>
              </div>

              <div className="bg-blue-600 rounded-xl p-6 border-2 border-blue-500 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"><Star className="w-3 h-3" />Most Popular</span>
                </div>
                <div className="text-center mb-5">
                  <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-3">Starter</p>
                  <div className="text-4xl font-bold text-white mb-1">$19</div>
                  <p className="text-blue-200 text-sm">/month</p>
                </div>
                <ul className="space-y-2 mb-6 text-sm text-blue-100">
                  {['Unlimited AI chat', 'Unlimited Lean Canvases', 'MVP roadmap generator', '3 competitor analyses', 'Export projects (PDF)'].map(f => (
                    <li key={f} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />{f}</li>
                  ))}
                </ul>
                <button onClick={() => handleAuthClick('signup')} className="w-full py-2.5 bg-white text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors">Start Free Trial</button>
              </div>

              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-500 transition-all">
                <div className="text-center mb-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Pro Plan</p>
                  <div className="text-4xl font-bold text-white mb-1">$49</div>
                  <p className="text-gray-500 text-sm">/month</p>
                </div>
                <ul className="space-y-2 mb-6 text-sm text-gray-400">
                  {['Everything in Starter', '10 competitor tracking', 'Financial model generator', 'Marketing playbooks', 'Team collaboration (2)'].map(f => (
                    <li key={f} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />{f}</li>
                  ))}
                </ul>
                <button onClick={() => handleAuthClick('signup')} className="w-full py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors">Start Free Trial</button>
              </div>

              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-500 transition-all">
                <div className="text-center mb-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Enterprise</p>
                  <div className="text-4xl font-bold text-white mb-1">$99</div>
                  <p className="text-gray-500 text-sm">/month</p>
                </div>
                <ul className="space-y-2 mb-6 text-sm text-gray-400">
                  {['Everything in Pro', 'White-label reports', 'Unlimited competitors', 'Pitch deck generator', 'API access'].map(f => (
                    <li key={f} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />{f}</li>
                  ))}
                </ul>
                <button onClick={() => handleAuthClick('signup')} className="w-full py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors">Contact Sales</button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Testimonial ── */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center gap-1 mb-5">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />)}
          </div>
          <blockquote className="text-xl text-white font-medium mb-4">
            "BizactlyAI helped me go from idea to launch in 3 months. The AI guidance and structured approach made everything clear."
          </blockquote>
          <cite className="text-gray-500 text-sm not-italic">Sarah Chen — Founder, TaskFlow SaaS</cite>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 bg-gradient-to-r from-blue-700 to-teal-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {isAuthenticated ? (
            <>
              <h2 className="text-3xl font-bold text-white mb-3">Keep building, {firstName}.</h2>
              <p className="text-blue-100 mb-8">Your next milestone is waiting — pick up where you left off.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {inProgress[0] && (
                  <button
                    onClick={() => goToDashboard({ resume: inProgress[0] })}
                    className="flex items-center justify-center gap-2 bg-white text-blue-700 px-7 py-3.5 rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    <MessageSquare className="w-4 h-4" /> Continue "{inProgress[0].title}"
                  </button>
                )}
                <button
                  onClick={() => goToDashboard({ createNew: true })}
                  className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white px-7 py-3.5 rounded-xl font-semibold transition-all"
                >
                  <Plus className="w-4 h-4" /> New Project
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-white mb-3">Stop Wasting Time on Ideas That Won't Work</h2>
              <p className="text-blue-100 mb-8">Join 500+ founders who validated their ideas and launched successfully.</p>
              <button
                onClick={() => handleAuthClick('signup', true)}
                className="bg-white text-blue-700 px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-lg hover:shadow-white/20 transition-all"
              >
                Validate My Idea for Free
              </button>
            </>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-black border-t border-gray-800 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo size="md" />
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">Contact</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
          </div>
          <p className="text-sm text-gray-600">&copy; 2025 Bizactly.AI. All rights reserved.</p>
        </div>
      </footer>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}

function DashboardView({ onBack, autoStartProject = false, initialResumeProject = null }: { onBack: () => void; autoStartProject?: boolean; initialResumeProject?: Project | null }) {
  const [activeView, setActiveView] = useState<'overview' | 'analytics' | 'billing' | 'lean-canvas' | 'projects' | 'create-project'>(
    autoStartProject || initialResumeProject ? 'create-project' : 'overview'
  );
  const [isMetricsModalOpen, setIsMetricsModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [resumeProject, setResumeProject] = useState<Project | null>(initialResumeProject);
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

  const loadProjects = useCallback(async () => {
    if (!user) return;
    try {
      const data = await databaseService.getUserProjects(user.id);
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  }, [user]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const navigation = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'projects', label: 'My Projects', icon: FolderOpen },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'billing', label: 'Billing', icon: CreditCard },
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

  const handleProjectCreated = async (projectData: Project) => {
    // If already auto-saved, just navigate — no need to re-create
    if (projectData.id) {
      await loadProjects();
      setResumeProject(null);
      setActiveView('projects');
      return;
    }
    const saved = await databaseService.createProject(projectData);
    if (!saved) {
      alert('Failed to save your project. Please make sure you are logged in and try again.');
      return;
    }
    await loadProjects();
    setResumeProject(null);
    setActiveView('projects');
  };

  const handleProjectSavedFromChat = async (project: Project) => {
    await loadProjects();
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      const success = await databaseService.deleteProject(projectId);
      if (success) {
        setProjects(prev => prev.filter(p => p.id !== projectId));
      }
    }
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
  };

  const handleCloseProjectDetails = () => {
    setSelectedProject(null);
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
        {activeView === 'projects' && (
          <ProjectsDashboard
            onCreateNew={() => {
              if (handleFeatureAccess('projects', 'Project Creation')) {
                setResumeProject(null);
                setActiveView('create-project');
              }
            }}
            onViewProject={handleViewProject}
            onContinueChat={project => { setResumeProject(project); setActiveView('create-project'); }}
          />
        )}

        {activeView === 'create-project' && (
          <div className="flex gap-0 h-[calc(100vh-8rem)] -mx-4 sm:-mx-6 lg:-mx-8">
            {/* Projects Sidebar */}
            <div
              className={`bg-gray-800 border-r border-gray-700 flex flex-col transition-all duration-300 ease-in-out ${
                sidebarCollapsed ? 'w-12' : 'w-80'
              } flex-shrink-0`}
            >
              {/* Sidebar Toggle */}
              <button
                onClick={() => setSidebarCollapsed(c => !c)}
                className="flex items-center justify-center h-10 border-b border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
              >
                {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>

              {!sidebarCollapsed && (
                <>
                  {/* Sidebar Header */}
                  <div className="p-4 border-b border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">My Projects</h3>
                      <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">{projects.length}</span>
                    </div>
                  </div>

                  {/* Projects List */}
                  <div className="flex-1 overflow-y-auto">
                    {projects.length === 0 ? (
                      <div className="p-4 text-center">
                        <FolderOpen className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No projects yet</p>
                        <p className="text-xs text-gray-600 mt-1">Your saved projects will appear here</p>
                      </div>
                    ) : (
                      <div className="p-2 space-y-1">
                        {projects.map((project) => (
                          <div
                            key={project.id}
                            className="group bg-gray-750 hover:bg-gray-700/60 rounded-lg p-3 transition-colors cursor-pointer border border-transparent hover:border-gray-600"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0" onClick={() => { setResumeProject(project); setActiveView('create-project'); }}>
                                <h4 className="text-sm font-medium text-white truncate">{project.title}</h4>
                                <p className="text-xs text-gray-400 mt-0.5 truncate">{project.description || 'No description'}</p>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }}
                                className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-1 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Progress bar */}
                            {project.progress_percentage !== undefined && (
                              <div className="mt-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[10px] text-gray-500">Progress</span>
                                  <span className="text-[10px] text-blue-400 font-medium">{project.progress_percentage}%</span>
                                </div>
                                <div className="w-full bg-gray-600 rounded-full h-1">
                                  <div
                                    className="bg-gradient-to-r from-blue-500 to-green-500 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${project.progress_percentage}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Status + Date */}
                            <div className="flex items-center justify-between mt-2">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                project.status === 'planning' ? 'bg-yellow-500/20 text-yellow-400' :
                                project.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-green-500/20 text-green-400'
                              }`}>
                                {project.status?.replace('_', ' ')}
                              </span>
                              <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                <Calendar className="w-2.5 h-2.5" />
                                {new Date(project.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Conversation Flow */}
            <div className="flex-1 min-w-0">
              <ConversationalProjectFlow
                key={resumeProject?.id ?? 'new'}
                onClose={() => { setActiveView('projects'); setResumeProject(null); }}
                onComplete={handleProjectCreated}
                onProjectSaved={handleProjectSavedFromChat}
                initialProject={resumeProject}
              />
            </div>
          </div>
        )}


        {activeView === 'lean-canvas' && (
          <div className="h-[600px] bg-gray-800 rounded-lg shadow-lg border border-gray-700">
            <LeanCanvasBuilder
              onClose={() => setActiveView('overview')}
              onFeatureUse={() => handleFeatureAccess('tools', 'Lean Canvas Tools')}
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
                Join 500+ SaaS founders who've launched successfully with Bizactly.AI
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300">
                <Sparkles className="w-8 h-8 text-purple-500 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">AI Project Creator</h3>
                <p className="text-gray-300 mb-4">Create full-stack projects with AI guidance from idea to implementation.</p>
                <button
                  onClick={() => {
                    if (handleFeatureAccess('projects', 'Project Creation')) {
                      setResumeProject(null);
                      setActiveView('create-project');
                    }
                  }}
                  className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                >
                  Create Project →
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

              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-300">
                <FolderOpen className="w-8 h-8 text-pink-500 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">My Projects</h3>
                <p className="text-gray-300 mb-4">View and manage all your AI-created projects in one place.</p>
                <button
                  onClick={() => setActiveView('projects')}
                  className="text-pink-400 hover:text-pink-300 font-medium transition-colors"
                >
                  View Projects →
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

              </div>
            </div>

            {/* Stats Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-lg p-8 text-white shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-3xl font-bold mb-2">500+</div>
                  <div className="text-blue-100">SaaS Projects Launched</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2">1,200+</div>
                  <div className="text-blue-100">Lean Canvases Created</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2">3 months</div>
                  <div className="text-blue-100">Avg. Time to Launch</div>
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
                  <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 relative">
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-1 text-xs font-medium text-gray-400 bg-gray-700 rounded-full">Coming Soon</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Monthly Recurring Revenue</p>
                        <p className="text-2xl font-bold text-gray-500">$0</p>
                      </div>
                      <div className="text-gray-600">
                        <BarChart3 className="w-8 h-8" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Track revenue in future updates
                    </p>
                  </div>

                  <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Active Projects</p>
                        <p className="text-2xl font-bold text-white">{projects?.length || '0'}</p>
                      </div>
                      <div className="text-blue-500">
                        <FolderOpen className="w-8 h-8" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {projects?.length ? 'Building your ideas' : 'Start your first project'}
                    </p>
                  </div>

                  <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 relative">
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-1 text-xs font-medium text-gray-400 bg-gray-700 rounded-full">Coming Soon</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Churn Rate</p>
                        <p className="text-2xl font-bold text-gray-500">0%</p>
                      </div>
                      <div className="text-gray-600">
                        <TrendingUp className="w-8 h-8" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Track retention in future updates
                    </p>
                  </div>

                  <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 relative">
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-1 text-xs font-medium text-gray-400 bg-gray-700 rounded-full">Coming Soon</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Customer LTV</p>
                        <p className="text-2xl font-bold text-gray-500">$0</p>
                      </div>
                      <div className="text-gray-600">
                        <BarChart3 className="w-8 h-8" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Track LTV in future updates
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Insights Section */}
            <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Project Insights & Recommendations</h3>
              <div className="space-y-4">
                {!projects || projects.length === 0 ? (
                  <div className="flex items-start space-x-3 bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <span className="text-sm text-blue-200 font-medium">Getting Started</span>
                      <p className="text-sm text-blue-100 mt-1">Create your first project to start validating your idea and building your MVP with AI-guided assistance.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start space-x-3 bg-green-900/30 border border-green-700/50 rounded-lg p-4">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <span className="text-sm text-green-200 font-medium">Building Momentum</span>
                        <p className="text-sm text-green-100 mt-1">You have {projects.length} active {projects.length === 1 ? 'project' : 'projects'}. Focus on completing idea validation and lean canvas for each.</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <span className="text-sm text-blue-200 font-medium">Next Steps</span>
                        <p className="text-sm text-blue-100 mt-1">Use the project workspace to develop your MVP plan and prepare your launch strategy.</p>
                      </div>
                    </div>
                  </>
                )}
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

      {/* Project Details Modal */}
      {selectedProject && (
        <ProjectDetails
          project={selectedProject}
          onClose={handleCloseProjectDetails}
        />
      )}
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