import type { ConnectionType, DomainCategory } from "@/src/types/graph";

export const CATEGORY_COLORS: Record<DomainCategory, string> = {
  origin: "#3ee0d4",
  analytics: "#e8b44c",
  advertising: "#e06c75",
  payments: "#9be15d",
  cdn: "#7aa2ff",
  hosting: "#6ec8ff",
  authentication: "#c792ea",
  social: "#ff8b6b",
  media: "#f0a0c0",
  security: "#4fd1c5",
  support: "#d4a574",
  infrastructure: "#8b9bb4",
  telemetry: "#f5a524",
  unknown: "#9aa7b5",
};

export const EDGE_COLORS: Record<ConnectionType, string> = {
  link: "#5b6b7c",
  script: "#e8b44c",
  image: "#7aa2ff",
  iframe: "#c792ea",
  stylesheet: "#6ec8ff",
  font: "#d4a574",
  media: "#f0a0c0",
  network: "#3ee0d4",
  other: "#4a5563",
};

export function nodeSize(referenceCount: number, isOrigin: boolean): number {
  if (isOrigin) return 18;
  return Math.max(4.5, Math.min(14, 4 + Math.log2(referenceCount + 1) * 2.2));
}
