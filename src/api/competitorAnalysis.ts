import { retrieveRelevantKnowledge } from '../data/knowledgeBase';

export interface CompetitorInfo {
  id: string;
  name: string;
  website: string;
  description: string;
  pricing: {
    model: string;
    tiers: PricingTier[];
  };
  features: string[];
  strengths: string[];
  weaknesses: string[];
  marketPosition: string;
  fundingInfo?: {
    totalRaised: string;
    lastRound: string;
    investors: string[];
  };
  traffic?: {
    monthlyVisits: string;
    ranking: string;
  };
  socialProof: {
    reviews: number;
    rating: number;
    customers: string;
  };
}

export interface PricingTier {
  name: string;
  price: string;
  features: string[];
}

export interface CompetitorAnalysisResult {
  query: string;
  competitors: CompetitorInfo[];
  marketInsights: {
    averagePricing: string;
    commonFeatures: string[];
    marketGaps: string[];
    pricingStrategies: string[];
  };
  competitiveAdvantages: string[];
  recommendations: {
    positioning: string[];
    pricing: string[];
    features: string[];
    marketing: string[];
  };
  swotAnalysis: {
    opportunities: string[];
    threats: string[];
  };
}

interface SerpSearchResult {
  organic_results?: Array<{
    title: string;
    link: string;
    snippet: string;
    position: number;
  }>;
  related_searches?: Array<{
    query: string;
  }>;
}

export async function searchCompetitors(query: string): Promise<SerpSearchResult> {
  const apiKey = 'ecccdc5e3d68f23dc083a74a52ec025887ae37d7fd8b3dba2da544d8c6ba5db1';
  
  try {
    const searchQuery = `${query} competitors alternatives pricing features`;
    const response = await fetch(`https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(searchQuery)}&api_key=${apiKey}&num=10`);
    
    if (!response.ok) {
      throw new Error(`SerpAPI error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('SerpAPI search error:', error);
    throw error;
  }
}

export async function analyzeCompetitors(
  productDescription: string,
  targetMarket: string,
  maxCompetitors: number = 5
): Promise<CompetitorAnalysisResult> {
  const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not found. Please add VITE_OPENAI_API_KEY to your .env file.');
  }

  try {
    // Search for competitors using SerpAPI
    const searchResults = await searchCompetitors(productDescription);
    
    // Retrieve relevant competitive analysis knowledge using RAG
    const relevantKnowledge = retrieveRelevantKnowledge(`competitor analysis ${productDescription}`, 2);
    const knowledgeContext = relevantKnowledge.length > 0 
      ? `\n\nRelevant Competitive Analysis Knowledge:\n${relevantKnowledge.map(item => 
          `**${item.title}** (${item.category}):\n${item.content}`
        ).join('\n\n')}`
      : '';

    // Prepare search results context
    const searchContext = searchResults.organic_results 
      ? `\n\nSearch Results from SerpAPI:\n${searchResults.organic_results.slice(0, 10).map(result => 
          `**${result.title}**\nURL: ${result.link}\nDescription: ${result.snippet}`
        ).join('\n\n')}`
      : '';

    const prompt = `You are an expert competitive intelligence analyst. Analyze the competitive landscape for the following product and provide a comprehensive competitor analysis.

Product Description: ${productDescription}
Target Market: ${targetMarket}
Max Competitors to Analyze: ${maxCompetitors}

${knowledgeContext}
${searchContext}

Based on the search results and your knowledge, provide a detailed competitive analysis in the following JSON format:

{
  "query": "${productDescription}",
  "competitors": [
    {
      "id": "competitor-1",
      "name": "Competitor Name",
      "website": "https://competitor.com",
      "description": "Brief description of what they do",
      "pricing": {
        "model": "freemium|subscription|one-time|usage-based",
        "tiers": [
          {
            "name": "Plan Name",
            "price": "$X/month or Free",
            "features": ["feature1", "feature2"]
          }
        ]
      },
      "features": ["key feature 1", "key feature 2"],
      "strengths": ["strength 1", "strength 2"],
      "weaknesses": ["weakness 1", "weakness 2"],
      "marketPosition": "market leader|challenger|niche player|startup",
      "fundingInfo": {
        "totalRaised": "$X million",
        "lastRound": "Series A/B/C",
        "investors": ["investor1", "investor2"]
      },
      "traffic": {
        "monthlyVisits": "X million",
        "ranking": "Top X in category"
      },
      "socialProof": {
        "reviews": 1000,
        "rating": 4.5,
        "customers": "10,000+ businesses"
      }
    }
  ],
  "marketInsights": {
    "averagePricing": "$X-Y per month for similar solutions",
    "commonFeatures": ["feature1", "feature2", "feature3"],
    "marketGaps": ["gap1", "gap2"],
    "pricingStrategies": ["strategy1", "strategy2"]
  },
  "competitiveAdvantages": [
    "Your potential advantage 1",
    "Your potential advantage 2"
  ],
  "recommendations": {
    "positioning": ["positioning rec 1", "positioning rec 2"],
    "pricing": ["pricing rec 1", "pricing rec 2"],
    "features": ["feature rec 1", "feature rec 2"],
    "marketing": ["marketing rec 1", "marketing rec 2"]
  },
  "swotAnalysis": {
    "opportunities": ["opportunity 1", "opportunity 2"],
    "threats": ["threat 1", "threat 2"]
  }
}

Focus on:
1. Identifying ${maxCompetitors} main competitors from the search results
2. Analyzing their pricing models and feature sets
3. Identifying market gaps and opportunities
4. Providing actionable competitive intelligence
5. Suggesting differentiation strategies

Use the search results to find real competitors and their actual information. If specific pricing or feature information isn't available in the search results, make reasonable estimates based on typical SaaS patterns for that market.

Provide ONLY the JSON response, no additional text.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert competitive intelligence analyst. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        max_completion_tokens: 4000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response content received');
    }

    try {
      const analysisResult: CompetitorAnalysisResult = JSON.parse(content);
      return analysisResult;
    } catch (parseError) {
      console.error('Failed to parse competitor analysis JSON:', content);
      throw new Error('Failed to parse competitor analysis response');
    }
  } catch (error) {
    console.error('Competitor Analysis API error:', error);
    throw error;
  }
}

export async function getCompetitorDetails(competitorName: string, website: string): Promise<Partial<CompetitorInfo>> {
  try {
    // Search for specific competitor information
    const searchResults = await searchCompetitors(`${competitorName} pricing features reviews`);
    
    // This would typically involve more detailed scraping or API calls
    // For now, we'll return the search results for further processing
    return {
      name: competitorName,
      website: website,
      description: searchResults.organic_results?.[0]?.snippet || 'No description available'
    };
  } catch (error) {
    console.error('Error getting competitor details:', error);
    return {
      name: competitorName,
      website: website,
      description: 'Unable to fetch competitor details'
    };
  }
}