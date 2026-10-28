import test from 'node:test';
import assert from 'node:assert/strict';
import { allocationCheck, compare, normalCDF, planSample, summarize, validateRows, wilson } from '../apps/web/statistics.js';
import { experiments, generateRun } from '../apps/web/data.js';

test('Wilson interval matches a known binomial reference case', () => {
  const [low, high] = wilson(50, 100);
  assert.ok(Math.abs(low - .40383153) < 1e-7);
  assert.ok(Math.abs(high - .59616847) < 1e-7);
  assert.equal(wilson(0, 100)[0], 0);
  assert.ok(wilson(100, 100)[1] <= 1);
  assert.throws(() => wilson(10, 0));
});

test('difference intervals preserve direction and flag sparse arms', () => {
  const result = compare(40, 100, 60, 100);
  assert.ok(Math.abs(result.difference - .2) < 1e-12);
  assert.ok(Math.abs(result.interval[0] - .0642097) < 1e-6);
  assert.equal(result.adequate, true);
  assert.equal(compare(0, 100, 1, 100).adequate, false);
  assert.equal(compare(0, 100, 1, 100).relative, null);
  assert.ok(compare(60, 100, 40, 100).interval[1] < 0);
});

test('allocation check detects a severe mismatch but accepts balanced groups', () => {
  assert.equal(allocationCheck(1000, 1000).flagged, false);
  assert.equal(allocationCheck(1500, 500).flagged, true);
  assert.ok(Math.abs(normalCDF(1.96) - .9750021) < 1e-6);
  assert.ok(Math.abs(normalCDF(-1.96) - .0249979) < 1e-6);
});

test('planning requires more users for smaller effects and rejects impossible rates', () => {
  assert.ok(planSample(.3, .02) > planSample(.3, .04));
  assert.ok(Math.abs(planSample(.5, .05) - 1570) <= 1);
  assert.throws(() => planSample(.95, .1));
  assert.throws(() => planSample(.5, 0));
});

test('imports reject duplicate assignments, invalid variants, and missing outcomes', () => {
  const row = { userId: 'u1', variant: 'control', completed: false, returned: false, problem: false };
  const treatment = { ...row, userId: 'u2', variant: 'treatment' };
  assert.equal(validateRows([row, treatment]).length, 2);
  assert.throws(() => validateRows([row, row]), /duplicate/);
  assert.throws(() => validateRows([row, { ...treatment, variant: 'unknown' }]), /variant/);
  assert.throws(() => validateRows([row, { ...treatment, completed: 1 }]), /completed/);
  assert.throws(() => validateRows([row, { ...row, userId: 'u2' }]), /both variants/);
});

test('analysis includes non-completers in the assigned-user denominator', () => {
  const rows = validateRows([
    { userId: 'a', variant: 'control', completed: false, returned: false, problem: false },
    { userId: 'b', variant: 'control', completed: true, returned: true, problem: false },
    { userId: 'c', variant: 'treatment', completed: true, returned: true, problem: false },
    { userId: 'd', variant: 'treatment', completed: true, returned: false, problem: true },
  ]);
  assert.equal(summarize(rows).control, .5);
  assert.equal(summarize(rows).treatment, 1);
  assert.equal(summarize(rows, 'returned').treatment, .5);
});

test('practice runs reproduce the same rows and distinguish different experiment questions', () => {
  for (const experiment of experiments) {
    const rows = generateRun(experiment);
    assert.deepEqual(rows, generateRun(experiment));
    assert.equal(validateRows(rows).length, experiment.n);
    // The writing seed exposes an allocation mismatch. Keep that case visible
    // rather than choosing a different seed just to obtain a tidy readout.
    assert.equal(summarize(rows).allocation.flagged, experiment.id === 'writing');
  }
  const planning = experiments.find(e => e.id === 'planning');
  assert.ok(summarize(generateRun(planning), 'problem').difference > .01);
});


test('numerical helpers reject invalid counts instead of producing a readout', () => {
  for (const count of [-1, 1.5, NaN, Infinity, '10', Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => allocationCheck(count, 10), /counts/);
    assert.throws(() => wilson(1, count));
  }
  assert.throws(() => allocationCheck(Number.MAX_SAFE_INTEGER, 1), /counts/);
  assert.deepEqual(allocationCheck(0, 0), { p: null, flagged: true });
  for (const z of [0, -1, NaN, Infinity, '1.96']) assert.throws(() => wilson(5, 10, z), /multiplier/);
  assert.throws(() => compare(11, 10, 5, 10));
});

test('planning and distribution functions require numbers while preserving valid tails', () => {
  for (const invalid of [NaN, Infinity, '0.3', null]) {
    assert.throws(() => planSample(invalid, .04));
    assert.throws(() => planSample(.3, invalid));
  }
  assert.throws(() => normalCDF(NaN), /number/);
  assert.throws(() => normalCDF('1.96'), /number/);
  assert.equal(normalCDF(Infinity), 1);
  assert.equal(normalCDF(-Infinity), 0);
});

test('summaries reject unknown metrics, malformed outcomes, and duplicate assignments', () => {
  const control = { userId: 'a', variant: 'control', completed: false, returned: false, problem: false };
  const treatment = { ...control, userId: 'b', variant: 'treatment' };
  assert.throws(() => summarize([control, treatment], 'completion'), /outcome/);
  assert.throws(() => summarize([control, { ...treatment, completed: 'false' }]), /completed/);
  assert.throws(() => summarize([control, { ...treatment, userId: 'a' }]), /duplicate/);
  assert.throws(() => summarize([control, { ...treatment, variant: 'variant-b' }]), /variant/);
});
