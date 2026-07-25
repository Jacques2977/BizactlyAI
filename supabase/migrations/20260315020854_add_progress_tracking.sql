/*
  # Add Progress Tracking to Projects

  ## Summary
  Adds milestone-based progress tracking to guide users through the startup journey:
  Idea Validation → Market Research → Lean Canvas → MVP Plan → Launch

  ## Changes
  
  ### Add new columns to projects table
  - `current_milestone` (text) - Current stage in the startup journey
  - `milestones_completed` (jsonb) - Track completion status and dates for each milestone
  - `progress_percentage` (integer) - Overall progress percentage (0-100)
  - `next_actions` (jsonb) - Suggested next actions for current milestone

  ## Milestone Stages
  1. idea_validation - Validate the startup idea
  2. market_research - Research target market and competitors
  3. lean_canvas - Complete business model canvas
  4. mvp_plan - Plan MVP features and roadmap
  5. launch - Execute launch strategy

  ## Notes
  - All new fields have sensible defaults
  - Progress is calculated based on milestones completed
  - Each milestone tracks completion date and notes
*/

-- Add progress tracking fields
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

-- Create index for querying by milestone
CREATE INDEX IF NOT EXISTS idx_projects_current_milestone ON projects(current_milestone);
CREATE INDEX IF NOT EXISTS idx_projects_progress ON projects(progress_percentage);
