import { scoreTone, type PrivacyGrade } from "@/src/analysis/score";
import { cn } from "@/src/lib/utils";

export function PrivacyScoreMark({
  score,
  grade,
  compact = false,
  className,
}: {
  score: number;
  grade: PrivacyGrade;
  compact?: boolean;
  className?: string;
}) {
  const tone = scoreTone(grade);
  const color =
    tone === "lime" ? "text-lime" : tone === "amber" ? "text-amber" : tone === "rose" ? "text-rose" : "text-ink";

  if (compact) {
    return (
      <span className={cn("tabular-nums", color, className)}>
        {grade}
        <span className="text-mute"> {String(score)}</span>
      </span>
    );
  }

  return (
    <div className={className}>
      <div className={cn("font-display text-5xl leading-none tabular-nums", color)}>{score}</div>
      <p className="mt-1 text-[13px] text-mute">Grade {grade} · 100 is cleanest</p>
    </div>
  );
}
