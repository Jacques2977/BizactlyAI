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

// ─── Shared primitive types (re-exported from project.ts for pipeline use) ─────

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
// Owner: Orchestrator (receives from client)
// Input: HTTP request body
// Output: Validated UserInput passed to context gathering

export interface UserInput {
  /** The user's message text. Required. */
  message: string;
  /** Project UUID. Required. */
  projectId: string;
  /** Conversation UUID for session tracking. Optional. */
  conversationId?: string;
  /** Whether to load BIM memory. Defaults to true. */
  includeMemory?: boolean;
  /** Pre-rendered BIM context string (client optimization). Optional. */
  bimContext?: string;
  /** Current context stage hint from client. Optional. */
  contextStage?: string;
  /** Current context confidence hint from client. Optional. */
  contextConfidence?: number;
  /** Whether strategy already exists. Optional. */
  contextHasStrategy?: boolean;
}

// ─── Stage 2: SituationContext ────────────────────────────────────────────────
//
// Owner: Reasoning stage (produced inside ReasoningOutput)
// Input: UserInput + loaded BIM memory
// Output: situation_analysis string + relevant_context array
//
// This is not a separate function — it's the first sub-step of the reasoning
// pipeline. The fields are carried inside ReasoningResult but their ownership
// belongs to the situation understanding step.

export interface SituationContext {
  /** 1-2 sentence summary of what's happening in the user's business right now. */
  situation_analysis: string;
  /** Key facts/assumptions from BIM relevant to this message. */
  relevant_context: string[];
}

// ─── Stage 3: IntentClassification ────────────────────────────────────────────
//
// Owner: Reasoning stage
// Input: UserInput + SituationContext (implicit, same LLM call)
// Output: InteractionType classification
//
// Single field on ReasoningResult. Determines which downstream paths activate.

export interface IntentClassification {
  /** The classified interaction type. Required. */
  intent: InteractionType;
}

// ─── Stage 4: DecisionContext ─────────────────────────────────────────────────
//
// Owner: Reasoning stage
// Input: UserInput + SituationContext + IntentClassification
// Output: Whether a decision is required, plus goals/constraints
//
// When is_decision is false, stages 5 (ReasoningResult options/recommendation)
// are skipped or minimal.

export interface DecisionContext {
  /** Whether a genuine decision with multiple viable paths exists. */
  is_decision: boolean;
  /** What the user is trying to accomplish. */
  goals: string[];
  /** Limitations or requirements that apply. */
  constraints: string[];
}

// ─── Stage 5: ReasoningResult ─────────────────────────────────────────────────
//
// Owner: Reasoning stage (single OpenAI call)
// Input: UserInput + full BIM context
// Output: Complete structured reasoning — situation, intent, decision context,
//         options, recommendation, response text, and memory updates
//
// This is the central intelligence output. Steps 2-4 are sub-steps within this
// single LLM call, but their contracts are documented separately above.

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
  /** Evaluated alternatives. Only populated when is_decision is true. */
  decision_options?: DecisionOption[];
  /** Recommendation with rationale. Populated when applicable. */
  recommendation?: StructuredRecommendation;
  /** The user-facing response text. Required. */
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

// ─── BIM Update Instructions ──────────────────────────────────────────────────
//
// Part of ReasoningResult. Consumed by the Memory Update stage (stage 8).
// These are instructions for how to update the Business Intelligence Model —
// not the updates themselves. The memory stage validates and applies them.

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

export type ClaimSource =
  | 'user_stated'
  | 'user_confirmed'
  | 'ai_inferred'
  | 'external_data'
  | 'repeated';

// ─── Stage 6: CapabilityRequest ───────────────────────────────────────────────
//
// Owner: Orchestrator
// Input: ReasoningResult (intent + needs_strategy/needs_execution flags)
// Output: A CapabilityRequest if a capability should be invoked, or null
//
// The orchestrator checks readiness gates before creating a request.
// If readiness is not met, it produces a redirect with gaps/blockers instead.

export type CapabilityType = 'strategy' | 'execution';

export interface CapabilityRequest {
  /** Which capability to invoke. */
  type: CapabilityType;
  /** The reasoning context to pass to the capability. */
  reasoning: ReasoningResult;
}

export interface CapabilityRedirect {
  /** The layer that was requested but not ready. */
  requestedLayer: AILayer;
  /** What's missing before this capability can be invoked. */
  gaps: string[];
  /** Hard blockers that must be resolved first. */
  blockers: string[];
}

// ─── Stage 7: CapabilityResult ───────────────────────────────────────────────
//
// Owner: Requested capability (Strategy or Execution)
// Input: CapabilityRequest (which includes ReasoningResult + BIM context)
// Output: Specialized result — strategy output or execution output + message
//
// Capabilities CONSUME the reasoning context. They do not independently
// classify intent, evaluate decisions, or update memory.

export interface StrategyCapabilityResult {
  message: string;
  strategy: StrategyOutputData;
}

export interface ExecutionCapabilityResult {
  message: string;
  execution: ExecutionOutputData;
}

export type CapabilityResult = StrategyCapabilityResult | ExecutionCapabilityResult;

// Strategy/Execution output shapes (mirrors of the edge function's internal types)
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
//
// The memory stage validates and applies BIM update instructions, persists
// strategy/execution outputs if generated, generates understanding drafts
// when triggered, and stores insights/actions in feedback history.

export interface MemoryUpdate {
  /** The reasoning result containing BIM update instructions. */
  reasoning: ReasoningResult;
  /** Strategy output if a strategy capability was invoked. */
  strategy: StrategyOutputData | null;
  /** Execution output if an execution capability was invoked. */
  execution: ExecutionOutputData | null;
  /** Draft generated synchronously (for immediate response). */
  synchronousDraft: unknown | null;
}

// ─── ReasoningContext ─────────────────────────────────────────────────────────
//
// The shared internal context object that moves through the pipeline.
// Each stage reads from and enriches this object. No stage invents its
// own incompatible representation.
//
// This is a conceptual contract — the edge function may use PipelineContext
// internally, but the fields and their ownership map to this structure.

export interface ReasoningContext {
  // ── Stage 1: UserInput ──
  userMessage: string;
  projectId: string;
  conversationId?: string;

  // ── Business context (loaded before reasoning) ──
  businessContext: unknown; // BIM + project data + feedback
  memory: unknown; // AIMemory

  // ── Stage 2: SituationContext ──
  situation: string;
  relevantKnowledge: string[];

  // ── Stage 3: IntentClassification ──
  interactionType: InteractionType;

  // ── Stage 4: DecisionContext ──
  decisionRequired: boolean;
  goals: string[];
  constraints: string[];

  // ── Stage 5: ReasoningResult ──
  decision?: {
    options: DecisionOption[];
    recommendation?: StructuredRecommendation;
  };

  // ── Stage 6: CapabilityRequest ──
  capabilityRequests: CapabilityRequest[];
  capabilityRedirect?: CapabilityRedirect;

  // ── Stage 7: CapabilityResult ──
  capabilityResult?: CapabilityResult;

  // ── Stage 8: MemoryUpdate ──
  memoryUpdate?: MemoryUpdate;

  // ── Provenance ──
  provenance: {
    /** Which stages have completed. */
    completedStages: PipelineStage[];
    /** Timestamps for each stage completion. */
    stageTimings: Record<PipelineStage, number>;
  };
}

export type PipelineStage =
  | 'user_input'
  | 'situation'
  | 'intent'
  | 'decision'
  | 'reasoning'
  | 'capability_request'
  | 'capability_result'
  | 'memory_update';

// ─── Error/Fallback Contract ──────────────────────────────────────────────────
//
// Every stage must handle failure gracefully. The fallback behavior is:
// 1. If a stage produces invalid output, use the fallback for that stage.
// 2. If the reasoning LLM call fails entirely, return a generic response.
// 3. If a capability fails, return the reasoning response without the
//    specialized output.
// 4. If memory update fails, log the error but still return the response
//    (memory update runs in the background).

export interface PipelineError {
  stage: PipelineStage;
  message: string;
  /** Whether the pipeline can continue after this error. */
  recoverable: boolean;
  /** Fallback value used when the error is recovered. */
  fallback?: unknown;
}
