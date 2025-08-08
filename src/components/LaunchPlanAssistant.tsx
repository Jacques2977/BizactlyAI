import React, { useState } from 'react';
import { Rocket, Calendar, CheckCircle, Clock, AlertTriangle, Target } from 'lucide-react';
import { generateLaunchPlan, LaunchPlan, LaunchTask } from '../api/launchPlanAssistant';

interface LaunchPlanAssistantProps {
  onClose: () => void;
}

export const LaunchPlanAssistant: React.FC<LaunchPlanAssistantProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    productDescription: '',
    targetMarket: '',
    launchTimeline: '',
    budget: '',
  });
  const [launchPlan, setLaunchPlan] = useState<LaunchPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const plan = await generateLaunchPlan(
        formData.productDescription,
        formData.targetMarket,
        formData.launchTimeline,
        formData.budget
      );
      setLaunchPlan(plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate launch plan');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTaskCompletion = (taskId: string) => {
    const newCompleted = new Set(completedTasks);
    if (newCompleted.has(taskId)) {
      newCompleted.delete(taskId);
    } else {
      newCompleted.add(taskId);
    }
    setCompletedTasks(newCompleted);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'product': return 'bg-blue-100 text-blue-800';
      case 'marketing': return 'bg-green-100 text-green-800';
      case 'sales': return 'bg-purple-100 text-purple-800';
      case 'operations': return 'bg-orange-100 text-orange-800';
      case 'legal': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'low': return <Target className="w-4 h-4 text-green-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const TaskCard: React.FC<{ task: LaunchTask }> = ({ task }) => (
    <div className={`border rounded-lg p-4 transition-all ${
      completedTasks.has(task.id) 
        ? 'bg-green-900/30 border-green-700/50' 
        : 'bg-gray-700/30 border-gray-600 hover:shadow-sm'
    }`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start space-x-3 flex-1">
          <button
            onClick={() => toggleTaskCompletion(task.id)}
            className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              completedTasks.has(task.id)
                ? 'bg-green-500 border-green-500'
                : 'border-gray-300 hover:border-green-500'
            }`}
          >
            {completedTasks.has(task.id) && (
              <CheckCircle className="w-3 h-3 text-white" />
            )}
          </button>
          <div className="flex-1">
            <h5 className={`font-semibold ${
              completedTasks.has(task.id) ? 'text-green-800 line-through' : 'text-gray-900'
              completedTasks.has(task.id) ? 'text-green-400 line-through' : 'text-white'
            }`}>
              {task.title}
            </h5>
            <p className={`text-sm mt-1 ${
              completedTasks.has(task.id) ? 'text-green-300' : 'text-gray-300'
            }`}>
              {task.description}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-2">
          {getPriorityIcon(task.priority)}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(task.category)}`}>
            {task.category}
          </span>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-400 mt-3">
        <span>{task.timeframe}</span>
        <span>{task.estimatedHours}h estimated</span>
      </div>
      
      {task.resources.length > 0 && (
        <div className="mt-2">
          <span className="text-xs font-medium text-gray-400">Resources:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {task.resources.map((resource, index) => (
              <span key={index} className="bg-gray-600 text-gray-300 px-2 py-1 rounded text-xs">
                {resource}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gradient-to-r from-green-500 to-teal-600">
        <div className="flex items-center space-x-3">
          <Rocket className="w-8 h-8 text-white" />
          <div>
            <h3 className="text-xl font-bold text-white">Launch Plan Assistant</h3>
            <p className="text-green-100 text-sm">Create your go-to-market strategy</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-green-200 transition-colors text-xl"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-gray-900">
        {!launchPlan ? (
          /* Input Form */
          <form onSubmit={handleGeneratePlan} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Product Description *
              </label>
              <textarea
                name="productDescription"
                value={formData.productDescription}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Describe your product or service. What does it do? What makes it unique?"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Target Market *
              </label>
              <input
                type="text"
                name="targetMarket"
                value={formData.targetMarket}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Who is your target customer? (e.g., small businesses, enterprise, consumers)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Launch Timeline *
                </label>
                <input
                  type="text"
                  name="launchTimeline"
                  value={formData.launchTimeline}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., 3 months, 6 weeks, Q2 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Budget (Optional)
                </label>
                <input
                  type="text"
                  name="budget"
                  value={formData.budget}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., $10,000, Limited budget"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700/50 text-red-200 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-500 to-teal-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating Launch Plan...</span>
                </div>
              ) : (
                'Generate Launch Plan'
              )}
            </button>
          </form>
        ) : (
          /* Launch Plan Results */
          <div className="space-y-6">
            {/* Plan Overview */}
            <div className="bg-gradient-to-r from-green-900/30 to-teal-900/30 border border-green-700/50 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-white mb-2">{launchPlan.productName}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-300">Launch Date:</span>
                  <span className="text-sm text-gray-400">{launchPlan.launchDate}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-300">Timeline:</span>
                  <span className="text-sm text-gray-400">{launchPlan.estimatedTimeline}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-300">Tasks:</span>
                  <span className="text-sm text-gray-400">{launchPlan.totalTasks} total</span>
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 border border-green-700/30">
                <h4 className="font-semibold text-white mb-2">Launch Strategy:</h4>
                <p className="text-gray-300">{launchPlan.launchStrategy}</p>
              </div>
            </div>

            {/* Launch Phases */}
            {launchPlan.phases.map((phase) => (
              <div key={phase.id} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xl font-bold text-white">{phase.name}</h4>
                  <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm">
                    {phase.duration}
                  </span>
                </div>
                <p className="text-gray-300 mb-4">{phase.description}</p>
                
                {/* Tasks */}
                <div className="space-y-3 mb-4">
                  {phase.tasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>

                {/* Milestones */}
                {phase.milestones.length > 0 && (
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <h5 className="font-semibold text-white mb-2">Phase Milestones:</h5>
                    <ul className="space-y-1">
                      {phase.milestones.map((milestone, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-300">{milestone}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}

            {/* Success Metrics & Risks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-6">
                <h4 className="text-lg font-bold text-white mb-3">Success Metrics</h4>
                <ul className="space-y-2">
                  {launchPlan.keyMetrics.map((metric, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-300">{metric}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-6">
                <h4 className="text-lg font-bold text-white mb-3">Risk Mitigation</h4>
                <ul className="space-y-2">
                  {launchPlan.riskMitigation.map((risk, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                      <span className="text-sm text-gray-300">{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Progress Summary */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h4 className="text-lg font-bold text-white mb-3">Progress Summary</h4>
              <div className="flex items-center space-x-4">
                <div className="text-2xl font-bold text-green-600">
                  {completedTasks.size}/{launchPlan.totalTasks}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-300 mb-1">Tasks Completed</div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(completedTasks.size / launchPlan.totalTasks) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={() => setLaunchPlan(null)}
                className="flex-1 bg-gray-700 text-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
              >
                Create New Plan
              </button>
              <button
                onClick={() => {
                  const planText = JSON.stringify(launchPlan, null, 2);
                  navigator.clipboard.writeText(planText);
                }}
                className="flex-1 bg-gradient-to-r from-green-500 to-teal-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
              >
                Export Plan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};