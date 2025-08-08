import { retrieveRelevantKnowledge } from '../data/knowledgeBase';

export interface UserPersona {
  id: string;
  name: string;
  age: number;
  jobTitle: string;
  company: string;
  industry: string;
  demographics: {
    location: string;
    income: string;
    education: string;
    familyStatus: string;
  };
  psychographics: {
    goals: string[];
    frustrations: string[];
    motivations: string[];
    values: string[];
  };
  behavior: {
    techSavviness: string;
    buyingProcess: string;
    preferredChannels: string[];
    decisionFactors: string[];
  };
  painPoints: string[];
  solutions: string[];
  quote: string;
  avatar: string;
}

export interface PersonaGenerationResult {
  primaryPersona: UserPersona;
  secondaryPersona: UserPersona;
  insights: {
    marketSegmentation: string;
    targetingStrategy: string;
    messagingRecommendations: string[];
    channelRecommendations: string[];
  };
}

export async function generatePersonas(
  productDescription: string,
  targetMarket: string,
  businessModel?: string
): Promise<PersonaGenerationResult> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not found. Please add VITE_OPENAI_API_KEY to your .env file.');
  }

  try {
    // Retrieve relevant customer development knowledge using RAG
    const relevantKnowledge = retrieveRelevantKnowledge(`customer personas ${targetMarket}`, 2);
    const knowledgeContext = relevantKnowledge.length > 0 
      ? `\n\nRelevant Customer Knowledge:\n${relevantKnowledge.map(item => 
          `**${item.title}** (${item.category}):\n${item.content}`
        ).join('\n\n')}`
      : '';

    const prompt = `You are an expert customer research analyst and persona developer. Create detailed user personas for the following product:

Product Description: ${productDescription}
Target Market: ${targetMarket}
${businessModel ? `Business Model: ${businessModel}` : ''}

${knowledgeContext}

Please generate comprehensive user personas in the following JSON format:

{
  "primaryPersona": {
    "id": "persona-1",
    "name": "Realistic first and last name",
    "age": number,
    "jobTitle": "Specific job title",
    "company": "Company type/size",
    "industry": "Industry sector",
    "demographics": {
      "location": "Geographic location",
      "income": "Income range",
      "education": "Education level",
      "familyStatus": "Family situation"
    },
    "psychographics": {
      "goals": ["goal1", "goal2", "goal3"],
      "frustrations": ["frustration1", "frustration2"],
      "motivations": ["motivation1", "motivation2"],
      "values": ["value1", "value2"]
    },
    "behavior": {
      "techSavviness": "Tech comfort level",
      "buyingProcess": "How they make purchase decisions",
      "preferredChannels": ["channel1", "channel2"],
      "decisionFactors": ["factor1", "factor2"]
    },
    "painPoints": ["pain1", "pain2", "pain3"],
    "solutions": ["solution1", "solution2"],
    "quote": "A realistic quote that captures their mindset",
    "avatar": "👤"
  },
  "secondaryPersona": {
    // Same structure as primary persona but different target segment
  },
  "insights": {
    "marketSegmentation": "Analysis of market segments",
    "targetingStrategy": "Recommended targeting approach",
    "messagingRecommendations": ["message1", "message2", "message3"],
    "channelRecommendations": ["channel1", "channel2", "channel3"]
  }
}

Focus on:
1. Realistic, detailed personas based on actual market research
2. Clear differentiation between primary and secondary personas
3. Actionable insights for marketing and product development
4. Specific pain points your product can solve
5. Behavioral patterns and decision-making processes

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
            content: 'You are an expert customer research analyst. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2500,
        temperature: 0.8,
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
      const personaResult: PersonaGenerationResult = JSON.parse(content);
      return personaResult;
    } catch (parseError) {
      console.error('Failed to parse persona result JSON:', content);
      throw new Error('Failed to parse persona result response');
    }
  } catch (error) {
    console.error('Persona Generator API error:', error);
    throw error;
  }
}