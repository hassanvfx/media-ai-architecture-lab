import React, { useState } from "react";
import { ArrowRight, ChevronDown, Film, GitBranch, Globe2 } from "lucide-react";
import {
  CATALOG_MIXES,
  DESTINATIONS,
  durationSummary,
  selectedShare,
} from "../workload.js";
import { HelpLabel, Terms } from "./Help.jsx";

export default function ProcessOverview({
  config,
  sources,
  onFollow,
  onConfigure,
}) {
  const [expanded, setExpanded] = useState(null);
  const duration = durationSummary(config);
  const highlights = config.plan === "highlights";
  const selected = 30 * selectedShare(config);
  const destinations = DESTINATIONS.slice(0, config.languages).map(
    ([, name]) => name,
  );
  const phases = [
    [
      "Receive & check",
      "An English-language video arrives. Read its actual duration and format; check usage rights and permission to generate translated voices.",
    ],
    [
      "Understand the source",
      "Normalize the media, transcribe speech, identify speaker turns and analyze visual scenes in parallel. Reuse compatible previous analysis when available.",
    ],
    [
      highlights ? "Select highlight segments" : "Prepare the full program",
      highlights
        ? "Propose shorter, meaningful intervals from the source. The selected-source share is a total duration budget, not a number of clips. The simulation aggregates these intervals into one work package per language."
        : "Keep the complete source timeline. Prepare dialogue and timing for localization; no highlight extraction or shortening is requested.",
    ],
    [
      "Translate & generate voice",
      `Create a separate work branch for each destination language (${destinations.join(", ")}). Translate the dialogue, fit it to the timing, then synthesize the translated speech. A production dub also needs alignment and mixing with the original music and effects; the alignment-and-mixing stage models that worker time and cost. Actual audio processing remains a production implementation.`,
    ],
    [
      "Check & review",
      "Evaluate the generated result. Outputs below the quality threshold wait for a human decision; approved results continue, rejected results stop.",
    ],
    [
      "Package & release",
      "Recheck rights, then prepare the localized delivery package. The production design targets video with translated audio and timed text; this simulator models processing and outcomes rather than rendering those files.",
    ],
  ];
  return (
    <section className="process-overview" aria-label="What this pipeline does">
      <div className="process-intro">
        <div>
          <span className="eyebrow">WHAT ARE WE DOING?</span>
          <h2>
            {highlights
              ? "Create highlights, then dub them into other languages."
              : "Dub complete videos into other languages."}
          </h2>
          <p>
            Dubbing replaces the spoken dialogue with translated speech. The
            video’s source language is <b>English</b>; the destination languages
            are <b>{destinations.join(", ")}</b>.
          </p>
        </div>
        <button className="small-outline" onClick={onFollow}>
          <GitBranch size={16} /> Follow one video
        </button>
      </div>
      <div
        className="localization-plans"
        role="group"
        aria-label="Localization plan"
      >
        <button
          aria-pressed={!highlights}
          onClick={() => onConfigure({ plan: "full" })}
        >
          <Film size={20} />
          <span>
            <b>Dub full programs</b>
            <small>Keep the entire source duration.</small>
          </span>
        </button>
        <button
          aria-pressed={highlights}
          onClick={() =>
            onConfigure({
              plan: "highlights",
              clipRatio: config.clipRatio === 100 ? 20 : config.clipRatio,
            })
          }
        >
          <Film size={20} />
          <span>
            <b>Create & dub highlights</b>
            <small>Select shorter source segments first.</small>
          </span>
        </button>
      </div>
      <p className="plan-change-note">
        Plan changes apply to newly arriving videos. Packages already in
        progress keep their captured plan.
      </p>
      <div className="process-example">
        <span className="example-label">WORKED EXAMPLE</span>
        <span>
          <b>30 min</b> English video
        </span>
        <ArrowRight size={15} />
        <span>
          <b>{selected.toFixed(selected % 1 ? 1 : 0)} min</b>{" "}
          {highlights ? "selected highlights" : "complete program"}
        </span>
        <ArrowRight size={15} />
        <span>
          <b>{config.languages}</b> destination languages
        </span>
        <ArrowRight size={15} />
        <span>
          <b>{(selected * config.languages).toFixed(1)} min</b> planned dubbed
          output
        </span>
      </div>
      <p className="process-example-note">
        {highlights
          ? "A clip means a selected interval from the original video—for example, 02:10–03:00. This model tracks total highlight minutes, not individual clip boundaries."
          : "One source video produces one localized full-program work package per destination language. Translation may need timing adaptation; modeled output duration follows the source timeline."}
      </p>
      <div className="process-phases">
        {phases.map(([title, description], index) => (
          <div key={index}>
            <button
              aria-expanded={expanded === index}
              aria-controls={`process-phase-${index}`}
              onClick={() => setExpanded(expanded === index ? null : index)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <b>{title}</b>
              <ChevronDown size={14} />
            </button>
            <p id={`process-phase-${index}`} hidden={expanded !== index}>
              <Terms>{description}</Terms>
            </p>
          </div>
        ))}
      </div>
      <details className="process-scope">
        <summary>How to read the simulation</summary>
        <p>
          The graph shows one shared source-analysis path, then a branch per
          destination language. The searchable-catalog branch runs
          independently. A node is a processing stage; a queue is work waiting
          for a worker.{" "}
          <b>
            Processing workers and costs are simulated; media files and model
            outputs are not generated here.
          </b>{" "}
          Suggested tools and stage contracts describe a proposed production
          implementation. The model includes synthetic quality scores,
          simplified arrivals and linear processing-time estimates. Audio
          alignment and mixing have a simulated worker stage. Actual audio
          mixing, visual lip synchronization and frame rendering are not
          performed here.
        </p>
      </details>
      <div className="catalog-story">
        <div>
          <Globe2 size={17} />
          <HelpLabel label="Source catalog mix" />
          <span>
            {duration.name} · {duration.min.toFixed(1)}–
            {duration.max.toFixed(0)} min per video · expected mean{" "}
            {duration.mean.toFixed(1)} min
          </span>
        </div>
        <p>
          Each arriving video gets its own duration. Choose a catalog mix in{" "}
          <b>Model inputs</b> to test different customer catalogs; duration is
          an input characteristic, not a transformation setting.
        </p>
        {sources?.length > 0 && (
          <div className="source-examples">
            <span>Recently received:</span>
            {sources.slice(0, 4).map((source) => (
              <span key={source.asset}>
                {source.asset} <b>{source.minutes.toFixed(1)} min</b>
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
