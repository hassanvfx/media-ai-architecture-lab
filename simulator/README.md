# Hassan Uriostegui Architecture Lab

A React application for presenting and interrogating a proposed catalog-scale media AI architecture. Created and owned by Hassan Uriostegui. Entirely browser-side: no inference calls, credentials, backend or customer media.

## Run

Requires Node.js 22+ and npm.

```sh
cd simulator
npm ci
npm run dev
```

From this directory, omit `cd simulator`. Open the printed local URL. `npm test` runs the outcome and acceptance checks; `npm run build` produces `dist/`; `npm run preview` serves the production build.

## Present

1. **System architecture:** describe shared source analysis, locale fan-out, explicit quality gates and final rights checks. Select any stage for suggested tools, contracts and failure boundaries.
2. **Capacity planning:** apply 10× catalog growth and identify offered load above available capacity. Explain why an upstream bottleneck can conceal downstream demand.
3. **Model economics:** run a controlled comparison. Thirty minutes of demand is admitted into each profile, followed by at most three hours of draining. Undrained results are explicitly flagged.
4. **Execution traces:** inspect a delivered or blocked derivative and explain stage service time versus queue wait.
5. **Inspect:** 50 searchable questions across 10 responsibilities, each with an answer, scope statement and evidence navigation. Export the complete Markdown brief.

See [DEMO.md](docs/DEMO.md) for a seven-minute presentation and [MODEL.md](docs/MODEL.md) for mathematical assumptions.

## GitHub Pages

The repository-root `.github/workflows/deploy-pages.yml` is ready for a repository whose default branch is `main`:

1. Push this project, including the repository-root workflow, to your GitHub repository.
2. In **Settings → Pages → Build and deployment**, select **GitHub Actions**.
3. Push to `main` or run **Deploy Pipeline Observatory to GitHub Pages** manually.

The workflow uses Node 22, installs the lockfile, runs tests, builds the app, copies the existing academy into `dist/academy`, uploads the static artifact, and deploys it. The simulator appears at the repository's Pages root and the academy at `/academy/` beneath that root. Relative Vite asset paths work with both repository subpaths and custom domains. There is no client-side history router requiring server rewrites.

Public source: [hassanvfx/media-ai-architecture-lab](https://github.com/hassanvfx/media-ai-architecture-lab). The [live demo](https://hassanvfx.github.io/media-ai-architecture-lab/) is deployed from `main` through GitHub Actions.

Local hosting metadata in `.openai` is ignored and is not included in the repository or deployment.

## Source structure

- `src/engine.js`: deterministic simulation, analytical capacity model, controlled profile comparison.
- `src/catalog.js`: stage topology, contracts, suggested tools, scenario presets and model profiles.
- `src/review.js`: 50 architecture questions and evidence mappings.
- `src/App.jsx`: run controls, configuration, navigation and scenario state.
- `src/components/`: graph, inspector, shared controls and charts.
- `src/views/`: capacity, economics, traces, design rationale and inspection.
- `tests/`: outcome contracts and inspection acceptance coverage.

All stage service times, rates and quality profiles are illustrative model assumptions. Tool recommendations are linked to official documentation. The application is an independent reference architecture by Hassan Uriostegui.

Configuration and manual review progress are saved in browser local storage. Share links and JSON imports recreate parameters, not prior queue state or an edit replay. Fonts are requested from Google Fonts; system fallbacks work when those requests are unavailable.

### Follow one package

Choose **Follow a package** on the architecture canvas, or open **Execution traces**. Select an outcome to pin a recorded package. Use **Play story**, previous/next, the scrubber or a graph node to navigate its spans. Commentary explains the observed route, including cache bypass, parallel analysis, locale fan-out, retries, quality gates and final disposition. Each step includes processing time, queue/backoff time and an expandable proposed contract. Playback is independent of the live simulation and preserves recorded timestamps; it is a replay of completed outcomes, not an in-flight debugger.
