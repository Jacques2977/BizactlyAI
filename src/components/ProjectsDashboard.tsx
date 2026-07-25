import React, { useState, useEffect } from 'react';
import { Folder, Plus, Trash2, Eye, Calendar, Code, Sparkles, MessageSquare } from 'lucide-react';
import { Project } from '../types/project';
import { databaseService } from '../services/databaseService';

interface ProjectsDashboardProps {
  onCreateNew: () => void;
  onViewProject: (project: Project) => void;
  onContinueChat?: (project: Project) => void;
}

export const ProjectsDashboard: React.FC<ProjectsDashboardProps> = ({ onCreateNew, onViewProject, onContinueChat }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const data = await databaseService.getUserProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!window.confirm('Are you sure you want to delete this project? This cannot be undone.')) return;
    const success = await databaseService.deleteProject(projectId);
    if (success) {
      setProjects(prev => prev.filter(p => p.id !== projectId));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'in_progress': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'web': return '🌐';
      case 'mobile': return '📱';
      case 'saas': return '☁️';
      case 'ecommerce': return '🛒';
      default: return '💻';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-300">Loading projects…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">My Projects</h2>
          <p className="text-gray-400 mt-1">Create and manage your AI-powered startup projects</p>
        </div>
        <button
          onClick={onCreateNew}
          className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Project</span>
        </button>
      </div>

      {/* Empty State */}
      {projects.length === 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">No projects yet</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Start your first AI-powered project. Your advisor will guide you from idea to launch plan.
          </p>
          <button
            onClick={onCreateNew}
            className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 inline-flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create Your First Project</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <div
              key={project.id}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:border-blue-500/40 flex flex-col"
            >
              {/* Project Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="text-2xl flex-shrink-0">{getCategoryIcon(project.category)}</div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-white truncate">{project.title}</h3>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs border mt-0.5 ${getStatusColor(project.status)}`}>
                      {project.status?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-400 text-sm mb-4 line-clamp-2 flex-shrink-0">
                {project.description || 'No description yet — continue chatting to build out your plan.'}
              </p>

              {/* Tech Stack */}
              {project.tech_stack?.frontend && project.tech_stack.frontend.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center space-x-1.5 text-xs text-gray-400 mb-2">
                    <Code className="w-3 h-3" />
                    <span>Tech Stack</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {project.tech_stack.frontend.slice(0, 3).map((tech, i) => (
                      <span key={i} className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs">{tech}</span>
                    ))}
                    {(project.tech_stack.frontend.length + (project.tech_stack.backend?.length || 0)) > 3 && (
                      <span className="bg-gray-700 text-gray-400 px-2 py-0.5 rounded text-xs">
                        +{(project.tech_stack.frontend.length + (project.tech_stack.backend?.length || 0)) - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Features Count */}
              {project.features && project.features.length > 0 && (
                <div className="flex items-center space-x-2 text-sm text-gray-400 mb-4">
                  <Folder className="w-4 h-4" />
                  <span>{project.features.length} features planned</span>
                </div>
              )}

              {/* Progress Bar */}
              {project.progress_percentage !== undefined && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-400">Plan Progress</span>
                    <span className="text-xs font-medium text-blue-400">{project.progress_percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-teal-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${project.progress_percentage}%` }}
                    />
                  </div>
                  {project.milestones_completed && (
                    <div className="flex items-center justify-between mt-1.5 text-[10px]">
                      <span className={project.milestones_completed.idea_validation?.completed ? 'text-green-400' : 'text-gray-600'}>Idea</span>
                      <span className={project.milestones_completed.lean_canvas?.completed ? 'text-green-400' : 'text-gray-600'}>Canvas</span>
                      <span className={project.milestones_completed.mvp_plan?.completed ? 'text-green-400' : 'text-gray-600'}>MVP</span>
                      <span className={project.milestones_completed.launch?.completed ? 'text-green-400' : 'text-gray-600'}>Launch</span>
                    </div>
                  )}
                </div>
              )}

              {/* Date */}
              <div className="flex items-center space-x-1.5 text-xs text-gray-500 mb-4">
                <Calendar className="w-3 h-3" />
                <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 pt-4 border-t border-gray-700 mt-auto">
                {onContinueChat && (
                  <button
                    onClick={() => onContinueChat(project)}
                    className="flex-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-1.5 text-sm"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Continue</span>
                  </button>
                )}
                <button
                  onClick={() => onViewProject(project)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-1.5 text-sm"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View</span>
                </button>
                <button
                  onClick={() => deleteProject(project.id)}
                  className="bg-red-600/10 text-red-400 p-2 rounded-lg hover:bg-red-600/20 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Bar */}
      {projects.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">{projects.length}</div>
              <div className="text-sm text-gray-400">Total Projects</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-1">{projects.filter(p => p.status === 'planning').length}</div>
              <div className="text-sm text-gray-400">Planning</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-1">{projects.filter(p => p.status === 'in_progress').length}</div>
              <div className="text-sm text-gray-400">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-1">{projects.filter(p => p.status === 'completed').length}</div>
              <div className="text-sm text-gray-400">Completed</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
