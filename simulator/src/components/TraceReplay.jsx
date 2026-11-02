import React, { useEffect, useMemo, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw } from "lucide-react";
import { HelpLabel, Terms } from "./Help.jsx";
import { DESTINATIONS } from "../workload.js";
import Graph from "./Graph.jsx";
import { traceSteps, traceState, traceCommentary } from "../traceReplay.js";
import { timeLabel } from "../utils.js";

export default function TraceReplay({ job, snap }) {
  const steps = useMemo(() => traceSteps(job), [job]);
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    if (cursor >= steps.length - 1) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => setCursor((previous) => previous + 1), 3500);
    return () => clearTimeout(timer);
  }, [playing, cursor, steps.length]);
  if (!steps.length)
    return <p className="empty">No recorded spans for this package.</p>;
  const span = steps[cursor];
  const state = traceState(job, steps, cursor);
  const note = traceCommentary(job, span, steps);
  const jump = (value) => {
    setPlaying(false);
    setCursor(value);
  };
  return (
    <section className="package-replay" aria-label="Interactive package replay">
      <div className="replay-heading">
        <div>
          <span className="eyebrow">PINNED PACKAGE / RECORDED EXECUTION</span>
          <h3>
            {job.asset} <small>/ {job.locale?.toUpperCase() || "SOURCE"}</small>
          </h3>
          <p>
            {job.sourceMinutes.toFixed(1)}m English source ·{" "}
            {job.segmentIndex != null
              ? `Chunk ${job.segmentIndex + 1}/${job.segmentCount} · ${job.minutes.toFixed(1)}m chunk`
              : `Complete program · ${job.parts?.length || job.segmentCount} chunks`}{" "}
            · {job.languages} language branches · Status: <b>{job.status}</b>
          </p>
        </div>
        <span className="tag">
          {job.syncModel || "ElevenLabs → approval → Sync"}
        </span>
      </div>
      <div className="replay-toolbar">
        <button aria-label="Restart package replay" onClick={() => jump(0)}>
          <RotateCcw size={15} />
        </button>
        <button
          aria-label="Previous package step"
          disabled={cursor === 0}
          onClick={() => jump(cursor - 1)}
        >
          <ArrowLeft size={15} />
        </button>
        <button
          className="replay-play"
          onClick={() => {
            if (cursor === steps.length - 1) setCursor(0);
            setPlaying(!playing);
          }}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}{" "}
          {playing ? "Pause replay" : "Play story"}
        </button>
        <button
          aria-label="Next package step"
          disabled={cursor === steps.length - 1}
          onClick={() => jump(cursor + 1)}
        >
          <ArrowRight size={15} />
        </button>
        <label className="replay-scrubber">
          <span>
            Step {cursor + 1} / {steps.length}
          </span>
          <input
            aria-label="Package replay step"
            type="range"
            min="0"
            max={steps.length - 1}
            value={cursor}
            onChange={(e) => jump(Number(e.target.value))}
          />
        </label>
        <span className="replay-clock">+{timeLabel(span.end - job.born)}</span>
      </div>
      <div className="replay-graph">
        <ReactFlowProvider>
          <Graph
            snap={snap}
            replay={state}
            selected={span.stage}
            running={false}
            lens="queue"
            setSelected={(id) => {
              const index = steps.findIndex((s) => s.stage === id);
              if (index >= 0) jump(index);
            }}
          />
        </ReactFlowProvider>
      </div>
      <div className="replay-legend">
        <span>
          <i /> Selected step
        </span>
        <span>Select a node to read its explanation below</span>
        <span>Muted nodes are outside this output trace</span>
      </div>
      <div className="replay-commentary" aria-live="polite" aria-atomic="true">
        <div className="replay-step-number">
          {String(cursor + 1).padStart(2, "0")}
        </div>
        <div>
          <span className="eyebrow">
            {["dub", "lipsync"].includes(span.stage)
              ? `ATTEMPT ${span.attempt} / `
              : ""}
            {timeLabel(span.start)} → {timeLabel(span.end)}
          </span>
          <h3>
            {note.stage?.name}
            {span.segmentIndex != null && (
              <small className="replay-chunk">
                {" "}
                · chunk {span.segmentIndex + 1}
              </small>
            )}
          </h3>
          <p>
            <Terms>{note.text}</Terms>
          </p>
          <div className="replay-facts">
            <span>
              <b>{note.duration}s</b> processing
            </span>
            <span>
              <b>{note.wait == null ? "Unrecorded" : `${note.wait}s`}</b> queue
              / backoff
            </span>
            <span>
              <Terms>{note.stage?.tool}</Terms>
            </span>
          </div>
        </div>
      </div>
      <details className="replay-contract">
        <summary>Inspect this stage’s proposed contract</summary>
        <div>
          <p>
            <b>Input</b> {note.stage?.input}
          </p>
          <p>
            <b>Output</b> {note.stage?.output}
          </p>
          <p>{note.stage?.decision}</p>
          <small>
            Reference design contract; the browser replays simulated timing and
            outcomes.
          </small>
        </div>
      </details>
      <div className="replay-spans" aria-label="Recorded package spans">
        {steps.map((s, index) => (
          <button
            key={s.index}
            aria-pressed={cursor === index}
            onClick={() => jump(index)}
          >
            <span>{index + 1}</span>
            {traceCommentary(job, s, steps).stage?.short}
            {["dub", "lipsync"].includes(s.stage) && s.attempt > 1
              ? ` · retry ${s.attempt - 1}`
              : ""}
            <small>{s.end - s.start}s</small>
          </button>
        ))}
      </div>
      <p className="replay-disclosure">
        Recorded completion order. Parallel spans retain their original
        timestamps. Replay pacing is illustrative; the live simulation runs
        independently. Select another outcome to follow a different package.
      </p>
    </section>
  );
}
