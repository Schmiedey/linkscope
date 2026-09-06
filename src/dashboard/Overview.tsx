import { Link } from "react-router-dom";
import { insightLines } from "@/src/analysis/statistics";
import { formatCount, formatRelativeTime } from "@/src/lib/utils";
import { useAsync } from "@/src/lib/useAsync";
import { getOverviewStats, listRecentScans } from "@/src/storage/scans";

export function OverviewPage() {
  const now = Date.now();
  const stats = useAsync(() => getOverviewStats(), []);
  const scans = useAsync(() => listRecentScans(8), []);
  const densest = scans.data?.slice().sort((a, b) => b.nodeCount - a.nodeCount)[0]?.domain;
  const insights = insightLines(
    stats.data ?? { sites: 0, domains: 0, connections: 0, trackers: 0 },
    densest,
  );

  return (
    <div className="px-8 py-8">
      <header className="mb-10">
        <p className="text-[10px] tracking-[0.32em] text-cyan uppercase">Overview</p>
        <h1 className="font-display mt-1 text-4xl">Your map so far</h1>
      </header>
      <section className="mb-10 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Sites scanned" value={stats.data?.sites} />
        <StatCard label="Unique domains" value={stats.data?.domains} />
        <StatCard label="Connections" value={stats.data?.connections} />
        <StatCard label="Trackers" value={stats.data?.trackers} />
      </section>
      <section className="mb-10 border border-line bg-panel/60 p-5">
        <h2 className="mb-3 text-[10px] tracking-[0.22em] text-mute uppercase">Network insights</h2>
        <ul className="space-y-2">
          {insights.map((line) => (
            <li key={line} className="text-[13px] text-ink/90">
              {line}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-2xl">Recent scans</h2>
          <Link to="/scans" className="text-[10px] tracking-[0.18em] text-mute uppercase hover:text-cyan">
            All scans
          </Link>
        </div>
        {scans.data?.length ? (
          <div className="divide-y divide-line border border-line">
            {scans.data.map((scan) => (
              <Link
                key={scan.id}
                to={`/graph/${String(scan.id)}`}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-raised/80"
              >
                <div>
                  <div className="text-[14px] text-ink">{scan.domain}</div>
                  <div className="text-[11px] text-mute">{scan.title}</div>
                </div>
                <div className="text-right text-[11px] text-mute">
                  <div>
                    {formatCount(scan.nodeCount)} domains · {formatCount(scan.trackerCount)} trackers
                  </div>
                  <div>{formatRelativeTime(scan.timestamp, now)}</div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="border border-line bg-panel/70 px-4 py-4">
      <div className="text-[10px] tracking-[0.2em] text-mute uppercase">{label}</div>
      <div className="font-display mt-2 text-4xl text-cyan">{value === undefined ? "—" : formatCount(value)}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="border border-dashed border-line px-6 py-12 text-center">
      <p className="font-display text-2xl">No scans yet</p>
      <p className="mt-2 text-[13px] text-mute">
        Open any website, click the LinkScope icon, and press Scan Website.
      </p>
    </div>
  );
}
