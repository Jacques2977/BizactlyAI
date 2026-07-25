import React, { useState } from 'react';
import { CheckCircle, Circle, ArrowRight, Sparkles, Target, Users, Layers, Rocket, TrendingUp } from 'lucide-react';
import { Project, MilestoneType } from '../types/project';

interface GuidedProjectFlowProps {
  onComplete: (projectData: Project) => void;
  onClose: () => void;
}

interface StepData {
  ideaValidation?: {
    idea: string;
    problem: string;
    solution: string;
    targetMarket: string;
  };
  leanCanvas?: {
    problem: string[];
    solution: string[];
    uniqueValue: string;
    unfairAdvantage: string;
    customerSegments: string[];
    keyMetrics: string[];
    channels: string[];
    costStructure: string[];
    revenueStreams: string[];
  };
  personas?: {
    name: string;
    demographics: string;
    goals: string[];
    painPoints: string[];
    behaviors: string[];
  }[];
  mvpFeatures?: {
    name: string;
    description: string;
    priority: 'must-have' | 'nice-to-have' | 'future';
    complexity: 'low' | 'medium' | 'high';
  }[];
  launchStrategy?: {
    preLaunch: string[];
    launch: string[];
    postLaunch: string[];
    timeline: string;
  };
}

const STEPS = [
  {
    id: 'idea_validation' as MilestoneType,
    title: 'Idea Validation',
    icon: Sparkles,
    color: 'from-blue-500 to-blue-600',
    description: 'Let\'s validate your startup idea'
  },
  {
    id: 'lean_canvas' as MilestoneType,
    title: 'Lean Canvas',
    icon: Target,
    color: 'from-purple-500 to-purple-600',
    description: 'Build your business model'
  },
  {
    id: 'personas' as MilestoneType,
    title: 'Persona Creation',
    icon: Users,
    color: 'from-pink-500 to-pink-600',
    description: 'Define your target customers'
  },
  {
    id: 'mvp_features' as MilestoneType,
    title: 'MVP Feature List',
    icon: Layers,
    color: 'from-indigo-500 to-indigo-600',
    description: 'Plan your minimum viable product'
  },
  {
    id: 'launch' as MilestoneType,
    title: 'Launch Strategy',
    icon: Rocket,
    color: 'from-green-500 to-green-600',
    description: 'Create your go-to-market plan'
  }
];

export const GuidedProjectFlow: React.FC<GuidedProjectFlowProps> = ({ onComplete, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stepData, setStepData] = useState<StepData>({});
  const [projectTitle, setProjectTitle] = useState('');

  const currentStepInfo = STEPS[currentStep];

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsProcessing(true);

    // Compile all data into a project
    const project: Partial<Project> = {
      id: Date.now().toString(),
      title: projectTitle || 'My Startup Project',
      description: stepData.ideaValidation?.idea || '',
      category: 'saas',
      problem_statement: stepData.ideaValidation?.problem,
      value_proposition: stepData.leanCanvas?.uniqueValue,
      business_model: stepData.leanCanvas?.revenueStreams?.join(', '),
      competitive_advantage: stepData.leanCanvas?.unfairAdvantage,
      target_users: {
        primaryAudience: stepData.personas?.[0]?.name,
        demographics: stepData.personas?.[0]?.demographics,
        behaviors: stepData.personas?.[0]?.behaviors?.join(', '),
        painPoints: stepData.personas?.[0]?.painPoints,
      },
      mvp_features_list: stepData.mvpFeatures?.map(f => ({
        ...f,
        userValue: '',
        estimatedTime: f.complexity === 'low' ? '1-2 weeks' : f.complexity === 'medium' ? '2-4 weeks' : '4-8 weeks'
      })),
      launch_roadmap: {
        preLaunch: {
          duration: '2-4 weeks',
          activities: stepData.launchStrategy?.preLaunch,
          goals: ['Build MVP', 'Create marketing materials']
        },
        launch: {
          duration: '1-2 weeks',
          activities: stepData.launchStrategy?.launch,
          goals: ['Public launch', 'Get first customers']
        },
        postLaunch: {
          duration: '4-8 weeks',
          activities: stepData.launchStrategy?.postLaunch,
          goals: ['Iterate based on feedback', 'Scale marketing']
        }
      },
      tech_stack: {
        frontend: [],
        backend: [],
        database: [],
        hosting: [],
        authentication: []
      },
      features: stepData.mvpFeatures || [],
      design_preferences: {
        style: 'modern',
        colorScheme: 'professional',
        layout: 'dashboard',
        responsive: true
      },
      status: 'planning',
      ai_suggestions: {},
      current_milestone: 'launch',
      milestones_completed: {
        idea_validation: { completed: true, completedAt: new Date().toISOString() },
        market_research: { completed: true, completedAt: new Date().toISOString() },
        lean_canvas: { completed: true, completedAt: new Date().toISOString() },
        mvp_plan: { completed: true, completedAt: new Date().toISOString() },
        launch: { completed: true, completedAt: new Date().toISOString() }
      },
      progress_percentage: 100,
      next_actions: ['Start building MVP', 'Set up development environment'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setTimeout(() => {
      onComplete(project as Project);
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Create Your Startup</h2>
            <p className="text-gray-400 mt-1">Follow the guided process to build your startup foundation</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;

            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isCurrent
                        ? `bg-gradient-to-r ${step.color} text-white shadow-lg`
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  <div className="text-xs text-center">
                    <div className={`font-medium ${isCurrent ? 'text-white' : 'text-gray-400'}`}>
                      {step.title}
                    </div>
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 rounded transition-all ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-700'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {currentStep === 0 && (
          <IdeaValidationStep
            data={stepData.ideaValidation}
            onUpdate={(data) => setStepData({ ...stepData, ideaValidation: data })}
            onTitleChange={setProjectTitle}
          />
        )}
        {currentStep === 1 && (
          <LeanCanvasStep
            data={stepData.leanCanvas}
            onUpdate={(data) => setStepData({ ...stepData, leanCanvas: data })}
            ideaData={stepData.ideaValidation}
          />
        )}
        {currentStep === 2 && (
          <PersonaStep
            data={stepData.personas}
            onUpdate={(data) => setStepData({ ...stepData, personas: data })}
          />
        )}
        {currentStep === 3 && (
          <MVPFeaturesStep
            data={stepData.mvpFeatures}
            onUpdate={(data) => setStepData({ ...stepData, mvpFeatures: data })}
          />
        )}
        {currentStep === 4 && (
          <LaunchStrategyStep
            data={stepData.launchStrategy}
            onUpdate={(data) => setStepData({ ...stepData, launchStrategy: data })}
          />
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-800 border-t border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
            disabled={currentStep === 0}
            className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <div className="text-sm text-gray-400">
            Step {currentStep + 1} of {STEPS.length}
          </div>
          <button
            onClick={handleNext}
            disabled={isProcessing}
            className={`px-6 py-2 bg-gradient-to-r ${currentStepInfo.color} text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2`}
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{currentStep === STEPS.length - 1 ? 'Complete' : 'Next'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Step Components
const IdeaValidationStep: React.FC<{
  data?: StepData['ideaValidation'];
  onUpdate: (data: StepData['ideaValidation']) => void;
  onTitleChange: (title: string) => void;
}> = ({ data, onUpdate, onTitleChange }) => {
  const [localData, setLocalData] = useState(data || {
    idea: '',
    problem: '',
    solution: '',
    targetMarket: ''
  });

  const handleChange = (field: keyof NonNullable<StepData['ideaValidation']>, value: string) => {
    const newData = { ...localData, [field]: value };
    setLocalData(newData);
    onUpdate(newData);
    if (field === 'idea') {
      onTitleChange(value);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <Sparkles className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Let's validate your idea</h3>
            <p className="text-gray-300 text-sm">
              Tell us about your startup idea. Be specific about the problem you're solving and who you're helping.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            What's your startup idea? *
          </label>
          <input
            type="text"
            value={localData.idea}
            onChange={(e) => handleChange('idea', e.target.value)}
            placeholder="e.g., AI-powered project management tool for remote teams"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            What problem are you solving? *
          </label>
          <textarea
            value={localData.problem}
            onChange={(e) => handleChange('problem', e.target.value)}
            placeholder="Describe the pain point your customers experience..."
            rows={4}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            How does your solution work? *
          </label>
          <textarea
            value={localData.solution}
            onChange={(e) => handleChange('solution', e.target.value)}
            placeholder="Explain how your product solves the problem..."
            rows={4}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Who is your target market? *
          </label>
          <input
            type="text"
            value={localData.targetMarket}
            onChange={(e) => handleChange('targetMarket', e.target.value)}
            placeholder="e.g., Small business owners, remote teams, freelancers"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>
    </div>
  );
};

const LeanCanvasStep: React.FC<{
  data?: StepData['leanCanvas'];
  onUpdate: (data: StepData['leanCanvas']) => void;
  ideaData?: StepData['ideaValidation'];
}> = ({ data, onUpdate, ideaData }) => {
  const [localData, setLocalData] = useState(data || {
    problem: [ideaData?.problem || ''],
    solution: [ideaData?.solution || ''],
    uniqueValue: '',
    unfairAdvantage: '',
    customerSegments: [ideaData?.targetMarket || ''],
    keyMetrics: [],
    channels: [],
    costStructure: [],
    revenueStreams: []
  });

  const handleChange = (field: keyof NonNullable<StepData['leanCanvas']>, value: any) => {
    const newData = { ...localData, [field]: value };
    setLocalData(newData);
    onUpdate(newData);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <Target className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Build your Lean Canvas</h3>
            <p className="text-gray-300 text-sm">
              Define your business model with key elements of your startup.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Unique Value Proposition *
          </label>
          <textarea
            value={localData.uniqueValue}
            onChange={(e) => handleChange('uniqueValue', e.target.value)}
            placeholder="What makes you different?"
            rows={3}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Unfair Advantage *
          </label>
          <textarea
            value={localData.unfairAdvantage}
            onChange={(e) => handleChange('unfairAdvantage', e.target.value)}
            placeholder="What can't be easily copied?"
            rows={3}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Key Metrics *
          </label>
          <input
            type="text"
            value={localData.keyMetrics.join(', ')}
            onChange={(e) => handleChange('keyMetrics', e.target.value.split(',').map(s => s.trim()))}
            placeholder="MRR, Active Users, Churn Rate"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Channels *
          </label>
          <input
            type="text"
            value={localData.channels.join(', ')}
            onChange={(e) => handleChange('channels', e.target.value.split(',').map(s => s.trim()))}
            placeholder="Social Media, Content Marketing, SEO"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Cost Structure *
          </label>
          <input
            type="text"
            value={localData.costStructure.join(', ')}
            onChange={(e) => handleChange('costStructure', e.target.value.split(',').map(s => s.trim()))}
            placeholder="Development, Marketing, Hosting"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Revenue Streams *
          </label>
          <input
            type="text"
            value={localData.revenueStreams.join(', ')}
            onChange={(e) => handleChange('revenueStreams', e.target.value.split(',').map(s => s.trim()))}
            placeholder="Subscriptions, Usage-based, Freemium"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
      </div>
    </div>
  );
};

const PersonaStep: React.FC<{
  data?: StepData['personas'];
  onUpdate: (data: StepData['personas']) => void;
}> = ({ data, onUpdate }) => {
  const [personas, setPersonas] = useState<NonNullable<StepData['personas']>>(data || [{
    name: '',
    demographics: '',
    goals: [],
    painPoints: [],
    behaviors: []
  }]);

  const updatePersona = (index: number, field: string, value: any) => {
    const newPersonas = [...personas];
    newPersonas[index] = { ...newPersonas[index], [field]: value };
    setPersonas(newPersonas);
    onUpdate(newPersonas);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <Users className="w-6 h-6 text-pink-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Define your customer personas</h3>
            <p className="text-gray-300 text-sm">
              Create detailed profiles of your ideal customers.
            </p>
          </div>
        </div>
      </div>

      {personas.map((persona, index) => (
        <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Persona Name *
            </label>
            <input
              type="text"
              value={persona.name}
              onChange={(e) => updatePersona(index, 'name', e.target.value)}
              placeholder="e.g., Startup Sarah, Freelance Frank"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Demographics *
            </label>
            <input
              type="text"
              value={persona.demographics}
              onChange={(e) => updatePersona(index, 'demographics', e.target.value)}
              placeholder="Age, Location, Role, Company Size"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Goals (comma-separated) *
            </label>
            <input
              type="text"
              value={persona.goals.join(', ')}
              onChange={(e) => updatePersona(index, 'goals', e.target.value.split(',').map(s => s.trim()))}
              placeholder="Increase productivity, Save time, Reduce costs"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Pain Points (comma-separated) *
            </label>
            <input
              type="text"
              value={persona.painPoints.join(', ')}
              onChange={(e) => updatePersona(index, 'painPoints', e.target.value.split(',').map(s => s.trim()))}
              placeholder="Manual processes, Lack of visibility, Too expensive"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Behaviors (comma-separated) *
            </label>
            <input
              type="text"
              value={persona.behaviors.join(', ')}
              onChange={(e) => updatePersona(index, 'behaviors', e.target.value.split(',').map(s => s.trim()))}
              placeholder="Early adopter, Budget conscious, Researches extensively"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 transition-colors"
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const MVPFeaturesStep: React.FC<{
  data?: StepData['mvpFeatures'];
  onUpdate: (data: StepData['mvpFeatures']) => void;
}> = ({ data, onUpdate }) => {
  const [features, setFeatures] = useState<NonNullable<StepData['mvpFeatures']>>(data || [
    { name: '', description: '', priority: 'must-have', complexity: 'medium' }
  ]);

  const addFeature = () => {
    const newFeatures = [...features, { name: '', description: '', priority: 'must-have' as const, complexity: 'medium' as const }];
    setFeatures(newFeatures);
    onUpdate(newFeatures);
  };

  const updateFeature = (index: number, field: string, value: any) => {
    const newFeatures = [...features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setFeatures(newFeatures);
    onUpdate(newFeatures);
  };

  const removeFeature = (index: number) => {
    const newFeatures = features.filter((_, i) => i !== index);
    setFeatures(newFeatures);
    onUpdate(newFeatures);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-indigo-500/10 to-blue-500/10 border border-indigo-500/20 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <Layers className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Plan your MVP features</h3>
            <p className="text-gray-300 text-sm">
              List the essential features for your minimum viable product.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {features.map((feature, index) => (
          <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                <input
                  type="text"
                  value={feature.name}
                  onChange={(e) => updateFeature(index, 'name', e.target.value)}
                  placeholder="Feature name"
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <textarea
                  value={feature.description}
                  onChange={(e) => updateFeature(index, 'description', e.target.value)}
                  placeholder="Feature description"
                  rows={2}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                />
                <div className="flex space-x-3">
                  <select
                    value={feature.priority}
                    onChange={(e) => updateFeature(index, 'priority', e.target.value)}
                    className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="must-have">Must Have</option>
                    <option value="nice-to-have">Nice to Have</option>
                    <option value="future">Future</option>
                  </select>
                  <select
                    value={feature.complexity}
                    onChange={(e) => updateFeature(index, 'complexity', e.target.value)}
                    className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="low">Low Complexity</option>
                    <option value="medium">Medium Complexity</option>
                    <option value="high">High Complexity</option>
                  </select>
                </div>
              </div>
              <button
                onClick={() => removeFeature(index)}
                className="ml-3 text-red-400 hover:text-red-300 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addFeature}
        className="w-full bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg px-4 py-3 text-gray-400 hover:text-white hover:border-indigo-500 transition-colors"
      >
        + Add Feature
      </button>
    </div>
  );
};

const LaunchStrategyStep: React.FC<{
  data?: StepData['launchStrategy'];
  onUpdate: (data: StepData['launchStrategy']) => void;
}> = ({ data, onUpdate }) => {
  const [localData, setLocalData] = useState(data || {
    preLaunch: [],
    launch: [],
    postLaunch: [],
    timeline: ''
  });

  const handleChange = (field: keyof NonNullable<StepData['launchStrategy']>, value: any) => {
    const newData = { ...localData, [field]: value };
    setLocalData(newData);
    onUpdate(newData);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <Rocket className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Create your launch strategy</h3>
            <p className="text-gray-300 text-sm">
              Plan your go-to-market activities before, during, and after launch.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Pre-Launch Activities (comma-separated) *
          </label>
          <textarea
            value={localData.preLaunch.join(', ')}
            onChange={(e) => handleChange('preLaunch', e.target.value.split(',').map(s => s.trim()))}
            placeholder="Build landing page, Create email list, Develop MVP"
            rows={3}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Launch Activities (comma-separated) *
          </label>
          <textarea
            value={localData.launch.join(', ')}
            onChange={(e) => handleChange('launch', e.target.value.split(',').map(s => s.trim()))}
            placeholder="Product Hunt launch, Social media campaign, Email announcement"
            rows={3}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Post-Launch Activities (comma-separated) *
          </label>
          <textarea
            value={localData.postLaunch.join(', ')}
            onChange={(e) => handleChange('postLaunch', e.target.value.split(',').map(s => s.trim()))}
            placeholder="Gather feedback, Iterate features, Scale marketing"
            rows={3}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Overall Timeline *
          </label>
          <input
            type="text"
            value={localData.timeline}
            onChange={(e) => handleChange('timeline', e.target.value)}
            placeholder="e.g., 3 months to launch"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
          />
        </div>
      </div>
    </div>
  );
};
