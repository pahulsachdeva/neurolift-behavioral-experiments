// Keep the maths independent from the views. Every reported number can be
// recomputed from the exported user rows, without a browser or model service.
const Z95 = 1.959963984540054;

export function wilson(successes, total, z = Z95) {
  if (!Number.isInteger(total) || total < 1 || !Number.isInteger(successes) || successes < 0 || successes > total) {
    throw new Error('Counts must be integers with 0 ≤ successes ≤ total and total > 0.');
  }
  const p = successes / total;
  const denominator = 1 + z * z / total;
  const center = (p + z * z / (2 * total)) / denominator;
  const margin = z * Math.sqrt(p * (1 - p) / total + z * z / (4 * total * total)) / denominator;
  return [successes === 0 ? 0 : Math.max(0, center - margin), successes === total ? 1 : Math.min(1, center + margin)];
}

// Abramowitz–Stegun normal CDF approximation. Sufficient for the display
// precision here; tests compare known reference points and tail behavior.
export function normalCDF(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const density = Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
  const tail = density * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return x >= 0 ? 1 - tail : tail;
}

export function allocationCheck(control, treatment) {
  const total = control + treatment;
  if (!total) return { p: null, flagged: true };
  const expected = total / 2; // This release supports equal allocation only.
  const chiSquare = ((control - expected) ** 2 + (treatment - expected) ** 2) / expected;
  const p = Math.max(0, 2 * (1 - normalCDF(Math.sqrt(chiSquare))));
  return { p, flagged: p < 0.001 };
}

export function compare(controlSuccess, controlTotal, treatmentSuccess, treatmentTotal) {
  const control = controlSuccess / controlTotal;
  const treatment = treatmentSuccess / treatmentTotal;
  const controlCI = wilson(controlSuccess, controlTotal);
  const treatmentCI = wilson(treatmentSuccess, treatmentTotal);
  const difference = treatment - control;
  const standardError = Math.sqrt(control * (1 - control) / controlTotal + treatment * (1 - treatment) / treatmentTotal);
  // Unpooled normal interval for the difference. Avoid interpreting it when
  // either arm has fewer than 10 successes or failures; use an exact method then.
  const adequate = [controlSuccess, controlTotal - controlSuccess, treatmentSuccess, treatmentTotal - treatmentSuccess].every(n => n >= 10);
  const interval = [Math.max(-1, difference - Z95 * standardError), Math.min(1, difference + Z95 * standardError)];
  return { control, treatment, controlCI, treatmentCI, difference, relative: control ? difference / control : null, interval, adequate };
}

export function planSample(baseline, absoluteEffect) {
  if (!(baseline > 0 && baseline < 1 && absoluteEffect > 0 && absoluteEffect < 1 - baseline)) throw new Error('Choose a baseline and a positive effect that stays below 100%.');
  // Approximate equal-arm planning: two-sided alpha .05, power .80,
  // fixed horizon and independent binary outcomes. No clustering adjustment.
  return Math.ceil(2 * baseline * (1 - baseline) * (Z95 + 0.8416212335729143) ** 2 / absoluteEffect ** 2);
}

export function summarize(rows, metric = 'completed') {
  const arms = ['control', 'treatment'].map(variant => {
    const subset = rows.filter(row => row.variant === variant);
    return { variant, total: subset.length, successes: subset.filter(row => row[metric]).length };
  });
  if (arms.some(arm => arm.total === 0)) throw new Error('Both variants need at least one assigned user.');
  return { arms, ...compare(arms[0].successes, arms[0].total, arms[1].successes, arms[1].total), allocation: allocationCheck(arms[0].total, arms[1].total) };
}

export function validateRows(value) {
  if (!Array.isArray(value) || value.length < 2 || value.length > 50000) throw new Error('Use an array of 2–50,000 user rows.');
  const ids = new Set();
  const rows = value.map((row, index) => {
    if (!row || typeof row.userId !== 'string' || !row.userId.trim()) throw new Error(`Row ${index + 1}: userId is required.`);
    if (ids.has(row.userId)) throw new Error(`Row ${index + 1}: duplicate userId; use one row per assigned user.`);
    ids.add(row.userId);
    if (!['control', 'treatment'].includes(row.variant)) throw new Error(`Row ${index + 1}: variant must be control or treatment.`);
    for (const field of ['completed', 'returned', 'problem']) if (typeof row[field] !== 'boolean') throw new Error(`Row ${index + 1}: ${field} must be true or false.`);
    return { userId: row.userId, variant: row.variant, completed: row.completed, returned: row.returned, problem: row.problem };
  });
  if (!rows.some(r => r.variant === 'control') || !rows.some(r => r.variant === 'treatment')) throw new Error('Include users from both variants.');
  return rows;
}
