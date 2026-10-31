import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// ─── Milestone 0: Canonical Pipeline Contracts ─────────────────────────────────
// The pipeline-contracts module formalizes the types and validation for every
// pipeline stage: UserInput → SituationContext → IntentClassification →
// DecisionContext → ReasoningResult → CapabilityRequest → CapabilityResult →
// MemoryUpdate. See pipeline-contracts.ts for full documentation.
import {
  validateReasoningResult,
  validateUserInput,
  type UserInput,
  type ReasoningResult,
  type BIMUpdateInstructions,
  type InteractionType,
  type AILayer,
  type MaturityStage,
  type MarketBucket,
  type ClaimSource,
  type DecisionOption,
  type StructuredRecommendation,
} from "./pipeline-contracts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OPENAI_TIMEOUT_MS = 55000;

// ─── Architecture ──────────────────────────────────────────────────────────────
//
// UNIFIED REASONING ARCHITECTURE — Milestone 0 Canonical Pipeline
//
// Pipeline flow (see pipeline-contracts.ts for formal contracts):
//
//   Stage 1: UserInput          — Orchestrator receives raw user input
//   Stage 2: SituationContext    — Reasoning determines what is happening
//   Stage 3: IntentClassification — Reasoning determines interaction type
//   Stage 4: DecisionContext     — Reasoning determines if a decision is required
//   Stage 5: ReasoningResult     — Reasoning produces options/recommendation/rationale
//   Stage 6: CapabilityRequest   — Orchestrator determines whether Strategy/Execution is needed
//   Stage 7: CapabilityResult    — Requested capability returns its specialized result
//   Stage 8: MemoryUpdate        — Memory stage produces validated updates to business memory
//
// Strategy and Execution are CAPABILITIES invoked by the orchestrator — not
// independent intelligence layers. They receive the reasoning context and
// produce their specialized outputs based on it.
//
// BIM CONSTITUTION:
// Every piece of information is one of: FACT | ASSUMPTION | UNKNOWN | CONTRADICTION
// No capability may present an assumption as fact.
//
// ERROR/FALLBACK CONTRACT:
// - If reasoning LLM call fails: return generic response with fallback intent
// - If capability fails: return reasoning response without specialized output
// - If memory update fails: log error, still return response (runs in background)
// - If user input is invalid: return 400 with error message

// ─── Types ────────────────────────────────────────────────────────────────────

// Primitive types (ClaimSource, AILayer, MaturityStage, MarketBucket, InteractionType,
// DecisionOption, StructuredRecommendation) are imported from pipeline-contracts.ts.
// Only edge-function-specific types (ClaimStatus, BusinessClaim, BIM, etc.) remain here.

type ClaimStatus = "assumption" | "fact" | "unknown" | "invalidated";

interface BusinessClaim {
  id: string;
  category: string;
  claim: string;
  value: string;
  status: ClaimStatus;
  confidence: number;
  evidence: string[];
  sources: ClaimSource[];
  repetitionCount: number;
  firstSeenAt: string;
  lastUpdatedAt: string;
  promotedToFactAt?: string;
}

interface Contradiction {
  id: string;
  claimAId: string;
  claimBId: string;
  claimA: string;
  claimB: string;
  description: string;
  detectedAt: string;
  resolved: boolean;
  resolution?: string;
}

interface BusinessIntelligenceModel {
  facts: BusinessClaim[];
  assumptions: BusinessClaim[];
  unknowns: BusinessClaim[];
  contradictions: Contradiction[];
  goals: string[];
  constraints: string[];
  risks: string[];
  confidence_scores: Record<string, number>;
  maturity_stage: MaturityStage;
  market_bucket?: MarketBucket;
  draft_version: number;
  last_major_update: string;
  last_updated: string;
  version: number;
}

interface UnderstandingDraft {
  version: number;
  generatedAt: string;
  overallConfidence: number;
  facts: string[];
  assumptions: string[];
  unknowns: string[];
  goals: string[];
  constraints: string[];
  risks: string[];
  highlights?: string[];
  factCountAtGeneration: number;
  resolvedContradictionsAtGeneration: number;
  confidenceAtGeneration: number;
  maturityStage: MaturityStage;
}

interface LeanCanvas {
  problem: string[];
  solution: string[];
  unique_value_proposition: string;
  unfair_advantage?: string;
  customer_segments: string[];
  key_metrics: string[];
  channels: string[];
  cost_structure: string[];
  revenue_streams: string[];
}

interface PricingTier { name: string; price: string; features: string[]; target?: string }

interface StrategyOutput {
  generatedAt: string;
  version: number;
  lean_canvas?: LeanCanvas;
  pricing?: { model: string; tiers: PricingTier[]; rationale: string };
  positioning?: string;
  customer_acquisition?: { primary_channel: string; approach: string; tactics: string[] };
  recommendations?: string[];
  growth_strategy?: string[];
  validation_plans?: string[];
}

interface MVPFeature { name: string; description: string; priority: string; effort: string }
interface MVPSpec { goal: string; success_metric: string; features: MVPFeature[] }
interface RoadmapPhase { phase: string; duration: string; goals: string[]; features?: string[] }
interface Sprint { sprint: number; duration: string; goal: string; tasks: Array<{ task: string; type: string; effort?: string }> }

interface ExecutionOutput {
  generatedAt: string;
  version: number;
  mvp?: MVPSpec;
  roadmap?: RoadmapPhase[];
  sprint_plan?: Sprint[];
  technical_specification?: string;
  marketing_checklist?: string[];
}

interface AIMemory {
  founderProfile?: any;
  idea?: any;
  market?: any;
  businessModel?: any;
  product?: any;
  validation?: any;
  progress?: any;
  conversationContext?: any;
  bim?: BusinessIntelligenceModel;
  understandingDraft?: UnderstandingDraft;
  strategy?: StrategyOutput;
  execution?: ExecutionOutput;
}

interface BIMUpdates {
  newClaims?: Array<{ category: string; claim: string; value: string; source: ClaimSource; evidence?: string }>;
  repeatedClaims?: Array<{ category: string; value: string; evidence?: string }>;
  confirmedClaims?: Array<{ category: string; value: string }>;
  changedClaims?: Array<{ category: string; oldValue: string; newValue: string; newClaim: string }>;
  newUnknowns?: Array<{ category: string; claim: string }>;
  resolvedUnknowns?: Array<{ category: string; answer: string }>;
  contradictions?: Array<{ categoryA: string; claimA: string; categoryB: string; claimB: string; description: string; resolution?: string }>;
  newGoals?: string[];
  newConstraints?: string[];
  newRisks?: string[];
  actions?: Array<{ action: string; priority: string; category: string; reasoning: string }>;
  insights?: string[];
}

// ─── Decision Provenance Types (Milestone 2) ─────────────────────────────────
// Structured reasoning events and decision records for tracing:
// information → reasoning event → recommendation → founder decision → outcome

type ReasoningEventType =
  | "founder_constraint" | "founder_goal" | "founder_preference"
  | "business_fact" | "market_information" | "customer_information"
  | "financial_information" | "product_information" | "competitor_information"
  | "assumption" | "risk" | "opportunity" | "evidence"
  | "retrieved_memory" | "prior_decision" | "recommendation_factor"
  | "contradiction" | "outcome_signal" | "prior_learning" | "other";

type ReasoningEventRelevance =
  | "candidate" | "relevant" | "supporting" | "influential" | "decisive"
  | "irrelevant" | "superseded" | "contradicted" | "uncertain";

type InfluenceRole =
  | "constraint" | "supporting_evidence" | "opportunity" | "risk"
  | "assumption" | "founder_preference" | "business_fact" | "prior_learning"
  | "contradiction" | "decisive_factor";

interface CandidateReasoningEvent {
  event_type: ReasoningEventType;
  content: string;
  source: "founder_input" | "business_memory" | "retrieved_information" | "ai_inference";
  importance: "low" | "medium" | "high";
  relevance_status: ReasoningEventRelevance;
  confidence: number;
  influence_direction?: "supports" | "opposes" | "neutral";
  influence_strength?: "weak" | "moderate" | "strong";
  influence_role?: InfluenceRole;
  metadata?: Record<string, unknown>;
}

type DecisionType =
  | "product" | "pricing" | "customer" | "marketing" | "positioning"
  | "business_model" | "feature" | "MVP" | "launch" | "growth"
  | "resource_allocation" | "strategy" | "other";

interface DecisionDetectionResult {
  is_meaningful_decision: boolean;
  decision_type: DecisionType;
  decision_question: string;
  title: string;
  context_summary: string;
  recommendation_summary: string;
  recommendation_confidence: number;
  reasoning_events: CandidateReasoningEvent[];
}

// ─── Reasoning Output (steps 1-6) ─────────────────────────────────────────────
// The central reasoning intelligence produces this structured output for every
// message. Steps 5-7 are conditional based on intent.

// ReasoningOutput is structurally identical to ReasoningResult from
// pipeline-contracts.ts (Milestone 0). It extends ReasoningResult with
// Milestone 2 fields (reasoning_events, decision_detection) that are not
// part of the Milestone 0 contract.
interface ReasoningOutput {
  // ── Stage 2: SituationContext ──
  intent: InteractionType;
  situation_analysis: string;
  relevant_context: string[];
  // ── Stage 4: DecisionContext ──
  goals: string[];
  constraints: string[];
  is_decision: boolean;
  // ── Stage 5: ReasoningResult ──
  decision_options?: DecisionOption[];
  recommendation?: StructuredRecommendation;
  response: string;
  bim_updates: BIMUpdates;
  maturity_stage: MaturityStage;
  market_bucket?: MarketBucket;
  needs_strategy: boolean;
  needs_execution: boolean;
  generate_draft: boolean;
  draft_reason?: string;
  patterns: string[];
  missing_information: string[];
  potential_opportunities: string[];
  confidence_analysis: Record<string, number>;
  // ── Milestone 2: Decision Provenance (not part of Milestone 0 contract) ──
  reasoning_events?: CandidateReasoningEvent[];
  decision_detection?: DecisionDetectionResult;
}

// AIRequest is now UserInput from pipeline-contracts.ts (Milestone 0).
// Structurally identical to UserInput — aliased for backward compatibility.
type AIRequest = UserInput;

// PipelineContext is the internal representation of ReasoningContext (Milestone 0).
// It carries the user input, loaded business context, and infrastructure handles
// through the pipeline. Each stage reads from and enriches this object.
interface ProvenanceContext {
  decisions: Array<{
    id: string;
    title: string;
    decision_type: string;
    decision_question: string;
    recommendation: string | null;
    recommendation_summary: string | null;
    recommendation_confidence: number;
    status: string;
    created_at: string;
    founder_decision: {
      selected_option: string;
      decision_text: string;
      rationale: string | null;
      decision_status: string;
    } | null;
    outcome: {
      id: string;
      outcome_status: string;
      outcome_summary: string | null;
      success_rating: number | null;
      lessons_learned: string | null;
    } | null;
  }>;
  reasoningEvents: Array<{
    id: string;
    event_type: string;
    content: string;
    relevance_status: string;
    created_at: string;
  }>;
}

interface PipelineContext {
  user: any;
  supabase: any;
  openaiApiKey: string;
  request: AIRequest;
  project: any;
  memory: AIMemory;
  businessContext: any;
  recentFeedback: any[];
  filteredBim?: BusinessIntelligenceModel | undefined;
  provenanceContext?: ProvenanceContext | null;
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

async function mainHandler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing authorization header" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const openaiApiKey = Deno.env.get("OpenAI_Api_Key") || Deno.env.get("OpenAI_API_Key") || Deno.env.get("OPENAI_API_KEY");

  if (!openaiApiKey) {
    return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized", detail: authError?.message }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const url = new URL(req.url);
  const pathname = url.pathname;
  if (pathname.endsWith("/chat")) return await handleChat(req, openaiApiKey);
  if (pathname.endsWith("/chat-project-creation")) return await handleProjectCreationChat(req, openaiApiKey);

  const bodyText = await req.text();
  let body: any = {};
  try { body = JSON.parse(bodyText); } catch (_) { /* ignore */ }

  const syntheticReq = new Request(req.url, { method: req.method, headers: req.headers, body: bodyText });
  const route = body.route as string | undefined;
  if (route === "chat") return await handleChat(syntheticReq, openaiApiKey);
  if (route === "chat-project-creation") return await handleProjectCreationChat(syntheticReq, openaiApiKey);

  return await runProjectChatPipeline(syntheticReq, supabase, user, openaiApiKey);
}

Deno.serve(async (req: Request) => {
  try {
    return await mainHandler(req);
  } catch (err) {
    console.error("FATAL:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

// ─── Simple Chat Handlers (non-project) ──────────────────────────────────────

async function handleChat(req: Request, openaiApiKey: string): Promise<Response> {
  const { message, systemPrompt, maxTokens = 4096 } = await req.json();
  const response = await callOpenAI(openaiApiKey, [
    { role: "system", content: systemPrompt },
    { role: "user", content: message },
  ], maxTokens, 0.7);
  return jsonResponse({ response });
}

async function handleProjectCreationChat(req: Request, openaiApiKey: string): Promise<Response> {
  const { message, systemPrompt } = await req.json();
  const response = await callOpenAI(openaiApiKey, [
    { role: "system", content: systemPrompt },
    { role: "user", content: message },
  ], 4096, 0.7);
  return jsonResponse({ response });
}

// ─── Unified Project Chat Pipeline ────────────────────────────────────────────
// Every message flows through the same 8-step pipeline. The orchestrator is the
// central intelligence — Strategy and Execution are capabilities it invokes.

async function runProjectChatPipeline(
  req: Request,
  supabase: any,
  user: any,
  openaiApiKey: string
): Promise<Response> {
  // ── Stage 1: UserInput — validate raw input against contract ──
  const rawBody = await req.json();
  const validatedInput = validateUserInput(rawBody);
  if (!validatedInput) {
    return new Response(JSON.stringify({ error: "Invalid request: message and projectId are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const body: AIRequest = validatedInput;
  const { message, projectId, includeMemory = true } = body;

  // ── Step 2: Relevant Business Context Retrieval ──
  // BIM is loaded before reasoning begins.
  const context = await gatherContext(supabase, user, projectId, includeMemory);
  if (!context) {
    return new Response(JSON.stringify({ error: "Project not found or access denied" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const ctx: PipelineContext = { user, supabase, openaiApiKey, request: body, ...context };

  // ── Step 2b: Selective Business Memory Retrieval ──
  // The full BIM remains in ctx.memory.bim for memory updates, readiness checks,
  // and persistence. The filtered BIM is used only for prompt construction.
  ctx.filteredBim = selectRelevantBIM(ctx.memory.bim, message);

  // ── Step 2c: Provenance Retrieval (Milestone 3) ──
  // Retrieve relevant prior decisions, founder decisions, outcomes, and reasoning
  // events for this project. This is additive context — it does not replace the BIM.
  try {
    ctx.provenanceContext = await retrieveRelevantProvenance(ctx.supabase, projectId, message);
  } catch (err) {
    console.error("Provenance retrieval failed:", err);
    ctx.provenanceContext = null;
  }

  // ── Steps 1-6: Central Reasoning Pipeline ──
  const reasoning = await runReasoningPipeline(ctx, message);

  // ── Step 7: Specialized Output ──
  let strategyResult: { message: string; strategy: StrategyOutput } | null = null;
  let executionResult: { message: string; execution: ExecutionOutput } | null = null;
  let redirectInfo: { requestedLayer: AILayer; gaps: string[]; blockers: string[] } | null = null;

  if (reasoning.needs_strategy && reasoning.intent === "strategy_request") {
    const readiness = checkStrategyReadiness(ctx.memory.bim, reasoning.maturity_stage);
    if (readiness.ready) {
      strategyResult = await invokeStrategyCapability(ctx, reasoning);
    } else {
      redirectInfo = { requestedLayer: "strategy", gaps: readiness.gaps, blockers: readiness.blockers };
    }
  }

  if (reasoning.needs_execution && reasoning.intent === "execution_request" && !redirectInfo) {
    const readiness = checkExecutionReadiness(ctx.memory.bim, reasoning.maturity_stage, !!ctx.memory.strategy);
    if (readiness.ready) {
      executionResult = await invokeExecutionCapability(ctx, reasoning);
    } else {
      redirectInfo = { requestedLayer: "execution", gaps: readiness.gaps, blockers: readiness.blockers };
    }
  }

  // ── Build Response (preserve UI contract) ──
  let layer: AILayer = "discovery";
  let layerOutput: { draft?: UnderstandingDraft; strategy?: StrategyOutput; execution?: ExecutionOutput } | null = null;
  let hasDraft = false;
  let responseMessage = reasoning.response;
  let synchronousDraft: UnderstandingDraft | null = null;

  if (strategyResult) {
    layer = "strategy";
    layerOutput = { strategy: strategyResult.strategy };
    responseMessage = strategyResult.message;
  } else if (executionResult) {
    layer = "execution";
    layerOutput = { execution: executionResult.execution };
    responseMessage = executionResult.message;
  } else if (reasoning.intent === "knowledge_question" && reasoning.generate_draft && ctx.memory.bim && ctx.memory.bim.facts.length + ctx.memory.bim.assumptions.length > 0) {
    // Summary request — generate draft synchronously so it's in the response
    layer = "understanding";
    synchronousDraft = generateDraft(ctx.memory.bim, ctx.memory.understandingDraft);
    layerOutput = { draft: synchronousDraft };
  } else if (reasoning.generate_draft) {
    hasDraft = true;
  }

  // ── Step 8: Memory Update (background) ──
  EdgeRuntime.waitUntil(
    runMemoryUpdate(ctx, reasoning, strategyResult?.strategy ?? null, executionResult?.execution ?? null, synchronousDraft)
  );

  // ── Milestone 4: Outcome-Derived Learning Signal ──
  // Deterministically synthesize a prior_learning event from the retrieved provenance
  // when a decision with a positive/negative/mixed outcome exists. This is code-generated
  // from real outcome data, not invented by the LLM, ensuring grounding and traceability.
  // Any LLM-produced prior_learning events are removed and replaced with the deterministic
  // one, since the LLM cannot be trusted to provide correct traceability IDs.
  const learningEvent = synthesizeLearningEvent(ctx.provenanceContext);
  if (reasoning.reasoning_events) {
    reasoning.reasoning_events = reasoning.reasoning_events.filter(e => e.event_type !== "prior_learning");
  }
  if (learningEvent) {
    if (!reasoning.reasoning_events) reasoning.reasoning_events = [];
    reasoning.reasoning_events.push(learningEvent);
  }

  // ── Milestone 2: Decision Provenance (background) ──
  // Persist candidate reasoning events for all messages; create decision records
  // only when a meaningful decision is detected.
  let decisionProvenance: { decision_record_id?: string; reasoning_event_ids?: string[] } = {};
  const hasCandidateEvents = (reasoning.reasoning_events?.length ?? 0) > 0;
  const hasMeaningfulDecision = reasoning.decision_detection?.is_meaningful_decision === true;
  if (hasCandidateEvents || hasMeaningfulDecision) {
    try {
      decisionProvenance = await persistDecisionProvenance(ctx, reasoning);
    } catch (err) {
      console.error("Decision provenance persistence failed:", err);
    }
  }

  // ── Milestone 3: Outcome Linking ──
  // When a user reports an outcome, link it to the relevant prior decision.
  let outcomeLink: { decision_record_id?: string; outcome_id?: string } | null = null;
  if (reasoning.intent === "outcome_report") {
    try {
      outcomeLink = await linkOutcomeToDecision(ctx, reasoning);
    } catch (err) {
      console.error("Outcome linking failed:", err);
    }
  }

  return jsonResponse({
    response: responseMessage,
    layer,
    layer_output: layerOutput,
    orchestrator: reasoning.situation_analysis,
    orchestrator_gaps: redirectInfo?.gaps ?? [],
    orchestrator_blockers: redirectInfo?.blockers ?? [],
    requested_layer: redirectInfo?.requestedLayer ?? null,
    hasDraft,
    memoryUpdated: true,
    intent: reasoning.intent,
    recommendations: reasoning.recommendation ? [reasoning.recommendation] : [],
    is_decision: reasoning.is_decision,
    decision_options: reasoning.decision_options ?? [],
    decision_record_id: decisionProvenance.decision_record_id ?? outcomeLink?.decision_record_id ?? null,
    reasoning_event_ids: decisionProvenance.reasoning_event_ids ?? [],
  });
}

// ─── Steps 1-6: Reasoning Pipeline ─────────────────────────────────────────────
// The central intelligence. A single OpenAI call that classifies intent, analyzes
// the situation, evaluates decisions, produces recommendations, and extracts
// memory updates — all before any specialized capability is invoked.

async function runReasoningPipeline(ctx: PipelineContext, message: string): Promise<ReasoningOutput> {
  const prompt = buildReasoningPrompt(ctx);
  const rawOutput = await callOpenAI(ctx.openaiApiKey, [
    { role: "system", content: prompt },
    { role: "user", content: message },
  ], 3500, 0.4);

  return parseReasoningOutput(rawOutput, ctx.memory.bim);
}

function buildReasoningPrompt(ctx: PipelineContext): string {
  const { project, memory } = ctx;
  const bim = memory.bim;
  const promptBim = ctx.filteredBim ?? bim;
  const bimContext = ctx.request.bimContext ?? buildBIMContext(promptBim, project.title || "Untitled", project.description);
  const overall = bim ? Math.round(getOverallConfidence(bim) * 100) : 0;
  const draftInfo = memory.understandingDraft
    ? `Last draft: v${memory.understandingDraft.version} at ${memory.understandingDraft.confidenceAtGeneration}% confidence with ${memory.understandingDraft.factCountAtGeneration} facts.`
    : "No draft yet.";
  const strategyInfo = memory.strategy ? `Strategy exists (v${memory.strategy.version}).` : "No strategy yet.";
  const executionInfo = memory.execution ? `Execution plan exists (v${memory.execution.version}).` : "No execution plan yet.";

  const provenanceBlock = buildProvenanceBlock(ctx.provenanceContext);
  const feedbackBlock = buildFeedbackBlock(ctx.recentFeedback);
  const businessContextBlock = buildBusinessContextBlock(ctx.businessContext);

  return `You are the central reasoning intelligence of Bizactly, a persistent business intelligence partner for founders.
You are an experienced founder and operator who has built, advised, and invested in dozens of startups.
You think clearly, speak directly, and engage with the actual idea — not the process of understanding it.

You receive the user's latest message and the current Business Intelligence Model (BIM).

YOUR PROCESS (internal — never expose these steps to the user):

1. SITUATION UNDERSTANDING: What is the user telling you? What's happening in their business right now? What changed since last time?

2. RELEVANT CONTEXT: Which facts, assumptions, and unknowns from the BIM are relevant to this message?

3. INTENT CLASSIFICATION: Classify this interaction as exactly one:
   - knowledge_question: Asking what you know, for a summary, or for information about the business
   - business_update: Sharing new information (metrics, progress, changes, team, funding, customer feedback)
   - decision: Facing a choice with multiple viable paths (pricing model, target customer, feature priority, go-to-market channel)
   - strategy_request: Wants strategic framework (Lean Canvas, pricing, positioning, go-to-market)
   - planning_request: Wants to know what to do next or wants a high-level plan
   - execution_request: Wants MVP, roadmap, sprint plan, technical spec, marketing checklist
   - outcome_report: Reporting results of something they tried (launched, tested, measured, failed, succeeded)
   - general_conversation: Greeting, meta-discussion, or anything that doesn't fit above

4. GOALS & CONSTRAINTS: What is the user trying to accomplish? What constraints apply?

5. DECISION EVALUATION (only when is_decision=true): If a genuine decision exists, evaluate the viable alternatives with pros, cons, and tradeoffs.

6. RECOMMENDATION (when applicable): If recommending, provide rationale, alternatives considered, tradeoffs, and confidence.

7. RESPONSE: Write your response to the user. Conversational, direct, confident. Like a YC partner in office hours.
   - Include rationale when giving recommendations, but NEVER expose internal reasoning steps, step names, or process.
   - For knowledge_question: answer directly from what you know. Do not manufacture options or recommendations.
   - For business_update: acknowledge the update, reflect on what it means, do not over-analyze or generate recommendations unless asked.
   - For decision: present the options and your recommendation with rationale.
   - For outcome_report: compare results against what was expected, extract learnings, feed back into the model.
   - For strategy_request: acknowledge the request. Set needs_strategy=true. If readiness is clearly not met, explain what's needed first.
   - For execution_request: acknowledge the request. Set needs_execution=true. If readiness is clearly not met, explain what's needed first.
   - For planning_request: suggest next steps based on what you know.
   - For general_conversation: respond naturally.

8. REASONING EVENTS: Extract 1-5 concise, decision-relevant artifacts from this interaction.
   Each event captures a specific piece of information that influenced (or could influence) a business decision.
   Events are NOT internal reasoning or chain-of-thought — they are structured, factual observations.
   Examples:
   - founder_constraint: "Founder has $10K budget for first 3 months"
   - business_fact: "Current MRR is $2K from 8 customers"
   - market_information: "Two competitors offer freemium tiers"
   - assumption: "Assuming customer acquisition cost under $50"
   NOTE: prior_learning events are generated automatically by the system from recorded outcomes. Do NOT produce prior_learning events yourself.
   NOT: "I think the founder should consider freemium because..."
   For each event set: event_type, content (one sentence), source, importance, relevance_status, confidence.
   Add influence_direction/influence_strength/influence_role only when a recommendation is being made.

9. DECISION DETECTION: Determine whether this interaction involves a meaningful business decision.
   A meaningful decision is a genuine choice between viable paths that the founder must commit to
   (pricing model, target customer, feature priority, go-to-market channel, build vs buy, etc.).
   Set is_meaningful_decision=true ONLY when the user faces a concrete choice with real consequences
   AND you are providing a recommendation on which path to take.
   Do NOT set it true for knowledge questions, business updates, strategy requests, or general conversation.
   When is_meaningful_decision=true, fill all decision_detection fields.

CRITICAL RULES:
- Do NOT force every message to be a decision. Most messages are updates or questions, not decisions.
- A knowledge question gets a direct answer, not artificial options.
- A business update extracts facts — no need for recommendations unless explicitly asked.
- Only set is_decision=true when a genuine choice with multiple viable paths exists.
- Only set needs_strategy=true when intent is strategy_request.
- Only set needs_execution=true when intent is execution_request.
- Never present an assumption as a fact.
- Never use "unknown", "not yet defined", "N/A", "TBD", "not specified" in claim text. Frame gaps as open questions.
- Sound like you've thought about this space before. No hollow affirmations. No "great question". No "that's interesting".

BIM CONSTITUTION — classify every piece of information as one of:
- CONFIRMED (fact): validated, high-confidence information
- HYPOTHESIS (assumption): working assumption being tested, needs validation
- INVESTIGATING (unknown): active question being explored — phrase as a question
- NEEDS RESOLUTION (contradiction): conflicting signals that must be resolved

MATURITY STAGE CRITERIA:
- exploration: idea exists, problem unclear, no customer confirmed
- validation: has problem + customer hypothesis, testing assumptions
- planning: problem + customer validated, solution direction clear
- building: strategy exists, actively developing product
- launch: product ready or launching
- growth: product live, optimising

MARKET BUCKET:
- proven: established market with known competitors (CRM, accounting software)
- emerging: market forming but not mature (AI agents, AI coworkers)
- novel: no established market — first validate problem exists

DRAFT TRIGGER — set generate_draft=true ONLY when:
1. Confidence changes > 10% since last draft
2. A major contradiction is found or resolved
3. A new major business area is discovered (new category with fact/assumption)
4. User explicitly requested a summary or overview
5. No draft exists yet AND we have >= 3 assumptions or >= 1 fact

${bim?.market_bucket === "proven"
  ? `MARKET LENS: PROVEN MARKET. The problem exists — incumbents proved it. Push on differentiation and customer specificity.`
  : bim?.market_bucket === "emerging"
  ? `MARKET LENS: EMERGING MARKET. The category is forming. Validate both problem existence and differentiation.`
  : bim?.market_bucket === "novel"
  ? `MARKET LENS: NOVEL MARKET. No established playbook. First validate that the problem exists at all.`
  : ``}

CURRENT STATE: ${overall}% confidence | Stage: ${bim?.maturity_stage ?? "exploration"} | ${draftInfo} | ${strategyInfo} | ${executionInfo}

${bimContext}
${businessContextBlock}${feedbackBlock}${provenanceBlock}
OUTPUT — return ONLY this JSON:
{
  "intent": "knowledge_question|business_update|decision|strategy_request|planning_request|execution_request|outcome_report|general_conversation",
  "situation_analysis": "1-2 sentences: what's happening in the user's business right now",
  "relevant_context": ["key facts/assumptions from BIM relevant to this message"],
  "goals": ["what the user is trying to accomplish"],
  "constraints": ["limitations or requirements that apply"],
  "is_decision": false,
  "decision_options": [{"option": "...", "pros": ["..."], "cons": ["..."], "tradeoffs": "..."}],
  "recommendation": {
    "recommendation": "the recommended path",
    "rationale": "why this is recommended",
    "alternatives": ["other options considered"],
    "tradeoffs": "key tradeoffs in this recommendation",
    "confidence": 0.0
  },
  "response": "Your response to the user. 3-6 sentences. Conversational, direct. Never expose internal reasoning steps.",
  "bim_updates": {
    "newClaims": [{"category": "target_customer|problem|solution|revenue_model|pricing|channel|competitor|team|market_size|feature|metric|other", "claim": "...", "value": "...", "source": "user_stated|ai_inferred|user_confirmed|external_data", "evidence": "optional"}],
    "repeatedClaims": [{"category": "...", "value": "...", "evidence": "optional"}],
    "confirmedClaims": [{"category": "...", "value": "..."}],
    "changedClaims": [{"category": "...", "oldValue": "...", "newValue": "...", "newClaim": "..."}],
    "newUnknowns": [{"category": "...", "claim": "active question to investigate — phrased as a question"}],
    "resolvedUnknowns": [{"category": "...", "answer": "..."}],
    "contradictions": [{"categoryA": "...", "claimA": "...", "categoryB": "...", "claimB": "...", "description": "..."}],
    "newGoals": ["goal"],
    "newConstraints": ["constraint"],
    "newRisks": ["risk"],
    "actions": [{"action": "...", "priority": "low|medium|high", "category": "...", "reasoning": "..."}],
    "insights": ["specific observation under 100 chars"]
  },
  "maturity_stage": "exploration|validation|planning|building|launch|growth",
  "market_bucket": "proven|emerging|novel",
  "needs_strategy": false,
  "needs_execution": false,
  "generate_draft": false,
  "draft_reason": "why or null",
  "patterns": ["specific pattern observed — max 3"],
  "missing_information": ["phrased as an active question — max 3"],
  "potential_opportunities": ["specific opportunity — max 2"],
  "confidence_analysis": {"category": 0.0},
  "reasoning_events": [
    {
      "event_type": "founder_constraint|founder_goal|founder_preference|business_fact|market_information|customer_information|financial_information|product_information|competitor_information|assumption|risk|opportunity|evidence|retrieved_memory|prior_decision|recommendation_factor|contradiction|outcome_signal|other",
      "content": "one sentence factual observation",
      "source": "founder_input|business_memory|retrieved_information|ai_inference",
      "importance": "low|medium|high",
      "relevance_status": "candidate|relevant|supporting|influential|decisive|irrelevant",
      "confidence": 0.5,
      "influence_direction": "supports|opposes|neutral",
      "influence_strength": "weak|moderate|strong",
      "influence_role": "constraint|supporting_evidence|opportunity|risk|assumption|founder_preference|business_fact|prior_learning|contradiction|decisive_factor"
    }
  ],
  "decision_detection": {
    "is_meaningful_decision": false,
    "decision_type": "product|pricing|customer|marketing|positioning|business_model|feature|MVP|launch|growth|resource_allocation|strategy|other",
    "decision_question": "the specific question being decided",
    "title": "short label 2-5 words",
    "context_summary": "1-2 sentences of business context",
    "recommendation_summary": "1 sentence recommendation summary",
    "recommendation_confidence": 0.5
  }
}
Include reasoning_events for every message (1-5 events). Include decision_detection for every message — set is_meaningful_decision=false for non-decisions. Only include arrays with items. Return valid JSON only.`;
}

// ─── Milestone 2: Provenance Validation ───────────────────────────────────────
// Normalizes LLM-produced provenance fields so malformed data never crashes
// the main AI response. Invalid optional fields are dropped silently.

const VALID_EVENT_TYPES = new Set<ReasoningEventType>([
  "founder_constraint", "founder_goal", "founder_preference", "business_fact",
  "market_information", "customer_information", "financial_information",
  "product_information", "competitor_information", "assumption", "risk",
  "opportunity", "evidence", "retrieved_memory", "prior_decision",
  "recommendation_factor", "contradiction", "outcome_signal", "prior_learning", "other",
]);

const VALID_RELEVANCE = new Set<ReasoningEventRelevance>([
  "candidate", "relevant", "supporting", "influential", "decisive",
  "irrelevant", "superseded", "contradicted", "uncertain",
]);

const VALID_SOURCES = new Set(["founder_input", "business_memory", "retrieved_information", "ai_inference"]);
const VALID_IMPORTANCE = new Set(["low", "medium", "high"]);

function normalizeReasoningEvents(raw: unknown): CandidateReasoningEvent[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const events: CandidateReasoningEvent[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const e = item as Record<string, unknown>;
    const content = typeof e.content === "string" && e.content.length > 0 ? e.content : null;
    if (!content) continue;
    const event_type = (typeof e.event_type === "string" && VALID_EVENT_TYPES.has(e.event_type as ReasoningEventType))
      ? e.event_type as ReasoningEventType : "other";
    const source = (typeof e.source === "string" && VALID_SOURCES.has(e.source))
      ? e.source as CandidateReasoningEvent["source"] : "founder_input";
    const importance = (typeof e.importance === "string" && VALID_IMPORTANCE.has(e.importance))
      ? e.importance as "low" | "medium" | "high" : "medium";
    const relevance_status = (typeof e.relevance_status === "string" && VALID_RELEVANCE.has(e.relevance_status as ReasoningEventRelevance))
      ? e.relevance_status as ReasoningEventRelevance : "candidate";
    const confidence = typeof e.confidence === "number" && e.confidence >= 0 && e.confidence <= 1
      ? e.confidence : 0.5;
    events.push({
      event_type,
      content,
      source,
      importance,
      relevance_status,
      confidence,
      influence_direction: typeof e.influence_direction === "string" ? e.influence_direction as CandidateReasoningEvent["influence_direction"] : undefined,
      influence_strength: typeof e.influence_strength === "string" ? e.influence_strength as CandidateReasoningEvent["influence_strength"] : undefined,
      influence_role: typeof e.influence_role === "string" ? e.influence_role as InfluenceRole : undefined,
      metadata: (e.metadata && typeof e.metadata === "object" && !Array.isArray(e.metadata)) ? e.metadata as Record<string, unknown> : undefined,
    });
    if (events.length >= 10) break;
  }
  return events.length > 0 ? events : undefined;
}

const VALID_DECISION_TYPES = new Set<DecisionType>([
  "product", "pricing", "customer", "marketing", "positioning", "business_model",
  "feature", "MVP", "launch", "growth", "resource_allocation", "strategy", "other",
]);

function normalizeDecisionDetection(raw: unknown): DecisionDetectionResult | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const d = raw as Record<string, unknown>;
  const is_meaningful_decision = d.is_meaningful_decision === true;
  if (!is_meaningful_decision) {
    return {
      is_meaningful_decision: false,
      decision_type: "other",
      decision_question: "",
      title: "",
      context_summary: "",
      recommendation_summary: "",
      recommendation_confidence: 0.5,
      reasoning_events: [],
    };
  }
  const decision_type = (typeof d.decision_type === "string" && VALID_DECISION_TYPES.has(d.decision_type as DecisionType))
    ? d.decision_type as DecisionType : "other";
  const decision_question = typeof d.decision_question === "string" ? d.decision_question : "";
  const title = typeof d.title === "string" ? d.title : "";
  const context_summary = typeof d.context_summary === "string" ? d.context_summary : "";
  const recommendation_summary = typeof d.recommendation_summary === "string" ? d.recommendation_summary : "";
  const recommendation_confidence = typeof d.recommendation_confidence === "number" && d.recommendation_confidence >= 0 && d.recommendation_confidence <= 1
    ? d.recommendation_confidence : 0.5;
  return {
    is_meaningful_decision: true,
    decision_type,
    decision_question,
    title,
    context_summary,
    recommendation_summary,
    recommendation_confidence,
    reasoning_events: [],
  };
}

// ─── Stages 2-5: Reasoning Pipeline (boundary validation) ─────────────────────
// parseReasoningOutput validates the LLM output against the ReasoningResult
// contract using validateReasoningResult from pipeline-contracts.ts.
// Milestone 2 fields (reasoning_events, decision_detection) are validated
// separately and are not part of the Milestone 0 contract.
function parseReasoningOutput(raw: string, bim?: BusinessIntelligenceModel): ReasoningOutput {
  const fallback: ReasoningOutput = {
    intent: "general_conversation",
    situation_analysis: "Analyzing message.",
    relevant_context: [],
    goals: [],
    constraints: [],
    is_decision: false,
    response: raw.substring(0, 500),
    bim_updates: {},
    maturity_stage: bim?.maturity_stage ?? "exploration",
    needs_strategy: false,
    needs_execution: false,
    generate_draft: false,
    patterns: [],
    missing_information: [],
    potential_opportunities: [],
    confidence_analysis: {},
  };

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as Partial<ReasoningOutput>;
      // ── Milestone 0: validate against ReasoningResult contract ──
      const validated = validateReasoningResult(parsed as Partial<ReasoningResult>, fallback as ReasoningResult) as ReasoningOutput;
      // ── Milestone 2: validate/normalize provenance fields ──
      const result: ReasoningOutput = {
        ...validated,
        reasoning_events: normalizeReasoningEvents(parsed.reasoning_events),
        decision_detection: normalizeDecisionDetection(parsed.decision_detection),
      };
      return result;
    }
  } catch (_) { /* fall through */ }
  return fallback;
}

// ─── Stage 6: CapabilityRequest — Orchestrator determines whether Strategy/Execution is needed ──

// ─── Stage 7: CapabilityResult — Strategy Capability ───────────────────────────
// Invoked by the orchestrator when intent is strategy_request and readiness is met.
// Receives the reasoning context — does not independently gather information.
// Capabilities CONSUME the reasoning context; they do not classify intent,
// evaluate decisions, or update memory.
async function invokeStrategyCapability(
  ctx: PipelineContext,
  reasoning: ReasoningOutput
): Promise<{ message: string; strategy: StrategyOutput }> {
  const prompt = buildStrategyPrompt(ctx, reasoning);
  const rawOutput = await callOpenAI(ctx.openaiApiKey, [
    { role: "system", content: prompt },
    { role: "user", content: ctx.request.message },
  ], 4096, 0.6);

  return parseStrategyOutput(rawOutput, ctx.memory.strategy);
}

function buildStrategyPrompt(ctx: PipelineContext, reasoning: ReasoningOutput): string {
  const { project, memory } = ctx;
  const bim = memory.bim;
  const promptBim = ctx.filteredBim ?? bim;
  const bimContext = ctx.request.bimContext ?? buildBIMContext(promptBim, project.title || "Untitled", project.description);
  const existingStrategy = memory.strategy
    ? `\nEXISTING STRATEGY (v${memory.strategy.version}): update or refine it.\n${JSON.stringify(memory.strategy, null, 2)}`
    : "";

  const reasoningBlock = `
REASONING CONTEXT (from the orchestrator):
- Situation: ${reasoning.situation_analysis}
- Goals: ${reasoning.goals.join("; ") || "(none specified)"}
- Constraints: ${reasoning.constraints.join("; ") || "(none specified)"}
- Relevant context: ${reasoning.relevant_context.join("; ") || "(none)"}
${reasoning.is_decision && reasoning.decision_options ? `- Decision evaluated:\n${reasoning.decision_options.map(o => `  • ${o.option} — pros: ${o.pros.join(", ")}; cons: ${o.cons.join(", ")}; tradeoffs: ${o.tradeoffs}`).join("\n")}` : ""}
${reasoning.recommendation ? `- Orchestrator recommendation: ${reasoning.recommendation.recommendation} (${Math.round(reasoning.recommendation.confidence * 100)}% confidence)` : ""}`;

  return `You are the Strategy Capability of Bizactly's AI system, invoked by the central reasoning intelligence.

YOUR IDENTITY:
- You receive validated business understanding and create strategic frameworks.
- You CONSUME information — you never gather it. The BIM is your source of truth.
- You make grounded decisions from what is known. Where gaps exist, make a reasoned assumption
  and label it explicitly with [ASSUMPTION — validate before committing].
- You do NOT ask discovery questions. You do NOT output placeholder text.
- You create: Lean Canvas, Pricing, Positioning, Customer Acquisition Strategy, Validation Plans.

FORBIDDEN PHRASES — never appear in your output:
"unknown", "not yet defined", "N/A", "TBD", "to be determined", "not specified",
"not identified", "no information". Make a specific, labeled assumption instead.

BUSINESS MATURITY STAGE: ${reasoning.maturity_stage.toUpperCase()}
PROJECT: ${project.title || "Untitled"}${project.description ? `\nDESCRIPTION: ${project.description}` : ""}

${reasoningBlock}

CURRENT BIM (source of truth):
${bimContext}
${existingStrategy}

TASK: Build or update the full strategic framework. Every field must be filled with either
a grounded decision or a labeled assumption — never left blank or vague.
Be specific to this business, not generic. Distinguish facts from assumptions throughout.
Incorporate the orchestrator's reasoning context — the goals, constraints, and any decision
evaluation should inform the strategy you produce.

OUTPUT FORMAT — return ONLY this JSON:
{
  "message": "2-3 paragraph strategic overview — what was decided, which assumptions underpin it, what to validate first",
  "strategy": {
    "generatedAt": "${new Date().toISOString()}",
    "version": ${(memory.strategy?.version ?? 0) + 1},
    "lean_canvas": {
      "problem": ["top 3 specific problems — from BIM or reasoned assumption"],
      "solution": ["how you solve each problem — be concrete"],
      "unique_value_proposition": "clear, specific UVP for this exact business",
      "unfair_advantage": "what cannot be easily copied — or [ASSUMPTION] if unclear",
      "customer_segments": ["specific segments — not 'everyone'"],
      "key_metrics": ["specific metrics that prove this is working"],
      "channels": ["specific channels to reach these customers"],
      "cost_structure": ["main cost drivers"],
      "revenue_streams": ["specific revenue sources with rough sizing"]
    },
    "pricing": {
      "model": "freemium|subscription|usage|one-time|hybrid",
      "tiers": [{"name": "...", "price": "$X/mo", "features": ["..."], "target": "who this tier is for"}],
      "rationale": "why this pricing model fits this market and customer"
    },
    "positioning": "For [specific customer] who [specific need], [product] is [category] that [specific benefit]. Unlike [specific alternative], [product] [specific differentiator].",
    "customer_acquisition": {
      "primary_channel": "the single most cost-effective first channel",
      "approach": "specific acquisition approach",
      "tactics": ["specific tactic 1", "specific tactic 2", "specific tactic 3"]
    },
    "recommendations": ["specific, actionable recommendation — not generic"],
    "growth_strategy": ["specific growth lever 1", "specific growth lever 2"],
    "validation_plans": ["specific experiment to run before committing"]
  }
}`;
}

function parseStrategyOutput(raw: string, existingStrategy?: StrategyOutput): { message: string; strategy: StrategyOutput } {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const p = JSON.parse(jsonMatch[0]);
      return {
        message: p.message || "Strategy generated.",
        strategy: p.strategy || { generatedAt: new Date().toISOString(), version: (existingStrategy?.version ?? 0) + 1 },
      };
    }
  } catch (_) { /* fall through */ }
  return {
    message: raw.substring(0, 500),
    strategy: { generatedAt: new Date().toISOString(), version: (existingStrategy?.version ?? 0) + 1 },
  };
}

// ─── Stage 7: CapabilityResult — Execution Capability ──────────────────────────
// Invoked by the orchestrator when intent is execution_request and readiness is met.
// Receives the reasoning context — does not independently gather information.
// Capabilities CONSUME the reasoning context; they do not classify intent,
// evaluate decisions, or update memory.

async function invokeExecutionCapability(
  ctx: PipelineContext,
  reasoning: ReasoningOutput
): Promise<{ message: string; execution: ExecutionOutput }> {
  const prompt = buildExecutionPrompt(ctx, reasoning);
  const rawOutput = await callOpenAI(ctx.openaiApiKey, [
    { role: "system", content: prompt },
    { role: "user", content: ctx.request.message },
  ], 4096, 0.6);

  return parseExecutionOutput(rawOutput, ctx.memory.execution);
}

function buildExecutionPrompt(ctx: PipelineContext, reasoning: ReasoningOutput): string {
  const { project, memory } = ctx;
  const strategy = memory.strategy;
  const strategyBlock = strategy
    ? [
        `STRATEGY:`,
        `UVP: ${strategy.lean_canvas?.unique_value_proposition || "(infer from BIM)"}`,
        `Pricing model: ${strategy.pricing?.model || "(infer from BIM)"}`,
        `Positioning: ${strategy.positioning || "(infer from BIM)"}`,
        `Primary channel: ${strategy.customer_acquisition?.primary_channel || "(infer from BIM)"}`,
        strategy.lean_canvas?.customer_segments?.length
          ? `Customer: ${strategy.lean_canvas.customer_segments[0]}`
          : "",
      ].filter(Boolean).join("\n")
    : "No formal strategy yet — infer execution priorities directly from BIM.";
  const promptBim = ctx.filteredBim ?? memory.bim;
  const bimContext = ctx.request.bimContext ?? buildBIMContext(promptBim, project.title || "Untitled", project.description);
  const existingExecution = memory.execution
    ? `\nEXISTING EXECUTION PLAN (v${memory.execution.version}): update or extend it.\n${JSON.stringify(memory.execution, null, 2)}`
    : "";

  const reasoningBlock = `
REASONING CONTEXT (from the orchestrator):
- Situation: ${reasoning.situation_analysis}
- Goals: ${reasoning.goals.join("; ") || "(none specified)"}
- Constraints: ${reasoning.constraints.join("; ") || "(none specified)"}
- Relevant context: ${reasoning.relevant_context.join("; ") || "(none)"}
${reasoning.recommendation ? `- Recommendation: ${reasoning.recommendation.recommendation} (${Math.round(reasoning.recommendation.confidence * 100)}% confidence)` : ""}`;

  return `You are the Execution Capability of Bizactly's AI system, invoked by the central reasoning intelligence.

YOUR IDENTITY:
- You transform strategy and BIM knowledge into concrete, actionable execution plans.
- You CONSUME information — you never gather it.
- Every field must be filled with a specific, actionable item — never a placeholder.
- MVP = the minimum set of features needed to test the core value proposition, nothing more.
- Be ruthlessly specific: named features, concrete tasks, real durations.

FORBIDDEN PHRASES — never appear in your output:
"unknown", "not yet defined", "N/A", "TBD", "to be determined", "not specified",
"not identified", "no information", "feature 1", "task 1", "goal 1".
Write the actual content, not structural placeholders.

BUSINESS MATURITY STAGE: ${reasoning.maturity_stage.toUpperCase()}
PROJECT: ${project.title || "Untitled"}

${reasoningBlock}

${strategyBlock}

BIM CONTEXT (constraints and risks inform what to build first):
${bimContext}
${existingExecution}

OUTPUT FORMAT — return ONLY this JSON:
{
  "message": "2-3 paragraph explanation of the execution approach and key decisions made",
  "execution": {
    "generatedAt": "${new Date().toISOString()}",
    "version": ${(memory.execution?.version ?? 0) + 1},
    "mvp": {
      "goal": "what this MVP proves",
      "success_metric": "specific, measurable success criteria",
      "features": [
        {"name": "...", "description": "...", "priority": "must|should|could", "effort": "low|medium|high"}
      ]
    },
    "roadmap": [
      {"phase": "Phase 1 — name", "duration": "X weeks", "goals": ["goal 1"], "features": ["feature 1"]}
    ],
    "sprint_plan": [
      {
        "sprint": 1, "duration": "2 weeks", "goal": "specific sprint goal",
        "tasks": [{"task": "specific task", "type": "dev|design|marketing|research", "effort": "low|medium|high"}]
      }
    ],
    "technical_specification": "key technical decisions: architecture, stack, constraints",
    "marketing_checklist": ["pre-launch item 1", "launch item 1", "post-launch item 1"]
  }
}`;
}

function parseExecutionOutput(raw: string, existingExecution?: ExecutionOutput): { message: string; execution: ExecutionOutput } {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const p = JSON.parse(jsonMatch[0]);
      return {
        message: p.message || "Execution plan generated.",
        execution: p.execution || { generatedAt: new Date().toISOString(), version: (existingExecution?.version ?? 0) + 1 },
      };
    }
  } catch (_) { /* fall through */ }
  return {
    message: raw.substring(0, 500),
    execution: { generatedAt: new Date().toISOString(), version: (existingExecution?.version ?? 0) + 1 },
  };
}

// ─── Stage 8: MemoryUpdate (background) ───────────────────────────────────────
// Runs after every response via EdgeRuntime.waitUntil. Applies BIM update
// instructions from the reasoning output, persists strategy/execution if
// generated, generates drafts when triggered, and stores insights/actions
// in the feedback history. If this fails, the response is still returned —
// memory update runs in the background and is non-blocking.

async function runMemoryUpdate(
  ctx: PipelineContext,
  reasoning: ReasoningOutput,
  strategy: StrategyOutput | null,
  execution: ExecutionOutput | null,
  synchronousDraft: UnderstandingDraft | null
): Promise<void> {
  try {
    await Promise.allSettled([
      applyReasoningToBIM(ctx, reasoning, strategy, execution, synchronousDraft),
      persistInsights(ctx, reasoning),
      updateBusinessContextFromConversation(ctx, ctx.request.message),
    ]);
  } catch (err) {
    console.error("Memory update failed:", err);
  }
}

async function applyReasoningToBIM(
  ctx: PipelineContext,
  reasoning: ReasoningOutput,
  strategy: StrategyOutput | null,
  execution: ExecutionOutput | null,
  synchronousDraft: UnderstandingDraft | null
): Promise<void> {
  const now = new Date().toISOString();
  const memory: AIMemory = JSON.parse(JSON.stringify(ctx.memory));

  if (!memory.bim) memory.bim = createBIM();
  let bim = memory.bim;

  const updates = reasoning.bim_updates;

  // Apply claims
  for (const c of updates.newClaims || []) bim = addClaim(bim, c, now);
  for (const r of updates.repeatedClaims || []) {
    const existing = findExistingClaim(bim, r.category, r.value);
    if (existing) { bim = repeatClaim(bim, existing.id, r.evidence, now); }
    else { bim = addClaim(bim, { category: r.category, claim: r.value, value: r.value, source: "user_stated", evidence: r.evidence }, now); }
  }
  for (const c of updates.confirmedClaims || []) {
    const existing = findExistingClaim(bim, c.category, c.value);
    if (existing) bim = confirmClaim(bim, existing.id, now);
  }
  for (const c of updates.changedClaims || []) {
    const existing = findExistingClaim(bim, c.category, c.oldValue);
    if (existing) { bim = changeClaim(bim, existing.id, { category: c.category, claim: c.newClaim, value: c.newValue, source: "user_stated" }, now); }
    else { bim = addClaim(bim, { category: c.category, claim: c.newClaim, value: c.newValue, source: "user_stated" }, now); }
  }

  // Apply unknowns
  for (const u of updates.newUnknowns || []) bim = addUnknown(bim, u.category, u.claim, now);
  for (const r of updates.resolvedUnknowns || []) {
    const unknown = bim.unknowns.find(u => u.category === r.category);
    if (unknown) {
      bim.unknowns = bim.unknowns.filter(u => u.id !== unknown.id);
      bim = addClaim(bim, { category: r.category, claim: r.answer, value: r.answer, source: "user_stated" }, now);
    }
  }

  // Apply contradictions
  for (const c of updates.contradictions || []) {
    const cA = findExistingClaim(bim, c.categoryA, c.claimA);
    const cB = findExistingClaim(bim, c.categoryB, c.claimB);
    if (cA && cB) bim = registerContradiction(bim, cA.id, cB.id, c.description, now);
  }

  // Merge goals/constraints/risks
  const allGoals = new Set<string>([...(bim.goals ?? []), ...(updates.newGoals ?? [])]);
  const allConstraints = new Set<string>([...(bim.constraints ?? []), ...(updates.newConstraints ?? [])]);
  const allRisks = new Set<string>([...(bim.risks ?? []), ...(updates.newRisks ?? [])]);
  bim.goals = [...allGoals].slice(0, 20);
  bim.constraints = [...allConstraints].slice(0, 20);
  bim.risks = [...allRisks].slice(0, 20);

  // Set maturity stage and market bucket from reasoning
  bim.maturity_stage = reasoning.maturity_stage;
  if (reasoning.market_bucket) bim.market_bucket = reasoning.market_bucket;

  // Persist strategy/execution if generated
  if (strategy) memory.strategy = strategy;
  if (execution) memory.execution = execution;

  if (!memory.conversationContext) memory.conversationContext = {};
  memory.conversationContext.lastUpdated = now;
  memory.bim = bim;

  // Draft generation
  if (synchronousDraft) {
    memory.understandingDraft = synchronousDraft;
    bim.draft_version = synchronousDraft.version;
    bim.last_major_update = synchronousDraft.generatedAt;
  } else if (shouldGenerateDraft(bim, memory.understandingDraft, reasoning.generate_draft)) {
    memory.understandingDraft = generateDraft(bim, memory.understandingDraft);
    bim.draft_version = memory.understandingDraft.version;
    bim.last_major_update = memory.understandingDraft.generatedAt;
  }

  await ctx.supabase.from("projects").update({ ai_memory: memory, updated_at: now }).eq("id", ctx.request.projectId);
}

// ─── Readiness Gates ──────────────────────────────────────────────────────────
// Preserved from the original architecture. The orchestrator checks these before
// invoking Strategy or Execution capabilities.

const STRATEGY_REQUIRED_CATEGORIES = [
  { category: "problem",         description: "What problem are you solving?" },
  { category: "target_customer", description: "Who specifically is your customer?" },
];
const STRATEGY_MIN_CONFIDENCE = 45;
const STRATEGY_STAGES: MaturityStage[] = ["validation", "planning", "building", "launch", "growth"];

function checkStrategyReadiness(
  bim: BusinessIntelligenceModel | undefined,
  stage: MaturityStage
): { ready: boolean; reason: string; gaps: string[]; blockers: string[] } {
  if (!bim) {
    return { ready: false, reason: "No business data collected yet.", gaps: STRATEGY_REQUIRED_CATEGORIES.map(c => c.description), blockers: [] };
  }

  const overallPct = Math.round(getOverallConfidence(bim) * 100);
  const gaps: string[] = [];
  const blockers: string[] = [];

  if (overallPct < STRATEGY_MIN_CONFIDENCE) {
    gaps.push(`Overall confidence is ${overallPct}% — need at least ${STRATEGY_MIN_CONFIDENCE}% before strategy`);
  }

  const allClaims = [...bim.facts, ...bim.assumptions];
  for (const req of STRATEGY_REQUIRED_CATEGORIES) {
    const hasClaim = allClaims.some(c => c.category === req.category && c.confidence >= 0.20);
    if (!hasClaim) gaps.push(req.description);
  }

  if (!STRATEGY_STAGES.includes(stage)) {
    gaps.push(`Business is still in ${stage} stage — needs to reach validation before planning strategy`);
  }

  const unresolvedInCritical = bim.contradictions.filter(c =>
    !c.resolved && (c.claimA.toLowerCase().includes("problem") || c.claimB.toLowerCase().includes("customer"))
  );
  if (unresolvedInCritical.length > 0) {
    blockers.push(`${unresolvedInCritical.length} unresolved contradiction(s) in core categories — resolve before strategy`);
  }

  if (gaps.length > 0 || blockers.length > 0) {
    return { ready: false, reason: `Missing: ${[...gaps, ...blockers].join("; ")}`, gaps, blockers };
  }
  return { ready: true, reason: "All strategy requirements met.", gaps: [], blockers: [] };
}

const EXECUTION_REQUIRED_CATEGORIES = [
  { category: "problem",   description: "Core problem must be validated (not just assumed)" },
  { category: "solution",  description: "Solution direction must be identified" },
];
const EXECUTION_MIN_CONFIDENCE = 55;
const EXECUTION_STAGES: MaturityStage[] = ["building", "launch", "growth"];

function checkExecutionReadiness(
  bim: BusinessIntelligenceModel | undefined,
  stage: MaturityStage,
  strategyExists: boolean
): { ready: boolean; reason: string; gaps: string[]; blockers: string[] } {
  if (strategyExists && bim && bim.facts.length >= 2) {
    return { ready: true, reason: "Strategy exists — execution unlocked.", gaps: [], blockers: [] };
  }

  if (!bim) {
    return { ready: false, reason: "No business data collected yet.", gaps: ["Strategy needs to exist before execution", ...EXECUTION_REQUIRED_CATEGORIES.map(c => c.description)], blockers: [] };
  }

  const overallPct = Math.round(getOverallConfidence(bim) * 100);
  const gaps: string[] = [];
  const blockers: string[] = [];

  if (!strategyExists) {
    gaps.push("No strategy has been created yet — create a strategy first, or reach 55% confidence");
  }

  if (overallPct < EXECUTION_MIN_CONFIDENCE) {
    gaps.push(`Confidence is ${overallPct}% — need at least ${EXECUTION_MIN_CONFIDENCE}% to proceed without strategy`);
  }

  const allClaims = [...bim.facts, ...bim.assumptions];
  for (const req of EXECUTION_REQUIRED_CATEGORIES) {
    const hasClaim = allClaims.some(c => c.category === req.category && c.confidence >= 0.20);
    if (!hasClaim) gaps.push(req.description);
  }

  if (!EXECUTION_STAGES.includes(stage)) {
    gaps.push(`Business is in ${stage} stage — reach building or launch stage before execution planning`);
  }

  const unresolvedContradictions = bim.contradictions.filter(c => !c.resolved);
  if (unresolvedContradictions.length >= 2) {
    blockers.push(`${unresolvedContradictions.length} unresolved contradictions — resolve before building`);
  }

  if (gaps.length > 0 || blockers.length > 0) {
    return { ready: false, reason: `Missing: ${[...gaps, ...blockers].join("; ")}`, gaps, blockers };
  }
  return { ready: true, reason: "Execution requirements met.", gaps: [], blockers: [] };
}

// ─── Understanding Draft ──────────────────────────────────────────────────────

function shouldGenerateDraft(
  bim: BusinessIntelligenceModel,
  lastDraft: UnderstandingDraft | undefined,
  generateFlag: boolean
): boolean {
  if (generateFlag) return true;
  if (!lastDraft) return bim.assumptions.length >= 3 || bim.facts.length >= 1;
  const confidenceNow = Math.round(getOverallConfidence(bim) * 100);
  const confidenceDelta = Math.abs(confidenceNow - lastDraft.confidenceAtGeneration);
  if (confidenceDelta > 10) return true;
  const newFacts = bim.facts.length - lastDraft.factCountAtGeneration;
  if (newFacts > 0 && confidenceDelta > 5) return true;
  const resolvedNow = bim.contradictions.filter(c => c.resolved).length;
  if (resolvedNow > lastDraft.resolvedContradictionsAtGeneration) return true;
  return false;
}

function generateDraft(bim: BusinessIntelligenceModel, lastDraft?: UnderstandingDraft): UnderstandingDraft {
  const version = (lastDraft?.version ?? 0) + 1;
  const overallConfidence = Math.round(getOverallConfidence(bim) * 100);
  const highlights: string[] = [];

  if (lastDraft) {
    const newFacts = bim.facts.length - lastDraft.factCountAtGeneration;
    if (newFacts > 0) highlights.push(`${newFacts} new fact${newFacts > 1 ? "s" : ""} confirmed`);
    const confDelta = overallConfidence - lastDraft.overallConfidence;
    if (confDelta >= 5) highlights.push(`Confidence up ${confDelta}%`);
    const resolvedDelta = bim.contradictions.filter(c => c.resolved).length - lastDraft.resolvedContradictionsAtGeneration;
    if (resolvedDelta > 0) highlights.push(`${resolvedDelta} contradiction${resolvedDelta > 1 ? "s" : ""} resolved`);
    const stageChanged = bim.maturity_stage !== lastDraft.maturityStage;
    if (stageChanged) highlights.push(`Stage advanced to ${bim.maturity_stage}`);
  }

  return {
    version,
    generatedAt: new Date().toISOString(),
    overallConfidence,
    facts: bim.facts.map(f => f.claim),
    assumptions: bim.assumptions.map(a => a.claim),
    unknowns: bim.unknowns.map(u => u.claim),
    goals: [...(bim.goals ?? [])],
    constraints: [...(bim.constraints ?? [])],
    risks: [...(bim.risks ?? [])],
    highlights: highlights.length ? highlights : undefined,
    factCountAtGeneration: bim.facts.length,
    resolvedContradictionsAtGeneration: bim.contradictions.filter(c => c.resolved).length,
    confidenceAtGeneration: overallConfidence,
    maturityStage: bim.maturity_stage,
  };
}

// ─── Context Gathering ────────────────────────────────────────────────────────

async function gatherContext(
  supabase: any,
  user: any,
  projectId: string,
  includeMemory: boolean
): Promise<Omit<PipelineContext, "user" | "supabase" | "openaiApiKey" | "request"> | null> {
  const [projectResult, businessContextResult, recentFeedbackResult] = await Promise.all([
    supabase.from("projects").select("*, ai_memory").eq("id", projectId).eq("user_id", user.id).maybeSingle(),
    supabase.from("user_business_context").select("*").eq("user_id", user.id).eq("project_id", projectId).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("ai_feedback_history").select("*").eq("user_id", user.id).eq("project_id", projectId).order("created_at", { ascending: false }).limit(10),
  ]);

  const { data: project, error: projectError } = projectResult;
  if (projectError || !project) return null;

  const memory: AIMemory = includeMemory ? (project.ai_memory || {}) : {};
  return { project, memory, businessContext: businessContextResult.data || null, recentFeedback: recentFeedbackResult.data || [] };
}

// ─── Insight Persistence ──────────────────────────────────────────────────────

async function persistInsights(ctx: PipelineContext, reasoning: ReasoningOutput): Promise<void> {
  try {
    const rows: any[] = [];
    for (const insight of reasoning.bim_updates.insights || []) {
      rows.push({ user_id: ctx.user.id, project_id: ctx.request.projectId, feedback_type: "insight", category: "general", title: "Insight", content: insight, trigger_event: "ai_response", input_context: {}, recommendations: [], is_actionable: false });
    }
    for (const action of reasoning.bim_updates.actions || []) {
      rows.push({ user_id: ctx.user.id, project_id: ctx.request.projectId, feedback_type: "recommendation", category: action.category || "general", title: action.action, content: action.reasoning || action.action, trigger_event: "ai_response", input_context: {}, recommendations: [{ action_id: makeId(), action: action.action, priority: action.priority, category: action.category, reasoning: action.reasoning || "" }], is_actionable: true });
    }
    if (rows.length > 0) await ctx.supabase.from("ai_feedback_history").insert(rows);
  } catch (err) {
    console.error("Error persisting insights:", err);
  }
}

async function updateBusinessContextFromConversation(ctx: PipelineContext, userMessage: string): Promise<void> {
  try {
    const updates: any = {};
    const mrrMatch = userMessage.match(/\$?(\d+(?:,\d{3})*)\s*(?:mrr|per month|monthly)/i);
    if (mrrMatch) { if (!updates.current_metrics) updates.current_metrics = ctx.businessContext?.current_metrics || {}; updates.current_metrics.mrr = parseFloat(mrrMatch[1].replace(/,/g, "")); }
    const usersMatch = userMessage.match(/(\d+(?:,\d{3})*)\s*(?:active\s*)?(?:users|customers)/i);
    if (usersMatch) { if (!updates.current_metrics) updates.current_metrics = ctx.businessContext?.current_metrics || {}; updates.current_metrics.users = parseInt(usersMatch[1].replace(/,/g, ""), 10); }
    if (Object.keys(updates).length === 0) return;
    if (ctx.businessContext) {
      await ctx.supabase.from("user_business_context").update({ ...updates, updated_at: new Date().toISOString() }).eq("user_id", ctx.user.id).eq("project_id", ctx.request.projectId);
    } else {
      await ctx.supabase.from("user_business_context").insert({ user_id: ctx.user.id, project_id: ctx.request.projectId, ...updates });
    }
  } catch (err) {
    console.error("Error updating business context:", err);
  }
}

// ─── Selective Business Memory Retrieval ─────────────────────────────────────
// Deterministic, server-side retrieval that filters the full BIM to only the
// claims relevant to the current user message. The full BIM remains available
// in PipelineContext for memory updates, readiness checks, and persistence.
// Only the prompt-facing BIM is filtered.

const KEYWORD_CATEGORY_MAP: Record<string, string[]> = {
  "customer": ["target_customer"],
  "user": ["target_customer"],
  "audience": ["target_customer"],
  "persona": ["target_customer"],
  "buyer": ["target_customer"],
  "segment": ["target_customer"],
  "problem": ["problem"],
  "pain": ["problem"],
  "struggle": ["problem"],
  "issue": ["problem"],
  "need": ["problem"],
  "product": ["solution", "feature"],
  "solution": ["solution"],
  "feature": ["solution", "feature"],
  "mvp": ["solution", "feature"],
  "build": ["solution", "feature"],
  "functionality": ["solution", "feature"],
  "price": ["pricing", "revenue_model", "metric"],
  "pricing": ["pricing", "revenue_model"],
  "charge": ["pricing", "revenue_model"],
  "cost": ["pricing", "revenue_model"],
  "revenue": ["revenue_model", "metric"],
  "monetization": ["revenue_model", "pricing"],
  "subscription": ["pricing", "revenue_model"],
  "competitor": ["competitor", "market_size"],
  "alternative": ["competitor", "market_size"],
  "substitute": ["competitor", "market_size"],
  "differentiation": ["competitor", "market_size"],
  "marketing": ["channel", "target_customer"],
  "acquisition": ["channel", "target_customer"],
  "distribution": ["channel"],
  "channel": ["channel"],
  "sales": ["channel", "revenue_model"],
  "team": ["team"],
  "founder": ["team"],
  "hiring": ["team"],
  "skills": ["team"],
  "capability": ["team"],
  "metric": ["metric"],
  "users": ["metric"],
  "growth": ["metric"],
  "conversion": ["metric"],
  "retention": ["metric"],
  "mrr": ["metric"],
  "launch": ["feature", "solution", "channel"],
  "release": ["feature", "solution", "channel"],
  "roadmap": ["feature", "solution", "channel"],
  "execution": ["feature", "solution", "channel"],
  "development": ["feature", "solution"],
  "risk": ["other"],
  "blocker": ["other"],
  "limitation": ["other"],
  "constraint": ["other"],
};

const MAX_CLAIM_BUDGET = 24;
const MAX_FACTS = 12;
const MAX_ASSUMPTIONS = 8;
const MAX_UNKNOWNS = 4;
const MAX_GOALS = 8;
const MAX_CONSTRAINTS = 8;
const MAX_RISKS = 8;

function selectRelevantBIM(
  bim: BusinessIntelligenceModel | undefined,
  userMessage: string
): BusinessIntelligenceModel | undefined {
  if (!bim) return undefined;
  if (bim.facts.length === 0 && bim.assumptions.length === 0 && bim.unknowns.length === 0 && bim.contradictions.length === 0) {
    return bim;
  }

  const msgLower = userMessage.toLowerCase();
  const relevantCategories = new Set<string>();
  for (const [keyword, cats] of Object.entries(KEYWORD_CATEGORY_MAP)) {
    if (msgLower.includes(keyword)) {
      for (const c of cats) relevantCategories.add(c);
    }
  }

  const hasCategoryMatch = relevantCategories.size > 0;

  const rankClaims = (claims: BusinessClaim[]): BusinessClaim[] =>
    [...claims].sort((a, b) => {
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      return (b.lastUpdatedAt || "").localeCompare(a.lastUpdatedAt || "");
    });

  const filterByCategory = (claims: BusinessClaim[]): BusinessClaim[] =>
    claims.filter(c => relevantCategories.has(c.category));

  const dedup = (claims: BusinessClaim[]): BusinessClaim[] => {
    const seen = new Set<string>();
    const result: BusinessClaim[] = [];
    for (const c of claims) {
      const key1 = c.id;
      const key2 = `${c.category}|${(c.value || "").toLowerCase().trim()}`;
      const key3 = `${c.category}|${(c.claim || "").toLowerCase().trim()}`;
      if (seen.has(key1) || seen.has(key2) || seen.has(key3)) continue;
      seen.add(key1); seen.add(key2); seen.add(key3);
      result.push(c);
    }
    return result;
  };

  let selectedFacts: BusinessClaim[];
  let selectedAssumptions: BusinessClaim[];
  let selectedUnknowns: BusinessClaim[];

  if (hasCategoryMatch) {
    selectedFacts = dedup(rankClaims(filterByCategory(bim.facts)));
    selectedAssumptions = dedup(rankClaims(filterByCategory(bim.assumptions)));
    selectedUnknowns = dedup(rankClaims(filterByCategory(bim.unknowns)));
  } else {
    selectedFacts = dedup(rankClaims(bim.facts));
    selectedAssumptions = dedup(rankClaims(bim.assumptions));
    selectedUnknowns = dedup(rankClaims(bim.unknowns));
  }

  let factBudget = MAX_FACTS;
  let assumptionBudget = MAX_ASSUMPTIONS;
  let unknownBudget = hasCategoryMatch ? MAX_UNKNOWNS : 3;

  let totalSelected = selectedFacts.length + selectedAssumptions.length + selectedUnknowns.length;
  if (totalSelected > MAX_CLAIM_BUDGET) {
    const overflow = totalSelected - MAX_CLAIM_BUDGET;
    if (selectedUnknowns.length >= overflow) {
      selectedUnknowns = selectedUnknowns.slice(0, Math.max(0, selectedUnknowns.length - overflow));
    } else {
      const remaining = overflow - selectedUnknowns.length;
      selectedUnknowns = [];
      if (selectedAssumptions.length >= remaining) {
        selectedAssumptions = selectedAssumptions.slice(0, Math.max(0, selectedAssumptions.length - remaining));
      } else {
        const rem2 = remaining - selectedAssumptions.length;
        selectedAssumptions = [];
        selectedFacts = selectedFacts.slice(0, Math.max(0, selectedFacts.length - rem2));
      }
    }
  }

  selectedFacts = selectedFacts.slice(0, factBudget);
  selectedAssumptions = selectedAssumptions.slice(0, assumptionBudget);
  selectedUnknowns = selectedUnknowns.slice(0, unknownBudget);

  if (selectedFacts.length < factBudget) {
    const spare = factBudget - selectedFacts.length;
    selectedAssumptions = selectedAssumptions.slice(0, assumptionBudget + spare);
  }
  if (selectedFacts.length + selectedAssumptions.length < factBudget + assumptionBudget) {
    const spare = (factBudget + assumptionBudget) - (selectedFacts.length + selectedAssumptions.length);
    selectedUnknowns = selectedUnknowns.slice(0, unknownBudget + spare);
  }

  const totalAfter = selectedFacts.length + selectedAssumptions.length + selectedUnknowns.length;
  if (totalAfter > MAX_CLAIM_BUDGET) {
    if (selectedUnknowns.length > 0) {
      const cut = Math.min(selectedUnknowns.length, totalAfter - MAX_CLAIM_BUDGET);
      selectedUnknowns = selectedUnknowns.slice(0, selectedUnknowns.length - cut);
    }
    const t2 = selectedFacts.length + selectedAssumptions.length + selectedUnknowns.length;
    if (t2 > MAX_CLAIM_BUDGET) {
      const cut = Math.min(selectedAssumptions.length, t2 - MAX_CLAIM_BUDGET);
      selectedAssumptions = selectedAssumptions.slice(0, selectedAssumptions.length - cut);
    }
  }

  const selectedIds = new Set<string>();
  for (const c of [...selectedFacts, ...selectedAssumptions, ...selectedUnknowns]) {
    selectedIds.add(c.id);
  }

  const selectedContradictions = bim.contradictions.filter(c => {
    if (c.resolved) return false;
    return selectedIds.has(c.claimAId) || selectedIds.has(c.claimBId);
  });

  return {
    ...bim,
    facts: selectedFacts,
    assumptions: selectedAssumptions,
    unknowns: selectedUnknowns,
    contradictions: selectedContradictions,
    goals: (bim.goals ?? []).slice(0, MAX_GOALS),
    constraints: (bim.constraints ?? []).slice(0, MAX_CONSTRAINTS),
    risks: (bim.risks ?? []).slice(0, MAX_RISKS),
  };
}

// ─── BIM Operations ───────────────────────────────────────────────────────────

function createBIM(): BusinessIntelligenceModel {
  return {
    facts: [], assumptions: [], unknowns: [], contradictions: [],
    goals: [], constraints: [], risks: [],
    confidence_scores: {},
    maturity_stage: "exploration",
    draft_version: 0,
    last_major_update: new Date().toISOString(),
    last_updated: new Date().toISOString(),
    version: 1,
  };
}

function makeId(): string { return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`; }

const INITIAL_CONFIDENCE: Record<string, number> = {
  user_stated: 0.30, user_confirmed: 0.55, ai_inferred: 0.15, external_data: 0.80, repeated: 0.30,
};
const FACT_THRESHOLD = 0.75;

function addClaim(bim: BusinessIntelligenceModel, params: { category: string; claim: string; value: string; source: ClaimSource; evidence?: string }, now: string): BusinessIntelligenceModel {
  const existing = findExistingClaim(bim, params.category, params.value);
  if (existing) return repeatClaim(bim, existing.id, params.evidence, now);
  const confidence = INITIAL_CONFIDENCE[params.source] ?? 0.3;
  const claim: BusinessClaim = {
    id: makeId(), category: params.category, claim: params.claim, value: params.value,
    status: params.source === "external_data" ? "fact" : "assumption",
    confidence, evidence: params.evidence ? [params.evidence] : [],
    sources: [params.source], repetitionCount: 1, firstSeenAt: now, lastUpdatedAt: now,
  };
  const updated = cloneBIM(bim);
  if (claim.status === "fact") { updated.facts.push(claim); claim.promotedToFactAt = now; }
  else updated.assumptions.push(claim);
  updated.confidence_scores[params.category] = confidence;
  updated.last_updated = now;
  return updated;
}

function repeatClaim(bim: BusinessIntelligenceModel, claimId: string, evidence: string | undefined, now: string): BusinessIntelligenceModel {
  const updated = cloneBIM(bim);
  const claim = findById(updated, claimId);
  if (!claim) return bim;
  claim.repetitionCount++;
  claim.confidence = Math.min(0.95, claim.confidence + 0.15);
  if (evidence && !claim.evidence.includes(evidence)) { claim.evidence.push(evidence); claim.confidence = Math.min(0.95, claim.confidence + 0.10); }
  if (!claim.sources.includes("repeated")) claim.sources.push("repeated");
  claim.lastUpdatedAt = now;
  updated.confidence_scores[claim.category] = claim.confidence;
  updated.last_updated = now;
  return maybePromote(updated, claimId, now);
}

function confirmClaim(bim: BusinessIntelligenceModel, claimId: string, now: string): BusinessIntelligenceModel {
  const updated = cloneBIM(bim);
  const claim = findById(updated, claimId);
  if (!claim) return bim;
  claim.confidence = Math.min(0.95, claim.confidence + 0.25);
  if (!claim.sources.includes("user_confirmed")) claim.sources.push("user_confirmed");
  claim.lastUpdatedAt = now;
  updated.confidence_scores[claim.category] = claim.confidence;
  updated.last_updated = now;
  return maybePromote(updated, claimId, now);
}

function changeClaim(bim: BusinessIntelligenceModel, oldId: string, newParams: { category: string; claim: string; value: string; source: ClaimSource }, now: string): BusinessIntelligenceModel {
  let updated = cloneBIM(bim);
  updated.facts = updated.facts.filter(c => c.id !== oldId);
  updated.assumptions = updated.assumptions.filter(c => c.id !== oldId);
  updated = addClaim(updated, newParams, now);
  const newClaim = findExistingClaim(updated, newParams.category, newParams.value);
  if (newClaim) { newClaim.confidence = Math.max(0.1, newClaim.confidence - 0.30); updated.confidence_scores[newParams.category] = newClaim.confidence; }
  updated.last_updated = now;
  return updated;
}

function addUnknown(bim: BusinessIntelligenceModel, category: string, claim: string, now: string): BusinessIntelligenceModel {
  if (bim.unknowns.some(u => u.category === category && wordSimilarity(u.claim, claim) > 0.6)) return bim;
  const updated = cloneBIM(bim);
  updated.unknowns.push({ id: makeId(), category, claim, value: "", status: "unknown", confidence: 0, evidence: [], sources: ["ai_inferred"], repetitionCount: 1, firstSeenAt: now, lastUpdatedAt: now });
  updated.last_updated = now;
  return updated;
}

function registerContradiction(bim: BusinessIntelligenceModel, aId: string, bId: string, description: string, now: string): BusinessIntelligenceModel {
  const updated = cloneBIM(bim);
  const cA = findById(updated, aId);
  const cB = findById(updated, bId);
  if (!cA || !cB) return bim;
  if (updated.contradictions.some(c => (c.claimAId === aId && c.claimBId === bId) || (c.claimAId === bId && c.claimBId === aId))) return bim;
  cA.confidence = Math.max(0.05, cA.confidence - 0.20);
  cB.confidence = Math.max(0.05, cB.confidence - 0.20);
  updated.contradictions.push({ id: makeId(), claimAId: aId, claimBId: bId, claimA: cA.claim, claimB: cB.claim, description, detectedAt: now, resolved: false });
  updated.last_updated = now;
  return updated;
}

function maybePromote(bim: BusinessIntelligenceModel, claimId: string, now: string): BusinessIntelligenceModel {
  const idx = bim.assumptions.findIndex(a => a.id === claimId);
  if (idx === -1) return bim;
  const claim = bim.assumptions[idx];
  if (claim.confidence >= FACT_THRESHOLD || claim.sources.includes("user_confirmed") || (claim.repetitionCount >= 3 && claim.confidence >= 0.55) || claim.evidence.length >= 2) {
    claim.status = "fact"; claim.promotedToFactAt = now; claim.lastUpdatedAt = now;
    bim.assumptions.splice(idx, 1); bim.facts.push(claim);
  }
  return bim;
}

function cloneBIM(bim: BusinessIntelligenceModel): BusinessIntelligenceModel { return JSON.parse(JSON.stringify(bim)); }
function findById(bim: BusinessIntelligenceModel, id: string): BusinessClaim | undefined { return bim.facts.find(c => c.id === id) || bim.assumptions.find(c => c.id === id) || bim.unknowns.find(c => c.id === id); }
function findExistingClaim(bim: BusinessIntelligenceModel, category: string, value: string): BusinessClaim | undefined { return [...bim.facts, ...bim.assumptions].find(c => c.category === category && wordSimilarity(c.value.toLowerCase(), value.toLowerCase()) > 0.55); }
function wordSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.8;
  const wa = new Set(a.split(/\s+/).filter(w => w.length > 3));
  const wb = new Set(b.split(/\s+/).filter(w => w.length > 3));
  if (!wa.size || !wb.size) return 0;
  let overlap = 0;
  for (const w of wa) if (wb.has(w)) overlap++;
  return overlap / Math.max(wa.size, wb.size);
}

// ─── BIM Rendering ────────────────────────────────────────────────────────────

function renderBIM(bim: BusinessIntelligenceModel): string {
  const lines: string[] = [];
  const overall = Math.round(getOverallConfidence(bim) * 100);
  lines.push(`BUSINESS INTELLIGENCE MODEL (stage: ${bim.maturity_stage ?? "exploration"}, understanding: ${overall}%):`);

  if (bim.facts.length) {
    lines.push(`\nCONFIRMED (${bim.facts.length}) — validated, high-confidence information:`);
    bim.facts.forEach(f => { const ev = f.evidence.length ? ` | evidence: ${f.evidence.slice(-1)[0]}` : ""; lines.push(`  [CONFIRMED ${Math.round(f.confidence * 100)}%] [${f.category}] ${f.claim}${ev}`); });
  }
  if (bim.assumptions.length) {
    lines.push(`\nCURRENT HYPOTHESIS (${bim.assumptions.length}) — working assumptions, needs validation:`);
    bim.assumptions.forEach(a => { const r = a.repetitionCount > 1 ? ` (repeated ${a.repetitionCount}x)` : ""; lines.push(`  [HYPOTHESIS ${Math.round(a.confidence * 100)}%] [${a.category}] ${a.claim}${r}`); });
  }
  if (bim.unknowns.length) {
    lines.push(`\nINVESTIGATING (${bim.unknowns.length}) — active questions being explored:`);
    bim.unknowns.forEach(u => lines.push(`  [INVESTIGATING] [${u.category}] ${u.claim}`));
  }
  const active = bim.contradictions.filter(c => !c.resolved);
  if (active.length) {
    lines.push(`\nNEEDS RESOLUTION (${active.length}) — conflicting signals, explore before strategy:`);
    active.forEach(c => lines.push(`  [NEEDS RESOLUTION] "${c.claimA}" vs "${c.claimB}"`));
  }
  if (bim.goals?.length) {
    lines.push(`\nGOALS (${bim.goals.length}):`);
    bim.goals.forEach(g => lines.push(`  - ${g}`));
  }
  if (bim.constraints?.length) {
    lines.push(`\nCONSTRAINTS (${bim.constraints.length}):`);
    bim.constraints.forEach(c => lines.push(`  - ${c}`));
  }
  if (bim.risks?.length) {
    lines.push(`\nRISKS (${bim.risks.length}):`);
    bim.risks.forEach(r => lines.push(`  - ${r}`));
  }
  return lines.join("\n");
}

function buildBIMContext(bim: BusinessIntelligenceModel | undefined, projectTitle: string, projectDescription?: string): string {
  const header = `PROJECT: ${projectTitle}${projectDescription ? `\nDESCRIPTION: ${projectDescription}` : ""}`;
  if (!bim || (bim.facts.length === 0 && bim.assumptions.length === 0 && bim.unknowns.length === 0)) {
    return `${header}\n\nNo business intelligence collected yet.`;
  }
  return `${header}\n\n${renderBIM(bim)}`;
}

function getOverallConfidence(bim: BusinessIntelligenceModel): number {
  const scores = Object.values(bim.confidence_scores);
  return scores.length ? scores.reduce((s, v) => s + v, 0) / scores.length : 0;
}

// ─── OpenAI Helper ─────────────────────────────────────────────────────────────

async function callOpenAI(openaiApiKey: string, messages: { role: string; content: string }[], maxTokens = 4096, temperature = 0.7): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o", messages, max_tokens: maxTokens, temperature }),
      signal: controller.signal,
    });
    if (!res.ok) { const err = await res.json(); throw new Error(`OpenAI: ${err.error?.message || "Unknown error"}`); }
    const data = await res.json();
    return data.choices[0]?.message?.content || "Unable to generate a response.";
  } finally {
    clearTimeout(timeoutId);
  }
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

// ─── Milestone 2: Decision Provenance Persistence ─────────────────────────────
// Persists reasoning events, creates a decision record when the orchestrator
// detects a meaningful decision, and links the relevant events to it.

async function persistDecisionProvenance(
  ctx: PipelineContext,
  reasoning: ReasoningOutput
): Promise<{ decision_record_id?: string; reasoning_event_ids?: string[] }> {
  const detection = reasoning.decision_detection;
  const candidateEvents = reasoning.reasoning_events ?? detection?.reasoning_events ?? [];
  if (candidateEvents.length === 0 && !detection?.is_meaningful_decision && reasoning.intent !== "outcome_report") return {};

  const now = new Date().toISOString();
  const projectId = ctx.request.projectId;
  const conversationId = ctx.request.conversationId ?? null;

  // Insert all candidate reasoning events
  const eventRows = candidateEvents.map((e) => ({
    project_id: projectId,
    conversation_id: conversationId,
    event_type: e.event_type,
    content: e.content,
    source: e.source,
    importance: e.importance,
    relevance_status: e.relevance_status,
    confidence: e.confidence,
    influence_direction: e.influence_direction ?? null,
    influence_strength: e.influence_strength ?? null,
    metadata: { influence_role: e.influence_role ?? null, ...(e.metadata ?? {}) },
    created_at: now,
    updated_at: now,
  }));

  let insertedEventIds: string[] = [];
  if (eventRows.length > 0) {
    const { data: insertedEvents, error: eventError } = await ctx.supabase
      .from("reasoning_events")
      .insert(eventRows)
      .select("id");
    if (eventError) throw eventError;
    insertedEventIds = (insertedEvents || []).map((r: any) => r.id);
  }

  // Create a Decision Record only when the orchestrator determines it's meaningful
  if (!detection?.is_meaningful_decision) {
    return { reasoning_event_ids: insertedEventIds };
  }

  const recommendation = reasoning.recommendation;
  const decisionRow = {
    project_id: projectId,
    title: detection.title,
    decision_type: detection.decision_type,
    decision_question: detection.decision_question,
    context_summary: detection.context_summary,
    recommendation: recommendation?.recommendation ?? null,
    recommendation_summary: detection.recommendation_summary,
    recommendation_confidence: detection.recommendation_confidence,
    status: "proposed",
    created_at: now,
    updated_at: now,
  };

  const { data: insertedDecision, error: decisionError } = await ctx.supabase
    .from("decision_records")
    .insert(decisionRow)
    .select("id")
    .single();
  if (decisionError) throw decisionError;

  const decisionId = insertedDecision.id;

  // Link relevant reasoning events to the decision (skip "irrelevant" ones)
  const relevantEvents = candidateEvents
    .map((e, idx) => ({ event: e, insertedId: insertedEventIds[idx] }))
    .filter(({ event }) => event.relevance_status !== "irrelevant");

  const linkRows = relevantEvents.map(({ event, insertedId }) => ({
    decision_id: decisionId,
    reasoning_event_id: insertedId,
    relevance: event.relevance_status,
    influence_strength: event.influence_strength ?? "moderate",
    influence_role: event.influence_role ?? "supporting_evidence",
  }));

  if (linkRows.length > 0) {
    const { error: linkError } = await ctx.supabase
      .from("decision_reasoning_events")
      .insert(linkRows);
    if (linkError) throw linkError;
  }

  // Update reasoning_events.decision_id for linked events
  if (insertedEventIds.length > 0) {
    const linkedIds = relevantEvents.map(({ insertedId }) => insertedId);
    await ctx.supabase
      .from("reasoning_events")
      .update({ decision_id: decisionId, updated_at: now })
      .in("id", linkedIds);
  }

  return { decision_record_id: decisionId, reasoning_event_ids: insertedEventIds };
}

// ─── Milestone 3: Outcome Linking ─────────────────────────────────────────────
// When a user reports an outcome, attempt to find the most relevant prior decision
// record and link the outcome to it. This closes the decision→outcome loop.

async function linkOutcomeToDecision(
  ctx: PipelineContext,
  reasoning: ReasoningOutput
): Promise<{ decision_record_id?: string; outcome_id?: string } | null> {
  if (reasoning.intent !== "outcome_report") return null;
  const projectId = ctx.request.projectId;
  const now = new Date().toISOString();

  // Find the most recent decision record of a relevant type for this project.
  // Use keyword matching against decision_question to find the best match.
  const msgLower = ctx.request.message.toLowerCase();
  const { data: decisions, error } = await ctx.supabase
    .from("decision_records")
    .select("id, decision_question, decision_type, recommendation")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(10);
  if (error || !decisions || decisions.length === 0) return null;

  // Score each decision by keyword overlap with the user's message
  let bestMatch: { id: string; score: number } | null = null;
  for (const d of decisions) {
    const questionWords = new Set((d.decision_question || "").toLowerCase().split(/\s+/).filter((w: string) => w.length > 3));
    const msgWords = new Set(msgLower.split(/\s+/).filter((w: string) => w.length > 3));
    let overlap = 0;
    for (const w of questionWords) { if (msgWords.has(w)) overlap++; }
    if (overlap > 0 && (!bestMatch || overlap > bestMatch.score)) {
      bestMatch = { id: d.id, score: overlap };
    }
  }
  if (!bestMatch) return null;

  const decisionId = bestMatch.id;

  // Check if an outcome already exists for this decision
  const { data: existing } = await ctx.supabase
    .from("outcomes")
    .select("id")
    .eq("decision_id", decisionId)
    .maybeSingle();
  if (existing) return { decision_record_id: decisionId, outcome_id: existing.id };

  // Create a minimal outcome record linked to the decision
  const outcomeRow = {
    decision_id: decisionId,
    outcome_status: "pending",
    outcome_summary: reasoning.situation_analysis?.substring(0, 500) || null,
    recorded_at: now,
  };

  const { data: inserted, error: insertError } = await ctx.supabase
    .from("outcomes")
    .insert(outcomeRow)
    .select("id")
    .single();
  if (insertError) throw insertError;

  // Update decision record status to reflect outcome
  await ctx.supabase
    .from("decision_records")
    .update({ outcome_id: inserted.id, status: "outcome_available", updated_at: now })
    .eq("id", decisionId);

  return { decision_record_id: decisionId, outcome_id: inserted.id };
}

// ─── Milestone 3: Provenance Retrieval ─────────────────────────────────────────
// Retrieves relevant prior decisions, founder decisions, outcomes, and reasoning
// events for the current project. Uses the same keyword→category matching as
// selectRelevantBIM to ensure only relevant provenance is included.

const DECISION_TYPE_CATEGORY_MAP: Record<string, string[]> = {
  product: ["solution", "feature"],
  pricing: ["pricing", "revenue_model"],
  customer: ["target_customer"],
  marketing: ["channel", "target_customer"],
  positioning: ["competitor", "market_size"],
  business_model: ["revenue_model", "pricing"],
  feature: ["solution", "feature"],
  MVP: ["solution", "feature"],
  launch: ["feature", "solution", "channel"],
  growth: ["metric", "channel"],
  resource_allocation: ["other"],
  strategy: ["other"],
  other: [],
};

async function retrieveRelevantProvenance(
  supabase: any,
  projectId: string,
  userMessage: string
): Promise<ProvenanceContext | null> {
  const msgLower = userMessage.toLowerCase();

  // Determine relevant categories using the same keyword map as selectRelevantBIM
  const relevantCategories = new Set<string>();
  for (const [keyword, cats] of Object.entries(KEYWORD_CATEGORY_MAP)) {
    if (msgLower.includes(keyword)) {
      for (const c of cats) relevantCategories.add(c);
    }
  }

  // Fetch recent decision records with founder decisions and outcomes
  // Use explicit FK hints to disambiguate the multiple FK paths between
  // decision_records and outcomes/founder_decisions.
  const { data: decisions, error: decError } = await supabase
    .from("decision_records")
    .select(`
      id, title, decision_type, decision_question, recommendation,
      recommendation_summary, recommendation_confidence, status, created_at,
      founder_decisions!founder_decisions_decision_id_fkey ( selected_option, decision_text, rationale, decision_status ),
      outcomes!outcomes_decision_id_fkey ( id, outcome_status, outcome_summary, success_rating, lessons_learned )
    `)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(15);
  if (decError) throw decError;

  // Normalize: PostgREST returns founder_decisions and outcomes as arrays,
  // but the ProvenanceContext interface expects single objects.
  let filteredDecisions = (decisions || []).map((d: any) => {
    const decisionCats = DECISION_TYPE_CATEGORY_MAP[d.decision_type] || [];
    let score = 0;
    for (const cat of decisionCats) {
      if (relevantCategories.has(cat)) score += 2;
    }
    const qWords = new Set((d.decision_question || "").toLowerCase().split(/\s+/).filter((w: string) => w.length > 3));
    const msgWords = new Set(msgLower.split(/\s+/).filter((w: string) => w.length > 3));
    for (const w of qWords) { if (msgWords.has(w)) score += 1; }
    return {
      ...d,
      founder_decision: Array.isArray(d.founder_decisions) ? (d.founder_decisions[0] ?? null) : (d.founder_decisions ?? null),
      outcome: Array.isArray(d.outcomes) ? (d.outcomes[0] ?? null) : (d.outcomes ?? null),
      _relevanceScore: score,
    };
  });

  // Sort by relevance score, then recency; filter to relevant ones when categories match
  const hasCategoryMatch = relevantCategories.size > 0;
  if (hasCategoryMatch) {
    filteredDecisions = filteredDecisions.filter((d: any) => d._relevanceScore > 0);
  }
  filteredDecisions.sort((a: any, b: any) => {
    if (b._relevanceScore !== a._relevanceScore) return b._relevanceScore - a._relevanceScore;
 return (b.created_at || "").localeCompare(a.created_at || "");
  });
  filteredDecisions = filteredDecisions.slice(0, 5).map((d: any) => {
    const { _relevanceScore, ...rest } = d;
    return rest;
  });

  // Fetch recent reasoning events (candidate or higher relevance)
  const { data: events, error: eventError } = await supabase
    .from("reasoning_events")
    .select("id, event_type, content, relevance_status, created_at")
    .eq("project_id", projectId)
    .in("relevance_status", ["candidate", "relevant", "supporting", "influential", "decisive"])
    .order("created_at", { ascending: false })
    .limit(10);
  if (eventError) throw eventError;

  // Filter events by keyword overlap when categories match
  let filteredEvents = (events || []);
  if (hasCategoryMatch) {
    filteredEvents = filteredEvents.filter((e: any) => {
      const eWords = new Set((e.content || "").toLowerCase().split(/\s+/).filter((w: string) => w.length > 3));
      const msgWords = new Set(msgLower.split(/\s+/).filter((w: string) => w.length > 3));
      for (const w of eWords) { if (msgWords.has(w)) return true; }
      return false;
    });
  }
  filteredEvents = filteredEvents.slice(0, 5);

  if (filteredDecisions.length === 0 && filteredEvents.length === 0) return null;

  return {
    decisions: filteredDecisions,
    reasoningEvents: filteredEvents,
  };
}

// ─── Milestone 4: Outcome-Derived Learning Signal Synthesis ──────────────────
// Deterministically generates a prior_learning reasoning event from the retrieved
// provenance when a decision with a positive/negative/mixed outcome exists.
// This is code-generated from real outcome data — not invented by the LLM — ensuring
// every learning signal is grounded in a specific recorded outcome with full traceability.

function synthesizeLearningEvent(
  provenance: ProvenanceContext | null | undefined
): CandidateReasoningEvent | null {
  if (!provenance || provenance.decisions.length === 0) return null;

  // Find the first decision with a decisive outcome (positive/negative/mixed)
  const decisionWithOutcome = provenance.decisions.find(
    d => d.outcome && ["positive", "negative", "mixed"].includes(d.outcome.outcome_status)
  );
  if (!decisionWithOutcome || !decisionWithOutcome.outcome) return null;

  const outcome = decisionWithOutcome.outcome;
  const decisionType = decisionWithOutcome.decision_type;

  // Build a grounded one-sentence implication from the outcome data
  const statusPhrase = outcome.outcome_status === "positive"
    ? "Positive results"
    : outcome.outcome_status === "negative"
    ? "Negative results"
    : "Mixed results";

  const outcomeDetail = outcome.outcome_summary
    ? outcome.outcome_summary.split(/[.!?]/)[0].toLowerCase()
    : `the ${decisionType} decision`;

  const implication = outcome.outcome_status === "positive"
    ? `${statusPhrase} from "${outcomeDetail}" suggest this approach worked; future ${decisionType} decisions can treat it as more credible.`
    : outcome.outcome_status === "negative"
    ? `${statusPhrase} from "${outcomeDetail}" suggest this approach did not work as expected; future ${decisionType} decisions should account for these limitations.`
    : `${statusPhrase} from "${outcomeDetail}" provide partial evidence; future ${decisionType} decisions should weigh both the successes and shortcomings observed.`;

  return {
    event_type: "prior_learning",
    content: implication,
    source: "business_memory",
    importance: outcome.outcome_status === "positive" || outcome.outcome_status === "negative" ? "high" : "medium",
    relevance_status: "influential",
    confidence: outcome.success_rating !== null ? outcome.success_rating / 10 : 0.5,
    influence_role: "prior_learning",
    metadata: {
      originating_outcome_id: outcome.id,
      originating_decision_id: decisionWithOutcome.id,
    },
  };
}

function buildProvenanceBlock(provenance: ProvenanceContext | null | undefined): string {
  if (!provenance || (provenance.decisions.length === 0 && provenance.reasoningEvents.length === 0)) {
    return "";
  }

  const lines: string[] = [];
  lines.push("");
  lines.push("PRIOR DECISIONS AND OUTCOMES (from this project's history):");

  if (provenance.decisions.length > 0) {
    lines.push("");
    lines.push("Prior Decisions:");
    for (const d of provenance.decisions) {
      const confidence = Math.round((d.recommendation_confidence || 0) * 100);
      lines.push(`  • [${d.decision_type}] ${d.title} (status: ${d.status}, confidence: ${confidence}%)`);
      if (d.decision_question) lines.push(`    Question: ${d.decision_question}`);
      if (d.recommendation) lines.push(`    AI recommended: ${d.recommendation}`);
      if (d.founder_decision) {
        lines.push(`    Founder chose: ${d.founder_decision.selected_option} (${d.founder_decision.decision_status})`);
        if (d.founder_decision.rationale) lines.push(`    Rationale: ${d.founder_decision.rationale}`);
      }
      if (d.outcome) {
        lines.push(`    Outcome: ${d.outcome.outcome_status}${d.outcome.outcome_summary ? " — " + d.outcome.outcome_summary : ""}`);
        if (d.outcome.success_rating !== null) lines.push(`    Success rating: ${d.outcome.success_rating}/10`);
        if (d.outcome.lessons_learned) lines.push(`    Lessons: ${d.outcome.lessons_learned}`);
        lines.push(`    [outcome_id: ${d.outcome.id}] [decision_id: ${d.id}]`);
      }
    }
  }

  if (provenance.reasoningEvents.length > 0) {
    lines.push("");
    lines.push("Recent Reasoning Events (relevant to this topic):");
    for (const e of provenance.reasoningEvents) {
      lines.push(`  • [${e.event_type}] ${e.content}`);
    }
  }

  lines.push("");
  lines.push("Use this history to inform your response. If a prior recommendation was followed and produced an outcome, acknowledge it. If the user is revisiting a topic you've addressed before, build on that history rather than starting fresh.");
  lines.push("");

  return lines.join("\n");
}

function buildFeedbackBlock(recentFeedback: any[]): string {
  if (!recentFeedback || recentFeedback.length === 0) return "";
  const insights = recentFeedback.filter(f => f.feedback_type === "insight").slice(0, 3);
  if (insights.length === 0) return "";
  const lines: string[] = [];
  lines.push("");
  lines.push("RECENT INSIGHTS (from prior conversations):");
  for (const i of insights) {
    lines.push(`  • ${i.content}`);
  }
  lines.push("");
  return lines.join("\n");
}

function buildBusinessContextBlock(businessContext: any): string {
  if (!businessContext) return "";
  const metrics = businessContext.current_metrics;
  if (!metrics || Object.keys(metrics).length === 0) return "";
  const lines: string[] = [];
  lines.push("");
  lines.push("BUSINESS METRICS (from user-reported updates):");
  for (const [key, value] of Object.entries(metrics)) {
    lines.push(`  • ${key}: ${value}`);
  }
  lines.push("");
  return lines.join("\n");
}
