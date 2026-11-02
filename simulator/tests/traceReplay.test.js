import test from "node:test";
import assert from "node:assert/strict";
import { traceSteps, traceState, traceCommentary } from "../src/traceReplay.js";
test("parallel chunk history preserves timestamps in completion order", () => {
  const job = {
    born: 0,
    path: [
      { stage: "dub", start: 10, end: 40, segmentIndex: 0 },
      { stage: "dub", start: 10, end: 25, segmentIndex: 1 },
      {
        stage: "audio_review",
        start: 25,
        end: 35,
        decision: "approved",
        audioVersion: 1,
        reviewer: "Reviewer",
        segmentIndex: 1,
      },
    ],
  };
  const steps = traceSteps(job);
  assert.equal(steps[0].segmentIndex, 1);
  assert.equal(steps[1].stage, "audio_review");
  assert.equal(traceState(job, steps, 0).states.dub, "At this step");
  assert.equal(job.path[0].end, 40);
});
test("unfinished approval snapshots do not describe an automatic completion", () => {
  const job = {
    born: 0,
    status: "awaiting audio approval",
    stage: "audio_review",
    queuedAt: 20,
    ended: 100,
    audioVersion: 2,
    path: [],
  };
  const steps = traceSteps(job);
  assert.equal(steps.length, 1);
  assert.equal(steps[0].inProgress, true);
  assert.match(
    traceCommentary(job, steps[0], steps).text,
    /held for a human decision/,
  );
  assert.equal(traceState(job, steps, 0).route.has("lipsync"), false);
});
test("audio decisions and final decisions remain distinct in commentary", () => {
  const job = {
    sourceMinutes: 12,
    locale: "es",
    segmentCount: 3,
    parts: [1, 2, 3],
    asset: "demo",
  };
  assert.match(
    traceCommentary(
      job,
      {
        stage: "audio_review",
        decision: "approved",
        audioVersion: 2,
        reviewer: "Audio editor",
        start: 0,
        end: 10,
        approvalId: "a1",
      },
      [],
    ).text,
    /Audio editor/,
  );
  assert.match(
    traceCommentary(
      job,
      { stage: "final_review", decision: "rejected", start: 10, end: 20 },
      [],
    ).text,
    /held after final review/,
  );
});
