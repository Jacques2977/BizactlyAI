import React from 'react';
import { Project } from '../../types/project';
import { LeanCanvasBuilder } from '../LeanCanvasBuilder';

interface LeanCanvasSectionProps {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
}

export function LeanCanvasSection({ project, onUpdate }: LeanCanvasSectionProps) {
  const handleSave = (canvasData: any) => {
    onUpdate({
      lean_canvas_data: canvasData,
      milestones_completed: {
        ...project.milestones_completed,
        lean_canvas: {
          completed: true,
          completedAt: new Date().toISOString()
        }
      },
      progress_percentage: Math.min((project.progress_percentage || 0) + 16, 100)
    });
  };

  return (
    <div className="h-full">
      <LeanCanvasBuilder
        onClose={() => {}}
        onFeatureUse={() => {}}
        initialData={project.lean_canvas_data}
        onSave={handleSave}
        embedded={true}
      />
    </div>
  );
}
