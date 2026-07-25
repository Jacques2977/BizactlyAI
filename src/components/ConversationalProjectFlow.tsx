import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, CheckCircle, Sparkles, Target, Users, Layers, Rocket, Loader, Lightbulb, CreditCard as Edit2, X } from 'lucide-react';
import { Project } from '../types/project';
import { chatWithAI } from '../services/aiService';
import { databaseService } from '../services/databaseService';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface ConversationalProjectFlowProps {
  onComplete: (project: Project) => void;
  onClose: () => void;
  onProjectSaved?: (project: Project) => void;
  initialProject?: Project | null;
}

interface CompiledData {
  projectTitle?: string;
  ideaValidation?: { idea: string; problem: string; solution: string; targetMarket: string };
  leanCanvas?: {
    problem: string[]; solution: string[]; uniqueValue: string; unfairAdvantage: string;
    customerSegments: string[]; keyMetrics: string[]; channels: string[];
    costStructure: string[]; revenueStreams: string[];
  };
  personas?: Array<{ name: string; demographics: string; goals: string[]; painPoints: string[]; behaviors: string[] }>;
  mvpFeatures?: Array<{ name: string; description: string; priority: 'must-have' | 'nice-to-have' | 'future'; complexity: 'low' | 'medium' | 'high' }>;
  launchStrategy?: { preLaunch: string[]; launch: string[]; postLaunch: string[]; timeline: string };
}

const MILESTONES = [
  { id: 'idea_validation', title: 'Idea Validation', icon: Sparkles },
  { id: 'lean_canvas', title: 'Lean Canvas', icon: Target },
  { id: 'personas', title: 'Personas', icon: Users },
  { id: 'mvp_features', title: 'MVP Features', icon: Layers },
  { id: 'launch', title: 'Launch Strategy', icon: Rocket },
];

const SYSTEM_PROMPT = `You are Bizactly's business intelligence engine. Your purpose is not to provide answers — it is to develop an increasingly accurate understanding of this business and use that understanding to help the founder make better decisions.

Every exchange must accomplish at least one of:
1. Improve understanding of the business (reduce a gap or sharpen a belief)
2. Increase confidence in something previously assumed
3. Surface and name an uncertainty that needs resolving
4. Produce a specific actionable output grounded in what you now understand

EPISTEMIC DISCIPLINE — THE CORE RULE:
Never treat a founder's statement as fact. Treat it as a claim with a confidence level.
- FACT: Something evidenced by data, testing, or external validation
- ASSUMPTION: Something stated but not yet tested
- UNKNOWN: A gap you've identified that materially affects the plan

When the founder says something, internally ask: "Is this a fact, an assumption, or does it reveal an unknown?"
Then respond in a way that either confirms it with evidence, tests it, or names the gap.

CONVERSATION GUIDE — 5 EPISTEMIC MILESTONES:
Each milestone is not a checkbox — it is a confidence threshold.

1. PROBLEM CLARITY
   Goal: Confirm the problem exists, is painful, and is widespread enough to build on.
   Fact threshold: The founder can name 3+ real people who have this problem and describe what they currently do instead.
   Key unknowns to surface: frequency, severity, willingness to pay, existing workarounds.

2. BUSINESS MODEL STRUCTURE
   Goal: Understand how value is created, captured, and delivered.
   Fact threshold: Revenue model is specific, not generic ("$29/month for teams of 5-15" not "subscription").
   Key unknowns: unit economics, customer acquisition cost, payback period.

3. CUSTOMER DEFINITION
   Goal: Know exactly who the early adopter is — not a demographic, a specific person type.
   Fact threshold: The founder can describe the exact moment this person feels the pain (the trigger).
   Key unknowns: decision-making process, budget authority, switching costs.

4. MVP SCOPE
   Goal: Identify the minimum surface area that would cause someone to pay or commit.
   Fact threshold: Each feature is tied to a specific user action, not a general capability.
   Key unknowns: what can be removed, what is actually differentiating.

5. GO-TO-MARKET REALITY CHECK
   Goal: Confirm the first 10 customers are reachable and the path is credible.
   Fact threshold: The founder can name a specific channel and explain why that audience will care.
   Key unknowns: channel cost, conversion assumptions, timeline credibility.

CONVERSATION STYLE:
- Lead with what you observe about their understanding, not a question
- When you spot an assumption, name it directly: "That's an assumption — here's what would confirm or kill it."
- When you identify an unknown, name it: "We don't know X yet, and that matters because Y."
- Ask ONE question at a time. Make it the question that most reduces uncertainty given what you know.
- Never ask a question just to seem engaged. Every question must change what you do next.
- When a milestone reaches fact threshold, name that clearly and move on.

COMPLETION:
When all 5 milestones reach fact threshold (or the founder has consciously accepted remaining assumptions as acceptable risk), output:
"COMPLETION_SIGNAL: We've built a grounded foundation for your startup plan. Here's what we know as fact, what we're betting on as assumptions, and what you'll need to validate next."`;

function buildProjectFromData(
  data: CompiledData,
  milestones: Set<string>,
  customTitle?: string,
  existingId?: string
): Partial<Project> {
  const title = customTitle || data.projectTitle || 'New Project';
  return {
    ...(existingId ? { id: existingId } : {}),
    title,
    description: data.ideaValidation?.idea || '',
    category: 'saas',
    problem_statement: data.ideaValidation?.problem,
    value_proposition: data.leanCanvas?.uniqueValue,
    business_model: data.leanCanvas?.revenueStreams?.join(', '),
    competitive_advantage: data.leanCanvas?.unfairAdvantage,
    target_users: data.personas?.[0] ? {
      primaryAudience: data.personas[0].name,
      demographics: data.personas[0].demographics,
      behaviors: data.personas[0].behaviors?.join(', '),
      painPoints: data.personas[0].painPoints,
    } : undefined,
    mvp_features_list: data.mvpFeatures?.map(f => ({
      ...f, userValue: '',
      estimatedTime: f.complexity === 'low' ? '1-2 weeks' : f.complexity === 'medium' ? '2-4 weeks' : '4-8 weeks',
    })),
    launch_roadmap: data.launchStrategy ? {
      preLaunch: { duration: '2-4 weeks', activities: data.launchStrategy.preLaunch, goals: ['Build MVP'] },
      launch: { duration: '1-2 weeks', activities: data.launchStrategy.launch, goals: ['Public launch'] },
      postLaunch: { duration: '4-8 weeks', activities: data.launchStrategy.postLaunch, goals: ['Iterate'] },
    } : undefined,
    tech_stack: { frontend: [], backend: [], database: [], hosting: [], authentication: [] },
    features: data.mvpFeatures || [],
    design_preferences: { style: 'modern', colorScheme: 'professional', layout: 'dashboard', responsive: true },
    status: 'planning',
    ai_suggestions: {},
    current_milestone: 'launch',
    milestones_completed: {
      idea_validation: { completed: milestones.has('idea_validation'), completedAt: new Date().toISOString() },
      market_research: { completed: milestones.has('idea_validation'), completedAt: new Date().toISOString() },
      lean_canvas: { completed: milestones.has('lean_canvas'), completedAt: new Date().toISOString() },
      mvp_plan: { completed: milestones.has('mvp_features'), completedAt: new Date().toISOString() },
      launch: { completed: milestones.has('launch'), completedAt: new Date().toISOString() },
    },
    progress_percentage: Math.round((milestones.size / MILESTONES.length) * 100),
    next_actions: ['Review your startup plan', 'Start building MVP'],
    updated_at: new Date().toISOString(),
  };
}

async function generateTitle(userMessage: string, aiResponse: string): Promise<string> {
  try {
    const raw = await chatWithAI(
      `Based on this first exchange with a startup founder, generate a short, specific project title (3-6 words, title case, no quotes).\n\nFounder: "${userMessage}"\nAdvisor: "${aiResponse}"\n\nReturn only the title, nothing else.`,
      'You are a naming assistant. Return only a short project title, nothing else.',
      50
    );
    const title = raw?.trim().replace(/^["']|["']$/g, '');
    return title && title.length > 0 && title.length < 80 ? title : 'New Startup Project';
  } catch {
    return 'New Startup Project';
  }
}

export const ConversationalProjectFlow: React.FC<ConversationalProjectFlowProps> = ({
  onComplete,
  onClose,
  onProjectSaved,
  initialProject,
}) => {
  const [messages, setMessages] = useState<Message[]>(() =>
    initialProject?.ai_memory?.conversationMessages?.length
      ? initialProject.ai_memory.conversationMessages.map((m: Message) => ({ ...m, timestamp: new Date(m.timestamp) }))
      : [{
          id: '1', role: 'assistant' as const,
          content: "Hey! I'm your startup advisor. Let's turn your idea into an actionable plan.\n\nWhat's your startup idea? Tell me what you're building and what problem it solves.",
          timestamp: new Date(),
        }]
  );
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [compiledData, setCompiledData] = useState<CompiledData>(
    initialProject?.ai_memory?.compiledData || {}
  );
  const [completedMilestones, setCompletedMilestones] = useState<Set<string>>(
    new Set(initialProject?.ai_memory?.completedMilestones || [])
  );
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string; content: string }>>(
    initialProject?.ai_memory?.conversationHistory || [{ role: 'system', content: SYSTEM_PROMPT }]
  );
  const [justCompletedMilestone, setJustCompletedMilestone] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [projectTitle, setProjectTitle] = useState<string>(initialProject?.title || '');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');

  // Ref so closures always see the latest saved project ID without stale captures
  const savedProjectIdRef = useRef<string | null>(initialProject?.id || null);
  const isSavingRef = useRef(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const saveProject = useCallback(async (
    data: CompiledData,
    milestones: Set<string>,
    msgs: Message[],
    history: Array<{ role: string; content: string }>,
    title: string
  ) => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    setSaveStatus('saving');

    try {
      const projectData = buildProjectFromData(data, milestones, title, savedProjectIdRef.current || undefined);
      projectData.ai_memory = {
        compiledData: data,
        completedMilestones: Array.from(milestones),
        conversationHistory: history,
        conversationMessages: msgs,
      };

      if (savedProjectIdRef.current) {
        await databaseService.updateProject(savedProjectIdRef.current, projectData);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        projectData.created_at = new Date().toISOString();
        const saved = await databaseService.createProject(projectData);
        if (saved?.id) {
          savedProjectIdRef.current = saved.id;
          onProjectSaved?.(saved);
        }
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    } catch (err) {
      console.error('Auto-save failed:', err);
      setSaveStatus('idle');
    } finally {
      isSavingRef.current = false;
    }
  }, [onProjectSaved]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    const isFirstUserMessage = !savedProjectIdRef.current && messages.filter(m => m.role === 'user').length === 0;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: userText, timestamp: new Date() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    const updatedHistory = [...conversationHistory, { role: 'user', content: userText }];

    try {
      const contextMessage = `
Current milestone progress:
${MILESTONES.map(m => `- ${m.title}: ${completedMilestones.has(m.id) ? '✓ Complete' : '○ Pending'}`).join('\n')}

Compiled data so far:
${JSON.stringify(compiledData, null, 2)}

Continue guiding them through the conversation naturally. Provide brief feedback first, then ask your next focused question.

IMPORTANT: If the user might benefit from examples, end your response with:
SUGGESTIONS: [option1] | [option2] | [option3]`;

      const conversationText = updatedHistory
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');

      let aiContent = await chatWithAI(
        `${conversationText}\n\n${contextMessage}`,
        updatedHistory[0]?.role === 'system' ? updatedHistory[0].content : '',
        800
      ) || "I'm here to help! Could you tell me more?";

      let suggestions: string[] = [];
      if (aiContent.includes('SUGGESTIONS:')) {
        const [main, sugPart] = aiContent.split('SUGGESTIONS:');
        aiContent = main.trim();
        suggestions = sugPart.trim().split('|').map(s => s.trim()).filter(Boolean);
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(), role: 'assistant',
        content: aiContent, timestamp: new Date(),
        suggestions: suggestions.length > 0 ? suggestions : undefined,
      };

      const finalMessages = [...newMessages, aiMessage];
      const finalHistory = [...updatedHistory, { role: 'assistant', content: aiContent }];

      setMessages(finalMessages);
      setConversationHistory(finalHistory);

      // On first exchange: generate a title, extract data, then save
      if (isFirstUserMessage) {
        const [generatedTitle, extractedData] = await Promise.all([
          generateTitle(userText, aiContent),
          extractData(userText, aiContent, compiledData),
        ]);

        const newTitle = generatedTitle;
        const newData = extractedData.data;
        const newMilestones = extractedData.milestones;

        setProjectTitle(newTitle);
        setCompiledData(newData);
        setCompletedMilestones(newMilestones);

        await saveProject(newData, newMilestones, finalMessages, finalHistory, newTitle);
      } else {
        // Subsequent messages: extract then update
        const extractedData = await extractData(userText, aiContent, compiledData);
        const newData = extractedData.data;
        const newMilestones = extractedData.milestones;

        if (extractedData.newMilestoneIds.length > 0) {
          setJustCompletedMilestone(extractedData.newMilestoneIds[0]);
          setTimeout(() => setJustCompletedMilestone(null), 3000);
        }

        setCompiledData(newData);
        setCompletedMilestones(newMilestones);

        await saveProject(newData, newMilestones, finalMessages, finalHistory, projectTitle);
      }

      if (aiContent.includes('COMPLETION_SIGNAL')) {
        setTimeout(() => handleComplete(compiledData, completedMilestones), 2000);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: 'assistant',
        content: "I apologize, but I'm having trouble connecting right now. Could you try again?",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Pure extraction — returns new state, does NOT call setters
  const extractData = async (
    userMessage: string,
    aiResponse: string,
    currentData: CompiledData
  ): Promise<{ data: CompiledData; milestones: Set<string>; newMilestoneIds: string[] }> => {
    const extractionPrompt = `Based on this conversation exchange, extract structured data for a startup plan.

User said: "${userMessage}"
AI responded: "${aiResponse}"

Current compiled data: ${JSON.stringify(currentData, null, 2)}

Extract and return ONLY a JSON object:
{
  "projectTitle": "string (startup name if clearly mentioned)",
  "ideaValidation": { "idea": "string", "problem": "string", "solution": "string", "targetMarket": "string" },
  "leanCanvas": { "uniqueValue": "string", "unfairAdvantage": "string", "keyMetrics": [], "channels": [], "costStructure": [], "revenueStreams": [] },
  "personas": [{ "name": "string", "demographics": "string", "goals": [], "painPoints": [], "behaviors": [] }],
  "mvpFeatures": [{ "name": "string", "description": "string", "priority": "must-have|nice-to-have|future", "complexity": "low|medium|high" }],
  "launchStrategy": { "preLaunch": [], "launch": [], "postLaunch": [], "timeline": "string" },
  "completedMilestones": ["array of completed milestone IDs: idea_validation, lean_canvas, personas, mvp_features, launch"]
}

Only include fields with new information. Return {} if nothing to extract. Return valid JSON only.`;

    try {
      const raw = await chatWithAI(extractionPrompt, 'You are a data extraction assistant. Return only valid JSON.', 800);
      const extracted = JSON.parse(raw || '{}');

      if (Object.keys(extracted).length === 0) {
        return { data: currentData, milestones: completedMilestones, newMilestoneIds: [] };
      }

      const newData: CompiledData = { ...currentData };
      if (extracted.projectTitle) newData.projectTitle = extracted.projectTitle;
      if (extracted.ideaValidation) newData.ideaValidation = { ...currentData.ideaValidation, ...extracted.ideaValidation };
      if (extracted.leanCanvas) newData.leanCanvas = { ...currentData.leanCanvas, ...extracted.leanCanvas };
      if (extracted.personas) newData.personas = extracted.personas;
      if (extracted.mvpFeatures) newData.mvpFeatures = extracted.mvpFeatures;
      if (extracted.launchStrategy) newData.launchStrategy = { ...currentData.launchStrategy, ...extracted.launchStrategy };

      const newMilestoneIds: string[] = extracted.completedMilestones?.filter(
        (m: string) => !completedMilestones.has(m)
      ) || [];
      const newMilestones = new Set([...completedMilestones, ...(extracted.completedMilestones || [])]);

      return { data: newData, milestones: newMilestones, newMilestoneIds };
    } catch {
      return { data: currentData, milestones: completedMilestones, newMilestoneIds: [] };
    }
  };

  const handleComplete = (data: CompiledData, milestones: Set<string>) => {
    const project = buildProjectFromData(data, milestones, projectTitle, savedProjectIdRef.current || undefined) as Project;
    if (savedProjectIdRef.current) project.id = savedProjectIdRef.current;
    onComplete(project);
  };

  const handleTitleSave = async () => {
    const trimmed = titleInput.trim();
    if (!trimmed) { setIsEditingTitle(false); return; }
    setProjectTitle(trimmed);
    setIsEditingTitle(false);
    // Persist the new title immediately
    if (savedProjectIdRef.current) {
      await databaseService.updateProject(savedProjectIdRef.current, { title: trimmed, updated_at: new Date().toISOString() });
      onProjectSaved?.({ id: savedProjectIdRef.current, title: trimmed } as Project);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleTitleSave();
    if (e.key === 'Escape') setIsEditingTitle(false);
  };

  const displayTitle = projectTitle || (savedProjectIdRef.current ? 'Untitled Project' : '');

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              {isEditingTitle ? (
                <div className="flex items-center space-x-2">
                  <input
                    ref={titleInputRef}
                    value={titleInput}
                    onChange={e => setTitleInput(e.target.value)}
                    onKeyDown={handleTitleKeyPress}
                    onBlur={handleTitleSave}
                    className="bg-gray-700 border border-blue-500 rounded-lg px-3 py-1 text-white text-base font-bold focus:outline-none w-64"
                    maxLength={80}
                  />
                  <button onClick={handleTitleSave} className="text-green-400 hover:text-green-300 transition-colors">
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button onClick={() => setIsEditingTitle(false)} className="text-gray-400 hover:text-gray-300 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2 group">
                  <h2 className="text-base font-bold text-white truncate">
                    {displayTitle || 'AI Startup Advisor'}
                  </h2>
                  {displayTitle && (
                    <button
                      onClick={() => { setTitleInput(displayTitle); setIsEditingTitle(true); }}
                      className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-300 transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
              <p className="text-xs text-gray-400">
                {!displayTitle
                  ? 'Your project will be saved automatically'
                  : saveStatus === 'saving' ? 'Saving…'
                  : saveStatus === 'saved' ? 'Saved'
                  : 'Auto-saved'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {saveStatus === 'saving' && <Loader className="w-3.5 h-3.5 text-gray-400 animate-spin" />}
            {saveStatus === 'saved' && <CheckCircle className="w-3.5 h-3.5 text-green-400" />}
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1.5">
              ✕
            </button>
          </div>
        </div>

        {/* Milestone Progress */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-0.5">
          {MILESTONES.map((milestone, index) => {
            const Icon = milestone.icon;
            const isCompleted = completedMilestones.has(milestone.id);
            const justCompleted = justCompletedMilestone === milestone.id;
            return (
              <React.Fragment key={milestone.id}>
                <div className="flex items-center space-x-1.5 flex-shrink-0">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    isCompleted ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'
                  } ${justCompleted ? 'animate-pulse ring-2 ring-green-400' : ''}`}>
                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                  </div>
                  <span className={`text-xs whitespace-nowrap ${isCompleted ? 'text-green-400' : 'text-gray-500'}`}>
                    {milestone.title}
                  </span>
                </div>
                {index < MILESTONES.length - 1 && (
                  <div className={`h-px w-5 flex-shrink-0 ${isCompleted ? 'bg-green-500' : 'bg-gray-700'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map(message => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-4 ${
              message.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'bg-gray-800 text-gray-100 border border-gray-700 rounded-bl-sm'
            }`}>
              {message.role === 'assistant' && (
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs font-medium text-blue-400">AI Advisor</span>
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>

              {message.suggestions && message.suggestions.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center space-x-1 text-xs text-blue-400">
                    <Lightbulb className="w-3 h-3" />
                    <span>Quick suggestions:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {message.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInput(suggestion)}
                        className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-full transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <span className="text-xs opacity-50 mt-2 block">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-bl-sm p-4">
              <div className="flex space-x-1">
                {[0, 150, 300].map(delay => (
                  <div key={delay} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <div className="flex items-end space-x-3">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your answer here…"
            rows={2}
            disabled={isLoading}
            className="flex-1 bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none disabled:opacity-50 text-sm"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-2">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
};
