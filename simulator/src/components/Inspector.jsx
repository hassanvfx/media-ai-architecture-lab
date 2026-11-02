import React, { useState } from "react";
import { ArrowUpRight, X } from "lucide-react";
import { STAGES } from "../catalog.js";
import { HelpLabel, Terms } from "./Help.jsx";
import { Icon } from "./ui.jsx";
export default function Inspector({ id, snap, onClose, onNavigate }) {
  const [tab, setTab] = useState("design"),
    n = STAGES.find((stage) => stage.id === id),
    s = snap.stages[id];
  if (!n) return null;
  return (
    <aside className="inspector">
      <div className="inspector-top">
        <span>STAGE CONTRACT</span>
        <button
          className="icon-button inspector-close"
          aria-label="Close inspector"
          onClick={onClose}
        >
          <X size={17} />
        </button>
        <span>
          {STAGES.indexOf(n) + 1} / {STAGES.length}
        </span>
      </div>
      <div className={`inspector-icon ${n.kind}`}>
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
          <span>waiting</span>
        </div>
        <div>
          <strong>{s.active}</strong>
          <span>
            {n.kind === "human" ? "automatic jobs (none)" : "active jobs"}
          </span>
        </div>
        <div>
          <strong>{s.age.toFixed(1)}m</strong>
          <span>oldest wait</span>
        </div>
      </div>
      {n.kind === "human" && (
        <button
          className="primary-button inspector-review-action"
          onClick={() => onNavigate(id === "audio_review" ? "audio" : "final")}
        >
          Open {id === "audio_review" ? "audio approval" : "final video review"}{" "}
          <ArrowUpRight size={15} />
        </button>
      )}
      <div className="small-tabs">
        {["design", "contract"].map((value) => (
          <button
            className={tab === value ? "active" : ""}
            key={value}
            onClick={() => setTab(value)}
          >
            {value}
          </button>
        ))}
      </div>
      {tab === "design" ? (
        <>
          <section className="detail-section">
            <h3>Verified tools & interfaces</h3>
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
        </>
      ) : (
        <>
          <section className="detail-section">
            <h3>Input contract</h3>
            <code className="contract">{n.input}</code>
            <h3>Output contract</h3>
            <code className="contract">{n.output}</code>
          </section>
          <section className="detail-section">
            <h3>Production integration sketch</h3>
            <pre>{n.code}</pre>
            <p className="muted">
              Illustrative orchestration sketch. Provider details come from
              linked documentation; the browser makes no API calls.
            </p>
          </section>
        </>
      )}
    </aside>
  );
}
