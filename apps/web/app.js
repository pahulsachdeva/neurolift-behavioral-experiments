import { experiments, generateRun } from './data.js';
import { summarize, planSample, validateRows } from './statistics.js';

const root = document.getElementById('app');
const navigation = ['Overview', 'Test design', 'Results', 'User rows', 'Notebook'];
let view = 'Overview';
let selected = experiments[0];
let imported = null;
let search = '';
let page = 1;
let message = '';
let savedPlans = {};
try {
  savedPlans = JSON.parse(localStorage.getItem('neurolift-plans') || '{}');
  if (!savedPlans || typeof savedPlans !== 'object' || Array.isArray(savedPlans)) savedPlans = {};
  for (const [id, value] of Object.entries(savedPlans)) {
    try {
      planSample(value.baseline, value.effect);
      if (!Number.isInteger(value.minimumDays) || value.minimumDays < 7 || value.minimumDays > 365) throw new Error('Invalid horizon');
    } catch { delete savedPlans[id]; }
  }
} catch { savedPlans = {}; }
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const pct = value => `${(100 * value).toFixed(1)}%`;
const pp = value => `${value >= 0 ? '+' : ''}${(100 * value).toFixed(1)} pp`;
const number = value => value.toLocaleString('en-US');
const rows = () => imported || generateRun(selected);
const plan = () => savedPlans[selected.id] || { baseline: selected.baseline, effect: selected.effect, minimumDays: selected.minimumDays };
const heading = (label, title, description) => `<div class="page-heading"><div><div class="eyebrow">${label}</div><h1>${title}</h1><p>${description}</p></div><button class="button primary" data-action="export-report">Export readout ↗</button></div>`;
const badge = (text, tone = 'purple') => `<span class="badge ${tone}">${esc(text)}</span>`;

function runState() {
  const data = rows();
  const primary = summarize(data);
  const returning = summarize(data, 'returned');
  const guardrail = summarize(data, 'problem');
  const target = planSample(Number(plan().baseline), Number(plan().effect));
  const enough = primary.arms.every(arm => arm.total >= target);
  const duration = !imported && selected.completedDays >= Number(plan().minimumDays);
  let status = 'Review the result';
  let note = 'The estimated interval is above zero. Review practical value and the guardrail before deciding on a rollout.';
  if (primary.allocation.flagged) { status = 'Check allocation'; note = 'The assigned groups differ from the planned 50/50 split. Investigate assignment or missing users before interpreting the outcome.'; }
  else if (!primary.adequate) { status = 'Need more outcome data'; note = 'At least one arm has fewer than 10 successes or failures. The normal interval needs a different method or more observations.'; }
  else if (!enough || !duration) { status = imported ? 'Review the run context' : 'Continue to the planned horizon'; note = imported ? 'Check assignment, outcome maturity, and the planned duration before treating this file as an experiment readout.' : 'Keep the original sample and duration commitments. An early positive estimate is not a reason to stop.'; }
  else if (guardrail.difference > .01) { status = 'Investigate the tradeoff'; note = 'Reported problems increased by more than the one percentage point review threshold. Look at that cost before considering a rollout.'; }
  else if (primary.interval[1] < 0) { status = 'Revisit the intervention'; note = 'The estimated interval is below zero. Review the task flow and the original hypothesis before another test.'; }
  else if (primary.interval[0] <= 0) { status = 'Still uncertain'; note = 'The interval includes no difference. Use the range to judge which effects remain plausible; avoid reading this as proof of equivalence.'; }
  return { data, primary, returning, guardrail, target, enough, duration, status, note };
}

function render() {
  const state = runState();
  root.innerHTML = `<div class="layout"><aside><a class="wordmark" href="#" aria-label="NeuroLift overview"><img src="/assets/mark.svg" alt=""><span>NeuroLift<small>AI ENABLEMENT MARKER</small></span></a><div class="workspace"><span class="tiny-label">PROJECT 02</span><strong>Behavioral experiments</strong><small>From a useful question to a useful test.</small></div><nav aria-label="Workspace navigation">${navigation.map((name, i) => `<button class="nav-item ${view === name ? 'active' : ''}" data-view="${name}"><span>${['◫', '◇', '↗', '≡', '▤'][i]}</span>${name}</button>`).join('')}</nav><div class="side-bottom"><div class="portfolio-note"><span>↗</span><div><strong>The next step after Sentient</strong><small>Listen → design → measure</small></div></div><a href="https://github.com/pahulsachdeva/sentient-behavioral-intelligence" target="_blank" rel="noreferrer">Explore Project 01 ↗</a></div></aside><div class="main"><header><div class="breadcrumb">WORKSPACE <span>/</span> ${view}</div><div class="run-label"><span></span>${imported ? 'IMPORTED RUN' : 'PRACTICE RUN'}</div></header><main><div class="experiment-switch"><label for="experiment">EXPERIMENT</label><select id="experiment">${experiments.map(e => `<option value="${e.id}" ${e.id === selected.id ? 'selected' : ''}>${e.name}</option>`).join('')}</select><span>${selected.area}</span></div><div id="view">${({ Overview: overview, 'Test design': design, Results: results, 'User rows': users, Notebook: notebook })[view](state)}</div></main><footer>NeuroLift · Plan the test. Check the data. Read the result.</footer></div></div><div class="toast" role="status" ${message ? '' : 'hidden'}>${esc(message)}</div>`;
  root.querySelector('.wordmark').addEventListener('click', e => { e.preventDefault(); view = 'Overview'; render(); });
  root.querySelector('#experiment').addEventListener('change', e => { selected = experiments.find(x => x.id === e.target.value); imported = null; page = 1; search = ''; render(); });
  root.querySelector('#plan-form')?.addEventListener('submit', savePlan);
  root.querySelector('#import-file')?.addEventListener('change', importRun);
  root.querySelector('#search')?.addEventListener('input', e => { search = e.target.value; page = 1; const pos = e.target.selectionStart; render(); const field = root.querySelector('#search'); field.focus(); field.setSelectionRange(pos, pos); });
}

// Navigation and row actions use one delegated listener so re-rendering does
// not leave old handlers or duplicate actions attached to replaced controls.
root.addEventListener('click', event => {
  const button = event.target.closest('[data-view], [data-action]');
  if (!button) return;
  if (button.dataset.view) { view = button.dataset.view; render(); return; }
  const action = button.dataset.action;
  if (action === 'export-report') download('neurolift-readout.json', { experiment: selected.name, provenance: imported ? 'User imported rows' : 'Seeded simulation', plan: plan(), analysis: runState() });
  if (action === 'export-rows') download('neurolift-user-rows.json', rows());
  if (action === 'import') root.querySelector('#import-file').click();
  if (action === 'reset') { imported = null; page = 1; render(); }
  if (action === 'next') { page++; render(); }
  if (action === 'previous') { page--; render(); }
});

function overview(state) {
  const { primary, target, data, status, note } = state;
  const totalTarget = target * 2;
  return `${heading(selected.tag, 'Make the next test count.', selected.question)}
    <div class="stat-grid"><div class="stat"><span>ASSIGNED USERS</span><strong>${number(data.length)}</strong><small>${number(totalTarget)} planned · equal allocation</small></div><div class="stat"><span>CONTROL → VARIANT</span><strong>${pct(primary.control)} <i>→</i> ${pct(primary.treatment)}</strong><small>${selected.primary}</small></div><div class="stat"><span>ABSOLUTE DIFFERENCE</span><strong class="accent">${pp(primary.difference)}</strong><small>${primary.adequate ? `95% interval ${pp(primary.interval[0])} to ${pp(primary.interval[1])}` : 'More outcomes needed for a difference interval'}</small></div><div class="stat"><span>OBSERVATION WINDOW</span><strong>${imported ? 'Review' : `${selected.completedDays}<i> / ${plan().minimumDays} days</i>`}</strong><small>Includes seven-day follow-up</small></div></div>
    <div class="overview-grid"><section class="panel result-panel"><div class="panel-heading"><div><div class="eyebrow">PRIMARY OUTCOME</div><h2>${selected.primary}</h2></div>${badge('95% intervals')}</div>${rateChart(primary)}<div class="legend"><span><i class="key control"></i>${selected.control}</span><span><i class="key treatment"></i>${selected.treatment}</span></div><p class="caption">Intervals describe uncertainty around each arm's completion rate.</p></section><section class="panel context-panel"><div class="eyebrow">THE QUESTION BEHIND THE TEST</div><h2>Start with the user.</h2><p>${selected.source}</p><div class="hypothesis"><span>HYPOTHESIS</span><p>${selected.hypothesis}</p></div><button class="text-link" data-view="Test design">Open test design ↗</button></section></div>
    <section class="decision"><div class="decision-icon">◇</div><div><span class="eyebrow">READOUT</span><h2>${status}</h2><p>${note}</p></div><button class="text-link" data-view="Results">Inspect the details ↗</button></section>
    <div class="bottom-grid"><section class="panel"><div class="eyebrow">PROGRESS AGAINST PLAN</div><h2>Sample before conclusion</h2><div class="progress"><span style="width:${Math.min(100, data.length / totalTarget * 100)}%"></span></div><div class="progress-label"><span>${number(data.length)} assigned</span><span>${number(totalTarget)} planned</span></div><p class="caption">Check each arm's target as well as the total.</p></section><section class="panel"><div class="eyebrow">A SECOND LOOK</div><h2>What happens after the first task?</h2><p class="small-copy">${selected.returnLabel}: ${pct(state.returning.control)} in control, ${pct(state.returning.treatment)} in the variant. Use this as a follow-up question alongside the primary outcome.</p><button class="text-link" data-view="Results">See return use and the guardrail ↗</button></section></div>`;
}

function rateChart(result) {
  const max = Math.min(1, Math.max(...result.controlCI, ...result.treatmentCI) + .12);
  const x = value => 105 + value / max * 450;
  return `<svg class="rate-chart" viewBox="0 0 620 208" role="img" aria-label="Control ${pct(result.control)} and variant ${pct(result.treatment)}, with 95 percent Wilson intervals"><g class="axis">${[0, .25, .5, .75, 1].map(f => `<line x1="${105 + f * 450}" y1="22" x2="${105 + f * 450}" y2="158"/><text x="${105 + f * 450}" y="185" text-anchor="middle">${pct(f * max)}</text>`).join('')}</g>${[{ name: 'Control', p: result.control, ci: result.controlCI, y: 65, color: '#77728c' }, { name: 'Variant', p: result.treatment, ci: result.treatmentCI, y: 125, color: '#a78bfa' }].map(arm => `<text class="chart-label" x="0" y="${arm.y + 5}">${arm.name}</text><line x1="${x(arm.ci[0])}" y1="${arm.y}" x2="${x(arm.ci[1])}" y2="${arm.y}" stroke="${arm.color}" stroke-width="3"/><line x1="${x(arm.ci[0])}" y1="${arm.y - 7}" x2="${x(arm.ci[0])}" y2="${arm.y + 7}" stroke="${arm.color}" stroke-width="2"/><line x1="${x(arm.ci[1])}" y1="${arm.y - 7}" x2="${x(arm.ci[1])}" y2="${arm.y + 7}" stroke="${arm.color}" stroke-width="2"/><circle cx="${x(arm.p)}" cy="${arm.y}" r="7" fill="${arm.color}"/><text class="chart-value" x="${x(arm.ci[1]) + 15}" y="${arm.y + 4}">${pct(arm.p)}</text>`).join('')}</svg>`;
}

function design(state) {
  return `${heading('EXPERIMENT DESIGN', 'Decide what good looks like.', 'Write the hypothesis, define the outcome, and commit to the horizon before looking for a result.')}
  <div class="design-grid"><section class="panel"><div class="eyebrow">TEST BRIEF</div><h2>${selected.name}</h2><dl class="brief"><dt>Question</dt><dd>${selected.question}</dd><dt>Hypothesis</dt><dd>${selected.hypothesis}</dd><dt>Intervention</dt><dd>${selected.intervention}</dd><dt>Primary outcome</dt><dd>${selected.definition}</dd><dt>Guardrail</dt><dd>${selected.guardrail}. Review an increase above one percentage point.</dd><dt>Practical tradeoff</dt><dd>${selected.cost}</dd></dl></section><section class="panel"><div class="eyebrow">SAMPLE PLANNER</div><h2>Set a useful target.</h2><p class="small-copy">An approximate starting point for two equal groups, a binary outcome, 80% power, and a two-sided 5% test.</p><form id="plan-form"><label>Baseline completion (%)<input name="baseline" type="number" min="1" max="98" step=".1" value="${plan().baseline * 100}" required></label><label>Smallest useful increase (percentage points)<input name="effect" type="number" min=".1" max="50" step=".1" value="${plan().effect * 100}" required></label><label>Minimum observation period (days)<input name="days" type="number" min="7" max="365" step="1" value="${plan().minimumDays}" required></label><button class="button primary" type="submit">Save plan and recalculate</button><p id="plan-error" role="alert"></p></form><div class="plan-result"><span>TARGET PER VARIANT</span><strong>${number(state.target)}</strong><small>${number(state.target * 2)} users in total</small></div><p class="caption">Saved changes stay in this browser. Changing the target after seeing a result is a planning exercise, not a new confirmatory test.</p></section></div>`;
}

function results(state) {
  const metrics = [{ label: selected.primary, result: state.primary, kind: 'Primary' }, { label: selected.returnLabel, result: state.returning, kind: 'Secondary' }, { label: selected.guardrail, result: state.guardrail, kind: 'Guardrail' }];
  return `${heading('RESULTS', 'Read the range, then the tradeoff.', 'Start with the planned outcome. Look at return use and reported problems before choosing what to do next.')}
  <section class="panel"><div class="panel-heading"><h2>Outcome comparison</h2>${badge(imported ? 'Imported data' : 'Example run')}</div><div class="table-wrap"><table><thead><tr><th>MEASURE</th><th>CONTROL</th><th>VARIANT</th><th>DIFFERENCE</th><th>95% INTERVAL</th></tr></thead><tbody>${metrics.map(m => `<tr><td><strong>${m.label}</strong><small>${m.kind}</small></td><td>${pct(m.result.control)}<small>${m.result.arms[0].successes} / ${m.result.arms[0].total}</small></td><td>${pct(m.result.treatment)}<small>${m.result.arms[1].successes} / ${m.result.arms[1].total}</small></td><td class="mono">${pp(m.result.difference)}</td><td class="mono">${m.result.adequate ? `${pp(m.result.interval[0])} to ${pp(m.result.interval[1])}` : 'Use small-sample method'}</td></tr>`).join('')}</tbody></table></div><p class="caption">Difference = variant − control. Primary intervals use a normal approximation; secondary and guardrail intervals are exploratory and are not adjusted for multiple comparisons.</p></section>
  <div class="bottom-grid"><section class="panel"><div class="eyebrow">ALLOCATION CHECK</div><h2>${state.primary.allocation.flagged ? 'Investigate the group sizes' : 'No allocation flag'}</h2><div class="allocation"><span>Control <b>${number(state.primary.arms[0].total)}</b></span><span>Variant <b>${number(state.primary.arms[1].total)}</b></span></div><p class="small-copy">Expected split 50/50. Chi-square p = ${state.primary.allocation.p.toFixed(4)}. A value below 0.001 triggers review.</p></section><section class="panel"><div class="eyebrow">DECISION NOTE</div><h2>${state.status}</h2><p class="small-copy">${state.note}</p><p class="caption">${imported ? 'Imported rows do not establish assignment quality or follow-up maturity.' : 'The practice runs are generated from visible assumptions in data.js.'}</p></section></div>`;
}

function users(state) {
  const filtered = state.data.filter(row => `${row.userId} ${row.variant}`.includes(search.toLowerCase()));
  const pages = Math.max(1, Math.ceil(filtered.length / 12));
  page = Math.max(1, Math.min(page, pages));
  return `${heading('USER ROWS', 'Keep the denominator visible.', 'One row per assigned person, including people who did not complete a task. Outcomes cover the full observation window.')}
  <div class="toolbar"><input id="search" type="search" value="${esc(search)}" placeholder="Search user ID or variant" aria-label="Search user rows"><button class="button" data-action="export-rows">Export rows</button><button class="button" data-action="import">Import JSON</button>${imported ? '<button class="button" data-action="reset">Use practice run</button>' : ''}<input id="import-file" type="file" accept=".json,application/json" hidden></div>
  <section class="panel"><div class="table-wrap"><table><thead><tr><th>USER</th><th>VARIANT</th><th>TASK COMPLETED</th><th>RETURNED</th><th>PROBLEM REPORTED</th></tr></thead><tbody>${filtered.slice((page - 1) * 12, page * 12).map(row => `<tr><td class="mono">${esc(row.userId)}</td><td>${badge(row.variant, row.variant === 'treatment' ? 'purple' : 'neutral')}</td><td>${row.completed ? 'Yes' : 'No'}</td><td>${row.returned ? 'Yes' : 'No'}</td><td>${row.problem ? 'Yes' : 'No'}</td></tr>`).join('') || '<tr><td colspan="5">No matching users.</td></tr>'}</tbody></table></div><div class="pagination"><span>${number(filtered.length)} users · page ${page} of ${pages}</span><div><button data-action="previous" ${page === 1 ? 'disabled' : ''}>← Previous</button><button data-action="next" ${page === pages ? 'disabled' : ''}>Next →</button></div></div></section><p class="caption">Import schema: userId, variant (control/treatment), completed, returned, and problem. Each outcome is a boolean. Import an assignment-level file with mature outcomes; duplicate users are rejected.</p>`;
}

function notebook() {
  return `${heading('RESEARCH NOTEBOOK', 'A question is only the beginning.', 'The connection between customer understanding, education, and a measurable product change.')}
  <div class="design-grid"><section class="panel prose"><div class="eyebrow">WHY THIS PROJECT</div><h2>From Sentient to NeuroLift</h2><p>Sentient starts with user language. NeuroLift takes the next step: choosing an intervention, agreeing on an outcome, and working through how to measure it.</p><p>The practice workspace uses a consumer AI assistant. The example runs are seeded simulations, created to explore three different readouts: a promising result, an allocation problem, and a result with a cost to investigate.</p><h3>What the examples let you explore</h3><ul><li>A shorter path to a first study quiz.</li><li>More control over a rewritten cover letter.</li><li>A recap that might fit a planning routine.</li></ul></section><section class="panel prose"><div class="eyebrow">HOW TO READ A TEST</div><h2>A few working commitments</h2><ul><li>Count everyone assigned, even if they leave before the task.</li><li>Define the outcome and the observation window before starting.</li><li>Inspect allocation and missing data before interpreting lift.</li><li>Read intervals as ranges, not as a promise of future impact.</li><li>Use repeat visits to ask about sustained value.</li><li>Keep changes to the plan visible.</li></ul><h3>Next in the notebook</h3><p>Add event timestamps and mature-window checks, then evaluate the interval method against a trusted statistics package.</p><a class="text-link" href="/docs/methods.md" target="_blank">Read the statistical methods ↗</a></section></div>`;
}

function savePlan(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const value = { baseline: Number(form.get('baseline')) / 100, effect: Number(form.get('effect')) / 100, minimumDays: Number(form.get('days')) };
  try {
    planSample(value.baseline, value.effect);
    savedPlans[selected.id] = value;
    localStorage.setItem('neurolift-plans', JSON.stringify(savedPlans));
    message = 'Plan saved in this browser.';
    render();
  } catch (error) { root.querySelector('#plan-error').textContent = error.message; }
}

async function importRun(event) {
  try {
    const file = event.target.files[0];
    if (file.size > 15_000_000) throw new Error('Choose a JSON file below 15 MB.');
    imported = validateRows(JSON.parse(await file.text()));
    search = ''; page = 1; message = `${number(imported.length)} assigned users loaded.`;
  } catch (error) { message = `Could not import: ${error.message}`; }
  render();
}

function download(name, value) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

render();
