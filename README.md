# Hassan Uriostegui · Media AI Architecture Lab

[Live demo](https://hassanvfx.github.io/media-ai-architecture-lab/) · [Source repository](https://github.com/hassanvfx/media-ai-architecture-lab)

Created and owned by Hassan Uriostegui.

- **`simulator/`** — React Architecture Lab: source batching → normalization → ElevenLabs audio → human audio approval → Sync lip sync → reassembly → final human approval → delivery. Includes playable reference/local previews, capacity and cost planning, trace replay and 50 inspection questions.
- **`academy/index.html`** — the original offline Principal AI Engineering Academy (legacy general training, separate from the selected simulator architecture).

Start the simulator:

```sh
cd simulator
npm ci
npm run dev
```

See [simulator/README.md](simulator/README.md) for the model, presentation guide, tests and GitHub Pages deployment. The root workflow builds and publishes the simulator and includes the original academy beneath `/academy/`.
