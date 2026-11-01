export const DEFAULTS = {
  arrival: 240,
  languages: 3,
  sourceMinutes: 5,
  clipRatio: 20,
  gpu: 4,
  cpu: 6,
  reviewers: 2,
  cache: 25,
  quality: 85,
  retries: 2,
  slo: 10,
  model: "balanced",
  autoscale: false,
  fallback: true,
  outage: false,
  revoked: false,
  seed: 42,
};
export const PROFILES = {
  balanced: {
    name: "Balanced",
    tool: "Triton / speech adapter",
    rtf: 0.5,
    cost: 0.08,
    mean: 94,
  },
  economy: {
    name: "Economy",
    tool: "Lower-cost speech model",
    rtf: 0.34,
    cost: 0.045,
    mean: 76,
  },
  premium: {
    name: "Quality first",
    tool: "Premium speech model",
    rtf: 0.7,
    cost: 0.14,
    mean: 98,
  },
};
export const STAGES = [
  {
    id: "ingest",
    name: "Catalog ingest",
    short: "Ingest",
    icon: "upload",
    kind: "io",
    tool: "S3 · multipart upload",
    x: 0,
    y: 80,
    rtf: 0.025,
    fixed: 2,
    cost: 0.001,
    purpose:
      "Land source media as immutable objects. Validate the upload checksum and create a tenant-scoped asset manifest before scheduling expensive work.",
    stack: [
      [
        "Amazon S3",
        "Multipart uploads, checksums, object versioning",
        "https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html",
      ],
      [
        "PostgreSQL",
        "Asset manifest and transactional outbox",
        "https://www.postgresql.org/docs/current/ddl-rowsecurity.html",
      ],
    ],
    input: "source_uri · tenant_id · rights_id · content_sha256",
    output: "asset_id · immutable_uri · version_id · trace_id",
    decision:
      "Keep media in object storage. Pass object references through the control plane. Outbox publication closes the gap between committing a manifest and emitting an event.",
    failure:
      "Checksum mismatch is permanent until the source is replaced. Multipart retries resume failed parts; they must not create a second logical asset.",
    metric: "Ingest throughput · checksum failures · manifest lag",
    code: 'asset_id = hash(tenant_id, source_sha256)\nBEGIN\n  INSERT asset_manifest ... ON CONFLICT DO NOTHING;\n  INSERT outbox(event="asset.received", asset_id);\nCOMMIT',
  },
  {
    id: "policy",
    name: "Rights & admission",
    short: "Rights",
    icon: "shield",
    kind: "control",
    tool: "OPA · policy + quotas",
    x: 235,
    y: 80,
    rtf: 0,
    fixed: 3,
    cost: 0,
    purpose:
      "Authorize transformations, voice use, territory, provider transfer, and tenant admission before material reaches inference workers.",
    stack: [
      [
        "Open Policy Agent",
        "Versioned authorization decisions",
        "https://www.openpolicyagent.org/docs",
      ],
      [
        "PostgreSQL RLS",
        "Defense-in-depth tenant isolation",
        "https://www.postgresql.org/docs/current/ddl-rowsecurity.html",
      ],
    ],
    input: "asset_manifest · claims · requested_transforms",
    output: "policy_version · allowed_regions · consent_ref",
    decision:
      "Rights are explicit metadata with an auditable source of authority. Recheck before delivery because consent can change while a workflow runs.",
    failure:
      "Deny or quarantine missing consent. Policy denial is not a transient model failure; retrying it does not repair permission.",
    metric: "Policy denials · admitted source minutes · queue age",
    code: "allow = license.valid_at(now)\n  && requested_regions ⊆ license.regions\n  && (not voice_clone || consent.verified)\n  && tenant.within_quota\nrecord_decision(policy_version, allow)",
  },
  {
    id: "prepare",
    name: "Probe & normalize",
    short: "Prepare",
    icon: "film",
    kind: "cpu",
    tool: "FFmpeg · ffprobe",
    x: 470,
    y: 80,
    rtf: 0.15,
    fixed: 4,
    cost: 0.004,
    purpose:
      "Inspect codec and timing, extract audio and proxies, and normalize a stable working representation while retaining source timestamps.",
    stack: [
      [
        "FFmpeg",
        "Decode, filters, loudness and encoding",
        "https://ffmpeg.org/ffmpeg-filters.html",
      ],
      [
        "Kubernetes Jobs",
        "Bounded CPU processing workers",
        "https://kubernetes.io/docs/concepts/workloads/controllers/job/",
      ],
    ],
    input: "immutable_uri · target_profile · source_timebase",
    output: "audio_uri · proxy_uri · pts_map · probe.json",
    decision:
      "Remux compatible streams; transcode only when necessary. Preserve PTS mapping so every generated clip can cite the exact source interval.",
    failure:
      "Malformed inputs run inside CPU, memory and wall-time limits. Reject invalid stream layouts before downstream spend.",
    metric: "Decode real-time factor · A/V drift · invalid assets",
    code: "ffprobe -v error -show_streams -show_format input.mp4\nffmpeg -i input.mp4 -vn -ar 16000 -ac 1 speech.wav\n# Version the transform and persist the timebase map.",
  },
  {
    id: "asr",
    name: "Speech intelligence",
    short: "Speech",
    icon: "audio",
    kind: "gpu",
    tool: "faster-whisper · diarization",
    x: 705,
    y: -15,
    rtf: 0.08,
    fixed: 3,
    cost: 0.012,
    purpose:
      "Produce word-level timestamps and speaker turns from normalized audio. This shared transcription is reused across every output language.",
    stack: [
      [
        "faster-whisper",
        "CTranslate2 speech transcription",
        "https://github.com/SYSTRAN/faster-whisper",
      ],
      [
        "pyannote.audio",
        "Speaker diarization pipeline",
        "https://github.com/pyannote/pyannote-audio",
      ],
    ],
    input: "audio_uri · language_hint · model_version",
    output: "words[] · speaker_turns[] · confidence · source_pts",
    decision:
      "Separate ASR accuracy from speaker attribution. Evaluate WER and diarization on accent, noise, overlap and language slices before changing the model.",
    failure:
      "Low confidence escalates downstream review. Never interpret fluent text as proof of faithful transcription.",
    metric: "WER by slice · diarization error · source-minute cost",
    code: "segments = asr.transcribe(audio, word_timestamps=True)\nturns = diarize(audio)\ntranscript = align_words_to_speakers(segments, turns)\ncheckpoint(asset_id, model_version, transcript)",
  },
  {
    id: "vision",
    name: "Visual understanding",
    short: "Vision",
    icon: "scan",
    kind: "gpu",
    tool: "PySceneDetect · vision adapter",
    x: 705,
    y: 175,
    rtf: 0.12,
    fixed: 4,
    cost: 0.018,
    purpose:
      "Find shots and grounded visual events. Process sampled frames and temporal windows alongside the speech branch.",
    stack: [
      [
        "PySceneDetect",
        "Shot and transition detection",
        "https://www.scenedetect.com/docs/latest/",
      ],
      [
        "NVIDIA Triton",
        "Versioned inference serving and batching",
        "https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/user_guide/batcher.html",
      ],
    ],
    input: "proxy_uri · pts_map · frame_sample_policy",
    output: "shots[] · timecoded_events[] · visual_embeddings",
    decision:
      "Shots are not semantic scenes. Combine temporal evidence with transcript context; a single frame cannot establish narrative causality.",
    failure:
      "Missing visual evidence must be explicit. Avoid inventing event timestamps or silently substituting whole-video embeddings.",
    metric: "Temporal localization · shot recall · GPU queue age",
    code: "shots = detect_shots(proxy)\nfor window in temporal_windows(shots):\n  events = infer(sample_frames(window))\n  persist(events, source_interval=window.pts)",
  },
  {
    id: "clips",
    name: "Editorial planning",
    short: "Editorial",
    icon: "spark",
    kind: "api",
    tool: "LLM adapter · structured schema",
    x: 940,
    y: 80,
    rtf: 0.02,
    fixed: 7,
    cost: 0.01,
    purpose:
      "Join speech and visual evidence, rank candidate intervals, and create a versioned edit decision list with source citations.",
    stack: [
      [
        "Pydantic",
        "Typed edit-decision contracts",
        "https://docs.pydantic.dev/latest/",
      ],
      [
        "Temporal",
        "Fan-out, join and durable workflow state",
        "https://docs.temporal.io/workflows",
      ],
    ],
    input: "transcript + visual_events · editorial_brief",
    output: "EDL · source_intervals · claims · language_jobs[]",
    decision:
      "A bounded planning activity proposes edits; deterministic code enforces boundaries, output length and rights. Fan out localization after shared analysis.",
    failure:
      "Invalid or ungrounded intervals fail validation. A model cannot bypass a policy or publish directly.",
    metric: "Clip acceptance · context integrity · candidate coverage",
    code: "await join(speech_activity, vision_activity)\nedl = planner.propose(evidence, output_schema=EDL)\nvalidate_bounds_and_citations(edl)\nawait fan_out(localize(edl, language) for language in targets)",
  },
  {
    id: "index",
    name: "Discoverable catalog",
    short: "Index",
    icon: "search",
    kind: "io",
    tool: "Qdrant · timecoded citations",
    x: 1175,
    y: 80,
    rtf: 0.04,
    fixed: 4,
    cost: 0.002,
    purpose:
      "Index source-grounded segments for hybrid retrieval. An asynchronous branch supports search without blocking media delivery.",
    stack: [
      [
        "Qdrant",
        "Dense + sparse retrieval and reranking",
        "https://qdrant.tech/documentation/search/hybrid-queries/",
      ],
    ],
    input: "source_intervals · transcript · tenant_acl · rights",
    output: "segment_vectors · citation_uri · source_timestamps",
    decision:
      "Apply tenant and rights filters before exposing snippets. Indexing is its own SLO; search lag should not stop otherwise valid localization.",
    failure:
      "Revocation requires index tombstones and cache invalidation. A vector match is evidence retrieval, not authorization.",
    metric: "Recall@k · citation accuracy · indexing lag",
    code: "query = hybrid(dense(query_text), sparse(query_text))\nhits = search(query, filter=tenant_acl & current_rights)\nreturn rerank(hits).with_source_timestamps()",
  },
  {
    id: "translate",
    name: "Translation & timing",
    short: "Translate",
    icon: "languages",
    kind: "api",
    tool: "Translation adapter · glossary",
    x: 940,
    y: 385,
    rtf: 0.06,
    fixed: 5,
    cost: 0.022,
    purpose:
      "Translate selected intervals with brand terminology, protected names and timing constraints. Every locale receives an independent durable job.",
    stack: [
      [
        "DeepL API",
        "Example commercial translation adapter",
        "https://developers.deepl.com/docs/getting-started/intro",
      ],
      [
        "Temporal Activities",
        "Per-locale checkpoint and retry boundary",
        "https://docs.temporal.io/activities",
      ],
    ],
    input: "EDL · locale · glossary_version · speaker_turns",
    output: "translated_segments · timing_budget · pronunciation",
    decision:
      "Keep a provider-neutral contract. Compare candidate models on the same multilingual corpus; embedding similarity alone does not prove semantic fidelity.",
    failure:
      "Names, negation and claims require targeted QA. Text expansion may require a new edit plan instead of excessive speech-speed changes.",
    metric: "Meaning preservation · terminology accuracy · expansion",
    code: "translate(segments, locale, glossary_version)\nvalidate(protected_names, required_claims)\nalign_to_timing_budget(translated_segments)\ncheckpoint(asset_id, locale, model_version)",
  },
  {
    id: "tts",
    name: "Voice synthesis",
    short: "Synthesis",
    icon: "wave",
    kind: "gpu",
    tool: "Triton · swappable TTS adapter",
    x: 705,
    y: 385,
    rtf: 0.5,
    fixed: 2,
    cost: 0.08,
    purpose:
      "Synthesize speech under verified consent, with a separate capacity pool and a typed provider contract for fallback.",
    stack: [
      [
        "NVIDIA Triton",
        "Self-hosted inference and dynamic batching",
        "https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/user_guide/batcher.html",
      ],
      [
        "ElevenLabs",
        "Example hosted speech provider",
        "https://elevenlabs.io/docs/overview",
      ],
    ],
    input: "translated_segments · voice_consent · timing_budget",
    output: "audio_uri · request_id · model_version · spend",
    decision:
      "Self-hosting needs a utilization and operations case. Provider fallback can restore delivery while increasing cost and changing perceptual quality.",
    failure:
      "Timeout after billing is ambiguous. Reconcile request IDs before retrying paid work; use bounded retries and a circuit breaker.",
    metric: "Real-time factor · naturalness · cost/accepted minute",
    code: "if circuit.open:\n  provider = approved_fallback\nresult = provider.synthesize(request, idempotency_key)\n# On ambiguous timeout: reconcile provider request_id.\ncheckpoint(audio_hash, provider, request_id, billed_cost)",
  },
  {
    id: "qc",
    name: "Quality gates",
    short: "Quality",
    icon: "check",
    kind: "cpu",
    tool: "FFmpeg checks · calibrated evals",
    x: 470,
    y: 385,
    rtf: 0.09,
    fixed: 5,
    cost: 0.008,
    purpose:
      "Combine deterministic verification with calibrated subjective rubrics. Route uncertain outputs to a finite human-review pool.",
    stack: [
      [
        "FFmpeg filters",
        "Silence, loudness and media checks",
        "https://ffmpeg.org/ffmpeg-filters.html",
      ],
      [
        "MLflow evaluation",
        "Example evaluation tracking framework",
        "https://mlflow.org/docs/latest/ml/evaluation/",
      ],
    ],
    input: "dub · EDL · source_evidence · eval_suite_version",
    output: "gate_scores · verdict · review_reason · lineage",
    decision:
      "A stricter threshold may improve acceptance confidence while increasing reviewer backlog. Track failure slices, not just aggregate scores.",
    failure:
      "An automated score is a simulated proxy here, not a measured MOS or WER. Real thresholds require human calibration and representative samples.",
    metric: "First-pass acceptance · review wait · false acceptance",
    code: "checks = verify_codec_sync_silence(output)\nscores = calibrated_rubric(output, source_evidence)\nif checks.pass_all and scores >= threshold:\n  release_to_publish()\nelse: await human_review()",
  },
  {
    id: "review",
    name: "Editorial review",
    short: "Review",
    icon: "users",
    kind: "human",
    tool: "Human approval · audit trail",
    x: 470,
    y: 610,
    rtf: 0,
    fixed: 180,
    cost: 0,
    purpose:
      "Let qualified reviewers inspect uncertain content and record accountable approval or rejection. Human capacity is a real bottleneck.",
    stack: [
      [
        "Temporal Signals",
        "Resume a workflow after an external decision",
        "https://docs.temporal.io/encyclopedia/workflow-message-passing",
      ],
    ],
    input: "candidate · evidence · failed_checks · review_reason",
    output: "reviewer_id · verdict · rubric_version · timestamp",
    decision:
      "Reserve review for uncertainty and risk. Do not automatically approve an asset simply because its deadline is approaching.",
    failure:
      "Rejected work is quarantined for explicit remediation. Review is not an infinite queue with zero operational cost.",
    metric: "Review age · approval rate · reviewer cost",
    code: 'decision = await workflow.wait_for_signal("review")\naudit(reviewer_id, decision, rubric_version)\nif decision.approved: publish_candidate()\nelse: quarantine(reason=decision.reason)',
  },
  {
    id: "publish",
    name: "Package & deliver",
    short: "Deliver",
    icon: "send",
    kind: "io",
    tool: "FFmpeg · S3 / CloudFront",
    x: 235,
    y: 385,
    rtf: 0.1,
    fixed: 4,
    cost: 0.006,
    purpose:
      "Package approved media, verify current rights and publish with a stable logical key. Record the accepted output and its entire provenance.",
    stack: [
      [
        "Amazon CloudFront",
        "Object delivery and distribution",
        "https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html",
      ],
      [
        "AWS Builders’ Library",
        "Idempotent retry design",
        "https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/",
      ],
    ],
    input: "approved_artifact · current_rights · delivery_profile",
    output: "delivery_id · public_manifest · acceptance_receipt",
    decision:
      "Count cost per accepted output minute. Keep failed, reviewed and retried work in the cost numerator. A successful API call is not delivery acceptance.",
    failure:
      "Recheck rights at publication. Stable keys and reconciliation prevent duplicate logical delivery; do not claim universal exactly-once execution.",
    metric: "Accepted minutes · deadline attainment · delivery cost",
    code: "assert rights.valid_now(asset_id, territory)\nkey = hash(asset_id, locale, edit_version, channel)\npublish_idempotently(key, approved_artifact)\nledger.record_acceptance(key, output_minutes)",
  },
];
export const CONNECTIONS = [
  ["ingest", "policy"],
  ["policy", "prepare"],
  ["prepare", "asr"],
  ["prepare", "vision"],
  ["asr", "clips"],
  ["vision", "clips"],
  ["clips", "index"],
  ["clips", "translate"],
  ["translate", "tts"],
  ["tts", "qc"],
  ["qc", "publish"],
  ["qc", "review"],
  ["review", "publish"],
];
export const SCENARIOS = [
  {
    id: "baseline",
    name: "Baseline operating model",
    tag: "BASELINE",
    icon: "activity",
    description:
      "A healthy multi-language catalog. Establish capacity, cost and deadline baselines.",
    patch: { ...DEFAULTS },
    talk: "Trace shared speech and visual analysis, then localization fan-out. Explain why the cost denominator is accepted output.",
  },
  {
    id: "spike",
    name: "10× catalog growth",
    tag: "CAPACITY",
    icon: "trending",
    description:
      "An enterprise catalog import pushes arrival rate to 10×. Find the first constraint.",
    patch: { arrival: 2400 },
    talk: "Inspect pending source minutes, then grow the measured bottleneck. Autoscaling has a warm-up delay and a ceiling; upstream admission remains bounded.",
  },
  {
    id: "outage",
    name: "Speech-provider outage",
    tag: "RESILIENCE",
    icon: "zap",
    description:
      "The primary speech service is unavailable. Compare fallback against accumulated backlog.",
    patch: { outage: true, fallback: false },
    talk: "Turn on fallback and compare recovered throughput with increased unit cost. Retry alone cannot repair an outage.",
  },
  {
    id: "cheap",
    name: "Lower-cost model rollout",
    tag: "ECONOMICS",
    icon: "dollar",
    description:
      "A cheaper speech model produces lower quality. Can human review erase its savings?",
    patch: { model: "economy", quality: 90 },
    talk: "Watch first-pass yield and review capacity. Compare accepted-minute economics, not the price of a successful request.",
  },
  {
    id: "rights",
    name: "Rights revocation",
    tag: "GOVERNANCE",
    icon: "shield",
    description:
      "A license cohort loses authorization. Block intake and recheck in-flight derivatives.",
    patch: { revoked: true },
    talk: "Observe policy and delivery holds. Explain that previously delivered derivatives also need an operational takedown workflow outside this simulation.",
  },
  {
    id: "global",
    name: "Eight-language expansion",
    tag: "FAN-OUT",
    icon: "globe",
    description: "Expand to eight languages without repeating source analysis.",
    patch: { languages: 8, quality: 90 },
    talk: "Shared source analysis stays constant while localization and review demand multiply. Scale separate resource pools.",
  },
];
export const TOURS = [
  {
    title: "Start with a contract",
    stage: "policy",
    text: "Before inference, define allowed transformations, tenant limits, target languages, quality criteria and a delivery deadline. Rights are executable policy.",
  },
  {
    title: "Analyze once. Reuse everywhere.",
    stage: "asr",
    text: "Speech and vision run concurrently, then join on a versioned edit plan. Localization reuses that expensive shared evidence across every language.",
  },
  {
    title: "Break the dependency",
    stage: "tts",
    text: "Use Provider blackout, then enable fallback. Explain why a circuit breaker protects the queue while a more expensive provider changes unit economics.",
  },
  {
    title: "Quality has an operating cost",
    stage: "qc",
    text: "Try The cheaper model. Higher review demand competes for finite human capacity. The accepted-minute denominator exposes false savings.",
  },
  {
    title: "Make delivery accountable",
    stage: "publish",
    text: "Recheck rights, publish with stable logical keys, and record the acceptance receipt. Finish with a measured capacity plan and a reversible next decision.",
  },
];
