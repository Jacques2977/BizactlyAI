import { retrieveRelevantKnowledge } from '../data/knowledgeBase';

export interface PricingTier {
  id: string;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  limitations: string[];
  targetCustomer: string;
  popular: boolean;
  savings?: string;
}

export interface PricingStrategy {
  model: string;
  rationale: string;
  competitivePosition: string;
  valueProposition: string;
}

export interface PricingRecommendation {
  productName: string;
  recommendedStrategy: PricingStrategy;
  tiers: PricingTier[];
  freemiumOption?: {
    features: string[];
    limitations: string[];
    conversionStrategy: string;
  };
  pricingPsychology: {
    anchoring: string;
    decoyEffect: string;
    valuePerception: string[];
  };
  testingRecommendations: string[];
  competitorAnalysis: {
    competitor: string;
    pricing: string;
    positioning: string;
  }[];
  revenueProjections: {
    tier: string;
    monthlyRevenue: number;
    assumptions: string;
  }[];
}

export async function generatePricingRecommendation(
  productDescription: string,
  targetMarket: string,
  competitorPricing?: string,
  valueProposition?: string
): Promise<PricingRecommendation> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not found. Please add VITE_OPENAI_API_KEY to your .env file.');
  }

  try {
    // Retrieve relevant pricing knowledge using RAG
    const relevantKnowledge = retrieveRelevantKnowledge(`pricing strategy ${productDescription}`, 3);
    const knowledgeContext = relevantKnowledge.length > 0 
      ? `\n\nRelevant Pricing Knowledge:\n${relevantKnowledge.map(item => 
          `**${item.title}** (${item.category}):\n${item.content}`
        ).join('\n\n')}`
      : '';

    const prompt = `You are an expert pricing strategist and revenue optimization specialist. Create a comprehensive pricing recommendation for the following product:

Product Description: ${productDescription}
Target Market: ${targetMarket}
${competitorPricing ? `Competitor Pricing: ${competitorPricing}` : ''}
${valueProposition ? `Value Proposition: ${valueProposition}` : ''}

${knowledgeContext}

Please generate a detailed pricing recommendation in the following JSON format:

{
  "productName": "Product name",
  "recommendedStrategy": {
    "model": "Pricing model (freemium, tiered, usage-based, etc.)",
    "rationale": "Why this model works best",
    "competitivePosition": "How to position vs competitors",
    "valueProposition": "Core value proposition for pricing"
  },
  "tiers": [
    {
      "id": "starter",
      "name": "Tier name",
      "price": number,
      "billingCycle": "monthly",
      "features": ["feature1", "feature2"],
      "limitations": ["limit1", "limit2"],
      "targetCustomer": "Who this tier serves",
      "popular": false,
      "savings": "Optional savings message"
    }
  ],
  "freemiumOption": {
    "features": ["free feature1", "free feature2"],
    "limitations": ["limitation1", "limitation2"],
    "conversionStrategy": "How to convert free to paid"
  },
  "pricingPsychology": {
    "anchoring": "Anchoring strategy explanation",
    "decoyEffect": "How to use decoy pricing",
    "valuePerception": ["perception1", "perception2"]
  },
  "testingRecommendations": [
    "A/B test recommendation 1",
    "A/B test recommendation 2"
  ],
  "competitorAnalysis": [
    {
      "competitor": "Competitor name",
      "pricing": "Their pricing model",
      "positioning": "How to differentiate"
    }
  ],
  "revenueProjections": [
    {
      "tier": "Tier name",
      "monthlyRevenue": number,
      "assumptions": "Revenue assumptions"
    }
  ]
}

Focus on:
1. Value-based pricing aligned with customer willingness to pay
2. Psychological pricing principles (anchoring, decoy effect)
3. Competitive differentiation and positioning
4. Clear upgrade paths and conversion strategies
5. Revenue optimization and growth potential
6. A/B testing recommendations for validation

Provide ONLY the JSON response, no additional text.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5',
        messages: [
          {
            role: 'system',
            content: 'You are an expert pricing strategist. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 3000,
        max_completion_tokens: 3000,
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
      const pricingRecommendation: PricingRecommendation = JSON.parse(content);
      return pricingRecommendation;
    } catch (parseError) {
      console.error('Failed to parse pricing recommendation JSON:', content);
      throw new Error('Failed to parse pricing recommendation response');
    }
  } catch (error) {
    console.error('Pricing Assistant API error:', error);
    throw error;
  }
}