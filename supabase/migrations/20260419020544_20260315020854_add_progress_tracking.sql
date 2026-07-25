/*
  # Add Progress Tracking to Projects

  ## Summary
  Adds milestone-based progress tracking to guide users through the startup journey.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'current_milestone'
  ) THEN
    ALTER TABLE projects ADD COLUMN current_milestone text DEFAULT 'idea_validation';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'milestones_completed'
  ) THEN
    ALTER TABLE projects ADD COLUMN milestones_completed jsonb DEFAULT '{
      "idea_validation": {"completed": false, "completedAt": null},
      "market_research": {"completed": false, "completedAt": null},
      "lean_canvas": {"completed": false, "completedAt": null},
      "mvp_plan": {"completed": false, "completedAt": null},
      "launch": {"completed": false, "completedAt": null}
    }'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'progress_percentage'
  ) THEN
    ALTER TABLE projects ADD COLUMN progress_percentage integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'next_actions'
  ) THEN
    ALTER TABLE projects ADD COLUMN next_actions jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_projects_current_milestone ON projects(current_milestone);
CREATE INDEX IF NOT EXISTS idx_projects_progress ON projects(progress_percentage);
