import type { ReactNode } from "react";
import { scoreTone, type PrivacyGrade } from "@/src/analysis/score";
import type { SiteNutrition } from "@/src/analysis/nutrition";
import { cn } from "@/src/lib/utils";

function Grade({ value }: { value: PrivacyGrade }) {
  const tone = scoreTone(value);
  const color =
    tone === "lime" ? "text-lime" : tone === "amber" ? "text-amber" : tone === "rose" ? "text-rose" : "text-ink";
  return <span className={cn("font-display text-[22px] leading-none", color)}>{value}</span>;
}

export function NutritionLabel({
  nutrition,
  compact = false,
}: {
  nutrition: SiteNutrition;
  compact?: boolean;
}) {
  const c = nutrition.counts;
  const rows: Array<{ label: string; value: ReactNode }> = [
    { label: "Privacy", value: <Grade value={nutrition.privacy} /> },
    { label: "Complexity", value: <Grade value={nutrition.complexity} /> },
    { label: "Third parties", value: String(c.thirdParties) },
    { label: "Trackers", value: String(c.trackers) },
    { label: "Ads", value: String(c.ads) },
    { label: "CDNs", value: String(c.cdns) },
    { label: "Unknown", value: String(c.unknown) },
  ];

  return (
    <dl className={cn("divide-y divide-line border-y border-line", compact ? "text-[12px]" : "text-[13px]")}>
      {rows.map((row) => (
        <div key={row.label} className="flex items-baseline justify-between gap-4 py-1.5">
          <dt className="text-mute">{row.label}</dt>
          <dd className="tabular-nums text-ink">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
