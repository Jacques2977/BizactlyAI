/**
 * Canonical Pipeline Contracts — Milestone 0 (Brain Foundation)
 *
 * These types formalize the contracts between every stage of the unified
 * reasoning pipeline. Each stage receives a well-defined input and returns
 * a well-defined output. The ReasoningContext object moves through the
 * pipeline and is enriched by each stage.
 *
 * Pipeline flow:
 *   UserInput → SituationContext → IntentClassification → DecisionContext
 *            → ReasoningResult → CapabilityRequest → CapabilityResult
 *            → MemoryUpdate
 *
 * Stage ownership:
 *   1. UserInput          — Orchestrator receives raw user input
 *   2. SituationContext   — Reasoning stage determines what is happening
 *   3. IntentClassification — Reasoning stage determines interaction type
 *   4. DecisionContext    — Reasoning stage determines whether a decision is required
 *   5. ReasoningResult    — Reasoning stage produces options/recommendation/rationale
 *   6. CapabilityRequest  — Orchestrator determines whether Strategy/Execution is needed
 *   7. CapabilityResult   — Requested capability returns its specialized result
 *   8. MemoryUpdate       — Memory stage produces validated updates to business memory
 *
 * Capabilities (Strategy, Execution) are NOT independent intelligence layers.
 * They receive the ReasoningContext and produce specialized outputs based on it.
 */

// ─── Shared primitive types ────────────────────────────────────────────────────

export type InteractionType =
  | 'knowledge_question'
  | 'business_update'
  | 'decision'
  | 'strategy_request'
  | 'planning_request'
  | 'execution_request'
  | 'outcome_report'
  | 'general_conversation';

export type AILayer = 'discovery' | 'understanding' | 'strategy' | 'execution';

export type MaturityStage =
  | 'exploration'
  | 'validation'
  | 'planning'
  | 'building'
  | 'launch'
  | 'growth';

export type MarketBucket = 'proven' | 'emerging' | 'novel';

export type ClaimSource =
  | 'user_stated'
  | 'user_confirmed'
  | 'ai_inferred'
  | 'external_data'
  | 'repeated';

export interface DecisionOption {
  option: string;
  pros: string[];
  cons: string[];
  tradeoffs: string;
}

export interface StructuredRecommendation {
  recommendation: string;
  rationale: string;
  alternatives: string[];
  tradeoffs: string;
  confidence: number; // 0-1
}

// ─── Stage 1: UserInput ───────────────────────────────────────────────────────
//
// Owner: Orchestrator (received from client)
// Input: HTTP request body
// Output: Validated UserInput passed to context gathering

export interface UserInput {
  message: string;
  projectId: string;
  conversationId?: string;
  includeMemory?: boolean;
  bimContext?: string;
  contextStage?: string;
  contextConfidence?: number;
  contextHasStrategy?: boolean;
}

// ─── Stage 2: SituationContext ────────────────────────────────────────────────
//
// Owner: Reasoning stage (produced inside ReasoningOutput)
// Input: UserInput + loaded BIM memory
// Output: situation_analysis string + relevant_context array

export interface SituationContext {
  situation_analysis: string;
  relevant_context: string[];
}

// ─── Stage 3: IntentClassification ────────────────────────────────────────────
//
// Owner: Reasoning stage
// Output: InteractionType classification

export interface IntentClassification {
  intent: InteractionType;
}

// ─── Stage 4: DecisionContext ─────────────────────────────────────────────────
//
// Owner: Reasoning stage
// Output: Whether a decision is required, plus goals/constraints

export interface DecisionContext {
  is_decision: boolean;
  goals: string[];
  constraints: string[];
}

// ─── Stage 5: ReasoningResult ─────────────────────────────────────────────────
//
// Owner: Reasoning stage (single OpenAI call)
// Output: Complete structured reasoning — situation, intent, decision context,
//         options, recommendation, response text, and memory update instructions

export interface BIMUpdateInstructions {
  newClaims?: Array<{
    category: string;
    claim: string;
    value: string;
    source: ClaimSource;
    evidence?: string;
  }>;
  repeatedClaims?: Array<{ category: string; value: string; evidence?: string }>;
  confirmedClaims?: Array<{ category: string; value: string }>;
  changedClaims?: Array<{
    category: string;
    oldValue: string;
    newValue: string;
    newClaim: string;
  }>;
  newUnknowns?: Array<{ category: string; claim: string }>;
  resolvedUnknowns?: Array<{ category: string; answer: string }>;
  contradictions?: Array<{
    categoryA: string;
    claimA: string;
    categoryB: string;
    claimB: string;
    description: string;
    resolution?: string;
  }>;
  newGoals?: string[];
  newConstraints?: string[];
  newRisks?: string[];
  actions?: Array<{
    action: string;
    priority: 'low' | 'medium' | 'high';
    category: string;
    reasoning: string;
  }>;
  insights?: string[];
}

export interface ReasoningResult {
  // ── SituationContext (stage 2) ──
  situation_analysis: string;
  relevant_context: string[];
  // ── IntentClassification (stage 3) ──
  intent: InteractionType;
  // ── DecisionContext (stage 4) ──
  is_decision: boolean;
  goals: string[];
  constraints: string[];
  // ── Reasoning output (stage 5) ──
  decision_options?: DecisionOption[];
  recommendation?: StructuredRecommendation;
  response: string;
  // ── Memory update instructions (consumed by stage 8) ──
  bim_updates: BIMUpdateInstructions;
  // ── Maturity/market classification ──
  maturity_stage: MaturityStage;
  market_bucket?: MarketBucket;
  // ── Capability routing flags (consumed by stage 6) ──
  needs_strategy: boolean;
  needs_execution: boolean;
  // ── Understanding draft trigger ──
  generate_draft: boolean;
  draft_reason?: string;
  // ── Observations ──
  patterns: string[];
  missing_information: string[];
  potential_opportunities: string[];
  confidence_analysis: Record<string, number>;
}

// ─── Stage 6: CapabilityRequest ───────────────────────────────────────────────
//
// Owner: Orchestrator
// Output: A CapabilityRequest if a capability should be invoked, or a redirect

export type CapabilityType = 'strategy' | 'execution';

export interface CapabilityRequest {
  type: CapabilityType;
  reasoning: ReasoningResult;
}

export interface CapabilityRedirect {
  requestedLayer: AILayer;
  gaps: string[];
  blockers: string[];
}

// ─── Stage 7: CapabilityResult ───────────────────────────────────────────────
//
// Owner: Requested capability (Strategy or Execution)
// Input: CapabilityRequest (which includes ReasoningResult + BIM context)
// Output: Specialized result — strategy output or execution output + message

export interface StrategyCapabilityResult {
  message: string;
  strategy: StrategyOutputData;
}

export interface ExecutionCapabilityResult {
  message: string;
  execution: ExecutionOutputData;
}

export type CapabilityResult = StrategyCapabilityResult | ExecutionCapabilityResult;

export interface StrategyOutputData {
  generatedAt: string;
  version: number;
  lean_canvas?: {
    problem: string[];
    solution: string[];
    unique_value_proposition: string;
    unfair_advantage?: string;
    customer_segments: string[];
    key_metrics: string[];
    channels: string[];
    cost_structure: string[];
    revenue_streams: string[];
  };
  pricing?: {
    model: string;
    tiers: Array<{ name: string; price: string; features: string[]; target?: string }>;
    rationale: string;
  };
  positioning?: string;
  customer_acquisition?: {
    primary_channel: string;
    approach: string;
    tactics: string[];
  };
  recommendations?: string[];
  growth_strategy?: string[];
  validation_plans?: string[];
}

export interface ExecutionOutputData {
  generatedAt: string;
  version: number;
  mvp?: {
    goal: string;
    success_metric: string;
    features: Array<{ name: string; description: string; priority: string; effort: string }>;
  };
  roadmap?: Array<{
    phase: string;
    duration: string;
    goals: string[];
    features?: string[];
  }>;
  sprint_plan?: Array<{
    sprint: number;
    duration: string;
    goal: string;
    tasks: Array<{ task: string; type: string; effort?: string }>;
  }>;
  technical_specification?: string;
  marketing_checklist?: string[];
}

// ─── Stage 8: MemoryUpdate ────────────────────────────────────────────────────
//
// Owner: Memory stage (runs in background via EdgeRuntime.waitUntil)
// Input: ReasoningResult + optional CapabilityResult + synchronous draft
// Output: void (persists to database)

export interface MemoryUpdate {
  reasoning: ReasoningResult;
  strategy: StrategyOutputData | null;
  execution: ExecutionOutputData | null;
  synchronousDraft: unknown | null;
}

// ─── ReasoningContext ─────────────────────────────────────────────────────────
//
// The shared internal context object that moves through the pipeline.
// Each stage reads from and enriches this object.

export type PipelineStage =
  | 'user_input'
  | 'situation'
  | 'intent'
  | 'decision'
  | 'reasoning'
  | 'capability_request'
  | 'capability_result'
  | 'memory_update';

export interface ReasoningContext {
  userMessage: string;
  projectId: string;
  conversationId?: string;
  businessContext: unknown;
  memory: unknown;
  situation: string;
  relevantKnowledge: string[];
  interactionType: InteractionType;
  decisionRequired: boolean;
  goals: string[];
  constraints: string[];
  decision?: {
    options: DecisionOption[];
    recommendation?: StructuredRecommendation;
  };
  capabilityRequests: CapabilityRequest[];
  capabilityRedirect?: CapabilityRedirect;
  capabilityResult?: CapabilityResult;
  memoryUpdate?: MemoryUpdate;
  provenance: {
    completedStages: PipelineStage[];
    stageTimings: Record<PipelineStage, number>;
  };
}

// ─── Error/Fallback Contract ──────────────────────────────────────────────────

export interface PipelineError {
  stage: PipelineStage;
  message: string;
  recoverable: boolean;
  fallback?: unknown;
}

// ─── Boundary Validation ──────────────────────────────────────────────────────

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
 * Returns the validated object with fallbacks applied for missing fields.
 */
export function validateReasoningResult(
  raw: Partial<ReasoningResult>,
  fallback: ReasoningResult
): ReasoningResult {
  const intent = VALID_INTERACTION_TYPES.includes(raw.intent as InteractionType)
    ? (raw.intent as InteractionType)
    : fallback.intent;

  const response = typeof raw.response === 'string' && raw.response.length > 0
    ? raw.response
    : fallback.response;

  const is_decision = typeof raw.is_decision === 'boolean' ? raw.is_decision : false;
  const needs_strategy = typeof raw.needs_strategy === 'boolean' ? raw.needs_strategy : false;
  const needs_execution = typeof raw.needs_execution === 'boolean' ? raw.needs_execution : false;
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
        ? (raw.bim_updates as BIMUpdateInstructions)
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
