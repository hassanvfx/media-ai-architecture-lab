import React from "react";
import { Braces, Gauge } from "lucide-react";
import { $ } from "../utils.js";

import { HelpLabel, Terms } from "../components/Help.jsx";
import { selectedShare } from "../workload.js";
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
            <Terms>
              {
                "Unconstrained offered demand reveals downstream requirements before upstream bottlenecks hide them."
              }
            </Terms>
          </p>
        </div>
        <Gauge size={30} />
      </div>
      <div className="capacity-summary">
        <div>
          <span>
            <HelpLabel label="Source demand" />
          </span>
          <strong>
            {$(snap.config.arrival)}
            <small>hours / day</small>
          </strong>
        </div>
        <div>
          <span>
            <HelpLabel label="Localized output demand" />
          </span>
          <strong>
            {$(
              ((snap.config.arrival * 60) / 24) *
                selectedShare(snap.config) *
                snap.config.languages,
            )}
            <small>minutes / hour</small>
          </strong>
        </div>
        <div>
          <span>
            <HelpLabel label="Pools above target utilization" />
          </span>
          <strong>
            {constrained.length}
            <small>of {rows.length} stages</small>
          </strong>
        </div>
        <div>
          <span>
            <HelpLabel label="Planning target" />
          </span>
          <strong>
            75<small>% utilization</small>
          </strong>
        </div>
      </div>
      <div className="capacity-table-wrap">
        <table className="capacity-table">
          <thead>
            <tr>
              <th>
                <HelpLabel label="Processing stage" />
              </th>
              <th>
                <HelpLabel label="Tasks / hour" />
              </th>
              <th>
                <HelpLabel label="Mean service" />
              </th>
              <th>
                <HelpLabel label="Slots available" />
              </th>
              <th>
                <HelpLabel label="Offered utilization" />
              </th>
              <th>
                <HelpLabel label="Slots at 75%" />
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={r.utilization > 1 ? "overloaded" : ""}>
                <td>
                  <span className={"resource-tag " + r.kind}>
                    <Terms>{r.kind.toUpperCase()}</Terms>
                  </span>
                  <strong>
                    <HelpLabel label={r.name} />
                  </strong>
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
            <Terms>
              {
                "Utilization above 100% implies an unstable queue if that demand reaches the stage. This planning model uses mean service times, current profile quality distribution, cache reuse and locale fan-out. It excludes retry overhead and rights rejections. It is a sizing hypothesis to validate with production benchmarks, not a capacity guarantee."
              }
            </Terms>
          </p>
        </div>
      </div>
    </div>
  );
}
