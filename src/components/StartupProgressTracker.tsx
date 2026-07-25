import React from 'react';
import { CheckCircle, Circle, Lightbulb, Search, FileText, Rocket, TrendingUp } from 'lucide-react';
import { Project, Milestone, MilestoneType } from '../types/project';

interface StartupProgressTrackerProps {
  project: Project;
  onMilestoneClick?: (milestone: MilestoneType) => void;
  onCompleteClick?: (milestone: MilestoneType) => void;
}

const MILESTONES: Milestone[] = [
  {
    id: 'idea_validation',
    title: 'Idea Validation',
    description: 'Define your startup idea, problem, and value proposition',
    icon: 'lightbulb',
    color: 'yellow',
    suggestedActions: [
      'Define clear problem statement',
      'Identify target users',
      'Articulate value proposition',
      'Define business model'
    ]
  },
  {
    id: 'market_research',
    title: 'Market Research',
    description: 'Research your target market and competition',
    icon: 'search',
    color: 'blue',
    suggestedActions: [
      'Analyze competitor landscape',
      'Research target market size',
      'Identify user pain points',
      'Define competitive advantage'
    ]
  },
  {
    id: 'lean_canvas',
    title: 'Lean Canvas',
    description: 'Complete your business model canvas',
    icon: 'file',
    color: 'purple',
    suggestedActions: [
      'Map customer segments',
      'Define key metrics',
      'Identify channels',
      'Calculate cost structure'
    ]
  },
  {
    id: 'mvp_plan',
    title: 'MVP Plan',
    description: 'Plan your MVP features and development roadmap',
    icon: 'rocket',
    color: 'orange',
    suggestedActions: [
      'Prioritize MVP features',
      'Choose tech stack',
      'Estimate development timeline',
      'Plan feature releases'
    ]
  },
  {
    id: 'launch',
    title: 'Launch',
    description: 'Execute your go-to-market strategy',
    icon: 'trending',
    color: 'green',
    suggestedActions: [
      'Create launch roadmap',
      'Build marketing materials',
      'Set up analytics',
      'Execute launch plan'
    ]
  }
];

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'lightbulb':
      return Lightbulb;
    case 'search':
      return Search;
    case 'file':
      return FileText;
    case 'rocket':
      return Rocket;
    case 'trending':
      return TrendingUp;
    default:
      return Circle;
  }
};

const getColorClasses = (color: string, isCompleted: boolean, isCurrent: boolean) => {
  if (isCompleted) {
    return {
      bg: 'bg-green-500',
      text: 'text-green-400',
      border: 'border-green-500',
      ring: 'ring-green-500/20'
    };
  }

  if (isCurrent) {
    const colors = {
      yellow: { bg: 'bg-yellow-500', text: 'text-yellow-400', border: 'border-yellow-500', ring: 'ring-yellow-500/20' },
      blue: { bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500', ring: 'ring-blue-500/20' },
      purple: { bg: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500', ring: 'ring-purple-500/20' },
      orange: { bg: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500', ring: 'ring-orange-500/20' },
      green: { bg: 'bg-green-500', text: 'text-green-400', border: 'border-green-500', ring: 'ring-green-500/20' }
    };
    return colors[color as keyof typeof colors] || colors.blue;
  }

  return {
    bg: 'bg-gray-600',
    text: 'text-gray-400',
    border: 'border-gray-600',
    ring: 'ring-gray-600/20'
  };
};

export const StartupProgressTracker: React.FC<StartupProgressTrackerProps> = ({
  project,
  onMilestoneClick,
  onCompleteClick
}) => {
  const currentMilestone = project.current_milestone || 'idea_validation';
  const milestonesCompleted = project.milestones_completed || {
    idea_validation: { completed: false },
    market_research: { completed: false },
    lean_canvas: { completed: false },
    mvp_plan: { completed: false },
    launch: { completed: false }
  };

  const progressPercentage = project.progress_percentage || 0;

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Startup Journey Progress</h3>
          <span className="text-2xl font-bold text-blue-400">{progressPercentage}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Milestone Timeline */}
      <div className="relative">
        {MILESTONES.map((milestone, index) => {
          const isCompleted = milestonesCompleted[milestone.id]?.completed || false;
          const isCurrent = currentMilestone === milestone.id;
          const Icon = getIconComponent(milestone.icon);
          const colors = getColorClasses(milestone.color, isCompleted, isCurrent);
          const isLast = index === MILESTONES.length - 1;

          return (
            <div key={milestone.id} className="relative pb-8">
              {/* Connecting Line */}
              {!isLast && (
                <div
                  className={`absolute left-6 top-12 w-0.5 h-full ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-700'
                  }`}
                />
              )}

              {/* Milestone Card */}
              <div
                className={`bg-gray-800 rounded-lg border ${
                  isCurrent ? `${colors.border} ring-4 ${colors.ring}` : 'border-gray-700'
                } hover:shadow-lg transition-all duration-300 cursor-pointer`}
                onClick={() => onMilestoneClick && onMilestoneClick(milestone.id)}
              >
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-full ${colors.bg} flex items-center justify-center`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6 text-white" />
                      ) : (
                        <Icon className="w-6 h-6 text-white" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className={`text-lg font-semibold ${colors.text}`}>
                            {milestone.title}
                          </h4>
                          <p className="text-sm text-gray-400 mt-1">{milestone.description}</p>
                        </div>
                        {isCompleted && (
                          <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium border border-green-500/30">
                            Completed
                          </span>
                        )}
                        {isCurrent && !isCompleted && (
                          <span className={`${colors.bg}/20 ${colors.text} px-3 py-1 rounded-full text-sm font-medium border ${colors.border}/30`}>
                            Current
                          </span>
                        )}
                      </div>

                      {/* Completion Date */}
                      {isCompleted && milestonesCompleted[milestone.id]?.completedAt && (
                        <p className="text-xs text-gray-500 mb-3">
                          Completed on {new Date(milestonesCompleted[milestone.id].completedAt!).toLocaleDateString()}
                        </p>
                      )}

                      {/* Suggested Actions */}
                      {isCurrent && !isCompleted && (
                        <div className="mt-4 space-y-2">
                          <p className="text-sm font-medium text-gray-300">Next Actions:</p>
                          <ul className="space-y-1">
                            {milestone.suggestedActions.map((action, i) => (
                              <li key={i} className="text-sm text-gray-400 flex items-start space-x-2">
                                <span className={`${colors.text} mt-1`}>•</span>
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                          {onCompleteClick && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onCompleteClick(milestone.id);
                              }}
                              className={`mt-4 ${colors.bg} text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-colors`}
                            >
                              Mark as Complete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
