/*
  # Update Guided Milestone System

  ## Summary
  Adds structured data columns for lean canvas, personas, and launch strategy.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'lean_canvas_data'
  ) THEN
    ALTER TABLE projects ADD COLUMN lean_canvas_data jsonb DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'personas_data'
  ) THEN
    ALTER TABLE projects ADD COLUMN personas_data jsonb DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'launch_strategy_data'
  ) THEN
    ALTER TABLE projects ADD COLUMN launch_strategy_data jsonb DEFAULT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_projects_lean_canvas ON projects USING gin(lean_canvas_data);
CREATE INDEX IF NOT EXISTS idx_projects_personas ON projects USING gin(personas_data);
CREATE INDEX IF NOT EXISTS idx_projects_launch_strategy ON projects USING gin(launch_strategy_data);

COMMENT ON COLUMN projects.lean_canvas_data IS 'Structured lean canvas business model data including problem, solution, value proposition, and revenue model';
COMMENT ON COLUMN projects.personas_data IS 'Array of customer persona objects with demographics, goals, pain points, and behaviors';
COMMENT ON COLUMN projects.launch_strategy_data IS 'Launch strategy with pre-launch, launch, and post-launch activities plus timeline';
