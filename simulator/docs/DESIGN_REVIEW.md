# Adversarial usability review

The first version failed a basic comprehension test: infrastructure appeared before a clear input/output story. “Clips” hid an always-on extraction step, a single duration slider implied that all incoming videos were the same length, and English appeared as a target without an explicit source language.

## Changes guided by the designer review

- Start with the deliverable: English source videos become multilingual dubbed releases. Explicitly choose complete programs or selected highlights.
- Show a worked 30-minute example, including selected source minutes, destination languages and planned aggregate output. Define a clip as a source interval, without inventing clip counts.
- Explain all six processing phases in plain language. Expose detailed contracts, tool suggestions and failure decisions progressively.
- Replace the normal source-duration knob with weighted catalog mixes or custom bounds. Sample each source's actual length; use the expected mean only for planning. Display recently received source lengths.
- Name real destination languages and exclude the source language from translation targets.
- Add contextual metric/control/stage explanations and annotated technical terms, supported by a searchable glossary. Support hover, focus, tap, Escape and outside-click dismissal.
- Keep workload randomness independent of execution randomness. Compare offered catalogs, admitted workloads and deferred inputs, and identify incomplete runs.
- Distinguish the proposed production dubbing chain from the simulated model. An explicit alignment-and-audio-mixing worker now contributes to simulated time, queueing and cost before quality review. Alignment, music/effects mixing, lip synchronization and frame rendering are not complete media-processing implementations in this browser demo.

## Acceptance questions

A viewer should be able to answer: What arrives? What do we deliver? What changes between full dubbing and highlights? What does a clip mean? Why do languages multiply work? Why do source lengths differ? What does each headline metric count? What is simulated versus proposed?
