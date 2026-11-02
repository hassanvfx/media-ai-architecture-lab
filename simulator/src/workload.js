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
export function selectedShare() {
  return 1;
}
export function stageName(stage) {
  return stage.name;
}
export function stageInfo(stage) {
  return stage;
}

// A partition of the entire source, not highlight selection. Scene boundaries
// are synthetic in this browser model; a production detector supplies timestamps.
export function segmentSource(sourceMinutes, mode, maxMinutes, random) {
  const total = sourceMinutes * 60,
    limit = maxMinutes * 60,
    chunks = [];
  let start = 0;
  while (start < total - 1e-7) {
    const length = mode === "scene" ? limit * (0.5 + 0.5 * random()) : limit;
    const end = Math.min(total, start + length);
    chunks.push({
      index: chunks.length,
      start,
      end,
      minutes: (end - start) / 60,
    });
    start = end;
  }
  return chunks;
}
export function validCoverage(parts, sourceMinutes) {
  const sorted = [...parts].sort((a, b) => a.start - b.start);
  let end = 0;
  for (const part of sorted) {
    if (Math.abs(part.start - end) > 1e-6 || part.end <= part.start)
      return false;
    end = part.end;
  }
  return sorted.length > 0 && Math.abs(end - sourceMinutes * 60) < 1e-6;
}
