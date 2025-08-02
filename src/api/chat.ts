import { retrieveRelevantKnowledge } from '../data/knowledgeBase';

export async function sendMessage(message: string): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not found. Please add VITE_OPENAI_API_KEY to your .env file.');
  }

  try {
    // Retrieve relevant knowledge using RAG
    const relevantKnowledge = retrieveRelevantKnowledge(message, 3);
    const knowledgeContext = relevantKnowledge.length > 0 
      ? `\n\nRelevant Knowledge Base Information:\n${relevantKnowledge.map(item => 
          `**${item.title}** (${item.category}):\n${item.content}`
        ).join('\n\n')}`
      : '';

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
            content: `You are BizactlyAI, an expert startup coach and business advisor. You help first-time founders validate ideas, plan MVPs, and launch successful startups.

Your expertise includes:
- Idea validation and market research
- MVP development and product strategy
- Business model design and lean canvas
- Customer acquisition and growth strategies
- Fundraising and investor relations
- Product-market fit and scaling
- Pricing strategies and monetization
- Team building and leadership

CRITICAL: You must format your responses in a structured way using the following sections. Each section should be clearly marked with headers and separated for easy reading:

**📋 SUMMARY**
Provide a brief 2-3 sentence overview of your main recommendation or answer.

**🎯 KEY INSIGHTS**
List 3-5 bullet points with the most important insights or takeaways.

**📊 ACTIONABLE STEPS**
Provide a numbered list of specific, concrete actions the user can take immediately.

**💡 EXPERT TIP**
Share one advanced insight, framework, or best practice that goes beyond the basics.

**❓ FOLLOW-UP QUESTIONS**
Ask 2-3 thoughtful questions to continue the conversation and gather more context.

Always be encouraging, practical, and data-driven. Reference specific frameworks, metrics, and real-world examples when relevant. Keep each section concise but valuable.

${knowledgeContext}`
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 1500,
        temperature: 0.8,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
  } catch (error) {
    console.error('Chat API error:', error);
    throw error;
  }
}