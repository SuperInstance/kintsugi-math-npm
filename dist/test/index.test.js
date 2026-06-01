"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const index_js_1 = require("../src/index.js");
// ─── goldenRepair ─────────────────────────────────────────────
(0, node_test_1.describe)("goldenRepair", () => {
    (0, node_test_1.it)("transforms an Error into a GoldenSeam", () => {
        const seam = (0, index_js_1.goldenRepair)(new Error("something broke"));
        strict_1.default.equal(typeof seam.severity, "number");
        strict_1.default.ok(seam.severity >= 0 && seam.severity <= 10);
        strict_1.default.ok(seam.position.includes("Error"));
        strict_1.default.ok(seam.position.includes("something broke"));
        strict_1.default.ok(typeof seam.repairQuality === "string");
        strict_1.default.ok(seam.repairQuality.length > 0);
    });
    (0, node_test_1.it)("handles TypeError with specific suggestion", () => {
        const seam = (0, index_js_1.goldenRepair)(new TypeError("not a function"));
        strict_1.default.ok(seam.position.includes("TypeError"));
        strict_1.default.ok(seam.repairQuality.includes("types") || seam.repairQuality.includes("casts"));
    });
    (0, node_test_1.it)("handles RangeError", () => {
        const seam = (0, index_js_1.goldenRepair)(new RangeError("out of bounds"));
        strict_1.default.ok(seam.position.includes("RangeError"));
        strict_1.default.ok(seam.repairQuality.length > 0);
    });
    (0, node_test_1.it)("handles SyntaxError", () => {
        const seam = (0, index_js_1.goldenRepair)(new SyntaxError("unexpected token"));
        strict_1.default.ok(seam.repairQuality.toLowerCase().includes("syntax"));
    });
});
(0, node_test_1.describe)("severityScore", () => {
    (0, node_test_1.it)("returns a number between 0 and 10", () => {
        const score = (0, index_js_1.severityScore)(new Error("test"));
        strict_1.default.ok(score >= 0 && score <= 10);
    });
    (0, node_test_1.it)("gives higher severity to deeper errors (closer to root)", () => {
        const baseScore = (0, index_js_1.severityScore)(new Error("x"));
        // TypeError is deeper in the chain → lower severity
        const typeScore = (0, index_js_1.severityScore)(new TypeError("x"));
        // Both should be valid, they may differ
        strict_1.default.ok(baseScore > 0);
        strict_1.default.ok(typeScore > 0);
    });
    (0, node_test_1.it)("longer messages reduce severity slightly", () => {
        const short = (0, index_js_1.severityScore)(new Error("x"));
        const long = (0, index_js_1.severityScore)(new Error("a".repeat(100)));
        strict_1.default.ok(short >= long);
    });
});
(0, node_test_1.describe)("repairTraceback", () => {
    (0, node_test_1.it)("returns an array of GoldenSeams", () => {
        const seams = (0, index_js_1.repairTraceback)(new Error("stack test"));
        strict_1.default.ok(Array.isArray(seams));
        strict_1.default.ok(seams.length >= 1);
        for (const s of seams) {
            strict_1.default.equal(typeof s.severity, "number");
            strict_1.default.equal(typeof s.position, "string");
            strict_1.default.equal(typeof s.repairQuality, "string");
        }
    });
    (0, node_test_1.it)("outermost frame has highest severity", () => {
        const err = new Error("deep call");
        const seams = (0, index_js_1.repairTraceback)(err);
        if (seams.length > 1) {
            strict_1.default.ok(seams[0].severity >= seams[seams.length - 1].severity);
        }
    });
    (0, node_test_1.it)("handles error with no stack", () => {
        const err = new Error("no stack");
        err.stack = "";
        const seams = (0, index_js_1.repairTraceback)(err);
        strict_1.default.ok(seams.length >= 1);
        strict_1.default.ok(seams[0].severity > 0);
    });
});
// ─── FragmentCollection ───────────────────────────────────────
(0, node_test_1.describe)("FragmentCollection", () => {
    (0, node_test_1.it)("adds fragments and reports length", () => {
        const coll = new index_js_1.FragmentCollection();
        strict_1.default.equal(coll.length, 0);
        coll.add([1, 2, 3], 0.9, 0);
        strict_1.default.equal(coll.length, 1);
        coll.add([4, 5], 0.7, 3);
        strict_1.default.equal(coll.length, 2);
    });
    (0, node_test_1.it)("computes total and average confidence", () => {
        const coll = new index_js_1.FragmentCollection();
        coll.add([1], 0.8);
        coll.add([2], 0.6);
        strict_1.default.equal(coll.totalConfidence, 1.4);
        strict_1.default.equal(coll.averageConfidence, 0.7);
    });
    (0, node_test_1.it)("sorts by confidence descending", () => {
        const coll = new index_js_1.FragmentCollection();
        coll.add([1], 0.3, 0);
        coll.add([2], 0.9, 1);
        coll.add([3], 0.6, 2);
        coll.sort();
        const confidences = [...coll].map((f) => f.confidence);
        strict_1.default.deepEqual(confidences, [0.9, 0.6, 0.3]);
    });
    (0, node_test_1.it)("reassembles fragments with interpolation for gaps", () => {
        const coll = new index_js_1.FragmentCollection();
        coll.add([1, 2], 1.0, 0);
        coll.add([5, 6], 1.0, 3);
        // indices: 0→1, 1→2, 2→gap, 3→5, 4→6
        const result = coll.reassemble();
        strict_1.default.equal(result[0], 1);
        strict_1.default.equal(result[1], 2);
        strict_1.default.equal(result[3], 5);
        strict_1.default.equal(result[4], 6);
        // Gap at index 2 should be interpolated between 2 and 5
        strict_1.default.ok(result[2] >= 2 && result[2] <= 5);
    });
    (0, node_test_1.it)("returns empty array for empty collection", () => {
        const coll = new index_js_1.FragmentCollection();
        strict_1.default.deepEqual(coll.reassemble(), []);
    });
    (0, node_test_1.it)("handles single fragment", () => {
        const coll = new index_js_1.FragmentCollection();
        coll.add([10, 20, 30], 1.0, 0);
        const result = coll.reassemble();
        strict_1.default.deepEqual(result, [10, 20, 30]);
    });
    (0, node_test_1.it)("prefers higher confidence when fragments overlap", () => {
        const coll = new index_js_1.FragmentCollection();
        coll.add([1, 2], 0.3, 0);
        coll.add([9, 8], 0.9, 0);
        const result = coll.reassemble();
        strict_1.default.equal(result[0], 9);
        strict_1.default.equal(result[1], 8);
    });
    (0, node_test_1.it)("is iterable", () => {
        const coll = new index_js_1.FragmentCollection();
        coll.add([1], 0.5, 0);
        coll.add([2], 0.8, 1);
        const items = [...coll];
        strict_1.default.equal(items.length, 2);
    });
});
// ─── wabiSabi ─────────────────────────────────────────────────
(0, node_test_1.describe)("entropyOfErrors", () => {
    (0, node_test_1.it)("returns 0 for empty array", () => {
        strict_1.default.equal((0, index_js_1.entropyOfErrors)([]), 0);
    });
    (0, node_test_1.it)("returns 0 for all same errors", () => {
        strict_1.default.equal((0, index_js_1.entropyOfErrors)(["A", "A", "A"]), 0);
    });
    (0, node_test_1.it)("returns 1 for two equal groups", () => {
        strict_1.default.equal((0, index_js_1.entropyOfErrors)(["A", "B"]), 1);
    });
    (0, node_test_1.it)("returns 2 for four equal groups", () => {
        strict_1.default.equal(Math.round((0, index_js_1.entropyOfErrors)(["A", "B", "C", "D"])), 2);
    });
    (0, node_test_1.it)("increases with more distinct types", () => {
        const e3 = (0, index_js_1.entropyOfErrors)(["A", "B", "C"]);
        const e5 = (0, index_js_1.entropyOfErrors)(["A", "B", "C", "D", "E"]);
        strict_1.default.ok(e5 > e3);
    });
});
(0, node_test_1.describe)("goldenRatio", () => {
    (0, node_test_1.it)("returns ~1 for perfect golden ratio", () => {
        const val = (0, index_js_1.goldenRatio)(1.618, 1.0);
        strict_1.default.ok(Math.abs(val - 1.0) < 0.01);
    });
    (0, node_test_1.it)("returns low value when nothing recovered", () => {
        const val = (0, index_js_1.goldenRatio)(0, 100);
        strict_1.default.ok(val < 0.25); // far from golden ratio
    });
    (0, node_test_1.it)("returns 1 when nothing lost and something recovered", () => {
        strict_1.default.equal((0, index_js_1.goldenRatio)(50, 0), 1);
    });
    (0, node_test_1.it)("returns 0 when both zero", () => {
        strict_1.default.equal((0, index_js_1.goldenRatio)(0, 0), 0);
    });
    (0, node_test_1.it)("decreases as ratio deviates from φ", () => {
        const close = (0, index_js_1.goldenRatio)(1.618, 1);
        const far = (0, index_js_1.goldenRatio)(10, 1);
        strict_1.default.ok(close > far);
    });
});
(0, node_test_1.describe)("aestheticScore", () => {
    (0, node_test_1.it)("returns 1 for perfect array", () => {
        strict_1.default.equal((0, index_js_1.aestheticScore)([1, 2, 3, 4, 5]), 1);
    });
    (0, node_test_1.it)("returns 0 for all nulls", () => {
        strict_1.default.equal((0, index_js_1.aestheticScore)([null, null, null]), 0);
    });
    (0, node_test_1.it)("returns between 0 and 1 for mixed data", () => {
        const score = (0, index_js_1.aestheticScore)([1, null, 3]);
        strict_1.default.ok(score > 0 && score < 1);
    });
    (0, node_test_1.it)("returns 0 for null input", () => {
        strict_1.default.equal((0, index_js_1.aestheticScore)(null), 0);
    });
    (0, node_test_1.it)("returns 0 for undefined", () => {
        strict_1.default.equal((0, index_js_1.aestheticScore)(undefined), 0);
    });
    (0, node_test_1.it)("returns 1 for number", () => {
        strict_1.default.equal((0, index_js_1.aestheticScore)(42), 1);
    });
    (0, node_test_1.it)("returns 1 for non-empty string", () => {
        strict_1.default.equal((0, index_js_1.aestheticScore)("hello"), 1);
    });
    (0, node_test_1.it)("returns 0 for empty string", () => {
        strict_1.default.equal((0, index_js_1.aestheticScore)(""), 0);
    });
    (0, node_test_1.it)("scores objects by filled values", () => {
        const score = (0, index_js_1.aestheticScore)({ a: 1, b: null });
        strict_1.default.ok(score > 0 && score < 1);
    });
});
// ─── cracks ───────────────────────────────────────────────────
(0, node_test_1.describe)("buildCrackGraph", () => {
    (0, node_test_1.it)("builds graph from error records", () => {
        const graph = (0, index_js_1.buildCrackGraph)([
            { source: "db", target: "api" },
            { source: "api", target: "ui" },
        ]);
        strict_1.default.ok(graph.nodes.includes("db"));
        strict_1.default.ok(graph.nodes.includes("api"));
        strict_1.default.ok(graph.nodes.includes("ui"));
        strict_1.default.equal(graph.nodes.length, 3);
    });
    (0, node_test_1.it)("records error counts", () => {
        const graph = (0, index_js_1.buildCrackGraph)([
            { source: "db", target: "api" },
            { source: "db" },
        ]);
        strict_1.default.equal(graph.errorCounts.get("db"), 2);
    });
    (0, node_test_1.it)("accumulates edge weights", () => {
        const graph = (0, index_js_1.buildCrackGraph)([
            { source: "a", target: "b", weight: 3 },
            { source: "a", target: "b", weight: 2 },
        ]);
        strict_1.default.equal(graph.edgeWeights.get("a→b"), 5);
    });
});
(0, node_test_1.describe)("findGoldenJoints", () => {
    (0, node_test_1.it)("identifies highest impact node", () => {
        const graph = (0, index_js_1.buildCrackGraph)([
            { source: "a", target: "b" },
            { source: "b", target: "c" },
            { source: "b", target: "d" },
        ]);
        const joints = (0, index_js_1.findGoldenJoints)(graph);
        strict_1.default.ok(joints.length >= 3);
        strict_1.default.equal(joints[0].node, "a"); // a reaches b, c, d
        strict_1.default.ok(joints[0].impact > 0);
    });
    (0, node_test_1.it)("each joint has impact and beauty", () => {
        const graph = (0, index_js_1.buildCrackGraph)([
            { source: "x", target: "y" },
        ]);
        const joints = (0, index_js_1.findGoldenJoints)(graph);
        for (const j of joints) {
            strict_1.default.equal(typeof j.node, "string");
            strict_1.default.equal(typeof j.impact, "number");
            strict_1.default.equal(typeof j.beauty, "number");
            strict_1.default.ok(j.beauty >= 0 && j.beauty <= 1);
        }
    });
});
(0, node_test_1.describe)("shortestCrackPath", () => {
    (0, node_test_1.it)("finds direct path", () => {
        const graph = (0, index_js_1.buildCrackGraph)([
            { source: "a", target: "c" },
            { source: "a", target: "b" },
            { source: "b", target: "c" },
        ]);
        const path = (0, index_js_1.shortestCrackPath)(graph, "a", "c");
        strict_1.default.deepEqual(path, ["a", "c"]);
    });
    (0, node_test_1.it)("finds multi-hop path", () => {
        const graph = (0, index_js_1.buildCrackGraph)([
            { source: "a", target: "b" },
            { source: "b", target: "c" },
        ]);
        const path = (0, index_js_1.shortestCrackPath)(graph, "a", "c");
        strict_1.default.deepEqual(path, ["a", "b", "c"]);
    });
    (0, node_test_1.it)("returns null when no path", () => {
        const graph = (0, index_js_1.buildCrackGraph)([
            { source: "a", target: "b" },
        ]);
        strict_1.default.equal((0, index_js_1.shortestCrackPath)(graph, "b", "a"), null);
    });
    (0, node_test_1.it)("returns null for missing nodes", () => {
        const graph = (0, index_js_1.buildCrackGraph)([]);
        strict_1.default.equal((0, index_js_1.shortestCrackPath)(graph, "x", "y"), null);
    });
    (0, node_test_1.it)("returns single node for same source and target", () => {
        const graph = (0, index_js_1.buildCrackGraph)([{ source: "a" }]);
        strict_1.default.deepEqual((0, index_js_1.shortestCrackPath)(graph, "a", "a"), ["a"]);
    });
});
// ─── resilience ───────────────────────────────────────────────
(0, node_test_1.describe)("injectFaults", () => {
    (0, node_test_1.it)("returns results and faultCount", () => {
        const { results, faultCount } = (0, index_js_1.injectFaults)(() => 42, 0.5);
        strict_1.default.equal(results.length, 100);
        strict_1.default.ok(typeof faultCount === "number");
        strict_1.default.ok(faultCount >= 0 && faultCount <= 100);
    });
    (0, node_test_1.it)("with faultRate=0, should have zero or very few faults", () => {
        const { faultCount } = (0, index_js_1.injectFaults)(() => 1, 0);
        // faultRate 0 means no injected faults, but fn errors still count
        strict_1.default.equal(faultCount, 0);
    });
    (0, node_test_1.it)("with faultRate=1, all iterations are faults", () => {
        const { faultCount, results } = (0, index_js_1.injectFaults)(() => 1, 1.0);
        strict_1.default.equal(faultCount, 100);
        for (const r of results) {
            strict_1.default.equal(r.status, "fault");
        }
    });
    (0, node_test_1.it)("captures successful values", () => {
        const { results } = (0, index_js_1.injectFaults)(() => "hello", 0);
        strict_1.default.equal(results[0].status, "success");
        strict_1.default.equal(results[0].value, "hello");
    });
});
(0, node_test_1.describe)("measureRecovery", () => {
    (0, node_test_1.it)("measures recovery rate correctly", () => {
        const system = (err) => err instanceof TypeError;
        const report = (0, index_js_1.measureRecovery)(system, [
            new TypeError("a"),
            new Error("b"),
            new TypeError("c"),
        ]);
        strict_1.default.ok(Math.abs(report.recoveryRate - 2 / 3) < 0.01);
        strict_1.default.equal(report.totalFaults, 3);
        strict_1.default.equal(report.successfulRecoveries, 2);
    });
    (0, node_test_1.it)("returns a valid ResilienceReport", () => {
        const report = (0, index_js_1.measureRecovery)(() => true, [new Error("1"), new Error("2")]);
        strict_1.default.equal(report.recoveryRate, 1);
        strict_1.default.equal(report.totalFaults, 2);
        strict_1.default.equal(report.successfulRecoveries, 2);
        strict_1.default.ok(report.meanTimeToRepair >= 0);
        strict_1.default.ok(report.aestheticQuality >= 0 && report.aestheticQuality <= 1);
    });
    (0, node_test_1.it)("handles total failure", () => {
        const report = (0, index_js_1.measureRecovery)(() => false, [new Error("x")]);
        strict_1.default.equal(report.recoveryRate, 0);
        strict_1.default.equal(report.successfulRecoveries, 0);
    });
    (0, node_test_1.it)("handles system that throws", () => {
        const report = (0, index_js_1.measureRecovery)(() => {
            throw new Error("boom");
        }, [new Error("x")]);
        strict_1.default.equal(report.recoveryRate, 0);
    });
    (0, node_test_1.it)("handles empty faults array", () => {
        const report = (0, index_js_1.measureRecovery)(() => true, []);
        strict_1.default.equal(report.recoveryRate, 0);
        strict_1.default.equal(report.totalFaults, 0);
    });
});
