"use client";

import { useEffect, useMemo } from "react";
import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Roadmap } from "@/lib/schema";
import { computeLayout, isLocked } from "@/lib/layout";
import { PHASE_HEX, TYPE_ICON, TYPE_LABEL, type Status } from "@/lib/types";

type StepData = {
  id: string;
  label: string;
  type: string;
  weeks: number;
  phase: number;
  state: "known" | "done" | "locked" | "open";
  selected: boolean;
  onPick: (id: string) => void;
};

const STATE_TEXT = { known: "already known", done: "completed", locked: "locked", open: "available" };

function StepNode({ data }: NodeProps<Node<StepData>>) {
  return (
    <>
      <Handle type="target" position={Position.Left} isConnectable={false} />
      <button
        type="button"
        className={`sn ${data.state}${data.selected ? " sel" : ""}`}
        style={{ "--c": `var(--p${data.phase % 5})` } as React.CSSProperties}
        onClick={() => data.onPick(data.id)}
        aria-label={`${data.label}, ${TYPE_LABEL[data.type] ?? "Step"}, ${STATE_TEXT[data.state]}`}
      >
        <span className="ic" aria-hidden="true">{TYPE_ICON[data.type] ?? "◆"}</span>
        <span className="tx">
          <b>{data.label}</b>
          <small>
            {data.weeks} wk{data.state === "done" ? " · ✓ done" : data.state === "known" ? " · ★ known" : ""}
          </small>
        </span>
      </button>
      <Handle type="source" position={Position.Right} isConnectable={false} />
    </>
  );
}

const nodeTypes = { step: StepNode };

type Props = {
  roadmap: Roadmap;
  status: Record<string, Status>;
  selected: string | null;
  onPick: (id: string) => void;
};

function Inner({ roadmap, status, selected, onPick }: Props) {
  const { fitView } = useReactFlow();

  const { nodes, edges } = useMemo(() => {
    const pos = computeLayout(roadmap.nodes, status);
    const ids = new Set(roadmap.nodes.map((n) => n.id));
    const by = new Map(roadmap.nodes.map((n) => [n.id, n] as const));

    const nodes: Node<StepData>[] = roadmap.nodes.map((n) => {
      const st = status[n.id];
      const state: StepData["state"] = st ?? (isLocked(n, status, ids) ? "locked" : "open");
      return {
        id: n.id,
        type: "step",
        position: pos[n.id] ?? { x: 0, y: 0 },
        draggable: false,
        selectable: false,
        focusable: false,
        data: { id: n.id, label: n.label, type: n.type, weeks: n.weeks, phase: n.phase, state, selected: selected === n.id, onPick },
      };
    });

    const edges: Edge[] = [];
    for (const n of roadmap.nodes) {
      if (status[n.id]) continue; // cleared steps sit in base camp without incoming lines
      for (const r of n.requires) {
        const src = by.get(r);
        if (!src) continue;
        const lit = Boolean(status[r]);
        edges.push({
          id: `${r}->${n.id}`,
          source: r,
          target: n.id,
          animated: lit,
          className: lit ? "lit" : "dim",
          style: { stroke: `var(--p${src.phase % 5})`, strokeWidth: lit ? 2.8 : 2 },
        });
      }
    }
    return { nodes, edges };
  }, [roadmap, status, selected, onPick]);

  useEffect(() => {
    const t = setTimeout(() => fitView({ duration: 700, padding: 0.18 }), 150);
    return () => clearTimeout(t);
  }, [roadmap, status, fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      minZoom={0.2}
      maxZoom={2.2}
      fitView
      fitViewOptions={{ padding: 0.18 }}
    >
      <Background gap={28} size={1.3} />
      <Controls showInteractive={false} />
      <MiniMap pannable zoomable ariaLabel="Roadmap overview" nodeColor={(n) => PHASE_HEX[((n.data as StepData).phase ?? 0) % 5]} />
    </ReactFlow>
  );
}

export default function RoadmapMap(props: Props) {
  return (
    <div className="flow" role="group" aria-label="Interactive career roadmap. Drag to pan, scroll or pinch to zoom, press Tab then Enter on a step to open it.">
      <ReactFlowProvider>
        <Inner {...props} />
      </ReactFlowProvider>
    </div>
  );
}
