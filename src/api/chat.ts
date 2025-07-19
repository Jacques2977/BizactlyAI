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

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || 'I apologize, but I encountered an issue processing your request. Please try again.';
  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    if (error instanceof Error && error.message.includes('API key')) {
      return 'Please configure your OpenAI API key in the environment variables to enable AI coaching features.';
    }
    
    return 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.';
  }
}