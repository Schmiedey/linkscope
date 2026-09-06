import { useEffect, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { openDashboard, scanActiveTab } from "@/src/extension/scanFlow";
import { canScanUrl, explainScanBlock } from "@/src/extension/permissions";
import { registrableDomain } from "@/src/lib/domain";

export function PopupApp() {
  const [host, setHost] = useState("—");
  const [blocked, setBlocked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof browser === "undefined" || !browser.tabs?.query) {
      setBlocked("Open LinkScope from the Chrome toolbar to scan a page.");
      return;
    }
    void browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      const url = tab?.url;
      if (!url) {
        setBlocked("No active tab.");
        return;
      }
      if (!canScanUrl(url)) {
        setBlocked(explainScanBlock(url));
        setHost(url.slice(0, 40));
        return;
      }
      setHost(registrableDomain(url) ?? new URL(url).hostname);
    });
  }, []);

  const scan = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      await scanActiveTab();
      window.close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed.");
      setBusy(false);
    }
  };

  return (
    <div className="w-[320px] bg-canvas p-4 text-ink">
      <p className="text-[10px] tracking-[0.32em] text-cyan uppercase">LinkScope</p>
      <h1 className="font-display mt-3 text-3xl leading-none">{host}</h1>
      <p className="mt-3 text-[11px] leading-relaxed text-mute">
        Map every domain this page connects to, then remember it.
      </p>
      {blocked ? <p className="mt-3 text-[11px] text-amber">{blocked}</p> : null}
      {error ? <p className="mt-3 text-[11px] text-rose">{error}</p> : null}
      <div className="mt-5 flex flex-col gap-2">
        <Button disabled={busy || Boolean(blocked)} onClick={() => void scan()}>
          {busy ? "Scanning…" : "Scan website"}
        </Button>
        <Button variant="ghost" onClick={() => void openDashboard()}>
          Open dashboard
        </Button>
      </div>
    </div>
  );
}
