import { cn } from "@/src/lib/utils";
import type { InputHTMLAttributes } from "react";

export function SearchInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="search"
      className={cn(
        "h-8 w-full max-w-xs rounded-md border border-line bg-canvas px-3 text-[13px] text-ink outline-none placeholder:text-mute/80 focus:border-ink/40",
        className,
      )}
      {...props}
    />
  );
}

export function FilterChip({
  on,
  children,
  onClick,
}: {
  on: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-2 py-1 text-[12px]",
        on ? "bg-raised text-ink" : "text-mute hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
