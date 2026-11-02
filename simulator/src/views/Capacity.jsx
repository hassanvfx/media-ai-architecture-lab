import React from "react";
import { capacityPlan, planningWorkload } from "../engine.js";
import { HelpLabel } from "../components/Help.jsx";
import { $ } from "../utils.js";
export default function Capacity({ snap }) {
  const rows = capacityPlan(snap.config),
    work = planningWorkload(snap.config);
  return (
    <div className="workspace-view">
      <div className="view-title">
        <div>
          <span className="eyebrow">
            EXTERNAL JOB LIMITS / APPLICATION WORKERS / HUMAN WORK
          </span>
          <h2>Plan for chunk amplification and both review gates.</h2>
          <p>
            One long source becomes multiple chunks × destination languages,
            followed by one complete-program review per language.
          </p>
        </div>
      </div>
      <div className="capacity-summary">
        <div>
          <span>
            <HelpLabel label="Source hours received" />
          </span>
          <strong>
            {$(snap.config.arrival)}
            <small>hours / day</small>
          </strong>
        </div>
        <div>
          <span>Estimated chunks per source</span>
          <strong>{$(work.meanChunks, 1)}</strong>
        </div>
        <div>
          <span>Destination languages</span>
          <strong>{snap.config.languages}</strong>
        </div>
        <div>
          <span>Stages above 75% modeled use</span>
          <strong>
            {rows.filter((row) => row.utilization > 0.75).length}
            <small> / {rows.length}</small>
          </strong>
        </div>
      </div>
      <div className="capacity-table-wrap">
        <table className="capacity-table">
          <thead>
            <tr>
              {[
                "Processing stage",
                "Tasks / hour",
                "Mean service",
                "Slots available",
                "Offered utilization",
                "Slots at 75%",
              ].map((label) => (
                <th key={label}>
                  <HelpLabel label={label} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className={row.utilization > 1 ? "overloaded" : ""}
              >
                <td>
                  <span className={`resource-tag ${row.kind}`}>
                    {row.kind === "human"
                      ? "HUMAN"
                      : row.kind === "api"
                        ? "PROVIDER"
                        : "APP"}
                  </span>
                  <strong>
                    <HelpLabel label={row.name} />
                  </strong>
                </td>
                <td>{$(row.taskRate, 1)}</td>
                <td>{$(row.serviceSeconds / 60, 1)} min</td>
                <td>{row.slots}</td>
                <td>
                  {Number.isFinite(row.utilization)
                    ? `${$(row.utilization * 100)}%`
                    : "BLOCKED"}
                </td>
                <td>{row.required}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="planning-note">
        <div>
          <h3>Planning is not permission to proceed.</h3>
          <p>
            Provider slots are configured job allowances; application slots are
            workers. Human slots are planned reviewers per gate. Human service
            effort is estimated from media minutes plus one minute of
            per-decision overhead. The live simulator waits for explicit user
            decisions regardless of these capacity estimates.
          </p>
          <p>
            Chunk counts come from 512 deterministic sample manifests.
            Downstream load assumes {snap.config.expectedApproval}% independent
            audio acceptance per chunk; reassembly requires every chunk. Final
            review assumes {snap.config.expectedFinalApproval}% program
            acceptance. The estimate excludes retry/revision overhead and rights
            denials, and is not a provider latency benchmark.
          </p>
        </div>
      </div>
    </div>
  );
}
