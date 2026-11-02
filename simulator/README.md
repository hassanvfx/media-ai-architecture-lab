# Hassan Uriostegui · Dubbing & Lip-Sync Architecture Lab

A React browser simulator for this selected, source-verified flow:

**Complete source → ordered chunk batches → per-chunk normalization → ElevenLabs dubbed audio → human audio approval → Sync lip sync → full-program reassembly → final human approval → delivery.**

[Live demo](https://hassanvfx.github.io/media-ai-architecture-lab/) · [Public repository](https://github.com/hassanvfx/media-ai-architecture-lab)

Created and owned by Hassan Uriostegui. It makes no provider requests or paid calls. It does not clip, dub, lip-sync or reassemble actual customer media.

## Run and verify

Node.js 22+ and npm:

```sh
cd simulator
npm ci
npm run dev
npm test
npm run build
npm run preview
```

The GitHub Pages workflow on `main` installs, tests and builds the app, includes the original offline academy under `/academy/`, then publishes the static artifact. Relative asset URLs support repository subpaths.

## Present the workflow

1. Read the process overview and 30-minute worked example. Explain the difference between variable **source duration** and a chosen **maximum chunk duration**.
2. In Model inputs, choose maximum-duration or scene-informed segmentation. Both preserve the complete source; the scene mode uses synthetic boundaries rather than claiming real content analysis.
3. Open **Audio approval**. Play the clearly labeled reference recording, confirm the demo checks and approve it—or load actual dubbed audio locally. Request changes to demonstrate invalidation of a prior version. Rejecting a required chunk holds that source/language batch.
4. Advance the simulation or leave it running. Only audio with matching source/chunk/language/version/hash approval can start Sync.
5. In **Final review**, inspect batch progress. Missing chunks block full-program reassembly. Once all chunks complete, preview the reference waveform video or a real locally loaded assembly, confirm checks, and explicitly approve delivery or hold it.
6. Inspect package traces, capacity estimates, provider/human cost breakdown and the 50 questions under **Inspect**. Planning assumptions never create live approvals.

See [DEMO.md](docs/DEMO.md), [MODEL.md](docs/MODEL.md), [DESIGN_REVIEW.md](docs/DESIGN_REVIEW.md) and [ACCEPTANCE.md](docs/ACCEPTANCE.md).

## Real provider boundary

- [ElevenLabs Dubbing](https://elevenlabs.io/docs/eleven-api/guides/cookbooks/dubbing): source project, target language, completed dubbed audio.
- [Sync manual dubbing](https://sync.so/docs/tutorials/video-dubbing-api-guide): source video chunk plus separately supplied, approved translated audio. **No `dubParams`**, because automatic re-dubbing would bypass the audio review.
- [Sync billing](https://sync.so/docs/product/billing): plan-specific usage and frame-rate effects. Model references use documented legacy rates at 25 fps. The active fee inputs are editable estimates, not an account quote; processing factors and human effort are not measured benchmarks.

Provider access, actual media formats, duration limits, speaker targeting, invoice/refund behavior and editing entitlements need production validation.

## Preview fixtures and local files

The bundled Spanish, French and German MP3 files were synthesized locally for interaction testing, not by ElevenLabs. Their MP4 counterparts are waveform visualizations, not talking-face Sync results. They are visibly labeled. No real provider-output quality is implied.

Users may load audio or video into their own browser. The app calculates a local SHA-256 and resets the review version. Files are not uploaded. Object URLs and review decisions exist only in the current session and are cleared by reset/reload; production needs authenticated reviewers, immutable artifact storage and durable decisions.

## Source structure

- `src/engine.js`: deterministic queues, two manual gates, version invariants, ordered joins, modeled fees and separate planning functions.
- `src/workload.js`: variable source distributions, duration/scene-informed partitions and coverage validation.
- `src/catalog.js`: ten selected stages, provider sources, contracts and scenarios.
- `src/views/ReviewRoom.jsx`: audio and final-video preview/decision screens.
- `src/traceReplay.js` and `components/TraceReplay.jsx`: chronological, chunk-aware snapshots and commentary.
- `src/helpContent.js` and `components/Help.jsx`: contextual explanations and searchable glossary.
- `src/review.js`: 50 current-flow questions, answers and evidence routes.
- `tests/`: outcome and invariant checks, including both gates, source coverage, revisions, rights, failures and costs.

Configuration and inspection progress use local storage. Shared links and imports recreate assumptions, not approvals or previous queues. Fonts have system fallbacks. Local hosting metadata in `.openai` is ignored.
