/*
  # Create Projects Schema

  ## Summary
  Creates a comprehensive database schema for AI-powered project creation and management.

  ## New Tables
  
  ### `projects`
  - `id` (uuid, primary key) - Unique project identifier
  - `user_id` (uuid, foreign key) - Reference to auth.users
  - `title` (text) - Project name/title
  - `description` (text) - Project description
  - `category` (text) - Project category (web, mobile, saas, etc.)
  - `tech_stack` (jsonb) - Technologies selected for the project
  - `features` (jsonb) - List of features and their specifications
  - `design_preferences` (jsonb) - UI/UX design preferences
  - `status` (text) - Project status (planning, in_progress, completed)
  - `ai_suggestions` (jsonb) - AI-generated suggestions and recommendations
  - `created_at` (timestamptz) - When project was created
  - `updated_at` (timestamptz) - When project was last updated

  ### `project_conversations`
  - `id` (uuid, primary key) - Conversation identifier
  - `project_id` (uuid, foreign key) - Reference to projects
  - `messages` (jsonb) - Conversation messages with AI
  - `created_at` (timestamptz) - When conversation started
  - `updated_at` (timestamptz) - When conversation was last updated

  ## Security
  - Enable RLS on all tables
  - Users can only access their own projects
  - Users can only access conversations for their projects
*/

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  category text DEFAULT 'web',
  tech_stack jsonb DEFAULT '[]'::jsonb,
  features jsonb DEFAULT '[]'::jsonb,
  design_preferences jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'planning',
  ai_suggestions jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  messages jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own project conversations"
  ON project_conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_conversations.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations for own projects"
  ON project_conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_conversations.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update conversations for own projects"
  ON project_conversations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_conversations.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_conversations.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete conversations for own projects"
  ON project_conversations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_conversations.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_project_conversations_project_id ON project_conversations(project_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_conversations_updated_at ON project_conversations;
CREATE TRIGGER update_project_conversations_updated_at
  BEFORE UPDATE ON project_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
