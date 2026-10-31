# Application Architecture

This document outlines the architecture implementing proper separation of concerns and security best practices.

## Architecture Flow

```
User
  ↓
React Frontend (Auth Context + UI Components)
  ↓
Supabase Client (Authentication Layer)
  ↓
Edge Function: AI Orchestrator (Business Logic Layer)
  ↓
[Auth Validation] → [Load Project & Memory] → [Build Context]
  ↓
OpenAI API (AI Processing)
  ↓
[Extract Memory Updates] → [Update Database] → [Return Response]
  ↓
Frontend (UI Updates with Fresh Data)
```

## Layer Responsibilities

### 1. Frontend Layer (`src/`)

**Purpose**: UI rendering, user interactions, client-side state management

**Components**:
- `contexts/AuthContext.tsx` - Manages authentication state using Supabase Auth
- `components/` - React UI components
- `lib/supabase.ts` - Supabase client configuration
- `services/aiOrchestratorService.ts` - API client for AI orchestrator
- `services/databaseService.ts` - Database operations with RLS

**Security**:
- Uses Supabase Auth for secure authentication
- All database queries respect Row Level Security (RLS)
- No API keys exposed to client

### 2. Authentication Layer (Supabase Auth)

**Purpose**: Secure user authentication and authorization

**Features**:
- Email/password authentication
- JWT token management
- Session handling with automatic refresh
- User metadata storage

**Security**:
- Passwords never stored in plaintext
- JWT tokens for API authorization
- Automatic session expiry
- Built-in protection against common attacks

### 3. Backend Layer (Edge Functions)

**Location**: `supabase/functions/ai-orchestrator/`

**Purpose**: Business logic, API orchestration, security enforcement

**Responsibilities**:
1. **Authentication Validation**
   - Verify JWT tokens
   - Ensure user authorization

2. **Data Access Control**
   - Load project data with user verification
   - Enforce ownership checks
   - Respect RLS policies

3. **Memory Management**
   - Load structured project memory from database
   - Build context for AI prompts
   - Extract and structure memory updates

4. **AI Orchestration**
   - Construct system prompts with memory context
   - Call OpenAI API securely
   - Handle errors and rate limiting

5. **Database Updates**
   - Update project memory atomically
   - Track conversation context
   - Maintain data consistency

**Security**:
- Validates all requests with JWT
- Uses service role key (never exposed to client)
- Enforces user ownership on all operations
- Sanitizes all inputs and outputs

### 4. Database Layer (Supabase PostgreSQL)

**Purpose**: Persistent data storage with security policies

**Schema**:
```sql
projects {
  id: uuid
  user_id: uuid (FK to auth.users)
  title: text
  description: text
  ai_memory: jsonb
  created_at: timestamp
  updated_at: timestamp
}
```

**Security (RLS Policies)**:
- Users can only access their own projects
- All queries filtered by `user_id = auth.uid()`
- Service role can bypass RLS for system operations
- Memory updates use helper functions for atomic operations

### 5. AI Memory Structure

**Purpose**: Persistent context that grows with each conversation

**Schema** (`ai_memory` JSONB field):
```typescript
{
  founderProfile: {
    experienceLevel: string
    industryKnowledge: string
    goals: string[]
    strengths: string[]
    weaknesses: string[]
  }
  idea: {
    problem: string
    solution: string
    uniqueValue: string
    evolution: string[]
  }
  market: {
    targetCustomer: string
    marketSize: string
    competitors: string[]
    competitiveAdvantage: string
  }
  businessModel: {
    revenueModel: string
    pricingStrategy: string
    unitEconomics: string
  }
  product: {
    coreFeatures: string[]
    roadmap: Array<{phase, features, timeline}>
    techStack: string[]
    mvpScope: string
  }
  validation: {
    assumptions: Array<{assumption, status, evidence}>
    risks: Array<{risk, severity, mitigation}>
    experiments: Array<{name, status, results}>
    customerInterviews: number
    keyLearnings: string[]
  }
  progress: {
    stage: string
    completedTasks: string[]
    currentFocus: string
    blockers: string[]
    nextSteps: string[]
  }
  conversationContext: {
    topicsDiscussed: string[]
    questionsAsked: string[]
    adviceGiven: string[]
    lastUpdated: string
  }
}
```

---

## Canonical Pipeline Contracts (Milestone 0 — Brain Foundation)

### Overview

Every message flows through the same 8-stage pipeline. The contracts between
stages are formalized in `pipeline-contracts.ts` (edge function) and mirrored
in `src/types/pipeline.ts` (frontend).

```
UserInput → SituationContext → IntentClassification → DecisionContext
         → ReasoningResult → CapabilityRequest → CapabilityResult
         → MemoryUpdate
```

### Stage 1: UserInput

| Field | Owner | Required | Description |
|-------|-------|----------|-------------|
| message | Client | Yes | The user's message text |
| projectId | Client | Yes | Project UUID |
| conversationId | Client | No | Conversation UUID for session tracking |
| includeMemory | Client | No | Whether to load BIM memory (default: true) |
| bimContext | Client | No | Pre-rendered BIM context string |
| contextStage | Client | No | Current context stage hint |
| contextConfidence | Client | No | Current context confidence hint |
| contextHasStrategy | Client | No | Whether strategy already exists |

**Input**: HTTP request body
**Output**: Validated `UserInput` (validated via `validateUserInput`)
**Responsibility**: Orchestrator receives and validates raw user input
**Failure behavior**: Returns 400 if message or projectId is missing

### Stage 2: SituationContext

| Field | Owner | Required | Description |
|-------|-------|----------|-------------|
| situation_analysis | Reasoning | Yes | 1-2 sentence summary of what's happening |
| relevant_context | Reasoning | Yes | Key facts/assumptions from BIM relevant to this message |

**Input**: UserInput + loaded BIM memory
**Output**: Fields carried inside ReasoningResult
**Responsibility**: Reasoning stage determines what is happening in the business
**Failure behavior**: Falls back to "Analyzing message." with empty relevant_context

### Stage 3: IntentClassification

| Field | Owner | Required | Description |
|-------|-------|----------|-------------|
| intent | Reasoning | Yes | One of 8 interaction types |

**Interaction types**: `knowledge_question`, `business_update`, `decision`,
`strategy_request`, `planning_request`, `execution_request`, `outcome_report`,
`general_conversation`

**Input**: UserInput + SituationContext (same LLM call)
**Output**: Single `InteractionType` field on ReasoningResult
**Responsibility**: Reasoning stage determines interaction type
**Failure behavior**: Falls back to `general_conversation`

### Stage 4: DecisionContext

| Field | Owner | Required | Description |
|-------|-------|----------|-------------|
| is_decision | Reasoning | Yes | Whether a genuine decision with multiple viable paths exists |
| goals | Reasoning | Yes | What the user is trying to accomplish |
| constraints | Reasoning | Yes | Limitations or requirements that apply |

**Input**: UserInput + SituationContext + IntentClassification
**Output**: Fields carried inside ReasoningResult
**Responsibility**: Reasoning stage determines whether a decision is required
**Failure behavior**: `is_decision` defaults to `false`; goals/constraints default to empty arrays

### Stage 5: ReasoningResult

| Field | Owner | Required | Description |
|-------|-------|----------|-------------|
| decision_options | Reasoning | No | Evaluated alternatives (only when is_decision=true) |
| recommendation | Reasoning | No | Recommendation with rationale, alternatives, tradeoffs, confidence |
| response | Reasoning | Yes | The user-facing response text |
| bim_updates | Reasoning | Yes | Instructions for memory update (consumed by stage 8) |
| maturity_stage | Reasoning | Yes | Business maturity classification |
| market_bucket | Reasoning | No | Market type classification |
| needs_strategy | Reasoning | Yes | Whether strategy capability should be invoked |
| needs_execution | Reasoning | Yes | Whether execution capability should be invoked |
| generate_draft | Reasoning | Yes | Whether to generate an understanding draft |
| patterns | Reasoning | Yes | Observed patterns (max 3) |
| missing_information | Reasoning | Yes | Open questions (max 3) |
| potential_opportunities | Reasoning | Yes | Opportunities identified (max 2) |
| confidence_analysis | Reasoning | Yes | Per-category confidence scores |

**Input**: UserInput + full BIM context
**Output**: Complete structured reasoning (single OpenAI call)
**Responsibility**: Reasoning stage produces options/recommendation/rationale
**Failure behavior**: Falls back to raw text truncated to 500 chars with `general_conversation` intent

### Stage 6: CapabilityRequest

| Field | Owner | Required | Description |
|-------|-------|----------|-------------|
| type | Orchestrator | Yes | `strategy` or `execution` |
| reasoning | Orchestrator | Yes | The ReasoningResult to pass to the capability |

**Alternative output**: `CapabilityRedirect` with gaps/blockers if readiness not met

**Input**: ReasoningResult (intent + needs_strategy/needs_execution flags)
**Output**: A `CapabilityRequest` if a capability should be invoked, or a `CapabilityRedirect`, or null
**Responsibility**: Orchestrator determines whether Strategy/Execution is needed
**Failure behavior**: If readiness not met, returns redirect with gaps/blockers. If no capability needed, returns null.

### Stage 7: CapabilityResult

| Field | Owner | Required | Description |
|-------|-------|----------|-------------|
| message | Capability | Yes | User-facing message from the capability |
| strategy | Strategy | No | Strategy output (Lean Canvas, pricing, positioning, etc.) |
| execution | Execution | No | Execution output (MVP, roadmap, sprint plan, etc.) |

**Input**: CapabilityRequest (which includes ReasoningResult + BIM context)
**Output**: Specialized result — strategy output or execution output + message
**Responsibility**: Requested capability returns its specialized result
**Failure behavior**: Falls back to raw text with empty strategy/execution object

**Important**: Capabilities CONSUME the reasoning context. They do not
independently classify intent, evaluate decisions, or update memory.

### Stage 8: MemoryUpdate

| Field | Owner | Required | Description |
|-------|-------|----------|-------------|
| reasoning | Memory | Yes | The reasoning result containing BIM update instructions |
| strategy | Memory | No | Strategy output if a strategy capability was invoked |
| execution | Memory | No | Execution output if an execution capability was invoked |
| synchronousDraft | Memory | No | Draft generated synchronously for immediate response |

**Input**: ReasoningResult + optional CapabilityResult + synchronous draft
**Output**: void (persists to database)
**Responsibility**: Memory stage produces validated updates to business memory
**Failure behavior**: Logs error, does not block response (runs in background via `EdgeRuntime.waitUntil`)

### ReasoningContext

The shared internal context object that moves through the pipeline. Each stage
reads from and enriches this object. No stage invents its own incompatible
representation.

```typescript
interface ReasoningContext {
  // Stage 1: UserInput
  userMessage: string;
  projectId: string;
  conversationId?: string;

  // Business context (loaded before reasoning)
  businessContext: unknown;
  memory: unknown;

  // Stage 2: SituationContext
  situation: string;
  relevantKnowledge: string[];

  // Stage 3: IntentClassification
  interactionType: InteractionType;

  // Stage 4: DecisionContext
  decisionRequired: boolean;
  goals: string[];
  constraints: string[];

  // Stage 5: ReasoningResult
  decision?: { options: DecisionOption[]; recommendation?: StructuredRecommendation };

  // Stage 6: CapabilityRequest
  capabilityRequests: CapabilityRequest[];
  capabilityRedirect?: CapabilityRedirect;

  // Stage 7: CapabilityResult
  capabilityResult?: CapabilityResult;

  // Stage 8: MemoryUpdate
  memoryUpdate?: MemoryUpdate;

  // Provenance
  provenance: {
    completedStages: PipelineStage[];
    stageTimings: Record<PipelineStage, number>;
  };
}
```

### Error/Fallback Contract

Every stage must handle failure gracefully:

1. **Invalid user input**: Return 400 with error message
2. **Reasoning LLM call fails**: Return generic response with fallback intent (`general_conversation`)
3. **Capability fails**: Return reasoning response without the specialized output
4. **Memory update fails**: Log the error but still return the response (runs in background)

### Boundary Validation

Stage outputs are validated at pipeline boundaries using lightweight type guards
from `pipeline-contracts.ts`:

- `validateUserInput()` — validates HTTP request body before entering the pipeline
- `validateReasoningResult()` — validates parsed LLM output, applies fallbacks for missing fields

These are not a validation framework — just enough to catch malformed LLM output
before it reaches the next stage.

---

## Data Flow Example

### User sends a message to AI

1. **Frontend** (`ChatInterface.tsx`)
   ```typescript
   const response = await aiOrchestrator.chatWithProject(projectId, message);
   ```

2. **AI Orchestrator Service** (`aiOrchestratorService.ts`)
   ```typescript
   - Get user session token from Supabase Auth
   - Make authenticated POST request to Edge Function
   - Include projectId and message in body
   ```

3. **Edge Function** (`ai-orchestrator/index.ts`)
   ```typescript
   - Validate JWT token
   - Get user from token
   - Validate UserInput (Stage 1)
   - Load project from database (with RLS check)
   - Load ai_memory from project
   - Build system prompt with memory context
   - Call OpenAI API with enriched context (Stages 2-5)
   - Validate ReasoningResult at boundary
   - Check capability readiness (Stage 6)
   - Invoke Strategy/Execution capability if needed (Stage 7)
   - Extract memory updates from response (Stage 8, background)
   - Update project.ai_memory in database
   - Return AI response to client
   ```

4. **Frontend Updates**
   ```typescript
   - Display AI response
   - Memory automatically updated in database
   - Next conversation includes updated context
   ```

## Security Features

### 1. Authentication
- Supabase Auth handles all credential management
- JWT tokens used for API authorization
- Tokens automatically refreshed

### 2. Authorization
- Row Level Security (RLS) on all tables
- Users can only access their own data
- Service role used only in Edge Functions

### 3. API Keys
- OpenAI API key stored as environment variable
- Never exposed to client
- Only accessible in Edge Functions

### 4. Data Validation
- Input sanitization in Edge Functions
- Type checking with TypeScript
- Pipeline boundary validation (Milestone 0)
- Error handling at every layer

### 5. CORS
- Proper CORS headers on Edge Functions
- Restricts unauthorized access
- Allows legitimate client requests

## Benefits of This Architecture

1. **Security**
   - API keys never exposed to client
   - Proper authentication and authorization
   - Database-level security with RLS

2. **Scalability**
   - Edge Functions auto-scale
   - Database handles concurrent requests
   - Stateless backend design

3. **Maintainability**
   - Clear separation of concerns
   - Each pipeline stage has explicit input/output contracts
   - Easy to test and debug

4. **Performance**
   - Edge Functions deployed globally
   - Database queries optimized with indexes
   - Efficient memory context building

5. **Data Consistency**
   - Atomic database updates
   - Transaction support
   - Structured memory format

## Environment Variables

### Frontend (`.env`)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Edge Functions (Auto-configured by Supabase)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-key
```

## Deployment

### Frontend
```bash
npm run build
# Deploy to Vercel, Netlify, etc.
```

### Edge Functions
```bash
# Automatically deployed via Supabase
# Already deployed: ai-orchestrator
```

### Database Migrations
```bash
# Migrations already applied:
# - 20260317003006_add_ai_memory_context.sql
# - 20260901234755_create_decision_provenance_system.sql
```
