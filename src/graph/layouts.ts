import type Graph from "graphology";
import circular from "graphology-layout/circular";
import forceAtlas2 from "graphology-layout-forceatlas2";

export function layoutGraph(graph: Graph): void {
  if (graph.order <= 1) {
    graph.forEachNode((node) => {
      graph.setNodeAttribute(node, "x", 0);
      graph.setNodeAttribute(node, "y", 0);
    });
    return;
  }

  circular.assign(graph);
  forceAtlas2.assign(graph, {
    iterations: Math.min(140, 50 + graph.order),
    settings: {
      ...forceAtlas2.inferSettings(graph),
      gravity: 1.1,
      scalingRatio: 8,
      strongGravityMode: true,
    },
  });
}
