import { supabase } from '../lib/supabase';

export interface BusinessContext {
  id?: string;
  user_id?: string;
  project_id?: string;
  business_name?: string;
  business_description?: string;
  business_stage?: 'idea' | 'validation' | 'mvp' | 'launched' | 'growing' | 'scaling';
  industry?: string;
  problem_statement?: string;
  solution_description?: string;
  unique_value_proposition?: string;
  target_market?: {
    size?: string;
    segments?: string[];
    geography?: string[];
  };
  customer_personas?: Array<{
    name: string;
    demographics?: string;
    pain_points?: string[];
    behaviors?: string[];
  }>;
  competitors?: Array<{
    name: string;
    strengths?: string[];
    weaknesses?: string[];
    differentiation?: string;
  }>;
  current_metrics?: {
    mrr?: number;
    users?: number;
    conversion_rate?: number;
    churn_rate?: number;
    cac?: number;
    ltv?: number;
  };
  product_features?: Array<{
    name: string;
    status: string;
    priority: string;
  }>;
  tech_stack?: string[];
  development_stage?: string;
  revenue_model?: string;
  pricing_strategy?: {
    model?: string;
    tiers?: any[];
    pricing_points?: any[];
  };
  short_term_goals?: Array<{
    goal: string;
    timeline?: string;
    success_criteria?: string;
  }>;
  long_term_goals?: Array<{
    goal: string;
    timeline?: string;
    success_criteria?: string;
  }>;
  current_challenges?: Array<{
    challenge: string;
    severity?: string;
    impact?: string;
  }>;
  team_size?: number;
  budget_range?: string;
  time_commitment?: string;
  technical_expertise?: string;
  created_at?: string;
  updated_at?: string;
}

export class ContextService {
  async getBusinessContext(projectId?: string): Promise<BusinessContext | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      let query = supabase
        .from('user_business_context')
        .select('*')
        .eq('user_id', user.id);

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching business context:', error);
      return null;
    }
  }

  async createBusinessContext(context: BusinessContext): Promise<BusinessContext | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_business_context')
        .insert([{
          ...context,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating business context:', error);
      return null;
    }
  }

  async updateBusinessContext(
    contextId: string,
    updates: Partial<BusinessContext>
  ): Promise<BusinessContext | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_business_context')
        .update(updates)
        .eq('id', contextId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating business context:', error);
      return null;
    }
  }

  buildContextSummary(context: BusinessContext | null): string {
    if (!context) return '';

    const sections: string[] = [];

    if (context.business_name || context.business_description) {
      sections.push(`**BUSINESS OVERVIEW**
- Name: ${context.business_name || 'Not specified'}
- Description: ${context.business_description || 'Not specified'}
- Stage: ${context.business_stage || 'Not specified'}
- Industry: ${context.industry || 'Not specified'}`);
    }

    if (context.problem_statement || context.solution_description) {
      sections.push(`**PROBLEM & SOLUTION**
- Problem: ${context.problem_statement || 'Not specified'}
- Solution: ${context.solution_description || 'Not specified'}
- Value Proposition: ${context.unique_value_proposition || 'Not specified'}`);
    }

    if (context.target_market || context.customer_personas) {
      const personas = context.customer_personas?.map(p => p.name).join(', ') || 'Not specified';
      sections.push(`**TARGET MARKET**
- Market Size: ${context.target_market?.size || 'Not specified'}
- Segments: ${context.target_market?.segments?.join(', ') || 'Not specified'}
- Customer Personas: ${personas}`);
    }

    if (context.current_metrics) {
      const m = context.current_metrics;
      const metricsStr = [
        m.mrr ? `MRR: $${m.mrr}` : null,
        m.users ? `Users: ${m.users}` : null,
        m.conversion_rate ? `Conversion: ${m.conversion_rate}%` : null,
        m.churn_rate ? `Churn: ${m.churn_rate}%` : null,
      ].filter(Boolean).join(', ');

      if (metricsStr) {
        sections.push(`**CURRENT METRICS**
- ${metricsStr}`);
      }
    }

    if (context.revenue_model || context.pricing_strategy) {
      sections.push(`**BUSINESS MODEL**
- Revenue Model: ${context.revenue_model || 'Not specified'}
- Pricing Model: ${context.pricing_strategy?.model || 'Not specified'}`);
    }

    if (context.short_term_goals && context.short_term_goals.length > 0) {
      const goals = context.short_term_goals.map(g =>
        `${g.goal}${g.timeline ? ` (${g.timeline})` : ''}`
      ).join('; ');
      sections.push(`**SHORT-TERM GOALS**
- ${goals}`);
    }

    if (context.current_challenges && context.current_challenges.length > 0) {
      const challenges = context.current_challenges.map(c =>
        `${c.challenge}${c.severity ? ` [${c.severity}]` : ''}`
      ).join('; ');
      sections.push(`**CURRENT CHALLENGES**
- ${challenges}`);
    }

    if (context.team_size || context.budget_range || context.time_commitment) {
      sections.push(`**RESOURCES**
- Team Size: ${context.team_size || 'Not specified'}
- Budget: ${context.budget_range || 'Not specified'}
- Time Commitment: ${context.time_commitment || 'Not specified'}
- Technical Expertise: ${context.technical_expertise || 'Not specified'}`);
    }

    return sections.length > 0
      ? `\n\n**USER BUSINESS CONTEXT:**\n${sections.join('\n\n')}`
      : '';
  }
}

export const contextService = new ContextService();
