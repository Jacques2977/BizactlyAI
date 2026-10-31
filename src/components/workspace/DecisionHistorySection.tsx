import React, { useState, useEffect, useCallback } from 'react';
import { GitBranch, ChevronDown, ChevronUp, CheckCircle, XCircle, Clock, AlertCircle, Lightbulb, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Project } from '../../types/project';
import { DecisionRecord, FounderDecision, Outcome } from '../../types/project';
import * as decisionService from '../../services/decisionService';

interface DecisionHistorySectionProps {
  project: Project;
}

export function DecisionHistorySection({ project }: DecisionHistorySectionProps) {
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showDecisionModal, setShowDecisionModal] = useState<string | null>(null);
  const [showOutcomeModal, setShowOutcomeModal] = useState<string | null>(null);

  const loadDecisions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await decisionService.fetchDecisions(project.id);
      setDecisions(data);
    } catch (err) {
      console.error('Failed to load decisions:', err);
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => { loadDecisions(); }, [loadDecisions]);

  const handleRecordDecision = async (
    decisionId: string,
    selectedOption: string,
    decisionText: string,
    rationale: string | null,
    status: FounderDecision['decision_status']
  ) => {
    try {
      await decisionService.recordFounderDecision(decisionId, selectedOption, decisionText, rationale, status);
      setShowDecisionModal(null);
      await loadDecisions();
    } catch (err) {
      console.error('Failed to record founder decision:', err);
    }
  };

  const handleRecordOutcome = async (
    decisionId: string,
    outcome: Parameters<typeof decisionService.recordOutcome>[1]
  ) => {
    try {
      await decisionService.recordOutcome(decisionId, outcome);
      setShowOutcomeModal(null);
      await loadDecisions();
    } catch (err) {
      console.error('Failed to record outcome:', err);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-4 h-4 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-sm">Loading decision history...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <GitBranch className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Decision History</h2>
              <p className="text-xs text-gray-500">
                Traceable provenance: information → reasoning → recommendation → founder decision → outcome
              </p>
            </div>
          </div>
        </div>

        {decisions.length === 0 ? (
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-8 text-center">
            <GitBranch className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400 mb-1">No decisions recorded yet</p>
            <p className="text-xs text-gray-600">
              When you discuss meaningful business decisions with the AI advisor, they'll appear here with
              full provenance — the key factors that influenced each recommendation.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {decisions.map((decision) => (
              <DecisionCard
                key={decision.id}
                decision={decision}
                isExpanded={expandedId === decision.id}
                onToggle={() => setExpandedId(expandedId === decision.id ? null : decision.id)}
                onRecordDecision={() => setShowDecisionModal(decision.id)}
                onRecordOutcome={() => setShowOutcomeModal(decision.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showDecisionModal && (
        <FounderDecisionModal
          decisionId={showDecisionModal}
          onSubmit={handleRecordDecision}
          onCancel={() => setShowDecisionModal(null)}
        />
      )}
      {showOutcomeModal && (
        <OutcomeModal
          decisionId={showOutcomeModal}
          onSubmit={handleRecordOutcome}
          onCancel={() => setShowOutcomeModal(null)}
        />
      )}
    </div>
  );
}

// ─── Decision Card ────────────────────────────────────────────────────────────

function DecisionCard({
  decision,
  isExpanded,
  onToggle,
  onRecordDecision,
  onRecordOutcome,
}: {
  decision: DecisionRecord;
  isExpanded: boolean;
  onToggle: () => void;
  onRecordDecision: () => void;
  onRecordOutcome: () => void;
}) {
  const statusConfig = getDecisionStatusConfig(decision.status);
  const typeColor = getDecisionTypeColor(decision.decision_type);
  const confidencePct = Math.round((decision.recommendation_confidence ?? 0) * 100);

  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl overflow-hidden transition-all duration-200 hover:border-gray-600/60">
      {/* Header row */}
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-800/80 transition-colors"
      >
        <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${typeColor}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-sm font-medium text-white">{decision.title}</h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
            <span className="text-[10px] text-gray-600 capitalize">
              {decision.decision_type.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-xs text-gray-500 truncate">{decision.decision_question}</p>
          {decision.recommendation_summary && (
            <p className="text-xs text-gray-400 mt-1">
              <span className="text-gray-600">Recommended: </span>{decision.recommendation_summary}
              <span className="text-gray-600 ml-1">({confidencePct}% confidence)</span>
            </p>
          )}
        </div>
        {isExpanded
          ? <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0 mt-1" />
          : <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0 mt-1" />}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-gray-700/50 p-4 space-y-4">
          {/* Context */}
          {decision.context_summary && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-1">Context</p>
              <p className="text-xs text-gray-400 leading-relaxed">{decision.context_summary}</p>
            </div>
          )}

          {/* Recommendation */}
          {decision.recommendation && (
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-wider text-blue-400 mb-1">Bizactly Recommendation</p>
              <p className="text-xs text-gray-300 leading-relaxed">{decision.recommendation}</p>
            </div>
          )}

          {/* Key Reasoning Factors */}
          {decision.reasoning_events && decision.reasoning_events.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-2">Key Factors</p>
              <div className="space-y-1.5">
                {decision.reasoning_events
                  .filter((dre) => dre.reasoning_event && dre.relevance !== 'irrelevant')
                  .map((dre) => {
                    const evt = dre.reasoning_event!;
                    const roleConfig = getInfluenceRoleConfig(dre.influence_role);
                    return (
                      <div key={dre.id} className="flex items-start gap-2">
                        <div className={`mt-0.5 w-1 h-1 rounded-full flex-shrink-0 ${roleConfig.dot}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-300">{evt.content}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-gray-600 capitalize">
                              {evt.event_type.replace(/_/g, ' ')}
                            </span>
                            <span className={`text-[10px] ${roleConfig.color}`}>
                              {dre.influence_role.replace(/_/g, ' ')}
                            </span>
                            {dre.influence_strength !== 'moderate' && (
                              <span className="text-[10px] text-gray-600">
                                {dre.influence_strength}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Founder Decision */}
          {decision.founder_decision ? (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-wider text-emerald-400 mb-1">Founder Decision</p>
              <p className="text-xs text-gray-300">{decision.founder_decision.decision_text}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-gray-600">
                  {getFounderDecisionStatusLabel(decision.founder_decision.decision_status)}
                </span>
                {decision.founder_decision.rationale && (
                  <span className="text-[10px] text-gray-600">
                    · {decision.founder_decision.rationale}
                  </span>
                )}
              </div>
            </div>
          ) : (
            decision.status === 'proposed' && (
              <button
                onClick={onRecordDecision}
                className="w-full py-2 bg-gray-700/50 hover:bg-gray-700 border border-gray-600/50 hover:border-gray-500 rounded-lg text-xs text-gray-300 hover:text-white transition-all duration-200 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Record Founder Decision
              </button>
            )
          )}

          {/* Outcome */}
          {decision.outcome ? (
            <div className={`border rounded-lg p-3 ${getOutcomeBorder(decision.outcome.outcome_status)}`}>
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: getOutcomeColor(decision.outcome.outcome_status) }}>
                Outcome
              </p>
              {decision.outcome.outcome_summary && (
                <p className="text-xs text-gray-300">{decision.outcome.outcome_summary}</p>
              )}
              {decision.outcome.measured_result && (
                <p className="text-xs text-gray-400 mt-1">
                  <span className="text-gray-600">Measured: </span>{decision.outcome.measured_result}
                </p>
              )}
              {decision.outcome.lessons_learned && (
                <p className="text-xs text-gray-400 mt-1">
                  <span className="text-gray-600">Lessons: </span>{decision.outcome.lessons_learned}
                </p>
              )}
            </div>
          ) : (
            decision.founder_decision && (
              <button
                onClick={onRecordOutcome}
                className="w-full py-2 bg-gray-700/50 hover:bg-gray-700 border border-gray-600/50 hover:border-gray-500 rounded-lg text-xs text-gray-300 hover:text-white transition-all duration-200 flex items-center justify-center gap-2"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Record Outcome
              </button>
            )
          )}

          {/* Metadata */}
          <div className="flex items-center gap-3 text-[10px] text-gray-600 pt-1">
            <span>{new Date(decision.created_at).toLocaleDateString()}</span>
            <span>·</span>
            <span>{decision.reasoning_events?.length ?? 0} reasoning factors</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Founder Decision Modal ───────────────────────────────────────────────────

function FounderDecisionModal({
  decisionId,
  onSubmit,
  onCancel,
}: {
  decisionId: string;
  onSubmit: (decisionId: string, selectedOption: string, decisionText: string, rationale: string | null, status: FounderDecision['decision_status']) => void;
  onCancel: () => void;
}) {
  const [selectedOption, setSelectedOption] = useState('');
  const [decisionText, setDecisionText] = useState('');
  const [rationale, setRationale] = useState('');
  const [status, setStatus] = useState<FounderDecision['decision_status']>('accepted_recommendation');

  const handleSubmit = () => {
    if (!selectedOption.trim() || !decisionText.trim()) return;
    onSubmit(decisionId, selectedOption, decisionText, rationale.trim() || null, status);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-gray-800 border border-gray-700 rounded-xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-white mb-4">Record Your Decision</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Selected option</label>
            <input
              value={selectedOption}
              onChange={e => setSelectedOption(e.target.value)}
              placeholder="e.g. Launch with 3 features"
              className="w-full bg-gray-900 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:border-gray-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Decision</label>
            <textarea
              value={decisionText}
              onChange={e => setDecisionText(e.target.value)}
              placeholder="What did you decide?"
              rows={2}
              className="w-full bg-gray-900 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:border-gray-600 focus:outline-none resize-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Rationale (optional)</label>
            <input
              value={rationale}
              onChange={e => setRationale(e.target.value)}
              placeholder="Why did you make this choice?"
              className="w-full bg-gray-900 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:border-gray-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Relationship to recommendation</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as FounderDecision['decision_status'])}
              className="w-full bg-gray-900 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:border-gray-600 focus:outline-none"
            >
              <option value="accepted_recommendation">Accepted the recommendation</option>
              <option value="modified_recommendation">Modified the recommendation</option>
              <option value="rejected_recommendation">Rejected the recommendation</option>
              <option value="chose_alternative">Chose a different option</option>
              <option value="deferred">Deferred the decision</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onCancel} className="flex-1 py-2 text-xs text-gray-400 hover:text-white border border-gray-700 rounded-lg transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedOption.trim() || !decisionText.trim()}
            className="flex-1 py-2 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Record Decision
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Outcome Modal ────────────────────────────────────────────────────────────

function OutcomeModal({
  decisionId,
  onSubmit,
  onCancel,
}: {
  decisionId: string;
  onSubmit: (decisionId: string, outcome: Parameters<typeof decisionService.recordOutcome>[1]) => void;
  onCancel: () => void;
}) {
  const [outcomeStatus, setOutcomeStatus] = useState<Outcome['outcome_status']>('pending');
  const [summary, setSummary] = useState('');
  const [measuredResult, setMeasuredResult] = useState('');
  const [expectedResult, setExpectedResult] = useState('');
  const [lessonsLearned, setLessonsLearned] = useState('');
  const [successRating, setSuccessRating] = useState(50);

  const handleSubmit = () => {
    onSubmit(decisionId, {
      outcome_status: outcomeStatus,
      outcome_summary: summary.trim() || undefined,
      measured_result: measuredResult.trim() || undefined,
      expected_result: expectedResult.trim() || undefined,
      lessons_learned: lessonsLearned.trim() || undefined,
      success_rating: outcomeStatus !== 'pending' ? successRating / 100 : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-gray-800 border border-gray-700 rounded-xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-white mb-4">Record Outcome</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Outcome status</label>
            <select
              value={outcomeStatus}
              onChange={e => setOutcomeStatus(e.target.value as Outcome['outcome_status'])}
              className="w-full bg-gray-900 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:border-gray-600 focus:outline-none"
            >
              <option value="pending">Pending (not yet known)</option>
              <option value="positive">Positive (exceeded expectations)</option>
              <option value="negative">Negative (did not work)</option>
              <option value="mixed">Mixed (some success, some failure)</option>
              <option value="inconclusive">Inconclusive (can't tell yet)</option>
              <option value="abandoned">Abandoned (never executed)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Summary</label>
            <textarea
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="What happened?"
              rows={2}
              className="w-full bg-gray-900 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:border-gray-600 focus:outline-none resize-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Measured result</label>
            <input
              value={measuredResult}
              onChange={e => setMeasuredResult(e.target.value)}
              placeholder="e.g. 40 signups in first week"
              className="w-full bg-gray-900 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:border-gray-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Expected result (optional)</label>
            <input
              value={expectedResult}
              onChange={e => setExpectedResult(e.target.value)}
              placeholder="What did you expect?"
              className="w-full bg-gray-900 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:border-gray-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Lessons learned (optional)</label>
            <textarea
              value={lessonsLearned}
              onChange={e => setLessonsLearned(e.target.value)}
              placeholder="What did you learn?"
              rows={2}
              className="w-full bg-gray-900 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:border-gray-600 focus:outline-none resize-none"
            />
          </div>
          {outcomeStatus !== 'pending' && (
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Success rating: {successRating}%</label>
              <input
                type="range"
                min="0" max="100"
                value={successRating}
                onChange={e => setSuccessRating(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onCancel} className="flex-1 py-2 text-xs text-gray-400 hover:text-white border border-gray-700 rounded-lg transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Record Outcome
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDecisionStatusConfig(status: string): { label: string; bg: string; color: string } {
  switch (status) {
    case 'proposed': return { label: 'Proposed', bg: 'bg-blue-500/10', color: 'text-blue-400' };
    case 'awaiting_founder': return { label: 'Awaiting Decision', bg: 'bg-amber-500/10', color: 'text-amber-400' };
    case 'founder_decided': return { label: 'Decided', bg: 'bg-emerald-500/10', color: 'text-emerald-400' };
    case 'implemented': return { label: 'Implemented', bg: 'bg-cyan-500/10', color: 'text-cyan-400' };
    case 'completed': return { label: 'Completed', bg: 'bg-green-500/10', color: 'text-green-400' };
    case 'abandoned': return { label: 'Abandoned', bg: 'bg-red-500/10', color: 'text-red-400' };
    case 'outcome_available': return { label: 'Outcome Available', bg: 'bg-purple-500/10', color: 'text-purple-400' };
    default: return { label: status, bg: 'bg-gray-500/10', color: 'text-gray-400' };
  }
}

function getDecisionTypeColor(type: string): string {
  const colors: Record<string, string> = {
    product: 'bg-blue-400', pricing: 'bg-amber-400', customer: 'bg-emerald-400',
    marketing: 'bg-pink-400', positioning: 'bg-cyan-400', business_model: 'bg-indigo-400',
    feature: 'bg-teal-400', MVP: 'bg-orange-400', launch: 'bg-rose-400',
    growth: 'bg-lime-400', resource_allocation: 'bg-violet-400', strategy: 'bg-sky-400',
    other: 'bg-gray-400',
  };
  return colors[type] ?? 'bg-gray-400';
}

function getInfluenceRoleConfig(role: string): { dot: string; color: string } {
  switch (role) {
    case 'constraint': return { dot: 'bg-red-400', color: 'text-red-400' };
    case 'supporting_evidence': return { dot: 'bg-blue-400', color: 'text-blue-400' };
    case 'opportunity': return { dot: 'bg-emerald-400', color: 'text-emerald-400' };
    case 'risk': return { dot: 'bg-amber-400', color: 'text-amber-400' };
    case 'assumption': return { dot: 'bg-purple-400', color: 'text-purple-400' };
    case 'founder_preference': return { dot: 'bg-cyan-400', color: 'text-cyan-400' };
    case 'business_fact': return { dot: 'bg-teal-400', color: 'text-teal-400' };
    case 'prior_learning': return { dot: 'bg-indigo-400', color: 'text-indigo-400' };
    case 'contradiction': return { dot: 'bg-rose-400', color: 'text-rose-400' };
    case 'decisive_factor': return { dot: 'bg-orange-400', color: 'text-orange-400' };
    default: return { dot: 'bg-gray-400', color: 'text-gray-400' };
  }
}

function getFounderDecisionStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    accepted_recommendation: 'Accepted recommendation',
    modified_recommendation: 'Modified recommendation',
    rejected_recommendation: 'Rejected recommendation',
    chose_alternative: 'Chose alternative',
    deferred: 'Deferred',
    unknown: 'Unknown',
  };
  return labels[status] ?? status;
}

function getOutcomeColor(status: string): string {
  switch (status) {
    case 'positive': return '#34d399';
    case 'negative': return '#f87171';
    case 'mixed': return '#fbbf24';
    case 'inconclusive': return '#60a5fa';
    case 'abandoned': return '#9ca3af';
    default: return '#9ca3af';
  }
}

function getOutcomeBorder(status: string): string {
  switch (status) {
    case 'positive': return 'border-emerald-500/20 bg-emerald-500/5';
    case 'negative': return 'border-red-500/20 bg-red-500/5';
    case 'mixed': return 'border-amber-500/20 bg-amber-500/5';
    case 'inconclusive': return 'border-blue-500/20 bg-blue-500/5';
    case 'abandoned': return 'border-gray-500/20 bg-gray-500/5';
    default: return 'border-gray-500/20 bg-gray-500/5';
  }
}
