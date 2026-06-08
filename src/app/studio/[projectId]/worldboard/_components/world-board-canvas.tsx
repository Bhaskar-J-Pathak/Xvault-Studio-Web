"use client";

import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  useNodesState,
  useEdgesState,
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  MarkerType,
  Handle,
  Position,
  type Node,
  type Edge,
  type EdgeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { createClient } from "@/lib/supabase";

// ── Relationship edge — label appears on hover only ───────────────────────────

function RelationshipEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, data, markerEnd,
}: EdgeProps) {
  const [hovered, setHovered] = useState(false);
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    borderRadius: 12,
  });

  return (
    <>
      {/* Invisible wider hit area */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ cursor: "default" }}
      />
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{ stroke: hovered ? "#6366f1" : "#94a3b8", strokeWidth: hovered ? 2 : 1.5, transition: "stroke 0.15s" }}
      />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}
            className={`absolute pointer-events-none px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap transition-colors ${
              hovered
                ? "bg-indigo-600 text-white border border-indigo-600"
                : "bg-white text-[#1A1A1A]/50 border border-black/[0.08]"
            }`}
          >
            {data.label as string}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

// ── Entity type styling ───────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, {
  label: string;
  bg:    string;
  border: string;
  text:  string;
}> = {
  character: { label: "Character", bg: "#EDE9FE", border: "#7C3AED", text: "#6D28D9" },
  location:  { label: "Location",  bg: "#D1FAE5", border: "#059669", text: "#047857" },
  faction:   { label: "Faction",   bg: "#DBEAFE", border: "#2563EB", text: "#1D4ED8" },
  item:      { label: "Item",      bg: "#FEF3C7", border: "#D97706", text: "#B45309" },
  event:     { label: "Event",     bg: "#FEE2E2", border: "#DC2626", text: "#B91C1C" },
  lore:      { label: "Lore",      bg: "#CFFAFE", border: "#0891B2", text: "#0E7490" },
};

const FALLBACK_CONFIG = { label: "Entity", bg: "#F3F4F6", border: "#9CA3AF", text: "#6B7280" };

// ── Entity node component ─────────────────────────────────────────────────────

type EntityData = {
  id:           string;
  name:         string;
  type:         string;
  attributes:   Record<string, unknown>;
  confidence:   string;
  onEntityClick: (id: string) => void;
};

function EntityNode({
  data,
  selected,
}: {
  data:     EntityData;
  selected: boolean;
}) {
  const cfg   = TYPE_CONFIG[data.type] ?? FALLBACK_CONFIG;
  const attrs = Object.entries(data.attributes ?? {}).slice(0, 3);

  return (
    <div
      onClick={() => data.onEntityClick(data.id)}
      style={{
        background:  cfg.bg,
        borderLeft:  `3px solid ${cfg.border}`,
        boxShadow:   selected
          ? `0 0 0 2px ${cfg.border}, 0 4px 12px rgba(0,0,0,0.12)`
          : "0 1px 4px rgba(0,0,0,0.10)",
      }}
      className="rounded-xl min-w-[145px] max-w-[185px] px-3 py-2.5 cursor-pointer select-none"
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: cfg.border, width: 6, height: 6 }}
      />

      {/* Type badge */}
      <div
        style={{ color: cfg.text, background: `${cfg.border}1A` }}
        className="inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md mb-1.5"
      >
        {cfg.label}
      </div>

      {/* Name */}
      <p className="text-[13px] font-semibold text-[#1A1A1A] leading-tight mb-1.5 break-words">
        {data.name}
      </p>

      {/* Attributes */}
      {attrs.length > 0 && (
        <div className="space-y-0.5">
          {attrs.map(([k, v]) => (
            <p key={k} className="text-[10px] text-[#1A1A1A]/55 leading-snug truncate">
              <span className="text-[#1A1A1A]/30">{k}: </span>
              {String(v).slice(0, 28)}
            </p>
          ))}
        </div>
      )}

      {data.confidence === "inferred" && (
        <p className="text-[9px] text-[#1A1A1A]/25 mt-1.5 italic">inferred</p>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: cfg.border, width: 6, height: 6 }}
      />
    </div>
  );
}

const nodeTypes = { entity: EntityNode };
const edgeTypes = { relationship: RelationshipEdge };

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DBEntity {
  id:                    string;
  name:                  string;
  type:                  string;
  attributes:            Record<string, unknown>;
  confidence:            string;
  position:              { x: number; y: number } | null;
  first_seen_chapter_id: string | null;
}

interface DBRelationship {
  id:        string;
  source_id: string;
  target_id: string;
  label:     string;
}

interface Props {
  initialEntities:      DBEntity[];
  initialRelationships: DBRelationship[];
  projectId:            string;
  onEntityClick:        (id: string) => void;
}

export interface WorldBoardCanvasHandle {
  updateEntity: (entity: DBEntity) => void;
  deleteEntity: (id: string) => void;
  addEntity:    (entity: DBEntity) => void;
}

// ── Converters ────────────────────────────────────────────────────────────────

function toNode(e: DBEntity, i: number, onEntityClick: (id: string) => void): Node {
  return {
    id:       e.id,
    type:     "entity",
    position: e.position ?? { x: 120 + (i % 5) * 220, y: 100 + Math.floor(i / 5) * 180 },
    data: {
      id:           e.id,
      name:         e.name,
      type:         e.type,
      attributes:   e.attributes ?? {},
      confidence:   e.confidence,
      onEntityClick,
    } satisfies EntityData,
  };
}

function toNodes(entities: DBEntity[], onEntityClick: (id: string) => void): Node[] {
  return entities.map((e, i) => toNode(e, i, onEntityClick));
}

function toEdges(rels: DBRelationship[]): Edge[] {
  return rels.map((r) => ({
    id:        r.id,
    source:    r.source_id,
    target:    r.target_id,
    type:      "relationship",
    markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8", width: 14, height: 14 },
    data:      { label: r.label },
  }));
}

// ── All entity types for the filter bar ──────────────────────────────────────

const ALL_TYPES = ["character", "location", "faction", "item", "event", "lore"] as const;

// ── Main canvas component ─────────────────────────────────────────────────────

const WorldBoardCanvas = forwardRef<WorldBoardCanvasHandle, Props>(function WorldBoardCanvas(
  { initialEntities, initialRelationships, projectId: _projectId, onEntityClick },
  ref
) {
  const [nodes, setNodes, onNodesChange] = useNodesState(toNodes(initialEntities, onEntityClick));
  const [edges, ,          onEdgesChange] = useEdgesState(toEdges(initialRelationships));

  // Type visibility filter
  const [visibleTypes, setVisibleTypes] = useState<Set<string>>(new Set(ALL_TYPES));

  const toggleType = useCallback((type: string) => {
    setVisibleTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        if (next.size > 1) next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  const filteredNodes = useMemo(
    () => nodes.filter((n) => visibleTypes.has((n.data as EntityData).type)),
    [nodes, visibleTypes]
  );

  // Debounced position save
  const positionTimers = useRef<Record<string, NodeJS.Timeout>>({});

  const onNodeDragStop = useCallback(
    (_e: React.MouseEvent, node: Node) => {
      if (positionTimers.current[node.id]) {
        clearTimeout(positionTimers.current[node.id]);
      }
      positionTimers.current[node.id] = setTimeout(async () => {
        const supabase = createClient();
        await supabase
          .from("entities")
          .update({ position: node.position })
          .eq("id", node.id);
      }, 1200);
    },
    []
  );

  // ── Imperative handle ───────────────────────────────────────────────────────

  useImperativeHandle(ref, () => ({
    updateEntity(entity: DBEntity) {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === entity.id
            ? {
                ...n,
                data: {
                  id:           entity.id,
                  name:         entity.name,
                  type:         entity.type,
                  attributes:   entity.attributes ?? {},
                  confidence:   entity.confidence,
                  onEntityClick,
                } satisfies EntityData,
              }
            : n
        )
      );
    },
    deleteEntity(id: string) {
      setNodes((prev) => prev.filter((n) => n.id !== id));
    },
    addEntity(entity: DBEntity) {
      setNodes((prev) => [...prev, toNode(entity, prev.length, onEntityClick)]);
    },
  }), [onEntityClick, setNodes]);

  // ── Empty state ─────────────────────────────────────────────────────────────

  if (initialEntities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full text-center px-8">
        <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mb-5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.5">
            <circle cx="12" cy="5"  r="2" />
            <circle cx="5"  cy="19" r="2" />
            <circle cx="19" cy="19" r="2" />
            <line x1="12" y1="7" x2="5.5"  y2="17" />
            <line x1="12" y1="7" x2="18.5" y2="17" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-[#1A1A1A] mb-2">
          Your world will build itself
        </h2>
        <p className="text-sm text-[#1A1A1A]/45 max-w-[340px] leading-relaxed">
          Start writing in the editor. After every ~1,500 words, characters, locations,
          factions, and relationships will appear here automatically — at zero cost.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full">
      {/* Type filter bar */}
      <div className="shrink-0 flex items-center gap-1.5 px-4 py-2 border-b border-black/[0.06] bg-white overflow-x-auto">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#1A1A1A]/35 mr-1 shrink-0">
          Show
        </span>
        {ALL_TYPES.map((type) => {
          const cfg    = TYPE_CONFIG[type];
          const active = visibleTypes.has(type);
          const count  = initialEntities.filter((e) => e.type === type).length;
          if (count === 0) return null;
          return (
            <button
              key={type}
              onClick={() => toggleType(type)}
              style={active ? { background: `${cfg.border}18`, color: cfg.text, borderColor: `${cfg.border}40` } : {}}
              className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                active
                  ? "border-transparent"
                  : "border-black/[0.08] text-[#1A1A1A]/40 hover:text-[#1A1A1A]/60"
              }`}
            >
              <span
                style={{ background: active ? cfg.border : "#9CA3AF" }}
                className="w-1.5 h-1.5 rounded-full"
              />
              {cfg.label}s
              <span className="opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* React Flow canvas */}
      <div className="flex-1" style={{ minHeight: 0 }}>
        <ReactFlow
          nodes={filteredNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.25 }}
          minZoom={0.15}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#e2e8f0"
          />
          <Controls
            style={{ bottom: 24, right: 24, left: "auto", top: "auto" }}
            showInteractive={false}
          />
        </ReactFlow>
      </div>
    </div>
  );
});

export default WorldBoardCanvas;
