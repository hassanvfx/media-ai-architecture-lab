# Selected-flow design review

## Product and architecture correction

The earlier topology mixed a custom model stack with managed dubbing. The selected architecture now exposes the real external boundaries: ElevenLabs creates audio; a human approves that audio; Sync receives the exact recording and source video chunk. A combined automatic-dubbing call is deliberately excluded because it would remove the audio approval point.

The user then added complete-source batch clipping before normalization and a final human review after reassembly. The application now follows those requirements consistently in its graph, state machine, controls, costs, traces, process explanation and fifty inspection questions.

## Comprehension and ergonomics

- Start with the full product flow and a numerical source/chunk/language example.
- Separate observed source duration from the selected chunk cap.
- Define clipping as complete-source partitioning, not highlight extraction.
- Label scene boundaries as synthetic in the demo and shot detection as a production boundary hint, not automatic narrative understanding.
- Make both manual stops visible in headline counts, navigation and the graph.
- Provide playable audio and video fixtures with prominent origin labels, plus local-file preview and SHA-256 binding.
- Keep preview initiation, checklist and reviewer input required before an approve action enables.
- Expose approve/revise/reject audio decisions and approve/hold final decisions. Never auto-approve from a score, capacity or elapsed time.
- Keep navigation reachable while a long review form is open. Provide contextual term explanations and searchable glossary.

## Media and provider honesty

The bundled audio is locally synthesized, not ElevenLabs output. Bundled video is a waveform reference with no talking face, not a Sync result. Loading actual local media permits real playback in the browser; it still does not invoke external processing. Model rates and latency are planning assumptions, with verified provider documentation linked beside the relevant contracts.

## Invariants that make the flow reviewable

Audio approval binds package, source version, chunk, language, audio version and content. Replacements require fresh review. The join requires all expected chunks and complete ordered source coverage. Final approval binds the assembly and its constituent chunk lineage. A rejected/missing chunk cannot become partial delivery. Late duplicate chunk results cannot create another assembly. A reset cannot retain a prior form’s checklist/playback state for a new run.
