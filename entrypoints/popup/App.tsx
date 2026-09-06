import { useEffect, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { PrivacyScoreMark } from "@/src/components/PrivacyScoreMark";
import { scoreFromScan } from "@/src/analysis/score";
import { getScanTarget, openDashboard } from "@/src/extension/scanFlow";
import { registrableDomain } from "@/src/lib/domain";
import { getLatestScanForSite, getSiteByDomain } from "@/src/storage/scans";
import type { ScanRow } from "@/src/types/graph";

export function PopupApp() {
  const [host, setHost] = useState("—");
  const [blocked, setBlocked] = useState<string | null>(null);
  const [busy, setBusy] = useState<"scan" | "watch" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [latest, setLatest] = useState<ScanRow | null>(null);

  useEffect(() => {
    if (typeof browser === "undefined" || !browser.tabs?.query) {
      setBlocked("Open LinkScope from the Chrome toolbar to scan a page.");
      return;
    }
    void getScanTarget().then(async (target) => {
      if (!target) {
        setBlocked("Open a regular website, then scan it.");
        return;
      }
      setBlocked(null);
      const domain = registrableDomain(target.url) ?? new URL(target.url).hostname;
      setHost(domain);
      const site = await getSiteByDomain(domain);
      if (site?.id === undefined) {
        setLatest(null);
        return;
      }
      const scan = await getLatestScanForSite(site.id);
      setLatest(scan ?? null);
    });
  }, []);

  const run = async (type: "SCAN_ACTIVE_TAB" | "WATCH_ACTIVE_TAB"): Promise<void> => {
    setBusy(type === "WATCH_ACTIVE_TAB" ? "watch" : "scan");
    setError(null);
    try {
      const result = (await browser.runtime.sendMessage({ type })) as { ok?: boolean; error?: string };
      if (!result?.ok) {
        throw new Error(result?.error ?? "Scan failed.");
      }
      window.close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed.");
      setBusy(null);
    }
  };

  const mark = latest ? scoreFromScan(latest) : null;

  return (
    <div className="flex w-[320px] flex-col bg-canvas p-4 pb-5 text-ink">
      <p className="text-[12px] text-mute">LinkScope</p>
      <h1 className="font-display mt-2 break-all text-[28px] leading-tight">{host}</h1>
      {mark ? (
        <div className="mt-2 flex items-baseline justify-between gap-3">
          <PrivacyScoreMark compact score={mark.score} grade={mark.grade} />
          <p className="text-[12px] text-mute">
            Last scan · {latest?.trackerCount ?? 0} tracker{(latest?.trackerCount ?? 0) === 1 ? "" : "s"}
          </p>
        </div>
      ) : (
        <p className="mt-2 text-[13px] leading-relaxed text-mute">
          Snapshot the page now, or watch fifteen seconds so delayed pixels can load.
        </p>
      )}
      {blocked ? <p className="mt-3 text-[12px] text-amber">{blocked}</p> : null}
      {error ? <p className="mt-3 text-[12px] text-rose">{error}</p> : null}
      <div className="mt-5 flex flex-col gap-2">
        <Button className="w-full" disabled={busy !== null || Boolean(blocked)} onClick={() => void run("SCAN_ACTIVE_TAB")}>
          {busy === "scan" ? "Scanning…" : "Scan now"}
        </Button>
        <Button
          className="w-full"
          variant="ghost"
          disabled={busy !== null || Boolean(blocked)}
          onClick={() => void run("WATCH_ACTIVE_TAB")}
        >
          {busy === "watch" ? "Starting watch…" : "Watch 15 seconds"}
        </Button>
        <Button className="w-full" variant="ghost" onClick={() => void openDashboard()}>
          Open dashboard
        </Button>
      </div>
    </div>
  );
}
