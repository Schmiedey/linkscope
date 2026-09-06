export const GRAPH_LAYOUT_MODES = ["radial", "tree", "force"] as const;

export type GraphLayoutMode = (typeof GRAPH_LAYOUT_MODES)[number];

export const GRAPH_LAYOUT_LABELS: Record<GraphLayoutMode, string> = {
  radial: "Radial",
  tree: "Tree",
  force: "Force",
};
