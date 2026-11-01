import { DEFAULTS, STAGES, PROFILES } from "./catalog.js";

export const clamp = (x, min, max) => Math.min(max, Math.max(min, x));
export function normalizeConfig(input = {}) {
  const c = { ...DEFAULTS, ...input };
  for (const [key, min, max] of [
    ["arrival", 0, 4800],
    ["languages", 1, 12],
    ["sourceMinutes", 1, 30],
    ["clipRatio", 5, 100],
    ["gpu", 1, 24],
    ["cpu", 1, 24],
    ["reviewers", 0, 16],
    ["cache", 0, 90],
    ["quality", 50, 99],
    ["retries", 0, 4],
    ["slo", 1, 60],
    ["seed", 1, 2147483646],
  ])
    c[key] = clamp(
      Number.isFinite(Number(c[key])) ? Number(c[key]) : DEFAULTS[key],
      min,
      max,
    );
  for (const key of ["languages", "gpu", "cpu", "reviewers", "retries", "seed"])
    c[key] = Math.round(c[key]);
  for (const key of ["autoscale", "fallback", "outage", "revoked"])
    c[key] = c[key] === true;
  if (!PROFILES[c.model]) c.model = "balanced";
  return c;
}
export class Simulation {
  constructor(config = {}, warmup = 0) {
    this.reset(config);
    if (warmup) this.advance(warmup);
  }
  reset(config = {}) {
    this.config = normalizeConfig(config);
    this.time = 0;
    this.rng = this.config.seed;
    this.arrivalCredit = 0;
    this.serial = 0;
    this.events = [];
    this.completed = [];
    this.latencies = [];
    this.deliveries = [];
    this.history = [];
    this.joins = new Map();
    this.assetCount = 0;
    this.indexed = 0;
    this.accepted = 0;
    this.outputs = 0;
    this.denied = 0;
    this.quarantined = 0;
    this.deferred = 0;
    this.retries = 0;
    this.firstPass = 0;
    this.qaTotal = 0;
    this.cacheHits = 0;
    this.cost = 0;
    this.costs = { compute: 0, inference: 0, review: 0, delivery: 0 };
    this.scaledGpu = this.config.gpu;
    this.scaleAt = 0;
    this.totals = {};
    this.stages = Object.fromEntries(
      STAGES.map((n) => [
        n.id,
        { queue: [], active: [], finished: 0, busy: 0, capacity: 0 },
      ]),
    );
    this.event(
      "system",
      "Run initialized · deterministic seed " + this.config.seed,
      "info",
    );
  }
  rand() {
    this.rng = (Math.imul(1664525, this.rng) + 1013904223) >>> 0;
    return this.rng / 4294967296;
  }
  event(stage, message, level = "info", job = null) {
    this.events.unshift({
      time: this.time,
      stage,
      message,
      level,
      asset: job?.asset || null,
    });
    this.events = this.events.slice(0, 100);
  }
  configure(patch) {
    const before = this.config;
    this.config = normalizeConfig({ ...before, ...patch });
    if (!this.config.autoscale) this.scaledGpu = this.config.gpu;
    this.scaledGpu = Math.max(this.config.gpu, this.scaledGpu);
    for (const key of Object.keys(patch))
      if (before[key] !== this.config[key])
        this.event(
          "control",
          `${key}: ${before[key]} → ${this.config[key]}`,
          "config",
        );
  }
  enqueue(id, job) {
    job.queuedAt = this.time;
    job.stage = id;
    this.stages[id].queue.push(job);
  }
  capacities() {
    const c = this.config;
    return {
      ingest: 8,
      policy: 12,
      prepare: c.cpu,
      asr: 2,
      vision: 2,
      clips: 6,
      index: 6,
      translate: 8,
      tts: c.outage && !c.fallback ? 0 : this.scaledGpu,
      qc: c.cpu,
      review: c.reviewers,
      publish: 6,
    };
  }
  duration(id, j) {
    const n = STAGES.find((n) => n.id === id);
    const c = this.config;
    const p = PROFILES[c.model];
    let dur = n.fixed + (j.output ? j.minutes : j.sourceMinutes) * 60 * n.rtf;
    if (id === "tts") dur = 2 + j.minutes * 60 * (c.outage ? 0.85 : p.rtf);
    if (id === "review") dur = 180;
    return Math.max(1, dur * (0.8 + 0.4 * this.rand()));
  }
  charge(type, value) {
    this.costs[type] += value;
    this.cost += value;
  }
  start(id, j) {
    const c = this.config;
    const duration = this.duration(id, j);
    const n = STAGES.find((n) => n.id === id);
    j.attempt = (j.attempt || 0) + 1;
    j.startedAt = this.time;
    j.finishAt = this.time + duration;
    j.work = duration;
    if (id === "tts") {
      j.model = c.model;
      j.mean = c.outage ? 90 : PROFILES[c.model].mean;
      j.fallback = c.outage && c.fallback;
      this.charge(
        "inference",
        j.minutes * (j.fallback ? 0.18 : PROFILES[c.model].cost),
      );
    } else if (id !== "review")
      this.charge(
        id === "publish" ? "delivery" : "inference",
        (j.output ? j.minutes : j.sourceMinutes) * n.cost,
      );
    this.stages[id].active.push(j);
  }
  next(id, j) {
    j.attempt = 0;
    j.notBefore = 0;
    this.enqueue(id, j);
  }
  terminal(j, status) {
    this.completed.unshift({ ...j, status, ended: this.time });
    this.completed = this.completed.slice(0, 120);
  }
  finish(id, j) {
    const c = this.config;
    const s = this.stages[id];
    s.finished++;
    j.path = [
      ...j.path,
      {
        stage: id,
        start: j.startedAt,
        end: this.time,
        attempt: j.attempt,
        queuedAt: j.queuedAt,
        ...(id === "tts" ? { model: j.model, fallback: j.fallback } : {}),
      },
    ];
    if (id === "tts") {
      // In-flight primary calls fail during an outage. Already-routed fallback calls remain valid.
      const failed = (c.outage && !j.fallback) || this.rand() < 0.025;
      if (failed) {
        if (j.attempt <= c.retries) {
          this.retries++;
          j.notBefore =
            this.time +
            Math.min(60, 5 * 2 ** (j.attempt - 1)) * (0.7 + this.rand() * 0.6);
          this.enqueue(id, j);
          this.event(
            id,
            `${j.asset} · transient failure, retry ${j.attempt}/${c.retries}`,
            "warn",
            j,
          );
        } else {
          this.quarantined++;
          this.terminal(j, "retry budget exhausted");
          this.event(
            id,
            `${j.asset} · retry budget exhausted → quarantine`,
            "error",
            j,
          );
        }
        return;
      }
    }
    if (id === "ingest") this.next("policy", j);
    else if (id === "policy") {
      if (c.revoked && j.restricted) {
        this.denied++;
        this.terminal(j, "rights hold");
        this.event(
          id,
          `${j.asset} · revoked license, transformation blocked`,
          "warn",
          j,
        );
      } else this.next("prepare", j);
    } else if (id === "prepare") {
      if (this.rand() < c.cache / 100) {
        this.cacheHits++;
        this.next("clips", j);
        this.event(
          "prepare",
          `${j.asset} · version-matched analysis cache hit`,
          "success",
          j,
        );
      } else {
        this.joins.set(j.asset, {});
        this.next("asr", { ...j, path: [...j.path] });
        this.next("vision", { ...j, path: [...j.path] });
      }
    } else if (id === "asr" || id === "vision") {
      const join = this.joins.get(j.asset) || {};
      join[id] = j;
      this.joins.set(j.asset, join);
      if (join.asr && join.vision) {
        j.path = [
          ...join.asr.path,
          ...join.vision.path.filter((p) => p.stage === "vision"),
        ];
        this.joins.delete(j.asset);
        this.next("clips", j);
      }
    } else if (id === "clips") {
      this.next("index", { ...j, path: [...j.path] });
      for (let lang = 0; lang < j.languages; lang++)
        this.next("translate", {
          ...j,
          id: `${j.asset}-${lang}`,
          output: true,
          locale: [
            "en",
            "es",
            "fr",
            "de",
            "pt",
            "ja",
            "ko",
            "it",
            "ar",
            "hi",
            "nl",
            "zh",
          ][lang],
          minutes: (j.sourceMinutes * j.clipRatio) / 100,
          path: [...j.path],
        });
      this.event(
        id,
        `${j.asset} · edit plan committed → ${j.languages} locales`,
        "info",
        j,
      );
    } else if (id === "index") this.indexed++;
    else if (id === "translate") this.next("tts", j);
    else if (id === "tts") this.next("qc", j);
    else if (id === "qc") {
      this.qaTotal++;
      j.qualityThreshold = c.quality;
      j.score = clamp(
        j.mean + (this.rand() + this.rand() + this.rand() - 1.5) * 14,
        0,
        100,
      );
      if (j.score >= c.quality) {
        this.firstPass++;
        this.next("publish", j);
      } else {
        this.next("review", j);
        this.event(
          id,
          `${j.asset}/${j.locale} · score ${j.score.toFixed(1)} < ${c.quality} → review`,
          "warn",
          j,
        );
      }
    } else if (id === "review") {
      if (this.rand() < 0.82) {
        j.reviewed = true;
        this.next("publish", j);
      } else {
        this.quarantined++;
        this.terminal(j, "editorial rejection");
        this.event(
          id,
          `${j.asset}/${j.locale} · editorial rejection → quarantine`,
          "warn",
          j,
        );
      }
    } else if (id === "publish") {
      if (c.revoked && j.restricted) {
        this.denied++;
        this.terminal(j, "rights hold");
        this.event(
          id,
          `${j.asset}/${j.locale} · final rights check blocked delivery`,
          "error",
          j,
        );
        return;
      }
      const latency = this.time - j.born;
      this.accepted += j.minutes;
      this.outputs++;
      this.latencies.push(latency);
      if (this.latencies.length > 5000) this.latencies.shift();
      this.deliveries.push({
        time: this.time,
        minutes: j.minutes,
        latency,
        slo: j.slo,
      });
      this.terminal(j, "delivered");
      this.event(
        id,
        `${j.asset}/${j.locale} · ${j.minutes.toFixed(1)} min accepted in ${(latency / 60).toFixed(1)}m`,
        "success",
        j,
      );
    }
  }
  advance(seconds = 1) {
    for (let t = 0; t < Math.max(0, Math.floor(seconds)); t++) this.tick();
    return this;
  }
  tick() {
    this.time++;
    const c = this.config;
    const pending = Object.values(this.stages).reduce(
      (s, n) => s + n.queue.length + n.active.length,
      0,
    );
    this.arrivalCredit += (c.arrival * 60) / 86400 / c.sourceMinutes;
    while (this.arrivalCredit >= 1 - 1e-9) {
      this.arrivalCredit = Math.max(0, this.arrivalCredit - 1);
      if (pending > 3000 || this.stages.ingest.queue.length > 100) {
        this.deferred++;
        continue;
      }
      const asset = "HU-" + String(++this.serial).padStart(5, "0");
      this.assetCount++;
      this.enqueue("ingest", {
        id: asset,
        asset,
        born: this.time,
        sourceMinutes: c.sourceMinutes,
        languages: c.languages,
        clipRatio: c.clipRatio,
        slo: c.slo,
        restricted: this.rand() < 0.2,
        path: [],
        minutes: 0,
        output: false,
      });
    }
    if (c.autoscale && this.time % 15 === 0) {
      const desired = Math.min(
        c.gpu * 3,
        24,
        Math.max(
          c.gpu,
          Math.ceil(
            (this.stages.tts.queue.length + this.stages.tts.active.length) / 2,
          ),
        ),
      );
      if (desired > this.scaledGpu && !this.scaleAt) {
        this.scaleAt = this.time + 60;
        this.scaleTarget = desired;
        this.event(
          "control",
          `Speech pool requested ${desired} slots · 60s warm-up`,
          "config",
        );
      } else if (desired < this.scaledGpu && this.time % 120 === 0) {
        this.scaledGpu = Math.max(c.gpu, this.scaledGpu - 1);
      }
    }
    if (this.scaleAt && this.time >= this.scaleAt) {
      if (c.autoscale) {
        this.scaledGpu = this.scaleTarget;
        this.event(
          "control",
          `Speech capacity ready · ${this.scaledGpu} slots`,
          "success",
        );
      }
      this.scaleAt = 0;
    }
    const caps = this.capacities();
    // Compute and staffed review capacity are billed while provisioned, including idle time.
    this.charge(
      "compute",
      ((this.scaledGpu + 4) * 2.4 + c.cpu * 2 * 0.12) / 3600,
    );
    this.charge("review", (c.reviewers * 30) / 3600);
    for (const n of STAGES) {
      const s = this.stages[n.id];
      s.capacity = caps[n.id];
      s.busy = s.active.length;
      const done = s.active.filter((j) => j.finishAt <= this.time);
      s.active = s.active.filter((j) => j.finishAt > this.time);
      for (const j of done) this.finish(n.id, j);
      let slot;
      while (
        s.active.length < s.capacity &&
        (slot = s.queue.findIndex(
          (j) => !j.notBefore || j.notBefore <= this.time,
        )) >= 0
      ) {
        const [j] = s.queue.splice(slot, 1);
        this.start(n.id, j);
      }
    }
    this.deliveries = this.deliveries.filter((d) => this.time - d.time <= 3600);
    if (this.time % 10 === 0) {
      const m = this.metrics();
      this.history.push({
        time: this.time,
        throughput: m.throughput,
        queue: m.queue,
        p95: m.p95,
        cost: m.unitCost,
      });
      this.history = this.history.slice(-90);
    }
  }
  metrics() {
    const all = Object.values(this.stages);
    const queue = all.reduce((s, n) => s + n.queue.length, 0);
    const active = all.reduce((s, n) => s + n.active.length, 0);
    const lat = [...this.latencies].sort((a, b) => a - b);
    const p95 = lat.length ? lat[Math.ceil(lat.length * 0.95) - 1] / 60 : null;
    const recent = this.deliveries.filter((d) => this.time - d.time < 300);
    const throughput =
      (recent.reduce((s, d) => s + d.minutes, 0) * 3600) /
      Math.min(Math.max(this.time, 1), 300);
    const ontime = this.deliveries.filter(
      (d) => d.latency <= d.slo * 60,
    ).length;
    const age = Math.max(
      0,
      ...all.map((s) =>
        s.queue.length ? (this.time - s.queue[0].queuedAt) / 60 : 0,
      ),
    );
    const ranked = STAGES.map((n) => ({
      id: n.id,
      queue: this.stages[n.id].queue.length,
      age: this.stages[n.id].queue.length
        ? (this.time - this.stages[n.id].queue[0].queuedAt) / 60
        : 0,
    })).sort((a, b) => b.age - a.age || b.queue - a.queue);
    return {
      queue,
      active,
      p95,
      throughput,
      age,
      unitCost: this.accepted ? this.cost / this.accepted : null,
      attainment: this.deliveries.length
        ? (100 * ontime) / this.deliveries.length
        : null,
      yield: this.qaTotal ? (this.firstPass / this.qaTotal) * 100 : null,
      bottleneck: ranked[0]?.queue ? ranked[0].id : null,
    };
  }
  snapshot() {
    return {
      time: this.time,
      config: { ...this.config },
      metrics: this.metrics(),
      accepted: this.accepted,
      outputs: this.outputs,
      cost: this.cost,
      costs: { ...this.costs },
      assetCount: this.assetCount,
      indexed: this.indexed,
      denied: this.denied,
      quarantined: this.quarantined,
      deferred: this.deferred,
      retries: this.retries,
      cacheHits: this.cacheHits,
      scaledGpu: this.scaledGpu,
      scaleAt: this.scaleAt,
      stages: Object.fromEntries(
        STAGES.map((n) => {
          const s = this.stages[n.id];
          return [
            n.id,
            {
              queue: s.queue.length,
              active: s.active.length,
              capacity: s.capacity,
              finished: s.finished,
              age: s.queue.length ? (this.time - s.queue[0].queuedAt) / 60 : 0,
              utilization: s.capacity
                ? Math.min(1, s.active.length / s.capacity)
                : 0,
            },
          ];
        }),
      ),
      history: [...this.history],
      events: [...this.events],
      completed: [...this.completed],
    };
  }
}

// Analytical offered load complements the observed queues. It is an unconstrained
// demand model: bottlenecks upstream do not hide required downstream capacity.
export function capacityPlan(config, speechSlots = config.gpu) {
  const c = normalizeConfig(config),
    profile = PROFILES[c.model];
  const jobs = (c.arrival * 60) / 24 / c.sourceMinutes,
    outputJobs = jobs * c.languages;
  const outputMinutes = (c.sourceMinutes * c.clipRatio) / 100;
  const mean = c.outage && c.fallback ? 90 : profile.mean;
  const x = (c.quality - mean) / 14 + 1.5;
  const cdf = clamp(
    [1, -3, 3, -1].reduce((s, a, k) => s + a * Math.max(0, x - k) ** 3, 0) / 6,
    0,
    1,
  );
  const acceptance = 1 - cdf;
  const rates = {
    ingest: jobs,
    policy: jobs,
    prepare: jobs,
    asr: jobs * (1 - c.cache / 100),
    vision: jobs * (1 - c.cache / 100),
    clips: jobs,
    index: jobs,
    translate: outputJobs,
    tts: outputJobs,
    qc: outputJobs,
    review: outputJobs * cdf,
    publish: outputJobs * (acceptance + cdf * 0.82),
  };
  const capacities = {
    ingest: 8,
    policy: 12,
    prepare: c.cpu,
    asr: 2,
    vision: 2,
    clips: 6,
    index: 6,
    translate: 8,
    tts: c.outage && !c.fallback ? 0 : speechSlots,
    qc: c.cpu,
    review: c.reviewers,
    publish: 6,
  };
  return STAGES.map((n) => {
    const localized = ["translate", "tts", "qc", "review", "publish"].includes(
      n.id,
    );
    let duration =
      n.fixed + (localized ? outputMinutes : c.sourceMinutes) * 60 * n.rtf;
    if (n.id === "tts")
      duration = 2 + outputMinutes * 60 * (c.outage ? 0.85 : profile.rtf);
    const offered = (rates[n.id] * duration) / 3600;
    const slots = capacities[n.id];
    return {
      id: n.id,
      name: n.name,
      kind: n.kind,
      taskRate: rates[n.id],
      serviceSeconds: duration,
      offered,
      slots,
      utilization: slots ? offered / slots : offered ? Infinity : 0,
      required: Math.ceil(offered / 0.75),
      capacity: duration ? (slots * 3600) / duration : 0,
    };
  });
}

export function compareProfiles(config) {
  return Object.keys(PROFILES).map((model) => {
    const c = normalizeConfig({
      ...config,
      model,
      outage: false,
      revoked: false,
    });
    const s = new Simulation(c, 1800);
    s.configure({ arrival: 0 });
    while (
      s.time < 12600 &&
      Object.values(s.stages).some((n) => n.queue.length + n.active.length)
    )
      s.advance(1);
    const metrics = s.metrics();
    return {
      model,
      name: PROFILES[model].name,
      time: s.time,
      accepted: s.accepted,
      assets: s.assetCount,
      cost: s.cost,
      yield: metrics.yield,
      p95: metrics.p95,
      unitCost: metrics.unitCost,
      pending: metrics.queue + metrics.active,
      quarantined: s.quarantined,
    };
  });
}
