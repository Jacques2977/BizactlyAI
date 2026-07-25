import React from 'react';
import { BarChart3, TrendingUp, Target } from 'lucide-react';
import { Project } from '../../types/project';

interface ProjectAnalyticsSectionProps {
  project: Project;
}

export function ProjectAnalyticsSection({ project }: ProjectAnalyticsSectionProps) {
  const completedMilestones = Object.values(project.milestones_completed || {}).filter(
    (m: any) => m.completed
  ).length;

  const totalMilestones = 5;

  return (
    <div className="p-8 bg-gray-900">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Project Analytics</h2>
          <p className="text-gray-300">Track your progress and key metrics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{project.progress_percentage || 0}%</div>
            <div className="text-sm text-gray-400">Overall Progress</div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{completedMilestones}/{totalMilestones}</div>
            <div className="text-sm text-gray-400">Milestones</div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
            <div className="text-3xl font-bold text-white mb-1 capitalize">{project.status}</div>
            <div className="text-sm text-gray-400">Status</div>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Milestone Timeline</h3>
          <div className="space-y-4">
            {Object.entries(project.milestones_completed || {}).map(([key, value]: [string, any]) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {value.completed ? (
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  ) : (
                    <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                  )}
                  <span className="text-white capitalize">{key.replace(/_/g, ' ')}</span>
                </div>
                <span className="text-sm text-gray-400">
                  {value.completed && value.completedAt
                    ? new Date(value.completedAt).toLocaleDateString()
                    : 'Not started'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Project Timeline</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-300">
              <span>Created:</span>
              <span>{new Date(project.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Last Updated:</span>
              <span>{new Date(project.updated_at).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Days Active:</span>
              <span>
                {Math.floor(
                  (new Date().getTime() - new Date(project.created_at).getTime()) / (1000 * 60 * 60 * 24)
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
