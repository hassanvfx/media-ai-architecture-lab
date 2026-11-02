# Selected workflow and simulation model

## State machine

Receive source → rights → segment → normalize chunk → ElevenLabs audio → **manual audio gate** → Sync → ordered source/language join → reassembly → **manual final gate** → delivery.

Every source interval is preserved. There is no mandatory custom ASR, translation model, self-hosted speech GPU fleet or highlight-extraction branch. ElevenLabs owns managed audio dubbing; Sync receives a source chunk and separate approved audio.

## Catalog and segmentation

Source lengths are sampled independently from execution randomness. Presets use weighted durations with ±20% jitter; the mixed preset centers on 2/5/12/30 minutes at 20/40/30/10%, expected mean 9 minutes. Custom ranges sample uniformly. Fixed duration remains available only for explicitly imported controlled tests.

Arrivals are evenly spaced at an expected rate:

```
source_jobs/s = source_hours/day × 60 / (86400 × expected_mean_source_minutes)
```

Duration partitions use the maximum chunk size. Scene-informed partitions use synthetic variable boundaries between half the cap and the cap, with the final interval ending exactly at source end. Production scene detection is not implemented. Both modes retain contiguous complete coverage. The source captures its manifest, language count, duration and delivery target at admission.

After segmentation, each chunk is normalized, then produces a job for each destination language. The source is English and targets start with Spanish, French and German. The original source duration remains separate from the chunk length.

## Two human gates

The browser never creates approvals from elapsed time, a capacity estimate, a score or an acceptance percentage.

Audio approval requires explicit playback initiation, three checklist confirmations and a named demo reviewer. Its record binds package ID, source version, chunk index, language, audio version and content identifier. A replacement/local file creates a new version. Revisions are bounded and require a reason; rejected chunks hold their source/language batch and prevent further queued Sync submissions for that batch.

Sync enqueue and dispatch both validate the approval. The source chunk and approved audio are separate inputs; `dubParams` is not used. Actual API calls are not implemented.

The join requires every expected chunk exactly once, checks source interval correspondence and complete coverage, and restores manifest order independently of completion order. Late duplicate completions cannot release a second assembly.

A final human decision requires video playback initiation and continuity, lip-sync and soundtrack confirmations. Final approval binds assembly version/hash, source, language and constituent chunk versions/results. Publish enqueue/dispatch rechecks that decision and delivery rechecks rights. Rejecting the assembly holds it for remediation.

These are session-local workflow invariants, not production identity/security guarantees. A typed reviewer name is not authenticated identity.

## Preview artifacts

MP3 reference speech was synthesized locally from original demonstration scripts. MP4 references are waveform videos, not visual lip-sync evidence. Users can attach real files locally. SHA-256 is calculated in the browser; no file is sent to a server. Reference modeled artifact identifiers explicitly start with `simulated:` and are not represented as actual provider file hashes.

## Queues, timing and failures

The simulation advances in integer one-second steps. The opening view warms up for 1,800 simulated seconds with **no approvals**. Reset can start at zero or load a warm baseline.

Application/provider service time:

```
service_seconds = (fixed_overhead + media_minutes × 60 × processing_factor) × U(0.8, 1.2)
```

ElevenLabs and Sync have independent configured concurrency allowances and outages. Provider attempts have a synthetic 2.5% failure probability; bounded retries use exponential backoff with jitter. An outage stops dispatch and fails modeled in-flight attempts. A video failure preserves already approved audio. Processing factors are editable assumptions, not observed provider performance.

Human wait is the actual simulated interval until the user records a decision. Estimated review effort is separate: one minute overhead plus media duration × review factor, charged at the configured reviewer hourly rate. Planned reviewers affect the analytical table and zero staffing blocks approval; staffing does not auto-complete a live review.

Twenty percent of source identities belong to a seeded rights cohort. Revocation holds admission, prevents Sync and blocks delivery. Previously published takedown is not implemented.

## Estimated costs

- ElevenLabs: submitted target-audio minutes × editable estimated dollars/minute.
- Sync: submitted output-video seconds × editable estimated dollars/second at the assumed frame rate.
- Human decisions: `(1 + media_minutes × review_factor) × reviewer_rate / 60` for both gates.
- Application stages: configured per-minute preparation/reassembly/delivery fees plus illustrative $0.50/hour application overhead.

There is no invented idle provider GPU bill. Attempt fees conservatively remain estimated spend; actual provider refunds, minima, frame-based charges and invoices require reconciliation. Defaults are not an account-specific quote.

```
cost_per_delivered_minute = all_modeled_spend / full_program_minutes_released
```

Unfinished, rejected and revised work remains in spend. Individual successful chunks are not delivered programs.

## Analytical planning

Capacity/model estimates sample 512 deterministic source manifests for chunk amplification. Audio approval probability is an independent per-chunk assumption; program-level eligibility requires all chunks. Final acceptance is a separate program-level assumption. Expected costs include audio, accepted-chunk Sync work, both review gates and release volume. Estimates exclude revision loops and retry/refund reconciliation. They do not rank vendor quality or produce live approvals.

## Bounds and limitations

Admission is deferred beyond roughly 3,000 pending tasks or 100 ingest jobs. Event, trace and audit views are bounded. Source/job identifiers are demonstration IDs. In-memory partial joins and decisions are lost on reset/reload.

No actual media splitting, scene understanding, provider calls, rendered lip sync, reassembly, workflow server, durable approval store, authenticated reviewer roles, real webhook delivery, media retention policy or external billing reconciliation is implemented. The public app is a React/GitHub Pages architecture simulator.
