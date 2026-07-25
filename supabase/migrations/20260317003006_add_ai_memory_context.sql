/*
  # Add AI Memory Context to Projects

  ## Summary
  Adds comprehensive AI memory structure to store context about each project,
  enabling the AI to remember and build upon previous conversations with users
  about their startup projects.

  ## Changes Made

  ### 1. Add AI Memory Column
  - `ai_memory` (jsonb) - Structured memory object storing all AI context about the project

  ### 2. Memory Structure
  The ai_memory column stores:
  - Founder profile (experience, industry knowledge, goals)
  - Idea details (problem, solution, unique value)
  - Market information (target customer, market size, competitors)
  - Business model (revenue model, pricing strategy)
  - Product details (core features, roadmap, tech stack)
  - Validation data (assumptions, risks, experiments)
  - Progress tracking (stage, completed tasks)
  - Conversation history summaries

  ## Example Memory Object
  {
    "founderProfile": {
      "experienceLevel": "first-time founder",
      "industryKnowledge": "moderate",
      "goals": ["build sustainable business", "achieve product-market fit"],
      "strengths": ["technical skills", "problem-solving"],
      "weaknesses": ["sales", "marketing"]
    },
    "idea": {
      "problem": "Small businesses struggle with inventory management",
      "solution": "AI-powered inventory optimization platform",
      "uniqueValue": "Real-time predictions with 95% accuracy",
      "evolution": ["Initial idea was broader", "Narrowed to specific niche"]
    },
    "market": {
      "targetCustomer": "E-commerce businesses with $100K-$1M revenue",
      "marketSize": "$50B TAM, $5B SAM, $500M SOM",
      "competitors": ["Competitor A - enterprise focus", "Competitor B - basic features"],
      "competitiveAdvantage": "AI predictions + easy integration"
    },
    "businessModel": {
      "revenueModel": "subscription SaaS",
      "pricingStrategy": "tiered pricing $49-$499/month",
      "unitEconomics": "LTV:CAC ratio 3:1 target",
      "monetizationHypotheses": ["Value-based pricing works best"]
    },
    "product": {
      "coreFeatures": ["Inventory forecasting", "Automated reordering", "Analytics dashboard"],
      "roadmap": [
        {"phase": "MVP", "features": ["Basic forecasting"], "timeline": "Q1 2026"},
        {"phase": "V2", "features": ["Multi-location"], "timeline": "Q2 2026"}
      ],
      "techStack": ["React", "Node.js", "PostgreSQL", "TensorFlow"],
      "mvpScope": "Single location, basic forecasting only"
    },
    "validation": {
      "assumptions": [
        {"assumption": "Customers will pay $99/month", "status": "testing", "evidence": "10 interviews conducted"}
      ],
      "risks": [
        {"risk": "Accuracy below 90%", "severity": "high", "mitigation": "Additional training data"}
      ],
      "experiments": [
        {"name": "Landing page test", "status": "completed", "results": "15% conversion rate"}
      ],
      "customerInterviews": 25,
      "keyLearnings": ["Price sensitivity varies by revenue", "Integration is critical"]
    },
    "progress": {
      "stage": "validation",
      "completedTasks": ["Customer research", "MVP design", "Landing page"],
      "currentFocus": "Building MVP",
      "blockers": ["Finding technical co-founder"],
      "nextSteps": ["Launch beta", "Acquire first 10 customers"]
    },
    "conversationContext": {
      "topicsDiscussed": ["market sizing", "pricing strategy", "technical architecture"],
      "questionsAsked": ["How to find early customers?", "Best tech stack for MVP?"],
      "adviceGiven": ["Focus on single vertical first", "Build for feedback loops"],
      "lastUpdated": "2026-03-15T10:30:00Z"
    }
  }

  ## Notes
  - JSONB format allows flexible querying and efficient storage
  - AI can read and update this context in each conversation
  - Memory structure grows organically as more information is gathered
  - Enables personalized, context-aware responses
  - Supports tracking idea evolution over time
*/

-- Add AI memory column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'ai_memory'
  ) THEN
    ALTER TABLE projects ADD COLUMN ai_memory jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_projects_ai_memory ON projects USING gin(ai_memory);

-- Add helpful comment
COMMENT ON COLUMN projects.ai_memory IS 'AI memory context storing all learned information about the project including founder profile, idea evolution, market insights, validation data, and conversation history';

-- Create a helper function to update AI memory
CREATE OR REPLACE FUNCTION update_ai_memory(
  project_id_param uuid,
  memory_path text[],
  memory_value jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE projects
  SET 
    ai_memory = jsonb_set(
      COALESCE(ai_memory, '{}'::jsonb),
      memory_path,
      memory_value,
      true
    ),
    updated_at = now()
  WHERE id = project_id_param;
END;
$$;

COMMENT ON FUNCTION update_ai_memory IS 'Helper function to update specific paths in the AI memory object without replacing the entire structure';
