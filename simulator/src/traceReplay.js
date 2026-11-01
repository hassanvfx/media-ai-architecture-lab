import { stageInfo } from "./workload.js";
import { STAGES, CONNECTIONS } from "./catalog.js";

// Replay recorded spans in completion order; parallel branches are not serialized.
export function traceSteps(job) {
  return (job?.path || [])
    .map((span, index) => ({ ...span, index }))
    .sort((a, b) => a.end - b.end || a.start - b.start || a.index - b.index);
}
export function traceState(job, steps, cursor) {
  const current = steps[cursor];
  const time = current?.end ?? job.born;
  const seen = new Set(steps.slice(0, cursor + 1).map((s) => s.stage));
  const route = new Set(steps.map((s) => s.stage));
  return {
    config: { plan: job.plan || (job.clipRatio < 100 ? "highlights" : "full") },
    current: current?.stage,
    seen,
    route,
    time,
    edges: new Set(
      [...CONNECTIONS, ["prepare", "clips"]]
        .filter(
          ([a, b]) =>
            route.has(a) &&
            route.has(b) &&
            !(a === "qc" && b === "publish" && route.has("review")) &&
            !(a === "prepare" && b === "clips" && route.has("asr")),
        )
        .map(([a, b]) => `${a}-${b}`),
    ),
    cached: route.has("clips") && !route.has("asr") && !route.has("vision"),
    states: Object.fromEntries(
      STAGES.map((n) => {
        const spans = steps.filter((s) => s.stage === n.id);
        const state =
          n.id === current?.stage
            ? "At this step"
            : spans.some((s) => s.start < time && s.end > time)
              ? "In parallel"
              : seen.has(n.id)
                ? "Completed"
                : route.has(n.id)
                  ? "Upcoming"
                  : "Outside this trace";
        return [n.id, state];
      }),
    ),
  };
}
export function traceCommentary(job, span, steps) {
  const stage = stageInfo(
    STAGES.find((n) => n.id === span.stage),
    { plan: job.plan || (job.clipRatio < 100 ? "highlights" : "full") },
  );
  const has = (id) => steps.some((s) => s.stage === id);
  const laterAttempt = steps.some(
    (s) => s.stage === "tts" && s.attempt > span.attempt,
  );
  const notes = {
    ingest: `${job.sourceMinutes?.toFixed(1) ?? "unrecorded"} minutes of source media entered as ${job.asset}. Shared source work happens once before any locale-specific processing.`,
    policy:
      job.status === "rights hold" && !has("prepare")
        ? "Admission stopped this package because its rights were revoked. No normalization or model work followed."
        : "This package passed the simulated admission rights check and continued to normalization. Delivery will require another rights check.",
    prepare:
      has("clips") && !has("asr")
        ? "A version-matched analysis cache hit bypassed both speech and visual analysis. The package continued directly to editorial planning."
        : "Normalization completed. Speech and visual analysis were dispatched as parallel branches; editorial planning waits for both results.",
    asr: "The speech-analysis branch completed. Its transcript evidence joins the visual branch before editorial planning; span timing shows whether the other branch is still running.",
    vision:
      "The visual-analysis branch completed. The workflow joins both analysis results before choosing the edit plan, preserving shared source lineage.",
    clips: `${job.plan === "full" ? "The full program was retained" : "Selected source intervals were grouped into a highlight plan"}. The localization plan produced ${job.languages} language branches. This replay follows ${job.locale?.toUpperCase() || "the source"}; sibling locales are separate traces. Catalog indexing is dispatched independently and is not recorded in this delivery trace.`,
    translate: `The ${job.locale?.toUpperCase()} branch completed translation and timing. The ${job.minutes?.toFixed(1)} ${job.plan === "full" ? "full-program" : "selected highlight"} output minutes continue to voice synthesis.`,
    tts: laterAttempt
      ? `Speech attempt ${span.attempt} failed. The package returned to the speech queue for a bounded retry; the next attempt's wait includes backoff and queueing.`
      : job.status === "retry budget exhausted"
        ? `Speech attempt ${span.attempt} exhausted the retry budget. The package was quarantined without entering quality evaluation or publication.`
        : `Speech attempt ${span.attempt} completed using ${span.model || job.model || "the recorded"} profile${(span.fallback ?? job.fallback) ? " through the fallback provider" : ""}. The generated speech proceeds to timing alignment and audio mixing before quality evaluation.`,
    mix: "The translated speech was placed on the program timeline and the modeled audio-mixing stage completed. In production, this step requires segment timestamps and clean music-and-effects stems; excessive timing changes must trigger adaptation instead of blindly stretching speech. The simulator records timing and cost, not a rendered soundtrack.",
    qc: `The synthetic quality score was ${job.score?.toFixed(1) ?? "unrecorded"}${job.qualityThreshold != null ? ` against a threshold of ${job.qualityThreshold}` : ""}. ${has("review") ? "This package was routed to editorial review instead of direct publication." : "This package took the automated publication path."} This score is illustrative, not a measured media-quality result.`,
    review:
      job.status === "editorial rejection"
        ? "Editorial review rejected this output. The simulation quarantined the package; there is no publication span."
        : "Editorial review approved this output. Human service time and queueing add to delivery latency and operating cost.",
    publish:
      job.status === "rights hold"
        ? "The final rights check blocked publication, even though transformation work had completed. The package ended on rights hold."
        : `The final rights check passed and ${job.minutes?.toFixed(1)} minutes were accepted for ${job.locale?.toUpperCase()}. End-to-end elapsed time: ${((job.ended - job.born) / 60).toFixed(1)} minutes.`,
  };
  return {
    stage,
    text: notes[span.stage] || stage?.purpose,
    wait:
      span.queuedAt == null ? null : Math.max(0, span.start - span.queuedAt),
    duration: span.end - span.start,
  };
}
