import { STAGES } from "./catalog.js";
export const HELP = {
  ...Object.fromEntries(STAGES.map((stage) => [stage.name, stage.purpose])),
  Pipeline:
    "The selected workflow: source intake, rights, ordered segmentation, normalization, ElevenLabs audio, human audio approval, Sync lip sync, reassembly, final human review and delivery.",
  "Audio approval":
    "The first human gate. Preview the current chunk-language audio and approve its exact version, request another version or reject it. No unapproved audio reaches Sync.",
  "Final review":
    "The second human gate. Preview the reassembled full program, check continuity, visible lip sync and soundtrack, then approve delivery or hold it.",
  "Capacity planning":
    "An analytical estimate of source jobs, chunk amplification, provider concurrency and review effort. It never approves live media.",
  "Model economics":
    "Separate estimated ElevenLabs audio fees, Sync video usage, human review and application processing. Model comparisons are planning estimates, not measured quality rankings.",
  "Package traces":
    "Pinned snapshots of actual simulated stage history. Complete-program traces include multiple chunk paths, audio decisions, reassembly and final release approval.",
  "Design rationale":
    "The selected provider boundaries, review invariants, failure policies and links to verified documentation.",
  Inspect:
    "Fifty architecture questions tied to this managed-provider workflow, with answers and supporting evidence navigation.",
  "Model inputs":
    "Planning assumptions for the received source catalog, segmentation, provider limits, staffing and costs. Workload settings apply to newly arriving sources.",
  "Operating scenario":
    "A named experiment applied to the current simulation. Use a fresh baseline to compare isolated runs.",
  "Source hours received":
    "Expected incoming source video duration per simulated day. Individual videos have different lengths; finite runs can vary around the expected source-hour budget.",
  "Source catalog mix":
    "A weighted distribution of source video lengths. This is a characteristic of the incoming catalog, not an instruction to shorten a source.",
  "Shortest source video":
    "Lower duration bound, in minutes, for the custom source catalog. Each source receives an independently sampled duration.",
  "Longest source video":
    "Upper duration bound, in minutes, for the custom source catalog. Longer sources create more chunks; complete-program duration is preserved.",
  "Segmentation strategy":
    "Maximum-duration mode uses regular cuts. Scene-informed mode proposes variable boundaries with the same hard duration cap. Scene boundaries are synthetic in this browser; all source content is retained.",
  "Maximum chunk duration":
    "The largest processing chunk, in minutes. This differs from original source duration. Smaller chunks create more provider requests and audio approval decisions. Match the cap to the actual provider account/model limit.",
  "Target languages":
    "Destination languages generated for every chunk. The source is English. More languages multiply audio recordings, approvals and Sync jobs, followed by one complete program per language.",
  "ElevenLabs concurrent jobs":
    "Configured external audio-job allowance. It represents an account-specific provider quota, not a local GPU pool. Verify the actual account limit before using the estimate.",
  "Sync concurrent jobs":
    "Configured external lip-sync job allowance. Only human-approved audio can use these slots. Increasing it does not bypass approval or reassembly gates.",
  "Normalization workers":
    "Application workers for segmentation, per-chunk normalization and reassembly. External ElevenLabs and Sync jobs have their own quotas.",
  "Planned reviewers per gate":
    "Review staffing used for analytical capacity estimates. The live simulation still requires explicit user actions at both gates. Zero planned reviewers blocks approval.",
  "ElevenLabs outage":
    "Stops new audio dispatch and causes modeled in-flight audio attempts to fail. Already approved audio can continue through Sync.",
  "Sync outage":
    "Stops new visual lip-sync dispatch and causes modeled in-flight Sync attempts to fail. It does not invalidate or regenerate the approved audio.",
  "Revoke license cohort":
    "Revoke permission for a deterministic 20% of source identities. Rights are checked before provider processing and again at delivery; a human quality approval cannot override them.",
  "Retry budget":
    "Maximum retries after an initial failed provider attempt. Backoff delays reduce retry amplification. Exhaustion holds the affected batch.",
  "Delivery target":
    "Elapsed simulated minutes from source arrival to complete-program delivery, including both manual approval waits. It is a planning target, not a provider guarantee.",
  "Sync model":
    "A documented Sync model identifier. Model choice can change usage pricing and capabilities. This simulator does not infer measured visual quality from a model name or price.",
  "ElevenLabs audio fee":
    "Editable estimated dollars per minute of target-language audio submitted. This is not an account-specific quote. Include all requested audio versions, even ones later rejected.",
  "Sync video fee":
    "Editable estimated dollars per output video second at an assumed 25 frames per second. Sync legacy usage is frame-based, and actual plan rates may differ. This cost starts only after audio approval.",
  "Audio processing factor":
    "Assumed processing seconds per audio-media second for ElevenLabs jobs, plus fixed request overhead. It is a simulation input, not a benchmark.",
  "Lip-sync processing factor":
    "Assumed processing seconds per video-media second for Sync jobs, plus fixed request overhead. The provider can have variable queue and render latency in production.",
  "Review effort":
    "Estimated human review minutes per media minute, plus one minute of overhead per recorded decision. Used for costs and capacity planning, not to auto-complete a review.",
  "Reviewer hourly rate":
    "Estimated dollars per hour of human review effort. The demo charges estimated effort when a decision is recorded rather than billing a fictional idle reviewer pool.",
  "Expected audio approval":
    "An analytical per-chunk acceptance assumption. Every live audio version still needs a human action. Program-level success requires every required chunk, not merely one successful chunk.",
  "Expected final approval":
    "An analytical complete-program acceptance assumption. It never approves or releases a live final video.",
  "AUDIO AWAITING APPROVAL":
    "Chunk-language audio artifacts held at the first human gate. They have completed modeled audio generation but cannot be sent to Sync yet.",
  "FINAL VIDEOS AWAITING REVIEW":
    "Complete source/language programs that finished reassembly and now wait for the second human approval before delivery.",
  "SYNC JOBS SUBMITTED":
    "Number of modeled Sync attempts actually started. Each must carry an approval matching its source, audio version and content identifier. Retries count as additional attempts.",
  "PROGRAMS DELIVERED":
    "Complete localized programs released after final human approval and a last rights check. Chunk completions do not count as delivered programs.",
  "COST / DELIVERED MIN":
    "All modeled provider, human and application spend divided by complete-program minutes released. It is undefined until the first delivery; rejected and unfinished work remain in spend.",
  "ElevenLabs dubbed audio":
    "Estimated fees for each submitted audio-language attempt and requested revision. No actual provider invoice is generated in this app.",
  "Sync lip-sync video":
    "Estimated video usage for approved-audio lip-sync attempts. Unapproved or rejected audio does not incur this downstream modeled fee.",
  "Human audio + final review":
    "Estimated effort costs for both human gates. Each recorded approve, reject or revision decision adds the configured review effort.",
  "Packaging & delivery":
    "Modeled application cost for publishing complete final-approved programs. No partial chunk release is counted.",
  "Application processing":
    "Modeled application overhead, source segmentation, normalization and reassembly costs. The architecture uses external providers instead of an invented self-hosted inference fleet.",
  "Processing stage":
    "A coarse workflow activity or a human decision boundary with its own input/output contract and failure policy.",
  "Tasks / hour":
    "Estimated offered work at this stage, including chunk and target-language multiplication. Task counts alone do not capture media length.",
  "Mean service":
    "Estimated service minutes per stage task. Provider times and human effort are assumptions; they are not measured latency guarantees.",
  "Slots available":
    "Configured application workers, external provider job allowance, or planned reviewers. These resource types are deliberately different.",
  "Offered utilization":
    "Estimated concurrent demand divided by configured stage capacity. Values above 100% imply overload if offered work reaches the stage.",
  "Slots at 75%":
    "Estimated parallel slots needed for 75% use under the current assumptions. It excludes provider retries, manual revisions and real burstiness.",
  "Graph metric":
    "Choose waiting work, current active-job allowance use, or completed stage count. Human nodes always show their pending explicit decisions.",
};
export const TERMS = {
  ElevenLabs:
    "The managed dubbing provider used to create translated audio. The selected flow retrieves the audio and stops for human review before visual lip sync.",
  Sync: "The external provider that changes video mouth movements to match supplied audio. Here it receives a source chunk and human-approved audio as separate inputs.",
  dubParams:
    "Sync’s combined automatic-dubbing option. It is intentionally not used in this selected flow because generating audio inside Sync would bypass the prior human audio approval.",
  dubbing:
    "Creating another spoken-language version of the source audio. This is separate from modifying visible mouth movements.",
  "lip sync":
    "Changing visible mouth movements to correspond to the supplied translated audio. The selected implementation is Sync’s video+audio API.",
  chunk:
    "One ordered, time-bounded partition of the original source. Chunks preserve complete source coverage and are later reassembled; they are not selected highlights.",
  chunks:
    "Ordered source partitions that are processed independently and joined back into a complete program for each destination language.",
  batch:
    "A source-version and destination-language group of required chunks. The complete program cannot be assembled until every chunk succeeds.",
  reassembly:
    "Restoring all required lip-synced chunks to source order and timing, validating complete coverage, and creating the full-program candidate for final review.",
  manifest:
    "A versioned list of source intervals, chunk order, artifact identities and expected outputs. It is the contract used to prevent missing or overlapping content.",
  scene:
    "A meaningful or visually continuous part of a video. Shot detection supplies boundary hints but does not establish narrative meaning by itself.",
  PySceneDetect:
    "A real shot/transition detection tool that can inform production cut boundaries. The simulator uses synthetic boundaries and does not run the detector.",
  FFmpeg:
    "A real media-processing toolkit proposed for cutting, normalization and reassembly. This browser models the work but does not run FFmpeg.",
  ffprobe:
    "FFmpeg’s media-inspection utility for codec, duration, stream and timing metadata.",
  normalization:
    "Preparing a compatible and stable media representation while preserving source interval mapping. It is performed after chunk planning in this workflow.",
  HITL: "Human in the loop: an explicit person records a decision before the workflow is permitted to continue.",
  API: "Application programming interface: a documented request/response boundary to a service. Provider calls are simulated here.",
  CPU: "Central processing unit. Application workers may use CPU for media preparation; external provider processing is represented by job quotas.",
  GPU: "Graphics processing unit. The external providers own their rendering infrastructure; this selected simulator does not invent a local GPU pool for them.",
  SDK: "Software development kit: the provider’s client library for calling its API.",
  "SHA-256":
    "A cryptographic content digest. Locally loaded preview files are hashed in the browser; an approval must match the reviewed version and content.",
  "content hash":
    "A content-derived artifact identifier used to bind approval to a particular file rather than a mutable filename.",
  "audio version":
    "The specific recording revision under review. A newly generated or locally attached recording requires a fresh decision.",
  approval:
    "A named, explicit decision authorizing only the matching artifact version and content. Audio approval does not authorize final video delivery.",
  webhook:
    "A provider completion notification to a server endpoint. It is part of the proposed production integration; this static app models completion events.",
  queue:
    "Work waiting for capacity or a human decision. Waiting does not mean the provider job has started or been billed.",
  concurrency:
    "How many jobs can be active simultaneously. Provider account quotas are distinct from local worker capacity and human staffing.",
  quota:
    "A provider/account limit. Configure actual account allowances rather than treating them as self-hosted hardware slots.",
  retry:
    "Another attempt after failure, with a bounded count and delay. It must preserve the intended source and approved audio identity.",
  backoff:
    "A delay between retry attempts, usually increased after repeated failures to avoid amplifying an outage.",
  idempotency:
    "A repeated request has one intended logical effect. External provider billing and delivery still require explicit reconciliation.",
  lineage:
    "The linked history from original source through chunk, audio version, human approval, Sync output, assembly and final release.",
  join: "A workflow boundary that waits for every expected member of a group. Here it prevents publishing a partial localized program.",
  locale:
    "A destination language or language-region identifier, such as Spanish or es-MX.",
  S3: "Amazon’s object-storage service, proposed for immutable sources and artifacts.",
  Temporal:
    "A proposed durable workflow coordinator for provider activities, chunk joins and human decisions. It is not running in the browser.",
  RLS: "Row-level security: database rules restricting which tenant can access a record.",
  OPA: "Open Policy Agent: a proposed engine for versioned rights and consent decisions.",
  JSON: "A structured data format used for scenario imports, exports and proposed API payloads.",
  RTF: "Real-time factor: processing seconds divided by media seconds. Provider processing factors here are editable assumptions.",
  p95: "95th-percentile elapsed time among completed deliveries. Pending and rejected programs are excluded and can hide backlog.",
  SLO: "Service-level objective: an explicit operating target. This simulator’s delivery target is not a provider guarantee.",
  QA: "Quality assurance: checking the output against defined media, language, visual and continuity requirements.",
  fps: "Frames per second. Frame-based video usage pricing depends on this as well as duration and model.",
  FIFO: "First in, first out: queued eligible jobs are selected in arrival order subject to capacity and retry delay.",
};
