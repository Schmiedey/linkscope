import { scoreFromScan } from "@/src/analysis/score";
import { formatCount } from "@/src/lib/utils";
import type { ScanRow } from "@/src/types/graph";

export function ScanTimeline({ scans }: { scans: ScanRow[] }) {
  const points = [...scans].sort((a, b) => a.timestamp - b.timestamp);
  if (points.length < 2) {
    return <p className="text-[13px] text-mute">Scan this site again to plot how the stack drifts.</p>;
  }

  const width = 560;
  const height = 88;
  const padX = 8;
  const padY = 10;
  const maxY = Math.max(1, ...points.map((scan) => Math.max(scan.thirdPartyCount, scan.trackerCount)));
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const coord = (index: number, value: number): string => {
    const x = padX + (points.length === 1 ? innerW / 2 : (index / (points.length - 1)) * innerW);
    const y = padY + innerH - (value / maxY) * innerH;
    return `${String(x)},${String(y)}`;
  };

  const third = points.map((scan, index) => coord(index, scan.thirdPartyCount)).join(" ");
  const trackers = points.map((scan, index) => coord(index, scan.trackerCount)).join(" ");
  const latest = points[points.length - 1];
  const first = points[0];
  if (!latest || !first) return null;
  const trackerDelta = latest.trackerCount - first.trackerCount;
  const scoreDelta = scoreFromScan(latest).score - scoreFromScan(first).score;

  return (
    <div>
      <svg viewBox={`0 0 ${String(width)} ${String(height)}`} className="w-full max-w-xl" aria-hidden>
        <polyline fill="none" stroke="#d4d4d4" strokeWidth="1.5" points={third} />
        <polyline fill="none" stroke="#b91c1c" strokeWidth="1.75" points={trackers} />
        {points.map((scan, index) => {
          const [x, y] = coord(index, scan.trackerCount).split(",");
          return <circle key={scan.id ?? index} cx={x} cy={y} r="2.4" fill="#b91c1c" />;
        })}
      </svg>
      <p className="mt-2 text-[12px] text-mute">
        <span className="text-rose">Trackers</span>
        <span className="mx-2 text-line">·</span>
        Third parties
        <span className="mx-2 text-line">·</span>
        {formatCount(points.length)} scans
        <span className="mx-2 text-line">·</span>
        Trackers {trackerDelta === 0 ? "unchanged" : trackerDelta > 0 ? `+${String(trackerDelta)}` : String(trackerDelta)}
        {scoreDelta !== 0 ? ` · score ${scoreDelta > 0 ? "+" : ""}${String(scoreDelta)}` : ""}
      </p>
    </div>
  );
}
