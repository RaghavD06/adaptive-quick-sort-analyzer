const STRATEGIES = [
  { id: 'first', name: 'First element', short: 'First' },
  { id: 'last', name: 'Last element', short: 'Last' },
  { id: 'random', name: 'Random element', short: 'Random' },
  { id: 'median', name: 'Median of three', short: 'Median' },
  { id: 'adaptive', name: 'Adaptive', short: 'Adaptive' }
];

const swap = (a, i, j, m) => {
  if (i === j) return;
  [a[i], a[j]] = [a[j], a[i]];
  m.swaps++;
};

function makeMetrics() {
  return { comparisons: 0, swaps: 0, partitions: 0, maxDepth: 0, samples: [] };
}

function compare(a, b, m) {
  m.comparisons++;
  return a < b ? -1 : a > b ? 1 : 0;
}

function recordPartition(m, array, lo, hi, pivot, left, right) {
  m.partitions++;
  if (m.samples.length < 6) m.samples.push({
    number: m.partitions, pivot, left, right, range: `${lo}-${hi}`
  });
}

function insertionSort(a, lo, hi, m) {
  for (let i = lo + 1; i <= hi; i++) {
    const value = a[i];
    let j = i - 1;
    while (j >= lo && compare(value, a[j], m) < 0) {
      a[j + 1] = a[j];
      m.swaps++;
      j--;
    }
    a[j + 1] = value;
  }
}

function partition(a, lo, hi, pivotIndex, m) {
  swap(a, pivotIndex, hi, m);
  const pivot = a[hi];
  let store = lo;
  for (let i = lo; i < hi; i++) {
    if (compare(a[i], pivot, m) < 0) {
      swap(a, i, store, m);
      store++;
    }
  }
  swap(a, store, hi, m);
  recordPartition(m, a, lo, hi, pivot, store - lo, hi - store);
  return store;
}

function threeWayPartition(a, lo, hi, pivotIndex, m) {
  const pivot = a[pivotIndex];
  let lt = lo, i = lo, gt = hi;
  while (i <= gt) {
    const c = compare(a[i], pivot, m);
    if (c < 0) swap(a, lt++, i++, m);
    else if (c > 0) swap(a, i, gt--, m);
    else i++;
  }
  recordPartition(m, a, lo, hi, pivot, lt - lo, hi - gt);
  return [lt, gt];
}

function medianIndex(a, lo, hi, m) {
  const mid = lo + Math.floor((hi - lo) / 2);
  const x = a[lo], y = a[mid], z = a[hi];
  if (compare(x, y, m) < 0) return compare(y, z, m) < 0 ? mid : compare(x, z, m) < 0 ? hi : lo;
  return compare(x, z, m) < 0 ? lo : compare(y, z, m) < 0 ? hi : mid;
}

function choosePivot(a, lo, hi, strategy, m) {
  if (strategy === 'first') return lo;
  if (strategy === 'last') return hi;
  if (strategy === 'random') return lo + Math.floor(Math.random() * (hi - lo + 1));
  return medianIndex(a, lo, hi, m);
}

function runQuickSort(input, strategy) {
  const a = input.slice();
  const m = makeMetrics();
  const start = performance.now();
  const stack = [{ lo: 0, hi: a.length - 1, depth: 1 }];
  const useThreeWay = strategy === 'adaptive' && duplicateRatio(a) >= 0.25;
  const adaptivePivot = strategy === 'adaptive'
    ? (isNearlySorted(a) ? 'median' : useThreeWay ? 'random' : 'median')
    : strategy;
  while (stack.length) {
    const item = stack.pop();
    const { lo, hi, depth } = item;
    if (lo >= hi) continue;
    m.maxDepth = Math.max(m.maxDepth, depth);
    if (hi - lo < 12) {
      insertionSort(a, lo, hi, m);
      continue;
    }
    if (useThreeWay) {
      const [lt, gt] = threeWayPartition(a, lo, hi, choosePivot(a, lo, hi, adaptivePivot, m), m);
      if (lt - lo > 1) stack.push({ lo, hi: lt - 1, depth: depth + 1 });
      if (hi - gt > 1) stack.push({ lo: gt + 1, hi, depth: depth + 1 });
    } else {
      const p = partition(a, lo, hi, choosePivot(a, lo, hi, adaptivePivot, m), m);
      if (p - lo > 1) stack.push({ lo, hi: p - 1, depth: depth + 1 });
      if (hi - p > 1) stack.push({ lo: p + 1, hi, depth: depth + 1 });
    }
  }
  return { sorted: a, time: performance.now() - start, ...m, threeWay: useThreeWay };
}

export function duplicateRatio(values) {
  if (!values.length) return 0;
  const counts = new Map();
  values.forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
  return Math.max(...counts.values()) / values.length;
}

export function isNearlySorted(values) {
  if (values.length < 2) return true;
  let ordered = 0;
  for (let i = 1; i < values.length; i++) if (values[i] >= values[i - 1]) ordered++;
  return ordered / (values.length - 1) >= 0.9;
}

export function calculateStatistics(values) {
  if (!values.length) return { size: 0, min: '—', max: '—', unique: 0, sortedness: 100 };
  let sortedPairs = 0;
  for (let i = 1; i < values.length; i++) if (values[i] >= values[i - 1]) sortedPairs++;
  return {
    size: values.length, min: Math.min(...values), max: Math.max(...values),
    unique: new Set(values).size,
    sortedness: Math.round((sortedPairs / Math.max(1, values.length - 1)) * 100)
  };
}

export function generateDataset(type, size) {
  const n = Number(size);
  if (type === 'sorted') return Array.from({ length: n }, (_, i) => i + 1);
  if (type === 'reverse') return Array.from({ length: n }, (_, i) => n - i);
  if (type === 'duplicate') return Array.from({ length: n }, () => Math.floor(Math.random() * Math.max(5, n * 0.04)));
  if (type === 'nearly') {
    const a = Array.from({ length: n }, (_, i) => i + 1);
    const moves = Math.max(1, Math.floor(n * 0.05));
    for (let i = 0; i < moves; i++) swap(a, Math.floor(Math.random() * n), Math.floor(Math.random() * n), { swaps: 0 });
    return a;
  }
  return Array.from({ length: n }, () => Math.floor(Math.random() * n * 10));
}

export function benchmarkAlgorithms(values) {
  return STRATEGIES.map(strategy => ({ ...strategy, ...runQuickSort(values, strategy.id) }));
}

export function verifySorted(values) {
  for (let i = 1; i < values.length; i++) if (values[i - 1] > values[i]) return false;
  return true;
}

export { STRATEGIES };
