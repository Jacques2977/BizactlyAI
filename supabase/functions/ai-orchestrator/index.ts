import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OPENAI_TIMEOUT_MS = 55000;

// ─── Architecture ──────────────────────────────────────────────────────────────
//
// Layer 0: Orchestrator — routes by intent + maturity stage + readiness gates
// Layer 1: Discovery    — gathers facts, assumptions, unknowns, goals, constraints, risks
// Layer 2: Understanding — owns truth; interprets BIM; generates drafts on meaningful change
// Layer 3: Strategy      — decides: Lean Canvas, pricing, positioning, acquisition
// Layer 4: Execution     — builds: MVP, roadmap, sprints, marketing
//
// BIM CONSTITUTION:
// Every piece of information is one of: FACT | ASSUMPTION | UNKNOWN | CONTRADICTION
// - Facts require validation
// - Assumptions require evidence
// - Unknowns require investigation
// - Contradictions require resolution
// No layer may present an assumption as fact.
// Understanding is the sole owner of truth — all confidence decisions flow through it.

// ─── Types ────────────────────────────────────────────────────────────────────

type ClaimSource = "user_stated" | "user_confirmed" | "ai_inferred" | "external_data" | "repeated";
type ClaimStatus = "assumption" | "fact" | "unknown" | "invalidated";
type AILayer = "discovery" | "understanding" | "strategy" | "execution";

// Market bucket — classifies the competitive landscape, drives discovery focus
// proven:  market exists (CRM, accounting software) → validate differentiation only
// emerging: market forming (AI agents, AI coworkers) → validate problem AND differentiation
// novel:   no established market → first validate that the problem exists at all
type MarketBucket = "proven" | "emerging" | "novel";

// Business maturity stages — richer context than confidence alone
type MaturityStage =
  | "exploration"   // Stage 1: idea exists, not much else
  | "validation"    // Stage 2: hypothesis formed, testing begins
  | "planning"      // Stage 3: validated enough to plan
  | "building"      // Stage 4: building the product
  | "launch"        // Stage 5: releasing to market
  | "growth";       // Stage 6: optimising and scaling

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

// BIM Constitution: tracks all categories of business knowledge
interface BusinessIntelligenceModel {
  // Core epistemic categories
  facts: BusinessClaim[];
  assumptions: BusinessClaim[];
  unknowns: BusinessClaim[];
  contradictions: Contradiction[];
  // Extended knowledge categories (Discovery output)
  goals: string[];
  constraints: string[];
  risks: string[];
  // Confidence per-category (0-1)
  confidence_scores: Record<string, number>;
  // Maturity stage — determined by Understanding, consumed by Orchestrator
  maturity_stage: MaturityStage;
  // Market bucket — set by Understanding, drives discovery focus
  market_bucket?: MarketBucket;
  // Draft version tracking — owned by Understanding
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

// Strategy output (Layer 3)
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

// Execution output (Layer 4)
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

// Discovery Layer structured output — enriched with goals/constraints/risks
interface DiscoveryOutput {
  message: string;
  new_facts: Array<{ category: string; claim: string; value: string; evidence?: string }>;
  new_assumptions: Array<{ category: string; claim: string; value: string }>;
  new_unknowns: Array<{ category: string; claim: string }>;
  new_goals: string[];
  new_constraints: string[];
  new_risks: string[];
  confidence_updates: Array<{ category: string; direction: "up" | "down"; reason: string }>;
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

interface UnderstandingOutput {
  bim_updates: BIMUpdates;
  maturity_stage: MaturityStage;
  market_bucket?: MarketBucket;
  patterns: string[];
  missing_information: string[];
  potential_opportunities: string[];
  confidence_analysis: Record<string, number>;
  generate_draft: boolean;
  draft_reason?: string;
}

interface AIRequest {
  message: string;
  projectId: string;
  conversationId?: string;
  includeMemory?: boolean;
  bimContext?: string;
  contextStage?: string;
  contextConfidence?: number;
  contextHasStrategy?: boolean;
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
}

// Orchestrator routing decision — carries full readiness context
interface OrchestratorDecision {
  layer: AILayer;
  reason: string;
  requestedLayer?: AILayer;
  gaps?: string[];
  blockers?: string[];
  overallConfidence: number;
  maturityStage: MaturityStage;
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
  const openaiApiKey = Deno.env.get("OpenAI_API_Key") || Deno.env.get("OPENAI_API_KEY");

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

// ─── Project Chat Pipeline ────────────────────────────────────────────────────

async function runProjectChatPipeline(
  req: Request,
  supabase: any,
  user: any,
  openaiApiKey: string
): Promise<Response> {
  const body: AIRequest = await req.json();
  const { message, projectId, includeMemory = true } = body;

  const context = await gatherContext(supabase, user, projectId, includeMemory);
  if (!context) {
    return new Response(JSON.stringify({ error: "Project not found or access denied" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const ctx: PipelineContext = { user, supabase, openaiApiKey, request: body, ...context };
  const decision = orchestrate(message, ctx.memory);

  switch (decision.layer) {
    case "understanding":
      return await handleUnderstandingRoute(ctx, message, decision);
    case "strategy":
      return await handleStrategyRoute(ctx, message, decision);
    case "execution":
      return await handleExecutionRoute(ctx, message, decision);
    default:
      return await handleDiscoveryRoute(ctx, message, decision);
  }
}

// ─── Layer 0: Orchestrator ────────────────────────────────────────────────────
// Routing is based on three independent signals — ALL must pass for advanced layers:
//   1. Intent keywords (what the user wants)
//   2. Readiness gates (do we have the right categories?)
//   3. Business maturity stage (how far along are they?)

function orchestrate(message: string, memory: AIMemory): OrchestratorDecision {
  const lower = message.toLowerCase();
  const bim = memory.bim;
  const overallConfidence = bim ? Math.round(getOverallConfidence(bim) * 100) : 0;
  const maturityStage: MaturityStage = bim?.maturity_stage ?? "exploration";
  const strategyExists = !!memory.strategy;

  const hasKeyword = (keywords: string[]) => keywords.some(k => lower.includes(k));

  // ── Understanding signals (all stages) ───────────────────────────────────
  const understandingKeywords = [
    "summarize", "summary", "what do you know", "what have you learned",
    "what you know", "tell me everything", "give me an overview", "brief me",
    "understanding draft", "understanding so far", "where are we",
    "what do we know", "what have we learned", "catch me up",
  ];
  if (hasKeyword(understandingKeywords)) {
    return { layer: "understanding", reason: "User requesting summary.", overallConfidence, maturityStage };
  }

  // ── Execution signals ─────────────────────────────────────────────────────
  const executionKeywords = [
    "roadmap", "sprint", "mvp", "build the", "build me", "develop",
    "implementation plan", "technical spec", "feature list", "feature spec",
    "marketing checklist", "marketing plan", "launch plan", "task list",
    "what to build", "development plan", "execution plan",
  ];
  if (hasKeyword(executionKeywords)) {
    const readiness = checkExecutionReadiness(bim, maturityStage, strategyExists);
    if (readiness.ready) {
      return { layer: "execution", reason: `Execution readiness confirmed (${overallConfidence}% confidence, stage: ${maturityStage}).`, overallConfidence, maturityStage };
    }
    return {
      layer: "discovery",
      reason: `Execution not ready: ${readiness.reason}`,
      requestedLayer: "execution",
      gaps: readiness.gaps,
      blockers: readiness.blockers,
      overallConfidence,
      maturityStage,
    };
  }

  // ── Strategy signals ──────────────────────────────────────────────────────
  const strategyKeywords = [
    "lean canvas", "business model", "pricing", "price tier", "positioning",
    "go-to-market", "gtm", "customer acquisition", "create a strategy",
    "strategy", "revenue model", "market strategy", "growth strategy",
    "competitive advantage", "how to charge", "what to charge",
  ];
  if (hasKeyword(strategyKeywords)) {
    const readiness = checkStrategyReadiness(bim, maturityStage);
    if (readiness.ready) {
      return { layer: "strategy", reason: `Strategy readiness confirmed (${overallConfidence}% confidence, stage: ${maturityStage}).`, overallConfidence, maturityStage };
    }
    return {
      layer: "discovery",
      reason: `Strategy not ready: ${readiness.reason}`,
      requestedLayer: "strategy",
      gaps: readiness.gaps,
      blockers: readiness.blockers,
      overallConfidence,
      maturityStage,
    };
  }

  // ── Default: Discovery ────────────────────────────────────────────────────
  return { layer: "discovery", reason: "Gathering business intelligence.", overallConfidence, maturityStage };
}

// ─── Readiness Gates ──────────────────────────────────────────────────────────

// Strategy requirements:
//   • Confidence ≥ 45%
//   AND Problem identified (any fact/assumption in 'problem' category)
//   AND Customer identified (any fact/assumption in 'target_customer' category)
// Stage: validation or planning
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

  // Confidence gate
  if (overallPct < STRATEGY_MIN_CONFIDENCE) {
    gaps.push(`Overall confidence is ${overallPct}% — need at least ${STRATEGY_MIN_CONFIDENCE}% before strategy`);
  }

  // Required category gates
  const allClaims = [...bim.facts, ...bim.assumptions];
  for (const req of STRATEGY_REQUIRED_CATEGORIES) {
    const hasClaim = allClaims.some(c => c.category === req.category && c.confidence >= 0.20);
    if (!hasClaim) gaps.push(req.description);
  }

  // Maturity stage gate
  if (!STRATEGY_STAGES.includes(stage)) {
    gaps.push(`Business is still in ${stage} stage — needs to reach validation before planning strategy`);
  }

  // Contradiction blockers
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

// Execution requirements (either path):
//   Path A: Strategy exists
//   Path B: Confidence ≥ 55% AND problem validated AND solution direction identified
// Stage: building, launch, or growth
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
  // Path A: strategy already exists → allow execution at any stage with valid BIM
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

// ─── Layer 1: Discovery Route ─────────────────────────────────────────────────

async function handleDiscoveryRoute(
  ctx: PipelineContext,
  message: string,
  decision: OrchestratorDecision
): Promise<Response> {
  const prompt = buildDiscoveryPrompt(ctx, decision);
  const rawOutput = await callOpenAI(ctx.openaiApiKey, [
    { role: "system", content: prompt },
    { role: "user", content: message },
  ], 2048, 0.7);

  const discovery = parseDiscoveryOutput(rawOutput);
  const displayMessage = discovery.message || rawOutput;
  const willGenerateDraft = ctx.request.includeMemory !== false && discoverySignalsDraft(discovery, ctx.memory.bim);

  EdgeRuntime.waitUntil(
    runUnderstandingBackground(ctx, message, displayMessage, discovery, ctx.request.includeMemory !== false)
  );

  return jsonResponse({
    response: displayMessage,
    layer: "discovery",
    layer_output: null,
    orchestrator: decision.reason,
    orchestrator_gaps: decision.gaps ?? [],
    orchestrator_blockers: decision.blockers ?? [],
    requested_layer: decision.requestedLayer ?? null,
    hasDraft: willGenerateDraft,
    memoryUpdated: true,
  });
}

function buildDiscoveryPrompt(ctx: PipelineContext, decision: OrchestratorDecision): string {
  const { project, memory } = ctx;
  const bim = memory.bim;
  const hasBIM = bim && (bim.facts.length > 0 || bim.assumptions.length > 0);
  const bimContext = ctx.request.bimContext ?? buildBIMContext(bim, project.title || "Untitled", project.description);

  // When redirected from Strategy or Execution, inject targeted redirect context
  let redirectBlock = "";
  if (decision.requestedLayer && (decision.gaps?.length || decision.blockers?.length)) {
    const targetName = decision.requestedLayer === "strategy" ? "Strategy" : "Execution";
    const topGap = decision.gaps?.[0] || decision.blockers?.[0] || "more information";
    const gapLines = [
      ...(decision.blockers ?? []).map(b => `  BLOCKER: ${b}`),
      ...(decision.gaps ?? []).map((g, i) => `  ${i + 1}. ${g}`),
    ].join("\n");

    redirectBlock = `
REDIRECT CONTEXT — USER WANTED ${targetName.toUpperCase()}:
They asked for ${targetName} work. We can't do it yet because specific things are missing.
PRIORITY GAPS:
${gapLines}

Most important next step: understand "${topGap}".
Respond naturally — acknowledge what they want, explain what we need first, then ask ONE question
that directly fills the top gap. Do NOT mention the routing system or layers.`;
  }

  return `You are an experienced founder and operator who has built, advised, and invested in dozens of startups.
You think clearly, speak directly, and engage with the actual idea — not the process of understanding it.

━━━ STEP 1: ANALYZE THE MESSAGE BEFORE ANYTHING ELSE ━━━
Before forming a response, extract everything the user's latest message tells you.
Do not rely on prior memory alone — treat this message as fresh intelligence.

Ask yourself:
- What new facts does this message contain? (customer type, problem specifics, solution approach, pricing intent, channels, team, constraints)
- What does it imply but not state directly? (assumptions worth surfacing)
- What goals or constraints are embedded in how they're describing this?
- What does this message change or confirm about the picture so far?

Populate new_facts, new_assumptions, new_goals, new_constraints, new_risks from this analysis.
If the message contradicts something in prior memory, note it.

Only AFTER this analysis: determine what's still missing and what question matters most.

━━━ STEP 2: RESPOND ━━━
Structure your response based on what you now know (prior memory + this message combined):

1. YOUR READ — open with a crisp summary of what the business is and what it's trying to do.
   State it confidently. Pull from everything you know: "So — you're building X for Y, trying to Z."
   If it's an early first message, just react to the idea directly.

2. THE LANDSCAPE — name what solutions and companies exist in this space. Specific names.
   What's been tried. Where incumbents are weak. What the closest analogy is.
   Skip this only if there is truly no context to work with yet.

3. THE OPEN QUESTION — one question, framed as a direction choice with examples.
   "Most companies here go route A (e.g. Notion) or route B (e.g. Linear) — which way are you leaning?"
   The question should come from the gap that most limits your read on this business right now.

RULES:
- Never mention workflow, layers, stages, or internal systems
- Never ask something you already know — the current understanding is below
- Lead with what you know, not what you don't
- Sound like you've thought about this space before — because you have

TONE: Confident, curious, direct. Like a YC partner in office hours. Not a chatbot collecting data.
No hollow affirmations. No "great question". No "that's interesting". Just engage with the substance.

MARKET LENS:
${bim?.market_bucket === "proven"
  ? `PROVEN MARKET. The problem exists — Salesforce, HubSpot, QuickBooks already proved it.
Push on differentiation and customer specificity. Name the obvious competitors and ask why someone would switch.`
  : bim?.market_bucket === "emerging"
  ? `EMERGING MARKET. The category is forming. Reference what's being built (Devin, Lindy, etc.) and ask what makes this different.
Validate that the problem is consistent — emerging markets have lots of hype and thin actual usage.`
  : bim?.market_bucket === "novel"
  ? `NOVEL MARKET. No established playbook. Don't assume the problem is real.
Reference the closest analogy and ask who has actually experienced this problem and paid to solve something like it.`
  : `Market category isn't clear yet. Figure out if this is entering an established space or creating a new one — that changes everything.`}

PRIOR UNDERSTANDING (already known — do not re-ask):
${bimContext}
${redirectBlock}

RESPONSE FORMAT — return ONLY this JSON:
{
  "message": "Your response as a founder advisor. Synthesizes prior memory AND what this message just told you. Confident read on the business, landscape named with specific companies, ONE question framed with concrete options. Conversational, direct, no system-speak. 4-6 sentences.",
  "new_facts": [{ "category": "target_customer|problem|solution|revenue_model|pricing|channel|competitor|team|market_size|feature|metric|other", "claim": "...", "value": "...", "evidence": "optional" }],
  "new_assumptions": [{ "category": "...", "claim": "...", "value": "..." }],
  "new_unknowns": [{ "category": "...", "claim": "active question to investigate — phrased as a question" }],
  "new_goals": ["goal the founder mentioned"],
  "new_constraints": ["constraint or limitation stated"],
  "new_risks": ["risk identified from what was said"],
  "confidence_updates": [{ "category": "...", "direction": "up|down", "reason": "..." }]
}
Only include arrays that have items.`;
}

function parseDiscoveryOutput(raw: string): DiscoveryOutput {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const p = JSON.parse(jsonMatch[0]) as Partial<DiscoveryOutput>;
      return {
        message: p.message || raw,
        new_facts: p.new_facts || [],
        new_assumptions: p.new_assumptions || [],
        new_unknowns: p.new_unknowns || [],
        new_goals: p.new_goals || [],
        new_constraints: p.new_constraints || [],
        new_risks: p.new_risks || [],
        confidence_updates: p.confidence_updates || [],
      };
    }
  } catch (_) { /* fall through */ }
  return { message: raw, new_facts: [], new_assumptions: [], new_unknowns: [], new_goals: [], new_constraints: [], new_risks: [], confidence_updates: [] };
}

function discoverySignalsDraft(discovery: DiscoveryOutput, bim?: BusinessIntelligenceModel): boolean {
  return discovery.new_facts.length > 0 || discovery.new_assumptions.length >= 2;
}

// ─── Layer 2: Understanding Route ─────────────────────────────────────────────
// Understanding is the owner of truth. It decides confidence, maturity stage, and drafts.

async function handleUnderstandingRoute(
  ctx: PipelineContext,
  message: string,
  decision: OrchestratorDecision
): Promise<Response> {
  const bim = ctx.memory.bim;
  if (!bim || (bim.facts.length === 0 && bim.assumptions.length === 0)) {
    return jsonResponse({
      response: "I don't have enough information yet to summarize. Tell me about your business — what problem are you solving and who are you solving it for?",
      layer: "understanding",
      layer_output: null,
      orchestrator: decision.reason,
      hasDraft: false,
      memoryUpdated: false,
    });
  }

  const prompt = buildDirectUnderstandingPrompt(ctx);
  const rawOutput = await callOpenAI(ctx.openaiApiKey, [
    { role: "system", content: prompt },
    { role: "user", content: message },
  ], 2048, 0.4);

  const parsedMessage = extractMessageFromJSON(rawOutput);
  const draft = generateDraft(bim, ctx.memory.understandingDraft);

  EdgeRuntime.waitUntil(persistDraft(ctx, draft));

  return jsonResponse({
    response: parsedMessage,
    layer: "understanding",
    layer_output: { draft },
    orchestrator: decision.reason,
    hasDraft: false,
    memoryUpdated: true,
  });
}

function buildDirectUnderstandingPrompt(ctx: PipelineContext): string {
  const { project, memory } = ctx;
  const bim = memory.bim!;
  const overall = Math.round(getOverallConfidence(bim) * 100);
  const bimContext = ctx.request.bimContext ?? buildBIMContext(bim, project.title || "Untitled", project.description);

  return `You are an experienced founder and operator giving your honest read on a business.
Write this like a smart investor who has done their homework is talking directly to the founder.
No headers. No bullet points. No system-speak. Paragraphs only — direct, specific, opinionated.

PROJECT: ${project.title || "Untitled"} | OVERALL CONFIDENCE: ${overall}%

EVERYTHING KNOWN SO FAR:
${bimContext}

WRITE a 3-5 paragraph read-out that:
1. Opens with a crisp, confident statement of what this business is and what it's trying to accomplish.
   State it plainly: "You're building X for Y, trying to Z." Use the known facts — don't hedge.
2. States what's been confirmed and what it implies. Be specific. Reference actual things you know.
3. Names the working assumptions — things that are being treated as true but haven't been proven yet.
   Frame these honestly: "The bet here is that..." or "This works if..."
4. Identifies what's missing and why it matters. Don't just list gaps — say what each gap means for the business.
   Where possible, offer examples of how others have approached this same gap.
5. Closes with the single most important next question — and explain why getting that answer matters most right now.

TONE: Confident, honest, specific. Like a YC partner giving end-of-session feedback.
Never use: "unknown", "not yet defined", "missing", "N/A", "TBD".
Never structure with numbered lists or bold headers — write in paragraphs.

OUTPUT FORMAT — return ONLY this JSON:
{
  "message": "3-5 paragraphs written directly for the founder. Confident read on the business. Working assumptions framed as bets, not facts. Gaps as decisions that need to be made, with examples where possible. Ends with the most important next question."
}`;
}

// ─── Layer 2: Understanding Background ───────────────────────────────────────
// Runs after every Discovery response. Owns all BIM mutations and draft generation.

async function runUnderstandingBackground(
  ctx: PipelineContext,
  userMessage: string,
  aiResponse: string,
  discovery: DiscoveryOutput,
  includeMemory: boolean
): Promise<void> {
  try {
    const prompt = buildUnderstandingPrompt(ctx, discovery);
    const rawOutput = await callOpenAI(ctx.openaiApiKey, [
      { role: "system", content: prompt },
      { role: "user", content: `USER: ${userMessage}\n\nDISCOVERY RESPONSE: ${aiResponse}\n\nDISCOVERY DATA:\n${JSON.stringify(discovery, null, 2)}` },
    ], 1500, 0.2);

    const understanding = parseUnderstandingOutput(rawOutput);

    await Promise.allSettled([
      includeMemory ? applyUnderstanding(ctx, understanding, discovery) : Promise.resolve(),
      persistInsights(ctx, understanding),
      updateBusinessContextFromConversation(ctx, userMessage),
    ]);
  } catch (err) {
    console.error("Understanding background failed:", err);
  }
}

function buildUnderstandingPrompt(ctx: PipelineContext, discovery: DiscoveryOutput): string {
  const { project, memory } = ctx;
  const bim = memory.bim;
  const bimSummary = bim
    ? `BIM: ${bim.facts.length} facts, ${bim.assumptions.length} assumptions, ${bim.unknowns.length} unknowns. Stage: ${bim.maturity_stage ?? "exploration"}. Confidence: ${Math.round(getOverallConfidence(bim) * 100)}%.`
    : "No BIM yet.";
  const draftCtx = memory.understandingDraft
    ? `Last draft: v${memory.understandingDraft.version} at ${memory.understandingDraft.confidenceAtGeneration}% confidence with ${memory.understandingDraft.factCountAtGeneration} facts.`
    : "No draft yet.";

  return `You are the Understanding Layer of Bizactly's AI system.
You are the OWNER OF TRUTH. You maintain the BIM and decide maturity stage.

BIM CONSTITUTION — classify every piece of information as one of:
- CONFIRMED: validated, high-confidence information (fact with evidence)
- HYPOTHESIS: working assumption being tested, needs validation
- INVESTIGATING: active question we're exploring — phrase as a question
- NEEDS RESOLUTION: two signals that conflict — must be resolved before strategy

FORBIDDEN PHRASES — never output these in claim text or insights:
"unknown", "not yet discovered", "not yet defined", "N/A", "TBD", "not specified",
"no information", "hasn't been identified". Frame gaps as open questions, not voids.

PROJECT: ${project.title || "Untitled"}
${bimSummary}
${draftCtx}

DISCOVERY FOUND:
- New facts: ${discovery.new_facts.length} | New assumptions: ${discovery.new_assumptions.length} | New unknowns: ${discovery.new_unknowns.length}
- New goals: ${discovery.new_goals.length} | New constraints: ${discovery.new_constraints.length} | New risks: ${discovery.new_risks.length}

MATURITY STAGE CRITERIA:
- exploration: idea exists, problem unclear, no customer confirmed
- validation: has problem + customer hypothesis, testing assumptions
- planning: problem + customer validated, solution direction clear
- building: strategy exists, actively developing product
- launch: product ready or launching
- growth: product live, optimising

DRAFT TRIGGER — set generate_draft=true ONLY when:
1. Confidence changes > 10% since last draft
2. A major contradiction is found or resolved
3. A new major business area is discovered (new category with fact/assumption)
4. User explicitly requested a summary
5. No draft exists yet AND we have ≥ 3 assumptions or ≥ 1 fact

MARKET BUCKET — classify the competitive landscape (set once, only update if new evidence changes it):
- "proven":   established market with known competitors (CRM, accounting software, social schedulers)
              → problem is known; validate DIFFERENTIATION only
- "emerging": market forming but not mature (AI agents, AI coworkers, AI project managers)
              → validate both PROBLEM EXISTENCE and DIFFERENTIATION
- "novel":    no established market; genuinely new interaction model or domain
              → first validate that the PROBLEM EXISTS at all before anything else

OUTPUT — return ONLY this JSON:
{
  "bim_updates": {
    "newClaims": [{ "category": "target_customer|problem|solution|revenue_model|pricing|channel|competitor|team|market_size|feature|metric|other", "claim": "...", "value": "...", "source": "user_stated|ai_inferred|user_confirmed|external_data", "evidence": "optional" }],
    "repeatedClaims": [{ "category": "...", "value": "...", "evidence": "optional" }],
    "confirmedClaims": [{ "category": "...", "value": "..." }],
    "changedClaims": [{ "category": "...", "oldValue": "...", "newValue": "...", "newClaim": "..." }],
    "newUnknowns": [{ "category": "...", "claim": "active question to investigate — phrased as a question, not a void" }],
    "resolvedUnknowns": [{ "category": "...", "answer": "..." }],
    "contradictions": [{ "categoryA": "...", "claimA": "...", "categoryB": "...", "claimB": "...", "description": "..." }],
    "newGoals": ["goal string"],
    "newConstraints": ["constraint string"],
    "newRisks": ["risk string"],
    "insights": ["under 100 chars — specific observation about this business, not generic"]
  },
  "maturity_stage": "exploration|validation|planning|building|launch|growth",
  "market_bucket": "proven|emerging|novel",
  "patterns": ["specific pattern observed in this business — not generic advice, max 3"],
  "missing_information": ["phrased as an active question e.g. 'What channel will reach early adopters?' — max 3"],
  "potential_opportunities": ["specific opportunity pattern, max 2"],
  "confidence_analysis": { "category": 0.0 },
  "generate_draft": true,
  "draft_reason": "why or null"
}
Only include arrays with items. Return valid JSON only.`;
}

function parseUnderstandingOutput(raw: string): UnderstandingOutput {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const p = JSON.parse(jsonMatch[0]) as Partial<UnderstandingOutput>;
      return {
        bim_updates: p.bim_updates || {},
        maturity_stage: p.maturity_stage ?? "exploration",
        market_bucket: p.market_bucket,
        patterns: p.patterns || [],
        missing_information: p.missing_information || [],
        potential_opportunities: p.potential_opportunities || [],
        confidence_analysis: p.confidence_analysis || {},
        generate_draft: p.generate_draft ?? false,
        draft_reason: p.draft_reason,
      };
    }
  } catch (_) { /* fall through */ }
  return { bim_updates: {}, maturity_stage: "exploration", patterns: [], missing_information: [], potential_opportunities: [], confidence_analysis: {}, generate_draft: false };
}

// ─── Layer 3: Strategy Route ──────────────────────────────────────────────────

async function handleStrategyRoute(
  ctx: PipelineContext,
  message: string,
  decision: OrchestratorDecision
): Promise<Response> {
  const prompt = buildStrategyPrompt(ctx, decision);
  const rawOutput = await callOpenAI(ctx.openaiApiKey, [
    { role: "system", content: prompt },
    { role: "user", content: message },
  ], 4096, 0.6);

  const strategyOutput = parseStrategyOutput(rawOutput, ctx.memory.strategy);
  const displayMessage = strategyOutput.message || "Here's the strategic framework based on what we know.";

  EdgeRuntime.waitUntil(persistStrategy(ctx, strategyOutput.strategy));

  return jsonResponse({
    response: displayMessage,
    layer: "strategy",
    layer_output: { strategy: strategyOutput.strategy },
    orchestrator: decision.reason,
    orchestrator_gaps: [],
    orchestrator_blockers: [],
    requested_layer: null,
    hasDraft: false,
    memoryUpdated: true,
  });
}

function buildStrategyPrompt(ctx: PipelineContext, decision: OrchestratorDecision): string {
  const { project, memory } = ctx;
  const bim = memory.bim;
  const bimContext = ctx.request.bimContext ?? buildBIMContext(bim, project.title || "Untitled", project.description);
  const existingStrategy = memory.strategy
    ? `\nEXISTING STRATEGY (v${memory.strategy.version}): update or refine it.\n${JSON.stringify(memory.strategy, null, 2)}`
    : "";

  return `You are the Strategy Layer of Bizactly's AI system.

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

BUSINESS MATURITY STAGE: ${decision.maturityStage.toUpperCase()}
PROJECT: ${project.title || "Untitled"}${project.description ? `\nDESCRIPTION: ${project.description}` : ""}

CURRENT BIM (source of truth):
${bimContext}
${existingStrategy}

TASK: Build or update the full strategic framework. Every field must be filled with either
a grounded decision or a labeled assumption — never left blank or vague.
Be specific to this business, not generic. Distinguish facts from assumptions throughout.

OUTPUT FORMAT — return ONLY this JSON:
{
  "message": "2-3 paragraph strategic overview — what was decided, which assumptions underpin it, what to validate first",
  "strategy": {
    "generatedAt": "${new Date().toISOString()}",
    "version": ${(memory.strategy?.version ?? 0) + 1},
    "lean_canvas": {
      "problem": ["top 3 specific problems your customers face — from BIM or reasoned assumption"],
      "solution": ["how you solve each problem — be concrete"],
      "unique_value_proposition": "clear, specific UVP for this exact business",
      "unfair_advantage": "what cannot be easily copied — or [ASSUMPTION] if unclear",
      "customer_segments": ["specific customer segments — not 'everyone' or 'businesses'"],
      "key_metrics": ["specific metrics that prove this is working"],
      "channels": ["specific channels to reach these customers"],
      "cost_structure": ["main cost drivers for this type of business"],
      "revenue_streams": ["specific revenue sources with rough sizing"]
    },
    "pricing": {
      "model": "freemium|subscription|usage|one-time|hybrid",
      "tiers": [{ "name": "Tier name", "price": "$X/mo", "features": ["feature 1"], "target": "who this tier is for" }],
      "rationale": "why this pricing model fits this market and customer"
    },
    "positioning": "For [specific customer] who [specific need], [product] is [category] that [specific benefit]. Unlike [specific alternative], [product] [specific differentiator].",
    "customer_acquisition": {
      "primary_channel": "the single most cost-effective first channel for this business",
      "approach": "specific acquisition approach matching the customer segment",
      "tactics": ["specific tactic 1", "specific tactic 2", "specific tactic 3"]
    },
    "recommendations": ["specific, actionable recommendation for this business — not generic"],
    "growth_strategy": ["specific growth lever 1", "specific growth lever 2"],
    "validation_plans": ["specific experiment to run before committing to this strategy"]
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

async function persistStrategy(ctx: PipelineContext, strategy: StrategyOutput): Promise<void> {
  try {
    const memory: AIMemory = JSON.parse(JSON.stringify(ctx.memory));
    memory.strategy = strategy;
    if (!memory.conversationContext) memory.conversationContext = {};
    memory.conversationContext.lastUpdated = new Date().toISOString();
    await ctx.supabase.from("projects").update({ ai_memory: memory, updated_at: new Date().toISOString() }).eq("id", ctx.request.projectId);
  } catch (err) {
    console.error("Failed to persist strategy:", err);
  }
}

// ─── Layer 4: Execution Route ─────────────────────────────────────────────────

async function handleExecutionRoute(
  ctx: PipelineContext,
  message: string,
  decision: OrchestratorDecision
): Promise<Response> {
  const prompt = buildExecutionPrompt(ctx, decision);
  const rawOutput = await callOpenAI(ctx.openaiApiKey, [
    { role: "system", content: prompt },
    { role: "user", content: message },
  ], 4096, 0.6);

  const executionOutput = parseExecutionOutput(rawOutput, ctx.memory.execution);
  const displayMessage = executionOutput.message || "Here's the execution plan.";

  EdgeRuntime.waitUntil(persistExecution(ctx, executionOutput.execution));

  return jsonResponse({
    response: displayMessage,
    layer: "execution",
    layer_output: { execution: executionOutput.execution },
    orchestrator: decision.reason,
    orchestrator_gaps: [],
    orchestrator_blockers: [],
    requested_layer: null,
    hasDraft: false,
    memoryUpdated: true,
  });
}

function buildExecutionPrompt(ctx: PipelineContext, decision: OrchestratorDecision): string {
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
  const bimContext = ctx.request.bimContext ?? buildBIMContext(memory.bim, project.title || "Untitled", project.description);
  const existingExecution = memory.execution
    ? `\nEXISTING EXECUTION PLAN (v${memory.execution.version}): update or extend it.\n${JSON.stringify(memory.execution, null, 2)}`
    : "";

  return `You are the Execution Layer of Bizactly's AI system.

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

BUSINESS MATURITY STAGE: ${decision.maturityStage.toUpperCase()}
PROJECT: ${project.title || "Untitled"}
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
        { "name": "...", "description": "...", "priority": "must|should|could", "effort": "low|medium|high" }
      ]
    },
    "roadmap": [
      { "phase": "Phase 1 — name", "duration": "X weeks", "goals": ["goal 1"], "features": ["feature 1"] }
    ],
    "sprint_plan": [
      {
        "sprint": 1, "duration": "2 weeks", "goal": "specific sprint goal",
        "tasks": [{ "task": "specific task", "type": "dev|design|marketing|research", "effort": "low|medium|high" }]
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

async function persistExecution(ctx: PipelineContext, execution: ExecutionOutput): Promise<void> {
  try {
    const memory: AIMemory = JSON.parse(JSON.stringify(ctx.memory));
    memory.execution = execution;
    if (!memory.conversationContext) memory.conversationContext = {};
    memory.conversationContext.lastUpdated = new Date().toISOString();
    await ctx.supabase.from("projects").update({ ai_memory: memory, updated_at: new Date().toISOString() }).eq("id", ctx.request.projectId);
  } catch (err) {
    console.error("Failed to persist execution:", err);
  }
}

// ─── Understanding Draft ──────────────────────────────────────────────────────
// Draft generation is owned entirely by Understanding.
// shouldGenerateDraft() enforces the 5 trigger rules.

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

async function persistDraft(ctx: PipelineContext, draft: UnderstandingDraft): Promise<void> {
  try {
    const memory: AIMemory = JSON.parse(JSON.stringify(ctx.memory));
    memory.understandingDraft = draft;
    if (memory.bim) {
      memory.bim.draft_version = draft.version;
      memory.bim.last_major_update = draft.generatedAt;
    }
    if (!memory.conversationContext) memory.conversationContext = {};
    memory.conversationContext.lastUpdated = new Date().toISOString();
    await ctx.supabase.from("projects").update({ ai_memory: memory, updated_at: new Date().toISOString() }).eq("id", ctx.request.projectId);
  } catch (err) {
    console.error("Failed to persist draft:", err);
  }
}

// ─── Apply Understanding to BIM ───────────────────────────────────────────────

async function applyUnderstanding(
  ctx: PipelineContext,
  understanding: UnderstandingOutput,
  discovery: DiscoveryOutput
): Promise<void> {
  const now = new Date().toISOString();
  const memory: AIMemory = JSON.parse(JSON.stringify(ctx.memory));

  if (!memory.bim) memory.bim = createBIM();
  let bim = memory.bim;

  const updates = understanding.bim_updates;
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
  for (const u of updates.newUnknowns || []) bim = addUnknown(bim, u.category, u.claim, now);
  for (const r of updates.resolvedUnknowns || []) {
    const unknown = bim.unknowns.find(u => u.category === r.category);
    if (unknown) {
      bim.unknowns = bim.unknowns.filter(u => u.id !== unknown.id);
      bim = addClaim(bim, { category: r.category, claim: r.answer, value: r.answer, source: "user_stated" }, now);
    }
  }
  for (const c of updates.contradictions || []) {
    const cA = findExistingClaim(bim, c.categoryA, c.claimA);
    const cB = findExistingClaim(bim, c.categoryB, c.claimB);
    if (cA && cB) bim = registerContradiction(bim, cA.id, cB.id, c.description, now);
  }

  // Merge goals/constraints/risks from both Discovery and Understanding
  const allGoals = new Set<string>([...(bim.goals ?? []), ...(discovery.new_goals ?? []), ...(updates.newGoals ?? [])]);
  const allConstraints = new Set<string>([...(bim.constraints ?? []), ...(discovery.new_constraints ?? []), ...(updates.newConstraints ?? [])]);
  const allRisks = new Set<string>([...(bim.risks ?? []), ...(discovery.new_risks ?? []), ...(updates.newRisks ?? [])]);
  bim.goals = [...allGoals].slice(0, 20);
  bim.constraints = [...allConstraints].slice(0, 20);
  bim.risks = [...allRisks].slice(0, 20);

  // Understanding sets the maturity stage and market bucket
  bim.maturity_stage = understanding.maturity_stage;
  if (understanding.market_bucket) bim.market_bucket = understanding.market_bucket;

  if (!memory.conversationContext) memory.conversationContext = {};
  memory.conversationContext.lastUpdated = now;
  memory.bim = bim;

  // Understanding decides whether to generate a draft
  if (shouldGenerateDraft(bim, memory.understandingDraft, understanding.generate_draft)) {
    memory.understandingDraft = generateDraft(bim, memory.understandingDraft);
    bim.draft_version = memory.understandingDraft.version;
    bim.last_major_update = memory.understandingDraft.generatedAt;
  }

  await ctx.supabase.from("projects").update({ ai_memory: memory, updated_at: now }).eq("id", ctx.request.projectId);
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

async function persistInsights(ctx: PipelineContext, understanding: UnderstandingOutput): Promise<void> {
  try {
    const rows: any[] = [];
    for (const insight of understanding.bim_updates.insights || []) {
      rows.push({ user_id: ctx.user.id, project_id: ctx.request.projectId, feedback_type: "insight", category: "general", title: "Insight", content: insight, trigger_event: "ai_response", input_context: {}, recommendations: [], is_actionable: false });
    }
    for (const action of understanding.bim_updates.actions || []) {
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
    bim.assumptions.forEach(a => { const r = a.repetitionCount > 1 ? ` (repeated ${a.repetitionCount}×)` : ""; lines.push(`  [HYPOTHESIS ${Math.round(a.confidence * 100)}%] [${a.category}] ${a.claim}${r}`); });
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
    bim.goals.forEach(g => lines.push(`  • ${g}`));
  }
  if (bim.constraints?.length) {
    lines.push(`\nCONSTRAINTS (${bim.constraints.length}):`);
    bim.constraints.forEach(c => lines.push(`  • ${c}`));
  }
  if (bim.risks?.length) {
    lines.push(`\nRISKS (${bim.risks.length}):`);
    bim.risks.forEach(r => lines.push(`  • ${r}`));
  }
  return lines.join("\n");
}

function getOverallConfidence(bim: BusinessIntelligenceModel): number {
  const scores = Object.values(bim.confidence_scores);
  return scores.length ? scores.reduce((s, v) => s + v, 0) / scores.length : 0;
}

function extractMessageFromJSON(raw: string): string {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) { const p = JSON.parse(jsonMatch[0]); return p.message || raw; }
  } catch (_) { /* fall through */ }
  return raw;
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
