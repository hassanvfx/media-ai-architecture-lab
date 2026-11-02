import React, { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  BookOpen,
  ChevronDown,
  Download,
  Expand,
  GitBranch,
  Headphones,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Upload,
  Users,
  Video,
  Wallet,
  Workflow,
  X,
} from "lucide-react";
import { ReactFlowProvider } from "@xyflow/react";
import { DEFAULTS, PROFILES, SCENARIOS, STAGES, SOURCES } from "./catalog.js";
import { Simulation, normalizeConfig } from "./engine.js";
import { CATALOG_MIXES, DESTINATIONS, durationSummary } from "./workload.js";
import { $, timeLabel, readInitial, download } from "./utils.js";
import { Slider, Toggle, Metric, Modal, Chart } from "./components/ui.jsx";
import { HelpLabel, GlossaryButton, explanation } from "./components/Help.jsx";
import Graph from "./components/Graph.jsx";
import Inspector from "./components/Inspector.jsx";
import ProcessOverview from "./components/ProcessOverview.jsx";
import ReviewRoom from "./views/ReviewRoom.jsx";
import Capacity from "./views/Capacity.jsx";
import Economics from "./views/Economics.jsx";
import Traces from "./views/Traces.jsx";
import Inspect from "./views/Inspect.jsx";
import Blueprint from "./views/Blueprint.jsx";

export default function App() {
  const engine = useRef(null);
  if (!engine.current) engine.current = new Simulation(readInitial(), 1800);
  const [snap, setSnap] = useState(() => engine.current.snapshot()),
    [running, setRunning] = useState(true),
    [speed, setSpeed] = useState(30),
    [view, setView] = useState("architecture"),
    [selected, setSelected] = useState("audio_review"),
    [inspector, setInspector] = useState(false),
    [inputs, setInputs] = useState(false),
    [controlTab, setControlTab] = useState("catalog"),
    [scenario, setScenario] = useState("baseline"),
    [lens, setLens] = useState("queue"),
    [fullscreen, setFullscreen] = useState(false),
    [modal, setModal] = useState(null),
    [toast, setToast] = useState(""),
    [previews, setPreviews] = useState({}),
    [runVersion, setRunVersion] = useState(0);
  const files = useRef({}),
    importInput = useRef();
  useEffect(
    () => () => {
      Object.values(files.current).forEach((file) =>
        URL.revokeObjectURL(file.url),
      );
    },
    [],
  );
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      engine.current.advance(speed);
      setSnap(engine.current.snapshot());
    }, 1000);
    return () => clearInterval(timer);
  }, [running, speed]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  const refresh = () => setSnap(engine.current.snapshot());
  const configure = (patch) => {
    engine.current.configure(patch);
    refresh();
    try {
      localStorage.setItem(
        "hassan-uriostegui-observatory-config",
        JSON.stringify(engine.current.config),
      );
    } catch {}
  };
  const navigate = (target, stage) => {
    setView(target);
    if (stage) {
      setSelected(stage);
      setInspector(target === "architecture");
    }
    requestAnimationFrame(() =>
      document
        .getElementById("simulation-workspace")
        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };
  const reset = (config = snap.config, warmup = 0) => {
    Object.values(files.current).forEach((file) =>
      URL.revokeObjectURL(file.url),
    );
    files.current = {};
    setPreviews({});
    engine.current = new Simulation(config, warmup);
    setRunVersion((version) => version + 1);
    refresh();
    setModal(null);
    setToast(
      warmup
        ? "Baseline loaded: no approvals are pre-recorded."
        : "Run reset: media decisions and queues cleared.",
    );
  };
  const applyScenario = (id) => {
    setScenario(id);
    const preset = SCENARIOS.find((item) => item.id === id);
    configure(preset.patch);
    setToast(
      `${preset.name} applied. Existing packages retain their source manifest.`,
    );
  };
  const decide = (gate, id, payload) => {
    const result =
      gate === "audio"
        ? engine.current.reviewAudio(id, payload)
        : engine.current.reviewFinal(id, payload);
    refresh();
    setToast(
      `${gate === "audio" ? "Audio" : "Final video"}: ${payload.decision.replaceAll("_", " ")}. Decision recorded.`,
    );
    return result;
  };
  const attach = async (gate, id, file) => {
    const previewEngine = engine.current;
    if (file.size > 100 * 1024 * 1024)
      throw Error("Choose a local file smaller than 100 MB.");
    const digest = await crypto.subtle.digest(
        "SHA-256",
        await file.arrayBuffer(),
      ),
      hash = [...new Uint8Array(digest)]
        .map((value) => value.toString(16).padStart(2, "0"))
        .join("");
    if (engine.current !== previewEngine)
      throw Error(
        "Run changed while reading the file. Select it again for the current run.",
      );
    const version =
      gate === "audio"
        ? engine.current.attachAudio(id, { hash, name: file.name })
        : engine.current.attachVideo(id, { hash, name: file.name });
    const key = `${gate}:${id}`;
    if (files.current[key]) URL.revokeObjectURL(files.current[key].url);
    files.current[key] = {
      url: URL.createObjectURL(file),
      version,
      hash,
      name: file.name,
    };
    setPreviews({ ...files.current });
    refresh();
  };
  const exportRun = () =>
    download(
      "hassan-uriostegui-pipeline.json",
      JSON.stringify(
        {
          schema: 3,
          config: snap.config,
          elapsed: snap.time,
          metrics: snap.metrics,
          costs: snap.costs,
          audit: snap.audit,
        },
        null,
        2,
      ),
    );
  const importRun = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 1000000) throw Error("Scenario file exceeds 1 MB.");
      const data = JSON.parse(await file.text());
      if (!data.config) throw Error("Expected a scenario export.");
      reset(normalizeConfig(data.config));
    } catch (error) {
      setToast(error.message);
    }
    event.target.value = "";
  };
  const share = async () => {
    const url = new URL(location.href);
    url.hash = "run=" + btoa(encodeURIComponent(JSON.stringify(snap.config)));
    try {
      await navigator.clipboard.writeText(url.href);
      setToast(
        "Scenario link copied. Opens a fresh run, without review decisions.",
      );
    } catch {
      download("scenario-link.txt", url.href, "text/plain");
    }
  };
  const c = snap.config,
    m = snap.metrics;
  return (
    <div
      className={`app executive managed-pipeline ${fullscreen ? "focus-mode" : ""}`}
    >
      <header className="topbar">
        <a
          className="wordmark"
          href="#"
          onClick={(event) => {
            event.preventDefault();
            setView("architecture");
            window.scrollTo({ top: 0, behavior: "smooth" });
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
            <span /> BROWSER SIMULATION
          </span>
          <button className="quiet-button" onClick={() => setModal("model")}>
            Model notes
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
        <aside className={`sidebar ${inputs ? "mobile-open" : ""}`}>
          <div className="sidebar-title">
            <span>WORKLOAD & PLANNING INPUTS</span>
            <button
              className="icon-button"
              aria-label="Close model inputs"
              onClick={() => setInputs(false)}
            >
              <X size={17} />
            </button>
          </div>
          <section className="scenario-select">
            <label className="select-label">
              <HelpLabel label="Operating scenario" />
              <select
                aria-label="Scenario"
                value={scenario}
                onChange={(event) => applyScenario(event.target.value)}
              >
                {SCENARIOS.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <p>{SCENARIOS.find((item) => item.id === scenario)?.description}</p>
          </section>
          <div className="control-tabs">
            {["catalog", "capacity", "economics"].map((tab) => (
              <button
                className={tab === controlTab ? "active" : ""}
                key={tab}
                onClick={() => setControlTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="control-content">
            {controlTab === "catalog" ? (
              <>
                <div className="section-label">VARIABLE SOURCE CATALOG</div>
                <Slider
                  label="Source hours received"
                  value={c.arrival}
                  min={0}
                  max={4800}
                  step={12}
                  suffix="h/day"
                  onChange={(value) => configure({ arrival: value })}
                />
                <label className="select-label">
                  <HelpLabel label="Source catalog mix" />
                  <select
                    aria-label="Source catalog mix"
                    value={c.durationMode === "fixed" ? "fixed" : c.catalogMix}
                    onChange={(event) =>
                      configure({
                        durationMode: "mix",
                        catalogMix: event.target.value,
                      })
                    }
                  >
                    {Object.entries(CATALOG_MIXES).map(([id, mix]) => (
                      <option key={id} value={id}>
                        {mix.name}
                      </option>
                    ))}
                    <option value="custom">Custom duration range</option>
                    {c.durationMode === "fixed" && (
                      <option value="fixed">Fixed-size imported test</option>
                    )}
                  </select>
                </label>
                <p className="control-footnote">
                  Each source gets its own duration. Expected mean:{" "}
                  {durationSummary(c).mean.toFixed(1)} min.
                </p>
                {c.catalogMix === "custom" && (
                  <>
                    <Slider
                      label="Shortest source video"
                      value={c.minSourceMinutes}
                      min={0.5}
                      max={180}
                      step={0.5}
                      suffix="min"
                      onChange={(value) =>
                        configure({ minSourceMinutes: value })
                      }
                    />
                    <Slider
                      label="Longest source video"
                      value={c.maxSourceMinutes}
                      min={c.minSourceMinutes}
                      max={180}
                      step={0.5}
                      suffix="min"
                      onChange={(value) =>
                        configure({ maxSourceMinutes: value })
                      }
                    />
                  </>
                )}
                <label className="select-label">
                  <HelpLabel label="Segmentation strategy" />
                  <select
                    aria-label="Segmentation strategy"
                    value={c.segmentationMode}
                    onChange={(event) =>
                      configure({ segmentationMode: event.target.value })
                    }
                  >
                    <option value="duration">Maximum duration</option>
                    <option value="scene">Scene-informed boundaries</option>
                  </select>
                </label>
                <Slider
                  label="Maximum chunk duration"
                  value={c.chunkMinutes}
                  min={1}
                  max={30}
                  suffix="min"
                  onChange={(value) => configure({ chunkMinutes: value })}
                />
                <p className="control-footnote">
                  All source intervals are retained. Scene boundaries are
                  synthetic in this simulator; production detection and semantic
                  validation are separate implementation work.
                </p>
                <Slider
                  label="Target languages"
                  value={c.languages}
                  min={1}
                  max={11}
                  hint={`English → ${DESTINATIONS.slice(0, c.languages)
                    .map(([, name]) => name)
                    .join(", ")}`}
                  onChange={(value) => configure({ languages: value })}
                />
              </>
            ) : controlTab === "capacity" ? (
              <>
                <div className="section-label">PROVIDER JOB ALLOWANCES</div>
                <Slider
                  label="ElevenLabs concurrent jobs"
                  value={c.dubConcurrency}
                  min={1}
                  max={24}
                  onChange={(value) => configure({ dubConcurrency: value })}
                />
                <Slider
                  label="Sync concurrent jobs"
                  value={c.syncConcurrency}
                  min={1}
                  max={24}
                  onChange={(value) => configure({ syncConcurrency: value })}
                />
                <Slider
                  label="Normalization workers"
                  value={c.appWorkers}
                  min={1}
                  max={24}
                  onChange={(value) => configure({ appWorkers: value })}
                />
                <Slider
                  label="Planned reviewers per gate"
                  value={c.reviewers}
                  min={0}
                  max={20}
                  onChange={(value) => configure({ reviewers: value })}
                />
                <p className="control-footnote">
                  Review staffing informs capacity planning. Both live human
                  gates still require your explicit decision; more reviewers
                  never cause auto-approval.
                </p>
                <Toggle
                  label="ElevenLabs outage"
                  value={c.dubOutage}
                  onChange={(value) => configure({ dubOutage: value })}
                />
                <Toggle
                  label="Sync outage"
                  value={c.syncOutage}
                  onChange={(value) => configure({ syncOutage: value })}
                />
                <Toggle
                  label="Revoke license cohort"
                  value={c.revoked}
                  onChange={(value) => configure({ revoked: value })}
                />
                <Slider
                  label="Retry budget"
                  value={c.retries}
                  min={0}
                  max={4}
                  onChange={(value) => configure({ retries: value })}
                />
                <Slider
                  label="Delivery target"
                  value={c.slo}
                  min={1}
                  max={240}
                  suffix="min"
                  onChange={(value) => configure({ slo: value })}
                />
              </>
            ) : (
              <>
                <div className="section-label">
                  EDITABLE PLANNING ASSUMPTIONS
                </div>
                <label className="select-label">
                  <HelpLabel label="Sync model" />
                  <select
                    aria-label="Sync model"
                    value={c.model}
                    onChange={(event) =>
                      configure({
                        model: event.target.value,
                        syncRate: PROFILES[event.target.value].rate,
                      })
                    }
                  >
                    {Object.entries(PROFILES).map(([id, profile]) => (
                      <option key={id} value={id}>
                        {profile.name}
                      </option>
                    ))}
                  </select>
                </label>
                {[
                  [
                    "ElevenLabs audio fee",
                    "dubRate",
                    0,
                    30,
                    0.1,
                    "USD / audio minute",
                  ],
                  [
                    "Sync video fee",
                    "syncRate",
                    0,
                    2,
                    0.001,
                    "USD / output second at assumed 25 fps",
                  ],
                  [
                    "Audio processing factor",
                    "dubRtf",
                    0.05,
                    10,
                    0.05,
                    "processing seconds / media second",
                  ],
                  [
                    "Lip-sync processing factor",
                    "syncRtf",
                    0.05,
                    10,
                    0.05,
                    "processing seconds / media second",
                  ],
                  [
                    "Review effort",
                    "reviewFactor",
                    0.25,
                    3,
                    0.25,
                    "review minutes / media minute",
                  ],
                  [
                    "Reviewer hourly rate",
                    "reviewerRate",
                    0,
                    200,
                    1,
                    "USD / review hour",
                  ],
                ].map(([label, key, min, max, step, unit]) => (
                  <label className="select-label numeric-assumption" key={key}>
                    <HelpLabel label={label} />
                    <input
                      aria-label={label}
                      type="number"
                      min={min}
                      max={max}
                      step={step}
                      value={c[key]}
                      onChange={(event) =>
                        configure({ [key]: Number(event.target.value) })
                      }
                    />
                    <small>{unit}</small>
                  </label>
                ))}
                <Slider
                  label="Expected audio approval"
                  value={c.expectedApproval}
                  min={5}
                  max={100}
                  suffix="%"
                  onChange={(value) => configure({ expectedApproval: value })}
                />
                <Slider
                  label="Expected final approval"
                  value={c.expectedFinalApproval}
                  min={5}
                  max={100}
                  suffix="%"
                  onChange={(value) =>
                    configure({ expectedFinalApproval: value })
                  }
                />
                <p className="control-footnote">
                  Expected acceptance percentages are used only in planning
                  estimates. They do not approve any live package. Fees,
                  processing factors and reviewer effort require
                  account-specific quotes and benchmarks.
                </p>
                <a
                  className="reference-link"
                  href={SOURCES.syncBilling}
                  target="_blank"
                  rel="noreferrer"
                >
                  Sync rate documentation ↗
                </a>
              </>
            )}
          </div>
          <div className="sidebar-bottom">
            <button onClick={share}>Copy scenario link</button>
            <button onClick={() => importInput.current.click()}>
              <Upload size={13} /> Import scenario
            </button>
            <input
              ref={importInput}
              hidden
              type="file"
              accept="application/json,.json"
              onChange={importRun}
            />
            <span className="seed">Deterministic catalog · seed {c.seed}</span>
          </div>
        </aside>
        <main className="main">
          <div className="page-heading">
            <div>
              <div className="breadcrumb">
                VERIFIED PROVIDER FLOW / TWO HUMAN GATES
              </div>
              <h1>ElevenLabs audio. Human approval. Sync video.</h1>
              <p>
                Split the complete source into ordered batches, review the
                audio, lip-sync each approved chunk, then reassemble and review
                the full program.
              </p>
            </div>
            <div className="heading-actions">
              <GlossaryButton />
              <button className="small-outline" onClick={() => setInputs(true)}>
                <SlidersHorizontal size={15} /> Model inputs
              </button>
            </div>
          </div>
          <ProcessOverview
            config={c}
            sources={snap.recentSources}
            onNavigate={navigate}
          />
          <div className="metrics-grid">
            <Metric
              label="AUDIO AWAITING APPROVAL"
              value={m.awaitingAudio}
              note="No Sync call before your decision"
            />
            <Metric
              label="FINAL VIDEOS AWAITING REVIEW"
              value={m.awaitingFinal}
              note="No delivery before final approval"
            />
            <Metric
              label="SYNC JOBS SUBMITTED"
              value={snap.syncSubmissions}
              note="Only version-approved audio"
            />
            <Metric
              label="PROGRAMS DELIVERED"
              value={snap.outputs}
              note={`${$(snap.accepted, 1)} accepted media minutes`}
            />
            <Metric
              label="COST / DELIVERED MIN"
              value={m.unitCost == null ? "—" : `$${$(m.unitCost, 2)}`}
              note={
                m.unitCost == null
                  ? "No program released yet"
                  : "All modeled spend / released minutes"
              }
            />
          </div>
          <div className="approval-callout">
            <div>
              <Headphones size={21} />
              <span>
                <b>
                  {m.awaitingAudio} chunk-language audio packages need a human
                  decision
                </b>
                <small>
                  Audio approval is a hard stop before Sync; final approval is a
                  second hard stop before delivery.
                </small>
              </span>
            </div>
            <button
              className="primary-button"
              onClick={() => navigate("audio")}
            >
              Open audio approval <ArrowRight size={14} />
            </button>
            {m.awaitingFinal > 0 && (
              <button
                className="small-outline"
                onClick={() => navigate("final")}
              >
                Review {m.awaitingFinal} final{" "}
                {m.awaitingFinal === 1 ? "video" : "videos"}
              </button>
            )}
          </div>
          <div className="workspace" id="simulation-workspace">
            <div className="workspace-toolbar">
              <div className="view-tabs">
                {[
                  ["architecture", Workflow, "Pipeline"],
                  ["audio", Headphones, `Audio approval · ${m.awaitingAudio}`],
                  ["final", Video, `Final review · ${m.awaitingFinal}`],
                  ["capacity", Activity, "Capacity planning"],
                  ["economics", Wallet, "Model economics"],
                  ["traces", GitBranch, "Package traces"],
                  ["decisions", BookOpen, "Design rationale"],
                  ["review", Users, "Inspect · 50"],
                ].map(([id, C, label]) => (
                  <button
                    key={id}
                    className={view === id ? "active" : ""}
                    onClick={() => setView(id)}
                    title={explanation(label.split(" · ")[0])}
                  >
                    <C size={14} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
              <div className="run-controls">
                <span className="sim-clock">{timeLabel(snap.time)}</span>
                <select
                  aria-label="Simulation speed"
                  value={speed}
                  onChange={(event) => setSpeed(Number(event.target.value))}
                >
                  {[1, 10, 30, 60, 300].map((value) => (
                    <option value={value} key={value}>
                      {value}×
                    </option>
                  ))}
                </select>
                <button
                  className="icon-button"
                  title="Advance one simulated minute"
                  aria-label="Advance one simulated minute"
                  onClick={() => {
                    engine.current.advance(60);
                    refresh();
                  }}
                >
                  <ArrowRight size={15} />
                </button>
                <button
                  className="icon-button"
                  aria-label="Reset run"
                  onClick={() => setModal("reset")}
                >
                  <RotateCcw size={15} />
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
                    <span>
                      COMPLETE SOURCE → ORDERED CHUNKS → TWO HUMAN GATES
                    </span>
                    <div className="graph-tools">
                      <button
                        className="small-outline"
                        onClick={() => navigate("audio")}
                      >
                        Preview & approve audio
                      </button>
                      <select
                        aria-label="Graph metric"
                        value={lens}
                        onChange={(event) => setLens(event.target.value)}
                      >
                        <option value="queue">Waiting work</option>
                        <option value="utilization">
                          Job allowance in use
                        </option>
                        <option value="completed">Completed stages</option>
                      </select>
                      <button
                        className="icon-button"
                        aria-label="Toggle focus mode"
                        onClick={() => setFullscreen(!fullscreen)}
                      >
                        <Expand size={15} />
                      </button>
                    </div>
                  </div>
                  <div className="graph-canvas">
                    <ReactFlowProvider>
                      <Graph
                        snap={snap}
                        selected={selected}
                        setSelected={(id) => {
                          setSelected(id);
                          setInspector(true);
                        }}
                        lens={lens}
                        running={running}
                        fullscreen={fullscreen}
                      />
                    </ReactFlowProvider>
                    <div className="graph-legend">
                      <span>
                        <i className="mint-dot" /> Provider / application work
                      </span>
                      <span>
                        <i className="amber-dot" /> Explicit human decision
                      </span>
                      <span>
                        Select a stage for its contract and verified source
                        links.
                      </span>
                    </div>
                  </div>
                  <div className="managed-provider-strip">
                    <a href={SOURCES.eleven} target="_blank" rel="noreferrer">
                      ElevenLabs Dubbing documentation ↗
                    </a>
                    <a href={SOURCES.sync} target="_blank" rel="noreferrer">
                      Sync: video + approved audio ↗
                    </a>
                    <button onClick={() => navigate("final")}>
                      View reassembly progress →
                    </button>
                  </div>
                </div>
                {inspector && (
                  <Inspector
                    id={selected}
                    snap={snap}
                    onClose={() => setInspector(false)}
                    onNavigate={navigate}
                  />
                )}
              </div>
            ) : view === "audio" || view === "final" ? (
              <ReviewRoom
                key={`${runVersion}-${view}`}
                gate={view === "audio" ? "audio" : "final"}
                snap={snap}
                onDecision={decide}
                onAttach={attach}
                previews={previews}
                onNavigate={navigate}
              />
            ) : view === "capacity" ? (
              <Capacity snap={snap} />
            ) : view === "economics" ? (
              <Economics snap={snap} />
            ) : view === "traces" ? (
              <Traces key={runVersion} snap={snap} />
            ) : view === "decisions" ? (
              <Blueprint />
            ) : (
              <Inspect onNavigate={navigate} />
            )}
          </div>
          <div className="live-bottom">
            <Chart
              history={snap.history}
              field="throughput"
              label="Released program throughput"
              unit="accepted min / hour"
            />
            <div className="event-console">
              <div className="console-heading">
                PACKAGE EVENTS / HUMAN DECISIONS
              </div>
              <div
                className="events-list"
                role="log"
                aria-label="Simulation events"
              >
                {snap.events.slice(0, 8).map((event, index) => (
                  <div
                    className={`event-line ${event.level}`}
                    key={`${event.time}-${index}`}
                  >
                    <time>{timeLabel(event.time)}</time>
                    <span className="event-stage">
                      {STAGES.find((stage) => stage.id === event.stage)?.name ||
                        "Run control"}
                    </span>
                    <span>{event.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <footer>
            <span>Owner: Hassan Uriostegui · browser simulation</span>
            <button onClick={() => setModal("model")}>
              Model notes & API boundaries
            </button>
            <span>No provider requests or paid jobs are made.</span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
      {modal === "reset" && (
        <Modal title="Start a new run" onClose={() => setModal(null)}>
          <p>
            This clears queued packages, decisions and local preview references.
            Configuration imports do not restore prior approvals.
          </p>
          <div className="modal-actions">
            <button className="small-outline" onClick={() => reset()}>
              Reset current inputs to time zero
            </button>
            <button
              className="primary-button"
              onClick={() => {
                setScenario("baseline");
                reset(DEFAULTS, 1800);
              }}
            >
              Load baseline with audio ready for review
            </button>
          </div>
        </Modal>
      )}
      {modal === "model" && (
        <Modal
          title="Real provider boundaries. Simulated execution."
          onClose={() => setModal(null)}
        >
          <div className="model-notes">
            <h3>The selected production flow</h3>
            <p>
              Source segmentation → per-chunk normalization → ElevenLabs dubbed
              audio → human audio approval → Sync with separate video/audio
              inputs → ordered reassembly → final human approval → delivery.
              This app does not call providers or render translated speech or
              faces.
            </p>
            <h3>What is interactive</h3>
            <p>
              Both human gates require explicit preview playback, checklist
              confirmations and a named demo reviewer. Audio approvals bind
              source, chunk, language, audio version and content identifier. New
              audio invalidates approval. Final approval binds the complete
              assembly and all chunk outputs.
            </p>
            <h3>Source segmentation</h3>
            <p>
              Duration mode partitions the full source at the cap. Scene mode
              uses synthetic scene-informed boundaries with the same maximum.
              Neither mode discards source intervals. Real content detection,
              precise cuts and codec validation belong in a production
              implementation.
            </p>
            <h3>Preview media</h3>
            <p>
              Bundled audio is locally synthesized reference speech. Bundled
              final video is a waveform fixture, not a talking-face result. Load
              local audio or video to inspect your own media; files stay in this
              browser. Their SHA-256 hashes are calculated locally. Demo review
              names are not authenticated identities.
            </p>
            <h3>Planning assumptions</h3>
            <p>
              Provider concurrency is account-specific. Sync legacy usage
              references are frame-based, shown as per-second rates at 25 fps.
              Defaults are editable planning inputs, not a quote. Processing
              factors and review effort are not measured benchmarks. Estimated
              review cost is charged on a decision; no idle GPU cost is
              invented.
            </p>
            <h3>Limits</h3>
            <p>
              Catalog arrivals are evenly spaced with independently sampled
              source lengths. External errors are synthetic with bounded
              retries; attempted fees are conservatively estimated without
              assuming refunds. Runtime queues and logs are bounded. No durable
              storage, external authorization, actual webhook or provider
              reconciliation is implemented. Both human gates remain mandatory
              even if a planning estimate assumes high acceptance.
            </p>
            <a href={SOURCES.syncBilling} target="_blank" rel="noreferrer">
              Verified Sync billing documentation ↗
            </a>
          </div>
        </Modal>
      )}
    </div>
  );
}
