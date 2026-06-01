# kintsugi-math

> The mathematics of beautiful error recovery — for JavaScript/TypeScript.

In [kintsugi](https://en.wikipedia.org/wiki/Kintsugi), broken pottery is repaired with gold lacquer, making the cracks beautiful rather than hidden. This library brings that philosophy to software: transform errors into **golden seams**, reassemble **fragmented data**, map **crack propagation** graphs, measure **wabi-sabi** aesthetics, and test **resilience**.

## Install

```bash
npm install kintsugi-math
```

## Quick Start

```typescript
import {
  goldenRepair,
  repairTraceback,
  FragmentCollection,
  entropyOfErrors,
  goldenRatio,
  aestheticScore,
  buildCrackGraph,
  findGoldenJoints,
  shortestCrackPath,
  injectFaults,
  measureRecovery,
} from "kintsugi-math";

// Transform an error into a golden seam
const seam = goldenRepair(new TypeError("not a function"));
console.log(seam.severity);    // number 0-10
console.log(seam.position);    // "TypeError: not a function"
console.log(seam.repairQuality); // "Ensure correct argument types..."

// Reassemble fragmented data
const coll = new FragmentCollection();
coll.add([1, 2, 3], 0.9, 0);
coll.add([7, 8], 0.7, 5);
const whole = coll.reassemble(); // fills gaps with interpolation

// Measure wabi-sabi aesthetics
const entropy = entropyOfErrors(["TypeError", "RangeError", "TypeError"]);
const beauty = goldenRatio(1.618, 1.0); // ≈ 1.0
const score = aestheticScore([1, 2, null, 4]); // 0 < score < 1

// Build crack propagation graphs
const graph = buildCrackGraph([
  { source: "database", target: "api" },
  { source: "api", target: "frontend" },
]);
const joints = findGoldenJoints(graph); // highest-impact repair points
const path = shortestCrackPath(graph, "database", "frontend");

// Test resilience
const { results, faultCount } = injectFaults(() => compute(), 0.2);
const report = measureRecovery(recoverFromError, [err1, err2, err3]);
console.log(report.recoveryRate); // 0-1
```

## API

### Types

- **`GoldenSeam`** — `{ severity, position, repairQuality }` — A repair point extracted from an error.
- **`Fragment`** — `{ data, confidence, offset }` — A piece of partial data.
- **`CrackGraph`** — `{ nodes, edges, errorCounts, edgeWeights }` — Directed error propagation graph.
- **`GoldenJoint`** — `{ node, impact, beauty }` — High-impact repair point in a crack graph.
- **`WabiSabiReport`** — `{ entropy, ratio, score, imperfections, description }` — Imperfection metrics.
- **`ResilienceReport`** — `{ recoveryRate, meanTimeToRepair, aestheticQuality, totalFaults, successfulRecoveries }` — Recovery stats.

### goldenRepair

- `goldenRepair(error)` → `GoldenSeam`
- `repairTraceback(error)` → `GoldenSeam[]`
- `severityScore(error)` → `number` (0–10)

### FragmentCollection

- `new FragmentCollection()`
- `.add(data, confidence, offset)`
- `.sort()` — sort by confidence (descending)
- `.reasemble()` → `number[]` — fills gaps with confidence-weighted interpolation
- `.length`, `.totalConfidence`, `.averageConfidence`

### wabiSabi

- `entropyOfErrors(errors)` → `number` (Shannon entropy in bits)
- `goldenRatio(recovered, lost)` → `number` (0–1, closeness to φ)
- `aestheticScore(data)` → `number` (0–1)

### cracks

- `buildCrackGraph(errors)` → `CrackGraph`
- `findGoldenJoints(graph)` → `GoldenJoint[]`
- `shortestCrackPath(graph, source, target)` → `string[] | null`

### resilience

- `injectFaults(fn, faultRate)` → `{ results, faultCount }`
- `measureRecovery(system, faults)` → `ResilienceReport`

## License

MIT
