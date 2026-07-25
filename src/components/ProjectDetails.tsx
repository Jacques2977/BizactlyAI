import React from 'react';
import { Project } from '../types/project';
import { ProjectWorkspace } from './ProjectWorkspace';

interface ProjectDetailsProps {
  project: Project;
  onClose: () => void;
}

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({ project, onClose }) => {
  const handleUpdate = (updates: Partial<Project>) => {
    const existingProjects = JSON.parse(localStorage.getItem('user_projects') || '[]');
    const updatedProjects = existingProjects.map((p: Project) =>
      p.id === project.id
        ? { ...p, ...updates, updated_at: new Date().toISOString() }
        : p
    );
    localStorage.setItem('user_projects', JSON.stringify(updatedProjects));
    window.dispatchEvent(new Event('storage'));
  };

  return <ProjectWorkspace project={project} onClose={onClose} onUpdate={handleUpdate} />;
};
