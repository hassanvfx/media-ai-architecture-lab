export const DEFAULTS = {
  modelVersion: 3,
  arrival: 48,
  languages: 3,
  sourceMinutes: 9,
  durationMode: "mix",
  segmentationMode: "duration",
  chunkMinutes: 5,
  catalogMix: "mixed",
  minSourceMinutes: 1,
  maxSourceMinutes: 60,
  dubConcurrency: 3,
  syncConcurrency: 2,
  appWorkers: 6,
  reviewers: 2,
  dubRate: 2.2,
  syncRate: 0.05,
  dubRtf: 0.5,
  syncRtf: 0.8,
  reviewFactor: 1,
  reviewerRate: 30,
  expectedApproval: 85,
  expectedFinalApproval: 95,
  retries: 2,
  maxAudioRevisions: 3,
  slo: 60,
  model: "standard",
  dubOutage: false,
  syncOutage: false,
  revoked: false,
  seed: 42,
};
export const PROFILES = {
  standard: {
    name: "lipsync-2",
    modelId: "lipsync-2",
    rate: 0.05,
    note: "Legacy usage reference: $0.04–$0.05/output second at 25 fps.",
  },
  detail: {
    name: "lipsync-2-pro",
    modelId: "lipsync-2-pro",
    rate: 0.083,
    note: "Legacy usage reference: $0.067–$0.083/output second at 25 fps.",
  },
  studio: {
    name: "sync-3",
    modelId: "sync-3",
    rate: 0.133,
    note: "Legacy usage reference: $0.107–$0.133/output second at 25 fps.",
  },
};
export const SOURCES = {
  eleven: "https://elevenlabs.io/docs/eleven-api/guides/cookbooks/dubbing",
  elevenOverview: "https://elevenlabs.io/docs/overview/capabilities/dubbing",
  sync: "https://sync.so/docs/tutorials/video-dubbing-api-guide",
  syncQuickstart: "https://sync.so/docs/quickstart",
  syncSegments: "https://sync.so/docs/developer-guides/segments",
  syncBilling: "https://sync.so/docs/product/billing",
};
export const STAGES = [
  {
    id: "ingest",
    name: "Receive source video",
    short: "Receive",
    icon: "upload",
    kind: "io",
    tool: "Object storage · source manifest",
    x: 0,
    y: 40,
    rtf: 0.015,
    fixed: 2,
    cost: 0.001,
    purpose:
      "Store the original video once and preserve its identity, source duration and media version. Incoming videos have different lengths.",
    stack: [
      [
        "Amazon S3",
        "Versioned source and review artifacts",
        "https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html",
      ],
    ],
    input: "source_video · source_language · tenant_id",
    output: "source_id · source_version · immutable_video_uri · media_duration",
    decision:
      "Keep the original video as the visual source for Sync. Store artifact references and checksums rather than passing media bytes through the workflow.",
    failure:
      "A corrupt or incomplete source is held before any provider job is submitted.",
    metric: "Admitted source minutes · input failures",
    code: "source = store_immutable(video)\nmanifest = record(source.version, duration, language, rights_ref)",
  },
  {
    id: "policy",
    name: "Check rights & consent",
    short: "Rights",
    icon: "shield",
    kind: "control",
    tool: "Rights policy · voice & visual consent",
    x: 255,
    y: 40,
    rtf: 0,
    fixed: 3,
    cost: 0,
    purpose:
      "Check permission to translate the voice, alter visible lip movements, and transfer the media to ElevenLabs and Sync before paid processing.",
    stack: [
      [
        "Open Policy Agent",
        "Versioned policy decisions",
        "https://www.openpolicyagent.org/docs",
      ],
    ],
    input: "manifest · voice_consent · visual_edit_consent · territories",
    output: "policy_decision · policy_version · allowed_providers",
    decision:
      "Audio approval does not grant legal permission. Rights and visual-edit consent are separate requirements, rechecked before Sync and publication.",
    failure:
      "Revoked or missing rights stop work. A retry cannot repair a policy denial.",
    metric: "Rights holds · provider transfer eligibility",
    code: "assert rights.allow_translation(source)\nassert consent.allow_voice_use(source)\nassert consent.allow_visual_lipsync(source)",
  },
  {
    id: "segment",
    name: "Split into ordered batches",
    short: "Segment",
    icon: "film",
    kind: "cpu",
    tool: "FFmpeg · duration or scene-informed cuts",
    x: 510,
    y: 40,
    rtf: 0.02,
    fixed: 3,
    cost: 0.001,
    purpose:
      "Partition the complete source before per-chunk normalization. Use a maximum duration or prefer scene boundaries with the same hard duration cap. Every source interval remains in the manifest.",
    stack: [
      [
        "FFmpeg",
        "Cut and preserve timing metadata",
        "https://ffmpeg.org/ffmpeg.html",
      ],
      [
        "PySceneDetect",
        "Detect shots and transitions for a production boundary proposal",
        "https://www.scenedetect.com/docs/latest/",
      ],
    ],
    input: "source_video · duration_cap · optional_scene_boundaries",
    output: "ordered_chunks[] · start/end_timestamps · source_manifest_version",
    decision:
      "Clipping here means partitioning, not deleting content. Scene/shot boundaries are hints, not guaranteed semantic scenes. The simulator uses synthetic boundaries; production boundaries require detection and validation. Keep a contiguous coverage map for reassembly.",
    failure:
      "Gaps, overlap or an exceeded provider duration cap fail preflight. Do not lose source content at a boundary.",
    metric: "Chunk count · max chunk duration · complete coverage",
    code: 'boundaries = duration_grid(cap) if mode == "duration" else scene_informed_cuts(cap)\nmanifest = partition_entire_source(boundaries)\nassert contiguous_coverage(manifest)\nfor chunk in manifest: normalize(chunk)',
  },
  {
    id: "prepare",
    name: "Normalize each chunk",
    short: "Prepare",
    icon: "film",
    kind: "cpu",
    tool: "ffprobe · per-chunk normalization",
    x: 765,
    y: 40,
    rtf: 0.025,
    fixed: 4,
    cost: 0.002,
    purpose:
      "Check format, duration, timing and target languages. Prepare provider-accessible media references. Full-program dubbing does not require shot detection or highlight extraction.",
    stack: [
      [
        "FFmpeg / ffprobe",
        "Inspect format and media timing",
        "https://ffmpeg.org/ffprobe.html",
      ],
      [
        "Sync media formats",
        "Check actual input compatibility",
        "https://sync.so/docs/compatibility-and-tips/media-formats-support",
      ],
    ],
    input: "source_chunk · media_probe · destination_languages",
    output: "source_project_ref · source_chunk_uri · per_language_work[]",
    decision:
      "Normalize each planned source chunk and create a language job for each target. Long inputs must satisfy the actual account/model duration limit; use explicitly planned chunks when required, not mandatory scene splitting.",
    failure:
      "Incompatible media or an exceeded provider limit is a preflight error, not an automatic silent crop.",
    metric: "Preflight failures · language fan-out",
    code: "probe = inspect_media(original_video)\nvalidate_account_limits(probe)\nfor language in destinations: enqueue_audio_job(source, language)",
  },
  {
    id: "dub",
    name: "ElevenLabs dubbed audio",
    short: "Audio dub",
    icon: "languages",
    kind: "api",
    tool: "ElevenLabs Dubbing API",
    x: 1020,
    y: 40,
    rtf: 0.5,
    fixed: 20,
    cost: 0,
    purpose:
      "Create an ElevenLabs source project, generate each target-language dub, and download the audio for review. Translation, speaker handling and audio dubbing belong inside this managed provider boundary.",
    stack: [
      [
        "ElevenLabs Dubbing quickstart",
        "Project → language target → completed audio",
        SOURCES.eleven,
      ],
      [
        "ElevenLabs capabilities",
        "Account limits and audio output behavior",
        SOURCES.elevenOverview,
      ],
    ],
    input: "ElevenLabs source_project · target_language · rights_ref",
    output: "audio_artifact · audio_version · content_hash · provider_job_id",
    decision:
      "Stop after obtaining the audio. Pin a version and hash before asking a reviewer to approve it. Transcript editing/regeneration availability depends on the ElevenLabs plan; do not assume Enterprise-only editing is universally available.",
    failure:
      "Provider failures use bounded retries. A new audio version invalidates any previous approval and must be reviewed again.",
    metric: "Audio jobs · audio minutes · estimated dubbing spend",
    code: "project = elevenlabs.dubbing.project.create(source_url=source.uri)\n# Reuse the prepared source project across languages.\ntarget = elevenlabs.dubbing.project.language.create(project.id, target_language=locale)\naudio = wait_and_download(target)\ncheckpoint(audio.version, audio.hash)\nawait human_audio_approval(audio)",
  },
  {
    id: "audio_review",
    name: "Preview & approve audio",
    short: "Audio approval",
    icon: "users",
    kind: "human",
    tool: "Human decision · version-bound approval",
    x: 1020,
    y: 330,
    rtf: 0,
    fixed: 0,
    cost: 0,
    purpose:
      "A person previews the dubbed audio, checks meaning, pronunciation, voice and timing, then approves, requests a new version, or rejects it. Sync cannot start while this decision is pending.",
    stack: [
      [
        "Temporal Signals",
        "Persist a human decision in a production workflow",
        "https://docs.temporal.io/encyclopedia/workflow-message-passing",
      ],
    ],
    input:
      "audio_version · audio_hash · locale · source_version · review_notes",
    output:
      "reviewer · decision · approved_audio_hash · approved_version · audit_record",
    decision:
      "Approval authorizes only the exact audio artifact reviewed. Keep a durable decision record in production. The live simulator requires an explicit user action; it never approves audio automatically.",
    failure:
      "Rejected or revised audio cannot enter Sync. Reviewer absence creates a visible backlog rather than silently releasing work.",
    metric: "Audio awaiting approval · review wait · decisions · revision cost",
    code: 'decision = await workflow.wait_for_signal("audio_review")\nassert decision.audio_hash == audio.hash\nif decision.approved: release_to_sync(audio)\nelif decision.request_changes: generate_new_audio_version()\nelse: stop_without_sync_spend()',
  },
  {
    id: "lipsync",
    name: "Sync visual lip sync",
    short: "Lip sync",
    icon: "scan",
    kind: "api",
    tool: "Sync API · source chunk + approved audio",
    x: 765,
    y: 330,
    rtf: 0.8,
    fixed: 20,
    cost: 0,
    purpose:
      "Submit the matching source chunk and the exact human-approved translated audio to Sync. Sync generates a video whose mouth movements match that audio.",
    stack: [
      [
        "Sync manual dubbing pipeline",
        "Bring your own translated audio",
        SOURCES.sync,
      ],
      [
        "Sync speaker and segment mapping",
        "Target speakers and time ranges deliberately",
        SOURCES.syncSegments,
      ],
      [
        "Sync billing",
        "Plan- and frame-rate-dependent usage pricing",
        SOURCES.syncBilling,
      ],
    ],
    input:
      "source_chunk_uri · approved_audio_uri · audio_approval · Sync_model",
    output:
      "lip_synced_video · Sync_job_id · approved_audio_version · provider_status",
    decision:
      "Use separate video and audio inputs. Do not enable dubParams here: that would generate another dub and bypass the reviewed audio. Match durations deliberately rather than blindly looping or cutting speech.",
    failure:
      "Missing or stale approval blocks submission. Check account duration limits, multi-speaker targeting and duration mismatch behavior. Provider quotas are external job allowances, not self-hosted GPU slots.",
    metric:
      "Sync concurrency · output video seconds · estimated spend · failures",
    code: "assert approval.matches(audio.version, audio.hash, source.version)\njob = sync.generations.create(\n  model=selected_model,\n  input=[Video(url=source_chunk_uri), Audio(url=approved_audio_uri)]\n)\n# No dubParams: the supplied audio has already been reviewed.\nawait completed_webhook(job.id)",
  },
  {
    id: "reassemble",
    name: "Reassemble the full program",
    short: "Reassemble",
    icon: "film",
    kind: "cpu",
    tool: "FFmpeg · ordered timeline manifest",
    x: 510,
    y: 330,
    rtf: 0.04,
    fixed: 5,
    cost: 0.003,
    purpose:
      "Wait for every lip-synced chunk of one source and destination language. Verify coverage, restore original order and timestamps, then assemble the full localized program.",
    stack: [
      [
        "FFmpeg concat demuxer",
        "Join compatible outputs in manifest order",
        "https://ffmpeg.org/ffmpeg-formats.html#concat",
      ],
    ],
    input: "all_Sync_chunks · ordered_source_manifest · audio_approvals[]",
    output:
      "assembled_video · assembly_version · assembly_hash · coverage_report",
    decision:
      "The join is keyed by source version and language. Do not publish a partial program when one chunk is late, rejected or missing. Preserve the reviewed audio lineage of every chunk.",
    failure:
      "A missing, overlapping or wrong-language chunk blocks reassembly. Reject incompatible media or repair timestamps before creating a review candidate.",
    metric: "Chunks complete/expected · reassembly wait · coverage",
    code: "await all_chunks_complete(source_version, locale)\nassert contiguous_coverage(parts)\nassert every_chunk_has_matching_audio_approval(parts)\nassembled = concat_in_manifest_order(parts)\nawait human_final_review(assembled.version, assembled.hash)",
  },
  {
    id: "final_review",
    name: "Preview & approve final video",
    short: "Final approval",
    icon: "users",
    kind: "human",
    tool: "Human decision · assembled program",
    x: 255,
    y: 330,
    rtf: 0,
    fixed: 0,
    cost: 0,
    purpose:
      "A person previews the reassembled video and checks continuity, visible lip sync and the full soundtrack. Delivery waits for an explicit approval of this exact assembled artifact.",
    stack: [
      [
        "Temporal Signals",
        "Durable final release decision",
        "https://docs.temporal.io/encyclopedia/workflow-message-passing",
      ],
    ],
    input: "assembled_video · coverage_report · chunk_approval_trail",
    output: "final_reviewer · final_decision · approved_video_hash",
    decision:
      "This second human gate is separate from per-chunk audio approval. A successful Sync job is not final acceptance. Approval binds the current assembly hash, version and all constituent chunk versions.",
    failure:
      "Rejected final video is held for remediation; it is never silently delivered or automatically re-dubbed.",
    metric: "Final videos awaiting review · accepted programs · final holds",
    code: 'decision = await workflow.wait_for_signal("final_video_review")\nassert decision.video_hash == assembled.hash\nif decision.approved: publish(assembled)\nelse: hold_for_remediation(decision.notes)',
  },
  {
    id: "publish",
    name: "Package & deliver",
    short: "Deliver",
    icon: "send",
    kind: "io",
    tool: "Object storage · final rights check",
    x: 0,
    y: 330,
    rtf: 0.02,
    fixed: 4,
    cost: 0.002,
    purpose:
      "Recheck rights and publish the approved localized video with its source, audio-approval and Sync-job lineage.",
    stack: [
      [
        "AWS idempotency design",
        "Stable logical delivery identifiers",
        "https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/",
      ],
    ],
    input: "QA_passed_video · current_rights · approval_record",
    output: "delivery_receipt · asset_version · locale · audit_lineage",
    decision:
      "Retain a stable delivery identity for source, language, approved audio version and Sync result. Reconcile ambiguous external effects rather than claiming universal exactly-once execution.",
    failure:
      "Revoked rights block publication even after provider spend. Post-publication takedown is a separate production process.",
    metric: "Delivered lip-synced minutes · cost per delivered minute",
    code: "assert rights.valid_now(source)\nkey = logical_key(source.version, locale, audio.version, sync_job.id)\npublish_idempotently(key, qa_passed_video)\nrecord_delivery_receipt(key, approval.id)",
  },
];
export const CONNECTIONS = [
  ["ingest", "policy"],
  ["policy", "segment"],
  ["segment", "prepare"],
  ["prepare", "dub"],
  ["dub", "audio_review"],
  ["audio_review", "lipsync"],
  ["lipsync", "reassemble"],
  ["reassemble", "final_review"],
  ["final_review", "publish"],
];
export const SCENARIOS = [
  {
    id: "baseline",
    name: "Baseline · human approval required",
    tag: "BASELINE",
    icon: "activity",
    description:
      "Mixed-length English videos, three target languages. Every audio version waits for a person before Sync.",
    patch: { ...DEFAULTS },
    talk: "Open Audio approval, preview a track, then approve the exact version to release a Sync job.",
  },
  {
    id: "spike",
    name: "10× incoming catalog",
    tag: "CAPACITY",
    icon: "trending",
    description:
      "More sources create more dubbing requests and a growing human approval backlog.",
    patch: { arrival: 480 },
    talk: "Approval is a real stop. More API allowance does not replace reviewer decisions.",
  },
  {
    id: "dub-outage",
    name: "ElevenLabs unavailable",
    tag: "AUDIO PROVIDER",
    icon: "zap",
    description:
      "Audio generation stops; approved audio already released to Sync can continue.",
    patch: { dubOutage: true },
    talk: "Provider failures and the approval gate are independent.",
  },
  {
    id: "sync-outage",
    name: "Sync unavailable",
    tag: "VIDEO PROVIDER",
    icon: "zap",
    description:
      "Audio can still be generated and approved, but approved packages wait for Sync capacity.",
    patch: { syncOutage: true },
    talk: "Do not regenerate approved audio because the video provider is unavailable.",
  },
  {
    id: "no-reviewers",
    name: "No staffed audio reviewers",
    tag: "HUMAN GATE",
    icon: "users",
    description:
      "Audio accumulates at the approval gate. No unreviewed package enters Sync.",
    patch: { reviewers: 0 },
    talk: "The live demo never substitutes a synthetic quality score for an audio approval.",
  },
  {
    id: "languages",
    name: "Eight destination languages",
    tag: "FAN-OUT",
    icon: "globe",
    description:
      "Each language adds an independent audio artifact, approval decision and Sync job.",
    patch: { languages: 8 },
    talk: "Work multiplies by target language, while the original video remains shared.",
  },
  {
    id: "rights",
    name: "Revoke a license cohort",
    tag: "RIGHTS",
    icon: "shield",
    description:
      "A deterministic 20% source cohort loses permission. Rights are checked again before Sync and delivery.",
    patch: { revoked: true },
    talk: "Audio quality approval never overrides missing voice or visual-edit consent.",
  },
];
export const TOURS = [
  {
    stage: "ingest",
    title: "One complete source, ordered chunks",
    body: "Split the complete source into ordered chunks by duration or scene-informed boundaries, then normalize each chunk. No content is discarded.",
  },
  {
    stage: "dub",
    title: "ElevenLabs owns the audio dub",
    body: "The provider prepares the transcript and translated voices. We retrieve a versioned audio artifact for each destination language.",
  },
  {
    stage: "audio_review",
    title: "Stop and listen",
    body: "A person must preview and approve the exact audio version. Requesting a revision keeps Sync blocked.",
  },
  {
    stage: "lipsync",
    title: "Use the approved audio",
    body: "Sync receives the matching source chunk and the approved audio as separate inputs. We do not use its combined auto-dubbing flow.",
  },
  {
    stage: "publish",
    title: "Preserve the decision trail",
    body: "Final checks, rights and artifact lineage remain visible through delivery.",
  },
];
