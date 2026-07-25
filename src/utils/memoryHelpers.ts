import { AIMemory, BusinessIntelligenceModel, Project } from '../types/project';
import { createBIM, addClaim, getBIMSummary } from '../services/businessIntelligence';

export function updateMemoryFromProject(project: Project): AIMemory {
  const memory: AIMemory = project.ai_memory || {};

  if (project.problem_statement && !memory.idea?.problem) {
    memory.idea = { ...memory.idea, problem: project.problem_statement };
  }
  if (project.value_proposition) {
    memory.idea = { ...memory.idea, uniqueValue: project.value_proposition };
  }
  if (project.target_users) {
    memory.market = { ...memory.market, targetCustomer: project.target_users.primaryAudience || '' };
  }
  if (project.business_model) {
    memory.businessModel = { ...memory.businessModel, revenueModel: project.business_model };
  }
  if (project.competitive_advantage) {
    memory.market = { ...memory.market, competitiveAdvantage: project.competitive_advantage };
  }
  if (project.mvp_features_list?.length) {
    memory.product = {
      ...memory.product,
      coreFeatures: project.mvp_features_list.filter(f => f.priority === 'must-have').map(f => f.name),
      mvpScope: `${project.mvp_features_list.length} features planned`,
    };
  }
  if (project.tech_stack) {
    const stack = [
      ...(project.tech_stack.frontend || []),
      ...(project.tech_stack.backend || []),
      ...(project.tech_stack.database || []),
    ];
    if (stack.length) memory.product = { ...memory.product, techStack: stack };
  }
  if (project.current_milestone || project.status) {
    memory.progress = {
      ...memory.progress,
      stage: project.current_milestone || project.status,
      currentFocus: project.next_actions?.[0] || 'Planning next steps',
    };
  }

  return memory;
}

// ─── BIM seed helpers ──────────────────────────────────────────────────────────
// Seed a new BIM from a Project's structured fields so the AI has a starting
// point instead of a blank slate on the first conversation.

export function seedBIMFromProject(project: Project): BusinessIntelligenceModel {
  let bim = createBIM();

  if (project.problem_statement) {
    bim = addClaim(bim, {
      category: 'problem',
      claim: project.problem_statement,
      value: project.problem_statement,
      source: 'user_stated',
    });
  }

  if (project.value_proposition) {
    bim = addClaim(bim, {
      category: 'value_proposition',
      claim: project.value_proposition,
      value: project.value_proposition,
      source: 'user_stated',
    });
  }

  if (project.target_users?.primaryAudience) {
    bim = addClaim(bim, {
      category: 'target_customer',
      claim: project.target_users.primaryAudience,
      value: project.target_users.primaryAudience,
      source: 'user_stated',
    });
  }

  if (project.business_model) {
    bim = addClaim(bim, {
      category: 'revenue_model',
      claim: project.business_model,
      value: project.business_model,
      source: 'user_stated',
    });
  }

  if (project.competitive_advantage) {
    bim = addClaim(bim, {
      category: 'competitive_advantage',
      claim: project.competitive_advantage,
      value: project.competitive_advantage,
      source: 'user_stated',
    });
  }

  return bim;
}

// ─── Conversation memory helpers ───────────────────────────────────────────────

export function extractTopicsFromMessage(message: string): string[] {
  const topics: string[] = [];
  const lowerMessage = message.toLowerCase();

  const topicKeywords: Record<string, string[]> = {
    pricing: ['pricing', 'price', 'cost', 'revenue', 'subscription'],
    'market research': ['market', 'competitor', 'competition', 'target audience', 'customer'],
    'product features': ['feature', 'functionality', 'capability', 'mvp'],
    'tech stack': ['technology', 'framework', 'database', 'hosting', 'tech stack'],
    validation: ['validate', 'test', 'experiment', 'feedback', 'interview'],
    'launch strategy': ['launch', 'go-to-market', 'marketing', 'acquisition'],
    'business model': ['business model', 'monetization', 'revenue stream'],
    assumptions: ['assumption', 'assume', 'hypothesis', 'untested'],
    unknowns: ['unknown', 'uncertain', 'unclear', "don't know"],
  };

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(kw => lowerMessage.includes(kw))) topics.push(topic);
  }
  return topics;
}

export function shouldUpdateMemory(message: string, response: string): boolean {
  const indicators = [
    'confirmed', 'established as fact', 'that confirms',
    'assumption:', 'unknown:', 'treating this as fact',
    'treating as fact', 'your problem is', 'target customer',
    'pricing strategy', 'revenue model', 'competitive advantage',
  ];
  const combined = `${message} ${response}`.toLowerCase();
  return indicators.some(i => combined.includes(i));
}

export function getBIMStatusSummary(memory?: AIMemory): string {
  if (!memory?.bim) return 'No BIM data yet';
  return getBIMSummary(memory.bim);
}
