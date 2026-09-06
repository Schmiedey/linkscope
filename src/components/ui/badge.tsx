import { cn } from "@/src/lib/utils";
import type { HTMLAttributes } from "react";

export function Badge({
  className,
  tone = "mute",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: "mute" | "cyan" | "amber" | "rose" | "lime" }) {
  const tones = {
    mute: "border-line text-mute",
    cyan: "border-cyan/40 text-cyan",
    amber: "border-amber/40 text-amber",
    rose: "border-rose/40 text-rose",
    lime: "border-lime/40 text-lime",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono text-[10px] tracking-[0.14em] uppercase",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
