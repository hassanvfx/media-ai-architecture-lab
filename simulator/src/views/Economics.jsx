import React, { useState } from "react";
import { Wallet } from "lucide-react";
import { compareProfiles, planningWorkload } from "../engine.js";
import { SOURCES } from "../catalog.js";
import { HelpLabel } from "../components/Help.jsx";
import { $ } from "../utils.js";
export default function Economics({ snap }) {
  const [comparison, setComparison] = useState(null),
    w = planningWorkload(snap.config);
  return (
    <div className="workspace-view">
      <div className="view-title">
        <div>
          <span className="eyebrow">PROVIDER FEES + TWO HUMAN REVIEWS</span>
          <h2>Pay for audio first. Release video spend deliberately.</h2>
          <p>
            Rejected audio avoids downstream Sync spend. Rejected final video
            still carries provider and review cost already incurred.
          </p>
        </div>
        <Wallet size={30} />
      </div>
      <div className="analysis-grid">
        <div className="analysis-card">
          <h3>Current run: modeled spend</h3>
          {[
            ["dubbing", "ElevenLabs dubbed audio"],
            ["lipsync", "Sync lip-sync video"],
            ["review", "Human audio + final review"],
            ["delivery", "Packaging & delivery"],
            ["app", "Application processing"],
          ].map(([key, label]) => (
            <div className="cost-row" key={key}>
              <span>
                <HelpLabel label={label} />
              </span>
              <strong>${$(snap.costs[key], 2)}</strong>
            </div>
          ))}
          <div className="formula">
            <span>Total estimated spend</span>
            <strong>${$(snap.cost, 2)}</strong>
            <span>
              Complete released programs: {snap.outputs} · {$(snap.accepted, 1)}{" "}
              min
            </span>
            <b>
              {snap.metrics.unitCost == null
                ? "No delivered denominator yet"
                : `$${$(snap.metrics.unitCost, 2)} / delivered minute`}
            </b>
          </div>
          <p className="subtle-note">
            Estimated provider attempt fees are charged at submission, without
            assuming refunds. Human review cost uses the configured effort
            assumption when a decision is recorded. These are not invoices.
          </p>
        </div>
        <div className="analysis-card">
          <h3>Approval changes the spend boundary</h3>
          <div className="fact-row">
            <span>Audio versions approved</span>
            <b>{snap.audioApproved}</b>
          </div>
          <div className="fact-row">
            <span>Audio revisions requested</span>
            <b>{snap.revisions}</b>
          </div>
          <div className="fact-row">
            <span>Audio packages awaiting review</span>
            <b>{snap.pendingAudio.length}</b>
          </div>
          <div className="fact-row">
            <span>Sync jobs submitted</span>
            <b>{snap.syncSubmissions}</b>
          </div>
          <div className="fact-row">
            <span>Assembled programs awaiting final review</span>
            <b>{snap.pendingFinal.length}</b>
          </div>
          <div className="fact-row">
            <span>Final approvals</span>
            <b>{snap.finalApproved}</b>
          </div>
          <p className="subtle-note">
            There is no idle self-hosted GPU pool in this provider-led
            architecture. External concurrency allowances and API usage are
            separate from application workers and human review.
          </p>
        </div>
      </div>
      <div className="comparison-intro">
        <div>
          <h3>Planning estimate across documented Sync models</h3>
          <p>
            Assumed {snap.config.expectedApproval}% approval per chunk audio and{" "}
            {snap.config.expectedFinalApproval}% final acceptance. Estimate:{" "}
            {w.meanChunks.toFixed(1)} chunks per source. All chunks of a
            language must succeed; one rejection can hold the program. This
            analytical estimate never creates live approvals.
          </p>
        </div>
        <button
          className="primary-button"
          onClick={() => setComparison(compareProfiles(snap.config))}
        >
          Calculate planning estimate
        </button>
      </div>
      {comparison && (
        <div className="strategy-comparison">
          {comparison.map((result) => (
            <article key={result.model}>
              <span className="eyebrow">{result.name}</span>
              <strong>
                {result.unitCost == null ? "—" : `$${$(result.unitCost, 2)}`}
                <small> / expected delivered minute</small>
              </strong>
              <div>
                <span>25 fps legacy reference input</span>
                <b>${result.rate}/second</b>
              </div>
              <div>
                <span>Audio + reviews / source-language</span>
                <b>${$(result.dubbing + result.review, 2)}</b>
              </div>
              <div>
                <span>Expected Sync spend / source-language</span>
                <b>${$(result.lipsync, 2)}</b>
              </div>
              <p>
                No quality ranking is inferred from price. Real acceptance,
                processing latency, account discounts, frame rate and invoice
                rules require measurement.
              </p>
            </article>
          ))}
        </div>
      )}
      <p className="subtle-note">
        The estimate samples 512 deterministic source manifests for expected
        chunk counts and independent per-chunk acceptance assumptions. It
        excludes revision loops and failed-provider refunds.{" "}
        <a href={SOURCES.syncBilling} target="_blank" rel="noreferrer">
          Check current account-specific Sync billing ↗
        </a>
      </p>
    </div>
  );
}
