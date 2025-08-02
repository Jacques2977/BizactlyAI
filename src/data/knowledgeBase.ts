// RAG Knowledge Base for BizactlyAI
export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  relevanceScore?: number;
}

export const knowledgeBase: KnowledgeItem[] = [
  // Idea Validation
  {
    id: 'idea-validation-framework',
    title: 'Comprehensive Idea Validation Framework',
    content: `
    The Mom Test Framework by Rob Fitzpatrick:
    1. Talk about their life instead of your idea
    2. Ask about specifics in the past instead of generics or opinions about the future
    3. Talk less and listen more
    
    Key Questions to Ask:
    - What's the hardest part about [problem area]?
    - Tell me about the last time you encountered this problem
    - What have you tried to solve this?
    - How much does this problem cost you?
    - What would have to be true for you to pay $X for a solution?
    
    Validation Metrics:
    - Problem-Solution Fit: 40% of target users say they "must have" your solution
    - Product-Market Fit: 40% of users would be "very disappointed" if your product disappeared
    - Willingness to Pay: 30% conversion rate from free to paid
    `,
    category: 'validation',
    tags: ['idea-validation', 'mom-test', 'customer-interviews', 'metrics']
  },
  
  {
    id: 'mvp-development-guide',
    title: 'MVP Development Strategy',
    content: `
    MVP Types and When to Use Them:
    
    1. Concierge MVP: Manually deliver the service
    - Best for: Service-based startups, complex workflows
    - Example: Food on the Table manually created meal plans before automating
    
    2. Wizard of Oz MVP: Fake the backend, real frontend
    - Best for: AI/ML products, complex algorithms
    - Example: Zapier manually connected apps before building automation
    
    3. Landing Page MVP: Test demand before building
    - Best for: Any product, quick validation
    - Example: Buffer tested demand with a simple landing page
    
    4. Feature-Limited MVP: Core functionality only
    - Best for: Software products with clear core value
    - Example: Twitter started as simple status updates
    
    MVP Success Metrics:
    - User Engagement: 20%+ daily active users
    - Retention: 25%+ week-1 retention
    - Conversion: 2-5% signup to paid conversion
    `,
    category: 'mvp',
    tags: ['mvp', 'product-development', 'lean-startup', 'metrics']
  },

  {
    id: 'pricing-strategies',
    title: 'SaaS Pricing Strategies and Models',
    content: `
    Common SaaS Pricing Models:
    
    1. Freemium (5-10% conversion typical)
    - Good for: High-volume, low-touch products
    - Examples: Slack, Dropbox, Zoom
    
    2. Free Trial (15-25% conversion typical)
    - Good for: Complex products needing demonstration
    - Examples: HubSpot, Salesforce
    
    3. Usage-Based Pricing
    - Good for: Products with variable usage patterns
    - Examples: AWS, Twilio, Stripe
    
    4. Tiered Pricing (Most common)
    - Good for: Most SaaS products
    - Examples: Most SaaS companies
    
    Pricing Psychology:
    - Anchor high: Show expensive option first
    - Rule of 3: Offer exactly 3 tiers
    - Decoy effect: Make middle tier most attractive
    - Value-based pricing: Price based on customer value, not costs
    
    Pricing Research Methods:
    - Van Westendorp Price Sensitivity Meter
    - Conjoint Analysis
    - A/B testing different price points
    `,
    category: 'pricing',
    tags: ['pricing', 'saas', 'monetization', 'conversion']
  },

  {
    id: 'customer-acquisition',
    title: 'Customer Acquisition Strategies for Startups',
    content: `
    Customer Acquisition Channels by Stage:
    
    Early Stage (0-100 customers):
    1. Personal Network: Reach out to friends, family, colleagues
    2. Direct Outreach: Cold email, LinkedIn, phone calls
    3. Content Marketing: Blog posts, social media, SEO
    4. Community Building: Forums, Slack groups, Discord
    
    Growth Stage (100-1000 customers):
    1. Paid Advertising: Google Ads, Facebook Ads, LinkedIn Ads
    2. Partnerships: Integration partners, referral programs
    3. PR and Media: Press releases, journalist outreach
    4. Events: Conferences, webinars, meetups
    
    Scale Stage (1000+ customers):
    1. Sales Team: Inside sales, field sales
    2. Channel Partners: Resellers, affiliates
    3. Product-Led Growth: Viral features, referrals
    4. Brand Marketing: Thought leadership, sponsorships
    
    Key Metrics to Track:
    - Customer Acquisition Cost (CAC): Should be 3x less than LTV
    - Lifetime Value (LTV): Revenue per customer over their lifetime
    - Payback Period: Time to recover CAC (ideally <12 months)
    - Conversion Rates: Track each step of your funnel
    `,
    category: 'marketing',
    tags: ['customer-acquisition', 'marketing', 'growth', 'metrics', 'cac', 'ltv']
  },

  {
    id: 'fundraising-guide',
    title: 'Startup Fundraising Guide',
    content: `
    Fundraising Stages and Typical Amounts:
    
    Pre-Seed: $50K - $500K
    - Stage: Idea to early prototype
    - Investors: Friends, family, angels
    - Use: Build MVP, validate market
    
    Seed: $500K - $3M
    - Stage: MVP with early traction
    - Investors: Angel investors, seed VCs
    - Use: Product development, early team
    
    Series A: $2M - $15M
    - Stage: Product-market fit, growing revenue
    - Investors: VCs
    - Use: Scale team, expand market
    
    Pitch Deck Structure (10-12 slides):
    1. Problem: Clear, relatable problem
    2. Solution: Your unique approach
    3. Market: Size and opportunity
    4. Product: Demo or screenshots
    5. Traction: Growth metrics, customers
    6. Business Model: How you make money
    7. Competition: Competitive landscape
    8. Team: Why you'll win
    9. Financials: Revenue projections
    10. Funding: Amount and use of funds
    
    Key Metrics Investors Want:
    - Monthly Recurring Revenue (MRR) growth
    - Customer Acquisition Cost (CAC)
    - Lifetime Value (LTV)
    - Churn rate
    - Gross margins
    `,
    category: 'fundraising',
    tags: ['fundraising', 'investors', 'pitch-deck', 'metrics', 'venture-capital']
  },

  {
    id: 'product-market-fit',
    title: 'Achieving Product-Market Fit',
    content: `
    Product-Market Fit Definition:
    "Being in a good market with a product that can satisfy that market" - Marc Andreessen
    
    Signs of Product-Market Fit:
    1. 40% of users would be "very disappointed" if your product disappeared (Sean Ellis test)
    2. Organic growth through word-of-mouth
    3. High user engagement and retention
    4. Customers pulling the product from you (inbound demand)
    5. Difficulty keeping up with demand
    
    How to Measure PMF:
    - Net Promoter Score (NPS): >50 is excellent
    - Retention Curves: Flatten out (don't go to zero)
    - Organic Growth Rate: >20% month-over-month
    - Sales Cycle: Shortens over time
    - Customer Success: Low churn, high expansion
    
    Strategies to Achieve PMF:
    1. Customer Development: Continuous customer interviews
    2. Rapid Iteration: Weekly product releases
    3. Cohort Analysis: Track user behavior over time
    4. Feature Usage: Focus on most-used features
    5. Customer Feedback: Regular surveys and feedback loops
    
    Common PMF Mistakes:
    - Focusing on vanity metrics instead of engagement
    - Building features customers don't want
    - Trying to serve too broad a market
    - Scaling before achieving PMF
    `,
    category: 'product',
    tags: ['product-market-fit', 'pmf', 'metrics', 'customer-development', 'retention']
  },

  {
    id: 'lean-canvas',
    title: 'Lean Canvas Framework',
    content: `
    Lean Canvas 9 Building Blocks:
    
    1. Problem (Top 3 problems)
    - What problems are you solving?
    - List your top 1-3 problems
    - Existing alternatives customers use
    
    2. Customer Segments
    - Who are your target customers?
    - Early adopters vs. mainstream market
    - Customer archetypes/personas
    
    3. Unique Value Proposition
    - Single, clear, compelling message
    - Why you are different and worth buying
    - High-level concept
    
    4. Solution (Top 3 features)
    - How you solve the problem
    - List your top 3 features
    - Don't list all features
    
    5. Channels
    - Path to customers
    - How you reach your customers
    - Inbound vs. outbound
    
    6. Revenue Streams
    - How you make money
    - Revenue model
    - Pricing strategy
    
    7. Cost Structure
    - What it costs to operate
    - Customer acquisition costs
    - Distribution costs
    - Hosting, people, etc.
    
    8. Key Metrics
    - Key activities you measure
    - How you measure progress
    - Leading indicators
    
    9. Unfair Advantage
    - Something that can't be easily copied
    - Network effects, patents, team, etc.
    - Real competitive moats
    `,
    category: 'business-model',
    tags: ['lean-canvas', 'business-model', 'strategy', 'planning']
  },

  {
    id: 'growth-hacking',
    title: 'Growth Hacking Strategies',
    content: `
    AARRR Growth Framework:
    
    1. Acquisition: Getting users
    - Content marketing and SEO
    - Social media marketing
    - Paid advertising
    - Referral programs
    - PR and partnerships
    
    2. Activation: First great experience
    - Onboarding optimization
    - Time to value reduction
    - Progressive profiling
    - Welcome sequences
    
    3. Retention: Coming back
    - Email marketing
    - Push notifications
    - Feature adoption
    - Customer success
    
    4. Referral: Telling others
    - Referral programs
    - Social sharing
    - Word-of-mouth optimization
    - Viral mechanics
    
    5. Revenue: Paying money
    - Pricing optimization
    - Upselling/cross-selling
    - Payment flow optimization
    - Value demonstration
    
    Growth Hacking Tactics:
    - Viral loops: Dropbox referral program
    - Content marketing: HubSpot's blog
    - Product-led growth: Slack's team invites
    - Community building: Product Hunt
    - Partnerships: Spotify + Uber integration
    
    Key Growth Metrics:
    - Viral coefficient (K-factor)
    - Customer lifetime value (CLV)
    - Monthly active users (MAU)
    - Conversion rates at each funnel stage
    `,
    category: 'growth',
    tags: ['growth-hacking', 'aarrr', 'viral-growth', 'metrics', 'acquisition']
  }
];

// Simple text similarity function for RAG retrieval
export function calculateSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size; // Jaccard similarity
}

// Enhanced keyword matching with weights
export function calculateRelevance(query: string, item: KnowledgeItem): number {
  const queryLower = query.toLowerCase();
  let score = 0;
  
  // Title match (highest weight)
  if (item.title.toLowerCase().includes(queryLower)) {
    score += 10;
  }
  
  // Tag matches (high weight)
  item.tags.forEach(tag => {
    if (queryLower.includes(tag.toLowerCase()) || tag.toLowerCase().includes(queryLower)) {
      score += 5;
    }
  });
  
  // Category match (medium weight)
  if (queryLower.includes(item.category.toLowerCase()) || item.category.toLowerCase().includes(queryLower)) {
    score += 3;
  }
  
  // Content similarity (lower weight but comprehensive)
  const contentSimilarity = calculateSimilarity(queryLower, item.content.toLowerCase());
  score += contentSimilarity * 2;
  
  // Keyword matching in content
  const keywords = queryLower.split(/\s+/).filter(word => word.length > 3);
  keywords.forEach(keyword => {
    if (item.content.toLowerCase().includes(keyword)) {
      score += 1;
    }
  });
  
  return score;
}

// Retrieve relevant knowledge items
export function retrieveRelevantKnowledge(query: string, topK: number = 3): KnowledgeItem[] {
  const scoredItems = knowledgeBase.map(item => ({
    ...item,
    relevanceScore: calculateRelevance(query, item)
  }));
  
  return scoredItems
    .filter(item => item.relevanceScore > 0.5) // Minimum relevance threshold
    .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
    .slice(0, topK);
}