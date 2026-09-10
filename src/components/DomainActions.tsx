import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { blockDomain, copyBlockRule, openUBlockDashboard, uBlockFilter } from "@/src/extension/block";

export function DomainActions({
  domain,
  followed,
  onFollow,
}: {
  domain: string;
  followed?: boolean;
  onFollow?: () => void;
}) {
  const [blockNote, setBlockNote] = useState<string | null>(null);

  const block = async (): Promise<void> => {
    const result = await blockDomain(domain);
    setBlockNote(
      result === "blocked"
        ? "Blocked in this browser for this session."
        : `Copied ${uBlockFilter(domain)} — paste it into uBlock if the block prompt was declined.`,
    );
  };

  const ublock = async (): Promise<void> => {
    await copyBlockRule(domain);
    const opened = await openUBlockDashboard();
    setBlockNote(
      opened
        ? `Copied ${uBlockFilter(domain)} and opened uBlock.`
        : `Copied ${uBlockFilter(domain)}. Install uBlock Origin to paste it there.`,
    );
  };

  return (
    <div className="space-y-1.5">
      {onFollow ? (
        <Button variant={followed ? "subtle" : "ghost"} size="sm" className="w-full" onClick={onFollow}>
          {followed ? "Watching this domain" : "Watch this domain"}
        </Button>
      ) : null}
      {followed ? (
        <p className="text-[12px] text-mute">You’ll get a notification if it shows up on another site you check.</p>
      ) : null}
      <Button variant="ghost" size="sm" className="w-full" onClick={() => void block()}>
        Block this domain
      </Button>
      <Button variant="ghost" size="sm" className="w-full" onClick={() => void ublock()}>
        Copy uBlock filter
      </Button>
      {blockNote ? <p className="text-[12px] text-mute">{blockNote}</p> : null}
    </div>
  );
}
