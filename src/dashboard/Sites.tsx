import { Link } from "react-router-dom";
import { formatCount, formatRelativeTime } from "@/src/lib/utils";
import { useAsync } from "@/src/lib/useAsync";
import { getLatestScanForSite, listSites } from "@/src/storage/scans";
import { useEffect, useState } from "react";
import type { ScanRow, SiteRow } from "@/src/types/graph";

export function SitesPage() {
  const sites = useAsync(() => listSites(), []);
  const [latest, setLatest] = useState<Record<number, ScanRow>>({});

  useEffect(() => {
    const rows = sites.data;
    if (!rows) return;
    let cancelled = false;
    void Promise.all(
      rows.map(async (site) => {
        if (site.id === undefined) return null;
        const scan = await getLatestScanForSite(site.id);
        return scan ? ([site.id, scan] as const) : null;
      }),
    ).then((pairs) => {
      if (cancelled) return;
      const next: Record<number, ScanRow> = {};
      for (const pair of pairs) {
        if (pair) next[pair[0]] = pair[1];
      }
      setLatest(next);
    });
    return () => {
      cancelled = true;
    };
  }, [sites.data]);

  return (
    <div className="px-8 py-8">
      <header className="mb-8">
        <p className="text-[10px] tracking-[0.32em] text-cyan uppercase">Sites</p>
        <h1 className="font-display mt-1 text-4xl">Website profiles</h1>
      </header>
      <div className="grid gap-3">
        {sites.data?.map((site) => (
          <SiteCard key={site.domain} site={site} latest={site.id ? latest[site.id] : undefined} />
        ))}
        {!sites.data?.length ? <p className="text-mute">No sites stored yet.</p> : null}
      </div>
    </div>
  );
}

function SiteCard({ site, latest }: { site: SiteRow; latest: ScanRow | undefined }) {
  const now = Date.now();
  return (
    <div className="flex items-center justify-between border border-line bg-panel/50 px-4 py-4">
      <div>
        <div className="font-display text-2xl">{site.domain}</div>
        <div className="mt-1 text-[11px] text-mute">
          Scanned {formatCount(site.scanCount)} times · First {formatRelativeTime(site.firstSeen, now)} · Last{" "}
          {formatRelativeTime(site.lastSeen, now)}
        </div>
      </div>
      <div className="flex gap-2">
        {latest?.id !== undefined ? (
          <Link
            to={`/graph/${String(latest.id)}`}
            className="border border-cyan/40 px-3 py-2 text-[10px] tracking-[0.16em] text-cyan uppercase"
          >
            Latest graph
          </Link>
        ) : null}
        {site.id !== undefined ? (
          <Link
            to="/scans"
            className="border border-line px-3 py-2 text-[10px] tracking-[0.16em] text-mute uppercase hover:text-ink"
          >
            History
          </Link>
        ) : null}
      </div>
    </div>
  );
}
