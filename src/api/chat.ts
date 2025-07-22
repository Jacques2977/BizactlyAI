import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // For dev only!
});

export interface ChatMessage {
  id: number;
  type: 'user' | 'ai';
  content: string;
}

const SYSTEM_PROMPT = `
You are Bizactly.AI, an expert AI startup coach for first-time SaaS founders.

Your specialties include:
- Idea validation
- MVP planning
- Lean canvas development
- Launch strategy
- Product-market fit
- Customer discovery

Be clear, tactical, and encouraging. Focus on lean startup methods. Ask smart clarifying questions and guide users toward action.
`;

function formatMessages(history: ChatMessage[], userMessage: string) {
  return [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    ...history.map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content,
    })),
    { role: 'user' as const, content: userMessage }
  ];
}

export async function sendMessageToAI(
  message: string,
  history: ChatMessage[]
): Promise<string> {
  if (!import.meta.env.VITE_OPENAI_API_KEY) {
    return 'OpenAI API key missing. Please check your environment config.';
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: formatMessages(history, message),
      temperature: 0.7,
      max_tokens: 600,
    });

    return response.choices[0]?.message?.content?.trim()
      || 'Something went wrong. Try again in a moment.';
  } catch (err: unknown) {
    console.error('OpenAI Chat Error:', err);
    
    const fallback = 'An error occurred while processing your request. Please try again.';
    
    if (err instanceof Error) {
      if (err.message.includes('quota')) return 'OpenAI quota exceeded. Check your usage limits.';
      if (err.message.includes('rate limit')) return 'Too many requests. Wait a moment and try again.';
      if (err.message.includes('API key')) return 'Invalid API key. Check your environment config.';
      return `Error: ${err.message}`;
    }

    return fallback;
  }
}
