import type { ScanProgressUpdate } from "@/src/extension/scanProgress";

export function ScanProgressBar({ progress }: { progress: ScanProgressUpdate }) {
  const percent = Math.max(0, Math.min(100, Math.round(progress.percent)));

  return (
    <div aria-live="polite">
      <div className="flex items-center justify-between gap-4 text-[12px]">
        <span className="font-medium text-ink">{progress.label}</span>
        <span className="tabular-nums text-mute">{percent}%</span>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-label={progress.label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div
          className="h-full rounded-full bg-ink transition-[width] duration-300 ease-out"
          style={{ width: `${String(percent)}%` }}
        />
      </div>
    </div>
  );
}
