export const CATALOG_MIXES = {
  short: {
    name: "Short videos",
    description: "Social videos, promos and short explainers",
    buckets: [
      [0.5, 0.3],
      [2, 0.5],
      [5, 0.2],
    ],
  },
  mixed: {
    name: "Mixed catalog",
    description: "A mix of short videos, interviews and episodes",
    buckets: [
      [2, 0.2],
      [5, 0.4],
      [12, 0.3],
      [30, 0.1],
    ],
  },
  long: {
    name: "Long programs",
    description: "Interviews, lectures and long episodes",
    buckets: [
      [20, 0.2],
      [45, 0.5],
      [90, 0.3],
    ],
  },
};
export const DESTINATIONS = [
  ["es", "Spanish"],
  ["fr", "French"],
  ["de", "German"],
  ["pt", "Portuguese"],
  ["ja", "Japanese"],
  ["ko", "Korean"],
  ["it", "Italian"],
  ["ar", "Arabic"],
  ["hi", "Hindi"],
  ["nl", "Dutch"],
  ["zh", "Mandarin Chinese"],
];
export function durationSummary(config) {
  if (config.durationMode === "fixed")
    return {
      mean: config.sourceMinutes,
      min: config.sourceMinutes,
      max: config.sourceMinutes,
      name: "Fixed-size test input",
    };
  if (config.catalogMix === "custom")
    return {
      mean: (config.minSourceMinutes + config.maxSourceMinutes) / 2,
      min: config.minSourceMinutes,
      max: config.maxSourceMinutes,
      name: "Custom duration range",
    };
  const mix = CATALOG_MIXES[config.catalogMix] || CATALOG_MIXES.mixed;
  return {
    mean: mix.buckets.reduce(
      (sum, [duration, weight]) => sum + duration * weight,
      0,
    ),
    min: mix.buckets[0][0] * 0.8,
    max: mix.buckets.at(-1)[0] * 1.2,
    name: mix.name,
  };
}
export function sampleSourceMinutes(config, random) {
  if (config.durationMode === "fixed") return config.sourceMinutes;
  if (config.catalogMix === "custom")
    return (
      config.minSourceMinutes +
      random() * (config.maxSourceMinutes - config.minSourceMinutes)
    );
  const mix = CATALOG_MIXES[config.catalogMix] || CATALOG_MIXES.mixed;
  const pick = random();
  let cumulative = 0,
    selected = mix.buckets.at(-1)[0];
  for (const [duration, weight] of mix.buckets) {
    cumulative += weight;
    if (pick < cumulative) {
      selected = duration;
      break;
    }
  }
  return selected * (0.8 + random() * 0.4);
}
export function selectedShare(config) {
  return config.plan === "full" ? 1 : config.clipRatio / 100;
}
export function stageName(stage, config) {
  if (stage.id === "clips")
    return config.plan === "full"
      ? "Prepare the full program"
      : "Select highlight segments";
  return stage.name;
}

export function stageInfo(stage, config) {
  if (stage.id !== "clips") return stage;
  if (config.plan === "full")
    return {
      ...stage,
      name: stageName(stage, config),
      short: "Program plan",
      purpose:
        "Keep the full source timeline and prepare dialogue, speakers and timing targets for each destination language. No highlight extraction or shortening is requested.",
      input: "transcript + speaker_turns + source_timeline + visual_events",
      output:
        "full_program_plan · dialogue_segments · speaker_map · timing_targets · language_jobs[]",
      decision:
        "Retain every source interval. Segment dialogue for translation and timing adaptation, then create language-specific work from the shared full-program plan. Do not apply highlight ranking or editorial shortening in this mode.",
      failure:
        "Missing dialogue or invalid timing targets block the plan. Preserve source references so a correction can be retried without changing the complete program timeline.",
      metric:
        "Dialogue coverage · timing-plan validity · source correspondence",
      code: "await join(speech_activity, vision_activity)\nplan = preserve_full_timeline(transcript, speaker_turns, source_timeline)\nvalidate_dialogue_coverage(plan)\nawait fan_out(localize(plan, language) for language in targets)",
    };
  return {
    ...stage,
    name: stageName(stage, config),
    short: config.plan === "full" ? "Program plan" : "Highlights",
    purpose:
      config.plan === "full"
        ? "Keep the full source timeline and prepare a dialogue-and-timing plan for each destination language. This mode does not select or shorten source segments."
        : "Choose coherent source intervals for shorter highlights, then localize the selected material. The simulation represents their aggregate duration, not exact edit boundaries or a clip count.",
  };
}
