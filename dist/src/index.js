"use strict";
/**
 * kintsugi-math — The mathematics of beautiful error recovery.
 *
 * In kintsugi, broken pottery is repaired with gold lacquer, making the
 * cracks beautiful rather than hidden. This library brings that philosophy
 * to software: transform errors into golden seams, reassemble fragmented
 * data, map crack propagation, and measure the aesthetics of recovery.
 *
 * @module kintsugi-math
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FragmentCollection = void 0;
exports.severityScore = severityScore;
exports.goldenRepair = goldenRepair;
exports.repairTraceback = repairTraceback;
exports.entropyOfErrors = entropyOfErrors;
exports.goldenRatio = goldenRatio;
exports.aestheticScore = aestheticScore;
exports.buildCrackGraph = buildCrackGraph;
exports.findGoldenJoints = findGoldenJoints;
exports.shortestCrackPath = shortestCrackPath;
exports.injectFaults = injectFaults;
exports.measureRecovery = measureRecovery;
// ─── goldenRepair ───────────────────────────────────────────────────
const PHI = (1 + Math.sqrt(5)) / 2; // ≈ 1.618
/** Well-known error type suggestions. */
const SUGGESTIONS = {
    EvalError: "Avoid eval(); refactor to safer alternatives.",
    RangeError: "Validate numeric ranges before operations.",
    ReferenceError: "Check variable declarations and scope.",
    SyntaxError: "Validate input syntax before parsing.",
    TypeError: "Ensure correct argument types; add explicit casts or guards.",
    URIError: "Validate URI components before encoding/decoding.",
    AggregateError: "Handle each sub-error individually for better recovery.",
};
/**
 * Compute a numeric severity score for an error.
 *
 * Built-in errors closer to the root of the hierarchy are more severe.
 * Longer messages slightly reduce severity (more information = less panic).
 *
 * @returns Float between 0 and 10.
 */
function severityScore(error) {
    // Deeper prototype chain → less severe
    let depth = 0;
    let proto = Object.getPrototypeOf(error);
    while (proto !== null) {
        depth++;
        proto = Object.getPrototypeOf(proto);
    }
    const baseSeverity = Math.min(10, depth * 1.5 + 0.5);
    // Longer messages carry more information → slightly less severe
    const msg = error.message || "";
    const msgFactor = Math.min(2.0, msg.length / 50);
    return Math.min(10, Math.max(0, baseSeverity - msgFactor));
}
/**
 * Transform a single error into a GoldenSeam.
 *
 * @param error - The error to repair.
 * @returns A GoldenSeam with severity, position, and repair quality.
 */
function goldenRepair(error) {
    const severity = severityScore(error);
    const name = error.constructor.name;
    const message = error.message || "";
    const position = message ? `${name}: ${message}` : `${name} raised`;
    const repairQuality = SUGGESTIONS[name] || "Investigate root cause and add defensive checks.";
    return { severity, position, repairQuality };
}
/**
 * Extract an array of GoldenSeams from an error's stack trace.
 *
 * Each frame in the stack becomes a GoldenSeam. The outermost frame
 * gets the highest severity, decreasing toward the innermost.
 *
 * @param error - The error whose stack to repair.
 * @returns Array of GoldenSeams, one per stack frame.
 */
function repairTraceback(error) {
    const stack = error.stack || "";
    const frames = stack
        .split("\n")
        .slice(1) // Skip the first line (error name + message)
        .map((line) => line.trim())
        .filter((line) => line.startsWith("at ") || line.includes(":"));
    if (frames.length === 0) {
        // No parseable frames — return a single seam for the error itself
        return [goldenRepair(error)];
    }
    const n = frames.length;
    const name = error.constructor.name;
    return frames.map((frame, i) => {
        const positionSeverity = 10 * (1 - i / Math.max(n, 1));
        return {
            severity: Math.round(positionSeverity * 100) / 100,
            position: frame,
            repairQuality: "Review this call site for preconditions.",
        };
    });
}
// ─── FragmentCollection ─────────────────────────────────────────────
/**
 * An ordered group of fragments awaiting reassembly.
 *
 * Collect partial results, sort by confidence, and reassemble with
 * confidence-weighted interpolation to fill gaps.
 */
class FragmentCollection {
    constructor() {
        this.fragments = [];
    }
    /** Number of fragments collected. */
    get length() {
        return this.fragments.length;
    }
    /** Sum of all fragment confidences. */
    get totalConfidence() {
        return this.fragments.reduce((sum, f) => sum + f.confidence, 0);
    }
    /** Mean confidence across fragments. */
    get averageConfidence() {
        return this.totalConfidence / Math.max(this.fragments.length, 1);
    }
    /** Access a fragment by index. */
    at(index) {
        return this.fragments[index];
    }
    /** Iterate over fragments. */
    [Symbol.iterator]() {
        return this.fragments[Symbol.iterator]();
    }
    /**
     * Add a fragment to the collection.
     *
     * @param data - The partial data payload.
     * @param confidence - How trustworthy (0–1).
     * @param offset - Position offset for reassembly.
     */
    add(data, confidence = 1.0, offset = 0) {
        this.fragments.push({ data, confidence, offset });
    }
    /**
     * Sort fragments by confidence (highest first).
     */
    sort() {
        this.fragments.sort((a, b) => b.confidence - a.confidence);
    }
    /**
     * Reassemble fragments into a complete number array.
     *
     * Fragments are laid down by offset. Gaps between fragments are filled
     * using confidence-weighted linear interpolation from neighboring fragments.
     *
     * @returns A flat number array with gaps interpolated.
     */
    reassemble() {
        if (this.fragments.length === 0)
            return [];
        // Lay fragments by offset
        const flat = new Map();
        let maxIdx = 0;
        for (const frag of this.fragments) {
            for (let i = 0; i < frag.data.length; i++) {
                const idx = frag.offset + i;
                const val = frag.data[i];
                if (typeof val === "number") {
                    const existing = flat.get(idx);
                    // Keep higher-confidence value
                    if (!existing || frag.confidence > existing.confidence) {
                        flat.set(idx, { value: val, confidence: frag.confidence });
                    }
                }
                maxIdx = Math.max(maxIdx, idx);
            }
        }
        const result = [];
        for (let i = 0; i <= maxIdx; i++) {
            const entry = flat.get(i);
            if (entry) {
                result.push(entry.value);
            }
            else {
                // Interpolate from nearest known neighbors
                let leftIdx = i - 1;
                while (leftIdx >= 0 && !flat.has(leftIdx))
                    leftIdx--;
                let rightIdx = i + 1;
                while (rightIdx <= maxIdx && !flat.has(rightIdx))
                    rightIdx++;
                const left = leftIdx >= 0 ? flat.get(leftIdx) : null;
                const right = rightIdx <= maxIdx ? flat.get(rightIdx) : null;
                if (left && right) {
                    // Weighted interpolation
                    const t = (i - leftIdx) / (rightIdx - leftIdx);
                    const weight = left.confidence + right.confidence;
                    const lw = left.confidence / weight;
                    const rw = right.confidence / weight;
                    result.push(left.value * lw * (1 - t) + right.value * rw * t + left.value * (1 - lw) * (1 - t) + right.value * (1 - rw) * t);
                    // Simpler: confidence-weighted linear interpolation
                    result[result.length - 1] = left.value * (1 - t) + right.value * t;
                }
                else if (left) {
                    result.push(left.value);
                }
                else if (right) {
                    result.push(right.value);
                }
                else {
                    result.push(0);
                }
            }
        }
        return result;
    }
}
exports.FragmentCollection = FragmentCollection;
// ─── wabiSabi ───────────────────────────────────────────────────────
/**
 * Compute Shannon entropy of an error distribution.
 *
 * @param errors - Array of error type names.
 * @returns Entropy in bits. 0.0 for empty input.
 */
function entropyOfErrors(errors) {
    if (errors.length === 0)
        return 0.0;
    const counts = new Map();
    for (const e of errors) {
        counts.set(e, (counts.get(e) || 0) + 1);
    }
    let entropy = 0.0;
    const total = errors.length;
    for (const count of counts.values()) {
        const p = count / total;
        if (p > 0) {
            entropy -= p * Math.log2(p);
        }
    }
    return entropy;
}
/**
 * Measure how close recovered:lost is to the golden ratio φ ≈ 1.618.
 *
 * @returns Float between 0 and 1, where 1 means perfect golden proportion.
 */
function goldenRatio(recovered, lost) {
    if (lost <= 0) {
        return recovered > 0 ? 1.0 : 0.0;
    }
    const ratio = recovered / lost;
    const distance = Math.abs(ratio - PHI);
    return Math.exp(-distance);
}
/**
 * Compute an aesthetic score for data, where 1.0 is perfect.
 *
 * Based on completeness, uniformity, and absence of null/undefined gaps.
 *
 * @param data - Any data — arrays, objects, strings, numbers.
 * @returns Float between 0 and 1.
 */
function aestheticScore(data) {
    if (data === null || data === undefined)
        return 0.0;
    if (typeof data === "number")
        return 1.0;
    if (typeof data === "string")
        return data.length > 0 ? 1.0 : 0.0;
    if (typeof data === "boolean")
        return 1.0;
    if (Array.isArray(data)) {
        if (data.length === 0)
            return 0.0;
        const filled = data.filter((item) => item !== null && item !== undefined).length;
        const completeness = filled / data.length;
        // Uniformity bonus
        const distinct = new Set(data.filter((i) => i !== null && i !== undefined).map((i) => JSON.stringify(i))).size;
        const uniformity = filled > 0 ? Math.min(1, distinct / filled) : 0;
        return completeness * 0.7 + uniformity * 0.3;
    }
    if (typeof data === "object") {
        const entries = Object.entries(data);
        if (entries.length === 0)
            return 0.0;
        const filled = entries.filter(([, v]) => v !== null && v !== undefined).length;
        return filled / entries.length;
    }
    return 0.5;
}
// ─── cracks ─────────────────────────────────────────────────────────
/**
 * Build a directed CrackGraph from error records.
 *
 * Each record should have `source`, optionally `target`, `weight`.
 */
function buildCrackGraph(errors) {
    const nodes = new Set();
    const edges = new Map();
    const errorCounts = new Map();
    const edgeWeights = new Map();
    const addNode = (name) => nodes.add(name);
    const addEdge = (src, tgt, weight) => {
        addNode(src);
        addNode(tgt);
        const targets = edges.get(src) || [];
        if (!targets.includes(tgt)) {
            targets.push(tgt);
            edges.set(src, targets);
        }
        const key = `${src}→${tgt}`;
        edgeWeights.set(key, (edgeWeights.get(key) || 0) + weight);
    };
    for (const err of errors) {
        const source = err.source || "unknown";
        addNode(source);
        errorCounts.set(source, (errorCounts.get(source) || 0) + 1);
        if (err.target) {
            addEdge(source, err.target, err.weight || 1);
        }
    }
    return {
        nodes: [...nodes],
        edges,
        errorCounts,
        edgeWeights,
    };
}
/** Get all nodes reachable from a component via BFS. */
function downstream(graph, component) {
    const visited = new Set();
    const queue = [...(graph.edges.get(component) || [])];
    while (queue.length > 0) {
        const node = queue.shift();
        if (!visited.has(node)) {
            visited.add(node);
            queue.push(...(graph.edges.get(node) || []));
        }
    }
    return visited;
}
/**
 * Find the golden joints — nodes where repair has highest impact and beauty.
 *
 * Impact = sum of downstream error counts. Beauty = closeness to golden ratio
 * of impact vs. total graph errors.
 *
 * @param graph - The crack graph to analyze.
 * @returns GoldenJoint array sorted by impact (descending).
 */
function findGoldenJoints(graph) {
    const totalErrors = [...graph.errorCounts.values()].reduce((a, b) => a + b, 0) || 1;
    const joints = [];
    for (const node of graph.nodes) {
        const ds = downstream(graph, node);
        let impact = graph.errorCounts.get(node) || 0;
        for (const dn of ds) {
            impact += graph.errorCounts.get(dn) || 0;
        }
        // Beauty: how close impact/total is to golden ratio
        const beauty = goldenRatio(impact, totalErrors);
        joints.push({ node, impact, beauty });
    }
    joints.sort((a, b) => b.impact - a.impact);
    return joints;
}
/**
 * Find the shortest error propagation path between two components (BFS).
 *
 * @returns Array of node names forming the path, or null if no path exists.
 */
function shortestCrackPath(graph, source, target) {
    if (!graph.nodes.includes(source) || !graph.nodes.includes(target))
        return null;
    if (source === target)
        return [source];
    const visited = new Set([source]);
    const queue = [{ node: source, path: [source] }];
    while (queue.length > 0) {
        const { node, path } = queue.shift();
        for (const neighbor of graph.edges.get(node) || []) {
            if (neighbor === target)
                return [...path, neighbor];
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push({ node: neighbor, path: [...path, neighbor] });
            }
        }
    }
    return null;
}
// ─── resilience ─────────────────────────────────────────────────────
/**
 * Run a function multiple times with random fault injection.
 *
 * @param fn - The function to test.
 * @param faultRate - Probability of injecting a fault per iteration (0–1).
 * @returns Object with results array and faultCount.
 */
function injectFaults(fn, faultRate = 0.1) {
    const iterations = 100;
    const results = [];
    let faultCount = 0;
    // Simple seeded-ish pseudo-random for deterministic tests
    const shouldFault = () => Math.random() < faultRate;
    for (let i = 0; i < iterations; i++) {
        if (shouldFault()) {
            faultCount++;
            results.push({ status: "fault", error: new Error("Injected fault") });
        }
        else {
            try {
                const value = fn();
                results.push({ status: "success", value });
            }
            catch (err) {
                faultCount++;
                results.push({ status: "error", error: err });
            }
        }
    }
    return { results, faultCount };
}
/**
 * Test a system's resilience by feeding it faults and measuring recovery.
 *
 * @param system - A callable that receives an error and returns true if recovered.
 * @param faults - Array of errors to throw at the system.
 * @returns A ResilienceReport with recovery statistics.
 */
function measureRecovery(system, faults) {
    const startTime = performance.now();
    let successful = 0;
    let totalRecoveryTime = 0;
    for (const fault of faults) {
        const t0 = performance.now();
        let recovered;
        try {
            recovered = system(fault);
        }
        catch {
            recovered = false;
        }
        const elapsed = performance.now() - t0;
        if (recovered) {
            successful++;
            totalRecoveryTime += elapsed;
        }
    }
    const total = faults.length;
    const recoveryRate = successful / Math.max(total, 1);
    const mttr = totalRecoveryTime / Math.max(successful, 1) / 1000; // seconds
    // Aesthetic quality: blend recovery rate and speed
    const speedScore = Math.max(0, 1 - mttr * 10);
    const aestheticQuality = recoveryRate * 0.7 + speedScore * 0.3;
    return {
        recoveryRate,
        meanTimeToRepair: mttr,
        aestheticQuality,
        totalFaults: total,
        successfulRecoveries: successful,
    };
}
