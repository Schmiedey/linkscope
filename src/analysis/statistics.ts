export type OverviewStats = {
  sites: number;
  domains: number;
  connections: number;
  trackers: number;
};

export function insightLines(
  stats: OverviewStats,
  densestSite?: string,
  densestTrackers?: number,
): string[] {
  const lines: string[] = [];
  if (stats.sites === 0) {
    return ["Scan a website to start mapping what pages load besides themselves."];
  }
  if (stats.trackers === 0) {
    lines.push("No third-party trackers classified yet. Footer links and first-party CDNs are hidden by default.");
  } else {
    const pct = Math.round((stats.trackers / Math.max(stats.domains, 1)) * 100);
    lines.push(`${String(stats.trackers)} tracker domains across your scans (${String(pct)}% of the catalog).`);
  }
  if (densestSite && densestTrackers !== undefined) {
    lines.push(
      densestTrackers > 0
        ? `${densestSite} has the most classified trackers (${String(densestTrackers)}).`
        : `${densestSite} has the largest graph, but no classified trackers.`,
    );
  }
  lines.push("Scans stay in this browser. Nothing is uploaded.");
  return lines;
}
