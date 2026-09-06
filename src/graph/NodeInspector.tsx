import { Copy, ExternalLink, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { CATEGORY_COLORS } from "@/src/graph/colors";
import { useGraphStore } from "@/src/graph/useGraphStore";
import { CATEGORY_LABELS, CONNECTION_TYPE_LABELS, type ScanGraphSnapshot } from "@/src/types/graph";

export function NodeInspector({ snapshot }: { snapshot: ScanGraphSnapshot }) {
  const selectedNode = useGraphStore((state) => state.selectedNode);
  const selectNode = useGraphStore((state) => state.selectNode);
  const [copied, setCopied] = useState(false);

  const node = snapshot.nodes.find((item) => item.domain === selectedNode);
  const edges = useMemo(() => {
    if (!selectedNode) return [];
    return snapshot.edges.filter((edge) => edge.source === selectedNode || edge.target === selectedNode);
  }, [selectedNode, snapshot.edges]);

  if (!selectedNode || !node) return null;

  const relationship = node.isOrigin
    ? "Current website"
    : edges[0]
      ? `Third-party ${CONNECTION_TYPE_LABELS[edges[0].type].toLowerCase()}`
      : "Connected domain";

  const evidence = edges.flatMap((edge) => edge.evidence).slice(0, 12);

  const copy = async (): Promise<void> => {
    await navigator.clipboard.writeText(node.domain);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <aside className="absolute top-16 right-4 bottom-36 z-20 flex w-[340px] max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-sm border border-line bg-panel/95 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-md">
      <div className="flex items-start justify-between border-b border-line px-4 py-3">
        <div>
          <p className="font-display text-xl leading-none text-ink">{node.domain}</p>
          <div className="mt-2 flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: CATEGORY_COLORS[node.category] }}
            />
            <span className="text-[10px] tracking-[0.18em] text-mute uppercase">
              {CATEGORY_LABELS[node.category]}
            </span>
          </div>
        </div>
        <button type="button" onClick={() => selectNode(null)} className="text-mute hover:text-ink">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 space-y-5 overflow-auto px-4 py-4">
        <div className="grid grid-cols-2 gap-3 text-[11px]">
          <Stat label="Seen" value={`${String(node.referenceCount)} refs`} />
          <Stat label="Relationship" value={relationship} />
          <Stat label="Found on" value={snapshot.originDomain === "global" ? "Multiple sites" : snapshot.originDomain} />
          <Stat label="Security" value="No known issues" />
        </div>
        <section>
          <h3 className="mb-2 text-[10px] tracking-[0.2em] text-mute uppercase">Hostnames</h3>
          <ul className="space-y-1">
            {node.hostnames.map((host) => (
              <li key={host} className="truncate text-[12px] text-ink">
                {host}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="mb-2 text-[10px] tracking-[0.2em] text-mute uppercase">Why is this here?</h3>
          <div className="space-y-3">
            {evidence.length === 0 ? (
              <p className="text-[12px] text-mute">No evidence snippets stored for this node.</p>
            ) : (
              evidence.map((item, index) => (
                <div key={`${item.url}-${String(index)}`} className="border border-line bg-canvas/70 p-2">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <Badge tone="cyan">{CONNECTION_TYPE_LABELS[item.type]}</Badge>
                  </div>
                  {item.context ? <p className="mb-1 text-[11px] text-amber">{item.context}</p> : null}
                  <p className="mb-2 break-all text-[10px] text-mute">{item.url}</p>
                  <pre className="overflow-x-auto text-[10px] leading-relaxed whitespace-pre-wrap text-cyan/80">
                    {item.snippet}
                  </pre>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
      <div className="flex gap-2 border-t border-line p-3">
        <Button variant="ghost" size="sm" className="flex-1" onClick={() => void copy()}>
          <Copy className="h-3 w-3" />
          {copied ? "Copied" : "Copy domain"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1"
          onClick={() => window.open(`https://${node.domain}`, "_blank", "noopener,noreferrer")}
        >
          <ExternalLink className="h-3 w-3" />
          Open
        </Button>
      </div>
    </aside>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line/80 bg-canvas/40 px-2 py-2">
      <div className="text-[9px] tracking-[0.18em] text-mute uppercase">{label}</div>
      <div className="mt-1 text-[11px] text-ink">{value}</div>
    </div>
  );
}
