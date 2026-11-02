import React, { useEffect, useRef, useState } from "react";
import {
  Check,
  Headphones,
  Play,
  Pause,
  Upload,
  ShieldCheck,
  Video,
  ArrowRight,
} from "lucide-react";
import { HelpLabel, Terms } from "../components/Help.jsx";
import { DESTINATIONS } from "../workload.js";
import { $, timeLabel } from "../utils.js";
const SAMPLE_LOCALES = new Set(["es", "fr", "de"]);
export default function ReviewRoom({
  gate,
  snap,
  onDecision,
  onAttach,
  previews,
  onNavigate,
}) {
  const detailRef = useRef(null);
  const audio = gate === "audio",
    items = audio ? snap.pendingAudio : snap.pendingFinal;
  const [selected, setSelected] = useState(null),
    [reviewer, setReviewer] = useState("Demo reviewer");
  useEffect(() => {
    if (!items.some((job) => job.id === selected))
      setSelected(items[0]?.id || null);
  }, [items, selected]);
  const job = items.find((job) => job.id === selected) || items[0];
  const scrollToReview = () =>
    requestAnimationFrame(() =>
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  const decide = (...args) => {
    const result = onDecision(...args);
    scrollToReview();
    return result;
  };
  return (
    <div className="workspace-view review-room">
      <div className="view-title">
        <div>
          <span className="eyebrow">
            {audio
              ? "GATE 1 / BEFORE ANY SYNC JOB"
              : "GATE 2 / BEFORE DELIVERY"}
          </span>
          <h2>
            {audio
              ? "Listen first. Approve the exact audio."
              : "Review the complete, reassembled video."}
          </h2>
          <p>
            {audio
              ? "Each chunk and language has a versioned recording. Approve, request a new audio version or reject it; nothing bypasses this gate."
              : "All chunks must finish lip sync and be reassembled in source order. A second human decision releases the complete program."}
          </p>
        </div>
        {audio ? <Headphones size={30} /> : <Video size={30} />}
      </div>
      <div className="review-gate-summary">
        <span>
          <b>{items.length}</b> awaiting {audio ? "audio" : "final"} approval
        </span>
        <span>
          <b>{snap.config.reviewers}</b> planned reviewers per gate
        </span>
        <span>
          {audio
            ? "Sync has no access to unapproved audio."
            : "Delivery has no access to unapproved final video."}
        </span>
      </div>
      <div className="approval-layout">
        <aside className="analysis-card approval-queue">
          <h3>{audio ? "Audio packages" : "Assembled programs"}</h3>
          {items.slice(0, 120).map((candidate) => (
            <button
              key={candidate.id}
              className={candidate.id === job?.id ? "selected" : ""}
              onClick={() => {
                setSelected(candidate.id);
                scrollToReview();
              }}
            >
              <span>
                <b>{candidate.asset}</b>
                <small>
                  {DESTINATIONS.find(
                    ([code]) => code === candidate.locale,
                  )?.[1] || candidate.locale}{" "}
                  ·{" "}
                  {audio
                    ? `chunk ${candidate.segmentIndex + 1}/${candidate.segmentCount}`
                    : `${candidate.parts.length} ordered ${candidate.parts.length === 1 ? "chunk" : "chunks"}`}
                </small>
              </span>
              <span>
                {audio
                  ? candidate.minutes.toFixed(1)
                  : candidate.sourceMinutes.toFixed(1)}
                m
                <small>
                  v{audio ? candidate.audioVersion : candidate.videoVersion}
                </small>
              </span>
            </button>
          ))}
          {!items.length && (
            <p className="empty">
              {audio
                ? "No audio is waiting. Continue the simulation to prepare more chunks."
                : "No complete program is ready yet. Every chunk of a language batch must finish Sync first."}
            </p>
          )}
          {items.length > 120 && (
            <p className="muted">Showing the first 120 packages.</p>
          )}
        </aside>
        <div className="analysis-card approval-detail" ref={detailRef}>
          {job ? (
            <ReviewForm
              key={`${gate}-${job.id}-${audio ? job.audioVersion : job.videoVersion}`}
              gate={gate}
              job={job}
              snap={snap}
              reviewer={reviewer}
              setReviewer={setReviewer}
              onDecision={decide}
              onAttach={onAttach}
              preview={previews[`${gate}:${job.id}`]}
              onNavigate={onNavigate}
            />
          ) : (
            <div className="approval-empty">
              <ShieldCheck size={38} />
              <h3>
                {audio ? "The audio gate is clear." : "Waiting for all chunks."}
              </h3>
              <p>
                {audio
                  ? "Previously approved packages can continue to Sync while new audio is prepared."
                  : "Check batch progress below. Missing, rejected or unfinished chunks prevent partial delivery."}
              </p>
              <button
                className="small-outline"
                onClick={() => onNavigate(audio ? "architecture" : "audio")}
              >
                {audio ? "Follow the pipeline" : "Review pending audio"}
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
      {!audio && (
        <section className="analysis-card assembly-progress">
          <h3>Reassembly batches</h3>
          <p>
            One batch = one original source × one destination language. Partial
            results remain held.
          </p>
          {snap.assemblies.length ? (
            snap.assemblies.slice(0, 30).map((group) => (
              <div
                className="assembly-row"
                key={`${group.asset}-${group.locale}`}
              >
                <b>
                  {group.asset} / {group.locale.toUpperCase()}
                </b>
                <span>
                  {group.complete} / {group.expected} chunks lip-synced
                </span>
                <progress value={group.complete} max={group.expected} />
              </div>
            ))
          ) : (
            <p className="muted">
              No partially completed batch is waiting at the join.
            </p>
          )}
          {snap.blockedBatches?.map((group) => (
            <div
              className="assembly-row held"
              key={`${group.asset}-${group.locale}`}
            >
              <b>
                {group.asset} / {group.locale.toUpperCase()}
              </b>
              <span>
                Held: chunk {group.failedChunk + 1} · {group.reason}
              </span>
            </div>
          ))}
        </section>
      )}
      <section className="analysis-card approval-audit">
        <h3>Human decision trail</h3>
        <p>
          Session-local demo records. Production requires authenticated
          reviewers and durable storage.
        </p>
        {snap.audit
          .filter((record) => record.gate === gate)
          .slice(0, 12)
          .map((record) => (
            <article key={record.id}>
              <span
                className={record.decision === "approved" ? "mint" : "amber"}
              >
                {record.decision.replaceAll("_", " ")}
              </span>
              <b>
                {record.asset} / {record.locale.toUpperCase()}
              </b>
              <span>
                {record.reviewer} · {timeLabel(record.time)} ·{" "}
                {record.gate === "audio"
                  ? `chunk ${record.segmentIndex + 1}/${record.segmentCount} · audio v${record.audioVersion}`
                  : `video v${record.videoVersion}`}
              </span>
              {record.notes && <p>{record.notes}</p>}
            </article>
          ))}
        {!snap.audit.some((record) => record.gate === gate) && (
          <p className="muted">No decisions have been recorded at this gate.</p>
        )}
      </section>
    </div>
  );
}
function ReviewForm({
  gate,
  job,
  snap,
  reviewer,
  setReviewer,
  onDecision,
  onAttach,
  preview,
  onNavigate,
}) {
  const audio = gate === "audio",
    version = audio ? job.audioVersion : job.videoVersion;
  const [played, setPlayed] = useState(false),
    [playing, setPlaying] = useState(false),
    [checks, setChecks] = useState({}),
    [notes, setNotes] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  const player = useRef(),
    fileInput = useRef();
  const local = preview?.version === version ? preview : null,
    reference = !local;
  const src =
    local?.url ||
    (SAMPLE_LOCALES.has(job.locale)
      ? `${import.meta.env.BASE_URL}audio/reference-${job.locale}.${audio ? "mp3" : "mp4"}`
      : null);
  const language =
    DESTINATIONS.find(([code]) => code === job.locale)?.[1] || job.locale;
  const blocked =
    audio &&
    snap.blockedBatches?.some(
      (batch) => batch.asset === job.asset && batch.locale === job.locale,
    );
  const criteria = audio
    ? [
        ["meaning", "Meaning & pronunciation checked"],
        ["voice", "Voice & tone checked"],
        ["timing", "Timing & completeness checked"],
      ]
    : [
        ["continuity", "All chunks in order; no gaps or overlaps"],
        ["lipsync", "Lip movements & faces checked"],
        ["soundtrack", "Complete soundtrack & timing checked"],
      ];
  const canApprove =
    played &&
    criteria.every(([key]) => checks[key]) &&
    reviewer.trim().length >= 2 &&
    snap.config.reviewers > 0 &&
    !blocked &&
    !loading;
  async function attach(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      await onAttach(gate, job.id, file);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  function decide(decision) {
    try {
      onDecision(gate, job.id, {
        decision,
        reviewer,
        notes,
        checks,
        previewPlayed: played,
      });
    } catch (err) {
      setError(err.message);
    }
  }
  async function toggle() {
    try {
      if (player.current.paused) await player.current.play();
      else player.current.pause();
    } catch {
      setError(
        "This preview could not play. Load a supported local audio/video file.",
      );
    }
  }
  return (
    <>
      <div className="approval-package">
        <div>
          <span className="eyebrow">
            {audio
              ? "DUBBED AUDIO / NOT YET SENT TO SYNC"
              : "ASSEMBLED PROGRAM / NOT YET DELIVERED"}
          </span>
          <h3>
            {job.asset} <small>/ {language}</small>
          </h3>
          <p>
            {audio
              ? `Chunk ${job.segmentIndex + 1} of ${job.segmentCount} · ${timeLabel(Math.round(job.segmentStart))}–${timeLabel(Math.round(job.segmentEnd))} source interval`
              : `${job.parts.length} ${job.parts.length === 1 ? "chunk" : "chunks"} restored to the original ${job.sourceMinutes.toFixed(1)}-minute timeline`}
          </p>
        </div>
        <span className="tag">
          {audio ? "Audio" : "Video"} v{version}
        </span>
      </div>
      <div className={`preview-scope ${reference ? "reference" : "local"}`}>
        <b>
          {reference
            ? "REFERENCE PREVIEW / INTERACTION FIXTURE"
            : "LOCAL FILE PREVIEW / STAYS IN THIS BROWSER"}
        </b>
        <p>
          {reference
            ? audio
              ? "The short sample below was synthesized locally for this demo. It is not ElevenLabs output or a translation of this simulated source. Load actual dubbed audio to review your own artifact."
              : "This waveform video is a reference fixture, not a Sync-generated face or an actual assembled program. It exercises the final-review gate. Load a real assembled video to assess visible lip sync."
            : `${local.name} · SHA-256 recorded. Attaching different media creates a new version and resets the review.`}
        </p>
      </div>
      {src ? (
        <div className="media-preview">
          {audio ? (
            <audio
              key={src}
              ref={player}
              src={src}
              controls
              preload="metadata"
              aria-label="Audio preview"
              onPlay={() => {
                setPlayed(true);
                setPlaying(true);
              }}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
              onError={() =>
                setError("Preview unavailable. Load a supported local file.")
              }
            />
          ) : (
            <video
              key={src}
              ref={player}
              src={src}
              controls
              playsInline
              preload="metadata"
              aria-label="Final video preview"
              onPlay={() => {
                setPlayed(true);
                setPlaying(true);
              }}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
              onError={() =>
                setError("Preview unavailable. Load a supported local video.")
              }
            />
          )}
          <button className="small-outline" onClick={toggle}>
            {playing ? <Pause size={15} /> : <Play size={15} />}{" "}
            {playing ? "Pause" : `Play ${audio ? "audio" : "video"} preview`}
          </button>
        </div>
      ) : (
        <p className="empty">
          No bundled {language} reference is provided. Load a local{" "}
          {audio ? "audio" : "video"} file to preview this package.
        </p>
      )}
      <div className="preview-tools">
        <button
          className="small-outline"
          disabled={loading}
          onClick={() => fileInput.current.click()}
        >
          <Upload size={15} />
          {loading
            ? "Preparing preview…"
            : `Load local ${audio ? "audio" : "video"}`}
        </button>
        <input
          ref={fileInput}
          hidden
          type="file"
          accept={
            audio ? "audio/*,.mp3,.wav,.m4a" : "video/mp4,video/webm,.mp4,.webm"
          }
          onChange={attach}
        />
        <span>
          {played
            ? "Preview started · complete the checks below"
            : "Start the preview before approving."}
        </span>
      </div>
      <div className="review-form-fields">
        <label>
          Reviewer name
          <input
            aria-label="Reviewer name"
            value={reviewer}
            maxLength={80}
            onChange={(event) => setReviewer(event.target.value)}
          />
        </label>
        <fieldset>
          <legend>
            {reference ? "Demonstration review checklist" : "Review checklist"}
          </legend>
          {criteria.map(([key, label]) => (
            <label className="review-check" key={key}>
              <input
                type="checkbox"
                checked={Boolean(checks[key])}
                onChange={(event) =>
                  setChecks({ ...checks, [key]: event.target.checked })
                }
              />
              <span>
                {label}
                {reference && (
                  <small>
                    Record a demo check; this fixture is not provider-quality
                    evidence.
                  </small>
                )}
              </span>
            </label>
          ))}
        </fieldset>
        <label>
          Review notes
          <textarea
            aria-label="Review notes"
            placeholder={
              audio
                ? "Required for a revision or rejection. What needs to change?"
                : "Required when holding the final video. Describe the problem."
            }
            maxLength={2000}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
      </div>
      {!snap.config.reviewers && (
        <p className="review-warning">
          No reviewers are staffed in this scenario. Increase planned reviewers
          before approving.
        </p>
      )}
      {blocked && (
        <p className="review-warning">
          This batch is held because another chunk failed or was rejected. Sync
          remains blocked.
        </p>
      )}
      {error && (
        <p role="alert" className="review-warning">
          {error}
        </p>
      )}
      <div className="human-review-actions">
        <button
          className="primary-button"
          disabled={!canApprove}
          onClick={() => decide("approved")}
        >
          <Check size={16} />
          {audio
            ? "Approve audio & simulate Sync"
            : "Approve video & simulate delivery"}
        </button>
        {audio && (
          <button
            className="small-outline"
            onClick={() => decide("changes_requested")}
          >
            Request new audio version
          </button>
        )}
        <button
          className="small-outline danger-action"
          onClick={() => decide("rejected")}
        >
          {audio ? "Reject audio" : "Hold final video"}
        </button>
      </div>
      <div className="approval-boundary">
        <ShieldCheck size={19} />
        <p>
          {audio
            ? `The approval binds audio v${job.audioVersion}, its content identifier, source version and chunk. Approximately $${(job.minutes * 60 * snap.config.syncRate).toFixed(2)} of modeled Sync spend remains blocked until approval.`
            : "The final approval binds this assembly version and every constituent chunk’s source, audio approval and Sync result. Partial batches cannot be delivered."}
        </p>
      </div>
      <details className="approval-artifacts">
        <summary>Inspect version and provider boundary</summary>
        <dl>
          <dt>Source version</dt>
          <dd>{job.sourceVersion}</dd>
          <dt>{audio ? "Audio artifact" : "Video artifact"}</dt>
          <dd>{audio ? job.audioHash : job.videoHash}</dd>
          <dt>Next action</dt>
          <dd>
            {audio
              ? "Sync: source chunk + approved audio; no dubParams"
              : "Publish only this approved assembly"}
          </dd>
        </dl>
        {!audio && (
          <div className="final-parts">
            {job.parts.map((part) => (
              <p key={part.index}>
                Chunk {part.index + 1} · {timeLabel(Math.round(part.start))}–
                {timeLabel(Math.round(part.end))} · audio v{part.audioVersion}{" "}
                approved by {part.audioApproval.reviewer}
              </p>
            ))}
          </div>
        )}
      </details>
      <button
        className="quiet-button"
        onClick={() => onNavigate("architecture")}
      >
        Follow this decision on the graph <ArrowRight size={13} />
      </button>
    </>
  );
}
