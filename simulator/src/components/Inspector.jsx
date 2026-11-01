import React, { useState } from "react";
import {
  Activity,
  ArrowUpRight,
  ExternalLink,
  ShieldCheck,
  X,
} from "lucide-react";
import { HelpLabel, Terms } from "./Help.jsx";
import { stageInfo } from "../workload.js";
import { STAGES, PROFILES } from "../catalog.js";
import { $ } from "../utils.js";
import { Icon, Slider, Toggle } from "./ui.jsx";
export default function Inspector({ id, snap, onClose, onConfigure }) {
  const [tab, setTab] = useState("design");
  const original = STAGES.find((x) => x.id === id);
  const n = stageInfo(original, snap.config);
  const s = snap.stages[id];
  return (
    <aside className="inspector">
      <div className="inspector-top">
        <span>COMPONENT DETAIL</span>
        <button
          className="icon-button inspector-close"
          onClick={onClose}
          aria-label="Close inspector"
        >
          <X size={16} />
        </button>
        <span className="mono">
          {String(STAGES.indexOf(original) + 1).padStart(2, "0")} /{" "}
          {STAGES.length}
        </span>
      </div>
      <div className={"inspector-icon " + n.kind}>
        <Icon name={n.icon} size={25} />
      </div>
      <h2>
        <HelpLabel label={n.name} details={n.purpose} />
      </h2>
      <p className="inspector-desc">
        <Terms>{n.purpose}</Terms>
      </p>
      <div className="stage-metrics">
        <div>
          <strong>{s.queue}</strong>
          <span>queued</span>
        </div>
        <div>
          <strong>
            {s.active}
            <small>/{s.capacity}</small>
          </strong>
          <span>active slots</span>
        </div>
        <div>
          <strong>
            {$(s.age, 1)}
            <small>m</small>
          </strong>
          <span>oldest wait</span>
        </div>
      </div>
      <div className="small-tabs">
        {["design", "contract", "tuning"].map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "design" ? (
        <>
          <section className="detail-section">
            <h3>
              Suggested stack <ExternalLink size={12} />
            </h3>
            {n.stack.map(([tool, why, url]) => (
              <a
                className="tool-card"
                key={tool}
                href={url}
                target="_blank"
                rel="noreferrer"
              >
                <span>
                  {tool}
                  <ArrowUpRight size={14} />
                </span>
                <small>{why}</small>
              </a>
            ))}
          </section>
          <section className="detail-section">
            <h3>Architecture decision</h3>
            <p>
              <Terms>{n.decision}</Terms>
            </p>
          </section>
          <section className="detail-section">
            <h3>Failure boundary</h3>
            <p>
              <Terms>{n.failure}</Terms>
            </p>
          </section>
          <div className="watch-metrics">
            <Activity size={14} />
            <span>{n.metric}</span>
          </div>
        </>
      ) : tab === "contract" ? (
        <>
          <section className="detail-section">
            <h3>Input contract</h3>
            <code className="contract">{n.input}</code>
            <h3>Output contract</h3>
            <code className="contract">{n.output}</code>
          </section>
          <section className="detail-section">
            <h3>Implementation sketch</h3>
            <pre>{n.code}</pre>
            <p className="muted">
              Illustrative pseudocode; the browser simulates this stage.
            </p>
          </section>
          <div className="contract-note">
            <ShieldCheck size={16} />
            <span>
              Every stage carries tenant_id, asset_id, model version and a trace
              identifier.
            </span>
          </div>
        </>
      ) : (
        <>
          <section className="detail-section">
            <h3>Live controls</h3>
            {id === "tts" ? (
              <>
                <Slider
                  label="Speech slots"
                  value={snap.config.gpu}
                  min={1}
                  max={24}
                  onChange={(v) => onConfigure({ gpu: v })}
                />
                <Toggle
                  label="Approved fallback"
                  value={snap.config.fallback}
                  onChange={(v) => onConfigure({ fallback: v })}
                />
                <Toggle
                  label="Primary outage"
                  value={snap.config.outage}
                  onChange={(v) => onConfigure({ outage: v })}
                />
              </>
            ) : id === "qc" ? (
              <Slider
                label="Acceptance threshold"
                value={snap.config.quality}
                min={50}
                max={99}
                onChange={(v) => onConfigure({ quality: v })}
              />
            ) : id === "review" ? (
              <Slider
                label="Reviewers"
                value={snap.config.reviewers}
                min={0}
                max={16}
                onChange={(v) => onConfigure({ reviewers: v })}
              />
            ) : id === "prepare" ? (
              <Slider
                label="CPU slots per stage"
                value={snap.config.cpu}
                min={1}
                max={24}
                onChange={(v) => onConfigure({ cpu: v })}
              />
            ) : id === "policy" ? (
              <Toggle
                label="Revoke license cohort"
                hint="20% of incoming asset identities"
                value={snap.config.revoked}
                onChange={(v) => onConfigure({ revoked: v })}
              />
            ) : (
              <Slider
                label="Catalog input"
                value={snap.config.arrival}
                min={0}
                max={4800}
                step={60}
                suffix="h/day"
                onChange={(v) => onConfigure({ arrival: v })}
              />
            )}
            <p>
              Parameter changes affect new admissions or future stage starts.
              Work already in flight keeps its sampled service time.
            </p>
          </section>
          <section className="detail-section">
            <h3>Service-time assumption</h3>
            <pre>
              {id === "tts"
                ? `2s + output_minutes × 60 × ${snap.config.outage ? 0.85 : PROFILES[snap.config.model].rtf}`
                : `${n.fixed}s + media_minutes × 60 × ${n.rtf}`}
              <br />× seeded jitter [0.8, 1.2]
            </pre>
            <p>
              These are editable experiment assumptions, not vendor benchmarks.
              See Model notes for scope and limitations.
            </p>
          </section>
        </>
      )}
    </aside>
  );
}
