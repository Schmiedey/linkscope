import { create } from "zustand";
import type { Core } from "cytoscape";
import { defaultEnabledTypes, type CategoryLens } from "@/src/graph/filters";
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
  categoryLens: CategoryLens;
  hiddenDomains: string[];
  newDomains: string[];
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
  setCategoryLens: (lens: CategoryLens) => void;
  hideNode: (id: string) => void;
  setNewDomains: (domains: string[]) => void;
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
  categoryLens: "all",
  hiddenDomains: [],
  newDomains: [],
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
  setCategoryLens: (lens) => set({ categoryLens: lens, selectedNode: null }),
  hideNode: (id) =>
    set((state) => ({
      hiddenDomains: state.hiddenDomains.includes(id) ? state.hiddenDomains : [...state.hiddenDomains, id],
      selectedNode: state.selectedNode === id ? null : state.selectedNode,
    })),
  setNewDomains: (domains) =>
    set((state) => {
      if (
        state.newDomains.length === domains.length &&
        state.newDomains.every((domain, index) => domain === domains[index])
      ) {
        return state;
      }
      return { newDomains: domains };
    }),
  setLayoutMode: (mode) =>
    set((state) => {
      if (state.layoutMode === mode) return state;
      return {
        layoutMode: mode,
        layoutNonce: state.layoutNonce + 1,
        selectedNode: null,
      };
    }),
  resetFilters: () =>
    set({
      enabledTypes: defaultEnabledTypes(),
      searchQuery: "",
      thirdPartyOnly: false,
      hideCommonInfra: false,
      hideFirstParty: true,
      categoryLens: "all",
      hiddenDomains: [],
      selectedNode: null,
    }),
  resetLayout: () => set((state) => ({ layoutNonce: state.layoutNonce + 1 })),
  setCy: (cy) =>
    set((state) => (state.cy === cy ? state : { cy })),
}));
