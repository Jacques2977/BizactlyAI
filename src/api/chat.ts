import { retrieveRelevantKnowledge } from '../data/knowledgeBase';

export async function sendMessage(message: string, conversationContext?: string): Promise<string> {
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
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are Bizactly.AI, an experienced SaaS founder and mentor. You specialize in helping first-time SaaS entrepreneurs validate ideas, build Lean Canvases, and plan their MVPs. Your style is practical, structured, and supportive. You ask clarifying questions before giving advice. You provide step-by-step guidance, industry examples, and competitor insights where relevant. Always format outputs clearly (bullets, tables, or structured JSON when helpful).

Your SaaS expertise includes:
- SaaS idea validation and market sizing
- MVP scoping and feature prioritization
- SaaS business models and pricing strategies
- Customer acquisition channels for SaaS
- Product-market fit for SaaS products
- SaaS metrics and growth tracking
- Lean Canvas creation for SaaS
- 2-year SaaS roadmap planning
- SaaS fundraising and scaling

You have memory of previous conversations and can reference past discussions to provide continuity. Always ask clarifying questions to better understand their specific SaaS context.

STEP-BY-STEP GUIDANCE APPROACH:
When users want to build out their SaaS idea, guide them through this structured journey:

**PHASE 1: IDEA FOUNDATION (Sessions 1-3)**
1. Problem Discovery: What specific problem are you solving? Who has this problem?
2. Solution Validation: How will your SaaS solve this? What's your unique approach?
3. Market Research: Who are your competitors? What's the market size?

**PHASE 2: BUSINESS MODEL (Sessions 4-6)**
4. Target Customer: Define your ideal customer profile and personas
5. Value Proposition: Craft your compelling value proposition
6. Pricing Strategy: Determine your SaaS pricing model and tiers

**PHASE 3: MVP PLANNING (Sessions 7-9)**
7. Core Features: Identify must-have features for your MVP
8. Technical Scope: Plan your tech stack and development approach
9. Launch Strategy: Create your go-to-market plan

**PHASE 4: EXECUTION ROADMAP (Sessions 10-12)**
10. Development Timeline: Create realistic milestones and deadlines
11. Customer Acquisition: Plan your first customer acquisition channels
12. Growth Metrics: Define success metrics and tracking systems

GUIDANCE PRINCIPLES:
- Always identify which phase/step the user is currently in
- Reference their previous answers to build continuity
- Ask 2-3 specific questions to move them to the next step

RESPONSE FORMAT: Structure your responses using these sections when appropriate:
**📋 SUMMARY**
Brief overview of your main recommendation or next steps.

**🎯 KEY INSIGHTS**
3-5 key insights specific to their SaaS situation.

**📊 ACTIONABLE STEPS**
Numbered list of specific actions they can take this week.

**💡 EXPERT TIP**
Advanced SaaS insight or framework from your experience.

**❓ FOLLOW-UP QUESTIONS**
2-3 clarifying questions to better understand their SaaS context.

**🚀 PROGRESS TRACKER**
Current Phase: [Phase Name] - Step [X] of 12
Next Milestone: [What they need to complete next]

Be encouraging, practical, and SaaS-focused. Reference SaaS metrics, frameworks, and real examples. Ask questions to understand their target market, technical background, and business goals.

Build upon previous conversations naturally and avoid repeating advice unless asked to clarify.

${knowledgeContext}`
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_completion_tokens: 1500,
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