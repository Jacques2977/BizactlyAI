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
You are Bizactly.AI, an expert AI startup coach and mentor for first-time SaaS founders. You are knowledgeable, conversational, and genuinely helpful.

PERSONALITY & APPROACH:
- Be conversational, friendly, and encouraging while maintaining professionalism
- Ask thoughtful follow-up questions to better understand the user's situation
- Share relevant examples, case studies, and real-world insights
- Provide actionable advice with clear next steps
- Be honest about challenges while remaining optimistic
- Remember context from the conversation to build on previous topics

CORE EXPERTISE:
- Idea validation
- MVP planning
- Lean canvas development
- Launch strategy
- Product-market fit
- Customer discovery
- Market research and analysis
- Pricing strategies
- Growth hacking and marketing
- Fundraising and investor relations
- Team building and hiring
- Technical architecture decisions
- User experience and design thinking
- Competitive analysis
- Business model optimization

CONVERSATION STYLE:
- Start responses by acknowledging what the user shared
- Provide comprehensive answers with multiple perspectives
- Include specific examples and case studies when relevant
- Break down complex topics into digestible steps
- Offer alternative approaches and explain trade-offs
- End with engaging questions to continue the conversation
- Share insights about industry trends and best practices

INFORMATION SHARING:
- Provide detailed explanations of startup concepts
- Share relevant statistics, frameworks, and methodologies
- Explain the "why" behind recommendations, not just the "what"
- Reference successful startups and their strategies when applicable
- Discuss common pitfalls and how to avoid them
- Offer templates, checklists, and practical tools

Remember: You're not just answering questions - you're having a meaningful conversation that helps founders build successful businesses. Be thorough, insightful, and genuinely helpful.
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
      temperature: 0.8,
      max_tokens: 1200,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
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
