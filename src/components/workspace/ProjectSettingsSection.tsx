import React, { useState } from 'react';
import { Save, Trash2 } from 'lucide-react';
import { Project } from '../../types/project';

interface ProjectSettingsSectionProps {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
}

export function ProjectSettingsSection({ project, onUpdate }: ProjectSettingsSectionProps) {
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description || '');
  const [status, setStatus] = useState(project.status || 'planning');

  const handleSave = () => {
    onUpdate({
      title,
      description,
      status: status as any
    });
  };

  return (
    <div className="p-8 bg-gray-900">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Project Settings</h2>
          <p className="text-gray-300">Manage your project details</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Project Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="planning">Planning</option>
              <option value="in_progress">In Progress</option>
              <option value="launched">Launched</option>
              <option value="scaling">Scaling</option>
            </select>
          </div>

          <div className="flex items-center space-x-4 pt-4">
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>

        <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h3>
          <p className="text-red-300 text-sm mb-4">
            Deleting your project is permanent and cannot be undone.
          </p>
          <button
            className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Project</span>
          </button>
        </div>
      </div>
    </div>
  );
}
