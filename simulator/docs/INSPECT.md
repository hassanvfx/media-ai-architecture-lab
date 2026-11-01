# Inspect — architecture questions and evidence

50 questions across ten responsibilities. Each answer distinguishes proposed design from simulated behavior.

## 1. Walk me through the system from catalog ingest to accepted delivery.

**Architecture · Interactive**

Land immutable media and a tenant-scoped manifest, enforce rights, and normalize the source. Run speech and visual analysis in parallel, join their evidence into an edit plan, then fan out translation and synthesis per language. Quality gates send uncertain work to human review; approved derivatives pass a fresh rights check before idempotent delivery. Catalog indexing runs asynchronously so search lag does not block localization.

Evidence: The graph, queues and execution traces follow this complete path.

## 2. Where do you draw service boundaries, and why?

**Architecture · Interactive**

Separate the durable control plane from media and model execution. Boundaries follow independent resource constraints and failure domains: CPU normalization, speech GPUs, vision GPUs, external API quotas, human review and publishing. Avoid one service per trivial operation. Keep stages coarse enough to own a useful checkpoint, typed input/output contract, retry policy and operational owner.

Evidence: Each graph stage exposes its contract, resource pool and failure boundary.

## 3. Why a durable workflow engine instead of a queue and a worker?

**Architecture · Design**

A queue delivers work; it does not by itself model a long-running business process with joins, human approvals and recovery. Temporal is the proposed durable coordinator, with side effects inside activities and references to immutable artifacts. SQS plus an explicit state machine or AWS Step Functions are valid alternatives. Compare execution history, limits, operational ownership and workload economics before selecting one.

Evidence: Design rationale and the editorial-stage sketch explain orchestration; this browser does not run Temporal.

## 4. What belongs in the canonical data model?

**Architecture · Design**

Use stable tenant and asset IDs, source hash, source timebase, rights and consent references, transform parameters, locale, model and prompt versions, and immutable artifact locations. Each attempt adds a provider request ID, cost record and trace link. Each derivative preserves its source intervals and approval history. Model workflow state separately from artifact state so an existing file is not mistaken for an accepted output.

Evidence: Stage contracts show the proposed manifest and lineage fields; traces demonstrate a subset.

## 5. How do you add a language, model or output format in days?

**Architecture · Interactive**

Keep a stable orchestration contract and versioned capability adapters. A language adds locale-specific terminology, normalization, pronunciation and evaluation slices; a format adds a validated delivery profile. A provider implements an existing interface with explicit capability differences. Release through contract tests, paired quality evaluation and a bounded canary. Avoid hard-coded provider assumptions in the workflow state model.

Evidence: Language fan-out changes live without repeating source analysis. Production adapter rollout is a design contract.

## 6. Where does this architecture break at 10× volume?

**Scale & capacity · Interactive**

It breaks at the first resource pool whose offered work exceeds service capacity, then shifts as that constraint is relieved. Inspect the capacity table before relying on observed downstream queues: an upstream bottleneck can conceal demand. In the 10× scenario, source preprocessing and inference queues grow. Raise capacity at the measured constraint while preserving admission limits, and reassess the next bottleneck rather than multiplying every service equally.

Evidence: Apply 10× catalog growth and compare offered utilization with observed queue age.

## 7. How do you size the system from business volume?

**Scale & capacity · Interactive**

Start with source hours per day, source-duration distribution, extraction ratio and languages per asset. Convert source volume into asset arrivals, then derive stage task rates and measured service time. Required concurrency is approximately task rate times mean service time; divide by the planned utilization target for headroom. The capacity view uses a 75% planning target and makes the units explicit. Production sizing needs realistic burst and duration distributions.

Evidence: The capacity table computes task rates, service times, offered utilization and required slots.

## 8. What should drive autoscaling for media workloads?

**Scale & capacity · Interactive**

Queue age and pending media work are more informative than raw task count because a thirty-minute asset and a ten-second clip consume different resources. Combine those signals with measured service rate, provider quotas and resource saturation. KEDA is a candidate for event-driven scaling. The simulator scales the speech pool with a sixty-second warm-up and a hard ceiling to expose delayed capacity; its scaling heuristic is deliberately simplified.

Evidence: Enable speech autoscaling in Model inputs → Capacity and watch requested versus ready slots.

## 9. How do you prevent a large tenant from starving everyone else?

**Scale & capacity · Design**

Enforce tenant admission quotas and separate capacity reservations for deadline-sensitive work. Schedule by fair share within service tiers, with aging so low-priority work eventually progresses. Bound retries per tenant as well as globally. The current simulator has a global admission limit but no multi-tenant scheduler; proving fairness would require explicit tenant arrivals, quotas and per-tenant completion measurements.

Evidence: The rights/admission boundary proposes tenant quotas. Multi-tenant fairness is an explicit model limitation.

## 10. What happens when GPU nodes are unavailable or slow to start?

**Scale & capacity · Interactive**

Pending workers do not create usable capacity. Protect in-flight work, bound admission, preserve checkpoints and expose estimated delay while capacity warms. Prefer pre-warmed capacity for tight deadlines; route eligible work to an approved hosted provider if quality, residency and economics permit. Investigate scheduling events, GPU placement constraints and memory pressure separately from application failures.

Evidence: Speech warm-up and capacity ceilings are simulated. Kubernetes scheduling and GPU memory behavior are proposed operational checks.

## 11. How would you choose between building, buying and fine-tuning?

**Model strategy · Design**

Begin with a representative evaluation set and explicit acceptance, latency, privacy and cost constraints. Buy when it shortens delivery and meets those constraints; self-host when measured utilization and control justify the operating burden. Fine-tune only after error analysis shows a repeatable model gap that prompting, terminology and routing cannot address. Document the reversal condition and avoid treating model ownership as a goal by itself.

Evidence: Model strategy is framed as an evidence-driven decision with alternatives, not a vendor endorsement.

## 12. How do you run a credible model bake-off?

**Model strategy · Interactive**

Evaluate baseline and candidate on the same versioned inputs, stratified by language, accent, genre, noise and speaker overlap. Blind human judges where possible and compare acceptance, failure slices, latency and total cost. Predeclare release criteria and retain reproducible artifacts. The economics tab runs a synthetic workload comparison across profiles; it demonstrates the accounting method and cannot replace a real quality benchmark.

Evidence: Run controlled comparison: equal input dimensions, thirty minutes of admission, then a bounded drain.

## 13. How do provider adapters avoid becoming a lowest-common-denominator abstraction?

**Model strategy · Design**

Standardize the guarantees the workflow needs: input and output schema, supported capabilities, asynchronous status, request IDs, idempotency support, usage reporting and failure classes. Keep capability-specific options explicit rather than hiding them behind a generic text call. A router can select an eligible implementation while preserving the complete vendor response for debugging and reconciliation.

Evidence: The synthesis input/output contract and implementation sketch define the adapter boundary.

## 14. How would you route easy and difficult media to different models?

**Model strategy · Design**

Build routing features from measurable input difficulty and calibrated uncertainty, such as noise, speaker overlap, language coverage and terminology risk. Evaluate the router as a complete system against an always-premium baseline. Include routing errors, fallback cost and fairness across language slices. The current simulator selects one profile globally; per-segment routing is a clear extension rather than an implemented feature.

Evidence: Global model profiles and their tradeoffs are simulated. Segment-level routing is a proposed next experiment.

## 15. How would you release a new speech model safely?

**Model strategy · Design**

Version weights, runtime, configuration, pronunciation dictionaries and evaluation data together. Require representative quality and cost gates, shadow traffic if allowed, then canary a bounded eligible cohort with automatic stop conditions. Keep the prior model deployable and preserve enough artifact provenance to identify affected derivatives. A better aggregate score does not justify a regression on a commercially important language or consent-sensitive use case.

Evidence: The proposed rollout contract includes a bake-off, a canary and explicit rollback; production rollout is not simulated.

## 16. What is the cost metric that matters to the business?

**Unit economics · Interactive**

Track total allocatable processing cost per accepted output minute, alongside source-minute cost and completion time. Keep failed attempts, rejected outputs, human review and idle provisioned capacity in the numerator. Accepted output is the useful denominator; gross generated minutes can hide quality failures. During a live run, work in progress distorts unit cost, so compare matched workloads after draining the pipeline.

Evidence: The ledger includes processing, compute, staffed review and delivery; the UI states the denominator and run limits.

## 17. Why can a cheaper model produce a more expensive system?

**Unit economics · Interactive**

Lower per-attempt price can be offset by lower first-pass acceptance, additional review, retries and longer completion time. A reviewer queue can become the bottleneck even when GPU throughput improves. Use Lower-cost model rollout and inspect both accepted-minute cost and the unfinished queue. The controlled comparison makes the effect visible under the same workload dimensions, with synthetic quality assumptions shown explicitly.

Evidence: Economy profile has a lower variable fee and lower synthetic quality; finite human review can erase the apparent savings.

## 18. When does self-hosting beat a hosted API?

**Unit economics · Design**

Compare full cost per accepted minute at realistic utilization, not the listed GPU hourly rate. Include model quality, useful throughput, idle time, engineering support, storage, networking and operational risk. Determine the utilization and volume where the decision changes, then validate under real arrival patterns. The simulator charges provisioned compute and separate illustrative processing fees; those are not current cloud or provider prices.

Evidence: Idle compute is charged in the model. A complete hosted-versus-self-hosted TCO assessment still needs measured benchmarks and contracts.

## 19. Where do batching and caching help, and where can they hurt?

**Unit economics · Interactive**

Batch compatible inference to improve useful GPU throughput, but budget for the waiting time added before a batch fills. Cache immutable intermediate analysis only when tenant, rights, source hash, transform and model versions match. Reuse transcription across locales. This simulator models analysis cache hits and separate source/localization work; it does not model batch formation or GPU memory contention.

Evidence: Change analysis-cache hit rate and language count to see shared work versus multiplied localization demand.

## 20. How would you prove a cost reduction was real?

**Unit economics · Interactive**

Reconcile provider invoices and compute usage to a stage-level ledger, then compare matched workload cohorts with the same quality floor and delivery requirements. Report accepted minutes, failure slices, human effort, latency and the share of unfinished work. Separate variable savings from allocated fixed cost and engineering investment. The demo exports its parameters, cost categories and outcomes so a claimed improvement can be inspected.

Evidence: Export run includes configuration, measured outcomes and cost categories. No real billing reconciliation is claimed.

## 21. What makes a dub good enough to ship?

**Quality & evaluation · Interactive**

Require meaning preservation, correct names and claims, speaker assignment, naturalness, prosody, timing, silence checks and valid rights. Define pass criteria with creative and customer stakeholders, then calibrate automatic checks against representative human judgments. A single automated score is insufficient. The demo uses an explicit synthetic quality score to study capacity and cost consequences, not to claim real perceptual quality.

Evidence: The quality threshold changes acceptance and review demand; the inspector explains the required real-world rubric.

## 22. How do you evaluate whether a short clip is editorially useful?

**Quality & evaluation · Design**

Assess narrative completeness, standalone context, hook, pacing, factual integrity, safe framing, captions and brand fit. Keep source timestamps and evidence behind each selection so an editor can challenge the result. Measure rejection reasons by genre and channel rather than optimizing only engagement proxies. Candidate generation and editorial ranking should be constrained by the allowed transformations and delivery profile.

Evidence: The edit-decision contract carries source intervals and claims; real editorial scoring requires human-labeled examples.

## 23. How do you design the evaluation corpus?

**Quality & evaluation · Design**

Version a stratified corpus covering languages, accents, dialects, noise, overlap, long-form context, proper names, sensitive claims and rights restrictions. Include known failures and hard negatives, with held-out material for release decisions. Keep provenance and annotation criteria, measure reviewer agreement and refresh the corpus when production distribution shifts. Prevent test-set contamination from silently inflating the apparent improvement.

Evidence: The design rationale specifies sliced, versioned evaluations. No real golden media corpus is bundled in this simulation.

## 24. What can WER, MOS and an LLM judge actually tell you?

**Quality & evaluation · Design**

WER measures word-level transcription errors against a reference; it does not measure naturalness or voice performance. MOS summarizes subjective ratings under a defined listening protocol. A model judge can apply a rubric at scale but needs calibration against human judgment and checks for bias and drift. Use task-specific evidence and report disagreement; never rename a generic model score as a validated metric.

Evidence: The quality-stage failure boundary distinguishes synthetic score, transcription accuracy and perceptual acceptance.

## 25. How do you decide what requires human review?

**Quality & evaluation · Interactive**

Route uncertainty, high-impact claims, low-confidence alignment and consent-sensitive cases to qualified reviewers. Keep deterministic failures out of an undifferentiated approval queue. Measure review latency, agreement, rejection reasons and reviewer capacity; define an accountable override path. In this model, scores below threshold enter a bounded reviewer pool, so increasing the threshold visibly trades automatic throughput for human workload.

Evidence: Adjust acceptance threshold and reviewer count; watch queue age, delivered volume and cost.

## 26. A provider timed out after charging. What do you do?

**Reliability · Design**

Treat the result as ambiguous rather than automatically failed. Persist the provider request ID and reconcile status or existing artifacts before repeating paid work when the provider supports it. Use stable logical keys, deadlines and an explicit reconciliation state. The simulator exercises bounded transient retries and outage fallback; vendor reconciliation is documented but not executed against a real provider.

Evidence: The synthesis sketch describes reconciliation. The demo does not claim that retries alone prevent duplicate billing.

## 27. How do you avoid a retry storm?

**Reliability · Interactive**

Classify transient, permanent, ambiguous and quality failures separately. Apply exponential backoff with jitter, per-stage and per-tenant budgets, deadlines, provider rate limits and circuit breakers. Do not scale uncontrollably in response to retries. The simulation charges each speech attempt, defers retries with jitter, stops at the configured attempt budget and quarantines exhausted work.

Evidence: Retry budget and outage controls affect real simulated queue transitions and costs.

## 28. How does a workflow resume without repeating the whole catalog?

**Reliability · Design**

Checkpoint immutable outputs at stage and segment boundaries, with input hash, parameters, model version and rights context. On recovery, validate the stored artifact and replay only missing or invalid work. Keep a durable record of side effects separately from task completion. The trace view demonstrates lineage and the join boundary; cross-process persistence and recovery are architectural contracts beyond this in-memory demo.

Evidence: Per-stage spans and locale lineage are inspectable. Reloading the browser starts a new simulation, not durable recovery.

## 29. Can you guarantee exactly-once delivery?

**Reliability · Design**

State the scope carefully. At-least-once task execution can produce one logical publication when the destination supports stable idempotency keys or reliable reconciliation. Across a broker, object store and third-party publisher, universal exactly-once behavior is not automatic. Use an outbox for transactional event publication, retain delivery receipts, and reconcile ambiguous outcomes rather than simply retrying an irreversible side effect.

Evidence: The publisher contract specifies stable keys and receipts. Real external deduplication is not asserted by the simulator.

## 30. How does the system degrade when a model provider is down?

**Reliability · Interactive**

Stop dispatch to the unavailable dependency while preserving queued work and checkpoints. Route eligible work to an approved fallback with known quality, region and cost characteristics, or defer it with an honest completion estimate. Do not silently weaken rights or quality requirements. The outage scenario pauses primary speech capacity; enabling fallback resumes work under a slower, more expensive service profile.

Evidence: Apply Speech-provider outage, then enable Approved fallback and inspect recovery, queue age and unit cost.

## 31. Where do voice consent and content rights enter the workflow?

**Enterprise & rights · Interactive**

They enter at ingest as versioned, authoritative metadata and constrain admission, permitted transformations and external-provider transfer. Recheck before publishing because authorization can expire during execution. Media redistribution rights do not automatically imply voice-cloning permission. The graph demonstrates admission and final-delivery gates; a production policy service must resolve the full contract-specific rights envelope.

Evidence: Rights revocation blocks a seeded asset cohort at admission and final delivery.

## 32. What happens after a license or voice consent is revoked?

**Enterprise & rights · Interactive**

Prevent future unauthorized processing, re-evaluate in-flight derivatives, and use lineage to find published assets, caches, indexes and provider copies that need action. Track takedown and deletion acknowledgments, exceptions and retention obligations. The simulator implements admission and final-publication holds; it deliberately does not claim post-publication takedown or deletion of real third-party content.

Evidence: Rights holds are visible in outcomes and traces. Post-publication remediation remains a separate operational workflow.

## 33. How do you isolate unreleased enterprise catalogs?

**Enterprise & rights · Design**

Use tenant-scoped object access, short-lived credentials, encryption, server-side authorization, database row policies and isolated cache keys. Restrict provider transfer by residency and contractual policy, and audit access to source and derivative artifacts. Avoid carrying media bytes or sensitive content in logs. This is a proposed security architecture; the demo handles synthetic identifiers and never uploads customer media.

Evidence: The design and contracts describe isolation. No production security or compliance certification is implied.

## 34. How do you turn legal and creative requirements into technical controls?

**Enterprise & rights · Design**

Translate each requirement into an owner, a machine-readable policy or acceptance rule, evidence needed, a failure state and an approved exception process. Examples include territory restrictions, voice authority, prohibited edits, mandatory disclosures and brand terminology. Confirm ambiguous requirements with accountable stakeholders before automation. Rights authority comes from documented policy and consent, not an ML classifier.

Evidence: The policy stage defines explicit allow conditions and non-retryable denial; production rules require stakeholder agreement.

## 35. What should an enterprise audit trail let you reconstruct?

**Enterprise & rights · Interactive**

Reconstruct who requested the work, the source and rights version, every transformation and provider, model and prompt versions, quality and human decisions, costs, and the delivered derivatives and destinations. Correlate changes and revocations without exposing restricted content unnecessarily. The execution trace demonstrates stage timing and source-to-locale lineage; identity, signatures, retention and immutable audit storage remain production concerns.

Evidence: Open a completed derivative to inspect its actual stage history, locale, review outcome and latency.

## 36. When would you remux instead of transcode?

**Media engineering · Design**

Remux when encoded streams already satisfy the destination and only the container or packaging needs to change. Transcode when codec, profile, bitrate, geometry or frame rate must change, accepting the compute cost and possible generation loss. Probe inputs first and validate the output stream layout, duration and synchronization. The proposed FFmpeg stage makes those decisions explicit; no actual video is processed in this browser.

Evidence: The normalization inspector includes ffprobe and FFmpeg sketches and resource limits.

## 37. How do you preserve synchronization and accurate source timestamps?

**Media engineering · Design**

Retain source presentation timestamps and the mapping through normalization, trimming, frame-rate conversion and encoding. Align transcript words and speaker turns to that timeline, and validate audio/video duration and offset after packaging. Avoid treating nominal frame rate as a universal clock, especially for variable-frame-rate inputs. A derivative should cite exact source intervals rather than approximate whole-asset references.

Evidence: The proposed pts_map and EDL fields preserve the timing contract; real media timing is outside the synthetic engine.

## 38. Why are diarization and speaker identity separate from transcription?

**Media engineering · Design**

A transcript answers what was said; diarization assigns who spoke when. Dubbing also needs consistent voice assignment, overlap handling, pronunciation and permission for the chosen voice. A correctly recognized sentence can still be rendered by the wrong speaker. Evaluate speaker attribution and voice consistency separately from WER, and escalate uncertain turns rather than silently assigning a voice.

Evidence: The speech stage proposes faster-whisper and pyannote.audio with separate word and speaker-turn outputs.

## 39. How do you handle translation expansion without ruining the dub?

**Media engineering · Design**

Preserve meaning, protected names and brand terminology, then align the translated segments to explicit timing budgets. Rephrase under semantic constraints, adjust pauses or revise the edit where allowed; avoid uncontrolled speed changes to force every language into the same duration. Evaluate prosody and intelligibility with human listening. Keep the translation, timing decision and synthesis version in the derivative manifest.

Evidence: The translation contract includes glossary version, pronunciation and timing budget.

## 40. How do you extract compelling clips instead of visually attractive noise?

**Media engineering · Design**

Generate time-bounded candidates from transcript structure, speaker turns, visual events and narrative beats. Rank for standalone clarity, hook, context integrity, platform constraints and brand fit, then validate boundaries against evidence. Shot detection supplies useful segmentation but does not identify a meaningful story by itself. Preserve human editorial overrides and analyze rejection reasons to improve the selection policy.

Evidence: Parallel speech and vision evidence join into a constrained edit-decision plan; subjective ranking remains a proposed evaluation task.

## 41. How do you make catalog content discoverable and citable by AI?

**Search & observability · Design**

Index timecoded segments with transcript, summaries, embeddings, tenant permissions, rights and links to canonical source passages. Combine lexical retrieval for exact entities with semantic retrieval, then rerank and return precise citations. Keep source and localized versions linked and deduplicate overlapping results. The graph includes an asynchronous indexing branch; real search ranking and citation accuracy need their own benchmark.

Evidence: The Qdrant-based retrieval contract describes hybrid search and source-time citations.

## 42. How does retrieval enforce permissions and handle stale content?

**Search & observability · Design**

Apply tenant, asset and current-rights filters before revealing snippets, thumbnails or signed download URLs. Propagate deletions and revocations into indexes, derived caches and translations, and track index version and freshness. Never assume a vector database automatically supplies authorization. The current model represents index completion counts; it does not simulate search queries, tombstones or access-control evaluation.

Evidence: Indexing is explicitly separate from delivery and includes an authorization and invalidation design.

## 43. What SLO would you commit to?

**Search & observability · Interactive**

Define the customer outcome and cohort first: for example, eligible accepted jobs delivered within an agreed deadline, over a specified window and workload envelope. Specify failure treatment, exclusions and measurement ownership before choosing a percentage. The demo shows delivered-output deadline attainment, pending age and p95 separately; delivered-only success is not a complete arrival-cohort SLO and is labeled accordingly.

Evidence: Metric labels and model notes disclose denominator bias; queue age exposes unfinished work hidden from delivered-only p95.

## 44. Which dashboards and alerts would you use to operate this platform?

**Search & observability · Interactive**

Use three views: business delivery and acceptance, reliability and queue age, and unit economics. Trace source asset through locale fan-out and provider requests; alert on deadline risk, oldest work, failure-budget burn and abnormal spend. Prefer actionable symptoms over arbitrary CPU thresholds. The live event stream, stage metrics, trace waterfall and cost ledger demonstrate these views with simulated data.

Evidence: Execution traces, event filters, observed metrics and cost categories all come from the simulation engine.

## 45. What do your first ten minutes of an incident look like?

**Search & observability · Execution plan**

Establish customer impact, affected tenants and deadline risk, then identify whether work is blocked at admission, orchestration, provider calls, compute scheduling or publication. Protect data and paid progress, stop retry amplification, and choose the safest reversible mitigation. Assign incident ownership and communicate a concrete next update. Use traces and queue age to validate recovery; follow with a blameless review and a measurable prevention action.

Evidence: The outage scenario, queue metrics and traces support diagnosis. Real incident communication and ownership require an operating process.

## 46. What would you deliver in the first ninety days?

**Principal-level execution · Execution plan**

First establish the real workflow, ownership, customer commitments and baseline quality, latency and cost. Ship a bounded roadmap feature while learning the failure modes. Run a structured model bake-off with documented release criteria, then write a measured 10× architecture review and phased plan. Deliver evidence and a reversible improvement before proposing a broad rewrite.

Evidence: This ninety-day execution plan proposes measurable milestones; production delivery remains to be validated.

## 47. How would you resolve disagreement between creative, product and engineering?

**Principal-level execution · Execution plan**

Translate the disagreement into testable acceptance criteria and a decision with an owner and deadline. Use blinded representative examples, distinguish objective failures from creative preference, and document the options, uncertainty, costs and rollback. If evidence is incomplete, choose a bounded reversible release or explicitly defer the risky slice. Do not substitute an automated score for creative judgment or leave the decision owner unclear.

Evidence: The quality design and model comparison provide a shared decision structure; organizational judgment must be explained in discussion.

## 48. What belongs in your architecture decision record?

**Principal-level execution · Execution plan**

Record the concrete problem, constraints, workload assumptions, alternatives, selected approach, evidence, expected operational cost, risks, owner and reversal condition. Include the interfaces other engineers need and the measurements that will invalidate the decision. Keep it short enough to review but precise enough to implement. A provider choice should be revisitable without discarding the canonical workflow contracts.

Evidence: The Design rationale view presents decisions, alternatives and tradeoffs. A production ADR would add measured evidence and named owners.

## 49. What evidence establishes implementation readiness?

**Principal-level execution · Execution plan**

Inspect the simulation engine, trace the fan-out/join and failure transitions, and run the outcome tests. For production readiness, require implemented integration contracts, representative workload benchmarks, recovery drills and measured quality and cost. Record ownership and release criteria. Distinguish demonstrated behavior from proposed safeguards; this browser model alone cannot establish production readiness.

Evidence: The repository contains a pure simulation engine and outcome tests. Production integrations and operational readiness require separate validation.

## 50. What would you build next, and how would you know this proposal is wrong?

**Principal-level execution · Execution plan**

Validate the largest uncertainty first: benchmark representative media, measure real quality and review demand, and reconcile true provider and infrastructure cost. Then add the missing production-critical dimensions such as tenant fairness, deadline-aware scheduling, provider reconciliation and revocation propagation. Reject or revise the design if measured service rates, acceptance rates or operating complexity fail the customer envelope. The useful result is a falsifiable decision, not a permanent diagram.

Evidence: Capacity assumptions, synthetic quality, economic rates and model limitations are visible so the proposal can be challenged.
