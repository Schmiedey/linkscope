import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { clearAllData } from "@/src/storage/scans";

export function SettingsPage() {
  const [cleared, setCleared] = useState(false);

  const clear = async (): Promise<void> => {
    const confirmed = window.confirm("Delete every saved scan, domain, and graph from this browser?");
    if (!confirmed) return;
    await clearAllData();
    setCleared(true);
  };

  return (
    <div className="max-w-2xl px-8 py-8">
      <header className="mb-8">
        <p className="text-[10px] tracking-[0.32em] text-cyan uppercase">Settings</p>
        <h1 className="font-display mt-1 text-4xl">Local observatory</h1>
      </header>
      <section className="mb-8 border border-line bg-panel/50 p-5">
        <h2 className="font-display text-2xl">Privacy</h2>
        <p className="mt-3 text-[13px] leading-relaxed text-mute">
          LinkScope scans only when you click Scan. It does not run in the background, does not request access to every
          website, and does not send data to a server. Your graph lives in this browser’s IndexedDB.
        </p>
      </section>
      <section className="border border-rose/30 bg-panel/50 p-5">
        <h2 className="font-display text-2xl">Danger zone</h2>
        <p className="mt-3 mb-4 text-[13px] text-mute">This cannot be undone. Your personal map of the web will be gone.</p>
        <Button variant="danger" onClick={() => void clear()}>
          {cleared ? "All data cleared" : "Clear all local data"}
        </Button>
      </section>
    </div>
  );
}
