export const decisionOptions = ['Continue collecting', 'Investigate data quality', 'Revisit intervention', 'Consider rollout'];
export const decisionStorageKey = 'neurolift-decisions-v1';

// Stable across row order; a changed assignment or outcome creates a different run.
export async function fingerprintRows(rows) {
  const canonical = [...rows].sort((a, b) => a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0)
    .map(row => [row.userId, row.variant, row.completed, row.returned, row.problem]);
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(canonical)));
  return [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export function decisionContext(experimentId, provenance, fingerprint, plan) {
  return JSON.stringify([experimentId, provenance, fingerprint, plan.baseline, plan.effect, plan.minimumDays]);
}

export function saveDecision(storage, existing, context, value, savedAt = new Date().toISOString()) {
  if (!decisionOptions.includes(value.decision)) throw new Error('Choose a decision.');
  for (const field of ['rationale', 'nextStep']) {
    if (typeof value[field] !== 'string' || !value[field].trim() || value[field].trim().length > 3000) throw new Error('Add a rationale and next step of at most 3,000 characters each.');
  }
  const entry = { context, decision: value.decision, rationale: value.rationale.trim(), nextStep: value.nextStep.trim(), savedAt };
  const next = [...existing.filter(item => item.context !== context), entry];
  storage.setItem(decisionStorageKey, JSON.stringify(next));
  return next;
}

export function loadDecisions(storage) {
  try {
    const value = JSON.parse(storage.getItem(decisionStorageKey) || '[]');
    if (!Array.isArray(value)) return [];
    return value.filter(item => item && typeof item.context === 'string' && decisionOptions.includes(item.decision)
      && ['rationale', 'nextStep'].every(field => typeof item[field] === 'string' && item[field].trim().length > 0 && item[field].length <= 3000)
      && typeof item.savedAt === 'string' && !Number.isNaN(Date.parse(item.savedAt)));
  } catch { return []; }
}
