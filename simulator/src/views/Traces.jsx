import React, { useEffect, useState } from "react";
import { GitBranch, RefreshCw } from "lucide-react";
import TraceReplay from "../components/TraceReplay.jsx";
export default function Traces({ snap }) {
  const [chosen, setChosen] = useState(null),
    [filter, setFilter] = useState("all");
  const records = [...snap.inFlight, ...snap.completed];
  const list = records.filter(
    (job) => filter === "all" || job.status === filter,
  );
  useEffect(() => {
    if (!chosen && list.length) setChosen(list[0]);
  }, [chosen, list]);
  return (
    <div className="workspace-view package-traces">
      <div className="view-title">
        <div>
          <span className="eyebrow">
            SOURCE → CHUNK AUDIO → APPROVAL → SYNC → ASSEMBLY → FINAL APPROVAL
          </span>
          <h2>Follow a chunk or a complete program.</h2>
          <p>
            Pin a snapshot, then inspect its real simulated stage history. A
            complete-program trace includes the contributing chunks and both
            human gates.
          </p>
        </div>
        <GitBranch size={30} />
      </div>
      <div className="trace-layout">
        <div className="analysis-card trace-list">
          <div className="trace-list-heading">
            <h3>Packages & outcomes</h3>
            <select
              aria-label="Filter traces"
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value);
                setChosen(null);
              }}
            >
              {[
                "all",
                "awaiting audio approval",
                "awaiting final approval",
                "delivered",
                "audio rejected",
                "final video held",
                "provider retry exhausted",
                "rights hold",
              ].map((value) => (
                <option value={value} key={value}>
                  {value === "all" ? "All packages" : value}
                </option>
              ))}
            </select>
          </div>
          {list.slice(0, 50).map((job) => (
            <button
              className={`trace-row ${chosen?.id === job.id ? "selected" : ""}`}
              key={job.id}
              onClick={() => setChosen(job)}
            >
              <span>
                <b>
                  {job.asset} / {job.locale?.toUpperCase()}
                </b>
                <small>
                  {job.segmentIndex != null
                    ? `Chunk ${job.segmentIndex + 1}/${job.segmentCount}`
                    : "Complete program"}{" "}
                  · {job.status}
                </small>
              </span>
            </button>
          ))}
          {!list.length && <p className="empty">No matching package yet.</p>}
        </div>
        <div className="analysis-card trace-detail">
          {chosen ? (
            <>
              <div className="trace-snapshot-note">
                <span>Pinned snapshot · {chosen.status}</span>
                <button
                  onClick={() => {
                    const latest = records.find((job) => job.id === chosen.id);
                    if (latest) setChosen(latest);
                  }}
                >
                  <RefreshCw size={13} /> Refresh selected package
                </button>
              </div>
              <TraceReplay
                key={`${chosen.id}-${chosen.ended}-${chosen.audioVersion}-${chosen.videoVersion}`}
                job={chosen}
                snap={snap}
              />
            </>
          ) : (
            <p className="empty">
              The first language package appears after chunk preparation.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
