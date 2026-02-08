import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type RevealStore = {
  purchaserEmail: string;
  lastRevealId: string;
  questionSetKey: string;
  hydrated: boolean;
  setPurchaserEmail: (email: string) => void;
  setLastRevealId: (id: string) => void;
  setQuestionSetKey: (key: string) => void;
  setHydrated: (hydrated: boolean) => void;
};

export const useRevealStore = create<RevealStore>()(
  persist(
    (set) => ({
      purchaserEmail: "",
      lastRevealId: "",
      questionSetKey: "",
      hydrated: false,
      setPurchaserEmail: (email) => set({ purchaserEmail: email }),
      setLastRevealId: (id) => set({ lastRevealId: id }),
      setQuestionSetKey: (key) => set({ questionSetKey: key }),
      setHydrated: (hydrated) => set({ hydrated })
    }),
    {
      name: "dualreveal-store",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      }
    }
  )
);
