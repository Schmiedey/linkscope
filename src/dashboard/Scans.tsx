import { Link } from "react-router-dom";
import { formatCount, formatRelativeTime } from "@/src/lib/utils";
import { useAsync } from "@/src/lib/useAsync";
import { listRecentScans } from "@/src/storage/scans";

export function ScansPage() {
  const now = Date.now();
  const scans = useAsync(() => listRecentScans(200), []);

  return (
    <div className="px-8 py-8">
      <header className="mb-8">
        <p className="text-[10px] tracking-[0.32em] text-cyan uppercase">History</p>
        <h1 className="font-display mt-1 text-4xl">Scan snapshots</h1>
        <p className="mt-2 max-w-xl text-[13px] text-mute">
          Every scan is frozen in place. Reopen any graph exactly as it was captured.
        </p>
      </header>
      {scans.data?.length ? (
        <div className="overflow-hidden border border-line">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-panel text-[10px] tracking-[0.16em] text-mute uppercase">
              <tr>
                <th className="px-4 py-3 font-normal">Site</th>
                <th className="px-4 py-3 font-normal">Domains</th>
                <th className="px-4 py-3 font-normal">Trackers</th>
                <th className="px-4 py-3 font-normal">When</th>
              </tr>
            </thead>
            <tbody>
              {scans.data.map((scan) => (
                <tr key={scan.id} className="border-t border-line hover:bg-raised/70">
                  <td className="px-4 py-3">
                    <Link to={`/graph/${String(scan.id)}`} className="text-ink hover:text-cyan">
                      {scan.domain}
                    </Link>
                    <div className="max-w-md truncate text-[11px] text-mute">{scan.url}</div>
                  </td>
                  <td className="px-4 py-3">{formatCount(scan.nodeCount)}</td>
                  <td className="px-4 py-3">{formatCount(scan.trackerCount)}</td>
                  <td className="px-4 py-3 text-mute">{formatRelativeTime(scan.timestamp, now)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-mute">No snapshots yet. Scan a website from the extension popup.</p>
      )}
    </div>
  );
}
