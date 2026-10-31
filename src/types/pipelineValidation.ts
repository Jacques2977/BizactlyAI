/**
 * Pipeline Boundary Validation — Milestone 0
 *
 * Lightweight type guards that validate stage outputs at pipeline boundaries.
 * Not a validation framework — just enough to catch malformed LLM output
 * before it reaches the next stage.
 */

import type {
  ReasoningResult,
  InteractionType,
  CapabilityRequest,
  CapabilityResult,
  UserInput,
} from './pipeline';

const VALID_INTERACTION_TYPES: InteractionType[] = [
  'knowledge_question',
  'business_update',
  'decision',
  'strategy_request',
  'planning_request',
  'execution_request',
  'outcome_report',
  'general_conversation',
];

/**
 * Validates that a parsed reasoning output has the minimum required fields.
 * Returns the validated object or a fallback if critical fields are missing.
 */
export function validateReasoningResult(
  raw: Partial<ReasoningResult>,
  fallback: ReasoningResult
): ReasoningResult {
  // intent must be a known value
  const intent = VALID_INTERACTION_TYPES.includes(raw.intent as InteractionType)
    ? (raw.intent as InteractionType)
    : fallback.intent;

  // response is required — if missing, use fallback
  const response = typeof raw.response === 'string' && raw.response.length > 0
    ? raw.response
    : fallback.response;

  // is_decision defaults to false
  const is_decision = typeof raw.is_decision === 'boolean' ? raw.is_decision : false;

  // needs_strategy / needs_execution default to false
  const needs_strategy = typeof raw.needs_strategy === 'boolean' ? raw.needs_strategy : false;
  const needs_execution = typeof raw.needs_execution === 'boolean' ? raw.needs_execution : false;

  // generate_draft defaults to false
  const generate_draft = typeof raw.generate_draft === 'boolean' ? raw.generate_draft : false;

  return {
    situation_analysis: raw.situation_analysis ?? fallback.situation_analysis,
    relevant_context: Array.isArray(raw.relevant_context) ? raw.relevant_context : [],
    intent,
    is_decision,
    goals: Array.isArray(raw.goals) ? raw.goals : [],
    constraints: Array.isArray(raw.constraints) ? raw.constraints : [],
    decision_options: Array.isArray(raw.decision_options) ? raw.decision_options : undefined,
    recommendation:
      raw.recommendation && typeof raw.recommendation.recommendation === 'string'
        ? raw.recommendation
        : undefined,
    response,
    bim_updates:
      raw.bim_updates && typeof raw.bim_updates === 'object'
        ? raw.bim_updates
        : {},
    maturity_stage: raw.maturity_stage ?? fallback.maturity_stage,
    market_bucket: raw.market_bucket,
    needs_strategy,
    needs_execution,
    generate_draft,
    draft_reason: raw.draft_reason,
    patterns: Array.isArray(raw.patterns) ? raw.patterns : [],
    missing_information: Array.isArray(raw.missing_information) ? raw.missing_information : [],
    potential_opportunities: Array.isArray(raw.potential_opportunities) ? raw.potential_opportunities : [],
    confidence_analysis:
      raw.confidence_analysis && typeof raw.confidence_analysis === 'object'
        ? raw.confidence_analysis
        : {},
  };
}

/**
 * Validates that a capability request has the required shape.
 */
export function isValidCapabilityRequest(req: unknown): req is CapabilityRequest {
  if (!req || typeof req !== 'object') return false;
  const r = req as Record<string, unknown>;
  return (
    (r.type === 'strategy' || r.type === 'execution') &&
    r.reasoning !== undefined &&
    typeof r.reasoning === 'object'
  );
}

/**
 * Validates that a capability result has the required shape.
 */
export function isValidCapabilityResult(result: unknown): result is CapabilityResult {
  if (!result || typeof result !== 'object') return false;
  const r = result as Record<string, unknown>;
  return (
    typeof r.message === 'string' &&
    (r.strategy !== undefined || r.execution !== undefined)
  );
}

/**
 * Validates the raw user input from the HTTP request body.
 */
export function validateUserInput(body: unknown): UserInput | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  if (typeof b.message !== 'string' || b.message.length === 0) return null;
  if (typeof b.projectId !== 'string' || b.projectId.length === 0) return null;
  return {
    message: b.message,
    projectId: b.projectId,
    conversationId: typeof b.conversationId === 'string' ? b.conversationId : undefined,
    includeMemory: typeof b.includeMemory === 'boolean' ? b.includeMemory : true,
    bimContext: typeof b.bimContext === 'string' ? b.bimContext : undefined,
    contextStage: typeof b.contextStage === 'string' ? b.contextStage : undefined,
    contextConfidence: typeof b.contextConfidence === 'number' ? b.contextConfidence : undefined,
    contextHasStrategy: typeof b.contextHasStrategy === 'boolean' ? b.contextHasStrategy : undefined,
  };
}
