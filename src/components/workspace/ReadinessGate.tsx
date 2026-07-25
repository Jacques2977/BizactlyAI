import React from 'react';
import { Search, Target, Zap, Brain, FlaskConical, ArrowRight } from 'lucide-react';
import { AILayer } from '../../types/project';

interface ReadinessGateProps {
  requestedLayer: AILayer;
  gaps: string[];
  blockers: string[];
}

const LAYER_STYLES: Record<AILayer, {
  label: string;
  icon: React.ReactNode;
  border: string;
  headerBg: string;
  badgeBg: string;
  badgeText: string;
  evidenceBg: string;
  resolutionBg: string;
}> = {
  discovery: {
    label: 'Discovery',
    icon: <Search className="w-4 h-4 text-blue-400" />,
    border: 'border-blue-500/30',
    headerBg: 'bg-blue-500/10',
    badgeBg: 'bg-blue-500/10',
    badgeText: 'text-blue-300',
    evidenceBg: 'bg-blue-500/5 border-blue-500/20',
    resolutionBg: 'bg-amber-500/5 border-amber-500/20',
  },
  understanding: {
    label: 'Understanding',
    icon: <Brain className="w-4 h-4 text-purple-400" />,
    border: 'border-purple-500/30',
    headerBg: 'bg-purple-500/10',
    badgeBg: 'bg-purple-500/10',
    badgeText: 'text-purple-300',
    evidenceBg: 'bg-purple-500/5 border-purple-500/20',
    resolutionBg: 'bg-amber-500/5 border-amber-500/20',
  },
  strategy: {
    label: 'Strategy',
    icon: <Target className="w-4 h-4 text-emerald-400" />,
    border: 'border-emerald-500/30',
    headerBg: 'bg-emerald-500/10',
    badgeBg: 'bg-emerald-500/10',
    badgeText: 'text-emerald-300',
    evidenceBg: 'bg-emerald-500/5 border-emerald-500/20',
    resolutionBg: 'bg-amber-500/5 border-amber-500/20',
  },
  execution: {
    label: 'Execution',
    icon: <Zap className="w-4 h-4 text-orange-400" />,
    border: 'border-orange-500/30',
    headerBg: 'bg-orange-500/10',
    badgeBg: 'bg-orange-500/10',
    badgeText: 'text-orange-300',
    evidenceBg: 'bg-orange-500/5 border-orange-500/20',
    resolutionBg: 'bg-amber-500/5 border-amber-500/20',
  },
};

export function ReadinessGate({ requestedLayer, gaps, blockers }: ReadinessGateProps) {
  const style = LAYER_STYLES[requestedLayer];
  const total = gaps.length + blockers.length;

  return (
    <div className={`mx-2 my-2 rounded-xl border ${style.border} bg-gray-900/80 overflow-hidden`}>
      {/* Header */}
      <div className={`flex items-center gap-2.5 px-4 py-3 ${style.headerBg} border-b ${style.border}`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
              {style.icon}
              <span className="text-xs font-semibold text-white">{style.label}</span>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${style.badgeBg} ${style.badgeText}`}>
              {total} area{total !== 1 ? 's' : ''} to explore
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Each question answered brings {style.label.toLowerCase()} closer
          </p>
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Needs Resolution — conflicting signals */}
        {blockers.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <FlaskConical className="w-3 h-3 text-amber-400" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                Needs Resolution
              </p>
            </div>
            <div className="space-y-1.5">
              {blockers.map((blocker, i) => (
                <div key={i} className={`flex items-start gap-2.5 border rounded-lg px-3 py-2 ${style.resolutionBg}`}>
                  <span className="text-xs text-amber-300/70 flex-shrink-0 mt-0.5 font-mono">!</span>
                  <span className="text-xs text-gray-300">{blocker}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evidence Needed — information gaps */}
        {gaps.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Search className="w-3 h-3 text-gray-400" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                Evidence Needed
              </p>
            </div>
            <div className="space-y-1.5">
              {gaps.map((gap, i) => (
                <div key={i} className={`flex items-start gap-2.5 border rounded-lg px-3 py-2 ${style.evidenceBg}`}>
                  <span className={`text-xs font-bold flex-shrink-0 mt-0.5 ${style.badgeText}`}>
                    {i + 1}
                  </span>
                  <span className="text-xs text-gray-300">{gap}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
