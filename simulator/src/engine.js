import { DEFAULTS, STAGES, PROFILES } from "./catalog.js";
import {
  CATALOG_MIXES,
  DESTINATIONS,
  durationSummary,
  sampleSourceMinutes,
  segmentSource,
  validCoverage,
} from "./workload.js";
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export function normalizeConfig(input = {}) {
  const c = { ...DEFAULTS, ...input };
  for (const [key, min, max] of [
    ["arrival", 0, 4800],
    ["languages", 1, 11],
    ["chunkMinutes", 1, 30],
    ["sourceMinutes", 0.1, 180],
    ["minSourceMinutes", 0.1, 180],
    ["maxSourceMinutes", 0.1, 180],
    ["dubConcurrency", 1, 24],
    ["syncConcurrency", 1, 24],
    ["appWorkers", 1, 24],
    ["reviewers", 0, 20],
    ["dubRate", 0, 30],
    ["syncRate", 0, 2],
    ["dubRtf", 0.05, 10],
    ["syncRtf", 0.05, 10],
    ["reviewFactor", 0.25, 3],
    ["reviewerRate", 0, 200],
    ["expectedApproval", 5, 100],
    ["expectedFinalApproval", 5, 100],
    ["retries", 0, 4],
    ["maxAudioRevisions", 0, 5],
    ["slo", 1, 240],
    ["seed", 1, 2147483646],
  ])
    c[key] = clamp(
      Number.isFinite(Number(c[key])) ? Number(c[key]) : DEFAULTS[key],
      min,
      max,
    );
  for (const key of [
    "languages",
    "dubConcurrency",
    "syncConcurrency",
    "appWorkers",
    "reviewers",
    "retries",
    "maxAudioRevisions",
    "seed",
  ])
    c[key] = Math.round(c[key]);
  for (const key of ["dubOutage", "syncOutage", "revoked"])
    c[key] = c[key] === true;
  if (!PROFILES[c.model]) c.model = "standard";
  c.durationMode =
    input.durationMode === "fixed" ||
    (!input.durationMode && Object.hasOwn(input, "sourceMinutes"))
      ? "fixed"
      : "mix";
  c.catalogMix =
    input.catalogMix === "custom" || CATALOG_MIXES[input.catalogMix]
      ? input.catalogMix
      : DEFAULTS.catalogMix;
  c.maxSourceMinutes = Math.max(c.minSourceMinutes, c.maxSourceMinutes);
  c.sourceMinutes = durationSummary(c).mean;
  c.segmentationMode =
    input.segmentationMode === "scene" ? "scene" : "duration";
  c.modelVersion = 3;
  // Whitelist the current model: obsolete GPU, extraction and auto-review settings cannot leak into exports.
  return Object.fromEntries(Object.keys(DEFAULTS).map((key) => [key, c[key]]));
}
export class Simulation {
  constructor(config = {}, warmup = 0) {
    this.reset(config);
    if (warmup) this.advance(warmup);
  }
  reset(config = {}) {
    this.config = normalizeConfig(config);
    this.time = 0;
    this.rng = this.config.seed;
    this.workloadRng = this.config.seed;
    this.arrivalCredit = 0;
    this.serial = 0;
    this.auditSerial = 0;
    this.events = [];
    this.completed = [];
    this.history = [];
    this.audit = [];
    this.assemblies = new Map();
    this.releasedBatches = new Set();
    this.blockedBatches = new Map();
    this.recentSources = [];
    this.latencies = [];
    this.deliveries = [];
    this.assetCount = 0;
    this.offeredAssets = 0;
    this.receivedSourceMinutes = 0;
    this.offeredSourceMinutes = 0;
    this.outputs = 0;
    this.accepted = 0;
    this.denied = 0;
    this.quarantined = 0;
    this.deferred = 0;
    this.retries = 0;
    this.revisions = 0;
    this.audioApproved = 0;
    this.audioRejected = 0;
    this.syncSubmissions = 0;
    this.assembled = 0;
    this.finalApproved = 0;
    this.chunkCount = 0;
    this.qaTotal = 0;
    this.qaPassed = 0;
    this.cost = 0;
    this.costs = { dubbing: 0, lipsync: 0, review: 0, delivery: 0, app: 0 };
    this.stages = Object.fromEntries(
      STAGES.map((n) => [
        n.id,
        { queue: [], active: [], finished: 0, capacity: 0 },
      ]),
    );
    this.event(
      "system",
      "Run initialized · audio must be approved by a person before Sync.",
    );
  }
  rand() {
    this.rng = (Math.imul(1664525, this.rng) + 1013904223) >>> 0;
    return this.rng / 4294967296;
  }
  workloadRandom() {
    this.workloadRng =
      (Math.imul(1664525, this.workloadRng) + 1013904223) >>> 0;
    return this.workloadRng / 4294967296;
  }
  event(stage, message, level = "info", job = null) {
    this.events.unshift({
      time: this.time,
      stage,
      message,
      level,
      asset: job?.asset || null,
    });
    this.events = this.events.slice(0, 100);
  }
  configure(patch) {
    const before = this.config;
    this.config = normalizeConfig({ ...before, ...patch });
    for (const key of Object.keys(this.config))
      if (before[key] !== this.config[key])
        this.event(
          "control",
          `${key}: ${before[key]} → ${this.config[key]}`,
          "config",
        );
  }
  charge(type, value) {
    this.costs[type] += value;
    this.cost += value;
  }
  capacities() {
    const c = this.config;
    return {
      ingest: 8,
      policy: 12,
      segment: c.appWorkers,
      prepare: c.appWorkers,
      dub: c.dubOutage ? 0 : c.dubConcurrency,
      audio_review: c.reviewers,
      lipsync: c.syncOutage ? 0 : c.syncConcurrency,
      reassemble: c.appWorkers,
      final_review: c.reviewers,
      publish: 6,
    };
  }
  assertApproval(job) {
    const approval = job.audioApproval;
    if (
      !approval ||
      approval.decision !== "approved" ||
      approval.packageId !== job.id ||
      approval.locale !== job.locale ||
      approval.segmentIndex !== job.segmentIndex ||
      approval.audioVersion !== job.audioVersion ||
      approval.audioHash !== job.audioHash ||
      approval.sourceVersion !== job.sourceVersion
    )
      throw Error(
        "Sync blocked: the current audio and source version do not have a matching human approval.",
      );
  }
  enqueue(id, job) {
    if (id === "lipsync") this.assertApproval(job);
    if (id === "publish") this.assertFinalApproval(job);
    job.stage = id;
    job.queuedAt = this.time;
    this.stages[id].queue.push(job);
  }
  next(id, job) {
    job.attempt = 0;
    job.notBefore = 0;
    this.enqueue(id, job);
  }
  duration(id, job) {
    const c = this.config,
      n = STAGES.find((n) => n.id === id);
    const minutes = job.segmentMinutes || job.sourceMinutes;
    let seconds = n.fixed + minutes * 60 * n.rtf;
    if (id === "dub") seconds = 20 + job.minutes * 60 * c.dubRtf;
    if (id === "lipsync") seconds = 20 + job.minutes * 60 * c.syncRtf;
    return Math.max(1, seconds * (0.8 + 0.4 * this.rand()));
  }
  start(id, job) {
    if (["audio_review", "final_review"].includes(id))
      throw Error("Audio review is a manual gate, not an automatic service.");
    if (id === "lipsync") this.assertApproval(job);
    if (id === "publish") this.assertFinalApproval(job);
    const c = this.config,
      n = STAGES.find((n) => n.id === id);
    job.attempt = (job.attempt || 0) + 1;
    job.startedAt = this.time;
    job.finishAt = this.time + this.duration(id, job);
    if (id === "dub") {
      job.sourceProjectId = `demo-eleven-project-${job.segmentId}`;
      job.dubRequestId = `demo-eleven-${job.id}-v${job.audioVersion}-a${job.attempt}`;
      this.charge("dubbing", job.minutes * c.dubRate);
    } else if (id === "lipsync") {
      job.model = c.model;
      job.syncModel = PROFILES[c.model].modelId;
      job.syncInput = {
        sourceVersion: job.sourceVersion,
        segmentIndex: job.segmentIndex,
        sourceStart: job.segmentStart,
        sourceEnd: job.segmentEnd,
        audioVersion: job.audioVersion,
        audioHash: job.audioHash,
        approvalId: job.audioApproval.id,
      };
      job.syncRequestId = `demo-sync-${job.id}-v${job.audioVersion}-a${job.attempt}`;
      this.syncSubmissions++;
      this.charge("lipsync", job.minutes * 60 * c.syncRate);
    } else
      this.charge(
        id === "publish" ? "delivery" : "app",
        (job.segmentMinutes || job.sourceMinutes) * n.cost,
      );
    this.stages[id].active.push(job);
  }
  terminal(job, status) {
    if (
      job.segmentIndex != null &&
      ["audio rejected", "provider retry exhausted", "rights hold"].includes(
        status,
      )
    )
      this.blockedBatches.set(`${job.asset}/${job.locale}`, {
        asset: job.asset,
        locale: job.locale,
        expected: job.segmentCount,
        reason: status,
        failedChunk: job.segmentIndex,
      });
    this.completed.unshift({
      ...job,
      path: [...job.path],
      status,
      ended: this.time,
    });
    this.completed = this.completed.slice(0, 120);
  }
  span(job, id, extra = {}) {
    job.path = [
      ...job.path,
      {
        stage: id,
        start: job.startedAt,
        end: this.time,
        queuedAt: job.queuedAt,
        attempt: job.attempt,
        audioVersion: job.audioVersion,
        segmentIndex: job.segmentIndex,
        ...extra,
      },
    ];
  }
  finish(id, job) {
    const c = this.config;
    this.stages[id].finished++;
    const provider = id === "dub" || id === "lipsync";
    const failed =
      provider &&
      ((id === "dub" ? c.dubOutage : c.syncOutage) || this.rand() < 0.025);
    this.span(job, id, {
      ...(provider
        ? {
            outcome: failed ? "failed" : "completed",
            provider: id === "dub" ? "ElevenLabs" : "Sync",
          }
        : {}),
      ...(id === "lipsync"
        ? {
            approvalId: job.audioApproval.id,
            audioHash: job.audioHash,
            model: job.syncModel,
          }
        : {}),
    });
    if (failed) {
      if (job.attempt <= c.retries) {
        this.retries++;
        job.notBefore =
          this.time +
          Math.min(60, 5 * 2 ** (job.attempt - 1)) * (0.7 + 0.6 * this.rand());
        this.enqueue(id, job);
        this.event(
          id,
          `${job.asset}/${job.locale}: provider attempt failed; bounded retry ${job.attempt}.`,
          "warn",
          job,
        );
      } else {
        this.quarantined++;
        this.terminal(job, "provider retry exhausted");
        this.event(
          id,
          `${job.asset}/${job.locale}: provider retries exhausted; held.`,
          "error",
          job,
        );
      }
      return;
    }
    if (id === "ingest") this.next("policy", job);
    else if (id === "policy") {
      if (c.revoked && job.restricted) {
        this.denied++;
        this.terminal(job, "rights hold");
      } else this.next("segment", job);
    } else if (id === "segment") {
      this.chunkCount += job.segmentManifest.length;
      for (const part of job.segmentManifest)
        this.next("prepare", {
          ...job,
          id: `${job.asset}-part${part.index + 1}`,
          segmentId: `${job.asset}-part${part.index + 1}`,
          segmentIndex: part.index,
          segmentCount: job.segmentManifest.length,
          segmentStart: part.start,
          segmentEnd: part.end,
          segmentMinutes: part.minutes,
          minutes: part.minutes,
          path: [...job.path],
        });
      this.event(
        id,
        `${job.asset}: ${job.segmentManifest.length} ordered chunks; complete source preserved.`,
        "info",
        job,
      );
    } else if (id === "prepare") {
      for (let language = 0; language < job.languages; language++)
        this.next("dub", {
          ...job,
          id: `${job.segmentId}-${DESTINATIONS[language][0]}`,
          output: true,
          locale: DESTINATIONS[language][0],
          minutes: job.segmentMinutes,
          audioVersion: 1,
          audioHash: null,
          audioRevisionCount: 0,
          path: [...job.path],
        });
    } else if (id === "dub") {
      job.audioHash = `simulated:${job.id}:audio-v${job.audioVersion}`;
      job.audioApproval = null;
      job.previewOrigin = "reference";
      this.next("audio_review", job);
      this.event(
        id,
        `${job.asset}/${job.locale}: audio v${job.audioVersion} ready; waiting for human preview and approval.`,
        "warn",
        job,
      );
    } else if (id === "lipsync") this.collectChunk(job);
    else if (id === "reassemble") {
      if (!validCoverage(job.parts, job.sourceMinutes))
        throw Error("Reassembly blocked: chunk coverage is incomplete.");
      job.videoVersion = 1;
      job.videoHash = `simulated:${job.id}:video-v1`;
      job.previewOrigin = "reference";
      job.finalApproval = null;
      this.assembled++;
      this.next("final_review", job);
      this.event(
        id,
        `${job.asset}/${job.locale}: all ${job.parts.length} chunks reassembled; final human review required.`,
        "warn",
        job,
      );
    } else if (id === "publish") {
      if (c.revoked && job.restricted) {
        this.denied++;
        this.terminal(job, "rights hold");
        return;
      }
      this.assertFinalApproval(job);
      const latency = this.time - job.born;
      this.outputs++;
      this.accepted += job.minutes;
      this.latencies.push(latency);
      this.latencies = this.latencies.slice(-5000);
      this.deliveries.push({
        time: this.time,
        minutes: job.minutes,
        latency,
        slo: job.slo,
      });
      this.terminal(job, "delivered");
      this.event(
        id,
        `${job.asset}/${job.locale}: delivered ${job.minutes.toFixed(1)} min after final human approval · ${job.parts.length} assembled chunks.`,
        "success",
        job,
      );
    }
  }
  collectChunk(job) {
    this.assertApproval(job);
    if (this.blockedBatches.has(`${job.asset}/${job.locale}`)) {
      this.terminal(job, "batch held");
      return;
    }
    const key = `${job.asset}/${job.locale}`;
    if (this.releasedBatches.has(key)) return;
    const expected = job.segmentManifest[job.segmentIndex];
    if (
      !expected ||
      Math.abs(expected.start - job.segmentStart) > 1e-6 ||
      Math.abs(expected.end - job.segmentEnd) > 1e-6
    )
      throw Error("Chunk result does not match the source manifest.");
    let group = this.assemblies.get(key);
    if (!group) {
      group = { source: { ...job }, parts: new Map() };
      this.assemblies.set(key, group);
    }
    if (group.parts.has(job.segmentIndex))
      throw Error(
        "Duplicate chunk completion cannot release reassembly twice.",
      );
    group.parts.set(job.segmentIndex, {
      id: job.id,
      locale: job.locale,
      index: job.segmentIndex,
      start: job.segmentStart,
      end: job.segmentEnd,
      minutes: job.minutes,
      audioVersion: job.audioVersion,
      audioHash: job.audioHash,
      sourceVersion: job.sourceVersion,
      audioApproval: { ...job.audioApproval },
      syncRequestId: job.syncRequestId,
      syncModel: job.syncModel,
      path: [...job.path],
    });
    this.event(
      "reassemble",
      `${job.asset}/${job.locale}: chunk ${job.segmentIndex + 1}/${job.segmentCount} ready for reassembly.`,
      "info",
      job,
    );
    if (group.parts.size !== job.segmentCount) return;
    const parts = [...group.parts.values()].sort((a, b) => a.index - b.index);
    if (!validCoverage(parts, job.sourceMinutes))
      throw Error("Source coverage is incomplete or out of order.");
    const unique = new Map();
    for (const part of parts)
      for (const span of part.path)
        unique.set(
          [
            span.stage,
            span.start,
            span.end,
            span.segmentIndex,
            span.audioVersion,
            span.attempt,
            span.decision,
          ].join(":"),
          span,
        );
    const assembled = {
      ...group.source,
      id: `${job.asset}-${job.locale}-assembly`,
      segmentIndex: undefined,
      segmentMinutes: undefined,
      minutes: job.sourceMinutes,
      parts,
      audioVersion: undefined,
      audioHash: undefined,
      audioApproval: null,
      path: [...unique.values()].sort(
        (a, b) => a.end - b.end || a.start - b.start,
      ),
    };
    this.releasedBatches.add(key);
    this.assemblies.delete(key);
    this.next("reassemble", assembled);
  }
  partsFingerprint(job) {
    return job.parts
      .map((part) =>
        [
          part.index,
          part.audioVersion,
          part.audioHash,
          part.syncRequestId,
        ].join(":"),
      )
      .join("|");
  }
  assertParts(job) {
    if (!job.parts?.length || !validCoverage(job.parts, job.sourceMinutes))
      throw Error("Final review requires all ordered chunks.");
    for (const part of job.parts)
      this.assertApproval({
        ...part,
        segmentIndex: part.index,
        sourceVersion: job.sourceVersion,
      });
  }
  assertFinalApproval(job) {
    this.assertParts(job);
    const record = job.finalApproval;
    if (
      !record ||
      record.decision !== "approved" ||
      record.packageId !== job.id ||
      record.locale !== job.locale ||
      record.videoVersion !== job.videoVersion ||
      record.videoHash !== job.videoHash ||
      record.sourceVersion !== job.sourceVersion ||
      record.partsFingerprint !== this.partsFingerprint(job)
    )
      throw Error(
        "Delivery blocked: final human approval does not match the current assembly.",
      );
  }
  pendingFinal(id) {
    const job = this.stages.final_review.queue.find((job) => job.id === id);
    if (!job)
      throw Error("This assembled program is no longer awaiting final review.");
    return job;
  }
  attachVideo(id, { hash, name }) {
    const job = this.pendingFinal(id);
    if (typeof hash !== "string" || !/^[a-f0-9]{64}$/.test(hash))
      throw Error("A valid local video SHA-256 hash is required.");
    job.videoVersion++;
    job.videoHash = hash;
    job.finalApproval = null;
    job.previewOrigin = "local";
    job.previewName = String(name || "Local video").slice(0, 160);
    this.event(
      "final_review",
      `${job.asset}/${job.locale}: local final preview attached as video v${job.videoVersion}.`,
      "config",
      job,
    );
    return job.videoVersion;
  }
  reviewFinal(
    id,
    { decision, reviewer, notes = "", checks = {}, previewPlayed = false },
  ) {
    const job = this.pendingFinal(id),
      c = this.config;
    this.assertParts(job);
    if (!["approved", "rejected"].includes(decision))
      throw Error("Approve the final video or hold it for remediation.");
    if (typeof reviewer !== "string" || reviewer.trim().length < 2)
      throw Error("Enter a reviewer name for the final audit record.");
    if (
      decision === "approved" &&
      (!c.reviewers ||
        !previewPlayed ||
        !["continuity", "lipsync", "soundtrack"].every(
          (key) => checks[key] === true,
        ))
    )
      throw Error(
        "Preview the final video and confirm continuity, lip sync and soundtrack before approval.",
      );
    if (decision === "rejected" && !notes.trim())
      throw Error("Add a reason for holding the final video.");
    const record = {
      id: `approval-${++this.auditSerial}`,
      gate: "final",
      packageId: job.id,
      asset: job.asset,
      locale: job.locale,
      videoVersion: job.videoVersion,
      videoHash: job.videoHash,
      sourceVersion: job.sourceVersion,
      partsFingerprint: this.partsFingerprint(job),
      decision,
      reviewer: reviewer.trim().slice(0, 80),
      notes: notes.trim().slice(0, 2000),
      checks: { ...checks },
      previewOrigin: job.previewOrigin,
      time: this.time,
    };
    this.stages.final_review.queue = this.stages.final_review.queue.filter(
      (candidate) => candidate !== job,
    );
    this.stages.final_review.finished++;
    job.path = [
      ...job.path,
      {
        stage: "final_review",
        start: job.queuedAt,
        end: this.time,
        queuedAt: job.queuedAt,
        attempt: 1,
        decision,
        reviewer: record.reviewer,
        videoVersion: job.videoVersion,
        videoHash: job.videoHash,
        approvalId: record.id,
      },
    ];
    this.audit.unshift(record);
    this.audit = this.audit.slice(0, 200);
    this.charge(
      "review",
      ((1 + job.minutes * c.reviewFactor) * c.reviewerRate) / 60,
    );
    if (decision === "approved") {
      job.finalApproval = record;
      this.finalApproved++;
      this.next("publish", job);
    } else {
      this.quarantined++;
      this.terminal(job, "final video held");
    }
    this.event(
      "final_review",
      `${job.asset}/${job.locale}: final video ${decision} by ${record.reviewer}.`,
      decision === "approved" ? "success" : "warn",
      job,
    );
    return record;
  }
  pendingAudio(id) {
    const job = this.stages.audio_review.queue.find((job) => job.id === id);
    if (!job) throw Error("This audio package is no longer awaiting review.");
    return job;
  }
  attachAudio(id, { hash, name }) {
    const job = this.pendingAudio(id);
    if (typeof hash !== "string" || !/^[a-f0-9]{64}$/.test(hash))
      throw Error("A valid local file SHA-256 hash is required.");
    job.audioVersion++;
    job.audioHash = hash;
    job.audioApproval = null;
    job.previewOrigin = "local";
    job.previewName = String(name || "Local audio").slice(0, 160);
    this.event(
      "audio_review",
      `${job.asset}/${job.locale}: local preview attached as audio v${job.audioVersion}.`,
      "config",
      job,
    );
    return job.audioVersion;
  }
  reviewAudio(
    id,
    { decision, reviewer, notes = "", checks = {}, previewPlayed = false },
  ) {
    const job = this.pendingAudio(id),
      c = this.config;
    if (
      decision === "approved" &&
      this.blockedBatches.has(`${job.asset}/${job.locale}`)
    )
      throw Error(
        "This source/language batch is held because another chunk failed or was rejected.",
      );
    if (!["approved", "changes_requested", "rejected"].includes(decision))
      throw Error("Choose approve, request changes or reject.");
    if (typeof reviewer !== "string" || reviewer.trim().length < 2)
      throw Error("Enter a reviewer name for the demo audit trail.");
    if (
      decision === "approved" &&
      (!previewPlayed ||
        !["meaning", "voice", "timing"].every((key) => checks[key] === true))
    )
      throw Error(
        "Preview the audio and confirm meaning, voice and timing before approving.",
      );
    if (decision === "approved" && !c.reviewers)
      throw Error(
        "No reviewers are staffed. Set planned reviewers above zero to release a decision.",
      );
    if (decision !== "approved" && !notes.trim())
      throw Error("Add a reason for a revision or rejection.");
    if (
      decision === "changes_requested" &&
      job.audioRevisionCount >= c.maxAudioRevisions
    )
      throw Error(
        "Audio revision budget exhausted; reject or hold this package.",
      );
    const record = {
      id: `approval-${++this.auditSerial}`,
      packageId: job.id,
      asset: job.asset,
      locale: job.locale,
      audioVersion: job.audioVersion,
      audioHash: job.audioHash,
      sourceVersion: job.sourceVersion,
      gate: "audio",
      segmentIndex: job.segmentIndex,
      segmentCount: job.segmentCount,
      decision,
      reviewer: reviewer.trim().slice(0, 80),
      notes: notes.trim().slice(0, 2000),
      checks: { ...checks },
      previewOrigin: job.previewOrigin,
      time: this.time,
    };
    this.stages.audio_review.queue = this.stages.audio_review.queue.filter(
      (candidate) => candidate !== job,
    );
    job.path = [
      ...job.path,
      {
        stage: "audio_review",
        start: job.queuedAt,
        end: this.time,
        queuedAt: job.queuedAt,
        attempt: 1,
        audioVersion: job.audioVersion,
        decision,
        reviewer: record.reviewer,
        audioHash: job.audioHash,
        approvalId: record.id,
      },
    ];
    this.stages.audio_review.finished++;
    this.audit.unshift(record);
    this.audit = this.audit.slice(0, 200);
    this.charge(
      "review",
      ((1 + job.minutes * c.reviewFactor) * c.reviewerRate) / 60,
    );
    if (decision === "approved") {
      this.audioApproved++;
      job.audioApproval = record;
      job.reviewed = true;
      if (c.revoked && job.restricted) {
        this.denied++;
        this.terminal(job, "rights hold");
      } else this.next("lipsync", job);
    } else if (decision === "changes_requested") {
      this.revisions++;
      job.audioRevisionCount++;
      job.audioVersion++;
      job.audioHash = null;
      job.audioApproval = null;
      job.previewName = null;
      this.next("dub", job);
    } else {
      this.audioRejected++;
      this.quarantined++;
      job.audioApproval = null;
      this.terminal(job, "audio rejected");
    }
    this.event(
      "audio_review",
      `${job.asset}/${job.locale}: ${decision.replaceAll("_", " ")} by ${record.reviewer} · audio v${record.audioVersion}.`,
      decision === "approved" ? "success" : "warn",
      job,
    );
    return record;
  }
  advance(seconds = 1) {
    for (let second = 0; second < Math.max(0, Math.floor(seconds)); second++)
      this.tick();
    return this;
  }
  tick() {
    this.time++;
    const c = this.config;
    let pending = Object.values(this.stages).reduce(
      (sum, stage) => sum + stage.queue.length + stage.active.length,
      0,
    );
    this.arrivalCredit += (c.arrival * 60) / 86400 / c.sourceMinutes;
    while (this.arrivalCredit >= 1 - 1e-9) {
      this.arrivalCredit = Math.max(0, this.arrivalCredit - 1);
      const minutes = sampleSourceMinutes(c, () => this.workloadRandom()),
        restricted = this.workloadRandom() < 0.2,
        asset = `HU-${String(++this.serial).padStart(5, "0")}`,
        segmentManifest = segmentSource(
          minutes,
          c.segmentationMode,
          c.chunkMinutes,
          () => this.workloadRandom(),
        );
      this.offeredAssets++;
      this.offeredSourceMinutes += minutes;
      if (pending > 3000 || this.stages.ingest.queue.length > 100) {
        this.deferred++;
        continue;
      }
      this.assetCount++;
      pending++;
      this.receivedSourceMinutes += minutes;
      this.recentSources.unshift({ asset, minutes, born: this.time });
      this.recentSources = this.recentSources.slice(0, 24);
      this.enqueue("ingest", {
        id: asset,
        asset,
        born: this.time,
        sourceMinutes: minutes,
        minutes: 0,
        sourceLanguage: "en",
        sourceVersion: "source-v1",
        segmentManifest,
        segmentationMode: c.segmentationMode,
        chunkMinutes: c.chunkMinutes,
        languages: c.languages,
        slo: c.slo,
        restricted,
        output: false,
        path: [],
      });
    }
    this.charge("app", 0.5 / 3600);
    const capacities = this.capacities();
    for (const stage of STAGES) {
      const s = this.stages[stage.id];
      s.capacity = capacities[stage.id];
      if (["audio_review", "final_review"].includes(stage.id)) continue;
      const done = s.active.filter((job) => job.finishAt <= this.time);
      s.active = s.active.filter((job) => job.finishAt > this.time);
      for (const job of done) this.finish(stage.id, job);
      while (s.active.length < s.capacity) {
        const index = s.queue.findIndex(
          (job) => !job.notBefore || job.notBefore <= this.time,
        );
        if (index < 0) break;
        const [job] = s.queue.splice(index, 1);
        if (
          stage.id === "lipsync" &&
          this.blockedBatches.has(`${job.asset}/${job.locale}`)
        ) {
          this.terminal(job, "batch held");
          continue;
        }
        if (stage.id === "lipsync" && c.revoked && job.restricted) {
          this.denied++;
          this.terminal(job, "rights hold");
          continue;
        }
        this.start(stage.id, job);
      }
    }
    this.deliveries = this.deliveries.filter(
      (delivery) => delivery.time >= this.time - 3600,
    );
    if (this.time % 10 === 0) {
      const m = this.metrics();
      this.history.push({
        time: this.time,
        throughput: m.throughput,
        queue: m.queue,
        p95: m.p95 || 0,
        cost: m.unitCost || 0,
      });
      this.history = this.history.slice(-90);
    }
  }
  metrics() {
    const all = Object.values(this.stages),
      queue = all.reduce((sum, s) => sum + s.queue.length, 0),
      active = all.reduce((sum, s) => sum + s.active.length, 0);
    const ordered = [...this.latencies].sort((a, b) => a - b),
      recent = this.deliveries.filter((d) => d.time >= this.time - 300),
      window = Math.min(300, this.time) || 1;
    const bottleneck = STAGES.reduce((a, b) =>
      this.stages[a.id].queue.length >= this.stages[b.id].queue.length ? a : b,
    ).id;
    return {
      queue,
      active,
      throughput:
        (recent.reduce((sum, d) => sum + d.minutes, 0) * 3600) / window,
      p95: ordered.length
        ? ordered[
            Math.min(ordered.length - 1, Math.ceil(ordered.length * 0.95) - 1)
          ] / 60
        : null,
      unitCost: this.accepted ? this.cost / this.accepted : null,
      onTime: this.deliveries.length
        ? (this.deliveries.filter((d) => d.latency <= d.slo * 60).length /
            this.deliveries.length) *
          100
        : null,
      yield: this.qaTotal ? (this.qaPassed / this.qaTotal) * 100 : null,
      bottleneck,
      awaitingAudio: this.stages.audio_review.queue.length,
      audioApproved: this.audioApproved,
      syncSubmissions: this.syncSubmissions,
      awaitingFinal: this.stages.final_review.queue.length,
      assembled: this.assembled,
      finalApproved: this.finalApproved,
    };
  }
  snapshot() {
    const clone = (job) => ({
      ...job,
      path: [...job.path],
      audioApproval: job.audioApproval ? { ...job.audioApproval } : null,
    });
    return {
      time: this.time,
      config: { ...this.config },
      metrics: this.metrics(),
      cost: this.cost,
      costs: { ...this.costs },
      assetCount: this.assetCount,
      offeredAssets: this.offeredAssets,
      receivedSourceMinutes: this.receivedSourceMinutes,
      recentSources: [...this.recentSources],
      outputs: this.outputs,
      accepted: this.accepted,
      denied: this.denied,
      quarantined: this.quarantined,
      deferred: this.deferred,
      retries: this.retries,
      revisions: this.revisions,
      audioApproved: this.audioApproved,
      audioRejected: this.audioRejected,
      syncSubmissions: this.syncSubmissions,
      assembled: this.assembled,
      finalApproved: this.finalApproved,
      chunkCount: this.chunkCount,
      stages: Object.fromEntries(
        STAGES.map((n) => {
          const s = this.stages[n.id];
          return [
            n.id,
            {
              queue: s.queue.length,
              active: s.active.length,
              capacity: s.capacity,
              finished: s.finished,
              age: s.queue.length ? (this.time - s.queue[0].queuedAt) / 60 : 0,
              utilization: s.capacity
                ? Math.min(1, s.active.length / s.capacity)
                : 0,
            },
          ];
        }),
      ),
      pendingFinal: this.stages.final_review.queue.map(clone),
      assemblies: [...this.assemblies.values()].map((group) => ({
        asset: group.source.asset,
        locale: group.source.locale,
        expected: group.source.segmentCount,
        complete: group.parts.size,
        sourceMinutes: group.source.sourceMinutes,
      })),
      blockedBatches: [...this.blockedBatches.values()],
      pendingAudio: this.stages.audio_review.queue
        .map(clone)
        .sort(
          (a, b) =>
            a.asset.localeCompare(b.asset) ||
            a.locale.localeCompare(b.locale) ||
            a.segmentIndex - b.segmentIndex,
        ),
      inFlight: STAGES.flatMap((n) => [
        ...this.stages[n.id].queue.map((job) => ({ ...job, _active: false })),
        ...this.stages[n.id].active.map((job) => ({ ...job, _active: true })),
      ])
        .filter((job) => job.output)
        .map((job) => ({
          ...clone(job),
          status:
            job.stage === "audio_review"
              ? "awaiting audio approval"
              : job.stage === "final_review"
                ? "awaiting final approval"
                : `in ${job.stage}`,
          ended: this.time,
        })),
      completed: this.completed.map(clone),
      audit: this.audit.map((record) => ({ ...record })),
      history: [...this.history],
      events: [...this.events],
    };
  }
}

export function planningWorkload(config) {
  const c = normalizeConfig(config);
  let state = c.seed;
  const random = () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  let chunks = 0,
    releaseJobs = 0,
    releaseMinutes = 0,
    sampledMinutes = 0;
  const approval = c.expectedApproval / 100;
  for (let i = 0; i < 512; i++) {
    const duration = sampleSourceMinutes(c, random),
      parts = segmentSource(
        duration,
        c.segmentationMode,
        c.chunkMinutes,
        random,
      );
    chunks += parts.length;
    sampledMinutes += duration;
    const success = approval ** parts.length;
    releaseJobs += success;
    releaseMinutes += duration * success;
  }
  return {
    meanChunks: chunks / 512,
    meanChunkMinutes: c.sourceMinutes / (chunks / 512),
    programSuccess: releaseJobs / 512,
    minuteSuccess: releaseMinutes / sampledMinutes,
  };
}
export function capacityPlan(config) {
  const c = normalizeConfig(config),
    w = planningWorkload(c),
    roots = (c.arrival * 60) / 24 / c.sourceMinutes,
    chunks = roots * w.meanChunks,
    languageChunks = chunks * c.languages,
    completePrograms = roots * c.languages * w.programSuccess;
  const slots = {
    ingest: 8,
    policy: 12,
    segment: c.appWorkers,
    prepare: c.appWorkers,
    dub: c.dubOutage ? 0 : c.dubConcurrency,
    audio_review: c.reviewers,
    lipsync: c.syncOutage ? 0 : c.syncConcurrency,
    reassemble: c.appWorkers,
    final_review: c.reviewers,
    publish: 6,
  };
  return STAGES.map((n) => {
    const root = ["ingest", "policy", "segment"].includes(n.id),
      chunk = ["prepare", "dub", "audio_review", "lipsync"].includes(n.id);
    const taskRate = root
      ? roots
      : n.id === "prepare"
        ? chunks
        : ["dub", "audio_review"].includes(n.id)
          ? languageChunks
          : n.id === "lipsync"
            ? (languageChunks * c.expectedApproval) / 100
            : n.id === "publish"
              ? (completePrograms * c.expectedFinalApproval) / 100
              : completePrograms;
    const minutes = chunk ? w.meanChunkMinutes : c.sourceMinutes;
    let duration = n.fixed + minutes * 60 * n.rtf;
    if (n.id === "dub") duration = 20 + minutes * 60 * c.dubRtf;
    if (n.id === "lipsync") duration = 20 + minutes * 60 * c.syncRtf;
    if (["audio_review", "final_review"].includes(n.id))
      duration = (1 + minutes * c.reviewFactor) * 60;
    const offered = (taskRate * duration) / 3600;
    return {
      id: n.id,
      name: n.name,
      kind: n.kind,
      taskRate,
      serviceSeconds: duration,
      offered,
      slots: slots[n.id],
      utilization: slots[n.id] ? offered / slots[n.id] : offered ? Infinity : 0,
      required: Math.ceil(offered / 0.75),
      capacity: duration ? (slots[n.id] * 3600) / duration : 0,
    };
  });
}
export function compareProfiles(config) {
  const c = normalizeConfig(config),
    w = planningWorkload(c),
    approval = c.expectedApproval / 100,
    finalApproval = c.expectedFinalApproval / 100;
  return Object.entries(PROFILES).map(([model, profile]) => {
    const dub = c.sourceMinutes * c.dubRate,
      audioReview =
        ((w.meanChunks + c.sourceMinutes * c.reviewFactor) * c.reviewerRate) /
        60,
      finalReview =
        (w.programSuccess *
          (1 + c.sourceMinutes * c.reviewFactor) *
          c.reviewerRate) /
        60,
      review = audioReview + finalReview,
      sync = approval * c.sourceMinutes * 60 * profile.rate,
      delivery = w.minuteSuccess * finalApproval * c.sourceMinutes * 0.002;
    const deliveredMinutes = w.minuteSuccess * finalApproval * c.sourceMinutes;
    return {
      model,
      name: profile.name,
      rate: profile.rate,
      dubbing: dub,
      review,
      lipsync: sync,
      delivery,
      total: dub + review + sync + delivery,
      deliveredMinutes,
      unitCost: deliveredMinutes
        ? (dub + review + sync + delivery) / deliveredMinutes
        : null,
      approvalPercent: c.expectedApproval,
      qaPercent: c.expectedFinalApproval,
      meanChunks: w.meanChunks,
    };
  });
}
