export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  startup_name?: string;
  problem_statement?: string;
  value_proposition?: string;
  business_model?: string;
  competitive_advantage?: string;
  target_users?: TargetUsers;
  mvp_features_list?: MVPFeature[];
  launch_roadmap?: LaunchRoadmap;
  tech_stack: TechStack;
  features: Feature[];
  design_preferences: DesignPreferences;
  status: 'planning' | 'in_progress' | 'completed';
  ai_suggestions: AISuggestions;
  current_milestone?: MilestoneType;
  milestones_completed?: MilestonesCompleted;
  progress_percentage?: number;
  next_actions?: string[];
  ai_memory?: AIMemory;
  created_at: string;
  updated_at: string;
}

export interface TechStack {
  frontend: string[];
  backend: string[];
  database: string[];
  hosting: string[];
  authentication: string[];
  other?: string[];
}

export interface Feature {
  name: string;
  description: string;
  priority: 'must-have' | 'nice-to-have' | 'future';
  complexity: 'low' | 'medium' | 'high';
  status?: 'pending' | 'in_progress' | 'completed';
}

export interface DesignPreferences {
  style: string;
  colorScheme: string;
  layout: string;
  responsive: boolean;
  inspirations?: string[];
}

export interface AISuggestions {
  recommendations?: string[];
  warnings?: string[];
  alternatives?: string[];
  nextSteps?: string[];
}

export interface ProjectMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export interface ProjectConversation {
  id: string;
  project_id: string;
  messages: ProjectMessage[];
  created_at: string;
  updated_at: string;
}

export interface TargetUsers {
  primaryAudience?: string;
  demographics?: string;
  behaviors?: string;
  painPoints?: string[];
}

export interface MVPFeature {
  name: string;
  description: string;
  userValue?: string;
  priority: 'must-have' | 'nice-to-have' | 'future';
  complexity: 'low' | 'medium' | 'high';
  estimatedTime?: string;
}

export interface LaunchRoadmap {
  preLaunch?: LaunchPhase;
  launch?: LaunchPhase;
  postLaunch?: LaunchPhase;
}

export interface LaunchPhase {
  duration?: string;
  activities?: string[];
  goals?: string[];
}

export type MilestoneType =
  | 'idea_validation'
  | 'market_research'
  | 'lean_canvas'
  | 'mvp_plan'
  | 'launch';

export interface MilestoneStatus {
  completed: boolean;
  completedAt?: string;
  notes?: string;
}

export interface MilestonesCompleted {
  idea_validation: MilestoneStatus;
  market_research: MilestoneStatus;
  lean_canvas: MilestoneStatus;
  mvp_plan: MilestoneStatus;
  launch: MilestoneStatus;
}

export interface Milestone {
  id: MilestoneType;
  title: string;
  description: string;
  icon: string;
  color: string;
  requiredFields?: string[];
  suggestedActions: string[];
}

// ─── Business Intelligence Model (BIM) ───────────────────────────────────────
//
// BIM CONSTITUTION:
// Every piece of information must be one of: FACT | ASSUMPTION | UNKNOWN | CONTRADICTION
//   - Facts require validation
//   - Assumptions require evidence
//   - Unknowns require investigation
//   - Contradictions require resolution
// No layer may present an assumption as a fact.
// Understanding is the sole owner of truth.
//
// LEARNING RULES:
// An item graduates from assumption → fact when:
//   1. Explicitly confirmed by the user
//   2. Stated consistently 3+ times across conversations
//   3. Supported by 2+ independent pieces of evidence

// Business maturity stage — set by Understanding, consumed by Orchestrator for routing
export type BusinessMaturityStage =
  | 'exploration'   // Stage 1: idea exists, not much else
  | 'validation'    // Stage 2: hypothesis formed, testing begins
  | 'planning'      // Stage 3: validated enough to plan
  | 'building'      // Stage 4: building the product
  | 'launch'        // Stage 5: releasing to market
  | 'growth';       // Stage 6: optimising and scaling

export type ClaimStatus = 'assumption' | 'fact' | 'unknown' | 'invalidated';

export type ClaimSource =
  | 'user_stated'       // User said it directly
  | 'user_confirmed'    // User explicitly confirmed AI's understanding
  | 'ai_inferred'       // AI inferred from context
  | 'external_data'     // From external validation (interviews, data, etc.)
  | 'repeated';         // Marked repeated — same claim heard again

export interface BusinessClaim {
  id: string;
  category: string;
  claim: string;
  value: string;
  status: ClaimStatus;
  confidence: number;        // 0–1
  evidence: string[];
  sources: ClaimSource[];
  repetitionCount: number;
  firstSeenAt: string;
  lastUpdatedAt: string;
  promotedToFactAt?: string;
  invalidatedAt?: string;
  invalidationReason?: string;
}

export interface Contradiction {
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

// Market bucket — set by Understanding after classification, drives discovery focus
// proven:  market exists (CRM, scheduling tools) → validate differentiation only
// emerging: market forming (AI agents) → validate both problem AND differentiation
// novel:   no established market (genuinely new) → first validate problem exists at all
export type MarketBucket = 'proven' | 'emerging' | 'novel';

export interface BusinessIntelligenceModel {
  // Core epistemic categories (BIM Constitution)
  facts: BusinessClaim[];
  assumptions: BusinessClaim[];
  unknowns: BusinessClaim[];
  contradictions: Contradiction[];
  // Extended knowledge categories (Discovery output)
  goals: string[];
  constraints: string[];
  risks: string[];
  // Confidence per-category (0–1)
  confidence_scores: Record<string, number>;
  // Maturity stage — set by Understanding, read by Orchestrator
  maturity_stage: BusinessMaturityStage;
  // Market bucket — set by Understanding, drives discovery focus
  market_bucket?: MarketBucket;
  // Draft version tracking — owned by Understanding
  draft_version: number;
  last_major_update: string;
  last_updated: string;
  version: number;
}

// Kept for backwards compatibility — BIM is the canonical model going forward
export type EpistemicStatus = ClaimStatus;
export interface BusinessBelief extends Omit<BusinessClaim, 'id' | 'value' | 'category' | 'evidence' | 'sources' | 'repetitionCount' | 'firstSeenAt' | 'lastUpdatedAt'> {
  evidence?: string;
  source?: ClaimSource;
  raisedAt?: string;
  updatedAt?: string;
}

// ─── Understanding Draft ──────────────────────────────────────────────────────
// Generated by Understanding only when understanding meaningfully increases:
//   1. Confidence changes > 10% since last draft
//   2. A major contradiction is found or resolved
//   3. A new major business area is discovered
//   4. User explicitly requests a summary
//   5. No draft exists yet AND ≥ 3 assumptions or ≥ 1 fact

export interface UnderstandingDraft {
  version: number;
  generatedAt: string;
  overallConfidence: number;    // 0–100 (percentage)
  facts: string[];
  assumptions: string[];
  unknowns: string[];
  goals: string[];
  constraints: string[];
  risks: string[];
  highlights?: string[];        // what changed since last draft
  factCountAtGeneration: number;
  resolvedContradictionsAtGeneration: number;
  confidenceAtGeneration: number;
  maturityStage: BusinessMaturityStage;
}

// ─── Layer 3: Strategy Output ─────────────────────────────────────────────────

export interface LeanCanvas {
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

export interface PricingTier {
  name: string;
  price: string;
  features: string[];
  target?: string;
}

export interface StrategyOutput {
  generatedAt: string;
  version: number;
  lean_canvas?: LeanCanvas;
  pricing?: {
    model: string;
    tiers: PricingTier[];
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

// ─── Layer 4: Execution Output ────────────────────────────────────────────────

export interface MVPFeatureSpec {
  name: string;
  description: string;
  priority: 'must' | 'should' | 'could';
  effort: 'low' | 'medium' | 'high';
}

export interface MVPSpec {
  goal: string;
  success_metric: string;
  features: MVPFeatureSpec[];
}

export interface RoadmapPhase {
  phase: string;
  duration: string;
  goals: string[];
  features?: string[];
}

export interface SprintTask {
  task: string;
  type: 'dev' | 'design' | 'marketing' | 'research';
  effort?: 'low' | 'medium' | 'high';
}

export interface Sprint {
  sprint: number;
  duration: string;
  goal: string;
  tasks: SprintTask[];
}

export interface ExecutionOutput {
  generatedAt: string;
  version: number;
  mvp?: MVPSpec;
  roadmap?: RoadmapPhase[];
  sprint_plan?: Sprint[];
  technical_specification?: string;
  marketing_checklist?: string[];
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export type AILayer = 'discovery' | 'understanding' | 'strategy' | 'execution';

export interface OrchestratorDecision {
  layer: AILayer;
  reason: string;
  confidence: number;
  requestedLayer?: AILayer;
  gaps?: string[];
  blockers?: string[];
  maturityStage?: BusinessMaturityStage;
}

// ─── Unified Reasoning Architecture ──────────────────────────────────────────
// The orchestrator classifies every message into one of these interaction types
// rather than blindly treating every message as a decision.

export type InteractionType =
  | 'knowledge_question'
  | 'business_update'
  | 'decision'
  | 'strategy_request'
  | 'planning_request'
  | 'execution_request'
  | 'outcome_report'
  | 'general_conversation';

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
  confidence: number;
}

export interface AIMemory {
  founderProfile?: FounderProfile;
  idea?: IdeaMemory;
  market?: MarketMemory;
  businessModel?: BusinessModelMemory;
  product?: ProductMemory;
  validation?: ValidationMemory;
  progress?: ProgressMemory;
  conversationContext?: ConversationContext;
  // The canonical Business Intelligence Model
  bim?: BusinessIntelligenceModel;
  // Latest understanding draft (generated when understanding increases significantly)
  understandingDraft?: UnderstandingDraft;
  // Layer 3 output — persisted strategy
  strategy?: StrategyOutput;
  // Layer 4 output — persisted execution plan
  execution?: ExecutionOutput;
  // Conversation messages stored for session resumption
  conversationMessages?: Array<{ id: string; role: 'assistant' | 'user'; content: string; timestamp: string; suggestions?: string[] }>;
  compiledData?: Record<string, unknown>;
  completedMilestones?: string[];
  conversationHistory?: Array<{ role: string; content: string }>;
}

export interface FounderProfile {
  experienceLevel?: string;
  industryKnowledge?: string;
  goals?: string[];
  strengths?: string[];
  weaknesses?: string[];
  background?: string;
}

export interface IdeaMemory {
  problem?: string;
  solution?: string;
  uniqueValue?: string;
  evolution?: string[];
  pivots?: Array<{
    from: string;
    to: string;
    reason: string;
    date: string;
  }>;
}

export interface MarketMemory {
  targetCustomer?: string;
  marketSize?: string;
  competitors?: string[];
  competitiveAdvantage?: string;
  marketTrends?: string[];
  barriers?: string[];
}

export interface BusinessModelMemory {
  revenueModel?: string;
  pricingStrategy?: string;
  unitEconomics?: string;
  monetizationHypotheses?: string[];
  costStructure?: string[];
}

export interface ProductMemory {
  coreFeatures?: string[];
  roadmap?: Array<{
    phase: string;
    features: string[];
    timeline: string;
  }>;
  techStack?: string[];
  mvpScope?: string;
  designPrinciples?: string[];
}

export interface ValidationMemory {
  assumptions?: Array<{
    assumption: string;
    status: 'untested' | 'testing' | 'validated' | 'invalidated';
    evidence?: string;
  }>;
  risks?: Array<{
    risk: string;
    severity: 'low' | 'medium' | 'high';
    mitigation?: string;
  }>;
  experiments?: Array<{
    name: string;
    status: 'planned' | 'running' | 'completed';
    results?: string;
  }>;
  customerInterviews?: number;
  keyLearnings?: string[];
}

export interface ProgressMemory {
  stage?: string;
  completedTasks?: string[];
  currentFocus?: string;
  blockers?: string[];
  nextSteps?: string[];
  milestonesAchieved?: Array<{
    milestone: string;
    date: string;
  }>;
}

export interface ConversationContext {
  topicsDiscussed?: string[];
  questionsAsked?: string[];
  adviceGiven?: string[];
  lastUpdated?: string;
  conversationSummary?: string;
  userPreferences?: {
    communicationStyle?: string;
    detailLevel?: string;
    priorities?: string[];
  };
}

// ─── Decision Provenance & Reasoning Memory (Milestone 2) ────────────────────
//
// Separates useful business reasoning from conversational noise and creates a
// persistent, traceable history of important recommendations and decisions.
//
// information → reasoning event → recommendation → founder decision → outcome

export type ReasoningEventType =
  | 'founder_constraint'
  | 'founder_goal'
  | 'founder_preference'
  | 'business_fact'
  | 'market_information'
  | 'customer_information'
  | 'financial_information'
  | 'product_information'
  | 'competitor_information'
  | 'assumption'
  | 'risk'
  | 'opportunity'
  | 'evidence'
  | 'retrieved_memory'
  | 'prior_decision'
  | 'recommendation_factor'
  | 'contradiction'
  | 'outcome_signal'
  | 'other';

export type ReasoningEventSource =
  | 'founder_input'
  | 'business_memory'
  | 'retrieved_information'
  | 'ai_inference';

export type ReasoningEventImportance = 'low' | 'medium' | 'high';

export type ReasoningEventRelevance =
  | 'candidate'
  | 'relevant'
  | 'supporting'
  | 'influential'
  | 'decisive'
  | 'irrelevant'
  | 'superseded'
  | 'contradicted'
  | 'uncertain';

export type InfluenceDirection = 'supports' | 'opposes' | 'neutral';
export type InfluenceStrength = 'weak' | 'moderate' | 'strong';

export interface ReasoningEvent {
  id: string;
  project_id: string;
  conversation_id?: string;
  decision_id?: string;
  event_type: ReasoningEventType;
  content: string;
  source: ReasoningEventSource;
  importance: ReasoningEventImportance;
  relevance_status: ReasoningEventRelevance;
  confidence: number;
  influence_direction?: InfluenceDirection;
  influence_strength?: InfluenceStrength;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type DecisionType =
  | 'product'
  | 'pricing'
  | 'customer'
  | 'marketing'
  | 'positioning'
  | 'business_model'
  | 'feature'
  | 'MVP'
  | 'launch'
  | 'growth'
  | 'resource_allocation'
  | 'strategy'
  | 'other';

export type DecisionStatus =
  | 'proposed'
  | 'awaiting_founder'
  | 'founder_decided'
  | 'implemented'
  | 'completed'
  | 'abandoned'
  | 'outcome_available';

export interface DecisionRecord {
  id: string;
  project_id: string;
  title: string;
  decision_type: DecisionType;
  decision_question: string;
  context_summary?: string;
  recommendation?: string;
  recommendation_summary?: string;
  recommendation_confidence: number;
  status: DecisionStatus;
  founder_decision_id?: string;
  outcome_id?: string;
  created_at: string;
  updated_at: string;
  // Joined fields (populated by service)
  reasoning_events?: DecisionReasoningEvent[];
  founder_decision?: FounderDecision;
  outcome?: Outcome;
}

export type InfluenceRole =
  | 'constraint'
  | 'supporting_evidence'
  | 'opportunity'
  | 'risk'
  | 'assumption'
  | 'founder_preference'
  | 'business_fact'
  | 'prior_learning'
  | 'contradiction'
  | 'decisive_factor';

export interface DecisionReasoningEvent {
  id: string;
  decision_id: string;
  reasoning_event_id: string;
  relevance: ReasoningEventRelevance;
  influence_strength: InfluenceStrength;
  influence_role: InfluenceRole;
  created_at: string;
  // Joined field
  reasoning_event?: ReasoningEvent;
}

export type FounderDecisionStatus =
  | 'accepted_recommendation'
  | 'modified_recommendation'
  | 'rejected_recommendation'
  | 'chose_alternative'
  | 'deferred'
  | 'unknown';

export interface FounderDecision {
  id: string;
  decision_id: string;
  selected_option: string;
  decision_text: string;
  rationale?: string;
  decision_status: FounderDecisionStatus;
  decided_at: string;
}

export type OutcomeStatus =
  | 'pending'
  | 'positive'
  | 'negative'
  | 'mixed'
  | 'inconclusive'
  | 'abandoned'
  | 'unknown';

export interface Outcome {
  id: string;
  decision_id: string;
  founder_decision_id?: string;
  outcome_status: OutcomeStatus;
  outcome_summary?: string;
  measured_result?: string;
  expected_result?: string;
  success_rating?: number;
  founder_assessment?: string;
  lessons_learned?: string;
  recorded_at: string;
}

// What the edge function returns for decision provenance in the AI response
export interface DecisionProvenanceData {
  decision_record_id?: string;
  reasoning_event_ids?: string[];
}
