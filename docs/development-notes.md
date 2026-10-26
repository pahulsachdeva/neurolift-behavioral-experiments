# Development notes

## Reading the code

Start in `statistics.js` for the calculations and import contract. `data.js` defines three experiment briefs, the assumptions behind their practice runs, and a seeded generator. `app.js` handles the workspace, plan persistence, file import, and exports. `style.css` uses a navy and blue palette, with an ascending step mark to distinguish NeuroLift from Sentient.

## Choices worth keeping visible

- **Assigned-user denominators.** Leaving before a task is part of the outcome. Filtering to people who completed setup could change the comparison.
- **Separate maths and rendering.** Statistical tests can run without a browser. Exported user rows make the readout independently inspectable.
- **An awkward practice run stays awkward.** The writing seed has an unusual allocation split. The allocation check surfaces it before any outcome interpretation.
- **No user text goes straight into HTML.** Imported identifiers are escaped at the rendering boundary. Outcome and variant values are validated.
- **No persistent imported dataset.** Keeping imports in memory makes resetting the workspace straightforward. Saved sample plans use browser storage and are validated on load.
- **One delegated action listener.** Re-rendering a view should not attach a second copy of its click behavior.

## Remaining work

The statistical suite checks reference values, edge cases, allocation flags, and assignment denominators. Browser interaction and layout still need a full visual pass on a hosted workspace. Add timestamp validation before accepting event-level data. Review the sample approximation and interval coverage against an independent library before extending the analysis beyond the current binary-outcome examples.
