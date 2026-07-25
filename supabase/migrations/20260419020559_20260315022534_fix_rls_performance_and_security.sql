/*
  # Fix RLS Performance and Security Issues

  ## Summary
  Optimizes Row Level Security policies for better performance and fixes security warnings.
*/

DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can create own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own project conversations" ON project_conversations;
DROP POLICY IF EXISTS "Users can create conversations for own projects" ON project_conversations;
DROP POLICY IF EXISTS "Users can update conversations for own projects" ON project_conversations;
DROP POLICY IF EXISTS "Users can delete conversations for own projects" ON project_conversations;

CREATE POLICY "Users can view own project conversations"
  ON project_conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_conversations.project_id
      AND projects.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create conversations for own projects"
  ON project_conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_conversations.project_id
      AND projects.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update conversations for own projects"
  ON project_conversations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_conversations.project_id
      AND projects.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_conversations.project_id
      AND projects.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete conversations for own projects"
  ON project_conversations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_conversations.project_id
      AND projects.user_id = (select auth.uid())
    )
  );

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;

DROP INDEX IF EXISTS idx_projects_current_milestone;
DROP INDEX IF EXISTS idx_projects_status;
DROP INDEX IF EXISTS idx_projects_progress;
DROP INDEX IF EXISTS idx_project_conversations_project_id;
