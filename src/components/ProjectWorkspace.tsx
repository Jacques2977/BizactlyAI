import React, { useState } from 'react';
import { X, Home, CheckCircle, Target, Rocket, TrendingUp, BarChart3, Settings, ChevronRight, MessageSquare, Lightbulb } from 'lucide-react';
import { Project } from '../types/project';
import { IdeaValidationSection } from './workspace/IdeaValidationSection';
import { LeanCanvasSection } from './workspace/LeanCanvasSection';
import { MVPPlanSection } from './workspace/MVPPlanSection';
import { LaunchStrategySection } from './workspace/LaunchStrategySection';
import { GrowthStrategySection } from './workspace/GrowthStrategySection';
import { ProjectAnalyticsSection } from './workspace/ProjectAnalyticsSection';
import { ProjectSettingsSection } from './workspace/ProjectSettingsSection';
import { ProjectOverviewSection } from './workspace/ProjectOverviewSection';
import { AIChatSection } from './workspace/AIChatSection';
import { FeedbackInsightsSection } from './workspace/FeedbackInsightsSection';

interface ProjectWorkspaceProps {
  project: Project;
  onClose: () => void;
  onUpdate: (updates: Partial<Project>) => void;
}

type SectionId = 'overview' | 'ai-chat' | 'feedback-insights' | 'idea-validation' | 'lean-canvas' | 'mvp-plan' | 'launch-strategy' | 'growth-strategy' | 'analytics' | 'settings';

interface NavItem {
  id: SectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  completed?: boolean;
}

export function ProjectWorkspace({ project, onClose, onUpdate }: ProjectWorkspaceProps) {
  const [activeSection, setActiveSection] = useState<SectionId>('overview');

  const navItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'ai-chat', label: 'AI Advisor', icon: MessageSquare },
    { id: 'feedback-insights', label: 'AI Insights', icon: Lightbulb },
    {
      id: 'idea-validation',
      label: 'Idea Validation',
      icon: CheckCircle,
      completed: project.milestones_completed?.idea_validation?.completed
    },
    {
      id: 'lean-canvas',
      label: 'Lean Canvas',
      icon: Target,
      completed: project.milestones_completed?.lean_canvas?.completed
    },
    {
      id: 'mvp-plan',
      label: 'MVP Plan',
      icon: Rocket,
      completed: project.milestones_completed?.mvp_plan?.completed
    },
    {
      id: 'launch-strategy',
      label: 'Launch Strategy',
      icon: TrendingUp,
      completed: !!project.launch_strategy_data
    },
    {
      id: 'growth-strategy',
      label: 'Growth Strategy',
      icon: TrendingUp,
      completed: project.milestones_completed?.launch?.completed
    },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return <ProjectOverviewSection project={project} onNavigate={setActiveSection} />;
      case 'ai-chat':
        return <AIChatSection project={project} onUpdate={onUpdate} />;
      case 'feedback-insights':
        return <FeedbackInsightsSection projectId={project.id} />;
      case 'idea-validation':
        return <IdeaValidationSection project={project} onUpdate={onUpdate} />;
      case 'lean-canvas':
        return <LeanCanvasSection project={project} onUpdate={onUpdate} />;
      case 'mvp-plan':
        return <MVPPlanSection project={project} onUpdate={onUpdate} />;
      case 'launch-strategy':
        return <LaunchStrategySection project={project} onUpdate={onUpdate} />;
      case 'growth-strategy':
        return <GrowthStrategySection project={project} onUpdate={onUpdate} />;
      case 'analytics':
        return <ProjectAnalyticsSection project={project} />;
      case 'settings':
        return <ProjectSettingsSection project={project} onUpdate={onUpdate} />;
      default:
        return <ProjectOverviewSection project={project} onNavigate={setActiveSection} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Project Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-white truncate">{project.title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${project.progress_percentage || 0}%` }}
              />
            </div>
            <span className="text-xs text-gray-400">{project.progress_percentage || 0}%</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <div className="flex items-center space-x-1">
                  {item.completed && (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )}
                  {isActive && <ChevronRight className="w-4 h-4" />}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <div className="text-xs text-gray-400">
            Last updated: {new Date(project.updated_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {renderSection()}
      </div>
    </div>
  );
}
