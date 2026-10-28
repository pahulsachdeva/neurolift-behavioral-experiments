import test from 'node:test';
import assert from 'node:assert/strict';
import { fingerprintRows, decisionContext, saveDecision, loadDecisions } from '../apps/web/decisions.js';

const rows = [
  { userId: 'a', variant: 'control', completed: false, returned: false, problem: false },
  { userId: 'b', variant: 'treatment', completed: true, returned: true, problem: false }
];
const plan = { baseline: .3, effect: .04, minimumDays: 14 };
const value = { decision: 'Investigate data quality', rationale: ' Verify assignment. ', nextStep: 'Inspect assignment logs.' };
const memoryStorage = () => {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
};

test('run fingerprints ignore row order and detect changed assignments and outcomes', async () => {
  const original = await fingerprintRows(rows);
  assert.match(original, /^[a-f0-9]{64}$/);
  assert.equal(await fingerprintRows([...rows].reverse()), original);
  assert.notEqual(await fingerprintRows([{ ...rows[0], completed: true }, rows[1]]), original);
  assert.notEqual(await fingerprintRows([{ ...rows[0], variant: 'treatment' }, rows[1]]), original);
});

test('notes are scoped to the experiment, source, dataset and plan', () => {
  const context = decisionContext('study', 'Imported rows', 'abc', plan);
  const alternatives = [
    decisionContext('writing', 'Imported rows', 'abc', plan),
    decisionContext('study', 'Seeded simulation', 'abc', plan),
    decisionContext('study', 'Imported rows', 'def', plan),
    decisionContext('study', 'Imported rows', 'abc', { ...plan, minimumDays: 21 })
  ];
  const saved = saveDecision(memoryStorage(), [], context, value);
  for (const alternative of alternatives) assert.equal(saved.find(item => item.context === alternative), undefined);
});

test('saving preserves other runs and replaces only the same run and plan', () => {
  const storage = memoryStorage();
  const first = saveDecision(storage, [], 'run-1', value);
  const second = saveDecision(storage, first, 'run-2', value);
  const updated = saveDecision(storage, second, 'run-1', { ...value, decision: 'Continue collecting' });
  assert.equal(updated.length, 2);
  assert.equal(updated.find(item => item.context === 'run-1').decision, 'Continue collecting');
  assert.equal(updated.find(item => item.context === 'run-2').rationale, 'Verify assignment.');
  assert.deepEqual(loadDecisions(storage), updated);
});

test('invalid input and storage failures never mutate existing decisions', () => {
  const existing = saveDecision(memoryStorage(), [], 'run-1', value);
  for (const invalid of [{ ...value, decision: 'Ship automatically' }, { ...value, rationale: ' ' }, { ...value, nextStep: 'x'.repeat(3001) }]) {
    assert.throws(() => saveDecision(memoryStorage(), existing, 'run-2', invalid));
  }
  assert.throws(() => saveDecision({ setItem() { throw new Error('quota'); } }, existing, 'run-2', value), /quota/);
  assert.equal(existing.length, 1);
  for (const value of ['{', '{}', '[null]', '[{"decision":"Continue collecting"}]']) assert.deepEqual(loadDecisions({ getItem: () => value }), []);
});
