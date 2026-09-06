import { RotateCcw, Tag } from "lucide-react";
import type { KeyboardEvent } from "react";
import { Button } from "@/src/components/ui/button";
import { useGraphStore } from "@/src/graph/useGraphStore";
import { CONNECTION_TYPES, CONNECTION_TYPE_LABELS, type ConnectionType, type ScanGraphSnapshot } from "@/src/types/graph";
import { cn } from "@/src/lib/utils";

const FILTER_TYPES: ConnectionType[] = [
  "link",
  "script",
  "image",
  "iframe",
  "stylesheet",
  "font",
  "network",
];

export function GraphToolbar({ snapshot }: { snapshot: ScanGraphSnapshot }) {
  const enabledTypes = useGraphStore((state) => state.enabledTypes);
  const toggleType = useGraphStore((state) => state.toggleType);
  const searchQuery = useGraphStore((state) => state.searchQuery);
  const setSearch = useGraphStore((state) => state.setSearch);
  const selectNode = useGraphStore((state) => state.selectNode);
  const showLabels = useGraphStore((state) => state.showLabels);
  const setShowLabels = useGraphStore((state) => state.setShowLabels);
  const thirdPartyOnly = useGraphStore((state) => state.thirdPartyOnly);
  const setThirdPartyOnly = useGraphStore((state) => state.setThirdPartyOnly);
  const hideCommonInfra = useGraphStore((state) => state.hideCommonInfra);
  const setHideCommonInfra = useGraphStore((state) => state.setHideCommonInfra);
  const resetLayout = useGraphStore((state) => state.resetLayout);
  const resetFilters = useGraphStore((state) => state.resetFilters);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-4">
      <div className="pointer-events-auto mx-auto flex max-w-6xl flex-col gap-3 rounded-sm border border-line/80 bg-panel/90 px-4 py-3 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2">
          {FILTER_TYPES.map((type) => {
            const on = enabledTypes[type];
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleType(type)}
                className={cn(
                  "rounded-sm border px-2 py-1 font-mono text-[10px] tracking-[0.16em] uppercase",
                  on ? "border-cyan/50 text-cyan" : "border-line text-mute",
                )}
              >
                {CONNECTION_TYPE_LABELS[type]} {on ? "✓" : "○"}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={searchQuery}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
              if (event.key !== "Enter") return;
              const query = searchQuery.trim().toLowerCase();
              if (!query) return;
              const match = snapshot.nodes.find(
                (node) => node.domain.includes(query) || node.hostnames.some((host) => host.includes(query)),
              );
              if (match) selectNode(match.domain);
            }}
            placeholder="Search domains"
            className="h-8 min-w-[180px] flex-1 border border-line bg-canvas px-3 text-[12px] text-ink outline-none placeholder:text-mute/70 focus:border-cyan/50"
          />
          <Button variant="ghost" size="sm" onClick={() => setShowLabels(!showLabels)}>
            <Tag className="h-3 w-3" />
            {showLabels ? "Labels" : "No labels"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setThirdPartyOnly(!thirdPartyOnly)}>
            {thirdPartyOnly ? "Trackers only" : "All categories"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setHideCommonInfra(!hideCommonInfra)}>
            {hideCommonInfra ? "Infra hidden" : "Hide infra"}
          </Button>
          <Button variant="subtle" size="sm" onClick={resetLayout}>
            <RotateCcw className="h-3 w-3" />
            Reset layout
          </Button>
          <Button variant="subtle" size="sm" onClick={resetFilters}>
            Reset filters
          </Button>
          <span className="hidden text-[10px] tracking-[0.16em] text-mute uppercase sm:inline">
            {CONNECTION_TYPES.length} relation types
          </span>
        </div>
      </div>
    </div>
  );
}
