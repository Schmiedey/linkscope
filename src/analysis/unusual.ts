import type { NutritionCounts, SiteNutrition } from "@/src/analysis/nutrition";
import type { DomainRow, GraphNodeRecord, ScanGraphSnapshot } from "@/src/types/graph";

export type SiteConclusion = {
  unusual: boolean;
  headline: string;
  detail: string;
  mixLabels: string[];
  newToYou: GraphNodeRecord[];
};

function mixLabels(counts: NutritionCounts): string[] {
  const labels: string[] = [];
  if (counts.cdns > 0) labels.push("CDNs");
  if (counts.analytics > 0) labels.push("Analytics");
  if (counts.ads > 0) labels.push("Ads");
  if (counts.media > 0) labels.push("Embedded media");
  if (counts.social > 0) labels.push("Social");
  if (counts.unknown > 0) labels.push("Unknown");
  return labels.slice(0, 4);
}

export function concludeSite(input: {
  nutrition: SiteNutrition;
  snapshot?: ScanGraphSnapshot;
  domainRows?: DomainRow[];
}): SiteConclusion {
  const counts = input.nutrition.counts;
  const third = input.snapshot?.nodes.filter((node) => !node.isOrigin && !node.isFirstParty) ?? [];
  const byDomain = new Map((input.domainRows ?? []).map((row) => [row.domain, row] as const));
  const newToYou = third.filter((node) => {
    const row = byDomain.get(node.domain);
    return !row || row.seenOnCount <= 1;
  });

  const unusual =
    counts.trackers >= 8 ||
    counts.ads >= 6 ||
    counts.thirdParties >= 35 ||
    counts.unknown >= 3 ||
    newToYou.length >= 4;

  let detail = `${String(counts.thirdParties)} third-party ${counts.thirdParties === 1 ? "domain" : "domains"}`;
  if (counts.trackers > 0) {
    detail += ` · ${String(counts.trackers)} advertising/tracking`;
  }
  const fresh = newToYou[0];
  if (fresh && newToYou.length === 1) {
    detail += ` · 1 domain you haven't seen before: ${fresh.domain}`;
  } else if (newToYou.length > 1) {
    detail += ` · ${String(newToYou.length)} domains first seen here`;
  }

  return {
    unusual,
    headline: unusual ? "This site stands out." : "Nothing unusual found.",
    detail,
    mixLabels: mixLabels(counts),
    newToYou: newToYou.slice(0, 8),
  };
}

export function mixSentence(labels: string[]): string {
  const first = labels[0];
  const second = labels[1];
  if (!first) return "Mostly first-party resources.";
  if (labels.length === 1) return `Mostly ${first.toLowerCase()}.`;
  if (labels.length === 2 && second) return `Mostly ${first.toLowerCase()} and ${second.toLowerCase()}.`;
  const last = labels[labels.length - 1] ?? "";
  return `Mostly ${labels
    .slice(0, -1)
    .map((item) => item.toLowerCase())
    .join(", ")}, and ${last.toLowerCase()}.`;
}
