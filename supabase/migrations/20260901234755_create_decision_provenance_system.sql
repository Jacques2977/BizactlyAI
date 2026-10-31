/*
# Decision Provenance & Reasoning Memory System (Milestone 2)

## Purpose
Creates a structured decision provenance system that traces:
  information → reasoning event → recommendation → founder decision → outcome

This is NOT generic chat memory. It separates useful business reasoning from
conversational noise and creates a persistent, traceable history of important
recommendations and decisions.

## New Tables (created in dependency order, cross-refs added via ALTER)

1. reasoning_events — structured events from conversation/business context that
   potentially contribute to a decision. Has relevance_status lifecycle.
   decision_id is added via ALTER after decision_records exists.

2. decision_records — permanent record created ONLY when the orchestrator
   determines a meaningful business decision has occurred.
   founder_decision_id and outcome_id added via ALTER after child tables exist.

3. decision_reasoning_events — junction linking decisions to influencing events.

4. founder_decisions — the founder's actual choice (separate from recommendation).

5. outcomes — what happened after the founder's decision.

## Security
All tables use RLS scoped through project ownership (authenticated only).
The service role key used by the edge function bypasses RLS.

## Indexes
Created on project_id, status, decision_id, relevance_status, event_type.
*/

-- ─── 1. reasoning_events (no FK to decision_records yet) ──────────────────────

CREATE TABLE IF NOT EXISTS reasoning_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  conversation_id uuid,
  decision_id uuid,
  event_type text NOT NULL,
  content text NOT NULL,
  source text NOT NULL DEFAULT 'founder_input',
  importance text NOT NULL DEFAULT 'medium',
  relevance_status text NOT NULL DEFAULT 'candidate',
  confidence numeric DEFAULT 0.5,
  influence_direction text,
  influence_strength text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reasoning_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reasoning events" ON reasoning_events;
CREATE POLICY "Users can view own reasoning events"
ON reasoning_events FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = reasoning_events.project_id AND projects.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert own reasoning events" ON reasoning_events;
CREATE POLICY "Users can insert own reasoning events"
ON reasoning_events FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = reasoning_events.project_id AND projects.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update own reasoning events" ON reasoning_events;
CREATE POLICY "Users can update own reasoning events"
ON reasoning_events FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = reasoning_events.project_id AND projects.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = reasoning_events.project_id AND projects.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete own reasoning events" ON reasoning_events;
CREATE POLICY "Users can delete own reasoning events"
ON reasoning_events FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = reasoning_events.project_id AND projects.user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_reasoning_events_project ON reasoning_events(project_id);
CREATE INDEX IF NOT EXISTS idx_reasoning_events_decision ON reasoning_events(decision_id);
CREATE INDEX IF NOT EXISTS idx_reasoning_events_relevance ON reasoning_events(relevance_status);
CREATE INDEX IF NOT EXISTS idx_reasoning_events_type ON reasoning_events(event_type);

-- ─── 2. decision_records (no FK to founder_decisions/outcomes yet) ────────────

CREATE TABLE IF NOT EXISTS decision_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  decision_type text NOT NULL DEFAULT 'other',
  decision_question text NOT NULL,
  context_summary text,
  recommendation text,
  recommendation_summary text,
  recommendation_confidence numeric DEFAULT 0.5,
  status text NOT NULL DEFAULT 'proposed',
  founder_decision_id uuid,
  outcome_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE decision_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own decision records" ON decision_records;
CREATE POLICY "Users can view own decision records"
ON decision_records FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = decision_records.project_id AND projects.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert own decision records" ON decision_records;
CREATE POLICY "Users can insert own decision records"
ON decision_records FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = decision_records.project_id AND projects.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update own decision records" ON decision_records;
CREATE POLICY "Users can update own decision records"
ON decision_records FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = decision_records.project_id AND projects.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = decision_records.project_id AND projects.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete own decision records" ON decision_records;
CREATE POLICY "Users can delete own decision records"
ON decision_records FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = decision_records.project_id AND projects.user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_decision_records_project ON decision_records(project_id);
CREATE INDEX IF NOT EXISTS idx_decision_records_status ON decision_records(status);
CREATE INDEX IF NOT EXISTS idx_decision_records_type ON decision_records(decision_type);

-- ─── 3. founder_decisions ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS founder_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id uuid NOT NULL REFERENCES decision_records(id) ON DELETE CASCADE,
  selected_option text NOT NULL,
  decision_text text NOT NULL,
  rationale text,
  decision_status text NOT NULL DEFAULT 'unknown',
  decided_at timestamptz DEFAULT now()
);

ALTER TABLE founder_decisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own founder decisions" ON founder_decisions;
CREATE POLICY "Users can view own founder decisions"
ON founder_decisions FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM decision_records WHERE decision_records.id = founder_decisions.decision_id AND EXISTS (SELECT 1 FROM projects WHERE projects.id = decision_records.project_id AND projects.user_id = auth.uid())));

DROP POLICY IF EXISTS "Users can insert own founder decisions" ON founder_decisions;
CREATE POLICY "Users can insert own founder decisions"
ON founder_decisions FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM decision_records WHERE decision_records.id = founder_decisions.decision_id AND EXISTS (SELECT 1 FROM projects WHERE projects.id = decision_records.project_id AND projects.user_id = auth.uid())));

DROP POLICY IF EXISTS "Users can update own founder decisions" ON founder_decisions;
CREATE POLICY "Users can update own founder decisions"
ON founder_decisions FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM decision_records WHERE decision_records.id = founder_decisions.decision_id AND EXISTS (SELECT 1 FROM projects WHERE projects.id = decision_records.project_id AND projects.user_id = auth.uid())))
WITH CHECK (EXISTS (SELECT 1 FROM decision_records WHERE decision_records.id = founder_decisions.decision_id AND EXISTS (SELECT 1 FROM projects WHERE projects.id = decision_records.project_id AND projects.user_id = auth.uid())));

DROP POLICY IF EXISTS "Users can delete own founder decisions" ON founder_decisions;
CREATE POLICY "Users can delete own founder decisions"
ON founder_decisions FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM decision_records WHERE decision_records.id = founder_decisions.decision_id AND EXISTS (SELECT 1 FROM projects WHERE projects.id = decision_records.project_id AND projects.user_id = auth.uid())));

CREATE INDEX IF NOT EXISTS idx_founder_decisions_decision ON founder_decisions(decision_id);

-- ─── 4. outcomes ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id uuid NOT NULL REFERENCES decision_records(id) ON DELETE CASCADE,
  founder_decision_id uuid REFERENCES founder_decisions(id) ON DELETE SET NULL,
  outcome_status text NOT NULL DEFAULT 'pending',
  outcome_summary text,
  measured_result text,
  expected_result text,
  success_rating numeric,
  founder_assessment text,
  lessons_learned text,
  recorded_at timestamptz DEFAULT now()
);

ALTER TABLE outcomes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own outcomes" ON outcomes;
CREATE POLICY "Users can view own outcomes"
ON outcomes FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM decision_records WHERE decision_records.id = outcomes.decision_id AND EXISTS (SELECT 1 FROM projects WHERE projects.id = decision_records.project_id AND projects.user_id = auth.uid())));

DROP POLICY IF EXISTS "Users can insert own outcomes" ON outcomes;
CREATE POLICY "Users can insert own outcomes"
ON outcomes FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM decision_records WHERE decision_records.id = outcomes.decision_id AND EXISTS (SELECT 1 FROM projects WHERE projects.id = decision_records.project_id AND projects.user_id = auth.uid())));

DROP POLICY IF EXISTS "Users can update own outcomes" ON outcomes;
CREATE POLICY "Users can update own outcomes"
ON outcomes FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM decision_records WHERE decision_records.id = outcomes.decision_id AND EXISTS (SELECT 1 FROM projects WHERE projects.id = decision_records.project_id AND projects.user_id = auth.uid())))
WITH CHECK (EXISTS (SELECT 1 FROM decision_records WHERE decision_records.id = outcomes.decision_id AND EXISTS (SELECT 1 FROM projects WHERE projects.id = decision_records.project_id AND projects.user_id = auth.uid())));

DROP POLICY IF EXISTS "Users can delete own outcomes" ON outcomes;
CREATE POLICY "Users can delete own outcomes"
ON outcomes FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM decision_records WHERE decision_records.id = outcomes.decision_id AND EXISTS (SELECT 1 FROM projects WHERE projects.id = decision_records.project_id AND projects.user_id = auth.uid())));

CREATE INDEX IF NOT EXISTS idx_outcomes_decision ON outcomes(decision_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_status ON outcomes(outcome_status);

-- ─── 5. decision_reasoning_events (junction) ──────────────────────────────────

CREATE TABLE IF NOT EXISTS decision_reasoning_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id uuid NOT NULL REFERENCES decision_records(id) ON DELETE CASCADE,
  reasoning_event_id uuid NOT NULL REFERENCES reasoning_events(id) ON DELETE CASCADE,
  relevance text NOT NULL DEFAULT 'supporting',
  influence_strength text NOT NULL DEFAULT 'moderate',
  influence_role text NOT NULL DEFAULT 'supporting_evidence',
  created_at timestamptz DEFAULT now(),
  UNIQUE (decision_id, reasoning_event_id)
);

ALTER TABLE decision_reasoning_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own decision reasoning events" ON decision_reasoning_events;
CREATE POLICY "Users can view own decision reasoning events"
ON decision_reasoning_events FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM decision_records WHERE decision_records.id = decision_reasoning_events.decision_id AND EXISTS (SELECT 1 FROM projects WHERE projects.id = decision_records.project_id AND projects.user_id = auth.uid())));

DROP POLICY IF EXISTS "Users can insert own decision reasoning events" ON decision_reasoning_events;
CREATE POLICY "Users can insert own decision reasoning events"
ON decision_reasoning_events FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM decision_records WHERE decision_records.id = decision_reasoning_events.decision_id AND EXISTS (SELECT 1 FROM projects WHERE projects.id = decision_records.project_id AND projects.user_id = auth.uid())));

DROP POLICY IF EXISTS "Users can update own decision reasoning events" ON decision_reasoning_events;
CREATE POLICY "Users can update own decision reasoning events"
ON decision_reasoning_events FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM decision_records WHERE decision_records.id = decision_reasoning_events.decision_id AND EXISTS (SELECT 1 FROM projects WHERE projects.id = decision_records.project_id AND projects.user_id = auth.uid())))
WITH CHECK (EXISTS (SELECT 1 FROM decision_records WHERE decision_records.id = decision_reasoning_events.decision_id AND EXISTS (SELECT 1 FROM projects WHERE projects.id = decision_records.project_id AND projects.user_id = auth.uid())));

DROP POLICY IF EXISTS "Users can delete own decision reasoning events" ON decision_reasoning_events;
CREATE POLICY "Users can delete own decision reasoning events"
ON decision_reasoning_events FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM decision_records WHERE decision_records.id = decision_reasoning_events.decision_id AND EXISTS (SELECT 1 FROM projects WHERE projects.id = decision_records.project_id AND projects.user_id = auth.uid())));

CREATE INDEX IF NOT EXISTS idx_dre_decision ON decision_reasoning_events(decision_id);
CREATE INDEX IF NOT EXISTS idx_dre_event ON decision_reasoning_events(reasoning_event_id);

-- ─── 6. Add cross-references via ALTER (now all tables exist) ──────────────────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'reasoning_events_decision_id_fkey'
    AND table_name = 'reasoning_events'
  ) THEN
    ALTER TABLE reasoning_events
    ADD CONSTRAINT reasoning_events_decision_id_fkey
    FOREIGN KEY (decision_id) REFERENCES decision_records(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'decision_records_founder_decision_id_fkey'
    AND table_name = 'decision_records'
  ) THEN
    ALTER TABLE decision_records
    ADD CONSTRAINT decision_records_founder_decision_id_fkey
    FOREIGN KEY (founder_decision_id) REFERENCES founder_decisions(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'decision_records_outcome_id_fkey'
    AND table_name = 'decision_records'
  ) THEN
    ALTER TABLE decision_records
    ADD CONSTRAINT decision_records_outcome_id_fkey
    FOREIGN KEY (outcome_id) REFERENCES outcomes(id) ON DELETE SET NULL;
  END IF;
END $$;
