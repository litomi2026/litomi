import { create } from 'zustand';

type FireworkStore = {
  dependencyCount: number;
  increaseDependencyCount: () => void;
};

export const useFireworkStore = create<FireworkStore>()((set) => ({
  dependencyCount: 0,
  increaseDependencyCount: () => set((state) => ({ dependencyCount: state.dependencyCount + 1 })),
}));
