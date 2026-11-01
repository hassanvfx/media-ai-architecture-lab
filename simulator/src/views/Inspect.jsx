import React, { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Download,
  Expand,
  Eye,
  Search,
  ShieldCheck,
} from "lucide-react";
import { $, download } from "../utils.js";

import { REVIEW } from "../review.js";

export default function Inspect({ onNavigate }) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("All responsibilities");
  const [proof, setProof] = useState("All evidence");
  const [open, setOpen] = useState(new Set([0]));
  const [reviewed, setReviewed] = useState(() => {
    try {
      return new Set(
        JSON.parse(
          localStorage.getItem("hassan-uriostegui-review-progress") || "[]",
        ).filter((i) => Number.isInteger(i) && i >= 0 && i < REVIEW.length),
      );
    } catch {
      return new Set();
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(
        "hassan-uriostegui-review-progress",
        JSON.stringify([...reviewed]),
      );
    } catch {}
  }, [reviewed]);
  const groups = [...new Set(REVIEW.map((q) => q.group))];
  const filtered = REVIEW.map((q, i) => ({ ...q, i })).filter(
    (q) =>
      (group === "All responsibilities" || q.group === group) &&
      (proof === "All evidence" || q.evidence === proof) &&
      `${q.q} ${q.a} ${q.group}`.toLowerCase().includes(query.toLowerCase()),
  );
  const allOpen = filtered.every((q) => open.has(q.i));
  const exportBrief = () =>
    download(
      "hassan-uriostegui-inspect.md",
      `# Hassan Uriostegui · Architecture inspection\n\nCreated and owned by Hassan Uriostegui. Independent reference proposal. Answers distinguish simulated behavior from design and execution plans.\n\n` +
        REVIEW.map(
          (q, i) =>
            `## ${i + 1}. ${q.q}\n\n**${q.group} · ${q.evidence}**\n\n${q.a}\n\nEvidence: ${q.proof}\n`,
        ).join("\n"),
      "text/markdown",
    );
  return (
    <div className="workspace-view inspect-view">
      <div className="view-title">
        <div>
          <span className="eyebrow">INSPECT</span>
          <h2>Fifty questions. Explicit answers. Inspectable evidence.</h2>
          <p>
            Explore architecture decisions, operating tradeoffs and supporting
            evidence. Proposed decisions are distinguished from implemented
            simulation behavior.
          </p>
        </div>
        <button className="small-outline" onClick={exportBrief}>
          <Download size={15} />
          Export inspection brief
        </button>
      </div>
      <div className="review-summary">
        <div>
          <strong>{REVIEW.length}</strong>
          <span>Architecture questions</span>
        </div>
        <div>
          <strong>{groups.length}</strong>
          <span>Responsibility areas</span>
        </div>
        <div>
          <strong>
            {REVIEW.filter((q) => q.evidence === "Interactive").length}
          </strong>
          <span>With interactive evidence</span>
        </div>
        <div>
          <strong>
            {reviewed.size}
            <small> / {REVIEW.length}</small>
          </strong>
          <span>Marked reviewed by you</span>
        </div>
      </div>
      <div className="review-filterbar">
        <label className="review-search">
          <Search size={17} />
          <input
            type="search"
            aria-label="Search inspection questions"
            placeholder="Search a question, decision or failure mode…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          aria-label="Responsibility area"
          value={group}
          onChange={(e) => setGroup(e.target.value)}
        >
          <option>All responsibilities</option>
          {groups.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
        <select
          aria-label="Evidence type"
          value={proof}
          onChange={(e) => setProof(e.target.value)}
        >
          {["All evidence", "Interactive", "Design", "Execution plan"].map(
            (x) => (
              <option key={x}>{x}</option>
            ),
          )}
        </select>
      </div>
      <div className="review-list-heading">
        <span>
          {filtered.length} questions
          {query || group !== "All responsibilities" || proof !== "All evidence"
            ? " matching your filters"
            : ""}
        </span>
        <button
          onClick={() =>
            setOpen(allOpen ? new Set() : new Set(filtered.map((q) => q.i)))
          }
        >
          {allOpen ? "Collapse answers" : "Expand all answers"}
          <ChevronDown size={14} />
        </button>
      </div>
      <div className="review-list">
        {filtered.map((q) => (
          <article
            className={`review-question ${open.has(q.i) ? "open" : ""}`}
            key={q.i}
          >
            <button
              className="question-toggle"
              aria-expanded={open.has(q.i)}
              onClick={() =>
                setOpen((prev) => {
                  const next = new Set(prev);
                  next.has(q.i) ? next.delete(q.i) : next.add(q.i);
                  return next;
                })
              }
            >
              <span className="question-number">
                {String(q.i + 1).padStart(2, "0")}
              </span>
              <span>
                <small>{q.group}</small>
                <strong>{q.q}</strong>
              </span>
              <span
                className={`evidence-badge ${q.evidence === "Interactive" ? "interactive" : ""}`}
              >
                {q.evidence}
              </span>
              <ChevronDown size={18} />
            </button>
            {open.has(q.i) && (
              <div className="question-answer">
                <p>{q.a}</p>
                <div className="answer-proof">
                  <span>
                    <Eye size={15} />
                    <b>Evidence & scope</b>
                  </span>
                  <p>{q.proof}</p>
                </div>
                <div className="answer-actions">
                  <button
                    className="proof-link"
                    onClick={() => onNavigate(q.target, q.stage)}
                  >
                    {q.target === "architecture"
                      ? "Inspect component"
                      : q.target === "economics"
                        ? "Open model economics"
                        : q.target === "capacity"
                          ? "Open capacity plan"
                          : q.target === "traces"
                            ? "Inspect execution traces"
                            : "Read design rationale"}
                    <ArrowUpRight size={14} />
                  </button>
                  <button
                    className={`review-mark ${reviewed.has(q.i) ? "checked" : ""}`}
                    aria-pressed={reviewed.has(q.i)}
                    onClick={() =>
                      setReviewed((prev) => {
                        const next = new Set(prev);
                        next.has(q.i) ? next.delete(q.i) : next.add(q.i);
                        return next;
                      })
                    }
                  >
                    <Check size={14} />
                    {reviewed.has(q.i) ? "Reviewed" : "Mark reviewed"}
                  </button>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
      {!filtered.length && (
        <p className="empty">
          No questions match these filters. Try a broader search.
        </p>
      )}
      <div className="review-footnote">
        <ShieldCheck size={17} />
        <p>
          Inspect the evidence behind each decision. Answers distinguish simulated
          behavior from proposed design and execution plans; production claims
          require measured results.
        </p>
      </div>
    </div>
  );
}
