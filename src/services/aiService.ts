import { retrieveRelevantKnowledge } from '../data/knowledgeBase';
import { AIMemory } from '../types/project';
import { renderBIMForPrompt, getBIMSummary } from './businessIntelligence';
import { supabase } from '../lib/supabase';

// ─── Core philosophy ───────────────────────────────────────────────────────────
// Bizactly's purpose is not to provide answers.
// It is to develop an increasingly accurate understanding of a business and
// use that understanding to help the founder make better decisions.
//
// The Business Intelligence Model (BIM) is the shared source of truth.
// Every AI layer reads from it and writes to it.
// Facts, assumptions, unknowns, and contradictions are tracked separately.
// Confidence is earned through evidence and repetition, not stated intent.

const BIZACTLY_CORE_PROMPT = `You are Bizactly's business intelligence engine.

Your purpose is NOT to answer questions or provide advice on demand. Your purpose is to develop an increasingly accurate Business Intelligence Model (BIM) of this business — and use that model to help the founder make better decisions.

Every response must accomplish at least one of:
1. Reduce uncertainty — name a specific unknown and address it
2. Increase confidence — move an assumption toward fact with evidence
3. Surface a hidden assumption the founder hasn't questioned
4. Produce a specific output grounded in what is actually known

THE BUSINESS INTELLIGENCE MODEL (BIM):
Every claim in this business is tracked with an epistemic status:
- FACT: Supported by evidence (data, testing, validation, or explicit user confirmation)
- ASSUMPTION: Stated but untested — treat with calibrated skepticism
- UNKNOWN: A named gap that blocks a specific decision

Confidence is earned:
- A new claim starts at 30% confidence (15% if AI-inferred)
- Explicit user confirmation: +25%
- Each additional repetition: +15%
- Each independent evidence item: +10%
- Contradiction detected: -20%
- User changes their answer: -30%

An assumption becomes a FACT when:
1. User explicitly confirms it
2. Stated consistently 3+ times
3. Supported by 2+ independent evidence items

A LEARNED item is a fact with confidence >= 85% — it can be treated as ground truth.

CONVERSATION RULES:
- Lead with your current BIM state, not a question
- When you name an assumption: say WHY it matters if wrong
- When you name an unknown: say what decision it blocks
- Ask ONE question per message — the one that most reduces uncertainty
- Never ask questions just to seem engaged
- When the user provides evidence: explicitly update — "That confirms X. Confidence now [high/medium]. Treating as fact."
- When an assumption fails: name it — "That assumption appears wrong. Here's what changes."
- When you detect a contradiction: name it directly — "This conflicts with what you said earlier about X."

TONE: Direct. Specific. Honest about uncertainty. Never hollow. Never performative.`;

export const BIZACTLY_SAAS_PROMPT = BIZACTLY_CORE_PROMPT + `

DOMAIN: SaaS startup advising

You develop a grounded BIM by systematically building confidence across five areas:
1. PROBLEM — Is it real, painful, and widespread enough? (key unknown: willingness to pay)
2. BUSINESS MODEL — Is value creation and capture clearly defined? (key unknown: unit economics)
3. CUSTOMER — Is the early adopter specific enough to find and sell to? (key unknown: the trigger moment)
4. MVP SCOPE — Is the scope tied to a specific user action? (key unknown: what can be cut)
5. GO-TO-MARKET — Is the route to the first 10 customers credible? (key unknown: channel cost)

For each area, explicitly track what is fact vs. assumption vs. unknown.
Surface the highest-impact unknown in each exchange.
Never re-ask things already established in the BIM.`;

export const BIZACTLY_PROJECT_PROMPT = BIZACTLY_CORE_PROMPT + `

DOMAIN: Project specification development

You build a BIM for a software project by developing confidence across:
- Problem definition (fact or assumption?)
- User identity (specific, not generic)
- MVP scope (ruthlessly scoped — what is actually the minimum?)
- Business model (revenue must be specific, not "subscription")
- Technical constraints (what actually limits choices?)

Surface critical unknowns that would change the specification.`;

// ─── BIM-aware context builder ────────────────────────────────────────────────

export function buildBIMContext(memory?: AIMemory): string {
  if (!memory) return '';

  const sections: string[] = [];

  // Always render BIM first — it's the primary context
  if (memory.bim) {
    sections.push(renderBIMForPrompt(memory.bim));
  }

  // Supplement with structured memory fields (for compatibility)
  if (memory.founderProfile) {
    const p = memory.founderProfile;
    sections.push(`FOUNDER CONTEXT:
Experience: ${p.experienceLevel || 'Unknown'} | Background: ${p.background || 'Not specified'}
Goals: ${p.goals?.join(', ') || 'Not specified'}`);
  }

  if (memory.idea && !memory.bim) {
    const i = memory.idea;
    sections.push(`IDEA (legacy — migrate to BIM):
Problem: ${i.problem || 'Not yet defined'}
Solution: ${i.solution || 'Not yet defined'}
Unique value: ${i.uniqueValue || 'Not yet defined'}`);
  }

  if (memory.validation) {
    const v = memory.validation;
    const interviews = v.customerInterviews || 0;
    if (interviews > 0) {
      sections.push(`VALIDATION: ${interviews} customer interview${interviews > 1 ? 's' : ''} completed.
Learnings: ${v.keyLearnings?.join('; ') || 'None recorded'}`);
    }
  }

  if (memory.progress) {
    sections.push(`STAGE: ${memory.progress.stage || 'Early exploration'}`);
  }

  return sections.length > 0
    ? `\n\n${sections.join('\n\n')}`
    : '';
}

// ─── Edge function caller ─────────────────────────────────────────────────────

async function callEdgeFunction(route: string, body: Record<string, unknown>): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('User not authenticated');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const url = `${supabaseUrl}/functions/v1/ai-orchestrator`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ route, ...body }),
  });

  if (!response.ok) {
    const text = await response.text();
    try {
      const errorData = JSON.parse(text);
      throw new Error(errorData.error || 'Unknown error');
    } catch {
      throw new Error(`AI request failed: ${text}`);
    }
  }

  const data = await response.json();
  return data.response;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function sendMessage(
  message: string,
  _conversationContext?: string,
  projectMemory?: AIMemory,
  businessContext?: string,
  feedbackContext?: string
): Promise<string> {
  const relevantKnowledge = retrieveRelevantKnowledge(message, 3);
  const knowledgeContext = relevantKnowledge.length > 0
    ? `\n\nRelevant domain knowledge:\n${relevantKnowledge.map(item =>
      `${item.title} (${item.category}):\n${item.content}`
    ).join('\n\n')}`
    : '';

  const bimContext = buildBIMContext(projectMemory);

  const systemPrompt = BIZACTLY_SAAS_PROMPT +
    knowledgeContext +
    bimContext +
    (businessContext || '') +
    (feedbackContext || '');

  return callEdgeFunction('chat', { message, systemPrompt });
}

export async function chatWithAI(
  message: string,
  projectContext: string,
  maxTokens: number = 4096,
  projectMemory?: AIMemory,
  businessContext?: string,
  feedbackContext?: string
): Promise<string> {
  const bimContext = buildBIMContext(projectMemory);

  const systemPrompt = BIZACTLY_CORE_PROMPT +
    `\n\n${projectContext}` +
    bimContext +
    (businessContext || '') +
    (feedbackContext || '');

  return callEdgeFunction('chat', { message, systemPrompt, maxTokens });
}

export async function sendProjectMessage(
  message: string,
  projectContext?: any,
  projectMemory?: AIMemory,
  businessContext?: string,
  feedbackContext?: string
): Promise<string> {
  const contextString = projectContext
    ? `\n\nCurrent project context:\n${JSON.stringify(projectContext, null, 2)}`
    : '';

  const bimContext = buildBIMContext(projectMemory);

  const systemPrompt = BIZACTLY_PROJECT_PROMPT +
    contextString +
    bimContext +
    (businessContext || '') +
    (feedbackContext || '');

  return callEdgeFunction('chat-project-creation', { message, systemPrompt });
}

export function extractMemoryUpdates(
  aiResponse: string,
  currentMemory: AIMemory = {}
): AIMemory {
  const updatedMemory: AIMemory = { ...currentMemory };

  if (!updatedMemory.conversationContext) {
    updatedMemory.conversationContext = {};
  }
  updatedMemory.conversationContext.lastUpdated = new Date().toISOString();

  return updatedMemory;
}
