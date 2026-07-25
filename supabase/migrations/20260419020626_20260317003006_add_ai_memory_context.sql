/*
  # Add AI Memory Context to Projects

  ## Summary
  Adds comprehensive AI memory structure to store context about each project.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'ai_memory'
  ) THEN
    ALTER TABLE projects ADD COLUMN ai_memory jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_projects_ai_memory ON projects USING gin(ai_memory);

COMMENT ON COLUMN projects.ai_memory IS 'AI memory context storing all learned information about the project including founder profile, idea evolution, market insights, validation data, and conversation history';

CREATE OR REPLACE FUNCTION update_ai_memory(
  project_id_param uuid,
  memory_path text[],
  memory_value jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE projects
  SET 
    ai_memory = jsonb_set(
      COALESCE(ai_memory, '{}'::jsonb),
      memory_path,
      memory_value,
      true
    ),
    updated_at = now()
  WHERE id = project_id_param;
END;
$$;

COMMENT ON FUNCTION update_ai_memory IS 'Helper function to update specific paths in the AI memory object without replacing the entire structure';
