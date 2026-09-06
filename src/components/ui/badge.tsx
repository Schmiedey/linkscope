import { cn } from "@/src/lib/utils";
import type { HTMLAttributes } from "react";

export function Badge({
  className,
  tone = "mute",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: "mute" | "cyan" | "amber" | "rose" | "lime" }) {
  const tones = {
    mute: "border-line text-mute",
    cyan: "border-line text-ink",
    amber: "border-amber/30 text-amber",
    rose: "border-rose/30 text-rose",
    lime: "border-lime/30 text-lime",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px]",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
