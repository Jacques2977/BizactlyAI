import { supabase } from '../lib/supabase';
import type {
  DecisionRecord,
  FounderDecision,
  Outcome,
  ReasoningEvent,
  DecisionType,
  DecisionStatus,
  FounderDecisionStatus,
  OutcomeStatus,
} from '../types/project';

// ─── Decision Records ─────────────────────────────────────────────────────────

export async function fetchDecisions(projectId: string): Promise<DecisionRecord[]> {
  const { data, error } = await supabase
    .from('decision_records')
    .select(`
      *,
      decision_reasoning_events(
        id, decision_id, reasoning_event_id, relevance, influence_strength, influence_role, created_at,
        reasoning_event:reasoning_events(*)
      ),
      founder_decision:founder_decisions(*),
      outcome:outcomes(*)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapDecisionRecord);
}

export async function fetchDecision(decisionId: string): Promise<DecisionRecord | null> {
  const { data, error } = await supabase
    .from('decision_records')
    .select(`
      *,
      decision_reasoning_events(
        id, decision_id, reasoning_event_id, relevance, influence_strength, influence_role, created_at,
        reasoning_event:reasoning_events(*)
      ),
      founder_decision:founder_decisions(*),
      outcome:outcomes(*)
    `)
    .eq('id', decisionId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapDecisionRecord(data) : null;
}

export async function updateDecisionStatus(
  decisionId: string,
  status: DecisionStatus
): Promise<void> {
  const { error } = await supabase
    .from('decision_records')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', decisionId);
  if (error) throw error;
}

// ─── Founder Decisions ────────────────────────────────────────────────────────

export async function recordFounderDecision(
  decisionId: string,
  selectedOption: string,
  decisionText: string,
  rationale: string | null,
  decisionStatus: FounderDecisionStatus
): Promise<FounderDecision> {
  const { data: existing } = await supabase
    .from('founder_decisions')
    .select('id')
    .eq('decision_id', decisionId)
    .maybeSingle();

  const payload = {
    decision_id: decisionId,
    selected_option: selectedOption,
    decision_text: decisionText,
    rationale,
    decision_status: decisionStatus,
    decided_at: new Date().toISOString(),
  };

  let data;
  let error;
  if (existing) {
    ({ data, error } = await supabase
      .from('founder_decisions')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single());
  } else {
    ({ data, error } = await supabase
      .from('founder_decisions')
      .insert(payload)
      .select()
      .single());
  }

  if (error) throw error;

  await supabase
    .from('decision_records')
    .update({
      founder_decision_id: data.id,
      status: 'founder_decided',
      updated_at: new Date().toISOString(),
    })
    .eq('id', decisionId);

  return data as FounderDecision;
}

// ─── Outcomes ─────────────────────────────────────────────────────────────────

export async function recordOutcome(
  decisionId: string,
  outcome: {
    outcome_status: OutcomeStatus;
    outcome_summary?: string;
    measured_result?: string;
    expected_result?: string;
    success_rating?: number;
    founder_assessment?: string;
    lessons_learned?: string;
  }
): Promise<Outcome> {
  const { data: existing } = await supabase
    .from('outcomes')
    .select('id')
    .eq('decision_id', decisionId)
    .maybeSingle();

  const payload = {
    decision_id: decisionId,
    ...outcome,
    recorded_at: new Date().toISOString(),
  };

  let data;
  let error;
  if (existing) {
    ({ data, error } = await supabase
      .from('outcomes')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single());
  } else {
    ({ data, error } = await supabase
      .from('outcomes')
      .insert(payload)
      .select()
      .single());
  }

  if (error) throw error;

  await supabase
    .from('decision_records')
    .update({
      outcome_id: data.id,
      status: 'outcome_available',
      updated_at: new Date().toISOString(),
    })
    .eq('id', decisionId);

  return data as Outcome;
}

// ─── Reasoning Events ─────────────────────────────────────────────────────────

export async function fetchReasoningEvents(
  projectId: string,
  relevanceStatus?: string
): Promise<ReasoningEvent[]> {
  let query = supabase
    .from('reasoning_events')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (relevanceStatus) {
    query = query.eq('relevance_status', relevanceStatus);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as ReasoningEvent[];
}

// ─── Mapper ────────────────────────────────────────────────────────────────────

function mapDecisionRecord(row: any): DecisionRecord {
  const dre = row.decision_reasoning_events || [];
  return {
    id: row.id,
    project_id: row.project_id,
    title: row.title,
    decision_type: row.decision_type as DecisionType,
    decision_question: row.decision_question,
    context_summary: row.context_summary,
    recommendation: row.recommendation,
    recommendation_summary: row.recommendation_summary,
    recommendation_confidence: row.recommendation_confidence,
    status: row.status as DecisionStatus,
    founder_decision_id: row.founder_decision_id,
    outcome_id: row.outcome_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    reasoning_events: dre.map((r: any) => ({
      id: r.id,
      decision_id: r.decision_id,
      reasoning_event_id: r.reasoning_event_id,
      relevance: r.relevance,
      influence_strength: r.influence_strength,
      influence_role: r.influence_role,
      created_at: r.created_at,
      reasoning_event: r.reasoning_event as ReasoningEvent,
    })),
    founder_decision: row.founder_decision as FounderDecision | undefined,
    outcome: row.outcome as Outcome | undefined,
  };
}
