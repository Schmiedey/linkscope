import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { groupSnapshotByOwner, mergeOwnerGroups } from "@/src/analysis/owners";
import { scoreFromScan } from "@/src/analysis/score";
import { insightLines } from "@/src/analysis/statistics";
import { OwnerGroups } from "@/src/components/OwnerGroups";
import { PrivacyScoreMark } from "@/src/components/PrivacyScoreMark";
import { Button } from "@/src/components/ui/button";
import { formatCount, formatRelativeTime } from "@/src/lib/utils";
import { useAsync } from "@/src/lib/useAsync";
import { listRecentAlerts } from "@/src/storage/alerts";
import { getOverviewStats, listLatestGraphs, listRecentScans, listSites } from "@/src/storage/scans";
import { LIVE_SCAN_DOMAINS, seedLiveTen, seedSampleSite } from "@/src/storage/seed";

export function OverviewPage() {
  const now = Date.now();
  const stats = useAsync(() => getOverviewStats(), []);
  const scans = useAsync(() => listRecentScans(12), []);
  const alerts = useAsync(() => listRecentAlerts(8), []);
  const owners = useAsync(async () => {
    const graphs = await listLatestGraphs();
    return mergeOwnerGroups(graphs.map(groupSnapshotByOwner)).filter((group) => !group.unlisted).slice(0, 8);
  }, []);
  const densest = scans.data?.slice().sort((a, b) => b.trackerCount - a.trackerCount || b.nodeCount - a.nodeCount)[0];
  const insights = insightLines(
    stats.data ?? { sites: 0, domains: 0, connections: 0, trackers: 0 },
    densest?.domain,
    densest?.trackerCount,
  );

  useEffect(() => {
    if (scans.loading || scans.data === undefined) return;
    if (location.hostname !== "localhost") {
      if (scans.data.length > 0) return;
      if (sessionStorage.getItem("linkscope-sample-seeded") === "1") return;
      sessionStorage.setItem("linkscope-sample-seeded", "1");
      void seedSampleSite().then(() => {
        stats.reload();
        scans.reload();
        owners.reload();
      });
      return;
    }
    if (sessionStorage.getItem("linkscope-live-ten") === "1") return;
    void (async () => {
      const sites = await listSites();
      const domains = new Set(sites.map((site) => site.domain));
      if (LIVE_SCAN_DOMAINS.every((domain) => domains.has(domain))) {
        sessionStorage.setItem("linkscope-live-ten", "1");
        return;
      }
      sessionStorage.setItem("linkscope-live-ten", "1");
      try {
        await seedLiveTen();
        stats.reload();
        scans.reload();
        owners.reload();
      } catch {
        sessionStorage.removeItem("linkscope-live-ten");
      }
    })();
  }, [scans.data, scans.loading, scans, stats, owners]);

  return (
    <div className="px-10 py-10">
      <header className="mb-10">
        <h1 className="font-display text-4xl">Your map so far</h1>
      </header>
      <section className="mb-10 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line xl:grid-cols-4">
        <StatCard label="Sites" value={stats.data?.sites} />
        <StatCard label="Domains" value={stats.data?.domains} />
        <StatCard label="Connections" value={stats.data?.connections} />
        <StatCard label="Third-party trackers" value={stats.data?.trackers} />
      </section>
      {alerts.data?.length ? (
        <section className="mb-10">
          <h2 className="mb-3 text-[13px] text-mute">Changes</h2>
          <ul className="divide-y divide-line border-y border-line">
            {alerts.data.map((alert) => (
              <li key={alert.id ?? `${alert.siteDomain}-${String(alert.timestamp)}`}>
                <Link
                  to={`/diff/${String(alert.fromScanId)}/${String(alert.toScanId)}`}
                  className="flex items-baseline justify-between gap-4 py-3 hover:bg-raised/80"
                >
                  <div>
                    <div className="text-[14px] text-ink">{alert.siteDomain}</div>
                    <div className="text-[12px] text-mute">
                      {alert.addedTrackers.length > 0
                        ? `${formatCount(alert.addedTrackers.length)} new tracker${alert.addedTrackers.length === 1 ? "" : "s"}: ${alert.addedTrackers.slice(0, 3).join(", ")}`
                        : `Trackers ${alert.trackerDelta > 0 ? "+" : ""}${String(alert.trackerDelta)}`}
                    </div>
                  </div>
                  <span className="shrink-0 text-[12px] text-mute">{formatRelativeTime(alert.timestamp, now)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <section className="mb-10">
        <h2 className="mb-3 text-[13px] text-mute">Notes</h2>
        <ul className="space-y-1.5">
          {insights.map((line) => (
            <li key={line} className="text-[14px] text-ink">
              {line}
            </li>
          ))}
        </ul>
      </section>
      {owners.data?.length ? (
        <section className="mb-10 max-w-2xl">
          <h2 className="font-display mb-3 text-2xl">Companies across your scans</h2>
          <OwnerGroups groups={owners.data} empty="Scan a few sites to see which companies show up repeatedly." />
        </section>
      ) : null}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-2xl">Recent scans</h2>
          <Link to="/scans" className="text-[13px] text-mute hover:text-ink">
            All scans
          </Link>
        </div>
        {scans.data?.length ? (
          <div className="divide-y divide-line border-y border-line">
            {scans.data.map((scan) => {
              const mark = scoreFromScan(scan);
              return (
                <Link
                  key={scan.id}
                  to={`/graph/${String(scan.id)}`}
                  className="flex items-center justify-between gap-4 py-3 hover:bg-raised/80"
                >
                  <div>
                    <div className="text-[14px] text-ink">{scan.domain}</div>
                    <div className="text-[12px] text-mute">{scan.title}</div>
                  </div>
                  <div className="text-right text-[12px] text-mute">
                    <PrivacyScoreMark compact score={mark.score} grade={mark.grade} />
                    <div className="mt-0.5">
                      {formatCount(scan.thirdPartyCount)} third parties · {formatCount(scan.trackerCount)} tracker
                      {scan.trackerCount === 1 ? "" : "s"}
                    </div>
                    <div>{formatRelativeTime(scan.timestamp, now)}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState
            onSeed={() => {
              void seedSampleSite().then(() => {
                stats.reload();
                scans.reload();
                owners.reload();
              });
            }}
          />
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="bg-canvas px-4 py-4">
      <div className="text-[12px] text-mute">{label}</div>
      <div className="font-display mt-1 text-3xl text-ink">{value === undefined ? "—" : formatCount(value)}</div>
    </div>
  );
}

function EmptyState({ onSeed }: { onSeed: () => void }) {
  const [busy, setBusy] = useState(false);

  const loadSample = (): void => {
    setBusy(true);
    onSeed();
    window.setTimeout(() => setBusy(false), 600);
  };

  return (
    <div className="py-10">
      <p className="font-display text-2xl">No scans yet</p>
      <p className="mt-2 text-[13px] text-mute">Open any website, click the LinkScope icon, and press Scan website.</p>
      <Button className="mt-5" disabled={busy} onClick={loadSample}>
        {busy ? "Saving…" : "Load sample site"}
      </Button>
    </div>
  );
}
