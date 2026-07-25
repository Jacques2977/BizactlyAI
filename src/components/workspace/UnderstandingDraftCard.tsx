import React, { useState } from 'react';
import {
  Brain, ChevronDown, ChevronUp, CheckCircle2, HelpCircle, Lightbulb,
  TrendingUp, X, Target, Shield, AlertTriangle, Search, FlaskConical,
} from 'lucide-react';
import { UnderstandingDraft, BusinessMaturityStage } from '../../types/project';

interface UnderstandingDraftCardProps {
  draft: UnderstandingDraft;
  onDismiss: () => void;
}

const STAGE_LABELS: Record<BusinessMaturityStage, { label: string; color: string; bg: string }> = {
  exploration: { label: 'Exploring',  color: 'text-gray-400',    bg: 'bg-gray-700/60' },
  validation:  { label: 'Validating', color: 'text-blue-400',    bg: 'bg-blue-500/20' },
  planning:    { label: 'Planning',   color: 'text-purple-400',  bg: 'bg-purple-500/20' },
  building:    { label: 'Building',   color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  launch:      { label: 'Launching',  color: 'text-orange-400',  bg: 'bg-orange-500/20' },
  growth:      { label: 'Growing',    color: 'text-cyan-400',    bg: 'bg-cyan-500/20' },
};

const STAGE_ORDER: BusinessMaturityStage[] = ['exploration', 'validation', 'planning', 'building', 'launch', 'growth'];

export function UnderstandingDraftCard({ draft, onDismiss }: UnderstandingDraftCardProps) {
  const [expanded, setExpanded] = useState(true);

  const stage = draft.maturityStage ?? 'exploration';
  const stageConfig = STAGE_LABELS[stage];
  const stageIndex = STAGE_ORDER.indexOf(stage);

  const confidenceColor =
    draft.overallConfidence >= 75 ? 'text-emerald-400' :
    draft.overallConfidence >= 50 ? 'text-amber-400' :
    'text-blue-400';

  const confidenceBg =
    draft.overallConfidence >= 75 ? 'bg-emerald-500' :
    draft.overallConfidence >= 50 ? 'bg-amber-500' :
    'bg-blue-500';

  return (
    <div className="mx-2 my-3 rounded-xl border border-purple-500/30 bg-gradient-to-br from-gray-900 to-purple-950/20 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-purple-500/20">
        <div className="flex items-center gap-2.5">
          <div className="bg-purple-500/20 p-1.5 rounded-lg">
            <Brain className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white">Business Understanding</span>
              <span className="text-xs text-purple-400 font-mono bg-purple-500/10 px-1.5 py-0.5 rounded">
                v{draft.version}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${stageConfig.bg} ${stageConfig.color}`}>
                {stageConfig.label}
              </span>
            </div>
            {draft.highlights && draft.highlights.length > 0 && (
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {draft.highlights.map((h, i) => (
                  <span key={i} className="text-xs text-emerald-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {h}
                    {i < draft.highlights!.length - 1 && <span className="text-gray-600 mx-0.5">·</span>}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-gray-800/60 px-2.5 py-1 rounded-full border border-gray-700/60">
            <div className={`w-1.5 h-1.5 rounded-full ${confidenceBg}`} />
            <span className={`text-xs font-semibold ${confidenceColor}`}>{draft.overallConfidence}%</span>
          </div>
          <button onClick={() => setExpanded(!expanded)} className="text-gray-500 hover:text-gray-300 transition-colors p-1">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button onClick={onDismiss} className="text-gray-600 hover:text-gray-400 transition-colors p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 py-3 space-y-3">
          {/* Stage progress track */}
          <div className="flex items-center gap-1">
            {STAGE_ORDER.map((s, i) => {
              const cfg = STAGE_LABELS[s];
              const isActive = i === stageIndex;
              const isPast = i < stageIndex;
              return (
                <React.Fragment key={s}>
                  <div className="flex-1 text-center">
                    <div className={`h-1 rounded-full transition-all ${
                      isPast ? 'bg-purple-500' : isActive ? 'bg-purple-400' : 'bg-gray-700'
                    }`} />
                    {isActive && (
                      <span className={`text-[9px] mt-0.5 block ${cfg.color} font-medium`}>{cfg.label}</span>
                    )}
                  </div>
                  {i < STAGE_ORDER.length - 1 && <div className="w-0.5" />}
                </React.Fragment>
              );
            })}
          </div>

          {/* Confirmed facts */}
          {draft.facts.length > 0 && (
            <Section
              icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              title="Confirmed"
              titleColor="text-emerald-400"
              items={draft.facts}
              itemColor="text-gray-200"
              note="validated information"
            />
          )}

          {/* Current hypotheses */}
          {draft.assumptions.length > 0 && (
            <Section
              icon={<FlaskConical className="w-3.5 h-3.5 text-amber-400" />}
              title="Current Hypothesis"
              titleColor="text-amber-400"
              items={draft.assumptions}
              itemColor="text-gray-300"
              italic
              note="needs validation"
            />
          )}

          {/* Actively investigating */}
          {draft.unknowns.length > 0 && (
            <Section
              icon={<Search className="w-3.5 h-3.5 text-blue-400" />}
              title="Investigating"
              titleColor="text-blue-400"
              items={draft.unknowns}
              itemColor="text-gray-400"
              note="next questions"
            />
          )}

          {/* Goals / Constraints / Risks */}
          {(draft.goals?.length > 0 || draft.constraints?.length > 0 || draft.risks?.length > 0) && (
            <div className="grid grid-cols-1 gap-2 pt-1 border-t border-gray-800">
              {draft.goals?.length > 0 && (
                <Section
                  icon={<Target className="w-3.5 h-3.5 text-blue-400" />}
                  title="Goals"
                  titleColor="text-blue-400"
                  items={draft.goals}
                  itemColor="text-gray-300"
                  compact
                />
              )}
              {draft.constraints?.length > 0 && (
                <Section
                  icon={<Shield className="w-3.5 h-3.5 text-orange-400" />}
                  title="Constraints"
                  titleColor="text-orange-400"
                  items={draft.constraints}
                  itemColor="text-gray-300"
                  compact
                />
              )}
              {draft.risks?.length > 0 && (
                <Section
                  icon={<AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                  title="Evidence Needed"
                  titleColor="text-red-400"
                  items={draft.risks}
                  itemColor="text-gray-300"
                  compact
                />
              )}
            </div>
          )}

          {/* Understanding progress bar */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Understanding</span>
              <span className={`text-xs font-semibold ${confidenceColor}`}>{draft.overallConfidence}%</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${confidenceBg}`}
                style={{ width: `${draft.overallConfidence}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-gray-600">
            Updated {new Date(draft.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      )}
    </div>
  );
}

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  titleColor: string;
  items: string[];
  itemColor: string;
  italic?: boolean;
  compact?: boolean;
  note?: string;
}

function Section({ icon, title, titleColor, items, itemColor, italic, compact, note }: SectionProps) {
  return (
    <div>
      <div className={`flex items-center gap-1.5 mb-1 ${titleColor}`}>
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wide">{title}</span>
        {note && <span className="text-[10px] text-gray-600 normal-case font-normal">— {note}</span>}
      </div>
      <ul className={`${compact ? 'space-y-0.5' : 'space-y-1'} pl-1`}>
        {items.map((item, i) => (
          <li key={i} className={`text-xs ${itemColor} flex items-start gap-1.5 ${italic ? 'italic' : ''}`}>
            <span className="text-gray-600 mt-0.5 flex-shrink-0">–</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
