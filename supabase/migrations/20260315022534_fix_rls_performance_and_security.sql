/*
  # Fix RLS Performance and Security Issues

  ## Summary
  Optimizes Row Level Security policies for better performance and fixes security warnings.

  ## Changes Made
  
  ### 1. RLS Policy Optimization
  - Replace `auth.uid()` with `(select auth.uid())` in all policies
  - This prevents re-evaluation of auth functions for each row
  - Significantly improves query performance at scale
  
  ### 2. Function Security Fix
  - Add stable search_path to `update_updated_at_column()` function
  - Prevents potential security vulnerabilities from search path manipulation
  
  ### 3. Remove Unused Indexes
  - Drop indexes that are not being used by queries
  - Reduces storage overhead and write performance impact
  
  ## Tables Affected
  - `projects` - All 4 RLS policies optimized
  - `project_conversations` - All 4 RLS policies optimized
  
  ## Security Improvements
  - Policies maintain same security guarantees
  - Query performance improved by caching auth.uid() result
  - Function search path secured against manipulation
  
  ## Performance Impact
  - Reduced CPU usage for RLS policy evaluation
  - Faster query execution for large result sets
  - Slightly improved write performance from fewer indexes
*/

-- Drop and recreate projects policies with optimized auth.uid() calls
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

-- Drop and recreate project_conversations policies with optimized auth.uid() calls
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

-- Fix function search path security issue
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;

-- Drop unused indexes to improve write performance
DROP INDEX IF EXISTS idx_projects_current_milestone;
DROP INDEX IF EXISTS idx_projects_status;
DROP INDEX IF EXISTS idx_projects_progress;
DROP INDEX IF EXISTS idx_project_conversations_project_id;

-- Keep only the essential index for user lookups (most common query pattern)
-- idx_projects_user_id is kept as it's needed for the main query pattern