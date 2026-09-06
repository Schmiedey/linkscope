import {
  SigmaContainer,
  useLoadGraph,
  useRegisterEvents,
  useSetSettings,
  useSigma,
} from "@react-sigma/core";
import Graph from "graphology";
import { useEffect } from "react";
import { CATEGORY_COLORS, EDGE_COLORS, nodeSize } from "@/src/graph/colors";
import { layoutGraph } from "@/src/graph/layouts";
import { useGraphStore } from "@/src/graph/useGraphStore";
import { INFRA_CATEGORIES, TRACKER_CATEGORIES, type ScanGraphSnapshot } from "@/src/types/graph";
import "@react-sigma/core/lib/style.css";

type Props = {
  snapshot: ScanGraphSnapshot;
};

function LoadGraph({ snapshot }: Props) {
  const loadGraph = useLoadGraph();
  const sigma = useSigma();
  const layoutNonce = useGraphStore((state) => state.layoutNonce);

  useEffect(() => {
    const graph = new Graph({ type: "directed", multi: true, allowSelfLoops: false });

    for (const node of snapshot.nodes) {
      graph.addNode(node.domain, {
        label: node.domain,
        size: nodeSize(node.referenceCount, node.isOrigin || node.isSite),
        color: CATEGORY_COLORS[node.category],
        x: 0,
        y: 0,
        category: node.category,
        isOrigin: node.isOrigin,
        isSite: node.isSite,
        referenceCount: node.referenceCount,
      });
    }

    for (const edge of snapshot.edges) {
      if (!graph.hasNode(edge.source) || !graph.hasNode(edge.target)) continue;
      if (!graph.hasEdge(edge.id)) {
        graph.addEdgeWithKey(edge.id, edge.source, edge.target, {
          type: "arrow",
          size: Math.min(4, 0.6 + Math.log2(edge.count + 1)),
          color: EDGE_COLORS[edge.type],
          connectionType: edge.type,
          count: edge.count,
        });
      }
    }

    if (graph.order > 0) {
      layoutGraph(graph);
    }

    loadGraph(graph);
    requestAnimationFrame(() => {
      sigma.getCamera().animatedReset({ duration: 0 });
    });
  }, [loadGraph, snapshot, layoutNonce, sigma]);

  return null;
}

function GraphFx({ snapshot }: Props) {
  const sigma = useSigma();
  const registerEvents = useRegisterEvents();
  const setSettings = useSetSettings();
  const selectedNode = useGraphStore((state) => state.selectedNode);
  const hoveredNode = useGraphStore((state) => state.hoveredNode);
  const enabledTypes = useGraphStore((state) => state.enabledTypes);
  const showLabels = useGraphStore((state) => state.showLabels);
  const searchQuery = useGraphStore((state) => state.searchQuery);
  const thirdPartyOnly = useGraphStore((state) => state.thirdPartyOnly);
  const hideCommonInfra = useGraphStore((state) => state.hideCommonInfra);
  const selectNode = useGraphStore((state) => state.selectNode);
  const setHovered = useGraphStore((state) => state.setHovered);

  useEffect(() => {
    registerEvents({
      clickNode: ({ node }) => selectNode(node),
      clickStage: () => selectNode(null),
      enterNode: ({ node }) => setHovered(node),
      leaveNode: () => setHovered(null),
    });
  }, [registerEvents, selectNode, setHovered]);

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    const focus = selectedNode ?? hoveredNode;
    const graph = sigma.getGraph();

    setSettings({
      labelColor: { color: "#c5d0db" },
      labelRenderedSizeThreshold: showLabels ? 6 : 1000,
      defaultEdgeType: "arrow",
      nodeReducer: (node, data) => {
        const next = { ...data };
        const isSite = Boolean(graph.getNodeAttribute(node, "isSite") || graph.getNodeAttribute(node, "isOrigin"));
        const category = graph.getNodeAttribute(node, "category") as string;
        const hiddenByInfra = hideCommonInfra && !isSite && INFRA_CATEGORIES.has(category as never);
        const hiddenByThird =
          thirdPartyOnly &&
          !isSite &&
          !TRACKER_CATEGORIES.has(category as never);

        let hasVisibleEdge = isSite;
        graph.forEachEdge(node, (edge) => {
          const type = graph.getEdgeAttribute(edge, "connectionType") as keyof typeof enabledTypes;
          if (enabledTypes[type]) hasVisibleEdge = true;
        });

        if (hiddenByInfra || hiddenByThird || (!hasVisibleEdge && !isSite)) {
          next.hidden = true;
          return next;
        }

        const label = String(data.label ?? node);
        const matches = !query || label.includes(query);
        if (query && !matches && focus !== node) {
          next.color = "#1c2733";
          next.label = "";
          next.zIndex = 0;
        }

        if (focus) {
          const neighbor = graph.neighbors(focus).includes(node);
          if (node === focus) {
            next.highlighted = true;
            next.zIndex = 3;
          } else if (neighbor) {
            next.zIndex = 2;
          } else {
            next.color = "#243040";
            next.label = "";
            next.zIndex = 0;
          }
        }

        if (!showLabels) next.label = "";
        return next;
      },
      edgeReducer: (edge, data) => {
        const next = { ...data };
        const type = sigma.getGraph().getEdgeAttribute(edge, "connectionType") as keyof typeof enabledTypes;
        if (!enabledTypes[type]) {
          next.hidden = true;
          return next;
        }
        if (focus) {
          const extremities = sigma.getGraph().extremities(edge);
          if (!extremities.includes(focus)) {
            next.hidden = true;
          } else {
            next.zIndex = 2;
          }
        }
        return next;
      },
    });
  }, [
    enabledTypes,
    hideCommonInfra,
    hoveredNode,
    searchQuery,
    selectedNode,
    setSettings,
    showLabels,
    sigma,
    snapshot.originDomain,
    thirdPartyOnly,
  ]);

  return null;
}

export function GraphCanvas({ snapshot }: Props) {
  return (
    <SigmaContainer
      className="h-full w-full bg-canvas"
      style={{ background: "#07090d" }}
      settings={{
        allowInvalidContainer: true,
        defaultEdgeType: "arrow",
        renderEdgeLabels: false,
        zIndex: true,
        minCameraRatio: 0.08,
        maxCameraRatio: 12,
      }}
    >
      <LoadGraph snapshot={snapshot} />
      <GraphFx snapshot={snapshot} />
    </SigmaContainer>
  );
}
