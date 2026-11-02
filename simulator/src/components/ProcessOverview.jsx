import React, { useState } from "react";
import { ArrowRight, ChevronDown, Headphones, Video } from "lucide-react";
import { DESTINATIONS, durationSummary, segmentSource } from "../workload.js";
import { HelpLabel, Terms } from "./Help.jsx";
export default function ProcessOverview({ config, sources, onNavigate }) {
  const [expanded, setExpanded] = useState(null),
    duration = durationSummary(config);
  const targets = DESTINATIONS.slice(0, config.languages).map(
    ([, name]) => name,
  );
  let seed = 42;
  const random = () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const example = segmentSource(
      30,
      config.segmentationMode,
      config.chunkMinutes,
      random,
    ),
    audioJobs = example.length * config.languages;
  const phases = [
    [
      "01",
      "Partition the full source",
      `Create ordered chunks using ${config.segmentationMode === "scene" ? "scene-informed boundaries" : "a duration grid"}, with a maximum of ${config.chunkMinutes} minutes each. This preserves the whole program; it is not highlight extraction. Scene boundaries in the simulator are synthetic.`,
      "segment",
    ],
    [
      "02",
      "Normalize each chunk",
      "Check codec, duration and timestamps, then prepare compatible provider inputs. Keep the source coverage manifest so every output can be returned to the correct interval.",
      "prepare",
    ],
    [
      "03",
      "ElevenLabs creates the audio",
      `Generate a separate dubbed recording for each chunk and destination language: ${targets.join(", ")}. Translation and audio voice generation belong to ElevenLabs Dubbing. Retrieve and version the audio before continuing.`,
      "dub",
    ],
    [
      "04",
      "A person listens and approves",
      "Preview each audio track, check meaning, voice and timing, and record an explicit decision. A revision creates a new audio version. No unapproved version can be submitted to Sync.",
      "audio",
    ],
    [
      "05",
      "Sync changes the lip movements",
      "Send the matching source video chunk and the exact approved audio as separate inputs. Do not use combined automatic dubbing: that would bypass the audio review.",
      "lipsync",
    ],
    [
      "06",
      "Reassemble, then review again",
      "Wait for every chunk in a source/language batch. Restore their original order, verify no source interval is missing, and present the complete video to a person. Only final approval releases delivery.",
      "final",
    ],
  ];
  return (
    <section className="process-overview" aria-label="What this pipeline does">
      <div className="process-intro">
        <div>
          <span className="eyebrow">
            THE SELECTED FLOW / TWO EXPLICIT HUMAN APPROVALS
          </span>
          <h2>Preview the audio before changing the video.</h2>
          <p>
            The input is a complete English-language video. We split it into
            ordered chunks, dub each into <b>{targets.join(", ")}</b>, approve
            the audio, lip-sync the chunks, then reassemble and approve each
            complete localized program.
          </p>
        </div>
        <button className="primary-button" onClick={() => onNavigate("audio")}>
          <Headphones size={16} /> Preview an audio package
        </button>
      </div>
      <div className="provider-flow-story">
        <span>Ordered source chunks</span>
        <ArrowRight size={15} />
        <span className="provider-eleven">ElevenLabs audio</span>
        <ArrowRight size={15} />
        <button onClick={() => onNavigate("audio")}>
          Human audio approval
        </button>
        <ArrowRight size={15} />
        <span className="provider-sync">Sync lip sync</span>
        <ArrowRight size={15} />
        <span>Reassembly</span>
        <ArrowRight size={15} />
        <button onClick={() => onNavigate("final")}>Final human review</button>
      </div>
      <div className="process-example">
        <span className="example-label">30-MINUTE WORKED EXAMPLE</span>
        <span>
          <b>{example.length}</b> ordered chunks
        </span>
        <ArrowRight size={14} />
        <span>
          <b>{audioJobs}</b> audio approval decisions
        </span>
        <ArrowRight size={14} />
        <span>
          up to <b>{audioJobs}</b> Sync jobs
        </span>
        <ArrowRight size={14} />
        <span>
          <b>{config.languages}</b> reassembled programs / final reviews
        </span>
      </div>
      <p className="process-example-note">
        {config.segmentationMode === "scene"
          ? "Illustrative synthetic scene plan."
          : "Duration-based partition."}{" "}
        Chunk cap: {config.chunkMinutes} min. All 30 source minutes are retained
        per language. A rejected or missing chunk holds that language’s complete
        program; successful chunks are not published as a partial result.
      </p>
      <div className="process-phases">
        {phases.map(([num, title, description, target], index) => (
          <div key={num}>
            <button
              aria-expanded={expanded === index}
              aria-controls={`phase-${index}`}
              onClick={() => setExpanded(expanded === index ? null : index)}
            >
              <span>{num}</span>
              <b>{title}</b>
              <ChevronDown size={14} />
            </button>
            <p id={`phase-${index}`} hidden={expanded !== index}>
              <Terms>{description}</Terms>
              <button
                className="inline-process-link"
                onClick={() =>
                  onNavigate(
                    ["audio", "final"].includes(target)
                      ? target
                      : "architecture",
                    ["audio", "final"].includes(target) ? null : target,
                  )
                }
              >
                Inspect this boundary →
              </button>
            </p>
          </div>
        ))}
      </div>
      <details className="process-scope">
        <summary>What is real, and what is simulated?</summary>
        <p>
          ElevenLabs Dubbing and Sync’s separate-video/audio API are real
          documented interfaces. This browser application simulates queues,
          provider timing, chunk joins, decisions and estimated spend; it makes
          no provider requests. Reference previews are clearly labeled fixtures.
          You can attach actual audio/video locally for playback. Source
          clipping, scene detection, lip-sync rendering and reassembly are
          modeled, not performed on media here. Review actions are session-local
          demo decisions; a production system needs authenticated reviewers and
          durable records.
        </p>
      </details>
      <div className="catalog-story">
        <div>
          <HelpLabel label="Source catalog mix" />
          <span>
            {duration.name} · {duration.min.toFixed(1)}–
            {duration.max.toFixed(0)} min per video · expected mean{" "}
            {duration.mean.toFixed(1)} min
          </span>
        </div>
        <p>
          Source length varies with the received catalog. <b>Chunk duration</b>{" "}
          is a separate processing limit; it never changes the length of the
          reassembled program. New settings apply to future arrivals.
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
