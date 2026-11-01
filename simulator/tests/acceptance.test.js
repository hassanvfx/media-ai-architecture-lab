import test from "node:test";
import assert from "node:assert/strict";
import { REVIEW } from "../src/review.js";
import { STAGES, DEFAULTS } from "../src/catalog.js";
import { capacityPlan, compareProfiles } from "../src/engine.js";

test("inspection answers 50 unique questions across ten engineering responsibilities", () => {
  assert.equal(REVIEW.length, 50);
  assert.equal(new Set(REVIEW.map((r) => r.q)).size, 50);
  const groups = [...new Set(REVIEW.map((r) => r.group))];
  assert.equal(groups.length, 10);
  for (const g of groups)
    assert.equal(REVIEW.filter((r) => r.group === g).length, 5);
  for (const q of REVIEW) {
    assert.ok(q.a.length >= 250);
    assert.ok(q.proof.length > 50);
    assert.ok(["Interactive", "Design", "Execution plan"].includes(q.evidence));
    assert.ok(
      ["architecture", "capacity", "economics", "traces", "decisions"].includes(
        q.target,
      ),
    );
    if (q.stage) assert.ok(STAGES.some((s) => s.id === q.stage));
  }
});
test("offered-load analysis reveals localization fan-out without multiplying shared analysis", () => {
  const a = capacityPlan(DEFAULTS),
    b = capacityPlan({ ...DEFAULTS, languages: 6 });
  assert.equal(
    b.find((r) => r.id === "asr").taskRate,
    a.find((r) => r.id === "asr").taskRate,
  );
  assert.equal(
    b.find((r) => r.id === "tts").taskRate,
    a.find((r) => r.id === "tts").taskRate * 2,
  );
  assert.equal(
    capacityPlan({ ...DEFAULTS, outage: true, fallback: false }).find(
      (r) => r.id === "tts",
    ).utilization,
    Infinity,
  );
});
test("controlled comparison admits equal work and discloses undrained runs", () => {
  const results = compareProfiles(DEFAULTS);
  assert.equal(results.length, 3);
  assert.equal(new Set(results.map((r) => r.assets)).size, 1);
  assert.equal(results[0].assets, 60);
  for (const r of results) {
    assert.ok(r.accepted > 0);
    assert.ok(r.unitCost > 0);
    assert.ok(r.time <= 12600);
    if (r.pending > 0) assert.equal(r.time, 12600);
  }
  const balanced = results.find((r) => r.model === "balanced"),
    economy = results.find((r) => r.model === "economy");
  assert.ok(balanced.yield > economy.yield);
  assert.ok(balanced.unitCost < economy.unitCost);
});
