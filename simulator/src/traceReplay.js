import { STAGES, CONNECTIONS } from "./catalog.js";
export function traceSteps(job) {
  const spans = (job?.path || []).map((span, index) => ({ ...span, index }));
  if (job?.status?.startsWith("awaiting ") || job?.status?.startsWith("in "))
    spans.push({
      stage: job.stage,
      start: job._active ? job.startedAt : job.queuedAt,
      end: job.ended,
      queuedAt: job.queuedAt,
      attempt: job.attempt || 1,
      audioVersion: job.audioVersion,
      videoVersion: job.videoVersion,
      segmentIndex: job.segmentIndex,
      inProgress: true,
      waiting: !job._active,
      index: spans.length,
    });
  return spans.sort(
    (a, b) => a.end - b.end || a.start - b.start || a.index - b.index,
  );
}
export function traceState(job, steps, cursor) {
  const current = steps[cursor],
    time = current?.end ?? job.born,
    seen = new Set(steps.slice(0, cursor + 1).map((span) => span.stage)),
    route = new Set(steps.map((span) => span.stage));
  return {
    current: current?.stage,
    seen,
    route,
    time,
    edges: new Set(
      CONNECTIONS.filter(([a, b]) => route.has(a) && route.has(b)).map(
        ([a, b]) => `${a}-${b}`,
      ),
    ),
    states: Object.fromEntries(
      STAGES.map((stage) => [
        stage.id,
        stage.id === current?.stage
          ? "At this step"
          : steps.some(
                (span) =>
                  span.stage === stage.id &&
                  span.start < time &&
                  span.end > time,
              )
            ? "In parallel"
            : seen.has(stage.id)
              ? "Completed"
              : route.has(stage.id)
                ? "Upcoming"
                : "Outside this trace",
      ]),
    ),
  };
}
export function traceCommentary(job, span, steps) {
  const stage = STAGES.find((n) => n.id === span.stage),
    chunk =
      span.segmentIndex != null
        ? `Chunk ${span.segmentIndex + 1}`
        : "This source";
  let text;
  if (span.inProgress) {
    text =
      span.stage === "audio_review"
        ? `Audio v${job.audioVersion} is held for a human decision. Preview the recording in Audio approval. Sync cannot start for this chunk until the current version and content identifier are approved.`
        : span.stage === "final_review"
          ? `All ${job.parts?.length || job.segmentCount} chunks have been reassembled. Video v${job.videoVersion} now waits for a second human decision. It has not been delivered.`
          : `${stage?.name} is ${span.waiting ? "queued" : "in progress"} at this snapshot. This span is unfinished; elapsed time is not a measured completed service time.`;
  } else {
    const notes = {
      ingest: `${job.sourceMinutes?.toFixed(1)} minutes of source video arrived as ${job.asset}. The original is immutable and remains the reference for all ordered chunks and destination languages.`,
      policy:
        job.status === "rights hold" &&
        !steps.some((s) => s.stage === "segment")
          ? "Rights or consent prevented processing before provider spend."
          : "The source passed admission checks for audio translation, voice use and visual modification. Permission must still be valid before Sync and publication.",
      segment: `The complete source was partitioned into ${job.segmentCount || job.segmentManifest?.length} contiguous chunks. ${job.segmentationMode === "scene" ? "Synthetic scene-informed boundaries were used" : "Duration-based boundaries were used"}. This is batching for processing, not selecting highlights or discarding content.`,
      prepare: `${chunk} was normalized and validated for the external providers. Source start/end timestamps remain in the manifest so later outputs can be reassembled correctly.`,
      dub:
        span.outcome === "failed"
          ? `${chunk}: the modeled ElevenLabs request failed. A bounded retry retains the chunk identity; it does not create a human approval.`
          : `${chunk}: ElevenLabs audio v${span.audioVersion} was produced for ${job.locale?.toUpperCase()}. The provider boundary includes transcription/translation and audio dubbing. The result stopped at the mandatory audio-review gate.`,
      audio_review:
        span.decision === "approved"
          ? `${chunk}: ${span.reviewer} explicitly approved audio v${span.audioVersion}. Decision ${span.approvalId} binds that exact audio content identifier and source version. Only this approved recording can proceed to Sync.`
          : span.decision === "changes_requested"
            ? `${chunk}: ${span.reviewer} requested a new audio version. The old version has no release permission; the replacement must be previewed and approved again.`
            : `${chunk}: the audio was rejected. This source/language batch is held and the rejected chunk cannot incur Sync processing.`,
      lipsync:
        span.outcome === "failed"
          ? `${chunk}: the modeled Sync attempt failed. The approved audio is retained; a video-provider error does not require re-dubbing it.`
          : `${chunk}: Sync used the source video interval and approved audio v${span.audioVersion}. The audio approval ID was ${span.approvalId}. This is the separate video+audio API path, without dubParams or a second audio-generation step.`,
      reassemble: `Every required chunk of ${job.asset}/${job.locale?.toUpperCase()} completed. The join verified contiguous source coverage and restored ${job.parts?.length || job.segmentCount} chunks to the original ${job.sourceMinutes?.toFixed(1)}-minute order. The complete video then stopped for final human review.`,
      final_review:
        span.decision === "approved"
          ? `${span.reviewer} approved assembled video v${span.videoVersion}, including continuity, lip movements and soundtrack checks. This second approval binds the assembly and its constituent chunk lineage.`
          : `The assembled video was held after final review. Provider completion did not automatically authorize delivery.`,
      publish:
        job.status === "rights hold"
          ? "The final rights check prevented delivery, despite completed provider work and review."
          : `The complete ${job.minutes?.toFixed(1)}-minute ${job.locale?.toUpperCase()} program was released only after final human approval. The source, ordered chunk outputs, audio decisions and final decision remain linked.`,
    };
    text = notes[span.stage] || stage?.purpose;
  }
  return {
    stage,
    text,
    wait:
      span.queuedAt == null ? null : Math.max(0, span.start - span.queuedAt),
    duration: span.end - span.start,
  };
}
