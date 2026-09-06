export type OverviewStats = {
  sites: number;
  domains: number;
  connections: number;
  trackers: number;
};

export function insightLines(stats: OverviewStats, densestSite?: string): string[] {
  const lines: string[] = [];
  if (stats.sites === 0) {
    return ["Scan a website to start your personal map of the web."];
  }
  if (stats.domains > 0 && stats.sites > 0) {
    const avg = Math.round(stats.domains / stats.sites);
    lines.push(`About ${String(avg)} unique domains per scanned site.`);
  }
  if (stats.trackers > 0) {
    const pct = Math.round((stats.trackers / Math.max(stats.domains, 1)) * 100);
    lines.push(`${String(stats.trackers)} tracker-like domains (${String(pct)}% of the catalog).`);
  }
  if (densestSite) {
    lines.push(`${densestSite} currently has the largest saved graph.`);
  }
  lines.push("Everything stays on this machine. Nothing is uploaded.");
  return lines;
}
