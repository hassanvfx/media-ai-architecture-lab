import React from "react";
import { SOURCES } from "../catalog.js";
import { Terms } from "../components/Help.jsx";
export default function Blueprint() {
  const decisions = [
    [
      "01",
      "Partition, do not summarize",
      "Complete source coverage",
      "Cut the full video before per-chunk normalization, using a hard duration cap or scene-informed boundaries. Retain source intervals and a manifest version. Shot detection is not semantic comprehension.",
      "Tradeoff: smaller chunks increase provider requests and human decisions, while larger chunks approach provider limits.",
    ],
    [
      "02",
      "Let ElevenLabs own the audio pipeline",
      "Managed dubbing boundary",
      "Prepare a source project per chunk, generate target-language audio and retrieve immutable versioned artifacts. Do not duplicate the provider’s internal translation or speech pipeline as mandatory custom stages.",
      "Plan constraint: transcript editing and regeneration features depend on the ElevenLabs account; new-request and revision adapters must honor actual entitlements.",
    ],
    [
      "03",
      "Human audio approval is a hard gate",
      "Exact artifact, explicit decision",
      "Record source version, chunk, language, audio version, content hash, reviewer, checklist and decision. A new recording invalidates the previous approval. A score or timeout never substitutes for a person.",
      "Production requirement: authenticated reviewers, durable decision storage and revocation-aware workflow signals. Browser decisions here are session-local demonstrations.",
    ],
    [
      "04",
      "Sync gets the approved recording",
      "Separate video + audio inputs",
      "Submit the matching source video chunk and exact approved audio to Sync. Preserve the provider job ID and approved artifact lineage. Do not use dubParams, which would regenerate audio inside a combined job.",
      "Operational constraint: provider account concurrency, supported media, duration limits, speaker targeting and frame-based billing require explicit configuration.",
    ],
    [
      "05",
      "Join complete language batches",
      "Ordered reassembly + second human gate",
      "Wait for every required chunk of the source/language batch. Validate order, coverage and audio approvals, then assemble a complete video. Require a second human approval of its exact version and constituent parts.",
      "Failure rule: a missing or rejected chunk blocks the complete program. Final rejection holds the assembly for remediation; it does not silently publish a partial video.",
    ],
    [
      "06",
      "Orchestrate for recoverability",
      "Durable workflow + immutable artifacts",
      "Temporal is a proposed production coordinator for provider activities, joins and human signals. Versioned object storage and a database retain artifact manifests, decisions and logical delivery keys.",
      "Implementation limit: the browser runs a deterministic in-memory model, not Temporal, provider webhooks, durable approval storage or live invoice reconciliation.",
    ],
  ];
  return (
    <div className="workspace-view blueprint">
      <div className="view-title">
        <div>
          <span className="eyebrow">
            SELECTED ARCHITECTURE / SOURCE-VERIFIED INTERFACES
          </span>
          <h2>Two human decisions around external providers.</h2>
          <p>
            The selected flow uses ElevenLabs for dubbed audio and Sync for
            visual lip synchronization, with batch reassembly between the two
            review gates.
          </p>
        </div>
      </div>
      <div className="decision-grid">
        {decisions.map(([number, title, tools, body, trade]) => (
          <article className="decision-card" key={number}>
            <span className="decision-number">{number}</span>
            <h3>{title}</h3>
            <span className="tag">{tools}</span>
            <p>
              <Terms>{body}</Terms>
            </p>
            <div>
              <Terms>{trade}</Terms>
            </div>
          </article>
        ))}
      </div>
      <section className="analysis-card">
        <h3>Verified documentation</h3>
        <div className="operational-grid">
          {[
            [
              "ElevenLabs Dubbing",
              SOURCES.eleven,
              "Project, language target and audio download",
            ],
            [
              "Sync manual dubbing flow",
              SOURCES.sync,
              "Source video + approved external audio",
            ],
            [
              "Sync segments",
              SOURCES.syncSegments,
              "Speaker and time-range targeting",
            ],
            [
              "Sync billing",
              SOURCES.syncBilling,
              "Usage basis and plan-specific rates",
            ],
          ].map(([label, url, detail]) => (
            <a href={url} target="_blank" rel="noreferrer" key={url}>
              {label}
              <small>{detail}</small>
            </a>
          ))}
        </div>
      </section>
      <p className="subtle-note">
        Created and owned by Hassan Uriostegui. Provider capabilities are linked
        to documentation; performance inputs and preview fixtures are not
        production quality evidence.
      </p>
    </div>
  );
}
