<p align="center"><img src="assets/header.svg" alt="NeuroLift — AI Enablement Marker" width="100%"></p>

<p align="center">Project 02 by Pahul Sachdeva · Behavioral experimentation and measurement</p>

## Why I'm building this

In [Sentient](https://github.com/pahulsachdeva/sentient-behavioral-intelligence), I started with a question about customer feedback: what can a conversation tell us about why someone struggles to use an AI product?

NeuroLift is the next part of that question. Once I have an idea for helping someone, how would I test whether it helps? What should I measure, how long should I wait, and what would make me reconsider the change?

I work in AI Enablement and Customer Sentiment at EliseAI. I'm interested in how customer education connects to activation, independent use, and the reasons people return. This project gives me a place to build the measurement side of that work.

## The example I'm using

I'm continuing with a **B2C SaaS AI assistant** used for studying, writing, planning, and learning to code. I created the user stories and practice runs for this project so I could explore the idea without using my company's internal examples.

The workspace includes three experiments. Their user rows are generated from fixed seeds and visible rate assumptions, so I can reproduce the calculations and work through different decisions.

| Test | Product change | Outcome to start with | What the example helps me explore |
|---|---|---|---|
| A faster first study session | Let users paste notes straight into a quiz starter | First quiz completion | A promising estimate, its uncertainty, and what to check next |
| Keep the original in view | Show a rewrite beside the user's original draft | Writing task completion | An allocation mismatch that needs investigation before interpreting lift |
| A reason to come back | Offer an opt-in morning recap of unfinished plans | Planning task completion | A useful outcome that comes with more notification complaints |

## One test, worked through

Maya wants to study for an exam. She opens the assistant, sees several setup steps, and leaves before creating a quiz. In Sentient, that becomes a question about effort and unclear guidance.

In NeuroLift, I turn it into a test: give eligible new study users a starter prompt that turns their notes into five quiz questions. Compare that with the existing introduction.

I define quiz completion as the main outcome and count everyone assigned, including people who leave. I also look at whether they study again within seven days and whether they report trouble checking answers. That lets me consider the first useful result, sustained value, and a possible cost together.

The sample planner sets a target before the readout. The results view shows the estimated difference and its interval, then checks the plan and allocation before suggesting what to look at next.

## What you can do

- Switch between the three experiment questions.
- Read the hypothesis, intervention, outcome definition, and practical tradeoff.
- Adjust a baseline and the smallest useful effect to plan a sample.
- Compare completion and return use alongside a guardrail.
- Inspect the users behind each denominator and search by ID or variant.
- Import assignment-level JSON and export a readout or the underlying rows.

Plans save in the browser. Imported datasets stay in memory until the workspace is reset or closed.

## How the measurement works

The analysis uses one row per assigned person and two equally allocated variants. It calculates completion rates, Wilson intervals for each arm, an approximate interval for their difference, and a sample ratio check. The planner uses an equal-arm approximation with 80% power and a two-sided 5% test.

The code keeps those calculations separate from the interface. Comments explain the denominator, the allocation threshold, and when a normal approximation needs a different method. [Methods and references](docs/methods.md) cover the details.

I use the practice runs to examine a decision, rather than to claim a product improvement. A real test would also need trustworthy assignment, event timestamps, complete follow-up, and a plan agreed before examining the outcome.

## Run locally

Use Node.js 20 or later. There are no packages to install or API keys to configure.

```bash
npm start
# Open http://localhost:4174
```

```bash
npm run check
npm test
```

To try an import, use a JSON array with one row per assigned person:

```json
[
  {"userId":"u-001","variant":"control","completed":false,"returned":false,"problem":false},
  {"userId":"u-002","variant":"treatment","completed":true,"returned":false,"problem":false}
]
```

Use a complete assignment cohort with outcomes measured over the same window. The importer checks the schema and rejects duplicate user IDs; it cannot establish how the file was collected.

## Where I'm taking it next

The next pieces are event timestamps and mature-window checks, an independent comparison with a statistics library, and a hosted workspace. After that, I want to connect a reviewed Sentient insight directly to a saved NeuroLift plan.

[Development notes](docs/development-notes.md) · [Architecture](docs/architecture.md) · [Roadmap](docs/roadmap.md) · [Contributing](CONTRIBUTING.md) · [MIT license](LICENSE)
