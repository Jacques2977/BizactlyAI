import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Bot, User, Loader2, Sparkles, Brain, Target, Zap, Compass,
  ArrowRight, TrendingUp, CheckCircle2, HelpCircle, AlertCircle,
} from 'lucide-react';
import {
  Project, AILayer, BusinessMaturityStage, UnderstandingDraft, StrategyOutput, ExecutionOutput,
} from '../../types/project';
import { aiOrchestrator } from '../../services/aiOrchestratorService';
import { UnderstandingDraftCard } from './UnderstandingDraftCard';
import { StrategyOutputCard } from './StrategyOutputCard';
import { ExecutionOutputCard } from './ExecutionOutputCard';
import { ReadinessGate } from './ReadinessGate';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  layer?: AILayer;
  requestedLayer?: AILayer | null;
  gaps?: string[];
  blockers?: string[];
  layerOutput?: {
    draft?: UnderstandingDraft;
    strategy?: StrategyOutput;
    execution?: ExecutionOutput;
  } | null;
  triggersDraftPoll?: boolean;
}

const LAYER_CONFIG: Record<AILayer, { label: string; icon: React.ReactNode; color: string; bg: string; description: string }> = {
  discovery: {
    label: 'Discovery',
    icon: <Compass className="w-3 h-3" />,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/30',
    description: 'Learning about your business',
  },
  understanding: {
    label: 'Understanding',
    icon: <Brain className="w-3 h-3" />,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/30',
    description: 'Organising what we know',
  },
  strategy: {
    label: 'Strategy',
    icon: <Target className="w-3 h-3" />,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    description: 'Making strategic decisions',
  },
  execution: {
    label: 'Execution',
    icon: <Zap className="w-3 h-3" />,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/30',
    description: 'Building the plan',
  },
};

const STAGE_CONFIG: Record<BusinessMaturityStage, { label: string; color: string; bg: string; step: number }> = {
  exploration: { label: 'Exploring',  color: 'text-gray-400',    bg: 'bg-gray-700/60',       step: 1 },
  validation:  { label: 'Validating', color: 'text-blue-400',    bg: 'bg-blue-500/15',        step: 2 },
  planning:    { label: 'Planning',   color: 'text-purple-400',  bg: 'bg-purple-500/15',      step: 3 },
  building:    { label: 'Building',   color: 'text-emerald-400', bg: 'bg-emerald-500/15',     step: 4 },
  launch:      { label: 'Launching',  color: 'text-orange-400',  bg: 'bg-orange-500/15',      step: 5 },
  growth:      { label: 'Growing',    color: 'text-cyan-400',    bg: 'bg-cyan-500/15',        step: 6 },
};

// Stage-aware suggested prompts — surface questions relevant to where the founder is now
const STAGE_PROMPTS: Record<BusinessMaturityStage, string[]> = {
  exploration: [
    'My idea is...',
    'The problem I see is...',
    'My target customer is...',
    'Why does this problem matter?',
    'Who has this problem most acutely?',
  ],
  validation: [
    'Have any customers confirmed this problem?',
    'What alternatives do people use today?',
    'What would make someone pay for this?',
    'What is my riskiest assumption?',
    'How am I different from competitors?',
  ],
  planning: [
    'Create a strategy for this business',
    'What pricing model makes sense?',
    'How do I reach my first 100 customers?',
    'What are the biggest risks right now?',
    'Summarize what we know so far',
  ],
  building: [
    'Build the MVP roadmap',
    'What should I build first?',
    'Create a sprint plan for the next 4 weeks',
    'What features are absolutely essential?',
    'Summarize where we stand',
  ],
  launch: [
    'Create a launch checklist',
    'What is my go-to-market plan?',
    'Build a marketing checklist',
    'What should I measure at launch?',
    'Summarize the execution plan',
  ],
  growth: [
    'What growth levers should I pull?',
    'Create a roadmap for the next quarter',
    'Where should I focus next?',
    'What is my retention strategy?',
    'Summarize business performance',
  ],
};

// Loading messages that reflect what the system is actually doing
const LOADING_MESSAGES = [
  'Building understanding...',
  'Connecting what you shared...',
  'Deepening the picture...',
  'Mapping this to what we know...',
  'Processing your idea...',
];

interface AIChatSectionProps {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
}

export function AIChatSection({ project, onUpdate }: AIChatSectionProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg] = useState(() => LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
  const [currentDraft, setCurrentDraft] = useState<UnderstandingDraft | undefined>(
    project.ai_memory?.understandingDraft
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const bim = project.ai_memory?.bim;
  const stage: BusinessMaturityStage = bim?.maturity_stage ?? 'exploration';
  const confidence = bim
    ? Math.round((Object.values(bim.confidence_scores).reduce((s, v) => s + v, 0) / Math.max(Object.values(bim.confidence_scores).length, 1)) * 100)
    : 0;
  const factCount = bim?.facts.length ?? 0;
  const assumptionCount = bim?.assumptions.length ?? 0;
  const stageConfig = STAGE_CONFIG[stage];

  useEffect(() => {
    const hasBIM = bim && (bim.facts.length > 0 || bim.assumptions.length > 0);
    const welcome: Message = {
      id: '1',
      role: 'assistant',
      content: hasBIM
        ? buildReturnWelcome(project.title, factCount, assumptionCount, confidence, stage)
        : buildFirstWelcome(project.title, project.description),
      timestamp: new Date(),
      layer: 'discovery',
    };
    setMessages([welcome]);
  }, [project.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const result = await aiOrchestrator.sendMessageFull(project.id, inputMessage);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
        layer: result.layer,
        requestedLayer: result.requested_layer,
        gaps: result.orchestrator_gaps,
        blockers: result.orchestrator_blockers,
        layerOutput: result.layer_output,
        triggersDraftPoll: result.hasDraft,
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (result.hasDraft) {
        setTimeout(async () => {
          const draft = await aiOrchestrator.fetchProjectDraft(project.id);
          if (draft) {
            setCurrentDraft(draft);
            setMessages(prev => prev.map(m =>
              m.id === assistantMessage.id ? { ...m, triggersDraftPoll: false } : m
            ));
          }
        }, 3000);
      }

      if (result.layer === 'understanding' && result.layer_output?.draft) {
        setCurrentDraft(result.layer_output.draft);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Something went wrong. Please try again.',
        timestamp: new Date(),
        layer: 'discovery',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedPrompts = STAGE_PROMPTS[stage];

  const draftTriggerIndex = (() => {
    if (!currentDraft) return -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].layer === 'understanding' && messages[i].layerOutput?.draft) return i;
    }
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].triggersDraftPoll) return i;
    }
    return -1;
  })();

  const confidenceColor = confidence >= 65 ? 'text-emerald-400' : confidence >= 40 ? 'text-amber-400' : 'text-blue-400';
  const confidenceBg = confidence >= 65 ? 'bg-emerald-500' : confidence >= 40 ? 'bg-amber-500' : 'bg-blue-500';

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-5 py-3.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-blue-500/20 p-1.5 rounded-lg flex-shrink-0">
              <Sparkles className="w-4 h-4 text-blue-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-semibold text-white">Business Intelligence</h2>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${stageConfig.bg} ${stageConfig.color}`}>
                  {stageConfig.label}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                Step-by-step idea development · 4-layer AI system
              </p>
            </div>
          </div>

          {/* Live BIM stats */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            {(factCount > 0 || assumptionCount > 0) && (
              <div className="flex items-center gap-2">
                {factCount > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{factCount} confirmed</span>
                  </div>
                )}
                {assumptionCount > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-amber-400">
                    <HelpCircle className="w-3 h-3" />
                    <span>{assumptionCount} assumed</span>
                  </div>
                )}
              </div>
            )}
            {confidence > 0 && (
              <div className="flex items-center gap-2 bg-gray-800/60 px-2.5 py-1.5 rounded-lg border border-gray-700/60">
                <div className="w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${confidenceBg}`}
                    style={{ width: `${confidence}%` }}
                  />
                </div>
                <span className={`text-[10px] font-semibold ${confidenceColor}`}>{confidence}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.map((message, idx) => (
          <React.Fragment key={message.id}>
            <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 max-w-3xl ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                  message.role === 'user' ? 'bg-blue-600' : 'bg-gray-800 border border-gray-700'
                }`}>
                  {message.role === 'user'
                    ? <User className="w-3.5 h-3.5 text-white" />
                    : <Bot className="w-3.5 h-3.5 text-gray-400" />}
                </div>

                <div className="space-y-1 min-w-0">
                  {/* Layer badge + redirect indicator */}
                  {message.role === 'assistant' && message.layer && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className={`flex items-center gap-1 text-[10px] w-fit px-2 py-0.5 rounded border ${LAYER_CONFIG[message.layer].bg} ${LAYER_CONFIG[message.layer].color}`}>
                        {LAYER_CONFIG[message.layer].icon}
                        <span>{LAYER_CONFIG[message.layer].label}</span>
                      </div>
                      {message.requestedLayer && message.requestedLayer !== message.layer && (
                        <div className="flex items-center gap-1 text-[10px] text-gray-600">
                          <span>wanted</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                          <span className={LAYER_CONFIG[message.requestedLayer].color}>
                            {LAYER_CONFIG[message.requestedLayer].label}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message bubble */}
                  <div className={`rounded-xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-100 border border-gray-700/60'
                  }`}>
                    <MessageContent content={message.content} />
                    <p className={`text-[10px] mt-2 ${message.role === 'user' ? 'text-blue-200/60' : 'text-gray-600'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Output cards */}
            {message.role === 'assistant' && message.layer === 'strategy' && message.layerOutput?.strategy && (
              <StrategyOutputCard strategy={message.layerOutput.strategy} />
            )}
            {message.role === 'assistant' && message.layer === 'execution' && message.layerOutput?.execution && (
              <ExecutionOutputCard execution={message.layerOutput.execution} />
            )}
            {/* Readiness gate — what's blocking the requested layer */}
            {message.role === 'assistant' && message.requestedLayer && message.requestedLayer !== message.layer &&
              ((message.gaps?.length ?? 0) > 0 || (message.blockers?.length ?? 0) > 0) && (
              <ReadinessGate
                requestedLayer={message.requestedLayer}
                gaps={message.gaps ?? []}
                blockers={message.blockers ?? []}
              />
            )}
            {idx === draftTriggerIndex && currentDraft && (
              <UnderstandingDraftCard
                draft={currentDraft}
                onDismiss={() => setCurrentDraft(undefined)}
              />
            )}
          </React.Fragment>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-3xl">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <div className="bg-gray-800 border border-gray-700/60 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                  <span className="text-xs text-gray-400">{loadingMsg}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts — context-aware based on maturity stage */}
      {messages.length <= 1 && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-3 h-3 text-gray-600" />
            <p className="text-xs text-gray-600">
              {stage === 'exploration' ? 'Start by telling me about your idea:' : `Good questions for the ${stageConfig.label.toLowerCase()} stage:`}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestedPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => setInputMessage(prompt)}
                className="text-left px-3 py-1.5 bg-gray-800/60 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-full text-xs text-gray-400 hover:text-gray-200 transition-all duration-200"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Understanding progress bar — visible when there's any BIM data */}
      {confidence > 0 && (
        <div className="px-4 pb-1 md:hidden">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-600 w-20">Understanding</span>
            <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${confidenceBg}`}
                style={{ width: `${confidence}%` }}
              />
            </div>
            <span className={`text-[10px] font-semibold w-8 text-right ${confidenceColor}`}>{confidence}%</span>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-800 bg-gray-900 px-4 py-3">
        <div className="flex gap-2">
          <textarea
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={getPlaceholder(stage)}
            className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500/40 border border-gray-700 focus:border-gray-600 resize-none text-sm placeholder-gray-600 transition-colors"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center self-end"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-[10px] text-gray-700 mt-1.5 leading-relaxed">
          Every message builds the Business Intelligence Model · Discovery · Understanding · Strategy · Execution
        </p>
      </div>
    </div>
  );
}

// ─── Message content renderer ─────────────────────────────────────────────────

function MessageContent({ content }: { content: string }) {
  const lines = content.split('\n').filter(l => l.trim());
  return (
    <div className="text-sm leading-relaxed space-y-1">
      {lines.map((line, i) => (
        <p key={i} className="last:mb-0">
          {line.split(/(\*\*.*?\*\*)/).map((part, j) =>
            part.startsWith('**') && part.endsWith('**')
              ? <strong key={j} className="font-semibold text-white">{part.slice(2, -2)}</strong>
              : part
          )}
        </p>
      ))}
    </div>
  );
}

// ─── Welcome message builders ─────────────────────────────────────────────────

function buildFirstWelcome(title: string, description?: string): string {
  const desc = description?.trim();
  if (desc) {
    return `I'm here to help you develop **${title}** from idea to execution, step by step. I can see you've described it as: "${desc.slice(0, 120)}${desc.length > 120 ? '...' : ''}". Let's make sure we deeply understand the problem before anything else — who is experiencing this problem most acutely?`;
  }
  return `I'm here to help you develop **${title}** from idea to execution, one step at a time. I'll build a shared understanding of your business as we talk — each conversation makes the picture clearer. To start: what problem are you solving, and who has it worst?`;
}

function buildReturnWelcome(
  title: string,
  facts: number,
  assumptions: number,
  confidence: number,
  stage: BusinessMaturityStage,
): string {
  const stageLabel = STAGE_CONFIG[stage].label.toLowerCase();
  const progress = confidence >= 60
    ? `at a strong ${confidence}% understanding`
    : `building to ${confidence}% understanding so far`;
  return `Welcome back to **${title}**. We're ${stageLabel} ${progress} — ${facts} confirmed fact${facts !== 1 ? 's' : ''} and ${assumptions} working assumption${assumptions !== 1 ? 's' : ''} in the model. What would you like to explore next?`;
}

// ─── Stage-aware input placeholder ───────────────────────────────────────────

function getPlaceholder(stage: BusinessMaturityStage): string {
  switch (stage) {
    case 'exploration': return 'Tell me about your idea — the problem, the people, why it matters...';
    case 'validation':  return 'Share what you\'ve learned from customers, competitors, or testing...';
    case 'planning':    return 'Ask for strategy, pricing, positioning, or summarize what we know...';
    case 'building':    return 'Ask for the MVP plan, roadmap, sprint breakdown, or tech spec...';
    case 'launch':      return 'Ask for launch tasks, marketing checklist, or go-to-market plan...';
    case 'growth':      return 'Discuss growth levers, retention, new features, or what\'s next...';
  }
}
