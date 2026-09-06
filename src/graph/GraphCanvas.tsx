import cytoscape, { type Core, type Css, type ElementDefinition, type LayoutOptions } from "cytoscape";
import fcose from "cytoscape-fcose";
import { useEffect, useMemo, useRef } from "react";
import { VIZ_CATEGORY_COLORS, VIZ_EDGE_COLORS } from "@/src/graph/colors";
import { filterSnapshot, matchesSearch, neighborIds } from "@/src/graph/filters";
import type { GraphLayoutMode } from "@/src/graph/layouts";
import { buildTreeElements, isSyntheticTreeId, runTreeLayout, treePathIds, TREE_STYLESHEET } from "@/src/graph/treeLayout";
import { useGraphStore } from "@/src/graph/useGraphStore";
import type { ScanGraphSnapshot } from "@/src/types/graph";

cytoscape.use(fcose);

type Props = {
  snapshot: ScanGraphSnapshot;
};

const NODE_STYLE: Css.Node = {
  "background-color": "data(color)",
  "background-opacity": 1,
  "border-width": 1,
  "border-color": "#e5e5e5",
  width: "data(size)",
  height: "data(size)",
  label: "data(label)",
  color: "#525252",
  "font-size": 10,
  "font-family": "IBM Plex Sans, ui-sans-serif, sans-serif",
  "font-weight": 400,
  "text-outline-width": 3,
  "text-outline-color": "#ffffff",
  "text-valign": "bottom",
  "text-margin-y": 6,
  "text-wrap": "wrap",
  "text-max-width": "110px",
  "overlay-opacity": 0,
  "z-index": 10,
};

const STYLESHEET: cytoscape.StylesheetStyle[] = [
  { selector: "node", style: NODE_STYLE },
  {
    selector: "node.origin",
    style: {
      "border-width": 0,
      "text-valign": "bottom",
      "text-margin-y": 8,
      "font-size": 12,
      "font-weight": 500,
      color: "#171717",
      "text-outline-width": 3,
      "text-outline-color": "#ffffff",
      "z-index": 30,
      "text-max-width": "160px",
    },
  },
  {
    selector: "node.nolabel",
    style: { label: "" },
  },
  {
    selector: "edge",
    style: {
      width: "data(width)",
      "line-color": "data(color)",
      "target-arrow-color": "data(color)",
      "target-arrow-shape": "triangle",
      "arrow-scale": 0.7,
      "curve-style": "bezier",
      "control-point-step-size": 24,
      opacity: 0.85,
      "overlay-opacity": 0,
    },
  },
  {
    selector: ".faded",
    style: { opacity: 0.12 },
  },
  {
    selector: ".highlighted",
    style: { opacity: 1, "z-index": 40 },
  },
  {
    selector: "node:selected",
    style: {
      "border-width": 2,
      "border-color": "#171717",
      "z-index": 50,
    },
  },
];

function buildElements(snapshot: ScanGraphSnapshot, nodes: ScanGraphSnapshot["nodes"], edges: ScanGraphSnapshot["edges"]): ElementDefinition[] {
  const origin = snapshot.originDomain;
  const nodeEls: ElementDefinition[] = nodes.map((node) => ({
    group: "nodes",
    data: {
      id: node.domain,
      label: node.domain,
      color: VIZ_CATEGORY_COLORS[node.category],
      size: node.isOrigin ? 36 : Math.max(16, Math.min(28, 14 + Math.log2(node.referenceCount + 1) * 4)),
      rank: node.isOrigin || node.domain === origin ? 100 : 1,
    },
    classes: node.isOrigin || node.domain === origin ? "origin" : node.category,
  }));

  const ids = new Set(nodes.map((node) => node.domain));
  const edgeEls: ElementDefinition[] = edges
    .filter((edge) => ids.has(edge.source) && ids.has(edge.target))
    .map((edge) => ({
      group: "edges",
      data: {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        color: VIZ_EDGE_COLORS[edge.type],
        width: Math.min(5, 1.15 + Math.log2(edge.count + 1)),
      },
    }));

  return [...nodeEls, ...edgeEls];
}

function runLayout(cy: Core, mode: GraphLayoutMode, origin: string): void {
  const shared = {
    animate: true,
    animationDuration: 620,
    animationEasing: "ease-out",
    fit: true,
    padding: 64,
  };

  if (mode === "tree") {
    runTreeLayout(cy);
    return;
  }

  if (mode === "force") {
    cy.layout({
      name: "fcose",
      quality: "proof",
      randomize: true,
      animate: "end",
      animationDuration: 720,
      nodeRepulsion: () => 7200,
      idealEdgeLength: () => 120,
      edgeElasticity: () => 0.45,
      gravity: 0.18,
      gravityRange: 3.8,
      packComponents: true,
      nodeSeparation: 90,
      fit: true,
      padding: 64,
    } as LayoutOptions).run();
    return;
  }

  cy.layout({
    name: "concentric",
    minNodeSpacing: 56,
    concentric: (node) => Number(node.data("rank") ?? 1),
    levelWidth: () => 1,
    startAngle: (3 * Math.PI) / 2,
    sweep: Math.PI * 2,
    equidistant: false,
    ...shared,
  } as LayoutOptions).run();
}

function applyFocus(cy: Core, selected: string | null, actives: string[], showLabels: boolean): void {
  cy.batch(() => {
    cy.elements().removeClass("faded highlighted nolabel");
    if (!showLabels) cy.nodes().addClass("nolabel");
    if (actives.length > 0) {
      const active = new Set(actives);
      cy.elements().addClass("faded");
      for (const id of actives) {
        cy.getElementById(id).removeClass("faded").addClass("highlighted");
      }
      cy.edges().forEach((edge) => {
        if (active.has(edge.source().id()) && active.has(edge.target().id())) {
          edge.removeClass("faded").addClass("highlighted");
        }
      });
    }
    cy.nodes().unselect();
    if (selected) cy.getElementById(selected).select();
  });
}

export function GraphCanvas({ snapshot }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const selectedNode = useGraphStore((state) => state.selectedNode);
  const enabledTypes = useGraphStore((state) => state.enabledTypes);
  const searchQuery = useGraphStore((state) => state.searchQuery);
  const showLabels = useGraphStore((state) => state.showLabels);
  const thirdPartyOnly = useGraphStore((state) => state.thirdPartyOnly);
  const hideCommonInfra = useGraphStore((state) => state.hideCommonInfra);
  const hideFirstParty = useGraphStore((state) => state.hideFirstParty);
  const layoutMode = useGraphStore((state) => state.layoutMode);
  const layoutNonce = useGraphStore((state) => state.layoutNonce);
  const selectNode = useGraphStore((state) => state.selectNode);

  const filtered = useMemo(
    () =>
      filterSnapshot(
        snapshot.nodes,
        snapshot.edges,
        {
          enabledTypes,
          thirdPartyOnly,
          hideCommonInfra,
          hideFirstParty,
          searchQuery,
        },
        snapshot.originDomain,
      ),
    [
      enabledTypes,
      hideCommonInfra,
      hideFirstParty,
      searchQuery,
      snapshot.edges,
      snapshot.nodes,
      snapshot.originDomain,
      thirdPartyOnly,
    ],
  );

  const elements = useMemo(
    () =>
      layoutMode === "tree"
        ? buildTreeElements(snapshot, filtered.nodes, filtered.edges)
        : buildElements(snapshot, filtered.nodes, filtered.edges),
    [filtered.edges, filtered.nodes, layoutMode, snapshot],
  );

  const actives = useMemo(() => {
    if (layoutMode === "tree" && selectedNode) {
      return treePathIds(selectedNode, snapshot, filtered.nodes);
    }
    if (selectedNode) return neighborIds(selectedNode, filtered.edges);
    const query = searchQuery.trim();
    if (!query) return [];
    return filtered.nodes.filter((node) => matchesSearch(node, query)).map((node) => node.domain);
  }, [filtered.edges, filtered.nodes, layoutMode, searchQuery, selectedNode, snapshot.originDomain]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cy = cytoscape({
      container,
      elements,
      style: layoutMode === "tree" ? TREE_STYLESHEET : STYLESHEET,
      minZoom: 0.18,
      maxZoom: 3.6,
      boxSelectionEnabled: false,
      pixelRatio: "auto",
    });
    cyRef.current = cy;
    useGraphStore.getState().setCy(cy);
    cy.on("tap", "node", (event) => {
      const id = event.target.id() as string;
      if (isSyntheticTreeId(id) || event.target.hasClass("tree-group")) return;
      selectNode(id);
    });
    cy.on("tap", (event) => {
      if (event.target === cy) selectNode(null);
    });
    runLayout(cy, layoutMode, snapshot.originDomain);
    let cancelled = false;
    requestAnimationFrame(() => {
      if (cancelled) return;
      try {
        cy.resize();
        cy.fit(undefined, 64);
      } catch {
        // Cytoscape can already be destroyed by the time this frame runs.
      }
    });

    const observer = new ResizeObserver(() => {
      if (cancelled) return;
      cy.resize();
    });
    observer.observe(container);

    return () => {
      cancelled = true;
      observer.disconnect();
      useGraphStore.getState().setCy(null);
      cy.destroy();
      cyRef.current = null;
    };
  }, [elements, layoutMode, layoutNonce, selectNode, snapshot.originDomain, snapshot.scanId]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    applyFocus(cy, selectedNode, actives, showLabels);
  }, [actives, selectedNode, showLabels]);

  return (
    <div className="relative min-h-0 w-full flex-1">
      <div ref={containerRef} className="graph-stage min-h-0 h-full w-full flex-1" />
      {filtered.nodes.length <= 1 ? (
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-8 text-center text-[13px] text-mute">
          Nothing third-party loaded into this page. Turn on Links or Site assets if you want outbound pages and first-party CDNs.
        </p>
      ) : null}
    </div>
  );
}
