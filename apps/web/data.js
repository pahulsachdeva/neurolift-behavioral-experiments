export const experiments = [
  {
    id: 'study', name: 'A faster first study session', area: 'Onboarding', tag: 'STUDY / ACTIVATION',
    question: 'Does a quiz starter help new study users reach their first useful result?',
    source: 'Maya opens the assistant to prepare for an exam but leaves before making a quiz. The first task is clear to her; the starting point is not.',
    hypothesis: 'If new study users can paste notes into a ready-to-use quiz prompt, more will finish a quiz during their first visit.',
    control: 'Current introduction', treatment: 'Quiz starter prompt',
    intervention: 'Replace optional setup steps with a worked example and a direct way to paste notes into a five-question quiz.',
    primary: 'First quiz completed', returnLabel: 'Studied again within 7 days', guardrail: 'Answer-checking problem reported',
    definition: 'One or more generated quizzes completed during the first session, among all eligible users assigned to the test.',
    n: 4800, seed: 29, rates: [.31, .36], returnRates: [.21, .23], problemRates: [.035, .037],
    baseline: .31, effect: .04, minimumDays: 14, completedDays: 14, cost: 'Keep the task short enough to finish in one visit.',
  },
  {
    id: 'writing', name: 'Keep the original in view', area: 'Product education', tag: 'WRITING / CONTROL',
    question: 'Does comparing edits help people finish a writing task?',
    source: 'Jordan wants help with a cover letter but wants it to sound like their own writing. Replacing the whole draft makes that harder to judge.',
    hypothesis: 'Showing a rewrite beside the original may help users accept useful edits while keeping control over their voice.',
    control: 'Replacement draft', treatment: 'Side-by-side edits',
    intervention: 'Show both versions with individual accept and undo controls.',
    primary: 'Writing task completed', returnLabel: 'Wrote again within 7 days', guardrail: 'Unwanted change reported',
    definition: 'A revised draft saved or exported in the first session, among all eligible assigned writing users.',
    n: 1800, seed: 67, rates: [.42, .44], returnRates: [.25, .25], problemRates: [.04, .039],
    baseline: .42, effect: .04, minimumDays: 14, completedDays: 10, cost: 'A more complex editing view may slow mobile users down.',
  },
  {
    id: 'planning', name: 'A reason to come back', area: 'Lifecycle', tag: 'PLANNING / RETURN USE',
    question: 'Does an opt-in morning recap help planning users return?',
    source: 'Sam already plans in a notes app. A recap might connect the assistant to that routine.',
    hypothesis: 'An opt-in recap of unfinished plans may help people return to a useful planning session.',
    control: 'Current home screen', treatment: 'Morning recap',
    intervention: 'Offer a short recap with a link to the unfinished plan, sent only to users who opted in before random assignment.',
    primary: 'Planning task completed', returnLabel: 'Planned again within 7 days', guardrail: 'Notification complaint reported',
    definition: 'A planning task marked complete within seven days of assignment, among all eligible assigned users.',
    n: 4800, seed: 107, rates: [.28, .32], returnRates: [.18, .22], problemRates: [.02, .055],
    baseline: .28, effect: .04, minimumDays: 14, completedDays: 14, cost: 'Extra notifications can become a reason to disengage.',
  },
];

function generator(seed) {
  // Mulberry32 keeps the practice runs reproducible across Node and browsers.
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function generateRun(experiment) {
  const random = generator(experiment.seed);
  return Array.from({ length: experiment.n }, (_, index) => {
    const arm = random() < .5 ? 0 : 1;
    // These independent Bernoulli draws are teaching examples, not a fitted
    // model of real user behavior. Rate assumptions are visible above.
    return {
      userId: `${experiment.id}-${String(index + 1).padStart(5, '0')}`,
      variant: arm === 0 ? 'control' : 'treatment',
      completed: random() < experiment.rates[arm],
      returned: random() < experiment.returnRates[arm],
      problem: random() < experiment.problemRates[arm],
    };
  });
}
