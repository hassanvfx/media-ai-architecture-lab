import test from "node:test";
import assert from "node:assert/strict";
import { Simulation, normalizeConfig, capacityPlan } from "../src/engine.js";
import { DEFAULTS } from "../src/catalog.js";
import { durationSummary, sampleSourceMinutes } from "../src/workload.js";
import { splitTerms } from "../src/helpTokens.js";

test("mixed catalog has bounded variable per-source lengths and its declared expected mean", () => {
  const config = normalizeConfig({});
  const summary = durationSummary(config);
  const sim = new Simulation({ arrival: 0 });
  const samples = Array.from({ length: 20000 }, () =>
    sampleSourceMinutes(config, () => sim.workloadRandom()),
  );
  assert.ok(new Set(samples.map((n) => n.toFixed(1))).size > 50);
  assert.ok(samples.every((n) => n >= summary.min && n <= summary.max));
  assert.ok(
    Math.abs(
      samples.reduce((a, b) => a + b, 0) / samples.length - summary.mean,
    ) <
      summary.mean * 0.03,
  );
});
test("custom ranges are ordered, bounded and used by the planner", () => {
  const config = normalizeConfig({
    durationMode: "mix",
    catalogMix: "custom",
    minSourceMinutes: 10,
    maxSourceMinutes: 30,
  });
  assert.equal(config.sourceMinutes, 20);
  assert.equal(
    sampleSourceMinutes(config, () => 0.25),
    15,
  );
  assert.equal(
    normalizeConfig({ ...config, minSourceMinutes: 40 }).maxSourceMinutes,
    40,
  );
  const row = capacityPlan(config).find((n) => n.id === "tts");
  assert.equal(row.serviceSeconds, 2 + 20 * 60 * 0.5);
});
test("package lengths and full/highlight plans are captured at admission; destinations differ from English source", () => {
  const sim = new Simulation(
    { arrival: 48, languages: 2, quality: 50, cache: 0 },
    1800,
  );
  const expected = new Map(sim.recentSources.map((s) => [s.asset, s.minutes]));
  sim.configure({
    arrival: 0,
    plan: "highlights",
    clipRatio: 10,
    catalogMix: "long",
  });
  sim.advance(7200);
  assert.ok(sim.outputs > 0);
  for (const job of sim.completed) {
    assert.equal(job.sourceMinutes, expected.get(job.asset));
    assert.equal(job.plan, "full");
    assert.equal(job.minutes, job.sourceMinutes);
    assert.ok(["es", "fr"].includes(job.locale));
    assert.equal(job.sourceLanguage, "en");
    const speech = job.path.find((span) => span.stage === "tts");
    const mix = job.path.find((span) => span.stage === "mix");
    const quality = job.path.find((span) => span.stage === "qc");
    assert.ok(mix.start >= speech.end);
    assert.ok(quality.start >= mix.end);
  }
  assert.ok(new Set(sim.completed.map((j) => j.sourceMinutes)).size > 1);
});
test("legacy fixed-size inputs still reproduce a controlled duration test", () => {
  const config = normalizeConfig({ sourceMinutes: 10, clipRatio: 25 });
  assert.equal(config.durationMode, "fixed");
  assert.equal(config.plan, "highlights");
  assert.equal(
    sampleSourceMinutes(config, () => 0.999),
    10,
  );
});
test("technical term annotation matches acronyms, punctuation and whole terms", () => {
  const tokens = splitTerms(
    "GPU queue, pyannote.audio, A/V; GPUless should stay plain.",
  );
  const matches = tokens.filter((t) => t.term).map((t) => t.text);
  assert.ok(matches.includes("GPU"));
  assert.ok(matches.includes("queue"));
  assert.ok(matches.includes("pyannote.audio"));
  assert.ok(matches.includes("A/V"));
  assert.ok(!matches.includes("GPUless"));
  assert.equal(
    tokens.map((t) => t.text).join(""),
    "GPU queue, pyannote.audio, A/V; GPUless should stay plain.",
  );
});
