import type { GraphEdgeRecord } from "@/src/types/graph";

export function uniqueTargets(edges: GraphEdgeRecord[]): string[] {
  return Array.from(new Set(edges.map((edge) => edge.target))).sort();
}

export function edgesForDomain(edges: GraphEdgeRecord[], domain: string): GraphEdgeRecord[] {
  return edges.filter((edge) => edge.source === domain || edge.target === domain);
}
