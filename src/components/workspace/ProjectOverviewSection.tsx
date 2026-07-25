import React from 'react';
import { CheckCircle, Clock, AlertCircle, Target, Rocket, TrendingUp } from 'lucide-react';
import { Project } from '../../types/project';

interface ProjectOverviewSectionProps {
  project: Project;
  onNavigate: (section: string) => void;
}

export function ProjectOverviewSection({ project, onNavigate }: ProjectOverviewSectionProps) {
  const milestones = [
    {
      id: 'idea_validation',
      title: 'Idea Validation',
      description: 'Validate your startup idea with market research',
      completed: project.milestones_completed?.idea_validation?.completed,
      section: 'idea-validation'
    },
    {
      id: 'lean_canvas',
      title: 'Lean Canvas',
      description: 'Complete business model canvas',
      completed: project.milestones_completed?.lean_canvas?.completed,
      section: 'lean-canvas'
    },
    {
      id: 'mvp_plan',
      title: 'MVP Plan',
      description: 'Plan your minimum viable product',
      completed: project.milestones_completed?.mvp_plan?.completed,
      section: 'mvp-plan'
    },
    {
      id: 'launch_strategy',
      title: 'Launch Strategy',
      description: 'Create go-to-market plan',
      completed: !!project.launch_strategy_data,
      section: 'launch-strategy'
    },
    {
      id: 'growth_strategy',
      title: 'Growth Strategy',
      description: 'Plan for scaling to $10K MRR',
      completed: project.milestones_completed?.launch?.completed,
      section: 'growth-strategy'
    },
  ];

  const completedCount = milestones.filter(m => m.completed).length;
  const nextMilestone = milestones.find(m => !m.completed);

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{project.title}</h1>
          <p className="text-gray-300">{project.description}</p>
        </div>

        {/* Progress Overview */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-lg p-6 text-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm opacity-90 mb-1">Overall Progress</div>
              <div className="text-3xl font-bold">{project.progress_percentage || 0}%</div>
            </div>
            <div>
              <div className="text-sm opacity-90 mb-1">Milestones Completed</div>
              <div className="text-3xl font-bold">{completedCount} / {milestones.length}</div>
            </div>
            <div>
              <div className="text-sm opacity-90 mb-1">Current Stage</div>
              <div className="text-lg font-semibold capitalize">
                {project.current_milestone?.replace(/_/g, ' ') || 'Getting Started'}
              </div>
            </div>
          </div>
        </div>

        {/* Next Action */}
        {nextMilestone && (
          <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-6">
            <div className="flex items-start space-x-4">
              <div className="bg-blue-600 rounded-full p-2">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">Next Step</h3>
                <p className="text-blue-200 mb-3">{nextMilestone.title} - {nextMilestone.description}</p>
                <button
                  onClick={() => onNavigate(nextMilestone.section)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Continue →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Milestones Grid */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Project Milestones</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {milestones.map((milestone) => (
              <button
                key={milestone.id}
                onClick={() => onNavigate(milestone.section)}
                className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-left hover:border-blue-500 transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {milestone.completed ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <Clock className="w-6 h-6 text-gray-400" />
                    )}
                    <h3 className="text-lg font-semibold text-white">{milestone.title}</h3>
                  </div>
                </div>
                <p className="text-gray-300 text-sm mb-3">{milestone.description}</p>
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded ${
                    milestone.completed
                      ? 'bg-green-900/30 text-green-400'
                      : 'bg-gray-700 text-gray-400'
                  }`}>
                    {milestone.completed ? 'Completed' : 'Not Started'}
                  </span>
                  <span className="text-blue-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    View →
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Project Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Created</div>
              <div className="text-white font-medium">
                {new Date(project.created_at).toLocaleDateString()}
              </div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Category</div>
              <div className="text-white font-medium capitalize">{project.category || 'N/A'}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Status</div>
              <div className="text-white font-medium capitalize">{project.status || 'Planning'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
