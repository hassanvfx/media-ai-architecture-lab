# Inspect — selected provider flow

Fifty questions about ordered batches, ElevenLabs audio, human approval, Sync lip sync, reassembly and final human release.

## 1. What enters and what leaves this pipeline?

**Process & boundaries · Interactive**

A complete English-language source video enters with rights and a duration. It is partitioned without discarding content, normalized per chunk and dubbed into each destination language. Human-approved audio drives Sync. All required chunks are reassembled, and a second human decision releases one complete localized program per language.

Evidence: Inspect the selected stage’s queue, failure policy and contract. Linked provider documentation describes the real interface; execution is simulated.

## 2. Why use ElevenLabs and Sync as separate calls?

**Process & boundaries · Interactive**

The selected design needs a human decision after audio generation but before visual rendering. ElevenLabs creates the recording first; Sync later receives that exact recording and the matching source interval. A combined automatic-dubbing call would remove this approval boundary and could create audio the reviewer never heard.

Evidence: Inspect the selected stage’s queue, failure policy and contract. Linked provider documentation describes the real interface; execution is simulated.

## 3. Why are there two human gates?

**Process & boundaries · Interactive**

The first gate reviews the recording: meaning, voice and timing. The second reviews the complete reassembled video: continuity, lip movements and soundtrack. Approval at one gate does not substitute for the other. Both require explicit user actions in the simulator, and delivery has a separate final approval invariant.

Evidence: Open Audio approval, start a reference or local preview, inspect the version binding and record an explicit approve, revise or reject decision.

## 4. Which work belongs inside ElevenLabs?

**Process & boundaries · Interactive**

Source transcription, translated audio generation and speaker handling are part of the managed dubbing boundary. The app retrieves and versions the output rather than presenting a mandatory custom transcription, translation and speech-serving stack. Provider adapters still have to respect the actual account features and failure semantics.

Evidence: Inspect the selected stage’s queue, failure policy and contract. Linked provider documentation describes the real interface; execution is simulated.

## 5. What is simulated versus implemented here?

**Process & boundaries · Design**

The browser implements queues, source manifests, version-bound manual decisions, joins, estimated costs and recorded traces. It provides reference playback and local-file playback. It does not run media clipping, ElevenLabs, Sync, a durable workflow engine or authenticated review storage. The linked contracts describe production integration.

Evidence: Design rationale distinguishes the selected managed-provider architecture, verified interfaces and production requirements not implemented by this browser.

## 6. Does clipping discard source material?

**Segmentation & media · Interactive**

No. Clipping in this workflow partitions the complete source into ordered intervals. It is not highlight extraction. The manifest must cover the original duration contiguously, and reassembly verifies that coverage. This distinction matters because a successful short clip is not a successful complete-program delivery.

Evidence: Inspect the selected stage’s queue, failure policy and contract. Linked provider documentation describes the real interface; execution is simulated.

## 7. How do maximum-duration and scene-informed modes differ?

**Segmentation & media · Interactive**

Duration mode creates regular intervals capped at the chosen length. Scene-informed mode prefers variable content boundaries while enforcing the same maximum. The browser supplies synthetic boundaries to demonstrate batching. A production detector must supply real timestamps; shot transitions alone do not establish narrative or sentence boundaries.

Evidence: Inspect the selected stage’s queue, failure policy and contract. Linked provider documentation describes the real interface; execution is simulated.

## 8. Why split before normalization?

**Segmentation & media · Interactive**

The chosen processing order creates an immutable interval manifest first, then prepares each interval for the providers. This permits bounded media work and chunk-specific retries while preserving complete source identity. Production cutting must account for codec keyframes, timestamps and exact boundaries rather than assuming every stream-copy cut is sample-accurate.

Evidence: Inspect the selected stage’s queue, failure policy and contract. Linked provider documentation describes the real interface; execution is simulated.

## 9. How do variable source lengths affect work?

**Segmentation & media · Interactive**

Each admitted source receives its own sampled length from the catalog mix. Longer inputs produce more chunks and review decisions; the chunk cap does not shorten the assembled program. Capacity uses expected length and sampled expected chunk counts, while actual queued jobs and estimated provider fees use each chunk’s captured duration.

Evidence: Capacity planning separates source jobs, chunk-language work, external provider allowances, application workers and both human-review gates.

## 10. What if one chunk is missing or overlaps another?

**Segmentation & media · Interactive**

The reassembly join waits for every expected index and validates contiguous start/end coverage. A missing interval, duplicate completion or overlap cannot produce a final review candidate. This protects source completeness independently of whether each provider job returned a nominally successful status.

Evidence: Inspect the selected stage’s queue, failure policy and contract. Linked provider documentation describes the real interface; execution is simulated.

## 11. What is the ElevenLabs request boundary?

**ElevenLabs audio · Interactive**

A prepared source chunk is associated with a dubbing project and target-language audio jobs. The documented workflow prepares a source project, creates language targets, waits for completion and downloads the dub. A production adapter should reuse that project across languages and preserve provider identifiers, audio versions and content hashes.

Evidence: Inspect the selected stage’s queue, failure policy and contract. Linked provider documentation describes the real interface; execution is simulated.

## 12. Do we need to mix a separate audio soundtrack ourselves?

**ElevenLabs audio · Design**

Not as an assumed mandatory duplicate of managed dubbing. ElevenLabs Dubbing provides translated audio, with its documented background-audio behavior. The selected architecture reviews that output before Sync. If a particular delivery profile needs another mix or multichannel restoration, make it an explicit adapter requirement and validate the provider output.

Evidence: Design rationale distinguishes the selected managed-provider architecture, verified interfaces and production requirements not implemented by this browser.

## 13. How is a requested audio revision handled?

**ElevenLabs audio · Interactive**

A request for changes records reviewer notes and consumes a bounded revision budget. The current package returns to modeled audio generation with a new version and without any prior approval. The replacement must be previewed again. Actual transcript editing or segment regeneration depends on ElevenLabs account entitlements and cannot be assumed for every plan.

Evidence: Open Audio approval, start a reference or local preview, inspect the version binding and record an explicit approve, revise or reject decision.

## 14. What if ElevenLabs becomes unavailable?

**ElevenLabs audio · Interactive**

New audio dispatch stops and modeled in-flight audio attempts fail. Bounded retries preserve source, chunk and language identity. Previously approved audio can continue to Sync if that provider remains healthy. The design does not regenerate approved recordings merely because another provider is unavailable.

Evidence: Inspect the selected stage’s queue, failure policy and contract. Linked provider documentation describes the real interface; execution is simulated.

## 15. Can a cheaper dubbing fee determine our quality choice?

**ElevenLabs audio · Interactive**

No. Fees are only one part of the estimate. Evaluate actual multilingual meaning, pronunciation, voice, timing, review effort and revision demand on representative recordings. The simulator’s input rates and processing factors are editable assumptions; no vendor quality ranking or measured benchmark is inferred from them.

Evidence: Model economics shows actual simulated spend separately from analytical expectations; no planning assumption creates a live approval.

## 16. What exactly does an audio approval authorize?

**Human audio approval · Interactive**

It authorizes one source version, chunk, destination language, audio version and content identifier. The record includes reviewer, checks, notes and simulation time. Sync submission checks that these values still match the current artifact. A mutable filename or an older approval cannot authorize a replacement recording.

Evidence: Open Audio approval, start a reference or local preview, inspect the version binding and record an explicit approve, revise or reject decision.

## 17. Can the live model approve audio automatically?

**Human audio approval · Interactive**

No. Review capacity, expected acceptance percentages and elapsed time never generate a live approval. The reviewer must start the preview, confirm meaning, voice and timing, and explicitly approve. Analytical planning assumptions remain separate from the actual decision path, so increasing a percentage cannot bypass this gate.

Evidence: Open Audio approval, start a reference or local preview, inspect the version binding and record an explicit approve, revise or reject decision.

## 18. What happens when audio is rejected?

**Human audio approval · Interactive**

The rejected chunk cannot enter Sync. Its source/language batch is held because a complete program needs every interval. Further queued Sync work for that held batch is prevented; already incurred costs remain visible. This is different from quietly publishing the other successful chunks as a partial localized program.

Evidence: Open Audio approval, start a reference or local preview, inspect the version binding and record an explicit approve, revise or reject decision.

## 19. What do the bundled audio previews prove?

**Human audio approval · Interactive**

They demonstrate playback and review interaction only. The short samples were synthesized locally and are not ElevenLabs outputs or translations of the simulated sources. The interface states that explicitly. A user can load a real local dubbed file, whose SHA-256 is calculated in the browser and bound to the reviewed version.

Evidence: Open Audio approval, start a reference or local preview, inspect the version binding and record an explicit approve, revise or reject decision.

## 20. Is a typed reviewer name production authentication?

**Human audio approval · Design**

No. It is a session-local demonstration record. A production review service needs authenticated identity, authorization, durable audit records, artifact access controls and revocation behavior. The browser exercises the version and decision invariants but does not claim to implement organizational identity or durable acceptance.

Evidence: Design rationale distinguishes the selected managed-provider architecture, verified interfaces and production requirements not implemented by this browser.

## 21. What are the exact inputs to Sync?

**Sync lip synchronization · Interactive**

The selected path supplies the matching source video chunk and the human-approved translated audio as separate inputs. The Sync job retains the approval identifier and audio version/hash. It does not use dubParams, because combined automatic dubbing would generate audio inside the video job and bypass the required audio review.

Evidence: Inspect the selected stage’s queue, failure policy and contract. Linked provider documentation describes the real interface; execution is simulated.

## 22. Is visual lip sync the same as audio timing?

**Sync lip synchronization · Interactive**

No. Audio dubbing creates another spoken-language track. Visual lip sync modifies visible mouth movements to correspond to that supplied audio. The provider boundary is Sync’s documented video-plus-audio operation; a later final human review still has to assess visual artifacts, continuity and the complete soundtrack.

Evidence: Inspect the selected stage’s queue, failure policy and contract. Linked provider documentation describes the real interface; execution is simulated.

## 23. Why are provider slots not local GPU slots?

**Sync lip synchronization · Interactive**

The external provider controls its rendering infrastructure. Our system limits submitted jobs according to the account allowance and handles queueing, failures and callbacks. Local media preparation has application workers. Modeling a self-hosted inference fleet would be a different architecture and would invent costs the selected managed path does not own.

Evidence: Capacity planning separates source jobs, chunk-language work, external provider allowances, application workers and both human-review gates.

## 24. How should differing audio and video durations be handled?

**Sync lip synchronization · Design**

Validate the reviewed audio against the source interval and configure the provider’s mismatch behavior deliberately. Sync documents modes that can cut, pad or repeat content. Blindly selecting one can lose speech or alter program timing. Production adapters must preserve the intended timeline and route unacceptable mismatches for correction.

Evidence: Design rationale distinguishes the selected managed-provider architecture, verified interfaces and production requirements not implemented by this browser.

## 25. How do multiple speakers affect lip sync?

**Sync lip synchronization · Design**

Speaker targeting and time-range mapping must be explicit where needed. Sync documents segment and speaker controls; the correct input depends on the source composition and account/model support. This simulator tracks chunk identities and approvals but does not perform face detection, speaker attribution or real visual-quality evaluation.

Evidence: Design rationale distinguishes the selected managed-provider architecture, verified interfaces and production requirements not implemented by this browser.

## 26. What identifies a reassembly batch?

**Reassembly & final release · Interactive**

A batch is keyed by original source identity/version and destination language, with an expected ordered chunk manifest. Different languages are never joined together. The join collects exactly one successful lip-sync result per required interval and validates full source coverage before creating a final-review candidate.

Evidence: Open Final review to inspect partial batches, assembled program lineage and the second mandatory human release decision.

## 27. Can chunks finish in a different order?

**Reassembly & final release · Interactive**

Yes. Different lengths, quotas and retries can produce out-of-order completion. The join uses manifest indices and source timestamps rather than completion order. The reassembled program must restore the original timeline and preserve each chunk’s reviewed audio lineage, regardless of which provider job finished first.

Evidence: Open Final review to inspect partial batches, assembled program lineage and the second mandatory human release decision.

## 28. What does the second reviewer check?

**Reassembly & final release · Interactive**

The final reviewer previews the complete assembled video and checks continuity, visible mouth movements, faces, soundtrack and timing. The final decision is bound to the assembly version/hash and all constituent chunk results. This is a separate release decision, not an automatic consequence of a successful audio review.

Evidence: Open Final review to inspect partial batches, assembled program lineage and the second mandatory human release decision.

## 29. What happens after final-video rejection?

**Reassembly & final release · Interactive**

The complete video is held for remediation and is not delivered. Provider and review costs already incurred remain in the ledger. A production workflow should route the issue to the appropriate chunk or assembly repair, preserving approved audio where possible and requiring a fresh decision for any changed final artifact.

Evidence: Open Final review to inspect partial batches, assembled program lineage and the second mandatory human release decision.

## 30. Can a different video be delivered under an old approval?

**Reassembly & final release · Interactive**

The delivery boundary verifies assembly version, video content identifier, source version and a fingerprint of the constituent chunk versions and Sync results. A changed local preview produces a new version and resets the review. Stale or mismatched final approval is rejected before the publish stage can run.

Evidence: Open Final review to inspect partial batches, assembled program lineage and the second mandatory human release decision.

## 31. How do we avoid retry storms?

**Reliability & recovery · Interactive**

Use bounded attempt counts and increasing backoff instead of immediate unbounded resubmission. Preserve source/chunk identity and the reviewed audio reference across a video retry. The browser models transient failures and retries but cannot establish a provider’s actual billing/refund behavior, which requires reconciliation against request identifiers.

Evidence: Inspect the selected stage’s queue, failure policy and contract. Linked provider documentation describes the real interface; execution is simulated.

## 32. Does a Sync failure require another audio dub?

**Reliability & recovery · Interactive**

No. The approved audio remains immutable and valid for the same source version. A video-provider retry reuses it. If a replacement audio recording is required for another reason, create a new version and return to human audio review. Keeping the boundaries separate avoids paying for and reviewing unchanged audio again.

Evidence: Inspect the selected stage’s queue, failure policy and contract. Linked provider documentation describes the real interface; execution is simulated.

## 33. What if a provider times out after accepting a job?

**Reliability & recovery · Design**

A timeout is ambiguous: the service may still be working or may already have charged. The production adapter must retain request IDs, query or reconcile status, and avoid blindly duplicating paid work. This browser uses explicit synthetic completion/failure events rather than pretending to implement real external reconciliation.

Evidence: Design rationale distinguishes the selected managed-provider architecture, verified interfaces and production requirements not implemented by this browser.

## 34. Why propose a durable workflow coordinator?

**Reliability & recovery · Design**

The process spans external jobs, arbitrary human waits, chunk joins and final release. Production needs persistent state and recoverable decision boundaries, not just a queue. Temporal signals and activities are one proposed fit; the static demo intentionally remains in memory and does not claim cross-process durability.

Evidence: Design rationale distinguishes the selected managed-provider architecture, verified interfaces and production requirements not implemented by this browser.

## 35. What prevents duplicate chunk completion from releasing twice?

**Reliability & recovery · Interactive**

The join records results by expected chunk index and rejects duplicate completion. It validates coverage before enqueueing one assembly candidate. Production also needs stable logical IDs, durable compare-and-set transitions and webhook deduplication, because duplicate provider notifications are separate from local deterministic state transitions.

Evidence: Inspect the selected stage’s queue, failure policy and contract. Linked provider documentation describes the real interface; execution is simulated.

## 36. How does chunk size change load?

**Capacity & operations · Interactive**

Shorter chunks increase request overhead and the number of audio decisions while preserving roughly the same total media minutes. They can improve bounded retries and respect provider limits but also amplify coordination and review work. The planner estimates chunk counts from the configured duration distribution rather than assuming one source equals one provider job.

Evidence: Capacity planning separates source jobs, chunk-language work, external provider allowances, application workers and both human-review gates.

## 37. What happens at ten times the source volume?

**Capacity & operations · Interactive**

The model offers ten times the source hours, which multiplies chunk-language jobs and human review backlog. Raising provider job allowances can move the bottleneck but cannot replace explicit reviewers. Inspect both gates and the partial reassembly batches rather than judging health only by recently completed deliveries.

Evidence: Capacity planning separates source jobs, chunk-language work, external provider allowances, application workers and both human-review gates.

## 38. What happens with zero staffed reviewers?

**Capacity & operations · Interactive**

Audio can complete at the provider and accumulate at the review gate, but approval is blocked. Similarly, an assembled program cannot be released without a final reviewer decision. The analytical capacity table shows blocked human stages, and the live model never manufactures approval to keep throughput looking healthy.

Evidence: Open Audio approval, start a reference or local preview, inspect the version binding and record an explicit approve, revise or reject decision.

## 39. What does offered utilization mean?

**Capacity & operations · Interactive**

It is an estimate of task rate times service effort divided by the configured stage slots. Application workers, external provider quotas and planned reviewers are different resource types. The estimate uses expected acceptance to size downstream demand; actual manual decisions determine the live trajectory instead.

Evidence: Capacity planning separates source jobs, chunk-language work, external provider allowances, application workers and both human-review gates.

## 40. Why inspect pending work alongside delivery latency?

**Capacity & operations · Interactive**

Completed-only p95 excludes work still waiting at a human gate, a provider queue or an incomplete join. A small set of fast releases can look healthy while many programs remain blocked. Review pending counts, oldest waiting time, partial batches, held sources and accepted minutes together before making an operating claim.

Evidence: Package traces expose recorded chunk spans, audio approval records, Sync inputs, ordered assembly and final-review history.

## 41. What is the useful cost denominator?

**Economics & evaluation · Interactive**

Use complete-program minutes actually released after final human approval. Do not count isolated successful chunks as accepted source-level delivery. Keep rejected audio, attempted provider work, human decisions and incomplete assemblies in the numerator so the result reflects the cost of producing useful released programs.

Evidence: Model economics shows actual simulated spend separately from analytical expectations; no planning assumption creates a live approval.

## 42. When does Sync spend begin?

**Economics & evaluation · Interactive**

Only when a validly approved chunk is dispatched to the external video stage. A queued or rejected recording has not crossed that spend boundary. The simulator estimates usage at submitted attempts; production invoices and refunds require actual provider reconciliation and must not be inferred from a local status alone.

Evidence: Model economics shows actual simulated spend separately from analytical expectations; no planning assumption creates a live approval.

## 43. What does the model comparison measure?

**Economics & evaluation · Interactive**

It is an analytical planning estimate using documented Sync model identifiers and configurable fee assumptions. It samples source manifests for chunk counts and assumes independent per-chunk acceptance plus final program acceptance. It never creates approvals, runs a paid quality benchmark or ranks visual quality from price.

Evidence: Model economics shows actual simulated spend separately from analytical expectations; no planning assumption creates a live approval.

## 44. Why can a rejected chunk be economically expensive?

**Economics & evaluation · Interactive**

Other chunks of the same program may already have completed audio or visual processing. One rejected or missing required interval can hold the entire language batch, so useful delivered minutes remain zero while spend exists. A reviewer-first audio gate prevents avoidable downstream work, but it cannot recover costs already incurred.

Evidence: Model economics shows actual simulated spend separately from analytical expectations; no planning assumption creates a live approval.

## 45. How should actual quality be evaluated?

**Economics & evaluation · Design**

Use representative languages, speakers, accents, camera angles, occlusions and program genres. Separate meaning/voice/timing audio checks from visual lip-sync and full-program continuity checks. Review the real output with qualified humans and measure failures, revision effort and accepted cost before treating the planning assumptions as operational evidence.

Evidence: Design rationale distinguishes the selected managed-provider architecture, verified interfaces and production requirements not implemented by this browser.

## 46. What rights must be checked?

**Rights, evidence & ownership · Interactive**

Verify source usage, voice reproduction, visible facial modification, target territory and provider transfer permissions. A reviewer’s opinion that audio sounds good does not create legal permission. Rights must remain valid before paid visual processing and at release, with a separate production process for already-published takedowns.

Evidence: Inspect the selected stage’s queue, failure policy and contract. Linked provider documentation describes the real interface; execution is simulated.

## 47. What happens when rights change during review?

**Rights, evidence & ownership · Interactive**

The package can have a valid quality decision and still be denied downstream. The model rechecks a revoked source cohort before Sync and final publication. The approval record remains an audit fact, but it does not override current rights or authorize another source version.

Evidence: Inspect the selected stage’s queue, failure policy and contract. Linked provider documentation describes the real interface; execution is simulated.

## 48. How do local preview files behave?

**Rights, evidence & ownership · Interactive**

They stay in the browser as object URLs; the app computes their SHA-256 content hash locally and creates a new review version. The static site does not upload them to ElevenLabs, Sync or a review server. Reload/reset clears the session preview, so production artifact storage and review continuity remain separate requirements.

Evidence: Open Audio approval, start a reference or local preview, inspect the version binding and record an explicit approve, revise or reject decision.

## 49. What would make this production-ready?

**Rights, evidence & ownership · Design**

Implement and validate actual provider adapters, durable manifests and approvals, authenticated reviewer roles, account quotas, webhook reconciliation, artifact retention and real media cutting/reassembly. Benchmark real multilingual outputs and invoice behavior. The demo provides inspectable state invariants and outcome tests, not proof that these integrations are deployed.

Evidence: Design rationale distinguishes the selected managed-provider architecture, verified interfaces and production requirements not implemented by this browser.

## 50. How do we demonstrate this architecture without fabricating results?

**Rights, evidence & ownership · Interactive**

Show the selected API contracts and their documentation, exercise rejection/revision and both approvals, inspect a complete batch join, and run the invariant tests. Label reference media and planning inputs clearly. Use actual outputs and measured operating evidence before claiming provider quality, speed, savings or production-scale delivery.

Evidence: Package traces expose recorded chunk spans, audio approval records, Sync inputs, ordered assembly and final-review history.
