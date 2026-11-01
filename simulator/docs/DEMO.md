# Seven-minute architecture review

## 0:00–1:00 — Establish the contract

Open System architecture. Explain that this is an executable reference model, with declared assumptions. State source hours/day, extracted fraction, target locales and delivery deadline. Show the current scenario and decision brief. Ask the reviewer which constraint they would change first.

## 1:00–2:15 — Trace one asset

Select ingest, rights, source normalization and the speech/vision branches. Explain immutable object references and durable workflow control. Show the join before localization fan-out. Open a stage's Contract tab. Explain what needs a checkpoint and which side effects require reconciliation.

## 2:15–3:30 — Test 10× growth

Save a comparison checkpoint from Model inputs. Select 10× catalog growth. Increase playback to 300× briefly, then pause. Inspect queue age and Capacity planning. Explain offered utilization, headroom and why observed downstream queues can understate required capacity. Do not claim autoscaling repairs every bottleneck.

## 3:30–4:30 — Break a dependency

Restore baseline parameters via Reset, run briefly, then select Speech-provider outage. The primary speech circuit opens. Enable Approved fallback under Model inputs → Capacity. Compare recovered throughput, pending age and incremental cost. Explain ambiguous paid timeouts separately; the demo does not implement a real provider reconciliation API.

## 4:30–5:30 — Challenge cheaper inference

Open Model economics and Run controlled comparison. Inspect acceptance, total elapsed processing time, unfinished work and accepted-minute cost. Explicitly flag an undrained result as incomplete. Explain why synthetic quality scores demonstrate system effects but do not establish real perceptual quality.

## 5:30–6:15 — Establish enterprise accountability

Select Rights revocation and inspect a held trace once generated. Describe admission and final-delivery authorization. State that prior published derivatives require a separate lineage-driven takedown workflow. Open the publish contract to discuss idempotent effects and scope.

## 6:15–7:00 — Invite scrutiny

Open Inspect. Search a question the reviewer raises and use its evidence link. There are 50 answers across ten engineering responsibilities, with Interactive, Design and Execution plan scope labels. End on the uncertainty to validate first, the smallest useful production experiment and the reversal criteria.

## Personal proof

Prepare four real stories: an incident you owned, an architecture tradeoff, a measured cost/quality improvement and a cross-functional disagreement. Use only outcomes you can substantiate. The demo demonstrates reasoning and code; it cannot establish past production scale or career impact for you.
