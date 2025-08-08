import React from 'react';
import { CheckCircle, Circle, Target, TrendingUp } from 'lucide-react';
import { UserProgress } from '../types/metrics';

interface ProgressTrackerProps {
  progress: UserProgress;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ progress }) => {
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center">
          <Target className="w-6 h-6 text-blue-500 mr-2" />
          Your SaaS Journey
        </h3>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">${progress.currentMRR.toLocaleString()}</div>
          <div className="text-sm text-gray-400">of ${progress.targetMRR.toLocaleString()} goal</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-300">Progress to Goal</span>
          <span className="text-sm font-medium text-blue-400">{progress.progressPercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progress.progressPercentage, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Next Milestone */}
      <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <TrendingUp className="w-5 h-5 text-blue-400 mr-2" />
          <div>
            <div className="text-sm font-medium text-blue-200">Next Milestone</div>
            <div className="text-blue-100">{progress.nextMilestone}</div>
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-300 mb-3">Milestones</h4>
        {progress.milestones.map((milestone) => (
          <div key={milestone.id} className="flex items-start space-x-3">
            {milestone.completed ? (
              <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
            ) : (
              <Circle className="w-6 h-6 text-gray-500 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <div className={`font-medium ${milestone.completed ? 'text-green-400' : 'text-gray-300'}`}>
                {milestone.title}
              </div>
              <div className="text-sm text-gray-400">{milestone.description}</div>
              <div className="text-xs text-gray-500 mt-1">
                Target: ${milestone.targetMRR.toLocaleString()} MRR
                {milestone.completedDate && (
                  <span className="ml-2 text-green-400">
                    ✓ Completed {new Date(milestone.completedDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};