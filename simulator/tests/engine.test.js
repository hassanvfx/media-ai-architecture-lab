import test from "node:test";
import assert from "node:assert/strict";
import { Simulation, normalizeConfig } from "../src/engine.js";

// Exercise outcome contracts, rather than implementation-specific snapshots.
test("identical seed, configuration and time produce identical outcomes", () => {
  const a = new Simulation({}, 1800).snapshot(),
    b = new Simulation({}, 1800).snapshot();
  assert.deepEqual(a, b);
  assert.ok(a.outputs > 0);
  assert.ok(a.metrics.p95 > 0);
});
test("no arrivals means no accepted output, but idle provisioned capacity is charged", () => {
  const s = new Simulation({ arrival: 0 }, 600);
  assert.equal(s.outputs, 0);
  assert.equal(s.metrics().unitCost, null);
  assert.ok(s.costs.compute > 0);
  assert.ok(s.costs.review > 0);
  assert.equal(s.costs.inference, 0);
});
test("full provider outage blocks delivery; enabling fallback drains speech work", () => {
  const s = new Simulation({ outage: true, fallback: false }, 900);
  assert.equal(s.outputs, 0);
  assert.ok(s.stages.tts.queue.length > 0);
  assert.equal(s.stages.tts.capacity, 0);
  s.configure({ fallback: true, arrival: 0 });
  s.advance(2400);
  assert.ok(s.outputs > 0);
  assert.equal(s.stages.tts.queue.length, 0);
  assert.ok(s.completed.some((j) => j.fallback));
});
test("10x catalog volume creates more pending work than the baseline", () => {
  const base = new Simulation({}, 1800),
    spike = new Simulation({ arrival: 2400 }, 1800);
  assert.ok(spike.metrics().queue > base.metrics().queue * 5);
  assert.ok(spike.stages.prepare.queue.length > 0);
});
test("a stricter gate with an economy model increases review pressure", () => {
  const a = new Simulation({}, 1800),
    b = new Simulation({ model: "economy", quality: 90 }, 1800);
  assert.ok(b.metrics().yield < a.metrics().yield);
  assert.ok(b.stages.review.queue.length > a.stages.review.queue.length);
  assert.ok(b.metrics().unitCost > a.metrics().unitCost);
});
test("speech/vision fan-out joins once; locale fan-out uses captured input config", () => {
  const s = new Simulation(
    { arrival: 120, cache: 0, languages: 3, quality: 50 },
    600,
  );
  s.configure({ arrival: 0, languages: 8 });
  s.advance(3600);
  assert.equal(s.indexed, s.assetCount);
  assert.equal(s.outputs + s.quarantined, s.assetCount * 3);
  for (const j of s.completed.filter((j) => j.status === "delivered")) {
    assert.equal(j.languages, 3);
    assert.equal(j.path.filter((p) => p.stage === "asr").length, 1);
    assert.equal(j.path.filter((p) => p.stage === "vision").length, 1);
    assert.ok(
      j.path.find((p) => p.stage === "clips").start >=
        Math.max(
          ...j.path
            .filter((p) => ["asr", "vision"].includes(p.stage))
            .map((p) => p.end),
        ),
    );
  }
  assert.equal(s.joins.size, 0);
});
test("revoked assets cannot pass final delivery check", () => {
  const s = new Simulation({ outage: true, fallback: false, quality: 50 }, 900);
  assert.ok(s.stages.tts.queue.some((j) => j.restricted));
  s.configure({ arrival: 0, revoked: true, fallback: true });
  s.advance(3600);
  assert.ok(s.denied > 0);
  assert.ok(s.completed.some((j) => j.status === "rights hold"));
  assert.ok(!s.completed.some((j) => j.status === "delivered" && j.restricted));
});
test("retry budget terminates failed attempts and preserves their spend", () => {
  const s = new Simulation({
    arrival: 0,
    outage: true,
    fallback: false,
    retries: 0,
  });
  s.enqueue("tts", {
    id: "test",
    asset: "test",
    born: 0,
    sourceMinutes: 1,
    minutes: 1,
    output: true,
    locale: "en",
    slo: 10,
    path: [],
  });
  const job = s.stages.tts.queue.shift();
  s.start("tts", job);
  job.fallback = false;
  job.finishAt = 1;
  s.advance(1);
  assert.equal(s.quarantined, 1);
  assert.equal(s.retries, 0);
  assert.ok(s.costs.inference > 0);
  assert.equal(s.stages.qc.queue.length, 0);
});
test("autoscaling waits for warm-up and respects configured ceiling", () => {
  const s = new Simulation({ languages: 12, gpu: 1, autoscale: true });
  while (!s.scaleAt && s.time < 600) s.advance(1);
  assert.ok(s.scaleAt);
  const readyAt = s.scaleAt;
  s.advance(readyAt - s.time - 1);
  assert.equal(s.scaledGpu, 1);
  s.advance(1);
  assert.ok(s.scaledGpu > 1);
  s.advance(1600);
  assert.ok(s.scaledGpu <= 3);
});
test("cost categories reconcile and delivered minutes reconcile with outputs", () => {
  const s = new Simulation({ sourceMinutes: 10, clipRatio: 25 }, 3600);
  assert.ok(
    Math.abs(s.cost - Object.values(s.costs).reduce((a, b) => a + b, 0)) < 1e-7,
  );
  assert.equal(s.accepted, s.outputs * 2.5);
  assert.equal(s.metrics().unitCost, s.cost / s.accepted);
});
test("imported config is bounded and unknown model profiles fall back", () => {
  const c = normalizeConfig({
    arrival: Infinity,
    languages: 100,
    gpu: -4,
    model: "nonsense",
    reviewers: NaN,
    quality: 300,
    outage: "false",
  });
  assert.equal(c.arrival, 240);
  assert.equal(c.languages, 12);
  assert.equal(c.gpu, 1);
  assert.equal(c.model, "balanced");
  assert.equal(c.reviewers, 2);
  assert.equal(c.quality, 99);
  assert.equal(c.outage, false);
});

test("constant arrivals admit the exact expected number over a full time window", () => {
  const s = new Simulation({ arrival: 240, sourceMinutes: 5 }, 1800);
  assert.equal(s.assetCount, 60);
});
