/*
  # Create project_actions table

  ## Summary
  Stores AI-generated action items for each project.
*/

CREATE TABLE IF NOT EXISTS project_actions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action       text NOT NULL,
  category     text NOT NULL DEFAULT '',
  priority     text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  completed    boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS project_actions_project_id_idx ON project_actions(project_id);
CREATE INDEX IF NOT EXISTS project_actions_user_id_idx    ON project_actions(user_id);

ALTER TABLE project_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own project actions"
  ON project_actions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own project actions"
  ON project_actions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own project actions"
  ON project_actions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own project actions"
  ON project_actions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
