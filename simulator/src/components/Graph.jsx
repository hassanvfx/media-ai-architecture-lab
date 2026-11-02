import React, { useEffect, useMemo, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  MarkerType,
  useReactFlow,
} from "@xyflow/react";
import { STAGES, CONNECTIONS } from "../catalog.js";
import { HelpLabel, Terms } from "./Help.jsx";
import { stageInfo } from "../workload.js";
import { Icon } from "./ui.jsx";
function StageNode({ data, selected }) {
  const { stage: n, stats: s, lens, blocked, replay } = data;
  const troubled = s.queue > 8 || blocked;
  let value =
    lens === "queue"
      ? `${s.queue} waiting`
      : lens === "utilization"
        ? `${Math.round(s.utilization * 100)}% utilized`
        : `${s.finished} completed`;
  return (
    <div
      className={`stage-node kind-${n.kind} ${selected ? "selected" : ""} ${troubled ? "strained" : ""} ${blocked ? "blocked" : ""} ${replay ? `replay-node replay-${replay.replaceAll(" ", "-").toLowerCase()}` : ""}`}
    >
      {[
        ["left", Position.Left],
        ["right", Position.Right],
        ["top", Position.Top],
        ["bottom", Position.Bottom],
      ].map(([id, p]) => (
        <React.Fragment key={id}>
          <Handle type="target" position={p} id={"in-" + id} />
          <Handle type="source" position={p} id={"out-" + id} />
        </React.Fragment>
      ))}
      <div className="node-top">
        <span className={"node-icon " + n.kind}>
          <Icon name={n.icon} size={16} />
        </span>
        <span className="node-kind">
          <Terms>{n.kind === "human" ? "HUMAN" : n.kind.toUpperCase()}</Terms>
        </span>
        <span
          className={`status-dot ${blocked ? "red" : s.active ? "green" : ""}`}
        />
      </div>
      <strong>
        <HelpLabel label={n.name} details={n.purpose} />
      </strong>
      <span className="node-tool">
        <Terms>{n.tool}</Terms>
      </span>
      <div className="node-stat">
        <span>
          {replay ||
            (n.kind === "human"
              ? `${s.queue} awaiting decision`
              : blocked
                ? "Provider unavailable"
                : value)}
        </span>
        <span>
          {!replay && (
            <>
              {n.kind === "human" ? (
                "Manual gate"
              ) : (
                <>
                  {s.active}/{s.capacity} <i>jobs</i>
                </>
              )}
            </>
          )}
        </span>
      </div>
      <div
        className="node-load"
        style={replay ? { visibility: "hidden" } : undefined}
      >
        <i style={{ width: `${s.utilization * 100}%` }} />
      </div>
    </div>
  );
}
const nodeTypes = { stage: StageNode };
export default function Graph({
  snap,
  selected,
  setSelected,
  lens,
  running,
  fullscreen,
  replay,
}) {
  const { fitView } = useReactFlow();
  const graphRef = useRef(null);
  useEffect(() => {
    let timer;
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => fitView({ padding: 0.1, duration: 250 }), 120);
    });
    if (graphRef.current) observer.observe(graphRef.current);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [fullscreen, fitView]);
  const nodes = useMemo(
    () =>
      STAGES.map((n) => ({
        id: n.id,
        type: "stage",
        ariaLabel: stageInfo(n, replay?.config || snap.config).name,
        position: { x: n.x, y: n.y },
        selected: selected === n.id,
        data: {
          stage: stageInfo(n, replay?.config || snap.config),
          stats: replay
            ? { queue: 0, active: 0, capacity: 0, utilization: 0, finished: 0 }
            : snap.stages[n.id],
          replay: replay?.states[n.id],
          lens,
          blocked:
            !replay &&
            ((n.id === "dub" && snap.config.dubOutage) ||
              (n.id === "lipsync" && snap.config.syncOutage)),
        },
      })),
    [snap, selected, lens, replay],
  );
  const edges = useMemo(
    () =>
      CONNECTIONS.map(([source, target]) => {
        const a = STAGES.find((n) => n.id === source),
          b = STAGES.find((n) => n.id === target);
        let sh = "right",
          th = "left";
        if (b.x < a.x) {
          sh = "left";
          th = "right";
        }
        if (b.x === a.x) {
          sh = b.y > a.y ? "bottom" : "top";
          th = b.y > a.y ? "top" : "bottom";
        }
        const risk = ["audio_review", "final_review"].includes(target);
        const onRoute = !replay || replay.edges.has(`${source}-${target}`);
        const reached =
          !replay || (replay.seen.has(source) && replay.seen.has(target));
        const color = replay
          ? onRoute && reached
            ? "#16735c"
            : "#b9c5c0"
          : risk
            ? "#c9a978"
            : "#6ba98a";
        return {
          id: source + "-" + target,
          source,
          target,
          sourceHandle: "out-" + sh,
          targetHandle: "in-" + th,
          type: "smoothstep",
          animated: replay
            ? onRoute && target === selected
            : running &&
              (snap.stages[source].active > 0 ||
                snap.stages[target].active > 0),
          style: {
            stroke: color,
            strokeWidth: source === selected || target === selected ? 2.4 : 1.3,
            opacity: replay
              ? onRoute
                ? 1
                : 0.18
              : source === selected || target === selected
                ? 1
                : 0.65,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color,
            width: 15,
            height: 15,
          },
          label:
            source === "prepare" && target === "dub"
              ? `${snap.config.languages} languages / chunk`
              : source === "audio_review"
                ? "approved audio only"
                : source === "final_review"
                  ? "approved program only"
                  : target === "reassemble"
                    ? "wait for all chunks"
                    : undefined,
          labelStyle: {
            fill: "#7a9a88",
            fontSize: 10,
            fontFamily: "monospace",
          },
          labelBgStyle: { fill: "#fafcfc", fillOpacity: 1 },
          labelBgPadding: [6, 4],
          labelBgBorderRadius: 3,
        };
      }),
    [snap, running, selected, replay],
  );
  return (
    <div ref={graphRef} style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={(_, n) => setSelected(n.id)}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        fitView
        fitViewOptions={{ padding: 0.1 }}
        minZoom={0.18}
        maxZoom={1.7}
        colorMode="dark"
      >
        <Background color="#d7e2dc" gap={22} size={1} />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          nodeColor={(n) => (n.selected ? "#67a58a" : "#c6d9ce")}
          maskColor="#f1f7f4bb"
          position="bottom-right"
        />
      </ReactFlow>
    </div>
  );
}
