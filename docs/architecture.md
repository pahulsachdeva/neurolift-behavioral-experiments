# Architecture

The application is a static browser workspace served by a small Node server for local development. It needs no model API or database.

| Module | Responsibility |
|---|---|
| `data.js` | Experiment briefs, visible simulation parameters, deterministic user rows |
| `statistics.js` | Validation, outcome rates, intervals, allocation checks, sample planning |
| `app.js` | Views, selection state, saved plans, JSON imports and downloads |
| `server.js` | Local static file serving with path containment |

Practice runs are computed in the browser. Imports remain in memory, and only plan settings are stored in `localStorage`. Exporting a readout includes its data provenance, plan, metrics, and underlying rows.

A future shared workspace would need authentication, durable plans, versioned event definitions, and an audit trail. That can be added without putting statistical functions inside the interface layer.
