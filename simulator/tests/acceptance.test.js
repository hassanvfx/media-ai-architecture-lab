import test from "node:test";
import assert from "node:assert/strict";
import { REVIEW } from "../src/review.js";
import { STAGES, DEFAULTS, CONNECTIONS } from "../src/catalog.js";
import { capacityPlan, compareProfiles } from "../src/engine.js";
test("50 unique architecture questions cover ten selected-flow responsibilities", () => {
  assert.equal(REVIEW.length, 50);
  assert.equal(new Set(REVIEW.map((q) => q.q)).size, 50);
  const groups = [...new Set(REVIEW.map((q) => q.group))];
  assert.equal(groups.length, 10);
  for (const group of groups)
    assert.equal(REVIEW.filter((q) => q.group === group).length, 5);
  for (const item of REVIEW) {
    assert.ok(item.a.length > 250);
    assert.ok(item.proof.length > 50);
    assert.ok(
      [
        "architecture",
        "audio",
        "final",
        "capacity",
        "economics",
        "traces",
        "decisions",
      ].includes(item.target),
    );
    if (item.stage) assert.ok(STAGES.some((stage) => stage.id === item.stage));
  }
});
test("the graph has no route around either mandatory human gate", () => {
  assert.deepEqual(
    CONNECTIONS.find(([a]) => a === "dub"),
    ["dub", "audio_review"],
  );
  assert.deepEqual(
    CONNECTIONS.find(([a]) => a === "audio_review"),
    ["audio_review", "lipsync"],
  );
  assert.deepEqual(
    CONNECTIONS.find(([a]) => a === "reassemble"),
    ["reassemble", "final_review"],
  );
  assert.deepEqual(
    CONNECTIONS.find(([a]) => a === "final_review"),
    ["final_review", "publish"],
  );
  assert.equal(STAGES.length, 10);
});
test("language and chunk amplification preserve shared source intake", () => {
  const a = capacityPlan(DEFAULTS),
    b = capacityPlan({ ...DEFAULTS, languages: 6 });
  assert.equal(
    a.find((row) => row.id === "ingest").taskRate,
    b.find((row) => row.id === "ingest").taskRate,
  );
  assert.equal(
    b.find((row) => row.id === "dub").taskRate,
    a.find((row) => row.id === "dub").taskRate * 2,
  );
  const more = capacityPlan({ ...DEFAULTS, chunkMinutes: 1 });
  assert.ok(
    more.find((row) => row.id === "dub").taskRate >
      a.find((row) => row.id === "dub").taskRate,
  );
});
test("planning comparisons expose the same acceptance assumptions without creating evidence of actual quality", () => {
  const rows = compareProfiles(DEFAULTS);
  assert.equal(rows.length, 3);
  for (const row of rows) {
    assert.ok(row.unitCost > 0);
    assert.equal(row.approvalPercent, DEFAULTS.expectedApproval);
    assert.equal(row.qaPercent, DEFAULTS.expectedFinalApproval);
    assert.ok(row.meanChunks > 1);
  }
});
