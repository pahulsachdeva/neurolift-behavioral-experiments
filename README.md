<p align="center"><img src="assets/header.svg" alt="NeuroLift — Try a change. See if it helps." width="100%"></p>

A project by Pahul Sachdeva.

## Why I built this

[Sentient](https://github.com/pahulsachdeva/sentient-behavioral-intelligence) helps me turn feedback into a question. NeuroLift helps me decide how to test the answer.

If I change an onboarding flow, how will I know whether it helped? What should I measure? How many people do I need? When should I wait instead of making a decision?

I built this to work through those questions using a consumer AI assistant as the example.

## Three tests to explore

| Test | Change to try | What to watch |
|---|---|---|
| Study | Let people paste notes straight into a quiz starter | Do more people finish their first quiz? |
| Writing | Show the original draft beside the rewrite | Do more people finish their writing task? |
| Planning | Send an optional recap of unfinished plans | Do people return, and do more people complain about notifications? |

The app generates the example data from fixed settings. The same settings give the same rows each time. These are practice runs, with no company customer data or measured business results.

One example has uneven group sizes. Another has more reported problems. I kept these cases because they make the decision harder in a useful way.

## What it does

- Set a starting completion rate, the smallest increase worth testing, and a minimum test length.
- Estimate how many people each group needs.
- Compare completion, return use, and reported problems.
- Check whether the group sizes are far from the planned 50/50 split.
- Read the range around each estimate before choosing a next step.
- Save a decision, explain why, and export it with the results.
- Search user rows or import a JSON file.

A saved decision belongs to that test, dataset, and plan. Changing any of them opens a separate note. Plans and notes save in this browser. Imported rows stay in memory until you reset the run, switch tests, or close the page.

## How to read the results

The app counts everyone assigned to a group, including people who did not finish. It shows each group's rate and the difference between them.

A change from 30% to 35% is an increase of 5 percentage points. The range beside that difference shows uncertainty in the estimate. A good-looking early result is a reason to keep checking the plan, rather than stop the test early.

The sample planner is an approximation for two equal groups. Real tests also need reliable assignment and enough time for everyone to finish the follow-up period. The imported file does not contain dates, so the app asks you to check those yourself.

[Calculation details and references](docs/methods.md)

## Run it

Use Node.js 20.11 or later. No packages or API keys are needed. Open the app on localhost or HTTPS so the browser can identify each dataset.

```bash
npm start
# Open http://localhost:4174
```

```bash
npm run check
npm test
```

## Import user rows

Use one row per person assigned to the test:

```json
[
  {"userId":"u-001","variant":"control","completed":false,"returned":false,"problem":false},
  {"userId":"u-002","variant":"treatment","completed":true,"returned":false,"problem":false}
]
```

Use `true` or `false` for each outcome. Include both groups and give each person a unique ID. Wait until everyone's follow-up period is over before making the file. The importer checks the file format; it cannot check how the test was run.

## Next

I want to add dates so the app can check follow-up time, compare the calculations with a separate statistics library, and connect a reviewed Sentient question to a saved test plan.

[Roadmap](docs/roadmap.md) · [Contributing](CONTRIBUTING.md) · [MIT license](LICENSE)
