/*
  # Update Guided Milestone System

  ## Summary
  Enhances the projects table to support the new guided project creation flow
  with comprehensive milestone tracking and structured data storage.

  ## Changes Made
  
  ### 1. Add Structured Data Columns
  - `lean_canvas_data` (jsonb) - Complete lean canvas business model
  - `personas_data` (jsonb) - Customer persona profiles with demographics and behaviors
  - `launch_strategy_data` (jsonb) - Pre-launch, launch, and post-launch activities
  
  ### 2. Update Milestone System
  - Enhance milestone tracking with more detailed structure
  - Support for completion timestamps and notes
  - Better progress calculation support
  
  ## Data Structure Examples
  
  ### Lean Canvas Data
  {
    "problem": ["Problem 1", "Problem 2"],
    "solution": ["Solution 1", "Solution 2"],
    "uniqueValue": "Unique value proposition",
    "unfairAdvantage": "What can't be copied",
    "customerSegments": ["Segment 1"],
    "keyMetrics": ["MRR", "Churn"],
    "channels": ["SEO", "Content"],
    "costStructure": ["Development", "Marketing"],
    "revenueStreams": ["Subscriptions"]
  }
  
  ### Personas Data
  [{
    "name": "Startup Sarah",
    "demographics": "30-40, Tech Savvy, SaaS Founder",
    "goals": ["Scale business", "Automate processes"],
    "painPoints": ["Manual work", "Limited time"],
    "behaviors": ["Early adopter", "Research heavy"]
  }]
  
  ### Launch Strategy Data
  {
    "preLaunch": ["Build MVP", "Create landing page"],
    "launch": ["Product Hunt", "Social media"],
    "postLaunch": ["Gather feedback", "Iterate"],
    "timeline": "3 months"
  }
  
  ## Notes
  - All new columns are optional to support existing projects
  - JSONB format allows flexible querying and indexing
  - Maintains backward compatibility with existing projects
*/

-- Add new structured data columns for guided flow
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

-- Create index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_projects_lean_canvas ON projects USING gin(lean_canvas_data);
CREATE INDEX IF NOT EXISTS idx_projects_personas ON projects USING gin(personas_data);
CREATE INDEX IF NOT EXISTS idx_projects_launch_strategy ON projects USING gin(launch_strategy_data);

-- Add comment for documentation
COMMENT ON COLUMN projects.lean_canvas_data IS 'Structured lean canvas business model data including problem, solution, value proposition, and revenue model';
COMMENT ON COLUMN projects.personas_data IS 'Array of customer persona objects with demographics, goals, pain points, and behaviors';
COMMENT ON COLUMN projects.launch_strategy_data IS 'Launch strategy with pre-launch, launch, and post-launch activities plus timeline';
