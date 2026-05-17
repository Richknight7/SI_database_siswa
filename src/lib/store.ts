import { create } from 'zustand';

interface AppStore {
  isLoggedIn: boolean;
  displayName: string;
  currentPage: string;
  currentAngkatanId: number | null;
  currentAngkatanYear: number | null;
  sidebarOpen: { ang: boolean; nilai: boolean; ref: boolean };
  sidebarCollapsed: boolean;
  setLoggedIn: (v: boolean, name?: string) => void;
  setCurrentPage: (page: string, angkatanId?: number | null, angkatanYear?: number | null) => void;
  toggleSidebar: (key: string) => void;
  toggleSidebarCollapsed: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  isLoggedIn: false,
  displayName: 'Admin',
  currentPage: 'beranda',
  currentAngkatanId: null,
  currentAngkatanYear: null,
  sidebarOpen: { ang: false, nilai: false, ref: false },
  sidebarCollapsed: false,
  setLoggedIn: (v, name) =>
    set({ isLoggedIn: v, displayName: name || 'Admin' }),
  setCurrentPage: (page, angkatanId, angkatanYear) =>
    set({
      currentPage: page,
      currentAngkatanId: angkatanId ?? null,
      currentAngkatanYear: angkatanYear ?? null,
    }),
  toggleSidebar: (key) =>
    set((state) => ({
      sidebarOpen: {
        ...state.sidebarOpen,
        [key]: !state.sidebarOpen[key as keyof typeof state.sidebarOpen],
      },
    })),
  toggleSidebarCollapsed: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));
