import React from "react";
import { Braces, Gauge } from "lucide-react";
import { $ } from "../utils.js";

import { capacityPlan } from "../engine.js";

export default function Capacity({ snap }) {
  const rows = capacityPlan(snap.config, snap.scaledGpu);
  const constrained = rows.filter((r) => r.utilization > 0.75);
  return (
    <div className="workspace-view">
      <div className="view-title">
        <div>
          <span className="eyebrow">OPERATING ENVELOPE</span>
          <h2>Capacity before commitments.</h2>
          <p>
            Unconstrained offered demand reveals downstream requirements before
            upstream bottlenecks hide them.
          </p>
        </div>
        <Gauge size={30} />
      </div>
      <div className="capacity-summary">
        <div>
          <span>Source demand</span>
          <strong>
            {$(snap.config.arrival)}
            <small>hours / day</small>
          </strong>
        </div>
        <div>
          <span>Localized output demand</span>
          <strong>
            {$(
              ((((snap.config.arrival * 60) / 24) * snap.config.clipRatio) /
                100) *
                snap.config.languages,
            )}
            <small>minutes / hour</small>
          </strong>
        </div>
        <div>
          <span>Pools above target utilization</span>
          <strong>
            {constrained.length}
            <small>of {rows.length} stages</small>
          </strong>
        </div>
        <div>
          <span>Planning target</span>
          <strong>
            75<small>% utilization</small>
          </strong>
        </div>
      </div>
      <div className="capacity-table-wrap">
        <table className="capacity-table">
          <thead>
            <tr>
              <th>Processing stage</th>
              <th>Tasks / hour</th>
              <th>Mean service</th>
              <th>Slots available</th>
              <th>Offered utilization</th>
              <th>Slots at 75%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={r.utilization > 1 ? "overloaded" : ""}>
                <td>
                  <span className={"resource-tag " + r.kind}>
                    {r.kind.toUpperCase()}
                  </span>
                  <strong>{r.name}</strong>
                </td>
                <td>{$(r.taskRate, 1)}</td>
                <td>{$(r.serviceSeconds, 1)}s</td>
                <td>{r.slots}</td>
                <td>
                  <div className="util-cell">
                    <span>
                      {Number.isFinite(r.utilization)
                        ? $(r.utilization * 100) + "%"
                        : "BLOCKED"}
                    </span>
                    <i>
                      <b
                        style={{
                          width: `${Math.min(100, r.utilization * 100)}%`,
                        }}
                      />
                    </i>
                  </div>
                </td>
                <td>
                  <b>{r.required}</b>
                  {r.required > r.slots && (
                    <small> +{r.required - r.slots} needed</small>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="planning-note">
        <Braces size={18} />
        <div>
          <h3>Demand × service time ÷ available capacity</h3>
          <p>
            Utilization above 100% implies an unstable queue if that demand
            reaches the stage. This planning model uses mean service times,
            current profile quality distribution, cache reuse and locale
            fan-out. It excludes retry overhead and rights rejections. It is a
            sizing hypothesis to validate with production benchmarks, not a
            capacity guarantee.
          </p>
        </div>
      </div>
    </div>
  );
}
