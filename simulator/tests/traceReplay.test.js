import test from "node:test";
import assert from "node:assert/strict";
import { Simulation } from "../src/engine.js";
import { traceSteps, traceState, traceCommentary } from "../src/traceReplay.js";

test("replay preserves parallel timestamps and completion order without mutating lineage", () => {
  const job = {
    born: 0,
    path: [
      { stage: "prepare", start: 0, end: 10 },
      { stage: "asr", start: 10, end: 40 },
      { stage: "vision", start: 10, end: 25 },
      { stage: "clips", start: 40, end: 45 },
    ],
  };
  const steps = traceSteps(job);
  assert.deepEqual(
    steps.map((s) => s.stage),
    ["prepare", "vision", "asr", "clips"],
  );
  assert.equal(job.path[1].stage, "asr");
  const state = traceState(job, steps, 1);
  assert.equal(state.states.asr, "In parallel");
  assert.equal(state.states.vision, "At this step");
  assert.equal(state.states.clips, "Upcoming");
  assert.equal(state.edges.has("prepare-clips"), false);
});

test("cache and human review routes never imply unexecuted shortcut edges", () => {
  const job = {
    born: 0,
    path: [
      "ingest",
      "policy",
      "prepare",
      "clips",
      "translate",
      "tts",
      "qc",
      "review",
      "publish",
    ].map((stage, i) => ({ stage, start: i, end: i + 1 })),
  };
  const steps = traceSteps(job),
    state = traceState(job, steps, 8);
  assert.equal(state.cached, true);
  assert.ok(state.edges.has("prepare-clips"));
  assert.ok(state.edges.has("review-publish"));
  assert.equal(state.edges.has("qc-publish"), false);
  assert.equal(state.states.asr, "Outside this trace");
  assert.match(traceCommentary(job, steps[2], steps).text, /cache hit/);
});

test("retry narration distinguishes failed attempts from exhausted outcomes", () => {
  const job = {
    born: 0,
    status: "retry budget exhausted",
    path: [
      { stage: "tts", start: 10, end: 20, queuedAt: 5, attempt: 1 },
      { stage: "tts", start: 30, end: 40, queuedAt: 20, attempt: 2 },
    ],
  };
  const steps = traceSteps(job);
  assert.match(
    traceCommentary(job, steps[0], steps).text,
    /returned to the speech queue/,
  );
  assert.match(
    traceCommentary(job, steps[1], steps).text,
    /exhausted the retry budget/,
  );
  assert.equal(traceCommentary(job, steps[1], steps).wait, 10);
});

test("recorded thresholds, queue times and model routing survive configuration changes", () => {
  const sim = new Simulation({ cache: 0, quality: 90 }, 1800);
  const job = sim.completed.find((j) => j.score != null);
  assert.ok(job);
  const before = JSON.stringify(job);
  sim.configure({ quality: 50, model: "economy", outage: true });
  assert.equal(JSON.stringify(job), before);
  assert.equal(job.qualityThreshold, 90);
  for (const span of job.path) assert.ok(span.start >= span.queuedAt);
  const speech = job.path.find((p) => p.stage === "tts");
  assert.equal(speech.model, "balanced");
  assert.equal(speech.fallback, false);
  const steps = traceSteps(job);
  assert.match(
    traceCommentary(
      job,
      steps.find((s) => s.stage === "qc"),
      steps,
    ).text,
    /threshold of 90/,
  );
});
