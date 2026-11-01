import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Copy,
  Database,
  Download,
  Expand,
  ExternalLink,
  GitBranch,
  Gauge,
  Layers3,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  Upload,
  Users,
  Wallet,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import { ReactFlowProvider } from "@xyflow/react";
import { DEFAULTS, STAGES, PROFILES, SCENARIOS, TOURS } from "./catalog.js";
import { Simulation, normalizeConfig } from "./engine.js";
import { $, timeLabel, readInitial, download } from "./utils.js";
import {
  Icon,
  Slider,
  Toggle,
  Metric,
  Chart,
  Modal,
} from "./components/ui.jsx";
import Graph from "./components/Graph.jsx";
import Inspector from "./components/Inspector.jsx";
import Economics from "./views/Economics.jsx";
import Traces from "./views/Traces.jsx";
import Capacity from "./views/Capacity.jsx";
import Inspect from "./views/Inspect.jsx";
import Blueprint from "./views/Blueprint.jsx";
export default function App() {
  const [initial] = useState(readInitial);
  const engine = useRef(null);
  if (!engine.current) engine.current = new Simulation(initial, 900);
  const [snap, setSnap] = useState(() => engine.current.snapshot());
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(30);
  const [selected, setSelected] = useState("tts");
  const [view, setView] = useState("architecture");
  const [lens, setLens] = useState("queue");
  const [scenario, setScenario] = useState("baseline");
  const [fullscreen, setFullscreen] = useState(false);
  const [modal, setModal] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const [tour, setTour] = useState(null);
  const [toast, setToast] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [controls, setControls] = useState("workload");
  const [mobileControls, setMobileControls] = useState(false);
  const [showInspector, setShowInspector] = useState(false);
  const importRef = useRef();
  const notify = useCallback((message) => setToast(message), []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      engine.current.advance(speed);
      setSnap(engine.current.snapshot());
    }, 1000);
    return () => clearInterval(t);
  }, [running, speed]);
  const configure = useCallback((patch) => {
    engine.current.configure(patch);
    const s = engine.current.snapshot();
    setSnap(s);
    try {
      localStorage.setItem(
        "hassan-uriostegui-observatory-config",
        JSON.stringify(s.config),
      );
    } catch {}
  }, []);
  const reset = (config = snap.config) => {
    engine.current = new Simulation(config);
    setSnap(engine.current.snapshot());
    notify("New run · counters and queues reset");
  };
  const loadScenario = (id) => {
    const s = SCENARIOS.find((s) => s.id === id);
    setScenario(id);
    configure(s.patch);
    setRunning(true);
    notify(`${s.name} applied to the live run`);
  };
  const selectStage = (id) => {
    setSelected(id);
    setShowInspector(true);
  };
  const exportRun = () =>
    download(
      "hassan-uriostegui-simulation.json",
      JSON.stringify(
        {
          schema: 1,
          config: snap.config,
          elapsed: snap.time,
          metrics: snap.metrics,
          costs: snap.costs,
          acceptedMinutes: snap.accepted,
          events: snap.events,
        },
        null,
        2,
      ),
    );
  const share = async () => {
    const url = new URL(location.href);
    url.hash = "run=" + btoa(encodeURIComponent(JSON.stringify(snap.config)));
    try {
      await navigator.clipboard.writeText(url.href);
      notify("Scenario link copied · opens with a fresh warm-up run");
    } catch {
      download("scenario-link.txt", url.href, "text/plain");
      notify("Scenario link downloaded");
    }
  };
  const importConfig = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      if (file.size > 1000000) throw Error("File exceeds 1 MB");
      const data = JSON.parse(await file.text());
      if (!data.config || typeof data.config !== "object")
        throw Error("Expected a simulation export with config");
      const c = normalizeConfig(data.config);
      reset(c);
      configure(c);
      notify("Scenario imported · new seeded run");
    } catch (err) {
      notify("Import failed: " + err.message);
    }
    e.target.value = "";
  };
  const m = snap.metrics;
  const scenarioData = SCENARIOS.find((s) => s.id === scenario);
  const bottleneck = STAGES.find(
    (n) =>
      n.id === m.bottleneck &&
      (snap.stages[n.id].age > 2 || snap.stages[n.id].queue > 8),
  );
  const delta = (field, unit, d = 0) =>
    baseline && m[field] != null && baseline.metrics[field] != null
      ? `${m[field] >= baseline.metrics[field] ? "+" : ""}${$(m[field] - baseline.metrics[field], d)}${unit} vs checkpoint`
      : null;
  return (
    <div className={`app executive ${fullscreen ? "focus-mode" : ""}`}>
      <header className="topbar">
        <a
          className="wordmark"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setView("architecture");
          }}
        >
          <span className="brand-symbol">
            <i />
            <i />
            <i />
          </span>
          Hassan Uriostegui<span className="brand-slash">/</span>
          <span className="brand-product">Architecture Lab</span>
        </a>
        <div className="top-right">
          <span className="simulation-badge">
            <span /> REFERENCE MODEL
          </span>
          <button
            className="quiet-button"
            onClick={() => {
              setTour(0);
              setView("architecture");
              selectStage(TOURS[0].stage);
            }}
          >
            <Play size={13} />
            Walkthrough
          </button>
          <button
            className="icon-button"
            onClick={() => setModal("model")}
            aria-label="Model notes"
          >
            <CircleHelp size={17} />
          </button>
          <button
            className="export-button"
            aria-label="Export run"
            onClick={exportRun}
          >
            <Download size={14} />
            <span>Export run</span>
          </button>
        </div>
      </header>
      <div className="body-layout">
        <aside className={`sidebar ${mobileControls ? "mobile-open" : ""}`}>
          <div className="sidebar-title">
            <span>MODEL CONFIGURATION</span>
            <button
              className="icon-button"
              aria-label="Close model inputs"
              onClick={() => setMobileControls(false)}
            >
              <X size={16} />
            </button>
          </div>
          <section className="scenario-picker">
            <label htmlFor="scenario">Scenario</label>
            <div className="select-wrap">
              <select
                id="scenario"
                value={scenario}
                onChange={(e) => loadScenario(e.target.value)}
              >
                {SCENARIOS.map((s) => (
                  <option value={s.id} key={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} />
            </div>
            <p>{scenarioData.description}</p>
          </section>
          <div className="control-tabs">
            {["workload", "capacity", "policy"].map((t) => (
              <button
                key={t}
                className={controls === t ? "active" : ""}
                onClick={() => setControls(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="control-content">
            {controls === "workload" ? (
              <>
                <div className="section-label">
                  <Layers3 size={13} /> INPUT & FAN-OUT
                </div>
                <Slider
                  label="Source catalog"
                  value={snap.config.arrival}
                  min={0}
                  max={4800}
                  step={60}
                  suffix="h/day"
                  onChange={(v) => configure({ arrival: v })}
                />
                <Slider
                  label="Source duration"
                  value={snap.config.sourceMinutes}
                  min={1}
                  max={30}
                  suffix="min"
                  onChange={(v) => configure({ sourceMinutes: v })}
                />
                <Slider
                  label="Target languages"
                  value={snap.config.languages}
                  min={1}
                  max={12}
                  onChange={(v) => configure({ languages: v })}
                />
                <Slider
                  label="Clip extraction"
                  value={snap.config.clipRatio}
                  min={5}
                  max={100}
                  step={5}
                  suffix="%"
                  onChange={(v) => configure({ clipRatio: v })}
                />
                <div className="derived-box">
                  <span>Potential output demand</span>
                  <strong>
                    {$(
                      ((((snap.config.arrival * 60) / 24) *
                        snap.config.clipRatio) /
                        100) *
                        snap.config.languages,
                    )}
                    <small>min / hour</small>
                  </strong>
                  <span>Before quality rejection and rights holds</span>
                </div>
                <div className="section-label">
                  <Database size={13} /> REUSE
                </div>
                <Slider
                  label="Analysis cache hit rate"
                  value={snap.config.cache}
                  min={0}
                  max={90}
                  step={5}
                  suffix="%"
                  onChange={(v) => configure({ cache: v })}
                />
                <p className="control-footnote">
                  Cache keys include tenant, content hash, transform and model
                  versions.
                </p>
              </>
            ) : controls === "capacity" ? (
              <>
                <div className="section-label">
                  <Gauge size={13} /> RESOURCE POOLS
                </div>
                <Slider
                  label="Speech GPU slots"
                  value={snap.config.gpu}
                  min={1}
                  max={24}
                  onChange={(v) => configure({ gpu: v })}
                />
                <Slider
                  label="CPU slots per stage"
                  value={snap.config.cpu}
                  min={1}
                  max={24}
                  onChange={(v) => configure({ cpu: v })}
                />
                <Slider
                  label="Human reviewers"
                  value={snap.config.reviewers}
                  min={0}
                  max={16}
                  onChange={(v) => configure({ reviewers: v })}
                />
                <Toggle
                  label="Speech autoscaling"
                  hint="60s warm-up · max 3× or 24 slots"
                  value={snap.config.autoscale}
                  onChange={(v) => configure({ autoscale: v })}
                />
                <div className="derived-box">
                  <span>Provisioned speech capacity</span>
                  <strong>
                    {snap.scaledGpu}
                    <small>active slots</small>
                  </strong>
                  <span>
                    {snap.scaleAt
                      ? `Warming up · ${snap.scaleAt - snap.time}s remaining`
                      : "ASR and vision each have 2 dedicated slots"}
                  </span>
                </div>
                <div className="section-label">
                  <Zap size={13} /> DEPENDENCY FAILURE
                </div>
                <Toggle
                  label="Primary speech outage"
                  hint="In-flight primary attempts may fail"
                  value={snap.config.outage}
                  onChange={(v) => configure({ outage: v })}
                />
                <Toggle
                  label="Approved fallback"
                  hint="Higher cost · slower service time"
                  value={snap.config.fallback}
                  onChange={(v) => configure({ fallback: v })}
                />
                <Slider
                  label="Retry budget"
                  value={snap.config.retries}
                  min={0}
                  max={4}
                  onChange={(v) => configure({ retries: v })}
                />
              </>
            ) : (
              <>
                <div className="section-label">
                  <Sparkles size={13} /> MODEL & QUALITY
                </div>
                <label className="select-label">
                  Speech model profile
                  <select
                    aria-label="Speech model profile"
                    value={snap.config.model}
                    onChange={(e) => configure({ model: e.target.value })}
                  >
                    {Object.entries(PROFILES).map(([id, p]) => (
                      <option value={id} key={id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="model-facts">
                  <span>
                    Variable fee <b>${PROFILES[snap.config.model].cost}/min</b>
                  </span>
                  <span>
                    Assumed RTF{" "}
                    <b>{PROFILES[snap.config.model].rtf.toFixed(2)}</b>
                  </span>
                </div>
                <Slider
                  label="Acceptance threshold"
                  value={snap.config.quality}
                  min={50}
                  max={99}
                  onChange={(v) => configure({ quality: v })}
                />
                <Slider
                  label="Delivery deadline"
                  value={snap.config.slo}
                  min={1}
                  max={60}
                  suffix="min"
                  onChange={(v) => configure({ slo: v })}
                />
                <div className="section-label">
                  <ShieldCheck size={13} /> RIGHTS ENFORCEMENT
                </div>
                <Toggle
                  label="Revoke license cohort"
                  hint="Affects 20% of asset identities"
                  value={snap.config.revoked}
                  onChange={(v) => configure({ revoked: v })}
                />
                <p className="control-footnote">
                  Rechecked at admission and delivery. Previously delivered
                  content requires a separate takedown workflow.
                </p>
              </>
            )}
          </div>
          <div className="sidebar-bottom">
            <button
              onClick={() => {
                setBaseline(snap);
                notify("Checkpoint captured · compare in Economics");
              }}
            >
              <Copy size={14} />
              Save comparison checkpoint
            </button>
            <button onClick={share}>
              <ExternalLink size={14} />
              Copy scenario link
            </button>
            <button onClick={() => importRef.current.click()}>
              <Upload size={14} />
              Import scenario
            </button>
            <input
              ref={importRef}
              hidden
              type="file"
              accept=".json,application/json"
              onChange={importConfig}
            />
            <div className="seed">
              <span className="status-dot green" />
              Deterministic engine <span>seed {snap.config.seed}</span>
            </div>
          </div>
        </aside>
        <main className="main">
          <div className="page-heading">
            <div>
              <div className="breadcrumb">
                PLATFORM ENGINEERING <ChevronRight size={10} /> ARCHITECTURE
                REVIEW
              </div>
              <h1>Media transformation platform</h1>
              <p>
                Catalog-scale orchestration, capacity planning and model
                economics.
              </p>
            </div>
            <div className="heading-actions">
              <button
                className="small-outline"
                onClick={() => setMobileControls(!mobileControls)}
              >
                <SlidersHorizontal size={15} />
                Model inputs
              </button>
              <button
                className="small-outline"
                onClick={() => setModal("scenarios")}
              >
                <Layers3 size={15} />
                Scenario analysis
              </button>
            </div>
          </div>
          <div className="metrics-grid">
            <Metric
              label="ACCEPTED THROUGHPUT"
              value={$(m.throughput)}
              unit="min/h"
              note="Trailing 5 simulated minutes"
              values={snap.history.map((h) => h.throughput)}
              delta={delta("throughput", " min/h")}
            />
            <Metric
              label="OBSERVED P95"
              value={$(m.p95, 1)}
              unit="min"
              note="Completed outputs only"
              values={snap.history.map((h) => h.p95 || 0)}
              accent={m.p95 > snap.config.slo ? "warning" : ""}
              delta={delta("p95", " min", 1)}
            />
            <Metric
              label="COST / ACCEPTED MIN"
              value={m.unitCost == null ? "—" : "$" + $(m.unitCost, 3)}
              note="All modeled spend / accepted min"
              values={snap.history.map((h) => h.cost || 0)}
              delta={delta("unitCost", " USD", 3)}
            />
            <Metric
              label="PENDING WORK"
              value={$(m.queue)}
              unit="tasks"
              note={`Oldest wait ${$(m.age, 1)} min`}
              values={snap.history.map((h) => h.queue)}
              accent={m.age > snap.config.slo ? "warning" : ""}
            />
            <Metric
              label="DEADLINE ATTAINMENT"
              value={$(m.attainment, 1)}
              unit="%"
              note="Delivered outputs · trailing 1h"
              values={[]}
              accent={
                m.attainment != null && m.attainment < 95 ? "warning" : ""
              }
            />
          </div>
          <div className="decision-brief">
            <div className="brief-scenario">
              <span className="eyebrow">OPERATING SCENARIO</span>
              <select
                aria-label="Operating scenario"
                value={scenario}
                onChange={(e) => loadScenario(e.target.value)}
              >
                {SCENARIOS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <p>
                Parameters change the live model. Reset for an isolated run.
              </p>
            </div>
            <div>
              <span className="eyebrow">CURRENT CONSTRAINT</span>
              <strong>
                {snap.config.outage && !snap.config.fallback
                  ? "Speech dependency unavailable"
                  : m.age > 2 && bottleneck
                    ? bottleneck.name
                    : "Within operating capacity"}
              </strong>
              <p>
                {m.age > 2
                  ? `${$(m.age, 1)} min oldest wait. Completed-only p95 can hide stalled work.`
                  : "Inspect offered load before admitting the next catalog."}
              </p>
            </div>
            <div>
              <span className="eyebrow">DECISION TO TEST</span>
              <strong>
                {scenario === "outage"
                  ? "Restore delivery with fallback"
                  : scenario === "cheap"
                    ? "Evaluate cost after quality control"
                    : scenario === "rights"
                      ? "Enforce authorization at each boundary"
                      : scenario === "global"
                        ? "Size the localization fan-out"
                        : "Identify the next capacity boundary"}
              </strong>
              <button
                onClick={() =>
                  setView(
                    scenario === "cheap"
                      ? "economics"
                      : scenario === "rights"
                        ? "decisions"
                        : "capacity",
                  )
                }
              >
                Review the tradeoff
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
          <div className="workspace">
            <div className="workspace-toolbar">
              <div className="view-tabs">
                {[
                  ["architecture", Workflow, "System architecture"],
                  ["capacity", Gauge, "Capacity planning"],
                  ["economics", Wallet, "Model economics"],
                  ["traces", GitBranch, "Execution traces"],
                  ["decisions", BookOpen, "Design rationale"],
                  ["review", Users, "Inspect · 50"],
                ].map(([id, C, label]) => (
                  <button
                    key={id}
                    className={view === id ? "active" : ""}
                    onClick={() => setView(id)}
                  >
                    <C size={14} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
              <div className="run-controls">
                <span className="sim-clock">
                  <span className={`status-dot ${running ? "green" : ""}`} />
                  {timeLabel(snap.time)}
                </span>
                <select
                  aria-label="Simulation speed"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                >
                  <option value={1}>1×</option>
                  <option value={10}>10×</option>
                  <option value={30}>30×</option>
                  <option value={60}>60×</option>
                  <option value={300}>300×</option>
                </select>
                <button
                  className="icon-button"
                  title="Reset run"
                  aria-label="Reset run"
                  onClick={() => setModal("reset")}
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  className="play-button"
                  onClick={() => setRunning(!running)}
                >
                  {running ? <Pause size={13} /> : <Play size={13} />}
                  <span>{running ? "Pause" : "Run"}</span>
                </button>
              </div>
            </div>
            {view === "architecture" ? (
              <div className="graph-and-inspector">
                <div className="graph-column">
                  <div className="graph-top">
                    <div>
                      <span className="status-dot green" /> MEDIA PROCESSING /
                      CONTROLLED EXECUTION{" "}
                      <span className="graph-version">v1.0</span>
                    </div>
                    <div className="graph-tools">
                      <button
                        className="small-outline"
                        onClick={() => setView("traces")}
                      >
                        <GitBranch size={14} /> Follow a package
                      </button>
                      <select
                        aria-label="Graph metric"
                        value={lens}
                        onChange={(e) => setLens(e.target.value)}
                      >
                        <option value="queue">Queue depth</option>
                        <option value="utilization">Utilization</option>
                        <option value="completed">Completed</option>
                      </select>
                      <button
                        className="icon-button"
                        onClick={() => setFullscreen(!fullscreen)}
                        aria-label="Toggle focus mode"
                        title="Focus mode"
                      >
                        <Expand size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="graph-canvas">
                    <ReactFlowProvider>
                      <Graph
                        snap={snap}
                        selected={selected}
                        setSelected={selectStage}
                        lens={lens}
                        running={running}
                        fullscreen={fullscreen}
                      />
                    </ReactFlowProvider>
                    <div className="graph-legend">
                      <span>
                        <i className="mint-dot" />
                        Processing
                      </span>
                      <span>
                        <i className="amber-dot" />
                        Review / fallback
                      </span>
                      <span>Scroll to zoom · drag to pan</span>
                    </div>
                  </div>
                  <div className="platform-strip">
                    <span>CONTROL & DATA FOUNDATION</span>
                    <button onClick={() => setView("decisions")}>
                      <Workflow size={13} />
                      Temporal
                    </button>
                    <button onClick={() => setView("decisions")}>
                      <Database size={13} />
                      S3 + PostgreSQL
                    </button>
                    <button onClick={() => setView("decisions")}>
                      <Activity size={13} />
                      OpenTelemetry
                    </button>
                    <button
                      onClick={() => {
                        setControls("capacity");
                        setMobileControls(true);
                      }}
                    >
                      <Layers3 size={13} />
                      K8s + KEDA
                    </button>
                  </div>
                  <div
                    className={`system-insight ${bottleneck ? "has-pressure" : ""}`}
                  >
                    <Activity size={16} />
                    <div>
                      <strong>
                        {bottleneck
                          ? `${bottleneck.name} is accumulating work`
                          : "No sustained queue pressure detected"}
                      </strong>
                      <span>
                        {bottleneck
                          ? `${snap.stages[bottleneck.id].queue} tasks queued · oldest wait ${$(snap.stages[bottleneck.id].age, 1)} min. Inspect capacity, downstream health and admission rate.`
                          : "Use capacity planning to evaluate headroom before increasing the admitted workload."}
                      </span>
                    </div>
                    {bottleneck && (
                      <button onClick={() => selectStage(bottleneck.id)}>
                        Inspect
                        <ArrowRight size={13} />
                      </button>
                    )}
                  </div>
                </div>
                <div
                  className={
                    showInspector
                      ? "inspector-container show"
                      : "inspector-container"
                  }
                >
                  <Inspector
                    id={selected}
                    snap={snap}
                    onClose={() => setShowInspector(false)}
                    onConfigure={configure}
                  />
                </div>
              </div>
            ) : view === "capacity" ? (
              <Capacity snap={snap} />
            ) : view === "economics" ? (
              <Economics snap={snap} baseline={baseline} />
            ) : view === "traces" ? (
              <Traces snap={snap} />
            ) : view === "review" ? (
              <Inspect
                onNavigate={(target, stage) => {
                  setView(target);
                  if (stage && target === "architecture") selectStage(stage);
                }}
              />
            ) : (
              <Blueprint />
            )}
          </div>
          <div className="telemetry-grid">
            <div className="telemetry-chart">
              <Chart
                history={snap.history}
                field="throughput"
                unit="accepted min / h"
                label="Delivery throughput"
              />
            </div>
            <div className="event-console">
              <div className="console-heading">
                <span>
                  <Terminal size={14} />
                  LIVE EVENT STREAM <i>{running ? "streaming" : "paused"}</i>
                </span>
                <select
                  aria-label="Event filter"
                  value={eventFilter}
                  onChange={(e) => setEventFilter(e.target.value)}
                >
                  <option value="all">All events</option>
                  <option value="warn">Warnings</option>
                  <option value="error">Errors</option>
                  <option value="success">Success</option>
                  <option value="config">Config</option>
                </select>
              </div>
              <div
                className="event-list"
                role="log"
                aria-label="Simulation events"
              >
                {snap.events
                  .filter(
                    (e) => eventFilter === "all" || e.level === eventFilter,
                  )
                  .slice(0, 8)
                  .map((e, i) => (
                    <div className={"event " + e.level} key={`${e.time}-${i}`}>
                      <time>{timeLabel(e.time)}</time>
                      <span className="event-stage">{e.stage}</span>
                      <span>{e.message}</span>
                    </div>
                  ))}
                {!snap.events.some(
                  (e) => eventFilter === "all" || e.level === eventFilter,
                ) && (
                  <p className="empty">
                    No {eventFilter} events in the recent buffer.
                  </p>
                )}
              </div>
            </div>
          </div>
          <footer>
            <span>
              <span className="status-dot" />
              Browser simulation · seeded, reproducible, inspectable
            </span>
            <button onClick={() => setModal("model")}>
              Model notes & assumptions
              <ArrowUpRight size={12} />
            </button>
            <span>
              Owner: Hassan Uriostegui · illustrative operating assumptions
            </span>
          </footer>
        </main>
      </div>
      <button
        className="mobile-controls-button"
        onClick={() => setMobileControls(!mobileControls)}
      >
        {mobileControls ? <X size={18} /> : <SlidersHorizontal size={18} />}
        <span>{mobileControls ? "Close" : "Controls"}</span>
      </button>
      {tour !== null && (
        <div className="tour-panel">
          <div className="tour-heading">
            <span>
              ARCHITECTURE WALKTHROUGH · {tour + 1} / {TOURS.length}
            </span>
            <button
              className="icon-button"
              onClick={() => setTour(null)}
              aria-label="Close walkthrough"
            >
              <X size={16} />
            </button>
          </div>
          <h3>{TOURS[tour].title}</h3>
          <p>{TOURS[tour].text}</p>
          <div className="tour-actions">
            <div>
              {TOURS.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Walkthrough step ${i + 1}`}
                  className={tour === i ? "active" : ""}
                  onClick={() => {
                    setTour(i);
                    selectStage(TOURS[i].stage);
                  }}
                />
              ))}
            </div>
            <button
              className="primary-button"
              onClick={() => {
                if (tour === TOURS.length - 1) {
                  setTour(null);
                  return;
                }
                setTour(tour + 1);
                selectStage(TOURS[tour + 1].stage);
              }}
            >
              {tour === TOURS.length - 1
                ? "Explore the system"
                : "Next decision"}
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
      {modal === "scenarios" && (
        <Modal
          title="Evaluate the operating model"
          onClose={() => setModal(null)}
        >
          <p className="modal-intro">
            Apply an experiment to the current run. Reset first if you want a
            clean comparison.
          </p>
          <div className="scenario-grid">
            {SCENARIOS.map((s) => (
              <button
                className="scenario-card"
                key={s.id}
                onClick={() => {
                  loadScenario(s.id);
                  setView("architecture");
                  setModal(null);
                }}
              >
                <Icon name={s.icon} size={23} />
                <span className="eyebrow">{s.tag}</span>
                <h3>{s.name}</h3>
                <p>{s.description}</p>
                <small>{s.talk}</small>
                <span className="scenario-cta">
                  Apply scenario
                  <ArrowUpRight size={15} />
                </span>
              </button>
            ))}
          </div>
        </Modal>
      )}
      {modal === "reset" && (
        <Modal title="Start a fresh experiment" onClose={() => setModal(null)}>
          <p className="modal-intro">
            Clear elapsed time, queues, costs and outcomes. Your saved
            comparison checkpoint stays available.
          </p>
          <div className="reset-options">
            <button
              className="primary-button"
              onClick={() => {
                reset();
                setModal(null);
              }}
            >
              <RotateCcw size={15} />
              Reset with current parameters
            </button>
            <button
              className="small-outline"
              onClick={() => {
                reset(DEFAULTS);
                configure(DEFAULTS);
                setScenario("baseline");
                setModal(null);
              }}
            >
              Restore baseline parameters
            </button>
          </div>
        </Modal>
      )}
      {modal === "model" && (
        <Modal
          title="A model you can interrogate."
          onClose={() => setModal(null)}
        >
          <p className="modal-intro">
            This React application runs a seeded, discrete-time queue
            simulation. No external models are called. The technologies shown
            are proposed implementations backed by linked documentation.
          </p>
          <div className="model-notes">
            <h3>What is simulated</h3>
            <p>
              One-second simulation steps. FIFO queues with finite service
              slots; speech/vision fan-out and join; one localized derivative
              per selected language; asynchronous indexing; bounded transient
              speech retries with exponential backoff and jitter; first-pass
              quality gates, finite human review, policy holds and a final
              rights check. Speech autoscaling waits 60 seconds and caps at 3×
              configured capacity or 24 slots.
            </p>
            <h3>Workload and service times</h3>
            <pre>
              assets/s = source_hours_per_day × 60 / (86400 × asset_minutes)
              <br />
              output_minutes = asset_minutes × clip_ratio × languages
              <br />
              service_seconds = fixed_overhead + media_minutes × 60 × RTF
              <br />
              actual_service = service_seconds × uniform(0.8, 1.2)
            </pre>
            <p>
              New assets capture their language count, extraction ratio and
              deadline at admission. Existing work keeps those values. Resource
              limits and gate thresholds apply live; service time and speech
              model are sampled when a task starts. Arrivals are evenly spaced.
              The initial view includes 15 simulated minutes of warm-up.
            </p>
            <h3>Economic assumptions, not vendor prices</h3>
            <p>
              Each provisioned GPU slot costs an illustrative $2.40/h; each CPU
              slot $0.12/h; each staffed reviewer $30/h. Speech uses an
              additional profile-specific variable processing fee; fallback uses
              $0.18/output minute and RTF 0.85. Other per-stage assumptions are
              defined in the source catalog. Idle capacity is charged. No actual
              vendor pricing, benchmark or savings claim is implied.
            </p>
            <h3>Quality and reliability</h3>
            <p>
              Synthetic quality is a profile mean plus three centered uniform
              draws × 14, clamped to 0–100. It is not a measured WER, MOS or
              clinical quality score. Review takes approximately three minutes,
              with an illustrative 82% approval rate. Speech has a 2.5%
              transient failure chance. An outage fails in-flight primary work;
              fallback jobs continue. Failed attempts remain billed.
            </p>
            <h3>Read the metrics carefully</h3>
            <p>
              Throughput uses the trailing five simulated minutes. p95 uses the
              last 5,000 delivered derivatives and excludes unfinished work;
              pair it with queue age. Deadline attainment uses delivered outputs
              in the trailing hour and each asset’s admission-time deadline, not
              a full arrival-cohort SLO. Cost per accepted minute includes all
              run spend and work in progress. Drain the pipeline (set arrivals
              to zero) and compare equal workloads for a controlled experiment.
            </p>
            <h3>Boundaries of this model</h3>
            <p>
              Source assets are fixed-duration within a run configuration. API
              and I/O capacities are simplified. There is no GPU-memory
              scheduling, tenant fair-share scheduler, stochastic arrival burst
              model, explicit storage retention billing, post-publication
              takedown or live provider reconciliation. Analysis-cache hits
              bypass speech and vision only. Admissions are deferred beyond
              3,000 pending tasks or 100 queued ingests. Event and trace buffers
              are bounded for browser performance.
            </p>
            <h3>Reproducibility</h3>
            <p>
              Seed {snap.config.seed}. Export includes parameters and a run
              summary. Import and shared links recreate parameters, not prior
              queue state or a replay of live parameter edits. Replay an
              identical configuration from reset for the same trajectory.
            </p>
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}
