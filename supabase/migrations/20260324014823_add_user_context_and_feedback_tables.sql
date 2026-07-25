/*
  # Add User Context and AI Feedback History Tables

  ## Summary
  Creates tables to store user-provided context about their SaaS business and AI feedback/insights history.
  This enables the AI to learn from user inputs and provide personalized, context-aware recommendations.

  ## New Tables

  ### 1. `user_business_context`
  Stores comprehensive information about user's SaaS business idea and current progression:
  - Basic business info (name, description, stage)
  - Problem and solution details
  - Target market and customer segments
  - Current metrics (MRR, users, conversion rates)
  - Goals and challenges
  - Resources and constraints

  ### 2. `ai_feedback_history`
  Tracks all AI-generated insights and recommendations:
  - Feedback type (insight, recommendation, warning, milestone)
  - Context and reasoning
  - Actionability status
  - Outcomes and effectiveness
  - User reactions

  ### 3. `business_context_updates`
  Logs all changes to business context over time:
  - What changed
  - Why it changed
  - Impact assessment
  - Enables tracking business evolution

  ## Security
  - All tables have RLS enabled
  - Users can only access their own data
  - Separate policies for read/write operations

  ## Indexes
  - Optimized for common query patterns
  - JSONB GIN indexes for flexible querying
  - Timestamp indexes for temporal queries
*/

-- Create user_business_context table
CREATE TABLE IF NOT EXISTS user_business_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Basic Info
  business_name text,
  business_description text,
  business_stage text, -- idea, validation, mvp, launched, growing, scaling
  industry text,
  
  -- Problem & Solution
  problem_statement text,
  solution_description text,
  unique_value_proposition text,
  
  -- Market & Customers
  target_market jsonb DEFAULT '{}', -- {size, segments, geography}
  customer_personas jsonb DEFAULT '[]', -- [{name, demographics, pain_points, behaviors}]
  competitors jsonb DEFAULT '[]', -- [{name, strengths, weaknesses, differentiation}]
  
  -- Current Metrics
  current_metrics jsonb DEFAULT '{}', -- {mrr, users, conversion_rate, churn_rate, cac, ltv}
  
  -- Product & Tech
  product_features jsonb DEFAULT '[]', -- [{name, status, priority}]
  tech_stack jsonb DEFAULT '[]',
  development_stage text, -- planning, building, testing, launched
  
  -- Business Model
  revenue_model text, -- subscription, usage-based, freemium, etc.
  pricing_strategy jsonb DEFAULT '{}', -- {model, tiers, pricing_points}
  
  -- Goals & Challenges
  short_term_goals jsonb DEFAULT '[]', -- [{goal, timeline, success_criteria}]
  long_term_goals jsonb DEFAULT '[]',
  current_challenges jsonb DEFAULT '[]', -- [{challenge, severity, impact}]
  
  -- Resources & Constraints
  team_size integer DEFAULT 1,
  budget_range text,
  time_commitment text, -- full-time, part-time, side-project
  technical_expertise text, -- beginner, intermediate, advanced
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_business_stage CHECK (
    business_stage IN ('idea', 'validation', 'mvp', 'launched', 'growing', 'scaling')
  )
);

-- Create ai_feedback_history table
CREATE TABLE IF NOT EXISTS ai_feedback_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  context_snapshot_id uuid REFERENCES user_business_context(id) ON DELETE SET NULL,
  
  -- Feedback Details
  feedback_type text NOT NULL, -- insight, recommendation, warning, celebration, milestone
  category text, -- market, product, pricing, growth, technical, validation
  title text NOT NULL,
  content text NOT NULL,
  
  -- Context
  trigger_event text, -- what caused this feedback (user_input, milestone_reached, metric_change)
  input_context jsonb DEFAULT '{}', -- the context used to generate this feedback
  
  -- Recommendations
  recommendations jsonb DEFAULT '[]', -- [{action, priority, estimated_time, resources_needed}]
  
  -- Actionability
  is_actionable boolean DEFAULT false,
  action_taken boolean DEFAULT false,
  action_date timestamptz,
  
  -- Outcomes
  outcome jsonb DEFAULT '{}', -- {result, impact, lessons_learned}
  effectiveness_rating integer, -- 1-5 scale, null if not rated yet
  
  -- User Reaction
  user_feedback text, -- user's response to the AI feedback
  was_helpful boolean,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_feedback_type CHECK (
    feedback_type IN ('insight', 'recommendation', 'warning', 'celebration', 'milestone')
  ),
  CONSTRAINT valid_effectiveness_rating CHECK (
    effectiveness_rating IS NULL OR (effectiveness_rating >= 1 AND effectiveness_rating <= 5)
  )
);

-- Create business_context_updates table
CREATE TABLE IF NOT EXISTS business_context_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  context_id uuid NOT NULL REFERENCES user_business_context(id) ON DELETE CASCADE,
  
  -- Change Details
  field_changed text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  change_reason text,
  
  -- Impact Assessment
  impact_level text, -- low, medium, high, critical
  affects_strategy boolean DEFAULT false,
  requires_plan_adjustment boolean DEFAULT false,
  
  -- AI Analysis
  ai_analysis text, -- AI's interpretation of what this change means
  suggested_actions jsonb DEFAULT '[]',
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_impact_level CHECK (
    impact_level IN ('low', 'medium', 'high', 'critical')
  )
);

-- Enable RLS
ALTER TABLE user_business_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_context_updates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_business_context
CREATE POLICY "Users can view own business context"
  ON user_business_context FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own business context"
  ON user_business_context FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own business context"
  ON user_business_context FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own business context"
  ON user_business_context FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for ai_feedback_history
CREATE POLICY "Users can view own feedback history"
  ON ai_feedback_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback"
  ON ai_feedback_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feedback"
  ON ai_feedback_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own feedback"
  ON ai_feedback_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for business_context_updates
CREATE POLICY "Users can view own context updates"
  ON business_context_updates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own context updates"
  ON business_context_updates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_business_context_user_id ON user_business_context(user_id);
CREATE INDEX IF NOT EXISTS idx_user_business_context_project_id ON user_business_context(project_id);
CREATE INDEX IF NOT EXISTS idx_user_business_context_stage ON user_business_context(business_stage);
CREATE INDEX IF NOT EXISTS idx_user_business_context_updated ON user_business_context(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_user_id ON ai_feedback_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_project_id ON ai_feedback_history(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_type ON ai_feedback_history(feedback_type);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_created ON ai_feedback_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_actionable ON ai_feedback_history(is_actionable, action_taken);

CREATE INDEX IF NOT EXISTS idx_context_updates_context_id ON business_context_updates(context_id);
CREATE INDEX IF NOT EXISTS idx_context_updates_created ON business_context_updates(created_at DESC);

-- JSONB GIN indexes for flexible querying
CREATE INDEX IF NOT EXISTS idx_business_context_metrics ON user_business_context USING gin(current_metrics);
CREATE INDEX IF NOT EXISTS idx_business_context_goals ON user_business_context USING gin(short_term_goals);
CREATE INDEX IF NOT EXISTS idx_feedback_recommendations ON ai_feedback_history USING gin(recommendations);
CREATE INDEX IF NOT EXISTS idx_feedback_input_context ON ai_feedback_history USING gin(input_context);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_business_context_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_business_context_timestamp
  BEFORE UPDATE ON user_business_context
  FOR EACH ROW
  EXECUTE FUNCTION update_business_context_timestamp();

-- Helper function to log context changes
CREATE OR REPLACE FUNCTION log_context_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if this is an UPDATE operation
  IF TG_OP = 'UPDATE' THEN
    -- Log changes to important fields
    IF OLD.business_stage IS DISTINCT FROM NEW.business_stage THEN
      INSERT INTO business_context_updates (user_id, context_id, field_changed, old_value, new_value, impact_level)
      VALUES (NEW.user_id, NEW.id, 'business_stage', to_jsonb(OLD.business_stage), to_jsonb(NEW.business_stage), 'high');
    END IF;
    
    IF OLD.current_metrics IS DISTINCT FROM NEW.current_metrics THEN
      INSERT INTO business_context_updates (user_id, context_id, field_changed, old_value, new_value, impact_level)
      VALUES (NEW.user_id, NEW.id, 'current_metrics', OLD.current_metrics, NEW.current_metrics, 'medium');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_business_context_changes
  AFTER UPDATE ON user_business_context
  FOR EACH ROW
  EXECUTE FUNCTION log_context_change();

-- Comments
COMMENT ON TABLE user_business_context IS 'Stores comprehensive user-provided context about their SaaS business for personalized AI guidance';
COMMENT ON TABLE ai_feedback_history IS 'Tracks all AI-generated insights, recommendations, and outcomes for learning and improvement';
COMMENT ON TABLE business_context_updates IS 'Logs all changes to business context over time to track evolution and inform AI decisions';
