/*
  # Add User Context and AI Feedback History Tables

  ## Summary
  Creates tables to store user-provided context about their SaaS business and AI feedback/insights history.
*/

CREATE TABLE IF NOT EXISTS user_business_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  business_name text,
  business_description text,
  business_stage text,
  industry text,
  problem_statement text,
  solution_description text,
  unique_value_proposition text,
  target_market jsonb DEFAULT '{}',
  customer_personas jsonb DEFAULT '[]',
  competitors jsonb DEFAULT '[]',
  current_metrics jsonb DEFAULT '{}',
  product_features jsonb DEFAULT '[]',
  tech_stack jsonb DEFAULT '[]',
  development_stage text,
  revenue_model text,
  pricing_strategy jsonb DEFAULT '{}',
  short_term_goals jsonb DEFAULT '[]',
  long_term_goals jsonb DEFAULT '[]',
  current_challenges jsonb DEFAULT '[]',
  team_size integer DEFAULT 1,
  budget_range text,
  time_commitment text,
  technical_expertise text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_business_stage CHECK (
    business_stage IN ('idea', 'validation', 'mvp', 'launched', 'growing', 'scaling')
  )
);

CREATE TABLE IF NOT EXISTS ai_feedback_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  context_snapshot_id uuid REFERENCES user_business_context(id) ON DELETE SET NULL,
  feedback_type text NOT NULL,
  category text,
  title text NOT NULL,
  content text NOT NULL,
  trigger_event text,
  input_context jsonb DEFAULT '{}',
  recommendations jsonb DEFAULT '[]',
  is_actionable boolean DEFAULT false,
  action_taken boolean DEFAULT false,
  action_date timestamptz,
  outcome jsonb DEFAULT '{}',
  effectiveness_rating integer,
  user_feedback text,
  was_helpful boolean,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_feedback_type CHECK (
    feedback_type IN ('insight', 'recommendation', 'warning', 'celebration', 'milestone')
  ),
  CONSTRAINT valid_effectiveness_rating CHECK (
    effectiveness_rating IS NULL OR (effectiveness_rating >= 1 AND effectiveness_rating <= 5)
  )
);

CREATE TABLE IF NOT EXISTS business_context_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  context_id uuid NOT NULL REFERENCES user_business_context(id) ON DELETE CASCADE,
  field_changed text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  change_reason text,
  impact_level text,
  affects_strategy boolean DEFAULT false,
  requires_plan_adjustment boolean DEFAULT false,
  ai_analysis text,
  suggested_actions jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_impact_level CHECK (
    impact_level IN ('low', 'medium', 'high', 'critical')
  )
);

ALTER TABLE user_business_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_context_updates ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Users can view own context updates"
  ON business_context_updates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own context updates"
  ON business_context_updates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

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

CREATE INDEX IF NOT EXISTS idx_business_context_metrics ON user_business_context USING gin(current_metrics);
CREATE INDEX IF NOT EXISTS idx_business_context_goals ON user_business_context USING gin(short_term_goals);
CREATE INDEX IF NOT EXISTS idx_feedback_recommendations ON ai_feedback_history USING gin(recommendations);
CREATE INDEX IF NOT EXISTS idx_feedback_input_context ON ai_feedback_history USING gin(input_context);

CREATE OR REPLACE FUNCTION update_business_context_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_business_context_timestamp ON user_business_context;
CREATE TRIGGER update_user_business_context_timestamp
  BEFORE UPDATE ON user_business_context
  FOR EACH ROW
  EXECUTE FUNCTION update_business_context_timestamp();

CREATE OR REPLACE FUNCTION log_context_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
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

DROP TRIGGER IF EXISTS log_business_context_changes ON user_business_context;
CREATE TRIGGER log_business_context_changes
  AFTER UPDATE ON user_business_context
  FOR EACH ROW
  EXECUTE FUNCTION log_context_change();

COMMENT ON TABLE user_business_context IS 'Stores comprehensive user-provided context about their SaaS business for personalized AI guidance';
COMMENT ON TABLE ai_feedback_history IS 'Tracks all AI-generated insights, recommendations, and outcomes for learning and improvement';
COMMENT ON TABLE business_context_updates IS 'Logs all changes to business context over time to track evolution and inform AI decisions';
