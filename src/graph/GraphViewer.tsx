import { useEffect, useMemo, type KeyboardEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { enrichSnapshot } from "@/src/analysis/enrich";
import { exportGraphPng, exportScanCsv, exportScanJson } from "@/src/export/scanExport";
import { GraphCanvas } from "@/src/graph/GraphCanvas";
import { GraphToolbar } from "@/src/graph/GraphToolbar";
import { NodeInspector } from "@/src/graph/NodeInspector";
import { bestSearchMatch } from "@/src/graph/filters";
import type { GraphLayoutMode } from "@/src/graph/layouts";
import { useGraphStore } from "@/src/graph/useGraphStore";
import type { ScanGraphSnapshot, ScanRow } from "@/src/types/graph";

export function GraphViewer({
  snapshot,
  scan,
  title,
  subtitle,
  backTo = "/",
  defaultLayout = "radial",
  extras,
}: {
  snapshot: ScanGraphSnapshot;
  scan?: ScanRow;
  title: string;
  subtitle?: string;
  backTo?: string;
  defaultLayout?: GraphLayoutMode;
  extras?: ReactNode;
}) {
  const searchQuery = useGraphStore((state) => state.searchQuery);
  const setSearch = useGraphStore((state) => state.setSearch);
  const selectNode = useGraphStore((state) => state.selectNode);

  const graph = useMemo(() => enrichSnapshot(snapshot), [snapshot]);

  useEffect(() => {
    const store = useGraphStore.getState();
    store.resetFilters();
    store.setLayoutMode(defaultLayout);
  }, [defaultLayout, snapshot.originDomain, snapshot.scanId]);

  const onSearchKey = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key !== "Enter") return;
    const match = bestSearchMatch(graph.nodes, searchQuery);
    if (match) selectNode(match.domain);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <header className="z-20 flex shrink-0 flex-wrap items-center gap-4 border-b border-line px-6 py-3">
        <div className="min-w-0 flex-1">
          <h1 className="font-display truncate text-[22px] leading-none text-ink">{title}</h1>
          {subtitle ? <p className="mt-1 text-[12px] text-mute">{subtitle}</p> : null}
        </div>
        <label className="flex min-w-[200px] flex-1 items-center md:max-w-xs">
          <span className="sr-only">Search domains</span>
          <input
            value={searchQuery}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={onSearchKey}
            placeholder="Search"
            className="h-8 w-full rounded-md border border-line bg-canvas px-3 text-[13px] text-ink outline-none placeholder:text-mute/80 focus:border-ink/40"
          />
        </label>
        <div className="flex items-center gap-3 text-[13px]">
          <button
            type="button"
            className="text-mute hover:text-ink"
            onClick={() => exportScanJson(scan, graph)}
          >
            JSON
          </button>
          <button type="button" className="text-mute hover:text-ink" onClick={() => exportScanCsv(graph)}>
            CSV
          </button>
          <button
            type="button"
            className="text-mute hover:text-ink"
            onClick={() => exportGraphPng(useGraphStore.getState().cy, graph.originDomain)}
          >
            PNG
          </button>
          <Link to={backTo.replace(/^#/, "")} className="text-mute hover:text-ink">
            Dashboard
          </Link>
        </div>
      </header>
      <div className="flex min-h-0 min-w-0 flex-1">
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-canvas">
          <GraphCanvas snapshot={graph} />
        </div>
        <NodeInspector snapshot={graph} />
      </div>
      <GraphToolbar extras={extras} />
    </div>
  );
}
