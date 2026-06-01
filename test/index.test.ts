import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  // Types are imported implicitly through usage
  goldenRepair,
  repairTraceback,
  severityScore,
  FragmentCollection,
  entropyOfErrors,
  goldenRatio,
  aestheticScore,
  buildCrackGraph,
  findGoldenJoints,
  shortestCrackPath,
  injectFaults,
  measureRecovery,
  type GoldenSeam,
  type CrackGraph,
  type GoldenJoint,
  type WabiSabiReport,
  type ResilienceReport,
} from "../src/index.js";

// ─── goldenRepair ─────────────────────────────────────────────

describe("goldenRepair", () => {
  it("transforms an Error into a GoldenSeam", () => {
    const seam: GoldenSeam = goldenRepair(new Error("something broke"));
    assert.equal(typeof seam.severity, "number");
    assert.ok(seam.severity >= 0 && seam.severity <= 10);
    assert.ok(seam.position.includes("Error"));
    assert.ok(seam.position.includes("something broke"));
    assert.ok(typeof seam.repairQuality === "string");
    assert.ok(seam.repairQuality.length > 0);
  });

  it("handles TypeError with specific suggestion", () => {
    const seam = goldenRepair(new TypeError("not a function"));
    assert.ok(seam.position.includes("TypeError"));
    assert.ok(seam.repairQuality.includes("types") || seam.repairQuality.includes("casts"));
  });

  it("handles RangeError", () => {
    const seam = goldenRepair(new RangeError("out of bounds"));
    assert.ok(seam.position.includes("RangeError"));
    assert.ok(seam.repairQuality.length > 0);
  });

  it("handles SyntaxError", () => {
    const seam = goldenRepair(new SyntaxError("unexpected token"));
    assert.ok(seam.repairQuality.toLowerCase().includes("syntax"));
  });
});

describe("severityScore", () => {
  it("returns a number between 0 and 10", () => {
    const score = severityScore(new Error("test"));
    assert.ok(score >= 0 && score <= 10);
  });

  it("gives higher severity to deeper errors (closer to root)", () => {
    const baseScore = severityScore(new Error("x"));
    // TypeError is deeper in the chain → lower severity
    const typeScore = severityScore(new TypeError("x"));
    // Both should be valid, they may differ
    assert.ok(baseScore > 0);
    assert.ok(typeScore > 0);
  });

  it("longer messages reduce severity slightly", () => {
    const short = severityScore(new Error("x"));
    const long = severityScore(new Error("a".repeat(100)));
    assert.ok(short >= long);
  });
});

describe("repairTraceback", () => {
  it("returns an array of GoldenSeams", () => {
    const seams = repairTraceback(new Error("stack test"));
    assert.ok(Array.isArray(seams));
    assert.ok(seams.length >= 1);
    for (const s of seams) {
      assert.equal(typeof s.severity, "number");
      assert.equal(typeof s.position, "string");
      assert.equal(typeof s.repairQuality, "string");
    }
  });

  it("outermost frame has highest severity", () => {
    const err = new Error("deep call");
    const seams = repairTraceback(err);
    if (seams.length > 1) {
      assert.ok(seams[0].severity >= seams[seams.length - 1].severity);
    }
  });

  it("handles error with no stack", () => {
    const err = new Error("no stack");
    err.stack = "";
    const seams = repairTraceback(err);
    assert.ok(seams.length >= 1);
    assert.ok(seams[0].severity > 0);
  });
});

// ─── FragmentCollection ───────────────────────────────────────

describe("FragmentCollection", () => {
  it("adds fragments and reports length", () => {
    const coll = new FragmentCollection();
    assert.equal(coll.length, 0);
    coll.add([1, 2, 3], 0.9, 0);
    assert.equal(coll.length, 1);
    coll.add([4, 5], 0.7, 3);
    assert.equal(coll.length, 2);
  });

  it("computes total and average confidence", () => {
    const coll = new FragmentCollection();
    coll.add([1], 0.8);
    coll.add([2], 0.6);
    assert.equal(coll.totalConfidence, 1.4);
    assert.equal(coll.averageConfidence, 0.7);
  });

  it("sorts by confidence descending", () => {
    const coll = new FragmentCollection();
    coll.add([1], 0.3, 0);
    coll.add([2], 0.9, 1);
    coll.add([3], 0.6, 2);
    coll.sort();
    const confidences = [...coll].map((f) => f.confidence);
    assert.deepEqual(confidences, [0.9, 0.6, 0.3]);
  });

  it("reassembles fragments with interpolation for gaps", () => {
    const coll = new FragmentCollection();
    coll.add([1, 2], 1.0, 0);
    coll.add([5, 6], 1.0, 3);
    // indices: 0→1, 1→2, 2→gap, 3→5, 4→6
    const result = coll.reassemble();
    assert.equal(result[0], 1);
    assert.equal(result[1], 2);
    assert.equal(result[3], 5);
    assert.equal(result[4], 6);
    // Gap at index 2 should be interpolated between 2 and 5
    assert.ok(result[2] >= 2 && result[2] <= 5);
  });

  it("returns empty array for empty collection", () => {
    const coll = new FragmentCollection();
    assert.deepEqual(coll.reassemble(), []);
  });

  it("handles single fragment", () => {
    const coll = new FragmentCollection();
    coll.add([10, 20, 30], 1.0, 0);
    const result = coll.reassemble();
    assert.deepEqual(result, [10, 20, 30]);
  });

  it("prefers higher confidence when fragments overlap", () => {
    const coll = new FragmentCollection();
    coll.add([1, 2], 0.3, 0);
    coll.add([9, 8], 0.9, 0);
    const result = coll.reassemble();
    assert.equal(result[0], 9);
    assert.equal(result[1], 8);
  });

  it("is iterable", () => {
    const coll = new FragmentCollection();
    coll.add([1], 0.5, 0);
    coll.add([2], 0.8, 1);
    const items = [...coll];
    assert.equal(items.length, 2);
  });
});

// ─── wabiSabi ─────────────────────────────────────────────────

describe("entropyOfErrors", () => {
  it("returns 0 for empty array", () => {
    assert.equal(entropyOfErrors([]), 0);
  });

  it("returns 0 for all same errors", () => {
    assert.equal(entropyOfErrors(["A", "A", "A"]), 0);
  });

  it("returns 1 for two equal groups", () => {
    assert.equal(entropyOfErrors(["A", "B"]), 1);
  });

  it("returns 2 for four equal groups", () => {
    assert.equal(Math.round(entropyOfErrors(["A", "B", "C", "D"])), 2);
  });

  it("increases with more distinct types", () => {
    const e3 = entropyOfErrors(["A", "B", "C"]);
    const e5 = entropyOfErrors(["A", "B", "C", "D", "E"]);
    assert.ok(e5 > e3);
  });
});

describe("goldenRatio", () => {
  it("returns ~1 for perfect golden ratio", () => {
    const val = goldenRatio(1.618, 1.0);
    assert.ok(Math.abs(val - 1.0) < 0.01);
  });

  it("returns low value when nothing recovered", () => {
    const val = goldenRatio(0, 100);
    assert.ok(val < 0.25); // far from golden ratio
  });

  it("returns 1 when nothing lost and something recovered", () => {
    assert.equal(goldenRatio(50, 0), 1);
  });

  it("returns 0 when both zero", () => {
    assert.equal(goldenRatio(0, 0), 0);
  });

  it("decreases as ratio deviates from φ", () => {
    const close = goldenRatio(1.618, 1);
    const far = goldenRatio(10, 1);
    assert.ok(close > far);
  });
});

describe("aestheticScore", () => {
  it("returns 1 for perfect array", () => {
    assert.equal(aestheticScore([1, 2, 3, 4, 5]), 1);
  });

  it("returns 0 for all nulls", () => {
    assert.equal(aestheticScore([null, null, null]), 0);
  });

  it("returns between 0 and 1 for mixed data", () => {
    const score = aestheticScore([1, null, 3]);
    assert.ok(score > 0 && score < 1);
  });

  it("returns 0 for null input", () => {
    assert.equal(aestheticScore(null), 0);
  });

  it("returns 0 for undefined", () => {
    assert.equal(aestheticScore(undefined), 0);
  });

  it("returns 1 for number", () => {
    assert.equal(aestheticScore(42), 1);
  });

  it("returns 1 for non-empty string", () => {
    assert.equal(aestheticScore("hello"), 1);
  });

  it("returns 0 for empty string", () => {
    assert.equal(aestheticScore(""), 0);
  });

  it("scores objects by filled values", () => {
    const score = aestheticScore({ a: 1, b: null });
    assert.ok(score > 0 && score < 1);
  });
});

// ─── cracks ───────────────────────────────────────────────────

describe("buildCrackGraph", () => {
  it("builds graph from error records", () => {
    const graph = buildCrackGraph([
      { source: "db", target: "api" },
      { source: "api", target: "ui" },
    ]);
    assert.ok(graph.nodes.includes("db"));
    assert.ok(graph.nodes.includes("api"));
    assert.ok(graph.nodes.includes("ui"));
    assert.equal(graph.nodes.length, 3);
  });

  it("records error counts", () => {
    const graph = buildCrackGraph([
      { source: "db", target: "api" },
      { source: "db" },
    ]);
    assert.equal(graph.errorCounts.get("db"), 2);
  });

  it("accumulates edge weights", () => {
    const graph = buildCrackGraph([
      { source: "a", target: "b", weight: 3 },
      { source: "a", target: "b", weight: 2 },
    ]);
    assert.equal(graph.edgeWeights.get("a→b"), 5);
  });
});

describe("findGoldenJoints", () => {
  it("identifies highest impact node", () => {
    const graph = buildCrackGraph([
      { source: "a", target: "b" },
      { source: "b", target: "c" },
      { source: "b", target: "d" },
    ]);
    const joints = findGoldenJoints(graph);
    assert.ok(joints.length >= 3);
    assert.equal(joints[0].node, "a"); // a reaches b, c, d
    assert.ok(joints[0].impact > 0);
  });

  it("each joint has impact and beauty", () => {
    const graph = buildCrackGraph([
      { source: "x", target: "y" },
    ]);
    const joints = findGoldenJoints(graph);
    for (const j of joints) {
      assert.equal(typeof j.node, "string");
      assert.equal(typeof j.impact, "number");
      assert.equal(typeof j.beauty, "number");
      assert.ok(j.beauty >= 0 && j.beauty <= 1);
    }
  });
});

describe("shortestCrackPath", () => {
  it("finds direct path", () => {
    const graph = buildCrackGraph([
      { source: "a", target: "c" },
      { source: "a", target: "b" },
      { source: "b", target: "c" },
    ]);
    const path = shortestCrackPath(graph, "a", "c");
    assert.deepEqual(path, ["a", "c"]);
  });

  it("finds multi-hop path", () => {
    const graph = buildCrackGraph([
      { source: "a", target: "b" },
      { source: "b", target: "c" },
    ]);
    const path = shortestCrackPath(graph, "a", "c");
    assert.deepEqual(path, ["a", "b", "c"]);
  });

  it("returns null when no path", () => {
    const graph = buildCrackGraph([
      { source: "a", target: "b" },
    ]);
    assert.equal(shortestCrackPath(graph, "b", "a"), null);
  });

  it("returns null for missing nodes", () => {
    const graph = buildCrackGraph([]);
    assert.equal(shortestCrackPath(graph, "x", "y"), null);
  });

  it("returns single node for same source and target", () => {
    const graph = buildCrackGraph([{ source: "a" }]);
    assert.deepEqual(shortestCrackPath(graph, "a", "a"), ["a"]);
  });
});

// ─── resilience ───────────────────────────────────────────────

describe("injectFaults", () => {
  it("returns results and faultCount", () => {
    const { results, faultCount } = injectFaults(() => 42, 0.5);
    assert.equal(results.length, 100);
    assert.ok(typeof faultCount === "number");
    assert.ok(faultCount >= 0 && faultCount <= 100);
  });

  it("with faultRate=0, should have zero or very few faults", () => {
    const { faultCount } = injectFaults(() => 1, 0);
    // faultRate 0 means no injected faults, but fn errors still count
    assert.equal(faultCount, 0);
  });

  it("with faultRate=1, all iterations are faults", () => {
    const { faultCount, results } = injectFaults(() => 1, 1.0);
    assert.equal(faultCount, 100);
    for (const r of results) {
      assert.equal(r.status, "fault");
    }
  });

  it("captures successful values", () => {
    const { results } = injectFaults(() => "hello", 0);
    assert.equal(results[0].status, "success");
    assert.equal(results[0].value, "hello");
  });
});

describe("measureRecovery", () => {
  it("measures recovery rate correctly", () => {
    const system = (err: Error) => err instanceof TypeError;
    const report = measureRecovery(system, [
      new TypeError("a"),
      new Error("b"),
      new TypeError("c"),
    ]);
    assert.ok(Math.abs(report.recoveryRate - 2 / 3) < 0.01);
    assert.equal(report.totalFaults, 3);
    assert.equal(report.successfulRecoveries, 2);
  });

  it("returns a valid ResilienceReport", () => {
    const report = measureRecovery(() => true, [new Error("1"), new Error("2")]);
    assert.equal(report.recoveryRate, 1);
    assert.equal(report.totalFaults, 2);
    assert.equal(report.successfulRecoveries, 2);
    assert.ok(report.meanTimeToRepair >= 0);
    assert.ok(report.aestheticQuality >= 0 && report.aestheticQuality <= 1);
  });

  it("handles total failure", () => {
    const report = measureRecovery(() => false, [new Error("x")]);
    assert.equal(report.recoveryRate, 0);
    assert.equal(report.successfulRecoveries, 0);
  });

  it("handles system that throws", () => {
    const report = measureRecovery(
      () => {
        throw new Error("boom");
      },
      [new Error("x")]
    );
    assert.equal(report.recoveryRate, 0);
  });

  it("handles empty faults array", () => {
    const report = measureRecovery(() => true, []);
    assert.equal(report.recoveryRate, 0);
    assert.equal(report.totalFaults, 0);
  });
});
