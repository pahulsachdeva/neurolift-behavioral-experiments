import test from 'node:test';
import assert from 'node:assert/strict';
import { filterUsers, savePlan } from '../apps/web/workspace.js';

const rows = [{ userId: 'User-ABC', variant: 'control' }, { userId: 'User-DEF', variant: 'treatment' }];
test('search matches user IDs and groups regardless of capital letters', () => {
  assert.deepEqual(filterUsers(rows, ' abc '), [rows[0]]);
  assert.deepEqual(filterUsers(rows, 'TREATMENT'), [rows[1]]);
  assert.deepEqual(filterUsers(rows, ''), rows);
});
test('a failed plan save leaves the current plan unchanged', () => {
  const original = { study: { baseline: .3, effect: .04, minimumDays: 14 } };
  const changed = { baseline: .4, effect: .05, minimumDays: 21 };
  assert.throws(() => savePlan({ setItem() { throw new Error('Storage full'); } }, original, 'study', changed), /Storage full/);
  assert.equal(original.study.minimumDays, 14);
});
test('plan save checks the days and stores the same plan it returns', () => {
  let stored;
  const storage = { setItem(key, value) { stored = JSON.parse(value); } };
  const plan = { baseline: .3, effect: .04, minimumDays: 14 };
  for (const minimumDays of [0, 6, 366, 7.5, NaN]) assert.throws(() => savePlan(storage, {}, 'study', { ...plan, minimumDays }), /days/);
  assert.deepEqual(savePlan(storage, {}, 'study', plan), stored);
});
