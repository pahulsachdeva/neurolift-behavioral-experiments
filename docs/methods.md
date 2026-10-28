# Measurement notes

## Unit and outcomes

The unit is one assigned user. Each row contains binary indicators for task completion, return use, and a reported problem over a common observation window. Non-completers stay in the denominator. The current import contract is a complete, mature assignment cohort; it does not accept raw event logs or infer missing outcomes.

The practice runs use independent Bernoulli draws for the three outcomes. This makes the arithmetic reproducible but does not model relationships among task success, return use, and reported problems. Allocation and rate assumptions are visible in `apps/web/data.js`.

## Rates and intervals

For each arm, the point estimate is successes divided by assigned users. Its interval is the 95% Wilson score interval. See the [NIST treatment of binomial confidence intervals](https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm).

The estimated treatment effect is the variant rate minus the control rate, in percentage points. Its 95% interval is the unpooled normal approximation:

`difference ± 1.959964 × sqrt(pC(1−pC)/nC + pT(1−pT)/nT)`.

This difference interval is distinct from the Wilson intervals shown for individual arms. The readout flags cases where any arm has fewer than 10 successes or failures. An exact or better small-sample method is a future addition. Confidence intervals express repeated-sampling uncertainty; they are not probabilities that an individual user's behavior will change.

## Allocation

The expected split is 50/50. A Pearson chi-square goodness-of-fit statistic with one degree of freedom is converted to a p-value; values below 0.001 trigger review. The writing seed produces a flagged split. The workspace keeps that case rather than changing the seed to get a tidier result. See [Fabijan et al.'s sample ratio mismatch research](https://www.microsoft.com/en-us/research/publication/diagnosing-sample-ratio-mismatch-in-online-controlled-experiments-a-taxonomy-and-rules-of-thumb-for-practitioners/).

An allocation check passing does not establish randomization, no interference, or correct event collection. The threshold is a diagnostic rule for this workspace.

## Sample planning and decisions

The approximate per-arm target is `ceil(2 × p(1−p) × (z(.975) + z(.80))² / delta²)` for equal groups, binary independent outcomes, a two-sided alpha of .05, and 80% power. It is a planning approximation around the baseline, not a sequential monitoring rule. It does not adjust for clustering, attrition, multiple tests, or repeated looks.

The readout checks allocation, sparse cells, per-arm sample targets, and the planned duration before describing the effect. Imported data needs a review of duration and maturity because neither is present in the row schema. The guardrail review threshold is a one percentage point increase in reported problems. It is a practical threshold, not a formal non-inferiority test.

The primary outcome is defined in advance in the test brief. Return use and guardrail intervals are exploratory; there is no multiplicity adjustment. The app does not declare a winner, stop a test automatically, or deploy a change.


## Invalid numerical inputs

The numerical helpers reject negative, fractional, unsafe, or nonnumeric counts. The Wilson confidence multiplier must be finite and positive; sample-planning inputs must be finite numeric rates. The normal CDF accepts the mathematical infinite tails (0 and 1) and rejects NaN or nonnumeric values.

Summaries apply the same assignment-row contract as the importer and accept only the three documented outcomes. Unknown metric names, duplicate assignments, invalid variants, and string-valued outcomes fail explicitly rather than silently contributing to a misleading rate. These checks do not change the estimators or establish assignment quality or mature follow-up.
