// ─── Business Intelligence Service ───────────────────────────────────────────
// The BIM (Business Intelligence Model) is the shared source of truth for
// every AI layer in Bizactly. All AI interactions read from and write to it.
//
// LEARNING RULES:
// Assumption → Fact when ANY of:
//   1. User explicitly confirms ("yes", "exactly", "confirmed", etc.)
//   2. Claim stated consistently 3+ times (repetitionCount >= 3)
//   3. Claim has 2+ independent evidence items
//
// CONFIDENCE RULES:
// Starts at 0.3 for user_stated assumptions, 0.15 for ai_inferred.
// +0.25 on explicit user confirmation
// +0.15 on each additional repetition (capped at 0.95)
// +0.10 for each independent evidence item (capped at 0.95)
// -0.20 when a contradiction is detected
// -0.30 when user changes the answer
// Reaches 1.0 only through external_data validation

import {
  BusinessIntelligenceModel,
  BusinessClaim,
  Contradiction,
  ClaimSource,
  ClaimStatus,
} from '../types/project';

// ─── Constants ────────────────────────────────────────────────────────────────

const FACT_PROMOTION_THRESHOLD = 0.75;
const INITIAL_CONFIDENCE: Record<ClaimSource, number> = {
  user_stated: 0.30,
  user_confirmed: 0.55,
  ai_inferred: 0.15,
  external_data: 0.80,
  repeated: 0.30,
};

const CONFIDENCE_DELTAS = {
  explicit_confirmation: +0.25,
  repetition: +0.15,
  evidence_item: +0.10,
  contradiction_detected: -0.20,
  answer_changed: -0.30,
  untested_over_time: -0.05,
} as const;

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createBIM(): BusinessIntelligenceModel {
  return {
    facts: [],
    assumptions: [],
    unknowns: [],
    contradictions: [],
    confidence_scores: {},
    last_updated: new Date().toISOString(),
    version: 1,
  };
}

function makeId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Core claim operations ────────────────────────────────────────────────────

/**
 * Add a new claim to the BIM. If a claim in the same category with similar
 * content already exists, this updates it (repetition) rather than duplicating.
 */
export function addClaim(
  bim: BusinessIntelligenceModel,
  params: {
    category: string;
    claim: string;
    value: string;
    source: ClaimSource;
    evidence?: string;
  }
): BusinessIntelligenceModel {
  const now = new Date().toISOString();
  const updated = cloneBIM(bim);

  // Check if a matching claim already exists (same category + similar value)
  const existing = findExistingClaim(updated, params.category, params.value);

  if (existing) {
    return repeatClaim(updated, existing.id, params.evidence);
  }

  const confidence = INITIAL_CONFIDENCE[params.source] ?? 0.3;
  const newClaim: BusinessClaim = {
    id: makeId(),
    category: params.category,
    claim: params.claim,
    value: params.value,
    status: params.source === 'external_data' ? 'fact' : 'assumption',
    confidence,
    evidence: params.evidence ? [params.evidence] : [],
    sources: [params.source],
    repetitionCount: 1,
    firstSeenAt: now,
    lastUpdatedAt: now,
  };

  if (newClaim.status === 'fact') {
    updated.facts.push(newClaim);
    newClaim.promotedToFactAt = now;
  } else {
    updated.assumptions.push(newClaim);
  }

  updated.confidence_scores[params.category] = confidence;
  updated.last_updated = now;
  return updated;
}

/**
 * Register that a claim has been stated again — increases confidence and
 * may promote to fact if threshold is reached.
 */
export function repeatClaim(
  bim: BusinessIntelligenceModel,
  claimId: string,
  additionalEvidence?: string
): BusinessIntelligenceModel {
  const now = new Date().toISOString();
  const updated = cloneBIM(bim);

  const claim = findClaimById(updated, claimId);
  if (!claim) return bim;

  claim.repetitionCount += 1;
  claim.confidence = Math.min(0.95, claim.confidence + CONFIDENCE_DELTAS.repetition);
  claim.lastUpdatedAt = now;

  if (additionalEvidence && !claim.evidence.includes(additionalEvidence)) {
    claim.evidence.push(additionalEvidence);
    claim.confidence = Math.min(0.95, claim.confidence + CONFIDENCE_DELTAS.evidence_item);
  }

  if (!claim.sources.includes('repeated')) claim.sources.push('repeated');

  updated.confidence_scores[claim.category] = claim.confidence;
  updated.last_updated = now;

  return maybePromoteToFact(updated, claim.id);
}

/**
 * User has explicitly confirmed a claim ("yes", "exactly", "that's right").
 * This is the strongest single signal — boosts confidence substantially
 * and very likely promotes to fact.
 */
export function confirmClaim(
  bim: BusinessIntelligenceModel,
  claimId: string
): BusinessIntelligenceModel {
  const now = new Date().toISOString();
  const updated = cloneBIM(bim);

  const claim = findClaimById(updated, claimId);
  if (!claim) return bim;

  claim.confidence = Math.min(0.95, claim.confidence + CONFIDENCE_DELTAS.explicit_confirmation);
  claim.sources = [...new Set([...claim.sources, 'user_confirmed' as ClaimSource])];
  claim.lastUpdatedAt = now;

  updated.confidence_scores[claim.category] = claim.confidence;
  updated.last_updated = now;

  return maybePromoteToFact(updated, claim.id);
}

/**
 * Add a piece of evidence to an existing claim.
 */
export function addEvidence(
  bim: BusinessIntelligenceModel,
  claimId: string,
  evidence: string
): BusinessIntelligenceModel {
  const now = new Date().toISOString();
  const updated = cloneBIM(bim);

  const claim = findClaimById(updated, claimId);
  if (!claim || claim.evidence.includes(evidence)) return bim;

  claim.evidence.push(evidence);
  claim.confidence = Math.min(0.95, claim.confidence + CONFIDENCE_DELTAS.evidence_item);
  claim.lastUpdatedAt = now;

  updated.confidence_scores[claim.category] = claim.confidence;
  updated.last_updated = now;

  return maybePromoteToFact(updated, claim.id);
}

/**
 * User has changed their answer — invalidates the old claim and
 * adds the new one, with reduced confidence to reflect the inconsistency.
 */
export function changeClaim(
  bim: BusinessIntelligenceModel,
  oldClaimId: string,
  newParams: { category: string; claim: string; value: string; source: ClaimSource; evidence?: string }
): BusinessIntelligenceModel {
  const now = new Date().toISOString();
  let updated = cloneBIM(bim);

  const oldClaim = findClaimById(updated, oldClaimId);
  if (oldClaim) {
    oldClaim.status = 'invalidated';
    oldClaim.invalidatedAt = now;
    oldClaim.invalidationReason = 'User provided different answer';
    // Remove from active list
    updated = moveClaimToInvalidated(updated, oldClaimId);
  }

  // Add new claim with a slight confidence penalty for inconsistency
  updated = addClaim(updated, newParams);

  // Find the newly added claim and penalize its confidence slightly
  const newClaim = findExistingClaim(updated, newParams.category, newParams.value);
  if (newClaim) {
    newClaim.confidence = Math.max(0.1, newClaim.confidence + CONFIDENCE_DELTAS.answer_changed);
    updated.confidence_scores[newParams.category] = newClaim.confidence;
  }

  updated.last_updated = now;
  return updated;
}

/**
 * Register a contradiction between two claims. Both lose confidence.
 */
export function registerContradiction(
  bim: BusinessIntelligenceModel,
  claimAId: string,
  claimBId: string,
  description: string
): BusinessIntelligenceModel {
  const now = new Date().toISOString();
  const updated = cloneBIM(bim);

  const claimA = findClaimById(updated, claimAId);
  const claimB = findClaimById(updated, claimBId);

  if (!claimA || !claimB) return bim;

  // Check if this contradiction already exists
  const alreadyExists = updated.contradictions.some(
    c => (c.claimAId === claimAId && c.claimBId === claimBId) ||
         (c.claimAId === claimBId && c.claimBId === claimAId)
  );
  if (alreadyExists) return bim;

  // Both claims lose confidence
  claimA.confidence = Math.max(0.05, claimA.confidence + CONFIDENCE_DELTAS.contradiction_detected);
  claimB.confidence = Math.max(0.05, claimB.confidence + CONFIDENCE_DELTAS.contradiction_detected);
  claimA.lastUpdatedAt = now;
  claimB.lastUpdatedAt = now;

  updated.confidence_scores[claimA.category] = claimA.confidence;
  updated.confidence_scores[claimB.category] = claimB.confidence;

  const contradiction: Contradiction = {
    id: makeId(),
    claimAId,
    claimBId,
    claimA: claimA.claim,
    claimB: claimB.claim,
    description,
    detectedAt: now,
    resolved: false,
  };

  updated.contradictions.push(contradiction);
  updated.last_updated = now;
  return updated;
}

/**
 * Add a named unknown — a gap we know exists that blocks a decision.
 */
export function addUnknown(
  bim: BusinessIntelligenceModel,
  category: string,
  claim: string
): BusinessIntelligenceModel {
  const now = new Date().toISOString();
  const updated = cloneBIM(bim);

  const alreadyExists = updated.unknowns.some(u =>
    u.category === category && similarity(u.claim, claim) > 0.6
  );
  if (alreadyExists) return bim;

  const unknown: BusinessClaim = {
    id: makeId(),
    category,
    claim,
    value: '',
    status: 'unknown',
    confidence: 0,
    evidence: [],
    sources: ['ai_inferred'],
    repetitionCount: 1,
    firstSeenAt: now,
    lastUpdatedAt: now,
  };

  updated.unknowns.push(unknown);
  updated.last_updated = now;
  return updated;
}

/**
 * Resolve an unknown when an answer is provided.
 * Removes from unknowns and adds as an assumption.
 */
export function resolveUnknown(
  bim: BusinessIntelligenceModel,
  unknownId: string,
  answer: string,
  source: ClaimSource
): BusinessIntelligenceModel {
  const now = new Date().toISOString();
  const updated = cloneBIM(bim);

  const unknownIdx = updated.unknowns.findIndex(u => u.id === unknownId);
  if (unknownIdx === -1) return bim;

  const unknown = updated.unknowns[unknownIdx];
  updated.unknowns.splice(unknownIdx, 1);

  // Add as a new assumption/fact
  updated.last_updated = now;
  return addClaim(updated, {
    category: unknown.category,
    claim: answer,
    value: answer,
    source,
  });
}

/**
 * Directly promote an assumption to fact (used when external criteria are met).
 */
export function promoteToFact(
  bim: BusinessIntelligenceModel,
  claimId: string,
  promotionReason: string
): BusinessIntelligenceModel {
  const now = new Date().toISOString();
  const updated = cloneBIM(bim);

  const assumptionIdx = updated.assumptions.findIndex(a => a.id === claimId);
  if (assumptionIdx === -1) return bim;

  const claim = updated.assumptions[assumptionIdx];
  claim.status = 'fact';
  claim.promotedToFactAt = now;
  claim.lastUpdatedAt = now;
  claim.evidence.push(promotionReason);

  updated.assumptions.splice(assumptionIdx, 1);
  updated.facts.push(claim);
  updated.confidence_scores[claim.category] = claim.confidence;
  updated.last_updated = now;
  return updated;
}

// ─── Learning evaluation ──────────────────────────────────────────────────────

/**
 * Returns whether a claim qualifies as "learned" — validated to the point
 * where it can be treated as ground truth for decisions.
 *
 * A learned item is fact + confidence >= 0.85.
 */
export function isLearned(claim: BusinessClaim): boolean {
  return claim.status === 'fact' && claim.confidence >= 0.85;
}

/**
 * Returns all learned items across the BIM.
 */
export function getLearnedItems(bim: BusinessIntelligenceModel): BusinessClaim[] {
  return bim.facts.filter(isLearned);
}

/**
 * Returns the current overall confidence in the business model
 * as a weighted average of category confidence scores.
 */
export function getOverallConfidence(bim: BusinessIntelligenceModel): number {
  const scores = Object.values(bim.confidence_scores);
  if (scores.length === 0) return 0;
  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
}

// ─── Rendering for AI context ─────────────────────────────────────────────────

/**
 * Render the BIM as a structured context block for injection into AI prompts.
 * This is the shared context all AI layers receive.
 */
export function renderBIMForPrompt(bim: BusinessIntelligenceModel): string {
  const lines: string[] = [];
  const overall = Math.round(getOverallConfidence(bim) * 100);

  lines.push(`BUSINESS INTELLIGENCE MODEL (overall confidence: ${overall}%):`);

  // Facts
  if (bim.facts.length > 0) {
    lines.push(`\nCONFIRMED FACTS (${bim.facts.length}):`);
    bim.facts.forEach(f => {
      const pct = Math.round(f.confidence * 100);
      const learned = isLearned(f) ? ' [LEARNED]' : '';
      const evidence = f.evidence.length > 0 ? ` | evidence: ${f.evidence.slice(-2).join('; ')}` : '';
      lines.push(`  • [${pct}%${learned}] [${f.category}] ${f.claim}${evidence}`);
    });
  }

  // Assumptions
  if (bim.assumptions.length > 0) {
    lines.push(`\nACTIVE ASSUMPTIONS (${bim.assumptions.length} — untested):`);
    bim.assumptions.forEach(a => {
      const pct = Math.round(a.confidence * 100);
      const reps = a.repetitionCount > 1 ? ` (stated ${a.repetitionCount}×)` : '';
      lines.push(`  • [${pct}%] [${a.category}] ${a.claim}${reps}`);
    });
  }

  // Unknowns
  if (bim.unknowns.length > 0) {
    lines.push(`\nKNOWN UNKNOWNS (${bim.unknowns.length} — gaps blocking decisions):`);
    bim.unknowns.forEach(u => {
      lines.push(`  • [${u.category}] ${u.claim}`);
    });
  }

  // Contradictions
  const active = bim.contradictions.filter(c => !c.resolved);
  if (active.length > 0) {
    lines.push(`\nCONTRADICTIONS (${active.length} — unresolved):`);
    active.forEach(c => {
      lines.push(`  • CONFLICT: "${c.claimA}" vs "${c.claimB}" — ${c.description}`);
    });
  }

  // Per-category confidence
  const cats = Object.entries(bim.confidence_scores);
  if (cats.length > 0) {
    lines.push(`\nCONFIDENCE BY CATEGORY:`);
    cats
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([cat, score]) => {
        const bar = buildBar(score);
        lines.push(`  ${cat.padEnd(25)} ${bar} ${Math.round(score * 100)}%`);
      });
  }

  return lines.join('\n');
}

function buildBar(score: number): string {
  const filled = Math.round(score * 10);
  return '[' + '█'.repeat(filled) + '░'.repeat(10 - filled) + ']';
}

// ─── BIM summary (short form) ─────────────────────────────────────────────────

export function getBIMSummary(bim: BusinessIntelligenceModel): string {
  return [
    `Facts: ${bim.facts.length}`,
    `Assumptions: ${bim.assumptions.length}`,
    `Unknowns: ${bim.unknowns.length}`,
    `Contradictions: ${bim.contradictions.filter(c => !c.resolved).length}`,
    `Confidence: ${Math.round(getOverallConfidence(bim) * 100)}%`,
  ].join(' | ');
}

// ─── Merge BIM updates from extraction ───────────────────────────────────────
// Used by the edge function after extraction to apply updates to the BIM.

export interface BIMExtraction {
  newClaims?: Array<{
    category: string;
    claim: string;
    value: string;
    source: ClaimSource;
    evidence?: string;
  }>;
  repeatedClaims?: Array<{ category: string; value: string; evidence?: string }>;
  confirmedClaims?: Array<{ category: string; value: string }>;
  changedClaims?: Array<{
    category: string;
    oldValue: string;
    newValue: string;
    newClaim: string;
  }>;
  newUnknowns?: Array<{ category: string; claim: string }>;
  resolvedUnknowns?: Array<{ category: string; answer: string; source: ClaimSource }>;
  contradictions?: Array<{ categoryA: string; claimA: string; categoryB: string; claimB: string; description: string }>;
}

export function applyBIMExtraction(
  bim: BusinessIntelligenceModel,
  extraction: BIMExtraction
): BusinessIntelligenceModel {
  let updated = cloneBIM(bim);

  // New claims
  for (const c of extraction.newClaims || []) {
    updated = addClaim(updated, c);
  }

  // Repeated claims (find by category + value similarity and bump)
  for (const r of extraction.repeatedClaims || []) {
    const existing = findExistingClaim(updated, r.category, r.value);
    if (existing) {
      updated = repeatClaim(updated, existing.id, r.evidence);
    } else {
      // Treat as new if not found
      updated = addClaim(updated, { category: r.category, claim: r.value, value: r.value, source: 'user_stated', evidence: r.evidence });
    }
  }

  // Confirmed claims
  for (const c of extraction.confirmedClaims || []) {
    const existing = findExistingClaim(updated, c.category, c.value);
    if (existing) {
      updated = confirmClaim(updated, existing.id);
    }
  }

  // Changed claims
  for (const c of extraction.changedClaims || []) {
    const existing = findExistingClaim(updated, c.category, c.oldValue);
    if (existing) {
      updated = changeClaim(updated, existing.id, {
        category: c.category,
        claim: c.newClaim,
        value: c.newValue,
        source: 'user_stated',
      });
    } else {
      updated = addClaim(updated, { category: c.category, claim: c.newClaim, value: c.newValue, source: 'user_stated' });
    }
  }

  // New unknowns
  for (const u of extraction.newUnknowns || []) {
    updated = addUnknown(updated, u.category, u.claim);
  }

  // Resolved unknowns
  for (const r of extraction.resolvedUnknowns || []) {
    const unknown = updated.unknowns.find(u =>
      u.category === r.category || similarity(u.claim, r.answer) > 0.4
    );
    if (unknown) {
      updated = resolveUnknown(updated, unknown.id, r.answer, r.source);
    }
  }

  // Contradictions
  for (const c of extraction.contradictions || []) {
    const claimA = findExistingClaim(updated, c.categoryA, c.claimA);
    const claimB = findExistingClaim(updated, c.categoryB, c.claimB);
    if (claimA && claimB) {
      updated = registerContradiction(updated, claimA.id, claimB.id, c.description);
    }
  }

  return updated;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function cloneBIM(bim: BusinessIntelligenceModel): BusinessIntelligenceModel {
  return JSON.parse(JSON.stringify(bim));
}

function findClaimById(bim: BusinessIntelligenceModel, id: string): BusinessClaim | undefined {
  return (
    bim.facts.find(c => c.id === id) ||
    bim.assumptions.find(c => c.id === id) ||
    bim.unknowns.find(c => c.id === id)
  );
}

function findExistingClaim(
  bim: BusinessIntelligenceModel,
  category: string,
  value: string
): BusinessClaim | undefined {
  const all = [...bim.facts, ...bim.assumptions];
  return all.find(c =>
    c.category === category && similarity(c.value.toLowerCase(), value.toLowerCase()) > 0.55
  );
}

function moveClaimToInvalidated(
  bim: BusinessIntelligenceModel,
  claimId: string
): BusinessIntelligenceModel {
  // Remove from facts or assumptions (invalidated claims are just marked, not stored separately)
  bim.facts = bim.facts.filter(c => c.id !== claimId);
  bim.assumptions = bim.assumptions.filter(c => c.id !== claimId);
  return bim;
}

function maybePromoteToFact(
  bim: BusinessIntelligenceModel,
  claimId: string
): BusinessIntelligenceModel {
  const assumptionIdx = bim.assumptions.findIndex(a => a.id === claimId);
  if (assumptionIdx === -1) return bim;

  const claim = bim.assumptions[assumptionIdx];
  const meetsThreshold = claim.confidence >= FACT_PROMOTION_THRESHOLD;
  const hasExplicitConfirmation = claim.sources.includes('user_confirmed');
  const hasEnoughRepetitions = claim.repetitionCount >= 3;
  const hasEnoughEvidence = claim.evidence.length >= 2;

  if (meetsThreshold || hasExplicitConfirmation || (hasEnoughRepetitions && claim.confidence >= 0.55) || hasEnoughEvidence) {
    const now = new Date().toISOString();
    claim.status = 'fact';
    claim.promotedToFactAt = now;
    claim.lastUpdatedAt = now;
    bim.assumptions.splice(assumptionIdx, 1);
    bim.facts.push(claim);
  }

  return bim;
}

/**
 * Simple character-level similarity for deduplication.
 * Returns 0–1, where 1 is identical.
 */
function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  // Check for substring containment
  if (a.includes(b) || b.includes(a)) return 0.8;

  // Word overlap
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let overlap = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) overlap++;
  }
  return overlap / Math.max(wordsA.size, wordsB.size);
}
