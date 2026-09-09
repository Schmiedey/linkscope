import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(timestamp: number, now: number): string {
  const delta = Math.max(0, now - timestamp);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (delta < minute) return "Just now";
  if (delta < hour) {
    const n = Math.floor(delta / minute);
    return `${String(n)}m ago`;
  }
  if (delta < day) {
    const n = Math.floor(delta / hour);
    return `${String(n)}h ago`;
  }
  if (delta < 7 * day) {
    const n = Math.floor(delta / day);
    return n === 1 ? "Yesterday" : `${String(n)}d ago`;
  }

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatShortDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
