import { retrieveRelevantKnowledge } from '../data/knowledgeBase';

export interface LaunchTask {
  id: string;
  title: string;
  description: string;
  category: 'product' | 'marketing' | 'sales' | 'operations' | 'legal';
  priority: 'high' | 'medium' | 'low';
  timeframe: string;
  estimatedHours: number;
  dependencies: string[];
  resources: string[];
  completed: boolean;
}

export interface LaunchPhase {
  id: string;
  name: string;
  description: string;
  duration: string;
  tasks: LaunchTask[];
  milestones: string[];
}

export interface LaunchPlan {
  productName: string;
  launchDate: string;
  targetAudience: string;
  launchStrategy: string;
  phases: LaunchPhase[];
  totalTasks: number;
  estimatedTimeline: string;
  keyMetrics: string[];
  riskMitigation: string[];
  successCriteria: string[];
}

export async function generateLaunchPlan(
  productDescription: string,
  targetMarket: string,
  launchTimeline: string,
  budget?: string
): Promise<LaunchPlan> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not found. Please add VITE_OPENAI_API_KEY to your .env file.');
  }

  try {
    // Retrieve relevant launch knowledge using RAG
    const relevantKnowledge = retrieveRelevantKnowledge(`product launch go-to-market ${productDescription}`, 3);
    const knowledgeContext = relevantKnowledge.length > 0 
      ? `\n\nRelevant Launch Knowledge:\n${relevantKnowledge.map(item => 
          `**${item.title}** (${item.category}):\n${item.content}`
        ).join('\n\n')}`
      : '';

    const prompt = `You are an expert product launch strategist and go-to-market specialist. Create a comprehensive launch plan for the following product:

Product Description: ${productDescription}
Target Market: ${targetMarket}
Launch Timeline: ${launchTimeline}
${budget ? `Budget: ${budget}` : ''}

${knowledgeContext}

Please generate a detailed launch plan in the following JSON format:

{
  "productName": "Suggested product name",
  "launchDate": "Estimated launch date",
  "targetAudience": "Refined target audience description",
  "launchStrategy": "Overall launch strategy summary",
  "phases": [
    {
      "id": "pre-launch",
      "name": "Pre-Launch Phase",
      "description": "Phase description",
      "duration": "Time duration",
      "tasks": [
        {
          "id": "task-1",
          "title": "Task title",
          "description": "Detailed task description",
          "category": "product|marketing|sales|operations|legal",
          "priority": "high|medium|low",
          "timeframe": "When to complete",
          "estimatedHours": number,
          "dependencies": ["dependency1"],
          "resources": ["resource1", "resource2"],
          "completed": false
        }
      ],
      "milestones": ["milestone1", "milestone2"]
    }
  ],
  "totalTasks": number,
  "estimatedTimeline": "Total timeline estimate",
  "keyMetrics": ["metric1", "metric2", "metric3"],
  "riskMitigation": ["risk1 mitigation", "risk2 mitigation"],
  "successCriteria": ["criteria1", "criteria2", "criteria3"]
}

Create phases for:
1. Pre-Launch (preparation, validation, content creation)
2. Launch (go-live activities, initial marketing push)
3. Post-Launch (optimization, scaling, iteration)

Focus on:
1. Actionable, specific tasks with clear deliverables
2. Realistic timelines and resource requirements
3. Dependencies between tasks
4. Key metrics to track success
5. Risk mitigation strategies
6. Clear success criteria

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
            content: 'You are an expert product launch strategist. Always respond with valid JSON only.'
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
      const launchPlan: LaunchPlan = JSON.parse(content);
      return launchPlan;
    } catch (parseError) {
      console.error('Failed to parse launch plan JSON:', content);
      throw new Error('Failed to parse launch plan response');
    }
  } catch (error) {
    console.error('Launch Plan Assistant API error:', error);
    throw error;
  }
}