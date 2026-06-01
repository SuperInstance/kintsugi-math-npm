# kintsugi-math

> The mathematics of beautiful error recovery for JavaScript — golden seams, fragment reassembly, and aesthetic fault tolerance.

## What This Does

`kintsugi-math` brings the Japanese art of kintsugi to JavaScript: transform errors into structured recovery objects ("golden seams"), reassemble fragmented partial data, model crack propagation in dependency graphs, measure resilience, and compute aesthetic scores for error recovery. Use it for graceful degradation in web apps, resilience testing, or building fault-tolerant systems.

## The Cultural Root

See the Python version (`kintsugi-math` on PyPI) for the full cultural background. Kintsugi teaches that breakage is part of an object's history — repairs should be beautiful, not hidden.

## Install

```bash
npm install kintsugi-math
```

## Quick Start

```typescript
import {
  GoldenSeam, repairError,
  FragmentCollection, reassemble,
  CrackGraph, measureResilience,
  wabiSabiEntropy, aestheticScore, goldenRatio,
  WabiSabiReport,
} from "kintsugi-math";

// Transform errors into golden seams
try {
  riskyOperation();
} catch (e) {
  const seam = repairError(e);
  console.log(seam.severity, seam.suggestion);
}

// Reassemble fragments
const fc = new FragmentCollection();
fc.add({ data: [1, 2], confidence: 0.9, offset: 0 });
fc.add({ data: [3, 4], confidence: 0.7, offset: 2 });
fc.add({ data: [5], confidence: 0.3, offset: 4 });
const result = reassemble(fc, 5);

// Wabi-sabi aesthetics
const entropy = wabiSabiEntropy(["ValueError", "TypeError", "ValueError"]);
const score = aestheticScore([1, 2, 3, null, 5]);
const ratio = goldenRatio(8, 5);

// Crack propagation
const graph = new CrackGraph();
graph.addCrack("db", "api", 0.8);
graph.addCrack("api", "ui", 0.6);
const resilience = measureResilience(graph);
```

## API Reference

### Golden Seams
- `GoldenSeam { severity, position, repairQuality }`
- `repairError(error: unknown) → GoldenSeam`
- `severityScore(error: unknown) → number`

### Fragments
- `FragmentCollection` — `add()`, `sorted()`, `size`
- `reassemble(collection, targetLength) → number[]`

### Wabi-Sabi
- `wabiSabiEntropy(errors: string[]) → number` — Shannon entropy
- `goldenRatio(recovered, lost) → number` — Closeness to φ
- `aestheticScore(data: unknown) → number` — 0–1 beauty score
- `WabiSabiReport { entropy, ratio, score, imperfections }`

### Crack Propagation
- `CrackGraph` — `addCrack()`, `propagateFrom()`, `measureResilience()`

### Resilience
- `measureResilience(graph, joints) → number`

## How It Works

Same algorithms as the Python version. Golden seams extract metadata from errors. Fragment reassembly uses confidence-weighted interpolation. Wabi-sabi metrics combine Shannon entropy, golden ratio proximity, and completeness scoring.

## License

MIT
