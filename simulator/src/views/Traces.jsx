import React, { useEffect, useState } from "react";
import { Check, GitBranch, ShieldCheck } from "lucide-react";
import TraceReplay from "../components/TraceReplay.jsx";

export default function Traces({ snap }) {
  const [chosen, setChosen] = useState(() => snap.completed[0] || null);
  const [filter, setFilter] = useState("all");
  const list = snap.completed.filter(
    (j) => filter === "all" || j.status === filter,
  );
  useEffect(() => {
    if (!chosen && list.length) setChosen(list[0]);
  }, [chosen, list]);
  return (
    <div className="workspace-view package-traces">
      <div className="view-title">
        <div>
          <span className="eyebrow">FOLLOW ONE PACKAGE</span>
          <h2>Every handoff. One continuous story.</h2>
          <p>
            Select an outcome, then step through its recorded path with
            commentary, timings and architecture contracts.
          </p>
        </div>
        <GitBranch size={32} />
      </div>
      <div className="trace-layout">
        <div className="analysis-card trace-list">
          <div className="trace-list-heading">
            <h3>Choose a package</h3>
            <select
              aria-label="Filter traces"
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setChosen(null);
              }}
            >
              <option value="all">All outcomes</option>
              <option value="delivered">Delivered</option>
              <option value="rights hold">Rights hold</option>
              <option value="editorial rejection">Rejected</option>
              <option value="retry budget exhausted">Retry exhausted</option>
            </select>
          </div>
          {list.length ? (
            list.slice(0, 35).map((j) => (
              <button
                className={`trace-row ${chosen?.id === j.id ? "selected" : ""}`}
                key={`${j.id}-${j.ended}`}
                onClick={() => setChosen(j)}
              >
                <span>
                  <b>{j.asset}</b>
                  <small>
                    {j.locale?.toUpperCase() || "SOURCE"} · {j.status}
                  </small>
                </span>
                <span className={j.status === "delivered" ? "mint" : "amber"}>
                  {j.status === "delivered" ? (
                    <Check size={15} />
                  ) : (
                    <ShieldCheck size={15} />
                  )}
                  <small>{((j.ended - j.born) / 60).toFixed(1)}m</small>
                </span>
              </button>
            ))
          ) : (
            <p className="empty">
              No matching outcomes yet. Run the simulation to generate traces.
            </p>
          )}
        </div>
        <div className="analysis-card trace-detail">
          {chosen ? (
            <TraceReplay
              key={`${chosen.id}-${chosen.born}-${chosen.ended}`}
              job={chosen}
              snap={snap}
            />
          ) : (
            <p className="empty">
              Your first completed package will appear here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
