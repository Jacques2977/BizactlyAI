import React, { useState } from 'react';
import { Target, DollarSign, Users, TrendingUp, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, Lightbulb, Map } from 'lucide-react';
import { StrategyOutput } from '../../types/project';

interface StrategyOutputCardProps {
  strategy: StrategyOutput;
}

type Tab = 'canvas' | 'pricing' | 'acquisition' | 'validation';

export function StrategyOutputCard({ strategy }: StrategyOutputCardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('canvas');
  const [expanded, setExpanded] = useState(true);

  const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode; available: boolean }> = [
    { id: 'canvas', label: 'Lean Canvas', icon: <Map className="w-3.5 h-3.5" />, available: !!strategy.lean_canvas },
    { id: 'pricing', label: 'Pricing', icon: <DollarSign className="w-3.5 h-3.5" />, available: !!strategy.pricing },
    { id: 'acquisition', label: 'Acquisition', icon: <Users className="w-3.5 h-3.5" />, available: !!strategy.customer_acquisition },
    { id: 'validation', label: 'Validation', icon: <CheckCircle className="w-3.5 h-3.5" />, available: !!(strategy.validation_plans?.length) },
  ].filter(t => t.available);

  return (
    <div className="mx-2 my-3 rounded-xl border border-emerald-500/30 bg-gradient-to-br from-gray-900 to-emerald-950/30 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-emerald-500/20">
        <div className="flex items-center gap-2.5">
          <div className="bg-emerald-500/20 p-1.5 rounded-lg">
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Strategic Framework</span>
              <span className="text-xs text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded">
                v{strategy.version}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Generated {new Date(strategy.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-gray-500 hover:text-gray-300 transition-colors p-1">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <>
          {/* Positioning highlight */}
          {strategy.positioning && (
            <div className="mx-4 mt-3 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <p className="text-xs text-emerald-300 font-medium mb-0.5">Positioning</p>
              <p className="text-xs text-gray-200 italic">{strategy.positioning}</p>
            </div>
          )}

          {/* Tabs */}
          {tabs.length > 1 && (
            <div className="flex gap-1 px-4 pt-3">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
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
            {/* Lean Canvas */}
            {(activeTab === 'canvas' || tabs.length === 1) && strategy.lean_canvas && (
              <LeanCanvasView canvas={strategy.lean_canvas} />
            )}

            {/* Pricing */}
            {activeTab === 'pricing' && strategy.pricing && (
              <PricingView pricing={strategy.pricing} />
            )}

            {/* Customer Acquisition */}
            {activeTab === 'acquisition' && strategy.customer_acquisition && (
              <AcquisitionView acquisition={strategy.customer_acquisition} />
            )}

            {/* Validation plans */}
            {activeTab === 'validation' && strategy.validation_plans?.length && (
              <ValidationView plans={strategy.validation_plans} />
            )}

            {/* Recommendations always shown */}
            {strategy.recommendations?.length && (
              <div className="pt-2 border-t border-gray-800">
                <p className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  Recommendations
                </p>
                <ul className="space-y-1">
                  {strategy.recommendations.map((r, i) => (
                    <li key={i} className="text-xs text-gray-300 flex items-start gap-1.5">
                      <span className="text-emerald-500 mt-0.5 flex-shrink-0">›</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function LeanCanvasView({ canvas }: { canvas: NonNullable<StrategyOutput['lean_canvas']> }) {
  const sections = [
    { label: 'Problem', items: canvas.problem, color: 'text-red-400' },
    { label: 'Solution', items: canvas.solution, color: 'text-blue-400' },
    { label: 'Customer Segments', items: canvas.customer_segments, color: 'text-purple-400' },
    { label: 'Key Metrics', items: canvas.key_metrics, color: 'text-amber-400' },
    { label: 'Channels', items: canvas.channels, color: 'text-cyan-400' },
    { label: 'Revenue Streams', items: canvas.revenue_streams, color: 'text-emerald-400' },
    { label: 'Cost Structure', items: canvas.cost_structure, color: 'text-orange-400' },
  ];

  return (
    <div className="space-y-2">
      {canvas.unique_value_proposition && (
        <div className="bg-gray-800/60 rounded-lg p-3">
          <p className="text-xs font-semibold text-white mb-1">Unique Value Proposition</p>
          <p className="text-xs text-gray-200">{canvas.unique_value_proposition}</p>
        </div>
      )}
      {canvas.unfair_advantage && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          <p className="text-xs font-semibold text-amber-400 mb-0.5">Unfair Advantage</p>
          <p className="text-xs text-gray-300">{canvas.unfair_advantage}</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        {sections.map(({ label, items, color }) => items?.length ? (
          <div key={label} className="bg-gray-800/40 rounded-lg p-2.5">
            <p className={`text-xs font-semibold ${color} mb-1.5`}>{label}</p>
            <ul className="space-y-1">
              {items.map((item, i) => (
                <li key={i} className="text-xs text-gray-400 flex items-start gap-1">
                  <span className="text-gray-600 mt-0.5 flex-shrink-0">–</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null)}
      </div>
    </div>
  );
}

function PricingView({ pricing }: { pricing: NonNullable<StrategyOutput['pricing']> }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-400">Model:</span>
        <span className="text-xs text-white capitalize bg-gray-800 px-2 py-0.5 rounded">{pricing.model}</span>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {pricing.tiers.map((tier, i) => (
          <div key={i} className="bg-gray-800/60 rounded-lg p-3 border border-gray-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-white">{tier.name}</span>
              <span className="text-sm font-bold text-emerald-400">{tier.price}</span>
            </div>
            {tier.target && <p className="text-xs text-gray-500 mb-2 italic">{tier.target}</p>}
            <ul className="space-y-1">
              {tier.features.map((f, j) => (
                <li key={j} className="text-xs text-gray-300 flex items-start gap-1.5">
                  <CheckCircle className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {pricing.rationale && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
          <p className="text-xs text-blue-300 font-medium mb-0.5">Rationale</p>
          <p className="text-xs text-gray-300">{pricing.rationale}</p>
        </div>
      )}
    </div>
  );
}

function AcquisitionView({ acquisition }: { acquisition: NonNullable<StrategyOutput['customer_acquisition']> }) {
  return (
    <div className="space-y-3">
      <div className="bg-gray-800/60 rounded-lg p-3">
        <p className="text-xs font-semibold text-cyan-400 mb-1">Primary Channel</p>
        <p className="text-xs text-white">{acquisition.primary_channel}</p>
      </div>
      <div className="bg-gray-800/60 rounded-lg p-3">
        <p className="text-xs font-semibold text-gray-400 mb-1">Approach</p>
        <p className="text-xs text-gray-300">{acquisition.approach}</p>
      </div>
      {acquisition.tactics?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            Tactics
          </p>
          <ul className="space-y-1.5">
            {acquisition.tactics.map((t, i) => (
              <li key={i} className="text-xs text-gray-300 flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold mt-0.5 flex-shrink-0">{i + 1}.</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ValidationView({ plans }: { plans: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
        Validate before committing
      </p>
      <ul className="space-y-2">
        {plans.map((plan, i) => (
          <li key={i} className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            <span className="text-amber-400 text-xs font-bold mt-0.5 flex-shrink-0">{i + 1}</span>
            <span className="text-xs text-gray-300">{plan}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
