import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, this should be handled server-side
});

export interface ChatMessage {
  id: number;
  type: 'user' | 'ai';
  content: string;
}

export async function sendMessageToAI(message: string, conversationHistory: ChatMessage[]): Promise<string> {
  try {
    // Check if API key is configured
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.');
    }

    // Convert conversation history to OpenAI format
    const messages = [
      {
        role: 'system' as const,
        content: `You are BizactlyAI, an expert AI startup coach specifically designed to help first-time founders. Your expertise includes:

- Idea validation and market research
- MVP planning and feature prioritization  
- Lean canvas development
- Launch strategy planning
- Business model validation
- Customer discovery guidance
- Product-market fit assessment

You should:
- Ask clarifying questions to better understand their startup idea
- Provide actionable, specific advice
- Break down complex concepts into simple steps
- Be encouraging but realistic about challenges
- Focus on lean startup methodology
- Help them avoid common first-time founder mistakes

Keep responses conversational, helpful, and focused on practical next steps. If they share a startup idea, help them validate it and create an MVP plan.`
      },
      ...conversationHistory.map(msg => ({
        role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      })),
      {
        role: 'user' as const,
        content: message
      }
    ];

    console.log('Sending request to OpenAI with', messages.length, 'messages');

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    console.log('Received response from OpenAI');

    return completion.choices[0]?.message?.content || 'I apologize, but I encountered an issue processing your request. Please try again.';
  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    if (error instanceof Error && error.message.includes('API key')) {
      return 'OpenAI API key is missing or invalid. Please check your .env file and ensure VITE_OPENAI_API_KEY is set correctly.';
    }
    
    if (error instanceof Error && error.message.includes('quota')) {
      return 'OpenAI API quota exceeded. Please check your OpenAI account billing and usage limits.';
    }
    
    if (error instanceof Error && error.message.includes('rate limit')) {
      return 'Rate limit exceeded. Please wait a moment and try again.';
    }
    
    return `I apologize, but I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`;
  }
}