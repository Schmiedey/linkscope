import { create } from "zustand";
import type { Core } from "cytoscape";
import { defaultEnabledTypes } from "@/src/graph/filters";
import { GRAPH_LAYOUT_MODES, type GraphLayoutMode } from "@/src/graph/layouts";
import type { ConnectionType } from "@/src/types/graph";

type GraphUiState = {
  selectedNode: string | null;
  hoveredNode: string | null;
  enabledTypes: Record<ConnectionType, boolean>;
  searchQuery: string;
  showLabels: boolean;
  thirdPartyOnly: boolean;
  hideCommonInfra: boolean;
  hideFirstParty: boolean;
  layoutMode: GraphLayoutMode;
  layoutNonce: number;
  cy: Core | null;
  selectNode: (id: string | null) => void;
  setHovered: (id: string | null) => void;
  toggleType: (type: ConnectionType) => void;
  setSearch: (query: string) => void;
  setShowLabels: (value: boolean) => void;
  setThirdPartyOnly: (value: boolean) => void;
  setHideCommonInfra: (value: boolean) => void;
  setHideFirstParty: (value: boolean) => void;
  setLayoutMode: (mode: GraphLayoutMode) => void;
  resetFilters: () => void;
  resetLayout: () => void;
  setCy: (cy: Core | null) => void;
};

export const useGraphStore = create<GraphUiState>((set) => ({
  selectedNode: null,
  hoveredNode: null,
  enabledTypes: defaultEnabledTypes(),
  searchQuery: "",
  showLabels: true,
  thirdPartyOnly: false,
  hideCommonInfra: false,
  hideFirstParty: true,
  layoutMode: GRAPH_LAYOUT_MODES[0],
  layoutNonce: 0,
  cy: null,
  selectNode: (id) => set({ selectedNode: id }),
  setHovered: (id) => set({ hoveredNode: id }),
  toggleType: (type) =>
    set((state) => ({
      enabledTypes: { ...state.enabledTypes, [type]: !state.enabledTypes[type] },
    })),
  setSearch: (query) => set({ searchQuery: query }),
  setShowLabels: (value) => set({ showLabels: value }),
  setThirdPartyOnly: (value) => set({ thirdPartyOnly: value }),
  setHideCommonInfra: (value) => set({ hideCommonInfra: value }),
  setHideFirstParty: (value) => set({ hideFirstParty: value }),
  setLayoutMode: (mode) =>
    set((state) => ({
      layoutMode: mode,
      layoutNonce: state.layoutNonce + 1,
      selectedNode: null,
    })),
  resetFilters: () =>
    set({
      enabledTypes: defaultEnabledTypes(),
      searchQuery: "",
      thirdPartyOnly: false,
      hideCommonInfra: false,
      hideFirstParty: true,
      selectedNode: null,
    }),
  resetLayout: () => set((state) => ({ layoutNonce: state.layoutNonce + 1 })),
  setCy: (cy) => set({ cy }),
}));
