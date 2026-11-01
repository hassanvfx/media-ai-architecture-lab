// Plain-language help for the simulator. These explain the model, not measured
// production performance. Keys intentionally match visible labels, including
// earlier labels used in imported configurations or secondary views.
export const HELP = {
  "Align dialogue & mix audio":
    "After translated speech is generated, place it on the source timeline and mix it with supplied music-and-effects stems. This separate stage models processing time and cost before quality checks. It does not render real audio; excessive timing changes or missing stems require remediation in production.",
  "DUBBED OUTPUT DELIVERED":
    "Approved dubbed media minutes delivered per hour, estimated from the trailing five simulated minutes. Each destination language contributes separately. Planned, rejected, held and unfinished minutes do not count.",
  "95% DELIVERY TIME":
    "The time, in minutes, within which 95% of recorded completed outputs were delivered. It includes source processing, waits and downstream work. Unfinished videos are excluded, so also inspect waiting tasks and oldest wait.",
  "COST / DELIVERED MIN":
    "Total modeled spend divided by approved dubbed output minutes delivered. Includes provisioned compute, paid attempts, staffed review and delivery charges, including idle time and rejected work. These are illustrative operating assumptions.",
  "WAITING TASKS":
    "Tasks waiting for available workers across the pipeline. This is not a video count: one source can create shared analysis tasks and multiple destination-language tasks. Longer videos can require much more work than shorter ones.",
  "DELIVERED WITHIN TARGET":
    "The percentage of recently delivered outputs whose total elapsed time met the configured delivery target. The denominator contains delivered outputs only, not videos still waiting or running; a healthy percentage can coexist with a backlog.",
  "Shortest source video":
    "The shortest file duration expected in the custom incoming catalog mix, in minutes. This describes source material received, not an edit to an actual video. Each arriving file gets its own duration within the configured range.",
  "Longest source video":
    "The longest file duration expected in the custom incoming catalog mix, in minutes. Long files occupy workers longer and can increase waiting times. This is an input-distribution bound, not an instruction to shorten source content.",
  "Receive source videos":
    "Accept each original source video and read its actual duration and format. Assign a stable asset identity and retain the source file so every translated version and edit can be traced back to it.",
  "Check rights & consent":
    "Check whether this content may be edited, translated, voiced and delivered. Voice permissions and content usage rights must cover the proposed transformation. Revoked rights can stop work at admission or at final delivery.",
  "Inspect & normalize media":
    "Read the source format, streams, duration and timing, then prepare working audio and video representations. Preserve original timestamps so later translation, edits and dubbed audio can align with the source.",
  "Transcribe speech & speakers":
    "Convert the original speech into timestamped text and identify speaker turns. This shared analysis runs once for the source and supports all destination languages. Speaker-turn detection is not proof of a real-world speaker identity.",
  "Analyze scenes & visuals":
    "Locate shot boundaries and time-bound visual evidence that helps explain the source. Speech and visual analysis can run in parallel. Shot boundaries alone do not identify a coherent editorial highlight.",
  "Prepare localization plan":
    "Decide what content to localize. Full-program dubbing preserves the source timeline; highlight creation selects meaningful source intervals first. The simulator models the total selected duration, not exact clip boundaries or clip counts.",
  "Update searchable catalog":
    "Index source-grounded transcript and visual segments so authorized users can search the catalog. This supporting branch runs separately and does not have to block an approved dubbed delivery.",
  "Translate & fit dialogue":
    "Translate the selected dialogue for each destination language while preserving meaning, names and terminology. Adapt wording and speaking time to the source timeline; translated text is not yet a dubbed audio track.",
  "Generate translated speech":
    "Generate spoken audio from the translated script. This is the voice-generation part of dubbing. A finished production output also needs voice selection, timing, alignment, mixing and media assembly; the browser models their operating assumptions.",
  "Check audio & video quality":
    "Evaluate whether a proposed localized output may proceed automatically or needs human review. Real checks cover technical validity and language/audio quality. The simulator uses a synthetic score, not analysis of a rendered media file.",
  "Human quality review":
    "An editor assesses an output that did not meet the automated quality threshold. Review consumes staffed time and can approve or reject the result. The simulator models those outcomes without playing or evaluating actual media.",
  "Package localized outputs":
    "Recheck content rights and prepare the approved localized delivery package. The production design targets video with translated audio and timed text; the simulator records processing and delivery outcomes rather than rendering real files.",
  "Architecture Lab":
    "An interactive planning model for turning source video into approved dubbed videos or dubbed highlights. It simulates work, delays, failures and cost; it does not process real media.",
  "Model inputs":
    "Describe the incoming catalog, desired outputs, available workers and operating policy. These are planning assumptions. New packages capture workload settings when they arrive.",
  "Scenario analysis":
    "Apply a named operating situation, such as more incoming media or a speech-provider outage, and inspect the resulting queues, quality decisions and cost.",
  "Operating scenario":
    "The named situation being explored. Controls can alter that situation further. Reset the run when you want an isolated comparison from a clean starting state.",
  "Current constraint":
    "The processing stage currently under the greatest observed pressure. A quiet downstream queue can be misleading if an earlier stage is blocking work.",
  "Decision to test":
    "A suggested engineering question for the current scenario. Change one assumption, then compare outcomes and unfinished work before drawing a conclusion.",
  "Source hours received":
    "Expected duration of incoming source video per simulated day, before editing or translation. Finite samples vary around that target. A day can contain many short files and a few long programs; source hours are not a file count.",
  "Source catalog":
    "Total incoming source-media hours per simulated day. It measures workload volume before editing, target-language multiplication or quality rejection.",
  "Catalog input":
    "Total incoming source-media hours per simulated day. More hours require more processing, even if the number of files stays the same.",
  "Source catalog mix":
    "The observed mix of short videos, episodes and long programs in the incoming catalog. Each package receives its own duration. Choose a mix representative of your workload; this does not trim uploaded videos.",
  "Source duration":
    "The duration of an incoming file, measured from the media in a real system. Catalog files vary in length. The simulator should describe their duration distribution rather than force every file to one length.",
  "Typical source duration":
    "A summary of the incoming catalog's file lengths. It is a workload observation, not an instruction to shorten or extend source footage. Individual packages may be shorter or longer.",
  "Average source duration":
    "The mean length of incoming source files. At the same total hours per day, a catalog of short files creates more separate jobs and fixed per-job overhead than a catalog of long programs.",
  "Localization plan":
    "Choose the deliverable: dub complete programs, or select highlights first and dub only those intervals. Localization adapts language and timing; the selected plan determines how much source content is processed downstream.",
  "Dub full programs":
    "Keep the entire source program and create a translated voice track for each destination language. The planned content share is 100%; this is not automatic highlight extraction.",
  "Create & dub highlights":
    "Choose shorter, coherent intervals from the source, then translate and dub those selected portions. A highlight is a source interval with editorial context, not an arbitrary crop or a fixed number of clips.",
  "Selected source share":
    "The percentage of source minutes retained in the planned highlights. For example, 20% of a 40-minute program is 8 selected minutes per language. It does not specify how many individual clips exist.",
  "Clip extraction":
    "The share of source duration selected for the output edit. For example, 20% of a 40-minute source is 8 selected minutes. This simplified model tracks aggregate minutes, not discrete clip counts or exact edit boundaries.",
  "Target languages":
    "The destination languages receiving their own translated script, voice generation and quality checks. Three languages multiply the localized output minutes by three; shared source analysis still happens once.",
  "Destination languages":
    "The languages of the deliverables. Each destination creates independent translation, dubbed-audio, quality and delivery work. This is different from the original language spoken in the source.",
  "Source language":
    "The original spoken language in the incoming program. Transcription captures that speech before a separate translation is created for each destination language.",
  "Potential output demand":
    "Planned localized minutes before rights holds or quality rejection: source minutes × selected source share × number of destination languages. It is demand, not accepted delivery.",
  "Localized output demand":
    "Planned output minutes across all destination languages per hour. Source editing happens once, but each language adds its own translation, audio generation and checking work.",
  "Analysis cache hit rate":
    "The share of incoming packages allowed to reuse compatible, version-matched speech and visual analysis. A cache hit skips those analysis stages; it does not skip rights checks or destination-language quality checks.",
  "Voice synthesis workers":
    "How many voice-generation tasks can run at the same time. A worker is a modeled processing slot, not necessarily a dedicated physical GPU. More slots can reduce queues while increasing provisioned cost.",
  "Speech GPU slots":
    "Concurrent processing slots for voice synthesis. This simplified model associates them with provisioned accelerator capacity; it does not simulate GPU memory placement or real model-serving efficiency.",
  "Speech slots":
    "The number of voice-synthesis tasks that can run concurrently. Extra slots help only if voice synthesis is the limiting stage and other providers or workers can keep up.",
  "Processing workers":
    "Concurrent processing slots for media preparation and quality checks. The model gives these stages separate worker pools; it does not model every CPU core, codec or memory limit.",
  "CPU slots per stage":
    "Concurrent task slots available to each modeled CPU-heavy stage. It is a service-capacity assumption, not a count of physical processor cores shared across the entire pipeline.",
  "Human reviewers":
    "Editors available to inspect uncertain outputs. Each editor handles one modeled review task at a time. More editors reduce review waits but add staffed-time cost, including idle time.",
  Reviewers:
    "Editors available for outputs that need human judgment. Review adds processing time, waiting time and staffing cost; an editor may approve or reject the result.",
  "Speech autoscaling":
    "Increase voice-synthesis capacity when the queue grows. New capacity takes time to become available and has a ceiling. Autoscaling does not instantly remove a backlog or bypass provider outages.",
  "Provisioned speech capacity":
    "Voice-generation capacity currently made available by the model. Provisioned workers can incur cost even while idle; configured base capacity and delayed autoscaling can differ.",
  "Primary speech outage":
    "Simulate the main voice-generation service becoming unavailable. Work waits or retries unless the approved fallback is enabled. Already-running primary calls may also fail.",
  "Primary outage":
    "Simulate the main voice-generation service becoming unavailable. Enable an approved fallback to test recovery through another provider with different assumed timing, cost and quality.",
  "Approved fallback":
    "An alternative voice-generation provider that is permitted for the content and has already been assessed. The simulator changes service time, price and quality assumptions when fallback routing is used.",
  "Retry budget":
    "The maximum extra attempts allowed after a transient voice-generation failure. Retries wait before trying again and consume capacity and money. Exhausted work is quarantined instead of retried forever.",
  "Speech model profile":
    "Choose a synthetic voice-model strategy with different assumed speed, per-minute cost and quality. These profiles illustrate tradeoffs; they are not vendor benchmarks or current price quotes.",
  "Quality threshold":
    "The minimum synthetic quality score required for automatic approval. Outputs below it go to human review. Raising the threshold can improve screening while increasing review queues and total cost.",
  "Acceptance threshold":
    "The synthetic score required to bypass editorial review. This is an illustrative routing rule, not a calibrated guarantee of real voice quality, translation accuracy or audience acceptance.",
  "Delivery target":
    "The planned maximum elapsed minutes from source admission to an accepted localized output. It includes processing and waiting. Delivered-only attainment can hide outputs that are still blocked.",
  "Delivery deadline":
    "The target end-to-end time from the source entering the system to an accepted localized output. This is measured for each output; completed-only metrics do not describe all unfinished work.",
  "Revoke license cohort":
    "Simulate revoked usage rights for a deterministic subset of source assets. Admission and final publication recheck permission. The model does not execute a real deletion or takedown of previously delivered files.",
  "ACCEPTED THROUGHPUT":
    "Approved localized output minutes delivered per hour, estimated from the trailing five simulated minutes. Three accepted language versions count separately. Attempted or rejected output does not count.",
  "Accepted throughput":
    "Approved localized output minutes delivered per hour over the trailing five simulated minutes. It measures useful delivered media, not tasks started or source minutes received.",
  "OBSERVED P95":
    "The completion time below which 95% of recorded completed outputs fall, in minutes. It includes queueing and processing. It excludes unfinished packages, so stalled work can make this look deceptively healthy.",
  "Observed P95":
    "The 95th percentile of recorded output completion times. For example, 4 minutes means 95% of completed outputs took 4 minutes or less. Pending outputs are excluded.",
  "COST / ACCEPTED MIN":
    "All modeled spend divided by accepted localized output minutes. Includes provisioned compute, staffed review, retries and other modeled charges, so idle capacity and rejected output still affect the result.",
  "Cost / accepted min":
    "Total modeled operating spend divided by approved delivered media minutes. This is useful-output cost, not the voice provider's advertised price per generated minute.",
  "PENDING WORK":
    "Tasks waiting for a worker across the pipeline. One source can generate several tasks and language outputs, so this is not a count of source files. Check oldest wait as well as task count.",
  "Pending work":
    "Tasks currently waiting across processing stages. A long program and a short clip can count as one task each while requiring very different amounts of service time.",
  "DEADLINE ATTAINMENT":
    "The percentage of delivered outputs in the trailing simulated hour that met their target delivery time. It excludes outputs still pending; always read it alongside backlog and oldest wait.",
  "Deadline attainment":
    "The share of recently delivered outputs that met the configured delivery target. A high value does not prove all incoming work is healthy because unfinished output is not in the denominator.",
  "Queue depth":
    "The number of tasks waiting to start at a processing stage. Tasks differ in duration and required work, so queue age and media minutes are also important.",
  Utilization:
    "The share of available modeled worker capacity currently occupied. High utilization can mean efficient use or overload; compare it with waiting time and delivery outcomes.",
  Completed:
    "The number of tasks that have finished at this stage. A completed processing task is not necessarily an accepted output; later rights or quality checks can still block it.",
  queued:
    "Tasks waiting for available processing capacity. Queue time is elapsed time before execution and is separate from the stage's own processing time.",
  "active slots":
    "Tasks running now compared with concurrent task capacity. A slot is a modeled worker opportunity, not a promise about how many physical CPU cores or GPU devices exist.",
  "oldest wait":
    "The longest time any task in this queue has been waiting. It reveals stuck or starved work that a count or completed-only latency statistic can hide.",
  "System architecture":
    "The map of processing stages and handoffs. Shared source preparation happens once, destination-language work branches afterward, and approved media is delivered only after final rights checks.",
  "Capacity planning":
    "Estimate how much work each stage receives and how many concurrent workers that demand needs. This is an analytical planning view; it uses assumptions, not measured production guarantees.",
  "Model economics":
    "Compare assumed model strategies and inspect where the simulated operating budget goes. Cheaper generation can increase total useful-output cost if it causes more review or rejection.",
  "Execution traces":
    "Follow a recorded package through its completed stage spans, branching decisions and final outcome. Replay is independent of the currently running simulation.",
  "Design rationale":
    "Read proposed architecture choices, alternatives and operational tradeoffs. These are reference design decisions rather than integrations implemented by the browser simulator.",
  Inspect:
    "Search fifty architecture questions, plain-language answers and links to supporting views. Evidence labels distinguish interactive simulation from proposed design and execution plans.",
  "Inspect · 50":
    "Explore fifty architecture questions and their supporting evidence. These describe both simulated behavior and proposed production design; the scope is identified on each answer.",
  "Follow a package":
    "Pin one completed source/output trace and step through its recorded processing story. You can inspect branches, retries, queue time, quality decisions and final disposition without the selected package changing.",
  "Play story":
    "Advance through the selected package's recorded spans at a readable pace. Playback speed is illustrative; timestamps and durations remain those produced by the simulation.",
  "Simulation speed":
    "How many simulated seconds advance per real second. Increasing playback speed lets you explore longer operating windows; it does not make individual modeled workers faster.",
  "Reset run":
    "Start a new simulation with empty queues and counters. Use the selected reset option to keep current parameters or restore the baseline; exported settings do not contain a full prior queue state.",
  "Export run":
    "Download a JSON file containing the current model parameters and run summary. It supports review and parameter sharing; it is not a complete restorable checkpoint of every in-flight task.",
  "Model notes":
    "Read the simulation's formulas, pricing assumptions, synthetic quality behavior and omitted production details before treating a result as an operating commitment.",
  "Model notes & assumptions":
    "Explain what the model measures and what it leaves out. Costs and quality scores are illustrative, and browser timing is not a benchmark of real media processing.",
  "Source demand":
    "Incoming source-media hours per day before editing and language multiplication. Workload mix determines how those hours are distributed across individual files.",
  "Pools above target utilization":
    "Processing stages whose analytical demand exceeds the selected planning utilization target. The count identifies stages needing investigation; it does not account for every real production constraint.",
  "Planning target":
    "The utilization level used for capacity estimates. A target below 100% leaves room for variation, failures and bursts; 75% is an illustrative assumption, not a universal standard.",
  "Processing stage":
    "A distinct kind of work, such as transcription, translation or quality checking. Some stages operate on shared source media; others repeat for each destination language.",
  "Tasks / hour":
    "The estimated number of tasks offered to a stage per hour before upstream throttling. A task count does not describe the full workload unless task durations are also known.",
  "Mean service":
    "Average time spent actively processing one task, excluding queue wait. Duration varies with media length, model assumptions and timing variation.",
  "Slots available":
    "The number of tasks that may run concurrently at the stage. This analytical capacity is expressed as task slots rather than a detailed machine or cluster inventory.",
  "Offered utilization":
    "Incoming task rate × mean service time ÷ available concurrent capacity. Above 100% means the stage cannot keep up if all offered work reaches it. Upstream blocking can conceal this in the live queue.",
  "Slots at 75%":
    "Concurrent task slots estimated to keep offered demand at or below 75% utilization. It provides planning headroom but does not include all retries, burstiness or real hardware limitations.",
  "Accepted output":
    "Localized output minutes approved and delivered by the simulated workflow. Each language counts separately; rejected, held or unfinished work does not count.",
  "First-pass yield":
    "The percentage of evaluated outputs that pass the automated quality gate without human review. It is based on synthetic scores, not a measured quality benchmark.",
  "First-pass gate yield":
    "The share of evaluated outputs that pass the automated synthetic quality threshold directly. Outputs sent to review may still be approved later.",
  "Batch makespan":
    "Elapsed simulated time from the start of a comparison batch until work finishes or the comparison time limit is reached. Check unfinished tasks before treating this as a fully drained completion time.",
  "Unfinished tasks":
    "Work still queued or running when the comparison stopped. A model strategy with unfinished work has not completed the same useful delivery outcome as a fully drained run.",
  "Run cost breakdown":
    "How simulated spend accumulates across compute, inference, human review and delivery. The values are operating assumptions, not current vendor invoices or quoted prices.",
  "All modeled spend":
    "Every charged category in the model, including provisioned compute and staffing during idle time. Spending can continue while little or no output is accepted.",
  "Admitted source assets":
    "Source files accepted into the workflow. One source can lead to several language outputs and many internal processing tasks.",
  "Delivered derivatives":
    "Approved destination-language outputs created from source media. A derivative may contain a complete dubbed program or the selected highlight minutes, depending on the output plan.",
  "Analysis cache hits":
    "Source packages that reused compatible speech and visual analysis. These avoid repeated analysis work while retaining downstream editing, localization and quality checks.",
  "Transient retries":
    "Extra voice-generation attempts following temporary failures. Attempts cost money and time even if the final output is eventually rejected or held.",
  "Quarantined derivatives":
    "Outputs stopped for manual investigation after rejection or retry exhaustion. Quarantine is a controlled terminal state in the model, not a successful delivery.",
  "Rights holds / deferred admissions":
    "Rights holds stop work without current permission. Deferred admissions delay new workload when model safety limits are reached. They are different causes of non-delivery.",
  "Unit cost evolution":
    "How total modeled spend per accepted output minute changes over simulated time. Early values can be unstable before the system has delivered enough useful output.",
  "Saved checkpoint vs. current run":
    "Compare a saved summary of earlier metrics with the current run. A saved metric snapshot is not a restoration of every worker, retry and queued package.",
  "Suggested stack":
    "Examples of real tools that could implement the proposed stage. Links lead to their documentation; the browser does not call these tools or verify a production integration.",
  "Architecture decision":
    "Why the proposed component is separated or implemented this way, including the operational tradeoff that should be tested with representative media.",
  "Failure boundary":
    "What can fail at this stage and how the proposed design contains or escalates it. Only failures explicitly represented by the engine are simulated.",
  "Input contract":
    "The proposed data a stage expects, such as an object-storage reference, language or source timestamps. It is a design-level interface, not a live API schema enforced against real media.",
  "Output contract":
    "The proposed versioned result a stage produces for downstream work. Keeping references and source timestamps makes retries and editorial inspection easier.",
  "Implementation sketch":
    "Illustrative pseudocode showing how a production stage could work. It explains design intent and is not executed by the browser simulation.",
  "Service-time assumption":
    "The illustrative time a modeled worker needs for this stage: fixed overhead plus duration-dependent work and small timing variation. Real performance requires benchmarking the actual tool and media.",
  "Catalog ingest":
    "Receive the original video or audio file, record its identity and metadata, and place a reference into the workflow. Source media remains the input of record.",
  "Rights & admission":
    "Check whether this content may be edited, translated, voiced and delivered before paying for processing. Missing or revoked rights stop the package rather than trigger endless retries.",
  "Probe & normalize":
    "Read the file's codec, duration and timing, then prepare audio and a lightweight working video representation. Preserve the link back to original source timestamps.",
  "Speech intelligence":
    "Transcribe what people say and identify when each speaker talks. This shared source analysis is reused for destination-language translation and editing.",
  "Visual understanding":
    "Find shots and time-bound visual events that help an editor understand the source. Visual segmentation alone does not prove that an interval makes a good standalone highlight.",
  "Editorial planning":
    "Decide which source intervals belong in the output and preserve evidence for those choices. Full-program dubbing retains the program; highlight creation selects shorter coherent portions.",
  "Discoverable catalog":
    "Make source-grounded transcript and visual segments searchable. This is a separate supporting branch and need not delay an otherwise approved dubbed delivery.",
  "Translation & timing":
    "Adapt the selected script to the destination language and available speaking time. Preserve names, terminology and meaning; translated text alone is not yet a dubbed voice track.",
  "Quality gates":
    "Check the output before automatic delivery, including technical validity and the proposed language/audio criteria. The simulator uses a synthetic score to choose direct approval or human review.",
  "Editorial review":
    "A human editor assesses outputs that need judgment. The model represents review time and approval/rejection; it does not inspect actual media or guarantee a reviewer's real decision.",
  "Package & deliver":
    "Assemble the approved output media, run a final rights check and record accepted delivery. Packaging is a proposed production step; the browser produces metrics and trace records rather than video files.",
  Clip: "A selected interval of a larger source program, such as a self-contained interview answer. It is not the source-duration slider or the percentage retained. This model may represent several intervals as aggregate selected minutes.",
  Dubbing:
    "Creating a new spoken-language version of source content, including translated dialogue, generated or recorded voices, timing, mixing and final media assembly. Captions alone are not dubbing.",
  "Translated captions":
    "On-screen text in another language. Captions can accompany a localized video but do not replace the spoken audio track as dubbing does.",
  "Voice synthesis":
    "Generate spoken audio from a written script. It is one step in dubbing; it does not by itself guarantee translation accuracy, natural timing, speaker identity or a finished video mix.",
};

export const TERMS = {
  AI: "Artificial intelligence: models used here to propose transcription, editing, translation or generated speech. Their outputs still need validation.",
  ML: "Machine learning: models whose behavior is learned from examples. Representative evaluation is needed before relying on a model for a media task.",
  CPU: "Central processing unit: general-purpose compute used for tasks such as decoding media and technical quality checks. A modeled worker slot is not necessarily one physical core.",
  GPU: "Graphics processing unit: an accelerator often used for speech or visual models. The simulator abstracts serving capacity as concurrent worker slots.",
  IO: "Input/output: moving or reading data, such as receiving files, writing an index or delivering media, rather than mainly running a model.",
  API: "Application programming interface: the documented way one service asks another service to do work. A provider API can have rate limits, failures and usage charges.",
  ASR: "Automatic speech recognition: converting spoken audio into written words, ideally with timestamps. It captures the source speech before translation.",
  TTS: "Text-to-speech: generating spoken audio from a script. Dubbing also requires translation, timing, voice selection, mixing and final assembly.",
  LLM: "Large language model: a model that can propose text, translations or structured edit plans. A fluent proposal is not proof that it is faithful to the source.",
  SLO: "Service-level objective: a measurable operating target, such as the percentage of outputs delivered within a deadline. The simulator's target is a planning assumption.",
  SLA: "Service-level agreement: an external customer commitment about service performance. A synthetic simulation result is not a contractual guarantee.",
  SLI: "Service-level indicator: the measured quantity used to track a reliability target, such as successful on-time deliveries.",
  P95: "95th percentile: the value at or below which 95% of observations fall. This app's observed P95 uses completed outputs and excludes work still pending.",
  P99: "99th percentile: the value at or below which 99% of observations fall. Tail measurements need enough observations and clear treatment of unfinished work.",
  QA: "Quality assurance: checking whether an output meets technical and editorial requirements before accepting it.",
  QC: "Quality control: checks applied to the generated media, such as timing, audio levels, translation or file validity. This model routes using synthetic quality scores.",
  EDL: "Edit decision list: a structured record of the source intervals selected for an output and how they should be assembled. It preserves where each highlight came from.",
  PTS: "Presentation timestamp: the timing coordinate used to place audio or video samples in playback. Preserving it helps locate edits and keep sound synchronized with pictures.",
  "A/V":
    "Audio/video: the sound and picture streams of a media file. Their timing must remain synchronized through processing and dubbing.",
  WER: "Word error rate: a transcription metric that counts word substitutions, deletions and insertions relative to a reference transcript. Lower is better, but it does not measure all dubbing quality.",
  MOS: "Mean opinion score: an average of human ratings of perceived quality, often for speech. Real use needs a defined rubric and representative listeners.",
  RTF: "Real-time factor: processing time divided by media duration. A factor of 0.5 means 30 seconds of active processing for one minute of media, before queueing or fixed overhead.",
  OPA: "Open Policy Agent: an example policy engine for deciding which content transformations and deliveries are permitted.",
  RLS: "Row-level security: database rules that restrict which records a user or tenant can access. It supports isolation but does not replace all application authorization.",
  S3: "Amazon Simple Storage Service: object storage for source videos, working files and approved outputs. Workflow messages typically pass file references rather than entire videos.",
  AWS: "Amazon Web Services: a cloud platform offering storage, compute, queues and other infrastructure. Tools listed here are examples, not active services called by this demo.",
  K8s: "Kubernetes: a system for scheduling and operating application workloads across machines. The browser models capacity without running a cluster.",
  KEDA: "Kubernetes Event-Driven Autoscaling: a tool that can adjust worker counts from queue or event signals. Real scaling has startup time and resource limits.",
  SQS: "Amazon Simple Queue Service: a managed message queue that can hold work until a worker is ready to process it.",
  ADR: "Architecture decision record: a short document describing a design choice, alternatives, evidence, tradeoffs, ownership and conditions for revisiting the choice.",
  TCO: "Total cost of ownership: the full operating and maintenance cost of a solution, including infrastructure, provider use, people and operational complexity.",
  USD: "United States dollars. Monetary values in this app are illustrative model assumptions, not current vendor quotes.",
  JSON: "JavaScript Object Notation: a structured text format used here to export model parameters, summaries and proposed data contracts.",
  UI: "User interface: the controls, labels and views a person uses to understand and operate this application.",
  ID: "Identifier: a stable label used to connect a source, output, tenant or trace to its records. An identifier is different from the media file itself.",
  ACL: "Access control list: rules stating which identities may access a particular resource or content item.",
  DLQ: "Dead-letter queue: a place to isolate messages that cannot be processed successfully after bounded attempts, so they can be investigated separately.",
  VAD: "Voice activity detection: finding intervals containing speech before transcription or other audio processing.",
  RAG: "Retrieval-augmented generation: finding relevant source material and supplying it as evidence for a generated answer. Retrieval must still enforce content permissions.",
  RBAC: "Role-based access control: granting access according to a person's assigned role, such as editor or administrator.",
  PII: "Personally identifiable information: data that can identify a person and may require special handling.",
  "A/B":
    "A/B comparison: evaluating two alternatives under a controlled method. This app's synthetic profile comparison demonstrates accounting, not a real human quality study.",
  "Recall@k":
    "The fraction of relevant items found among the first k search results. It measures retrieval coverage, not whether the returned content may legally be used.",
  "fan-out":
    "Split shared upstream work into independent downstream jobs, such as one localization job for each destination language.",
  join: "Wait for required parallel branches to finish, then combine their results. Editorial planning needs both speech and visual evidence when those analysis branches run.",
  queue:
    "Work waiting for available capacity. Waiting time is separate from active processing time and is part of the customer's end-to-end delay.",
  slot: "One modeled opportunity to run a task concurrently. A slot is an abstraction and does not necessarily equal one machine, CPU core or GPU device.",
  locale:
    "A language and, where relevant, regional convention for an output, such as Mexican Spanish. This model uses language codes as a simplified destination label.",
  derivative:
    "An output made from a source asset, such as its Spanish-language dubbed version or a dubbed set of selected highlights.",
  asset:
    "An identifiable source-media item, such as one uploaded interview, episode or program. One asset may produce several destination-language outputs.",
  clip: "A selected source interval that can be edited into a shorter output. The retained-duration percentage is not the number of clips.",
  dubbing:
    "Producing a new spoken-language version of content. Translation, voice creation, timing, mixing and final assembly all contribute to the finished result.",
  diarization:
    "Identifying who spoke when in an audio recording. It separates speaker turns; it does not by itself establish the real-world identity of a speaker.",
  latency:
    "Elapsed time from a defined start to finish. End-to-end delivery latency includes waiting, processing and retry delays.",
  throughput:
    "How much useful work finishes per unit time. Here, accepted throughput is approved localized media minutes delivered per hour.",
  quarantine:
    "Stop a failed or rejected output in an isolated state for investigation rather than publishing it or retrying forever.",
  inference:
    "Running a trained model to produce a result, such as a transcript or a voice track. Inference can consume compute time or provider usage charges.",
  checksum:
    "A value calculated from file contents to detect corruption or accidental changes when media is transferred or stored.",
  codec:
    "The format and method used to encode or decode audio or video. Codec differences affect compatibility, processing time and delivery quality.",
  remux:
    "Copy compatible audio and video streams into a new container without re-encoding them. It can preserve quality and avoid unnecessary processing.",
  transcode:
    "Decode and re-encode media into a different format or profile. It can be expensive and may change quality or timing if not handled carefully.",
  proxy:
    "A smaller or easier-to-process working version of a source video, used for analysis or editing while retaining the link to the original media.",
  glossary:
    "A controlled list of names and terms that should be translated consistently, such as product names or approved brand vocabulary.",
  Temporal:
    "An example durable workflow engine that records progress, retries failed activities and coordinates long-running jobs. The browser simulates some of these behaviors.",
  PostgreSQL:
    "An example relational database for asset manifests, permissions, workflow references and audit records.",
  FFmpeg:
    "An open-source media toolkit for reading, converting, filtering and assembling audio/video. It could prepare working media and package finished dubbed outputs.",
  ffprobe:
    "A companion tool to FFmpeg that reads media metadata, such as duration, streams, codec and timing, without requiring a person to choose the source length.",
  "faster-whisper":
    "An example implementation of Whisper speech recognition, used to turn source speech into timestamped text.",
  "pyannote.audio":
    "An example audio-analysis toolkit for tasks such as speaker diarization: identifying when different speakers are talking.",
  PySceneDetect:
    "An example tool for locating shot boundaries. Shot changes can help segment a video but do not automatically identify coherent editorial highlights.",
  Triton:
    "NVIDIA Triton Inference Server: an example service for running and batching model inference requests. It is not itself a speech or translation model.",
  NVIDIA:
    "A hardware and software provider whose accelerators and model-serving tools are examples in the proposed stack.",
  Pydantic:
    "An example Python tool for validating structured data, such as checking that a proposed edit plan has the expected fields and types.",
  Qdrant:
    "An example search database for vector-based retrieval. In this design it helps find source-grounded transcript and visual segments.",
  OpenTelemetry:
    "Open standards and tools for collecting traces, metrics and logs across services so operators can understand what happened to a package.",
  DeepL:
    "An example commercial translation provider. The demo does not call it or claim its actual current speed, price or quality.",
  ElevenLabs:
    "An example speech-generation provider. A production integration requires its own rights, consent, quality and operational validation.",
  CloudFront:
    "An example content-delivery network for serving approved media files efficiently to viewers or downstream systems.",
  Kubernetes:
    "A system for scheduling and operating application workloads across machines. This app represents its capacity concepts without running a real cluster.",
};
