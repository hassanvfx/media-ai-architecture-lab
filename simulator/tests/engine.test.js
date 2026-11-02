import test from "node:test";
import assert from "node:assert/strict";
import {
  Simulation,
  normalizeConfig,
  capacityPlan,
  compareProfiles,
} from "../src/engine.js";
import { DEFAULTS } from "../src/catalog.js";
const audioDecision = {
  decision: "approved",
  reviewer: "Test reviewer",
  previewPlayed: true,
  checks: { meaning: true, voice: true, timing: true },
};
const finalDecision = {
  decision: "approved",
  reviewer: "Final reviewer",
  previewPlayed: true,
  checks: { continuity: true, lipsync: true, soundtrack: true },
};
function ready(config = {}) {
  const c = {
    sourceMinutes: 12,
    arrival: 24,
    languages: 1,
    chunkMinutes: 5,
    dubRtf: 0.05,
    syncRtf: 0.05,
    ...config,
  };
  const s = new Simulation(c);
  s.advance(Math.ceil(c.sourceMinutes * 60));
  s.configure({ arrival: 0 });
  s.advance(2400);
  return s;
}
function approveAll(s) {
  for (const job of [...s.stages.audio_review.queue])
    s.reviewAudio(job.id, audioDecision);
}
function assembled(config = {}) {
  const s = ready(config);
  approveAll(s);
  s.advance(1800);
  return s;
}

test("same catalog configuration and seed produce the same unattended state", () => {
  assert.deepEqual(
    new Simulation({}, 1800).snapshot(),
    new Simulation({}, 1800).snapshot(),
  );
});
test("unattended execution never approves audio or submits Sync jobs", () => {
  const s = ready();
  s.advance(7200);
  assert.equal(s.audioApproved, 0);
  assert.equal(s.syncSubmissions, 0);
  assert.equal(s.outputs, 0);
  assert.equal(s.stages.audio_review.queue.length, 3);
});
test("audio approval requires preview, reviewer name and each checklist confirmation", () => {
  const s = ready(),
    job = s.stages.audio_review.queue[0];
  assert.throws(
    () => s.reviewAudio(job.id, { ...audioDecision, previewPlayed: false }),
    /Preview/,
  );
  assert.throws(
    () => s.reviewAudio(job.id, { ...audioDecision, reviewer: "" }),
    /reviewer/,
  );
  assert.throws(
    () =>
      s.reviewAudio(job.id, { ...audioDecision, checks: { meaning: true } }),
    /confirm/,
  );
  assert.equal(s.syncSubmissions, 0);
});
test("approved audio releases only the exact chunk version to Sync", () => {
  const s = ready(),
    job = s.stages.audio_review.queue[0];
  const record = s.reviewAudio(job.id, audioDecision);
  assert.equal(s.stages.lipsync.queue[0].audioApproval.id, record.id);
  s.advance(1);
  assert.equal(s.syncSubmissions, 1);
  assert.equal(
    s.stages.lipsync.active[0].syncInput.audioHash,
    record.audioHash,
  );
  assert.equal(
    s.stages.lipsync.active[0].syncInput.audioVersion,
    record.audioVersion,
  );
});
test("stale audio approval is rejected by the provider start boundary", () => {
  const s = ready(),
    job = s.stages.audio_review.queue[0];
  s.reviewAudio(job.id, audioDecision);
  job.audioVersion++;
  assert.throws(() => s.start("lipsync", job), /matching human approval/);
  assert.equal(s.syncSubmissions, 0);
});
test("requesting changes creates a new unapproved audio version and adds no Sync fee", () => {
  const s = ready(),
    job = s.stages.audio_review.queue[0],
    oldVersion = job.audioVersion;
  const cost = s.costs.dubbing;
  s.reviewAudio(job.id, {
    decision: "changes_requested",
    reviewer: "Reviewer",
    notes: "Please correct the pronunciation.",
  });
  s.advance(600);
  const revised = s.pendingAudio(job.id);
  assert.equal(revised.audioVersion, oldVersion + 1);
  assert.equal(revised.audioApproval, null);
  assert.ok(s.costs.dubbing > cost);
  assert.equal(s.costs.lipsync, 0);
  assert.equal(s.audit[0].decision, "changes_requested");
});
test("revision budgets and reject reasons are enforced", () => {
  const s = ready({ maxAudioRevisions: 0 }),
    id = s.stages.audio_review.queue[0].id;
  assert.throws(
    () =>
      s.reviewAudio(id, {
        decision: "changes_requested",
        reviewer: "Reviewer",
        notes: "change",
      }),
    /budget exhausted/,
  );
  assert.throws(
    () => s.reviewAudio(id, { decision: "rejected", reviewer: "Reviewer" }),
    /reason/,
  );
});
test("rejecting one required chunk blocks the language batch and future Sync spend", () => {
  const s = ready(),
    job = s.stages.audio_review.queue[0];
  s.reviewAudio(job.id, {
    decision: "rejected",
    reviewer: "Reviewer",
    notes: "Meaning is incorrect.",
  });
  assert.throws(
    () => s.reviewAudio(s.stages.audio_review.queue[0].id, audioDecision),
    /batch is held/,
  );
  s.advance(1200);
  assert.equal(s.syncSubmissions, 0);
  assert.equal(s.costs.lipsync, 0);
  assert.equal(s.stages.final_review.queue.length, 0);
  assert.equal(s.blockedBatches.size, 1);
});
test("missing chunks prevent reassembly, even after other chunks finish lip sync", () => {
  const s = ready();
  for (const job of [...s.stages.audio_review.queue].slice(0, 2))
    s.reviewAudio(job.id, audioDecision);
  s.advance(1200);
  assert.equal(s.stages.final_review.queue.length, 0);
  assert.equal(s.snapshot().assemblies[0].complete, 2);
  assert.equal(s.snapshot().assemblies[0].expected, 3);
});
test("all out-of-order chunks reassemble once in source order with full duration", () => {
  const s = assembled();
  assert.equal(s.stages.final_review.queue.length, 1);
  const job = s.stages.final_review.queue[0];
  assert.deepEqual(
    job.parts.map((part) => part.index),
    [0, 1, 2],
  );
  assert.equal(job.minutes, 12);
  assert.equal(
    job.parts.reduce((sum, part) => sum + part.minutes, 0),
    12,
  );
  assert.equal(s.outputs, 0);
  assert.equal(s.assemblies.size, 0);
});
test("final human review is mandatory and requires playback and complete checks", () => {
  const s = assembled(),
    job = s.stages.final_review.queue[0];
  s.advance(7200);
  assert.equal(s.outputs, 0);
  assert.throws(
    () => s.reviewFinal(job.id, { ...finalDecision, previewPlayed: false }),
    /Preview/,
  );
  assert.throws(
    () =>
      s.reviewFinal(job.id, { ...finalDecision, checks: { continuity: true } }),
    /confirm/,
  );
});
test("only a complete final-approved program can be delivered", () => {
  const s = assembled(),
    job = s.stages.final_review.queue[0];
  s.reviewFinal(job.id, finalDecision);
  s.advance(120);
  assert.equal(s.outputs, 1);
  assert.equal(s.accepted, 12);
  const delivered = s.completed.find((job) => job.status === "delivered");
  assert.equal(delivered.finalApproval.reviewer, "Final reviewer");
  assert.equal(delivered.parts.length, 3);
  assert.ok(
    delivered.parts.every((part) => part.audioApproval.decision === "approved"),
  );
});
test("final rejection holds the full program and preserves already incurred fees", () => {
  const s = assembled(),
    job = s.stages.final_review.queue[0],
    providerSpend = s.costs.dubbing + s.costs.lipsync;
  s.reviewFinal(job.id, {
    decision: "rejected",
    reviewer: "Final reviewer",
    notes: "The second join has a visual jump.",
  });
  s.advance(600);
  assert.equal(s.outputs, 0);
  assert.equal(s.costs.dubbing + s.costs.lipsync, providerSpend);
  assert.equal(s.completed[0].status, "final video held");
});
test("stale final approval or changed chunk lineage cannot authorize delivery", () => {
  const s = assembled(),
    job = s.stages.final_review.queue[0];
  s.reviewFinal(job.id, finalDecision);
  job.videoVersion++;
  assert.throws(() => s.start("publish", job), /final human approval/);
  job.videoVersion--;
  job.parts[0].audioHash = "different";
  assert.throws(() => s.start("publish", job), /matching human approval/);
  assert.equal(s.outputs, 0);
});
test("local audio/video previews create new hash-bound versions", () => {
  const s = ready(),
    audio = s.stages.audio_review.queue[0],
    hash = "a".repeat(64);
  assert.throws(() => s.attachAudio(audio.id, { hash: "wrong" }), /SHA-256/);
  const version = s.attachAudio(audio.id, { hash, name: "my-dub.wav" });
  assert.equal(version, 2);
  assert.equal(audio.audioHash, hash);
  assert.equal(audio.previewOrigin, "local");
  approveAll(s);
  s.advance(1800);
  const video = s.stages.final_review.queue[0];
  const videoVersion = s.attachVideo(video.id, {
    hash: "b".repeat(64),
    name: "final.mp4",
  });
  assert.equal(videoVersion, 2);
  assert.equal(video.videoHash, "b".repeat(64));
  assert.equal(video.finalApproval, null);
});
test("source languages remain isolated through joins and final decisions", () => {
  const s = assembled({ languages: 2 });
  assert.equal(s.stages.final_review.queue.length, 2);
  for (const job of s.stages.final_review.queue) {
    assert.equal(job.parts.length, 3);
    assert.ok(
      job.parts.every((part) => part.audioApproval.locale === job.locale),
    );
  }
  s.reviewFinal(s.stages.final_review.queue[0].id, finalDecision);
  s.advance(120);
  assert.equal(s.outputs, 1);
  assert.equal(s.stages.final_review.queue.length, 1);
});
test("no staffed reviewers blocks both explicit approval gates", () => {
  const s = ready({ reviewers: 0 });
  assert.throws(
    () => s.reviewAudio(s.stages.audio_review.queue[0].id, audioDecision),
    /No reviewers/,
  );
  s.configure({ reviewers: 2 });
  approveAll(s);
  s.advance(1800);
  s.configure({ reviewers: 0 });
  assert.throws(
    () => s.reviewFinal(s.stages.final_review.queue[0].id, finalDecision),
    /confirm/,
  );
});
test("rights are rechecked before Sync and at delivery", () => {
  const s = ready({ seed: 2000 });
  assert.ok(s.stages.audio_review.queue[0].restricted);
  s.configure({ revoked: true });
  s.reviewAudio(s.stages.audio_review.queue[0].id, audioDecision);
  s.advance(1);
  assert.equal(s.syncSubmissions, 0);
  const t = assembled({ seed: 2000 }),
    job = t.stages.final_review.queue[0];
  t.reviewFinal(job.id, finalDecision);
  t.configure({ revoked: true });
  t.advance(120);
  assert.equal(t.outputs, 0);
  assert.ok(t.completed.some((job) => job.status === "rights hold"));
});
test("Sync outage retains approved audio and recovers without another audio fee", () => {
  const s = ready({ syncOutage: true });
  approveAll(s);
  const dubCost = s.costs.dubbing;
  s.advance(600);
  assert.equal(s.syncSubmissions, 0);
  assert.equal(s.stages.lipsync.queue.length, 3);
  s.configure({ syncOutage: false });
  s.advance(1800);
  assert.equal(s.stages.final_review.queue.length, 1);
  assert.equal(s.costs.dubbing, dubCost);
});
test("modeled provider retries are bounded and do not create approvals", () => {
  const s = ready(),
    job = s.stages.audio_review.queue[0];
  s.reviewAudio(job.id, audioDecision);
  s.advance(1);
  s.configure({ syncOutage: true });
  s.advance(1800);
  assert.equal(s.syncSubmissions, 1);
  assert.ok(s.stages.lipsync.queue.length > 0);
  s.configure({ syncOutage: false });
  s.advance(1800);
  assert.equal(s.audioApproved, 1);
  assert.ok(s.retries >= 1);
});
test("estimated cost categories reconcile after two explicit reviews", () => {
  const s = assembled(),
    job = s.stages.final_review.queue[0];
  s.reviewFinal(job.id, finalDecision);
  s.advance(120);
  assert.ok(
    Math.abs(s.cost - Object.values(s.costs).reduce((a, b) => a + b, 0)) < 1e-7,
  );
  assert.equal(s.metrics().unitCost, s.cost / 12);
  assert.ok(s.costs.review > 0);
  assert.equal("compute" in s.costs, false);
});
test("planning percentages never authorize live decisions and have a separate comparison", () => {
  const s = ready({ expectedApproval: 100, expectedFinalApproval: 100 });
  s.advance(1200);
  assert.equal(s.outputs, 0);
  assert.equal(s.audit.length, 0);
  const estimates = compareProfiles({
    ...DEFAULTS,
    expectedApproval: 100,
    expectedFinalApproval: 100,
  });
  assert.equal(estimates.length, 3);
  assert.ok(estimates.every((row) => row.deliveredMinutes > 0));
  assert.equal(
    capacityPlan({ ...DEFAULTS, reviewers: 0 }).find(
      (row) => row.id === "audio_review",
    ).utilization,
    Infinity,
  );
});
test("configuration whitelists the selected architecture and clamps input limits", () => {
  const c = normalizeConfig({
    languages: 500,
    dubConcurrency: -1,
    syncConcurrency: 100,
    model: "unknown",
    gpu: 30,
    autoscale: true,
    clipRatio: 20,
    chunkMinutes: 100,
  });
  assert.equal(c.languages, 11);
  assert.equal(c.dubConcurrency, 1);
  assert.equal(c.syncConcurrency, 24);
  assert.equal(c.model, "standard");
  assert.equal(c.chunkMinutes, 30);
  assert.equal("gpu" in c, false);
  assert.equal("clipRatio" in c, false);
});
test("final approval rejects a broken source coverage map", () => {
  const s = assembled(),
    job = s.stages.final_review.queue[0];
  job.parts[1].start += 1;
  assert.throws(() => s.reviewFinal(job.id, finalDecision), /ordered chunks/);
  assert.equal(s.outputs, 0);
});
test("late duplicate chunk callbacks cannot enqueue a second assembly", () => {
  const s = ready(),
    jobs = [...s.stages.audio_review.queue];
  approveAll(s);
  s.advance(1800);
  for (const job of jobs) s.collectChunk(job);
  assert.equal(s.stages.final_review.queue.length, 1);
  assert.equal(s.stages.reassemble.queue.length, 0);
  assert.equal(s.assemblies.size, 0);
});
test("an exhausted provider attempt holds the batch instead of manufacturing approval", () => {
  const s = ready({ retries: 0 }),
    job = s.stages.audio_review.queue[0];
  s.reviewAudio(job.id, audioDecision);
  s.advance(1);
  s.configure({ syncOutage: true });
  s.advance(1200);
  assert.ok(
    s.completed.some((result) => result.status === "provider retry exhausted"),
  );
  assert.equal(s.audioApproved, 1);
  assert.equal(s.outputs, 0);
  assert.equal(s.blockedBatches.size, 1);
});
test("identical file hashes cannot let one language reuse another language approval", () => {
  const s = ready({ languages: 2 });
  const es = s.stages.audio_review.queue.find(
    (job) => job.locale === "es" && job.segmentIndex === 0,
  );
  const fr = s.stages.audio_review.queue.find(
    (job) => job.locale === "fr" && job.segmentIndex === 0,
  );
  const hash = "c".repeat(64);
  s.attachAudio(es.id, { hash, name: "same.wav" });
  s.attachAudio(fr.id, { hash, name: "same.wav" });
  const approval = s.reviewAudio(es.id, audioDecision);
  fr.audioApproval = approval;
  assert.throws(() => s.start("lipsync", fr), /matching human approval/);
  assert.equal(s.syncSubmissions, 0);
});
