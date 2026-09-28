# Adaptive Quick Sort Analyzer

An interactive DAA micro-project that experimentally compares five real Quick Sort pivot strategies against different input distributions.

## Problem and objective

Quick Sort is usually fast, but deterministic pivots can create extremely unbalanced partitions on ordered input. This analyzer measures how pivot selection changes execution time, comparisons, swaps, partitions, and recursion depth, then tests an adaptive strategy that detects nearly sorted and duplicate-heavy data.

## Features

- Random, sorted, reverse sorted, nearly sorted, duplicate-heavy, and custom datasets.
- First-element, last-element, random, median-of-three, and adaptive Quick Sort.
- Fair benchmark: every strategy receives an identical copy of the original array.
- High-resolution timing, correctness verification, partition samples, charts, and dataset statistics.
- Responsive academic dashboard with complexity and input-distribution analysis.

## Adaptive strategy

The adaptive implementation inspects sortedness and duplicate concentration. It uses median-of-three pivots for generally distributed or nearly sorted data and switches to randomized pivots with Dutch-national-flag 3-way partitioning when duplicates are prominent. This reduces common pathological partitions but does not change Quick Sort's theoretical worst case.

## Complexity

Best and average time are `O(n log n)`; worst case is `O(n²)` when partitions repeatedly contain almost all elements on one side. Average auxiliary recursion space is `O(log n)` and worst case is `O(n)`. The recurrence is `T(n) = T(k) + T(n-k-1) + O(n)`, becoming `2T(n/2) + O(n)` for balanced partitions.

## Methodology and interpretation

The benchmark sorts equal snapshots of one dataset. Results are empirical and machine/browser dependent; no strategy is declared a universal winner. Use the input analysis cards to connect measured behavior to the asymptotic model.

## Tech stack and structure

React, Vite, JavaScript, and plain CSS. `src/algorithms.js` contains generation, statistics, five sorting strategies, metrics, and validation. `src/App.jsx` contains the dashboard and controls.

## Run locally

```bash
npm install
npm run dev
```

Build a production bundle with `npm run build`, then serve `dist/` from any static host (Vercel, GitHub Pages, Netlify, or a university server).

## Future improvements

Worker-based benchmarking, downloadable CSV reports, confidence intervals across repeated runs, and optional partition playback for small arrays.
