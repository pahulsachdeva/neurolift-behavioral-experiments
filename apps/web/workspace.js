import { planSample } from './statistics.js';

export function filterUsers(rows, query) {
  const term = query.trim().toLowerCase();
  return rows.filter(row => `${row.userId} ${row.variant}`.toLowerCase().includes(term));
}

export function savePlan(storage, existing, experimentId, value) {
  planSample(value.baseline, value.effect);
  if (!Number.isInteger(value.minimumDays) || value.minimumDays < 7 || value.minimumDays > 365) {
    throw new Error('Choose a whole number of days from 7 to 365.');
  }
  const next = { ...existing, [experimentId]: { ...value } };
  storage.setItem('neurolift-plans', JSON.stringify(next));
  return next;
}
