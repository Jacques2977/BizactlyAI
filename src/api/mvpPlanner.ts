import { retrieveRelevantKnowledge } from '../data/knowledgeBase';

export interface MVPFeature {
  id: string;
  name: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  category: 'core' | 'nice-to-have' | 'future';
  estimatedDays: number;
}

export interface MVPPlan {
  projectName: string;
  targetAudience: string;
  coreValueProposition: string;
  features: MVPFeature[];
  timeline: {
    phase1: MVPFeature[];
    phase2: MVPFeature[];
    phase3: MVPFeature[];
  };
  totalEstimatedDays: number;
  recommendations: string[];
}

export async function generateMVPPlan(
  projectDescription: string,
  targetAudience: string,
  budget?: string,
  timeline?: string
): Promise<MVPPlan> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not found. Please add VITE_OPENAI_API_KEY to your .env file.');
  }

  try {
    // Retrieve relevant MVP knowledge using RAG
    const relevantKnowledge = retrieveRelevantKnowledge(`MVP planning ${projectDescription}`, 3);
    const knowledgeContext = relevantKnowledge.length > 0 
      ? `\n\nRelevant MVP Knowledge:\n${relevantKnowledge.map(item => 
          `**${item.title}** (${item.category}):\n${item.content}`
        ).join('\n\n')}`
      : '';

    const prompt = `You are an expert MVP planner and product strategist. Create a detailed MVP plan based on the following information:

Project Description: ${projectDescription}
Target Audience: ${targetAudience}
${budget ? `Budget: ${budget}` : ''}
${timeline ? `Timeline: ${timeline}` : ''}

${knowledgeContext}

Please provide a comprehensive MVP plan in the following JSON format:

{
  "projectName": "Suggested project name",
  "targetAudience": "Refined target audience description",
  "coreValueProposition": "Clear value proposition statement",
  "features": [
    {
      "id": "unique-id",
      "name": "Feature name",
      "description": "Detailed feature description",
      "priority": "high|medium|low",
      "effort": "low|medium|high",
      "impact": "low|medium|high",
      "category": "core|nice-to-have|future",
      "estimatedDays": number
    }
  ],
  "timeline": {
    "phase1": ["feature-ids for immediate development"],
    "phase2": ["feature-ids for next phase"],
    "phase3": ["feature-ids for future phases"]
  },
  "totalEstimatedDays": number,
  "recommendations": [
    "Strategic recommendations for MVP success"
  ]
}

Focus on:
1. Core features that deliver the main value proposition
2. Features that can be built quickly and validated
3. Prioritization based on impact vs effort
4. Realistic timeline estimates
5. Strategic recommendations for MVP success

Provide ONLY the JSON response, no additional text.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert MVP planner. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
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
      const mvpPlan: MVPPlan = JSON.parse(content);
      return mvpPlan;
    } catch (parseError) {
      console.error('Failed to parse MVP plan JSON:', content);
      throw new Error('Failed to parse MVP plan response');
    }
  } catch (error) {
    console.error('MVP Planner API error:', error);
    throw error;
  }
}

export async function prioritizeFeatures(features: MVPFeature[]): Promise<MVPFeature[]> {
  // Priority scoring algorithm
  const scoreFeature = (feature: MVPFeature): number => {
    const priorityScore = feature.priority === 'high' ? 3 : feature.priority === 'medium' ? 2 : 1;
    const impactScore = feature.impact === 'high' ? 3 : feature.impact === 'medium' ? 2 : 1;
    const effortScore = feature.effort === 'low' ? 3 : feature.effort === 'medium' ? 2 : 1;
    
    // Higher impact and lower effort = higher score
    return (priorityScore * 0.4) + (impactScore * 0.4) + (effortScore * 0.2);
  };

  return features
    .map(feature => ({ ...feature, score: scoreFeature(feature) }))
    .sort((a, b) => b.score - a.score)
    .map(({ score, ...feature }) => feature);
}