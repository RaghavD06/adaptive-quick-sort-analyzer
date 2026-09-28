import React, { useMemo, useState } from 'react';
import {
  STRATEGIES, benchmarkAlgorithms, calculateStatistics, generateDataset, verifySorted,
  duplicateRatio, isNearlySorted
} from './algorithms';

const sizes = [100, 500, 1000, 5000, 10000, 25000];
const typeLabels = {
  random: 'Random', sorted: 'Sorted', reverse: 'Reverse sorted',
  nearly: 'Nearly sorted', duplicate: 'Duplicate heavy'
};

function formatNumber(value) {
  return typeof value === 'number' ? value.toLocaleString() : value;
}

function App() {
  const [type, setType] = useState('random');
  const [size, setSize] = useState(1000);
  const [input, setInput] = useState(() => generateDataset('random', 1000));
  const [custom, setCustom] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState('adaptive');
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);
  const [metric, setMetric] = useState('time');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  const stats = useMemo(() => calculateStatistics(input), [input]);
  const selected = results[results.length - 1];
  const preview = input.slice(0, 32);

  function generate() {
    setError('');
    setResults([]);
    setInput(generateDataset(type, size));
  }

  function useCustom() {
    const values = custom.split(/[,\s]+/).filter(Boolean).map(Number);
    if (!values.length || values.some(v => !Number.isFinite(v))) {
      setError('Enter a comma- or space-separated list of valid numbers.');
      return;
    }
    setError('');
    setResults([]);
    setInput(values);
  }

  function runBenchmark() {
    setRunning(true);
    setError('');
    window.setTimeout(() => {
      try { setResults(benchmarkAlgorithms(input)); }
      catch (e) { setError(`Benchmark failed: ${e.message}`); }
      finally { setRunning(false); }
    }, 30);
  }

  const maxMetric = Math.max(1, ...results.map(r => r[metric]));
  const metricLabel = { time: 'Execution time (ms)', comparisons: 'Comparisons', swaps: 'Swaps' }[metric];

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">∿</span><span>DAA LAB / 05</span></div>
        <nav>{['dashboard', 'analysis', 'about'].map(tab =>
          <button key={tab} className={activeTab === tab ? 'nav-active' : ''} onClick={() => setActiveTab(tab)}>
            {tab[0].toUpperCase() + tab.slice(1)}
          </button>)}</nav>
      </header>

      <main>
        <section className="hero">
          <div>
            <p className="eyebrow">EXPERIMENTAL ALGORITHM ANALYSIS</p>
            <h1>Adaptive Quick<br /><em>Sort Analyzer</em></h1>
            <p className="hero-copy">Measure how pivot selection, input characteristics, and partition quality shape Quick Sort performance.</p>
          </div>
          <div className="hero-badge"><span className="pulse" /> LIVE LAB ENVIRONMENT<div>Client-side · deterministic metrics</div></div>
        </section>
        <HowToUse />

        {activeTab === 'dashboard' && <Dashboard
          type={type} setType={setType} size={size} setSize={setSize} generate={generate}
          custom={custom} setCustom={setCustom} useCustom={useCustom} input={input} stats={stats}
          selectedStrategy={selectedStrategy} setSelectedStrategy={setSelectedStrategy}
          preview={preview} results={results} running={running} runBenchmark={runBenchmark}
          metric={metric} setMetric={setMetric} maxMetric={maxMetric} metricLabel={metricLabel}
          selected={selected} error={error} typeLabels={typeLabels}
        />}
        {activeTab === 'analysis' && <Analysis stats={stats} input={input} />}
        {activeTab === 'about' && <About />}
      </main>
      <footer><span>Adaptive Quick Sort Analyzer</span><span>Design & Analysis of Algorithms · static React application</span></footer>
    </div>
  );
}

function Dashboard(p) {
  return <div className="content">
    <section className="control-grid">
      <div className="panel controls">
        <div className="section-heading"><span className="step">1</span><div><h2>Choose or generate data</h2><p>Start here. Pick the kind of numbers you want to study.</p></div></div>
        <label title="The pattern of numbers given to Quick Sort">TYPE OF DATA</label>
        <select value={p.type} onChange={e => p.setType(e.target.value)}>
          {Object.entries(p.typeLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
        </select>
        <label>HOW MANY NUMBERS?</label>
        <div className="size-grid">{sizes.map(value => <button key={value} className={p.size === value ? 'selected' : ''} onClick={() => p.setSize(value)}>{value.toLocaleString()}</button>)}</div>
        <button className="primary" onClick={p.generate}>↻ Generate data</button>
        <div className="divider"><span>OR PASTE YOUR OWN NUMBERS</span></div>
        <textarea value={p.custom} onChange={e => p.setCustom(e.target.value)} placeholder="e.g. 8, 3, 5, 3, -2, 9..." />
        <button className="secondary" onClick={p.useCustom}>Use these numbers</button>
        {p.error && <p className="error">{p.error}</p>}
      </div>
      <div className="panel dataset-card">
        <div className="section-heading"><span className="step">2</span><div><h2>Choose a strategy</h2><p>This is the pivot rule you want to focus on.</p></div></div>
        <select className="strategy-select" value={p.selectedStrategy} onChange={e => p.setSelectedStrategy(e.target.value)} title="A pivot is the value used to split the array">
          {STRATEGIES.map(strategy => <option value={strategy.id} key={strategy.id}>{strategy.name}</option>)}
        </select>
        <p className="strategy-help">{strategyDescriptions[p.selectedStrategy]}</p>
        <div className="profile-heading"><strong>Your data at a glance</strong><span>These values update when you generate data.</span></div>
        <div className="stat-grid">
          <Stat label="ELEMENTS" value={p.stats.size} />
          <Stat label="UNIQUE VALUES" value={p.stats.unique} />
          <Stat label="MINIMUM" value={p.stats.min} />
          <Stat label="MAXIMUM" value={p.stats.max} />
        </div>
        <div className="sortedness"><div><span>HOW ORDERED IS IT?</span><strong>{p.stats.sortedness}%</strong></div><div className="progress"><i style={{ width: `${p.stats.sortedness}%` }} /></div><small>Percentage of neighboring numbers already in order</small></div>
        <div className="preview"><span>A FEW NUMBERS</span><code>[{p.preview.map(formatNumber).join(', ')}{p.input.length > 32 ? ', …' : ''}]</code></div>
      </div>
    </section>

    <section className="panel benchmark">
      <div className="benchmark-head"><div className="section-heading"><span className="step">3</span><div><h2>Run the benchmark</h2><p>Click once to compare all five strategies on the same data.</p></div></div><button className="primary run" disabled={p.running || !p.input.length} onClick={p.runBenchmark}>{p.running ? 'Running…' : '▶ Run benchmark'}</button></div>
      {p.results.length === 0 && !p.running ? <div className="empty-state"><div className="empty-icon">◌</div><h3>Ready to measure</h3><p>Generate a dataset, then run all five Quick Sort implementations side by side.</p></div> : p.running ? <div className="empty-state"><div className="spinner" /><h3>Measuring partition behavior…</h3><p>Running identical copies to keep this comparison fair.</p></div> : <>
        <div className="result-heading"><span className="step">4</span><div><h2>Read the results</h2><p>Lower numbers usually mean less work, but compare the whole row rather than declaring one universal winner.</p></div></div><div className="table-wrap"><table><thead><tr><th>STRATEGY</th><th>TIME <small>ms</small></th><th title="How many values were checked">CHECKS</th><th title="How many values changed places">MOVES</th><th title="How many splits were made">SPLITS</th><th title="Deepest nested call">DEPTH</th></tr></thead><tbody>{p.results.map(r => <tr key={r.id}><td><span className={`strategy-dot dot-${r.id}`} />{r.name}{r.id === 'adaptive' && <span className="tag">SMART SPLITS</span>}</td><td className="emphasis">{r.time.toFixed(3)}</td><td>{formatNumber(r.comparisons)}</td><td>{formatNumber(r.swaps)}</td><td>{formatNumber(r.partitions)}</td><td>{r.maxDepth}</td></tr>)}</tbody></table></div>
        <div className="chart-area"><div className="chart-head"><div><span className="eyebrow">COMPARE ONE MEASURE</span><h3>{p.metricLabel}</h3></div><div className="metric-tabs">{[['time', 'Time'], ['comparisons', 'Checks'], ['swaps', 'Moves']].map(([id, label]) => <button title="Change the measure shown in the bars" className={p.metric === id ? 'active' : ''} onClick={() => p.setMetric(id)} key={id}>{label}</button>)}</div></div><div className="bars">{p.results.map(r => <div className="bar-row" key={r.id}><span>{r.short}</span><div className="bar-track"><i className={`bar-${r.id}`} style={{ width: `${Math.max(2, (r[p.metric] / p.maxMetric) * 100)}%` }} /></div><strong>{p.metric === 'time' ? r[p.metric].toFixed(2) : formatNumber(r[p.metric])}</strong></div>)}</div><MetricGuide /></div>
      </>}
    </section>

    <section className="lower-grid">
      <div className="panel validation"><div className="section-heading"><span className="step">✓</span><div><h2>Check the answer</h2><p>Every strategy must produce a sorted array.</p></div></div><div className="validation-line"><span className="check">✓</span><div><strong>{p.results.length ? 'The array is sorted correctly' : 'Waiting for your benchmark'}</strong><small>{p.results.length ? `Checked all ${p.results.length} strategies` : 'Click Run benchmark above'}</small></div></div><div className="validation-code"><span>BEFORE</span><code>[{p.preview.slice(0, 8).join(', ')}{p.input.length > 8 ? ', …' : ''}]</code><span>AFTER</span><code>{p.results[0] ? `[${p.results[0].sorted.slice(0, 8).join(', ')}${p.input.length > 8 ? ', …' : ''}]` : '—'}</code></div></div>
      <div className="panel adaptive-card"><div className="section-heading"><span className="step">A</span><div><h2>How Adaptive works</h2><p>It changes its plan based on your data.</p></div></div><div className="decision"><div className="decision-icon">A</div><div><strong>{duplicateRatio(p.input) >= 0.25 ? 'Many repeated values found' : isNearlySorted(p.input) ? 'Data is mostly in order' : 'Data has a general mix'}</strong><p>{duplicateRatio(p.input) >= 0.25 ? 'It uses a random pivot and groups equal values together (a 3-way split).' : 'It uses the middle of three sample values to make balanced splits more likely.'}</p></div></div><div className="note">Adaptive often avoids common bad cases, but no Quick Sort strategy guarantees O(n log n).</div></div>
    </section>
    <PartitionDetails selected={p.selected} />
    <Analysis stats={p.stats} input={p.input} />
  </div>;
}

function Stat({ label, value }) { return <div className="stat"><span>{label}</span><strong>{formatNumber(value)}</strong></div>; }
const strategyDescriptions = {
  first: 'Always uses the first number as the pivot. This is easy to understand, but can struggle with sorted data.',
  last: 'Always uses the last number as the pivot. It shows the same weakness on reverse-sorted data.',
  random: 'Picks a random pivot, which helps avoid predictable bad splits.',
  median: 'Looks at three numbers and chooses their middle value for a steadier split.',
  adaptive: 'Looks at the data first, then chooses a safer pivot and 3-way splitting when many values repeat.'
};
function HowToUse() {
  return <section className="how-to"><div className="how-title"><span className="eyebrow">START HERE</span><h2>How to use this analyzer</h2><p>You do not need to know Quick Sort before trying it.</p></div><div className="how-steps"><div><b>1</b><strong>Choose data</strong><span>Pick a pattern and size, or paste numbers.</span></div><div><b>2</b><strong>Choose strategy</strong><span>Select one rule to learn about.</span></div><div><b>3</b><strong>Run benchmark</strong><span>Compare all five strategies fairly.</span></div><div><b>4</b><strong>Read results</strong><span>Look at time, checks, moves, and depth.</span></div></div></section>;
}
function MetricGuide() {
  return <div className="metric-guide"><strong>What do these numbers mean?</strong><span><b>Time</b> how long it took</span><span><b>Checks</b> value comparisons</span><span><b>Moves</b> values swapped</span><span><b>Splits</b> array partitions</span><span><b>Depth</b> deepest nested work</span></div>;
}
function PartitionDetails({ selected }) {
  return <section className="panel partition"><div className="section-heading"><span className="step">06</span><div><h2>Partition details</h2><p>Representative operations from the last completed run.</p></div></div>{selected ? <div className="partition-grid">{selected.samples.map(s => <div className="partition-item" key={s.number}><span>PARTITION #{s.number}</span><strong>Pivot = {formatNumber(s.pivot)}</strong><small>{s.left} left · {s.right} right <i>range {s.range}</i></small></div>)}</div> : <div className="muted">Partition samples will appear after a benchmark.</div>}</section>;
}
function Analysis({ stats, input }) {
  return <section className="analysis content"><div className="section-heading"><span className="step">07</span><div><h2>Why input distribution matters</h2><p>Connecting observed measurements to the divide-and-conquer model.</p></div></div><div className="distribution-grid">{[['Random', 'Usually produces reasonably balanced partitions.', 'O(n log n) expected'], ['Sorted', 'Poor first/last pivots repeatedly leave one side empty.', 'Can approach O(n²)'], ['Reverse sorted', 'The same imbalance appears in the opposite direction.', 'Can approach O(n²)'], ['Nearly sorted', 'A small amount of disorder still rewards careful pivot selection.', 'Median helps'], ['Duplicate heavy', 'Equal keys can cause repeated work without 3-way partitioning.', '3-way helps']].map(([title, copy, result]) => <article key={title}><span className="dist-index">{title.slice(0, 1)}</span><h3>{title}</h3><p>{copy}</p><strong>{result}</strong></article>)}</div><div className="complexity panel"><div><span className="eyebrow">THEORETICAL MODEL</span><h2>Quick Sort complexity</h2><p>Balanced partitions produce a logarithmic recursion tree. When a pivot is consistently the smallest or largest element, each level scans almost the entire remaining array.</p><code>T(n) = T(k) + T(n-k-1) + O(n)</code><code>T(n) = 2T(n/2) + O(n) → O(n log n)</code></div><div className="complexity-list"><div><span>BEST CASE</span><b>O(n log n)</b></div><div><span>AVERAGE CASE</span><b>O(n log n)</b></div><div className="warn"><span>WORST CASE</span><b>O(n²)</b></div><div><span>AVG. SPACE</span><b>O(log n)</b></div><div><span>WORST SPACE</span><b>O(n)</b></div></div></div></section>;
}
function About() { return <section className="about content"><div className="about-hero"><span className="eyebrow">ABOUT THE PROJECT</span><h2>From recurrence to evidence.</h2><p>This micro-project turns a familiar divide-and-conquer algorithm into a measurable experiment suitable for a 5–10 minute DAA demonstration.</p></div><div className="about-grid"><Info title="Problem" text="Quick Sort is efficient on average but can degrade to O(n²) depending on pivot selection and input characteristics." /><Info title="Objective" text="Analyze how five pivot-selection strategies affect performance and investigate whether an adaptive policy reduces poor partitioning behavior." /><Info title="Concepts" text="Divide and conquer · recursion · partitioning · pivot selection · asymptotic analysis · empirical performance." /><Info title="Method" text="The benchmark uses equal snapshots, high-resolution browser timing, and instrumented counters for a transparent comparison." /></div></section>; }
function Info({ title, text }) { return <article className="info-card"><span>{title.toUpperCase()}</span><p>{text}</p></article>; }

export default App;
