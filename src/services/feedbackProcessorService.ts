import { supabase } from '../lib/supabase';
import { BusinessContext } from './contextService';

export interface AIFeedback {
  id?: string;
  user_id?: string;
  project_id?: string;
  context_snapshot_id?: string;
  feedback_type: 'insight' | 'recommendation' | 'warning' | 'celebration' | 'milestone';
  category?: string;
  title: string;
  content: string;
  trigger_event?: string;
  input_context?: any;
  recommendations?: Array<{
    action_id: string;
    action: string;
    priority: string;
    estimated_time?: string;
    resources_needed?: string[];
  }>;
  is_actionable?: boolean;
  action_taken?: boolean;
  action_date?: string;
  outcome?: {
    result?: string;
    impact?: string;
    lessons_learned?: string[];
  };
  effectiveness_rating?: number;
  user_feedback?: string;
  was_helpful?: boolean;
  created_at?: string;
}

export class FeedbackProcessorService {
  async saveFeedback(feedback: AIFeedback): Promise<AIFeedback | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ai_feedback_history')
        .insert([{
          ...feedback,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving feedback:', error);
      return null;
    }
  }

  async getFeedbackHistory(
    projectId?: string,
    limit: number = 50
  ): Promise<AIFeedback[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('ai_feedback_history')
        .select('*')
        .eq('user_id', user.id);

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching feedback history:', error);
      return [];
    }
  }

  async updateFeedbackOutcome(
    feedbackId: string,
    outcome: {
      action_taken?: boolean;
      result?: string;
      impact?: string;
      lessons_learned?: string[];
      effectiveness_rating?: number;
      was_helpful?: boolean;
    }
  ): Promise<AIFeedback | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const updateData: any = {
        action_taken: outcome.action_taken,
        was_helpful: outcome.was_helpful,
        effectiveness_rating: outcome.effectiveness_rating,
      };

      if (outcome.action_taken) {
        updateData.action_date = new Date().toISOString();
      }

      if (outcome.result || outcome.impact || outcome.lessons_learned) {
        updateData.outcome = {
          result: outcome.result,
          impact: outcome.impact,
          lessons_learned: outcome.lessons_learned,
        };
      }

      const { data, error } = await supabase
        .from('ai_feedback_history')
        .update(updateData)
        .eq('id', feedbackId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating feedback outcome:', error);
      return null;
    }
  }

  extractInsightsFromResponse(
    aiResponse: string,
    context: BusinessContext | null
  ): Array<Partial<AIFeedback>> {
    const insights: Array<Partial<AIFeedback>> = [];

    const keyInsightsMatch = aiResponse.match(/\*\*🎯 KEY INSIGHTS\*\*([\s\S]*?)(?=\*\*|$)/i);
    if (keyInsightsMatch) {
      const insightText = keyInsightsMatch[1].trim();
      insights.push({
        feedback_type: 'insight',
        category: 'general',
        title: 'Key Insights',
        content: insightText,
        input_context: context,
        is_actionable: false,
      });
    }

    const recommendationsMatch = aiResponse.match(/\*\*📊 ACTIONABLE STEPS\*\*([\s\S]*?)(?=\*\*|$)/i);
    if (recommendationsMatch) {
      const recText = recommendationsMatch[1].trim();
      const steps = recText.split(/\n\d+\./).filter(s => s.trim());

      const recommendations = steps.map(step => ({
        action_id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        action: step.trim(),
        priority: 'medium',
      }));

      insights.push({
        feedback_type: 'recommendation',
        category: 'actionable',
        title: 'Actionable Steps',
        content: recText,
        recommendations,
        input_context: context,
        is_actionable: true,
      });
    }

    const quickWinMatch = aiResponse.match(/\*\*🚀 QUICK WIN\*\*([\s\S]*?)(?=\*\*|$)/i);
    if (quickWinMatch) {
      const quickWinText = quickWinMatch[1].trim();
      insights.push({
        feedback_type: 'recommendation',
        category: 'quick_win',
        title: 'Quick Win',
        content: quickWinText,
        recommendations: [{
          action_id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          action: quickWinText,
          priority: 'high',
          estimated_time: '1 day',
        }],
        input_context: context,
        is_actionable: true,
      });
    }

    const warningPatterns = [
      /\b(?:warning|caution|risk|danger|avoid)\b/i,
      /\b(?:should not|must not|don't)\b/i,
    ];

    for (const pattern of warningPatterns) {
      if (pattern.test(aiResponse)) {
        const warningMatch = aiResponse.match(new RegExp(`([^.!?]*${pattern.source}[^.!?]*[.!?])`, 'i'));
        if (warningMatch) {
          insights.push({
            feedback_type: 'warning',
            category: 'risk',
            title: 'Important Warning',
            content: warningMatch[1].trim(),
            input_context: context,
            is_actionable: true,
          });
        }
        break;
      }
    }

    const celebrationPatterns = [
      /\b(?:great|excellent|outstanding|impressive|wonderful|fantastic)\b/i,
      /\b(?:congratulations|well done|good job)\b/i,
    ];

    for (const pattern of celebrationPatterns) {
      if (pattern.test(aiResponse)) {
        const celebrationMatch = aiResponse.match(new RegExp(`([^.!?]*${pattern.source}[^.!?]*[.!?])`, 'i'));
        if (celebrationMatch) {
          insights.push({
            feedback_type: 'celebration',
            category: 'progress',
            title: 'Progress Celebration',
            content: celebrationMatch[1].trim(),
            input_context: context,
            is_actionable: false,
          });
        }
        break;
      }
    }

    return insights;
  }

  async processAndSaveInsights(
    aiResponse: string,
    context: BusinessContext | null,
    projectId?: string
  ): Promise<void> {
    const insights = this.extractInsightsFromResponse(aiResponse, context);

    for (const insight of insights) {
      await this.saveFeedback({
        ...insight as AIFeedback,
        project_id: projectId,
        trigger_event: 'ai_response',
      });
    }
  }

  buildFeedbackContext(recentFeedback: AIFeedback[]): string {
    if (recentFeedback.length === 0) return '';

    const actionableFeedback = recentFeedback.filter(f =>
      f.is_actionable && !f.action_taken
    );

    const completedActions = recentFeedback.filter(f =>
      f.action_taken && f.effectiveness_rating
    );

    const sections: string[] = [];

    if (actionableFeedback.length > 0) {
      const items = actionableFeedback.slice(0, 5).map(f =>
        `- ${f.title}: ${f.content.substring(0, 100)}...`
      ).join('\n');

      sections.push(`**PENDING RECOMMENDATIONS**
${items}`);
    }

    if (completedActions.length > 0) {
      const avgRating = completedActions.reduce((sum, f) =>
        sum + (f.effectiveness_rating || 0), 0
      ) / completedActions.length;

      const successfulActions = completedActions.filter(f =>
        f.effectiveness_rating && f.effectiveness_rating >= 4
      ).length;

      sections.push(`**PAST RECOMMENDATIONS PERFORMANCE**
- Total Actions Taken: ${completedActions.length}
- Successful Actions: ${successfulActions}
- Average Effectiveness: ${avgRating.toFixed(1)}/5.0`);
    }

    return sections.length > 0
      ? `\n\n**AI FEEDBACK HISTORY:**\n${sections.join('\n\n')}`
      : '';
  }
}

export const feedbackProcessorService = new FeedbackProcessorService();
