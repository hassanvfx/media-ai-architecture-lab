# Simulation model

## Mechanics

The engine advances in one-second simulated steps. A seeded linear congruential generator drives service-time jitter, cache hits, synthetic quality, transient errors and review outcomes. The same initial configuration, seed and configuration-change schedule produce the same trajectory. The opening view runs 1,800 seconds of warm-up. Reset starts at zero.

Arrivals are evenly spaced rather than Poisson:

```
source_minutes_per_hour = source_hours_per_day × 60 / 24
assets_per_second = source_hours_per_day × 60 / (86400 × expected_mean_source_minutes)
localized_minutes_per_asset = sampled_source_minutes × selected_share × destination_language_count
```

Source durations vary by package. The mixed catalog samples lengths centered on 2, 5, 12 and 30 minutes with probabilities 20%, 40%, 30% and 10%, with uniform ±20% length jitter around each center. Its expected mean is 9 minutes. Short-video and long-program mixes have their own weighted lengths; custom ranges sample uniformly between chosen bounds. The planner uses the expected mean; processing and output volume use the actual sampled duration. Input duration is workload data, not an edit instruction.

The default is full-program dubbing: selected_share=1. Optional dubbed highlights use the configured selected-source share. The model tracks aggregate highlight minutes, not discrete clip counts or exact edit boundaries. English is the source language; destination branches start with Spanish, French and German and exclude English. Each asset captures its source duration, localization plan, output ratio, destination count and delivery deadline at admission. Queues carry task objects referencing the synthetic asset. Source preparation fans out into speech and vision; editorial planning runs only after both branches finish. A version-matched cache hit bypasses both analysis branches. Editorial planning creates one derivative per locale and an independent indexing task.

Every stage has finite slots. Service time is:

```
service_seconds = (fixed_seconds + media_minutes × 60 × RTF) × uniform(0.8, 1.2)
```

Source stages use actual source minutes; localized stages use full-program minutes or selected highlight minutes according to the captured plan. A dedicated alignment-and-audio-mixing stage runs after voice synthesis and before quality evaluation, with service time and per-minute cost; no actual audio or frames are processed. Profile-specific speech time is captured when an attempt starts. Configuration changes do not rewrite existing task durations. Decreasing capacity does not cancel active work.

## Failure and rights semantics

Speech attempts have a 2.5% transient failure probability. Failed attempts consume their processing fee, then retry with exponentially increasing delay and jitter until the configured budget is exhausted. Exhaustion quarantines the derivative. Outage stops primary dispatch; in-flight primary calls fail at completion. Approved fallback dispatches to a slower, higher-fee profile. It is a simplified explicit circuit-open state, not a modeled failure-rate detector.

Twenty percent of asset identities belong to a seeded license cohort. Revoking that cohort denies admission and prevents final publication of affected in-flight derivatives. This does not implement mid-stage cancellation, third-party deletion or takedown of prior deliveries.

Admissions are deferred when pending tasks exceed 3,000 or the ingest queue exceeds 100. This is global backpressure, not multi-tenant fairness.

## Quality

```
synthetic_score = clamp(profile_mean + 14 × (U1 + U2 + U3 - 1.5), 0, 100)
```

Scores below the configured threshold go to a finite review pool. Review lasts approximately 180 seconds and approves 82% of reviewed derivatives. Rejected derivatives are quarantined rather than silently regenerated. Scores are neither measured WER nor MOS.

The analytical capacity view uses the Irwin–Hall CDF for the sum of three uniforms to estimate review demand from this same distribution. It ignores retries and revoked rights and assumes all offered demand reaches each stage, deliberately exposing downstream capacity requirements hidden by upstream constraints.

```
offered_concurrency = tasks_per_hour × mean_service_seconds / 3600
utilization = offered_concurrency / provisioned_slots
slots_at_target = ceil(offered_concurrency / 0.75)
```

## Costs

Illustrative rates: $2.40 per provisioned GPU slot-hour, $0.12 per CPU slot-hour and $30 per staffed reviewer-hour. ASR and vision each have two dedicated GPU slots; speech is configurable. CPU allocation covers three pools: source preparation, dialogue alignment/audio mixing, and quality checks. API, I/O and control-plane overhead is simplified into per-stage fees.

All allocated capacity is billed while idle. Each processing attempt adds its stage's variable fee. Speech profiles charge $0.045, $0.08 or $0.14 per attempted output minute; fallback charges $0.18. These are synthetic fees layered on modeled provisioned capacity, not current vendor prices or a complete hosted-vs-self-hosted TCO model.

```
unit_cost = (compute + processing_attempts + staffed_review + delivery) / accepted_output_minutes
```

The numerator includes rejected, failed and unfinished work. A comparison is strongest after draining matched inputs. The profile-comparison view offers the same deterministic source sequence for thirty minutes, disables outages/revocation, and drains for at most three additional hours. A separate catalog RNG controls duration and rights-cohort draws even when input admission is deferred. Offered input sequences therefore match across profiles independently of processing/review randomness. Guardrails can produce different admitted totals at severe overload; those admitted totals and deferred counts are shown and must be checked before treating runs as matched. It flags incomplete runs. Identical seeds do not guarantee identical random outcomes across profiles because branching consumes random draws differently; duration pairing is reproducible, while this remains a synthetic quality comparison rather than a statistically paired measured benchmark.

## Metrics

- Throughput: accepted output minutes in the trailing 300 seconds, annualized to a per-hour rate (scaled to elapsed time if shorter).
- Observed p95: empirical p95 of the last 5,000 delivered derivative latencies, measured from source admission; unfinished and failed work are excluded.
- Deadline attainment: delivered outputs in the trailing hour meeting their own admission-time deadline. This is not an arrival-cohort success SLO.
- Queue age: time since the oldest FIFO task entered its current stage, including retry delay; inspect alongside completion latency.
- History: the last ninety samples at ten-second intervals; 100 recent events and 120 terminal traces.

## Deliberate limits

No real model execution, media encoding, tenant scheduler, GPU memory model, dynamic batching, stochastic arrival bursts, regional topology, durable cross-process recovery, provider billing reconciliation, retained-storage growth or post-publication takedown. Those appear as explicit design proposals where relevant. Validate capacity, quality and prices against representative production benchmarks before making an operational commitment.
