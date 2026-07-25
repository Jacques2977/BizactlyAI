# Application Architecture

This document outlines the improved architecture implementing proper separation of concerns and security best practices.

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
   - Load project from database (with RLS check)
   - Load ai_memory from project
   - Build system prompt with memory context
   - Call OpenAI API with enriched context
   - Extract memory updates from response
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
   - Each layer has single responsibility
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
```

## Future Enhancements

1. **Conversation History**
   - Store message history in database
   - Support multi-turn conversations
   - Enable conversation search

2. **Advanced Memory Management**
   - ML-based memory extraction
   - Automatic memory summarization
   - Memory importance scoring

3. **Tool Integration**
   - Add more specialized tools
   - Dynamic tool selection
   - Tool result caching

4. **Analytics**
   - Track memory growth over time
   - Measure conversation quality
   - User engagement metrics
