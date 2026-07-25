import { retrieveRelevantKnowledge } from '../data/knowledgeBase';

export interface IdeaValidationResult {
  overallScore: number;
  marketSize: {
    score: number;
    analysis: string;
    recommendations: string[];
  };
  competition: {
    score: number;
    analysis: string;
    competitors: string[];
    differentiation: string[];
  };
  feasibility: {
    score: number;
    analysis: string;
    challenges: string[];
    solutions: string[];
  };
  monetization: {
    score: number;
    analysis: string;
    models: string[];
    recommendations: string[];
  };
  improvements: string[];
  nextSteps: string[];
}

export async function validateIdea(
  ideaDescription: string,
  targetMarket: string,
  businessModel?: string
): Promise<IdeaValidationResult> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not found. Please add VITE_OPENAI_API_KEY to your .env file.');
  }

  try {
    // Retrieve relevant validation knowledge using RAG
    const relevantKnowledge = retrieveRelevantKnowledge(`idea validation ${ideaDescription}`, 3);
    const knowledgeContext = relevantKnowledge.length > 0 
      ? `\n\nRelevant Validation Knowledge:\n${relevantKnowledge.map(item => 
          `**${item.title}** (${item.category}):\n${item.content}`
        ).join('\n\n')}`
      : '';

    const prompt = `You are an expert startup advisor and idea validator. Analyze the following startup idea comprehensively:

Idea Description: ${ideaDescription}
Target Market: ${targetMarket}
${businessModel ? `Business Model: ${businessModel}` : ''}

${knowledgeContext}

Please provide a detailed validation analysis in the following JSON format:

{
  "overallScore": number (1-100),
  "marketSize": {
    "score": number (1-100),
    "analysis": "Detailed market size analysis",
    "recommendations": ["recommendation1", "recommendation2"]
  },
  "competition": {
    "score": number (1-100),
    "analysis": "Competitive landscape analysis",
    "competitors": ["competitor1", "competitor2"],
    "differentiation": ["differentiator1", "differentiator2"]
  },
  "feasibility": {
    "score": number (1-100),
    "analysis": "Technical and business feasibility",
    "challenges": ["challenge1", "challenge2"],
    "solutions": ["solution1", "solution2"]
  },
  "monetization": {
    "score": number (1-100),
    "analysis": "Revenue potential analysis",
    "models": ["model1", "model2"],
    "recommendations": ["rec1", "rec2"]
  },
  "improvements": [
    "Specific improvement suggestion 1",
    "Specific improvement suggestion 2",
    "Specific improvement suggestion 3"
  ],
  "nextSteps": [
    "Immediate action item 1",
    "Immediate action item 2",
    "Immediate action item 3"
  ]
}

Focus on:
1. Market opportunity and size assessment
2. Competitive analysis and differentiation
3. Technical and business feasibility
4. Revenue model viability
5. Specific, actionable improvements
6. Clear next steps for validation

Provide ONLY the JSON response, no additional text.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert startup advisor. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        max_completion_tokens: 2000,
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
      const validationResult: IdeaValidationResult = JSON.parse(content);
      return validationResult;
    } catch (parseError) {
      console.error('Failed to parse validation result JSON:', content);
      throw new Error('Failed to parse validation result response');
    }
  } catch (error) {
    console.error('Idea Validator API error:', error);
    throw error;
  }
}