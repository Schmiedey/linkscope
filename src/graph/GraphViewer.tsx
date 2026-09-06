import { useEffect } from "react";
import { Link } from "react-router-dom";
import { GraphCanvas } from "@/src/graph/GraphCanvas";
import { GraphToolbar } from "@/src/graph/GraphToolbar";
import { NodeInspector } from "@/src/graph/NodeInspector";
import { useGraphStore } from "@/src/graph/useGraphStore";
import type { ScanGraphSnapshot } from "@/src/types/graph";

export function GraphViewer({
  snapshot,
  title,
  subtitle,
  backTo = "/",
}: {
  snapshot: ScanGraphSnapshot;
  title: string;
  subtitle?: string;
  backTo?: string;
}) {
  useEffect(() => {
    useGraphStore.getState().resetFilters();
  }, [snapshot.scanId, snapshot.originDomain]);

  return (
    <div className="app-grid relative h-screen w-screen overflow-hidden bg-canvas">
      <header className="absolute top-0 right-0 left-0 z-20 flex items-center justify-between px-5 py-4">
        <div>
          <p className="text-[10px] tracking-[0.28em] text-cyan uppercase">LinkScope</p>
          <h1 className="font-display text-2xl text-ink">{title}</h1>
          {subtitle ? <p className="text-[11px] text-mute">{subtitle}</p> : null}
        </div>
        <Link
          to={backTo.replace(/^#/, "")}
          className="border border-line bg-panel/80 px-3 py-2 text-[10px] tracking-[0.18em] text-mute uppercase hover:text-cyan"
        >
          Dashboard
        </Link>
      </header>
      <GraphCanvas snapshot={snapshot} />
      <NodeInspector snapshot={snapshot} />
      <GraphToolbar snapshot={snapshot} />
    </div>
  );
}
