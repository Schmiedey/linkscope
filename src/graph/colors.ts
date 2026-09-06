import type { ConnectionType, DomainCategory } from "@/src/types/graph";

export const CATEGORY_COLORS: Record<DomainCategory, string> = {
  origin: "#171717",
  analytics: "#78716c",
  advertising: "#57534e",
  payments: "#44403c",
  cdn: "#a8a29e",
  hosting: "#a8a29e",
  authentication: "#57534e",
  social: "#292524",
  media: "#44403c",
  security: "#1c1917",
  support: "#78716c",
  infrastructure: "#d6d3d1",
  telemetry: "#78716c",
  unknown: "#a8a29e",
};

export const VIZ_CATEGORY_COLORS: Record<DomainCategory, string> = {
  origin: "#171717",
  analytics: "#d97706",
  advertising: "#e11d48",
  payments: "#16a34a",
  cdn: "#2563eb",
  hosting: "#0284c7",
  authentication: "#9333ea",
  social: "#ea580c",
  media: "#db2777",
  security: "#0891b2",
  support: "#b45309",
  infrastructure: "#94a3b8",
  telemetry: "#f59e0b",
  unknown: "#a8a29e",
};

export const EDGE_COLORS: Record<ConnectionType, string> = {
  link: "#d4d4d4",
  script: "#a3a3a3",
  image: "#c4c4c4",
  iframe: "#a3a3a3",
  stylesheet: "#d4d4d4",
  font: "#c4c4c4",
  media: "#a3a3a3",
  network: "#737373",
  other: "#e5e5e5",
};

export const VIZ_EDGE_COLORS: Record<ConnectionType, string> = {
  link: "#64748b",
  script: "#d97706",
  image: "#3b82f6",
  iframe: "#a855f7",
  stylesheet: "#06b6d4",
  font: "#b45309",
  media: "#ec4899",
  network: "#10b981",
  other: "#94a3b8",
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const value = hex.replace("#", "");
  const normalized = value.length === 3 ? value.split("").map((ch) => ch + ch).join("") : value;
  const int = Number.parseInt(normalized, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

export function tint(hex: string, mix: number): string {
  const { r, g, b } = hexToRgb(hex);
  const blend = (channel: number) => Math.round(channel + (255 - channel) * mix);
  return `rgb(${String(blend(r))}, ${String(blend(g))}, ${String(blend(b))})`;
}

export function nodeSize(referenceCount: number, isOrigin: boolean): number {
  if (isOrigin) return 18;
  return Math.max(4.5, Math.min(14, 4 + Math.log2(referenceCount + 1) * 2.2));
}
