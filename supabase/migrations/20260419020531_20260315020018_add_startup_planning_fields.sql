/*
  # Add Startup Planning Fields to Projects

  ## Summary
  Enhances the projects table with comprehensive startup planning fields.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'startup_name'
  ) THEN
    ALTER TABLE projects ADD COLUMN startup_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'problem_statement'
  ) THEN
    ALTER TABLE projects ADD COLUMN problem_statement text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'target_users'
  ) THEN
    ALTER TABLE projects ADD COLUMN target_users jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'mvp_features_list'
  ) THEN
    ALTER TABLE projects ADD COLUMN mvp_features_list jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'launch_roadmap'
  ) THEN
    ALTER TABLE projects ADD COLUMN launch_roadmap jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'value_proposition'
  ) THEN
    ALTER TABLE projects ADD COLUMN value_proposition text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'business_model'
  ) THEN
    ALTER TABLE projects ADD COLUMN business_model text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'competitive_advantage'
  ) THEN
    ALTER TABLE projects ADD COLUMN competitive_advantage text;
  END IF;
END $$;
