import { create } from "zustand";
import { CONNECTION_TYPES, type ConnectionType } from "@/src/types/graph";

const allEnabled = (): Record<ConnectionType, boolean> => {
  const enabled = {} as Record<ConnectionType, boolean>;
  for (const type of CONNECTION_TYPES) {
    enabled[type] = true;
  }
  return enabled;
};

type GraphUiState = {
  selectedNode: string | null;
  hoveredNode: string | null;
  enabledTypes: Record<ConnectionType, boolean>;
  searchQuery: string;
  showLabels: boolean;
  thirdPartyOnly: boolean;
  hideCommonInfra: boolean;
  layoutNonce: number;
  selectNode: (id: string | null) => void;
  setHovered: (id: string | null) => void;
  toggleType: (type: ConnectionType) => void;
  setSearch: (query: string) => void;
  setShowLabels: (value: boolean) => void;
  setThirdPartyOnly: (value: boolean) => void;
  setHideCommonInfra: (value: boolean) => void;
  resetFilters: () => void;
  resetLayout: () => void;
};

export const useGraphStore = create<GraphUiState>((set) => ({
  selectedNode: null,
  hoveredNode: null,
  enabledTypes: allEnabled(),
  searchQuery: "",
  showLabels: true,
  thirdPartyOnly: false,
  hideCommonInfra: false,
  layoutNonce: 0,
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
  resetFilters: () =>
    set({
      enabledTypes: allEnabled(),
      searchQuery: "",
      thirdPartyOnly: false,
      hideCommonInfra: false,
      selectedNode: null,
    }),
  resetLayout: () => set((state) => ({ layoutNonce: state.layoutNonce + 1 })),
}));
