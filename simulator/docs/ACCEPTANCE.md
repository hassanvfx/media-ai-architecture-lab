# Acceptance — batch dubbing with two human gates

## Selected flow

Source → rights → duration/scene-informed partition → chunk normalization → ElevenLabs audio → human audio approval → Sync lip sync → full-program reassembly → final human approval → delivery.

Ten graph stages, two mandatory manual decisions, variable source lengths, ordered source coverage, separate target-language batches and fifty selected-flow inspection questions.

## Automated outcomes

All 40 automated tests pass. The production build succeeds with relative asset paths and packaged reference MP3/MP4 previews.

The tests cover deterministic unattended state; no automatic approval; playback/checklist/name requirements; exact version/hash/source/chunk/language approval; revisions and bounded revision budget; rejection before Sync spend; partial joins; out-of-order reassembly; complete-program duration; final review and rejection; stale final artifacts; local preview versioning; language isolation; zero reviewers; rights before Sync/delivery; provider outages and bounded retries; estimated cost reconciliation; planning/live-decision separation; configuration whitelisting; invalid coverage; duplicate callbacks; source duration/segmentation capture; glossary tokenization and trace commentary.

## Browser verification

Verified a complete local interaction: start an audio preview, confirm checks, approve audio, advance simulated processing, observe reassembly held at final review, start the video preview, confirm final checks, approve and observe delivery. Both approve buttons initially remain disabled. Reference labels are visible and the reference MP3/MP4 files are valid. The checked production preview reported no console errors.

Multi-chunk coverage, missing/rejected chunks, version mismatches, language isolation and duplicate completion behavior are also tested at engine level. Production provider quality is not inferred from these tests.

Additional browser checks verified that a locally loaded MP3 creates audio v2 and resets approval checks, a new run clears prior form state, scene-informed mode updates the process example, and the capacity view contains ten stages. At 390px the document has no horizontal overflow.

## Delivery and scope

The public repository is https://github.com/hassanvfx/media-ai-architecture-lab and GitHub Pages deploys `main` to https://hassanvfx.github.io/media-ai-architecture-lab/.

No real provider calls, clipping, scene detection, lip-sync rendering, reassembly, durable approval service or authenticated review identities are implemented. User-selected preview files stay local to the current browser session. Demo decisions and preview references reset on reload or a new run.
