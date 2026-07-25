import React, { useState } from 'react';
import { Zap, ChevronDown, ChevronUp, CheckSquare, Calendar, Code, Megaphone } from 'lucide-react';
import { ExecutionOutput, MVPFeatureSpec } from '../../types/project';

interface ExecutionOutputCardProps {
  execution: ExecutionOutput;
}

type Tab = 'mvp' | 'roadmap' | 'sprints' | 'marketing';

const EFFORT_COLOR: Record<string, string> = {
  low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const PRIORITY_COLOR: Record<string, string> = {
  must: 'bg-red-500/20 text-red-400',
  should: 'bg-amber-500/20 text-amber-400',
  could: 'bg-gray-700 text-gray-400',
};

const TASK_TYPE_ICON: Record<string, React.ReactNode> = {
  dev: <Code className="w-3 h-3" />,
  design: <Zap className="w-3 h-3" />,
  marketing: <Megaphone className="w-3 h-3" />,
  research: <CheckSquare className="w-3 h-3" />,
};

export function ExecutionOutputCard({ execution }: ExecutionOutputCardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('mvp');
  const [expanded, setExpanded] = useState(true);

  const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode; available: boolean }> = [
    { id: 'mvp', label: 'MVP', icon: <Zap className="w-3.5 h-3.5" />, available: !!execution.mvp },
    { id: 'roadmap', label: 'Roadmap', icon: <Calendar className="w-3.5 h-3.5" />, available: !!(execution.roadmap?.length) },
    { id: 'sprints', label: 'Sprints', icon: <CheckSquare className="w-3.5 h-3.5" />, available: !!(execution.sprint_plan?.length) },
    { id: 'marketing', label: 'Marketing', icon: <Megaphone className="w-3.5 h-3.5" />, available: !!(execution.marketing_checklist?.length) },
  ].filter(t => t.available);

  return (
    <div className="mx-2 my-3 rounded-xl border border-orange-500/30 bg-gradient-to-br from-gray-900 to-orange-950/20 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-orange-500/20">
        <div className="flex items-center gap-2.5">
          <div className="bg-orange-500/20 p-1.5 rounded-lg">
            <Zap className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Execution Plan</span>
              <span className="text-xs text-orange-400 font-mono bg-orange-500/10 px-1.5 py-0.5 rounded">
                v{execution.version}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Generated {new Date(execution.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-gray-500 hover:text-gray-300 transition-colors p-1">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <>
          {/* MVP goal highlight */}
          {execution.mvp?.goal && (
            <div className="mx-4 mt-3 px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <p className="text-xs text-orange-300 font-medium mb-0.5">MVP Goal</p>
              <p className="text-xs text-gray-200">{execution.mvp.goal}</p>
              {execution.mvp.success_metric && (
                <p className="text-xs text-gray-500 mt-1">Success: {execution.mvp.success_metric}</p>
              )}
            </div>
          )}

          {/* Tabs */}
          {tabs.length > 1 && (
            <div className="flex gap-1 px-4 pt-3 flex-wrap">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          <div className="px-4 pb-4 pt-3 space-y-3">
            {activeTab === 'mvp' && execution.mvp && (
              <MVPView features={execution.mvp.features} spec={execution.mvp} />
            )}
            {activeTab === 'roadmap' && execution.roadmap?.length && (
              <RoadmapView phases={execution.roadmap} />
            )}
            {activeTab === 'sprints' && execution.sprint_plan?.length && (
              <SprintsView sprints={execution.sprint_plan} />
            )}
            {activeTab === 'marketing' && execution.marketing_checklist?.length && (
              <MarketingView checklist={execution.marketing_checklist} />
            )}

            {/* Technical spec always shown when on mvp tab */}
            {activeTab === 'mvp' && execution.technical_specification && (
              <div className="pt-2 border-t border-gray-800">
                <p className="text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-blue-400" />
                  Technical Notes
                </p>
                <p className="text-xs text-gray-400">{execution.technical_specification}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function MVPView({ features, spec }: { features: MVPFeatureSpec[]; spec: ExecutionOutput['mvp'] }) {
  const must = features.filter(f => f.priority === 'must');
  const should = features.filter(f => f.priority === 'should');
  const could = features.filter(f => f.priority === 'could');

  return (
    <div className="space-y-3">
      {[{ label: 'Must Have', items: must }, { label: 'Should Have', items: should }, { label: 'Could Have', items: could }]
        .filter(g => g.items.length > 0)
        .map(({ label, items }) => (
          <div key={label}>
            <p className="text-xs font-semibold text-gray-400 mb-1.5">{label}</p>
            <div className="space-y-1.5">
              {items.map((f, i) => (
                <div key={i} className="bg-gray-800/60 rounded-lg px-3 py-2 flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-white">{f.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded text-[10px] font-medium ${PRIORITY_COLOR[f.priority]}`}>
                        {f.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{f.description}</p>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${EFFORT_COLOR[f.effort]} flex-shrink-0 capitalize`}>
                    {f.effort}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

function RoadmapView({ phases }: { phases: NonNullable<ExecutionOutput['roadmap']> }) {
  return (
    <div className="space-y-3">
      {phases.map((phase, i) => (
        <div key={i} className="relative pl-6">
          <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-orange-500 bg-gray-900 flex items-center justify-center">
            <span className="text-[9px] text-orange-400 font-bold">{i + 1}</span>
          </div>
          {i < phases.length - 1 && (
            <div className="absolute left-[7px] top-5 bottom-0 w-0.5 bg-orange-500/20" />
          )}
          <div className="bg-gray-800/60 rounded-lg p-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-xs font-semibold text-white">{phase.phase}</p>
              <span className="text-xs text-orange-400 whitespace-nowrap">{phase.duration}</span>
            </div>
            <ul className="space-y-1 mb-2">
              {phase.goals.map((g, j) => (
                <li key={j} className="text-xs text-gray-300 flex items-start gap-1.5">
                  <span className="text-orange-500 mt-0.5 flex-shrink-0">›</span>
                  {g}
                </li>
              ))}
            </ul>
            {phase.features?.length && (
              <div className="flex flex-wrap gap-1 mt-2">
                {phase.features.map((f, j) => (
                  <span key={j} className="text-[10px] bg-gray-700 text-gray-400 px-2 py-0.5 rounded">
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function SprintsView({ sprints }: { sprints: NonNullable<ExecutionOutput['sprint_plan']> }) {
  const [openSprint, setOpenSprint] = useState<number>(0);

  return (
    <div className="space-y-2">
      {sprints.map((sprint, i) => (
        <div key={i} className="bg-gray-800/60 rounded-lg overflow-hidden">
          <button
            onClick={() => setOpenSprint(openSprint === i ? -1 : i)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white">Sprint {sprint.sprint}</span>
              <span className="text-xs text-gray-500">· {sprint.duration}</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${openSprint === i ? 'rotate-180' : ''}`} />
          </button>
          {openSprint === i && (
            <div className="px-3 pb-3 border-t border-gray-700">
              <p className="text-xs text-orange-300 py-2 font-medium">{sprint.goal}</p>
              <div className="space-y-1.5">
                {sprint.tasks.map((task, j) => (
                  <div key={j} className="flex items-start gap-2">
                    <span className="text-gray-500 mt-0.5 flex-shrink-0">
                      {TASK_TYPE_ICON[task.type] || <CheckSquare className="w-3 h-3" />}
                    </span>
                    <span className="text-xs text-gray-300 flex-1">{task.task}</span>
                    {task.effort && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border capitalize flex-shrink-0 ${EFFORT_COLOR[task.effort]}`}>
                        {task.effort}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function MarketingView({ checklist }: { checklist: string[] }) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    const next = new Set(checked);
    if (next.has(i)) next.delete(i); else next.add(i);
    setChecked(next);
  };

  return (
    <div className="space-y-1.5">
      {checklist.map((item, i) => (
        <button
          key={i}
          onClick={() => toggle(i)}
          className="w-full flex items-start gap-2.5 text-left px-2 py-1.5 rounded-lg hover:bg-gray-800/40 transition-colors"
        >
          <div className={`w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
            checked.has(i) ? 'bg-orange-500 border-orange-500' : 'border-gray-600'
          }`}>
            {checked.has(i) && <CheckSquare className="w-3 h-3 text-white" />}
          </div>
          <span className={`text-xs transition-colors ${checked.has(i) ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
            {item}
          </span>
        </button>
      ))}
      {checked.size > 0 && (
        <p className="text-xs text-gray-600 text-right">{checked.size}/{checklist.length} completed</p>
      )}
    </div>
  );
}
