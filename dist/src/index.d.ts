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
/** A single repair point extracted from an error. */
export interface GoldenSeam {
    /** Numeric severity (0 = trivial, 10 = catastrophic). */
    severity: number;
    /** Position / context where the crack appeared. */
    position: string;
    /** Recovery quality — the gold in the seam. */
    repairQuality: string;
}
/** A piece of partial data with confidence and offset. */
export interface Fragment {
    /** The partial data payload. */
    data: unknown[];
    /** How trustworthy this fragment is (0–1). */
    confidence: number;
    /** Position offset for reassembly. */
    offset: number;
}
/** Directed graph of error propagation between components. */
export interface CrackGraph {
    /** Set of component names. */
    nodes: string[];
    /** Adjacency list: source → targets. */
    edges: Map<string, string[]>;
    /** Per-node error counts. */
    errorCounts: Map<string, number>;
    /** Edge weights: "source→target" → weight. */
    edgeWeights: Map<string, number>;
}
/** A repair point where intervention has highest impact/beauty. */
export interface GoldenJoint {
    /** The node in the crack graph. */
    node: string;
    /** How many downstream failures this joint prevents. */
    impact: number;
    /** Aesthetic beauty score of repairing here. */
    beauty: number;
}
/** Summary of wabi-sabi imperfection metrics. */
export interface WabiSabiReport {
    /** Shannon entropy of the error distribution. */
    entropy: number;
    /** How close recovered:lost is to the golden ratio φ. */
    ratio: number;
    /** Overall aesthetic score (0–1). */
    score: number;
    /** Number of detected imperfections. */
    imperfections: number;
    /** Human-readable summary. */
    description: string;
}
/** Summary of a system's fault recovery performance. */
export interface ResilienceReport {
    /** Fraction of faults that were recovered (0–1). */
    recoveryRate: number;
    /** Average seconds to recover from a fault. */
    meanTimeToRepair: number;
    /** How beautiful the recovery was (0–1). */
    aestheticQuality: number;
    /** Number of faults injected. */
    totalFaults: number;
    /** Number of faults recovered. */
    successfulRecoveries: number;
}
/**
 * Compute a numeric severity score for an error.
 *
 * Built-in errors closer to the root of the hierarchy are more severe.
 * Longer messages slightly reduce severity (more information = less panic).
 *
 * @returns Float between 0 and 10.
 */
export declare function severityScore(error: Error): number;
/**
 * Transform a single error into a GoldenSeam.
 *
 * @param error - The error to repair.
 * @returns A GoldenSeam with severity, position, and repair quality.
 */
export declare function goldenRepair(error: Error): GoldenSeam;
/**
 * Extract an array of GoldenSeams from an error's stack trace.
 *
 * Each frame in the stack becomes a GoldenSeam. The outermost frame
 * gets the highest severity, decreasing toward the innermost.
 *
 * @param error - The error whose stack to repair.
 * @returns Array of GoldenSeams, one per stack frame.
 */
export declare function repairTraceback(error: Error): GoldenSeam[];
/**
 * An ordered group of fragments awaiting reassembly.
 *
 * Collect partial results, sort by confidence, and reassemble with
 * confidence-weighted interpolation to fill gaps.
 */
export declare class FragmentCollection {
    private fragments;
    /** Number of fragments collected. */
    get length(): number;
    /** Sum of all fragment confidences. */
    get totalConfidence(): number;
    /** Mean confidence across fragments. */
    get averageConfidence(): number;
    /** Access a fragment by index. */
    at(index: number): Fragment | undefined;
    /** Iterate over fragments. */
    [Symbol.iterator](): Iterator<Fragment>;
    /**
     * Add a fragment to the collection.
     *
     * @param data - The partial data payload.
     * @param confidence - How trustworthy (0–1).
     * @param offset - Position offset for reassembly.
     */
    add(data: unknown[], confidence?: number, offset?: number): void;
    /**
     * Sort fragments by confidence (highest first).
     */
    sort(): void;
    /**
     * Reassemble fragments into a complete number array.
     *
     * Fragments are laid down by offset. Gaps between fragments are filled
     * using confidence-weighted linear interpolation from neighboring fragments.
     *
     * @returns A flat number array with gaps interpolated.
     */
    reassemble(): number[];
}
/**
 * Compute Shannon entropy of an error distribution.
 *
 * @param errors - Array of error type names.
 * @returns Entropy in bits. 0.0 for empty input.
 */
export declare function entropyOfErrors(errors: string[]): number;
/**
 * Measure how close recovered:lost is to the golden ratio φ ≈ 1.618.
 *
 * @returns Float between 0 and 1, where 1 means perfect golden proportion.
 */
export declare function goldenRatio(recovered: number, lost: number): number;
/**
 * Compute an aesthetic score for data, where 1.0 is perfect.
 *
 * Based on completeness, uniformity, and absence of null/undefined gaps.
 *
 * @param data - Any data — arrays, objects, strings, numbers.
 * @returns Float between 0 and 1.
 */
export declare function aestheticScore(data: unknown): number;
/**
 * Build a directed CrackGraph from error records.
 *
 * Each record should have `source`, optionally `target`, `weight`.
 */
export declare function buildCrackGraph(errors: Array<{
    source: string;
    target?: string;
    weight?: number;
}>): CrackGraph;
/**
 * Find the golden joints — nodes where repair has highest impact and beauty.
 *
 * Impact = sum of downstream error counts. Beauty = closeness to golden ratio
 * of impact vs. total graph errors.
 *
 * @param graph - The crack graph to analyze.
 * @returns GoldenJoint array sorted by impact (descending).
 */
export declare function findGoldenJoints(graph: CrackGraph): GoldenJoint[];
/**
 * Find the shortest error propagation path between two components (BFS).
 *
 * @returns Array of node names forming the path, or null if no path exists.
 */
export declare function shortestCrackPath(graph: CrackGraph, source: string, target: string): string[] | null;
/**
 * Run a function multiple times with random fault injection.
 *
 * @param fn - The function to test.
 * @param faultRate - Probability of injecting a fault per iteration (0–1).
 * @returns Object with results array and faultCount.
 */
export declare function injectFaults<T>(fn: () => T, faultRate?: number): {
    results: Array<{
        status: string;
        value?: T;
        error?: Error;
    }>;
    faultCount: number;
};
/**
 * Test a system's resilience by feeding it faults and measuring recovery.
 *
 * @param system - A callable that receives an error and returns true if recovered.
 * @param faults - Array of errors to throw at the system.
 * @returns A ResilienceReport with recovery statistics.
 */
export declare function measureRecovery(system: (error: Error) => boolean, faults: Error[]): ResilienceReport;
