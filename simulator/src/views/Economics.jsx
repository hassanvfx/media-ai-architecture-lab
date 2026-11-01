import React, { useState } from "react";
import { ArrowDown, GitBranch, Wallet } from "lucide-react";
import { $, timeLabel } from "../utils.js";

import { compareProfiles } from "../engine.js";
import { Chart } from "../components/ui.jsx";
export default function Economics({ snap, baseline }) {
  const [comparison, setComparison] = useState(null);
  const m = snap.metrics;
  const entries = Object.entries(snap.costs);
  return (
    <div className="workspace-view">
      <div className="view-title">
        <div>
          <span className="eyebrow">COST / QUALITY TRADEOFF</span>
          <h2>Unit economics & model strategy</h2>
          <p>Retries, idle capacity and human review stay in the numerator.</p>
        </div>
        <Wallet size={32} />
      </div>
      <div className="comparison-intro">
        <div>
          <h3>Compare three model strategies on the same workload</h3>
          <p>
            Admit 30 minutes of current demand, then drain each pipeline for up
            to 3 additional hours. Primary providers healthy; rights revocation
            off. Same seed and input dimensions.
          </p>
        </div>
        <button
          className="primary-button"
          onClick={() => setComparison(compareProfiles(snap.config))}
        >
          <GitBranch size={15} />
          Run controlled comparison
        </button>
      </div>
      {comparison && (
        <div className="strategy-comparison">
          {comparison.map((r) => (
            <article key={r.model}>
              <span className="eyebrow">{r.name}</span>
              <strong>
                {r.unitCost == null ? "—" : "$" + $(r.unitCost, 3)}
                <small>/ accepted min</small>
              </strong>
              <div>
                <span>Accepted output</span>
                <b>{$(r.accepted, 1)} min</b>
              </div>
              <div>
                <span>First-pass yield</span>
                <b>{$(r.yield, 1)}%</b>
              </div>
              <div>
                <span>Batch makespan</span>
                <b>{$(r.time / 60, 1)} min</b>
              </div>
              <div>
                <span>Unfinished tasks</span>
                <b>{r.pending}</b>
              </div>
              <p>
                {r.pending
                  ? "Incomplete: do not compare unit cost as a drained run."
                  : "Fully drained. Includes all staffed time, retries and rejected work."}
              </p>
            </article>
          ))}
        </div>
      )}
      <div className="analysis-grid">
        <div className="analysis-card">
          <h3>
            Run cost breakdown <span>${$(snap.cost, 2)}</span>
          </h3>
          <div className="cost-stack">
            {entries.map(([k, v], i) => (
              <span
                key={k}
                style={{
                  width: `${(v / Math.max(snap.cost, 0.001)) * 100}%`,
                  background: ["#a7e8be", "#82b5dd", "#dbb87f", "#ae9bdb"][i],
                }}
              />
            ))}
          </div>
          {entries.map(([k, v], i) => (
            <div className="cost-row" key={k}>
              <i
                style={{
                  background: ["#a7e8be", "#82b5dd", "#dbb87f", "#ae9bdb"][i],
                }}
              />
              <span>
                {k === "inference"
                  ? "Variable processing"
                  : k === "compute"
                    ? "Provisioned compute"
                    : k === "review"
                      ? "Staffed human review"
                      : "Packaging & delivery"}
              </span>
              <strong>${$(v, 2)}</strong>
              <small>{$((v / Math.max(snap.cost, 0.001)) * 100)}%</small>
            </div>
          ))}
          <div className="formula">
            <span>All modeled spend</span>
            <ArrowDown size={13} />
            <strong>Accepted output minutes</strong>
            <b>= {m.unitCost == null ? "—" : `$${$(m.unitCost, 3)}`}/min</b>
          </div>
        </div>
        <div className="analysis-card">
          <h3>Capacity and quality</h3>
          <div className="fact-row">
            <span>Admitted source assets</span>
            <b>{snap.assetCount}</b>
          </div>
          <div className="fact-row">
            <span>Delivered derivatives</span>
            <b>{snap.outputs}</b>
          </div>
          <div className="fact-row">
            <span>First-pass gate yield</span>
            <b>{$(m.yield, 1)}%</b>
          </div>
          <div className="fact-row">
            <span>Analysis cache hits</span>
            <b>{snap.cacheHits}</b>
          </div>
          <div className="fact-row">
            <span>Transient retries</span>
            <b>{snap.retries}</b>
          </div>
          <div className="fact-row">
            <span>Quarantined derivatives</span>
            <b>{snap.quarantined}</b>
          </div>
          <div className="fact-row">
            <span>Rights holds / deferred admissions</span>
            <b>
              {snap.denied} / {snap.deferred}
            </b>
          </div>
          <p className="subtle-note">
            Unit cost during warm-up includes work in progress. Compare
            equal-duration, drained runs for a fair model bake-off.
          </p>
        </div>
        <div className="analysis-card wide">
          <Chart
            history={snap.history}
            field="cost"
            unit="USD / accepted output minute"
            label="Unit cost evolution"
          />
        </div>
      </div>
      {baseline && (
        <div className="baseline-comparison">
          <h3>Saved checkpoint vs. current run</h3>
          <p>A point-in-time comparison, not a controlled A/B experiment.</p>
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Checkpoint · {timeLabel(baseline.time)}</th>
                <th>Current · {timeLabel(snap.time)}</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Accepted minutes", baseline.accepted, snap.accepted, 1],
                [
                  "Cost / accepted minute",
                  baseline.metrics.unitCost,
                  m.unitCost,
                  3,
                ],
                ["Observed p95 minutes", baseline.metrics.p95, m.p95, 1],
                ["Queue depth", baseline.metrics.queue, m.queue, 0],
              ].map(([k, a, b, d]) => (
                <tr key={k}>
                  <td>{k}</td>
                  <td>{$(a, d)}</td>
                  <td>{$(b, d)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
