import { Terms } from "../components/Help.jsx";
import React from "react";
import { Activity, BookOpen, Database, Layers3, Workflow } from "lucide-react";

export default function Blueprint() {
  return (
    <div className="workspace-view blueprint">
      <div className="view-title">
        <div>
          <span className="eyebrow">TECHNICAL STRATEGY</span>
          <h2>Architecture decisions & alternatives</h2>
          <p>
            <Terms>
              {
                "A proposed reference architecture for media transformation at catalog scale."
              }
            </Terms>
          </p>
        </div>
        <BookOpen size={32} />
      </div>
      <div className="blueprint-callout">
        <Workflow size={25} />
        <div>
          <h3>Control plane owns decisions. Data plane moves media.</h3>
          <p>
            <Terms>
              {
                "Temporal persists workflow history and coordinates activities. Object storage holds immutable artifacts. Independently bounded CPU, GPU, API and reviewer pools execute each stage."
              }
            </Terms>
          </p>
        </div>
      </div>
      <div className="decision-grid">
        {[
          [
            "01",
            "Durability before orchestration cleverness",
            "Temporal + transactional manifests",
            "Use durable activity boundaries, stable logical identifiers and segment checkpoints. An agent can propose a plan; deterministic code controls rights, spend and delivery.",
            "Alternative: Step Functions for an AWS-centered system; compare execution limits, economics and operational ownership.",
          ],
          [
            "02",
            "Swappable models, stable contracts",
            "Provider adapters + versioned evals",
            "Treat each provider as an implementation behind a typed contract. Run a paired bake-off on representative multilingual slices before routing production work.",
            "Tradeoff: abstraction must preserve provider-specific capabilities, reconciliation IDs and billing semantics.",
          ],
          [
            "03",
            "Scale the constrained resource",
            "Kubernetes + KEDA + Triton",
            "Queue age and pending media minutes reveal overload better than CPU alone. Separate speech, vision, decode, encode and external-provider budgets.",
            "Tradeoff: GPU warm-up, device availability and batch waiting time can dominate tail latency.",
          ],
          [
            "04",
            "Quality is a product contract",
            "Deterministic checks + calibrated review",
            "Combine format, silence and sync verification with meaning, naturalness and editorial rubrics. Human review is an explicit finite service station.",
            "Tradeoff: stricter gates can improve output confidence while consuming reviewer capacity and deadline budget.",
          ],
          [
            "05",
            "Rights propagate through lineage",
            "OPA + tenant-scoped storage + audit",
            "Carry consent, territory and allowed transformation metadata. Revalidate at transfer and delivery; invalidate derivatives and indexes on revocation.",
            "Tradeoff: previously published media requires a separate takedown and reconciliation process; a gate alone is insufficient.",
          ],
          [
            "06",
            "Measure useful completion",
            "OpenTelemetry + acceptance cost ledger",
            "Trace every stage, join provider request IDs, and record all spend—including rejected work—against accepted output minutes.",
            "Tradeoff: completed-only latency is biased during overload. Inspect pending age alongside p95 and deadline attainment.",
          ],
        ].map(([num, title, tools, body, trade]) => (
          <article className="decision-card" key={num}>
            <span className="decision-number">{num}</span>
            <h3>{title}</h3>
            <span className="tag">{tools}</span>
            <p>{body}</p>
            <div>{trade}</div>
          </article>
        ))}
      </div>
      <div className="analysis-card">
        <h3>Cross-cutting operational plane</h3>
        <div className="operational-grid">
          <a
            href="https://docs.temporal.io/workflows"
            target="_blank"
            rel="noreferrer"
          >
            <Workflow />
            Temporal<small>Durable workflow history</small>
          </a>
          <a
            href="https://opentelemetry.io/docs/concepts/signals/traces/"
            target="_blank"
            rel="noreferrer"
          >
            <Activity />
            OpenTelemetry<small>Traces, metrics, logs</small>
          </a>
          <a
            href="https://keda.sh/docs/2.18/scalers/aws-sqs/"
            target="_blank"
            rel="noreferrer"
          >
            <Layers3 />
            KEDA<small>Queue-driven capacity</small>
          </a>
          <a
            href="https://www.postgresql.org/docs/current/ddl-rowsecurity.html"
            target="_blank"
            rel="noreferrer"
          >
            <Database />
            PostgreSQL<small>Manifest and audit ledger</small>
          </a>
        </div>
      </div>
      <p className="subtle-note">
        <Terms>
          {
            "Created and owned by Hassan Uriostegui. An independent reference architecture for catalog-scale media AI systems."
          }
        </Terms>
      </p>
    </div>
  );
}
