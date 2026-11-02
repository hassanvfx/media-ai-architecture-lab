import test from "node:test";
import assert from "node:assert/strict";
import { Simulation, normalizeConfig } from "../src/engine.js";
import {
  durationSummary,
  sampleSourceMinutes,
  segmentSource,
  validCoverage,
} from "../src/workload.js";
import { splitTerms } from "../src/helpTokens.js";
test("variable catalog samples respect bounds and declared expected mean", () => {
  const c = normalizeConfig({}),
    d = durationSummary(c),
    s = new Simulation({ arrival: 0 });
  const samples = Array.from({ length: 20000 }, () =>
    sampleSourceMinutes(c, () => s.workloadRandom()),
  );
  assert.ok(samples.every((n) => n >= d.min && n <= d.max));
  assert.ok(new Set(samples.map((n) => n.toFixed(1))).size > 50);
  assert.ok(
    Math.abs(samples.reduce((a, b) => a + b, 0) / samples.length - d.mean) <
      d.mean * 0.03,
  );
});
test("duration batches preserve every interval and the original program length", () => {
  const parts = segmentSource(12, "duration", 5, () => 0.5);
  assert.deepEqual(
    parts.map((part) => part.minutes),
    [5, 5, 2],
  );
  assert.ok(validCoverage(parts, 12));
  assert.equal(parts.at(-1).end, 720);
});
test("scene-informed batches are variable but capped with contiguous coverage", () => {
  const s = new Simulation({ arrival: 0 });
  const parts = segmentSource(43, "scene", 5, () => s.workloadRandom());
  assert.ok(parts.every((part) => part.minutes <= 5));
  assert.ok(new Set(parts.map((part) => part.minutes.toFixed(2))).size > 1);
  assert.ok(validCoverage(parts, 43));
  assert.equal(validCoverage(parts.slice(1), 43), false);
});
test("custom catalog ranges normalize and legacy fixed tests remain explicit", () => {
  const c = normalizeConfig({
    durationMode: "mix",
    catalogMix: "custom",
    minSourceMinutes: 10,
    maxSourceMinutes: 30,
  });
  assert.equal(c.sourceMinutes, 20);
  assert.equal(
    sampleSourceMinutes(c, () => 0.25),
    15,
  );
  assert.equal(normalizeConfig({ sourceMinutes: 12 }).durationMode, "fixed");
});
test("source manifests are captured at admission despite later segmentation changes", () => {
  const s = new Simulation(
    { arrival: 24, sourceMinutes: 12, languages: 1, chunkMinutes: 5 },
    720,
  );
  s.configure({
    arrival: 0,
    chunkMinutes: 1,
    segmentationMode: "scene",
    languages: 8,
  });
  s.advance(2400);
  assert.equal(s.pendingAudio(s.snapshot().pendingAudio[0].id).segmentCount, 3);
  assert.ok(
    s
      .snapshot()
      .pendingAudio.every(
        (job) =>
          job.locale === "es" && job.chunkMinutes === 5 && job.languages === 1,
      ),
  );
});
test("technical term tokenization respects complete labels and punctuation", () => {
  const text = "Sync API uses SHA-256 audio approval; GPUless is not GPU.";
  const parts = splitTerms(text);
  assert.equal(parts.map((part) => part.text).join(""), text);
  assert.ok(parts.some((part) => part.term === "SHA-256"));
  assert.ok(!parts.some((part) => part.text === "GPUless" && part.term));
});
