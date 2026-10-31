import { supabase } from '../lib/supabase';
import { AuthenticationError, logError, getUserFriendlyMessage } from '../utils/errorHandler';
import { AILayer, AIMemory, UnderstandingDraft, StrategyOutput, ExecutionOutput, InteractionType, DecisionOption, StructuredRecommendation } from '../types/project';

export interface AIRequest {
  message: string;
  projectId: string;
  conversationId?: string;
  includeMemory?: boolean;
}

export interface AIResponse {
  response: string;
  layer?: AILayer;
  layer_output?: {
    draft?: UnderstandingDraft;
    strategy?: StrategyOutput;
    execution?: ExecutionOutput;
  } | null;
  orchestrator?: string;
  orchestrator_gaps?: string[];
  orchestrator_blockers?: string[];
  requested_layer?: AILayer | null;
  actions?: Array<{
    action: string;
    category: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  insights?: string[];
  memoryUpdated: boolean;
  hasDraft?: boolean;
  error?: string;
  // ── Unified Reasoning Architecture fields ──
  intent?: InteractionType;
  is_decision?: boolean;
  decision_options?: DecisionOption[];
  recommendations?: StructuredRecommendation[];
  // ── Milestone 2: Decision Provenance ──
  decision_record_id?: string | null;
  reasoning_event_ids?: string[];
}

export class AIOrchestrator {
  private edgeFunctionUrl: string;

  constructor() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) throw new Error('Missing Supabase URL');
    this.edgeFunctionUrl = `${supabaseUrl}/functions/v1/ai-orchestrator`;
  }

  async sendMessage(request: AIRequest): Promise<AIResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new AuthenticationError('User not authenticated');

      const response = await fetch(this.edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const text = await response.text();
        let message = 'Failed to get AI response';
        try {
          const errorData = JSON.parse(text);
          message = errorData.error || message;
        } catch {
          message = `AI request failed: ${text}`;
        }
        logError(new Error(message), {
          projectId: request.projectId,
          statusCode: response.status,
        });
        throw new Error(message);
      }

      return await response.json() as AIResponse;
    } catch (error) {
      logError(error, { projectId: request.projectId, message: request.message });
      return {
        response: getUserFriendlyMessage(error),
        memoryUpdated: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendMessageFull(projectId: string, message: string, includeMemory = true): Promise<AIResponse> {
    return this.sendMessage({ message, projectId, includeMemory });
  }

  async fetchProjectMemory(projectId: string): Promise<AIMemory | undefined> {
    const { data, error } = await supabase
      .from('projects')
      .select('ai_memory')
      .eq('id', projectId)
      .maybeSingle();
    if (error || !data) return undefined;
    return data.ai_memory as AIMemory | undefined;
  }

  async fetchProjectDraft(projectId: string): Promise<UnderstandingDraft | undefined> {
    const memory = await this.fetchProjectMemory(projectId);
    return memory?.understandingDraft;
  }
}

export const aiOrchestrator = new AIOrchestrator();
